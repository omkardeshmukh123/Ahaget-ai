// ─── MCP (Model Context Protocol) client ─────────────────────────────────────
// Fetches tool lists from configured MCP servers and proxies tool calls back.
// Tool lists are cached per connector for 5 minutes — avoids a network round-
// trip on every agent call while staying reasonably fresh.
//
// JSON-RPC 2.0 over HTTP (stateless transport, no SSE session required):
//   tools/list  → returns available tools with their input schemas
//   tools/call  → executes a tool and returns content[]

import OpenAI from 'openai';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { assertPublicUrl } from '../lib/ipGuard';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

interface ConnectorRow {
  id: string;
  name: string;
  serverUrl: string;
  authType: string;
  authValue: string | null;
  allowedTools: string[];  // empty = all tools permitted
  readOnly: boolean;       // true = block write-verb tool calls
}

export interface ConnectorToolBundle {
  connector: ConnectorRow;
  tools: McpTool[];
  // Lookup: openai tool name → original MCP tool name
  nameMap: Map<string, string>;
}

// ─── In-memory cache ──────────────────────────────────────────────────────────
const toolListCache = new Map<string, { tools: McpTool[]; fetchedAt: number }>();
const CACHE_TTL_MS  = 5 * 60 * 1000; // 5 minutes per-connector tool list

// Connector list cache — avoids a DB hit on every agent turn (60s TTL)
const connectorListCache = new Map<string, { connectors: ConnectorRow[]; fetchedAt: number }>();
const CONNECTOR_CACHE_TTL_MS = 60_000;

// REST endpoint + auth cache (60s TTL)
const restContextCache = new Map<string, { ctx: RestConnectorContext; fetchedAt: number }>();

// Cache for goal-mode opt-in check (60s TTL, same as connector list)
const goalModeCache = new Map<string, { allowed: boolean; fetchedAt: number }>();

export async function isCallApiAllowedInGoalMode(orgId: string): Promise<boolean> {
  const cached = goalModeCache.get(orgId);
  if (cached && Date.now() - cached.fetchedAt < CONNECTOR_CACHE_TTL_MS) return cached.allowed;

  const connector = await prisma.mcpConnector.findFirst({
    where: { organizationId: orgId, connectorType: 'rest', enabled: true, allowInGoalMode: true },
    select: { id: true },
  }).catch(() => null);

  const allowed = connector !== null;
  goalModeCache.set(orgId, { allowed, fetchedAt: Date.now() });
  return allowed;
}

// ─── REST connector types ─────────────────────────────────────────────────────

interface RestEndpointRow {
  method: string;
  urlPattern: string;
  readOnly: boolean;
}

export interface RestConnectorContext {
  authType: string;
  authValue: string | null;
  readOnly: boolean;
  endpoints: RestEndpointRow[];
}

/**
 * Load the first enabled REST connector for an org plus its allowed endpoints.
 * Returns null if no REST connector is configured.
 * Result is cached for 60 s.
 */
export async function loadRestContext(orgId: string): Promise<RestConnectorContext | null> {
  const cached = restContextCache.get(orgId);
  if (cached && Date.now() - cached.fetchedAt < CONNECTOR_CACHE_TTL_MS) return cached.ctx;

  const connector = await prisma.mcpConnector.findFirst({
    where: { organizationId: orgId, connectorType: 'rest', enabled: true },
    select: { authType: true, authValue: true, readOnly: true },
  });

  const endpoints = await prisma.restApiEndpoint.findMany({
    where: { connector: { organizationId: orgId, enabled: true, connectorType: 'rest' } },
    select: { method: true, urlPattern: true, readOnly: true },
  });

  const ctx: RestConnectorContext = {
    authType:  connector?.authType  ?? 'none',
    authValue: connector?.authValue ?? null,
    readOnly:  connector?.readOnly  ?? false,
    endpoints,
  };

  restContextCache.set(orgId, { ctx, fetchedAt: Date.now() });
  return ctx;
}

/**
 * Validate a proposed call_api request against the operator's endpoint allowlist.
 * If the org has no endpoint rows, all public URLs are permitted (backward-compat).
 */
export function matchesRestEndpoint(
  url: string,
  method: string,
  ctx: RestConnectorContext,
): { allowed: boolean; reason?: string } {
  if (ctx.endpoints.length === 0) return { allowed: true };

  const urlLc = url.toLowerCase();
  const matching = ctx.endpoints.filter((ep) => urlLc.startsWith(ep.urlPattern.toLowerCase()));
  if (matching.length === 0) return { allowed: false, reason: 'URL not in approved endpoint list' };

  const m = method.toUpperCase();
  const methodMatch = matching.find((ep) => ep.method === m || ep.method === 'GET');
  if (!methodMatch) return { allowed: false, reason: `Method ${m} not permitted for this endpoint` };

  if ((methodMatch.readOnly || ctx.readOnly) && m !== 'GET') {
    return { allowed: false, reason: 'Endpoint is read-only; only GET is permitted' };
  }

  return { allowed: true };
}

// ─── Auth headers ─────────────────────────────────────────────────────────────
function authHeaders(authType: string, authValue: string | null): Record<string, string> {
  if (authType === 'bearer' && authValue) return { Authorization: `Bearer ${authValue}` };
  if (authType === 'api_key' && authValue)  return { 'X-API-Key': authValue };
  return {};
}

// ─── JSON-RPC helper ──────────────────────────────────────────────────────────
async function rpc<T>(
  serverUrl: string,
  auth: { type: string; value: string | null },
  method: string,
  params: Record<string, unknown>,
  timeoutMs: number,
): Promise<T | null> {
  try {
    await assertPublicUrl(serverUrl);
  } catch {
    logger.warn('[mcp] SSRF blocked', { serverUrl });
    return null;
  }
  try {
    const res = await fetch(serverUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(auth.type, auth.value) },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const data = await res.json() as { result?: T; error?: { message: string } };
    if (data.error) { logger.warn('[mcp] RPC error', { method, error: data.error.message }); return null; }
    return data.result ?? null;
  } catch (err) {
    logger.warn('[mcp] RPC failed', { method, serverUrl, err: (err as Error).message });
    return null;
  }
}

// ─── Tool name sanitiser ──────────────────────────────────────────────────────
// OpenAI function names: ^[a-zA-Z0-9_-]{1,64}$
// We prefix with mcp__ + first 8 chars of connector UUID to namespace tools.
function toOpenAIName(connectorId: string, toolName: string): string {
  const prefix = `mcp__${connectorId.replace(/-/g, '').slice(0, 8)}`;
  const safe   = toolName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  return `${prefix}__${safe}`;
}

// ─── Sanitise external tool metadata ─────────────────────────────────────────
function sanitizeJsonSchema(schema: unknown): Record<string, unknown> {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return { type: 'object', properties: {} };
  const s = schema as Record<string, unknown>;
  const ALLOWED = new Set(['type','properties','required','items','enum','minimum','maximum','minLength','maxLength','pattern','additionalProperties','description','title','default','format','anyOf','oneOf','allOf']);
  const out: Record<string, unknown> = {};
  for (const k of ALLOWED) { if (k in s) out[k] = s[k]; }
  if (typeof out['description'] === 'string') out['description'] = out['description'].slice(0, 128);
  return out;
}
function sanitizeMcpTool(tool: McpTool): McpTool {
  return {
    name: String(tool.name ?? '').slice(0, 64).replace(/[^a-zA-Z0-9_-]/g, '_') || 'unknown_tool',
    description: String(tool.description ?? '').slice(0, 256),
    inputSchema: sanitizeJsonSchema(tool.inputSchema),
  };
}

// ─── Write-verb guard ─────────────────────────────────────────────────────────
const WRITE_VERB_RE = /\b(create|update|delete|remove|set|post|put|patch|write|insert|upsert|destroy|reset|clear)\b/i;

// ─── Fetch tools for one connector ───────────────────────────────────────────
async function fetchConnectorTools(c: ConnectorRow): Promise<McpTool[]> {
  const cached = toolListCache.get(c.id);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.tools;

  const result = await rpc<{ tools: McpTool[] }>(
    c.serverUrl,
    { type: c.authType, value: c.authValue },
    'tools/list',
    {},
    3000, // 3 s — skip slow servers
  );

  const raw = result?.tools ?? [];
  const sanitized = raw.map(sanitizeMcpTool);

  // ── Scoped permissions: filter by allowedTools whitelist ──────────────────
  const tools = c.allowedTools.length > 0
    ? sanitized.filter((t) => c.allowedTools.includes(t.name))
    : sanitized;

  toolListCache.set(c.id, { tools, fetchedAt: Date.now() });
  return tools;
}

// ─── Load all MCP tools for an org ───────────────────────────────────────────
export async function loadMcpTools(orgId: string): Promise<ConnectorToolBundle[]> {
  const cached = connectorListCache.get(orgId);
  const connectors: ConnectorRow[] = cached && Date.now() - cached.fetchedAt < CONNECTOR_CACHE_TTL_MS
    ? cached.connectors
    : await prisma.mcpConnector.findMany({
        where: { organizationId: orgId, enabled: true },
        select: { id: true, name: true, serverUrl: true, authType: true, authValue: true, allowedTools: true, readOnly: true },
      }).then((rows) => { connectorListCache.set(orgId, { connectors: rows, fetchedAt: Date.now() }); return rows; });

  if (connectors.length === 0) return [];

  // Fetch tool lists in parallel — silently skip any that fail
  const settled = await Promise.allSettled(
    connectors.map(async (c) => ({
      connector: c,
      tools: await fetchConnectorTools(c),
    }))
  );

  return settled
    .filter((r): r is PromiseFulfilledResult<{ connector: ConnectorRow; tools: McpTool[] }> =>
      r.status === 'fulfilled' && r.value.tools.length > 0
    )
    .map(({ value: { connector, tools } }) => {
      // ── readOnly: exclude write-verb tools from agent's tool list ──────────
      const permittedTools = connector.readOnly
        ? tools.filter((t) => !WRITE_VERB_RE.test(t.name))
        : tools;

      const nameMap = new Map<string, string>();
      for (const t of permittedTools) nameMap.set(toOpenAIName(connector.id, t.name), t.name);
      return { connector, tools: permittedTools, nameMap };
    });
}

// ─── Convert MCP tool list → OpenAI tool definitions ─────────────────────────
export function toOpenAITools(bundles: ConnectorToolBundle[]): OpenAI.Chat.ChatCompletionTool[] {
  const out: OpenAI.Chat.ChatCompletionTool[] = [];
  for (const { connector, tools, nameMap } of bundles) {
    for (const tool of tools) {
      const oaiName = [...nameMap.entries()].find(([, v]) => v === tool.name)?.[0];
      if (!oaiName) continue;
      out.push({
        type: 'function',
        function: {
          name: oaiName,
          description: `[${connector.name}] ${tool.description}`,
          parameters: tool.inputSchema as Record<string, unknown>,
        },
      });
    }
  }
  return out;
}

// ─── Execute a tool call on an MCP server ────────────────────────────────────
export async function callMcpTool(
  connector: ConnectorRow,
  toolName: string,
  args: Record<string, unknown>,
  meta: { orgId: string; sessionId?: string },
): Promise<McpToolResult> {
  // ── readOnly enforcement at call-time (second line of defence) ────────────
  if (connector.readOnly && WRITE_VERB_RE.test(toolName)) {
    logger.warn('[mcp] blocked write-verb tool call on readOnly connector', { connectorId: connector.id, toolName });
    const blockedResult: McpToolResult = {
      content: [{ type: 'text', text: `Permission denied: connector is read-only. Tool "${toolName}" requires write access.` }],
      isError: true,
    };
    // Log the blocked attempt — useful for operators auditing readOnly violations
    prisma.mcpCallLog.create({
      data: {
        organizationId: meta.orgId,
        sessionId:      meta.sessionId ?? null,
        connectorId:    connector.id,
        connectorName:  connector.name,
        toolName,
        callType:       'mcp',
        args:           args as Prisma.InputJsonValue,
        result:         blockedResult as unknown as Prisma.InputJsonValue,
        isError:        true,
        latencyMs:      0,
      },
    }).catch(() => {});
    return blockedResult;
  }

  const t0 = Date.now();
  const result = await rpc<McpToolResult>(
    connector.serverUrl,
    { type: connector.authType, value: connector.authValue },
    'tools/call',
    { name: toolName, arguments: args },
    10_000, // 10 s for tool execution
  );
  const latencyMs = Date.now() - t0;

  const finalResult = result ?? {
    content: [{ type: 'text', text: 'MCP tool call failed or timed out.' }],
    isError: true,
  };

  prisma.mcpCallLog.create({
    data: {
      organizationId: meta.orgId,
      sessionId:      meta.sessionId ?? null,
      connectorId:    connector.id,
      connectorName:  connector.name,
      toolName,
      callType:       'mcp',
      args:           args as Prisma.InputJsonValue,
      result:         finalResult as unknown as Prisma.InputJsonValue,
      isError:        !result || !!(finalResult as McpToolResult).isError,
      latencyMs,
    },
  }).catch(() => {});

  return finalResult;
}

/**
 * Like callMcpTool but supports long-running operations via polling.
 * If the tool returns { status: "pending", jobId: "..." }, polls
 * check_job_status every 3 s up to 10 times (30 s total).
 * Timeout extended to 30 s on initial call.
 */
export async function callMcpToolWithPoll(
  connector: ConnectorRow,
  toolName: string,
  args: Record<string, unknown>,
  meta: { orgId: string; sessionId?: string },
): Promise<McpToolResult> {
  // readOnly guard (mirrors callMcpTool)
  if (connector.readOnly && WRITE_VERB_RE.test(toolName)) {
    logger.warn('[mcp] blocked write-verb tool call on readOnly connector', { connectorId: connector.id, toolName });
    return {
      content: [{ type: 'text', text: `Permission denied: connector is read-only. Tool "${toolName}" requires write access.` }],
      isError: true,
    };
  }

  // Initial call with extended timeout (30 s)
  const t0 = Date.now();
  const result = await rpc<McpToolResult>(
    connector.serverUrl,
    { type: connector.authType, value: connector.authValue },
    'tools/call',
    { name: toolName, arguments: args },
    30_000,
  );

  if (!result) {
    prisma.mcpCallLog.create({
      data: {
        organizationId: meta.orgId, sessionId: meta.sessionId ?? null,
        connectorId: connector.id, connectorName: connector.name,
        toolName, callType: 'mcp', args: args as Prisma.InputJsonValue,
        result: Prisma.JsonNull, isError: true, latencyMs: Date.now() - t0,
      },
    }).catch(() => {});
    return { content: [{ type: 'text', text: 'MCP tool call failed or timed out.' }], isError: true };
  }

  // Check for pending async job
  const firstContent = result.content?.[0];
  let pendingResult: { status?: string; jobId?: string } | null = null;
  try {
    if (firstContent?.type === 'text') {
      const parsed = JSON.parse(firstContent.text) as { status?: string; jobId?: string };
      if (parsed.status === 'pending' && parsed.jobId) pendingResult = parsed;
    }
  } catch { /* not JSON, not a pending response */ }

  if (!pendingResult) {
    // Synchronous completion — log and return
    prisma.mcpCallLog.create({
      data: {
        organizationId: meta.orgId, sessionId: meta.sessionId ?? null,
        connectorId: connector.id, connectorName: connector.name,
        toolName, callType: 'mcp', args: args as Prisma.InputJsonValue,
        result: result as unknown as Prisma.InputJsonValue,
        isError: !!result.isError, latencyMs: Date.now() - t0,
      },
    }).catch(() => {});
    return result;
  }

  // Poll for completion
  const { jobId } = pendingResult;
  logger.info('[mcp] polling for async job', { connectorId: connector.id, toolName, jobId });

  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise((r) => setTimeout(r, 3_000));

    const pollResult = await rpc<McpToolResult>(
      connector.serverUrl,
      { type: connector.authType, value: connector.authValue },
      'tools/call',
      { name: 'check_job_status', arguments: { jobId } },
      5_000,
    );

    if (!pollResult) continue;

    let stillPending = false;
    try {
      const parsed = JSON.parse(pollResult.content?.[0]?.text ?? '') as { status?: string };
      if (parsed.status === 'pending') stillPending = true;
    } catch { /* completed */ }

    if (!stillPending) {
      prisma.mcpCallLog.create({
        data: {
          organizationId: meta.orgId, sessionId: meta.sessionId ?? null,
          connectorId: connector.id, connectorName: connector.name,
          toolName, callType: 'mcp', args: args as Prisma.InputJsonValue,
          result: pollResult as unknown as Prisma.InputJsonValue,
          isError: !!pollResult.isError, latencyMs: Date.now() - t0,
        },
      }).catch(() => {});
      return pollResult;
    }
  }

  // Exhausted polls
  prisma.mcpCallLog.create({
    data: {
      organizationId: meta.orgId, sessionId: meta.sessionId ?? null,
      connectorId: connector.id, connectorName: connector.name,
      toolName, callType: 'mcp', args: args as Prisma.InputJsonValue,
      result: Prisma.JsonNull, isError: true, latencyMs: Date.now() - t0,
    },
  }).catch(() => {});
  return { content: [{ type: 'text', text: `Async job "${jobId}" did not complete within 30 seconds.` }], isError: true };
}

// ─── Lookup: given an OpenAI function name, find the connector + tool ─────────
export function resolveMcpCall(
  openAIName: string,
  bundles: ConnectorToolBundle[],
): { connector: ConnectorRow; mcpToolName: string } | null {
  for (const { connector, nameMap } of bundles) {
    const mcpToolName = nameMap.get(openAIName);
    if (mcpToolName) return { connector, mcpToolName };
  }
  return null;
}
