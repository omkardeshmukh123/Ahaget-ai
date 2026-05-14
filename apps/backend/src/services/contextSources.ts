// ─── Context Sources Service ──────────────────────────────────────────────────
// Fetches all enabled ContextSource rows for an org at session start and returns
// a formatted LIVE CONTEXT block for injection into the agent system prompt.
//
// Caching behaviour:
//   • Source list (ContextSource rows) is cached per-org for 60 s (TTL-based).
//     Call invalidateContextSourceCache(orgId) after any ContextSource write to
//     force a fresh DB read on the next request.
//   • The fetched context data (results from each source) is NOT cached here —
//     callers are responsible for caching per session.
//
// Each source is fetched in parallel with a 2 s hard timeout — failures are
// silently skipped. The function never throws; it returns '' on any fatal error.

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { callMcpTool } from './mcp';
import { interpolate } from './apicall';
import { assertPublicUrl } from '../lib/ipGuard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectorRow {
  id: string;
  name: string;
  serverUrl: string;
  authType: string;
  authValue: string | null;
  allowedTools: string[];
  readOnly: boolean;
}

// ─── In-memory cache (60-second TTL, keyed by orgId) ─────────────────────────

interface SourceCacheEntry {
  sources: ContextSourceRow[];
  fetchedAt: number;
}

type ContextSourceRow = {
  id: string;
  organizationId: string;
  name: string;
  enabled: boolean;
  connectorId: string | null;
  mcpToolName: string | null;
  mcpToolArgs: unknown;
  restUrl: string | null;
  restMethod: string;
  contextKey: string;
  allowedFields: string[];
};

const sourceCache = new Map<string, SourceCacheEntry>();
const SOURCE_CACHE_TTL_MS = 60_000; // 60 seconds

// ─── Auth headers (mirrored from mcp.ts) ─────────────────────────────────────
function authHeaders(authType: string, authValue: string | null): Record<string, string> {
  if (authType === 'bearer' && authValue) return { Authorization: `Bearer ${authValue}` };
  if (authType === 'api_key' && authValue)  return { 'X-API-Key': authValue };
  return {};
}

// ─── Apply allowedFields filter ───────────────────────────────────────────────
function filterFields(data: unknown, allowedFields: string[]): unknown {
  if (allowedFields.length === 0) return data;
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return data;
  const obj = data as Record<string, unknown>;
  const filtered: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in obj) filtered[key] = obj[key];
  }
  return filtered;
}

// ─── Truncate result to 1000 chars ───────────────────────────────────────────
function truncate(value: unknown, maxChars = 1000): string {
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  if (str.length <= maxChars) return str;
  return str.slice(0, maxChars) + '…[truncated]';
}

// ─── Fetch one MCP source ─────────────────────────────────────────────────────
async function fetchMcpSource(
  source: ContextSourceRow,
  userVars: Record<string, string>,
): Promise<string | null> {
  if (!source.connectorId || !source.mcpToolName) return null;

  const connector = await prisma.mcpConnector.findUnique({
    where: { id: source.connectorId },
    select: { id: true, name: true, serverUrl: true, authType: true, authValue: true, allowedTools: true, readOnly: true },
  });

  if (!connector) {
    logger.warn('[contextSources] MCP connector not found', { connectorId: source.connectorId, sourceId: source.id });
    return null;
  }

  const interpolatedArgs = interpolate(source.mcpToolArgs, userVars) as Record<string, unknown>;

  let timerId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => reject(new Error('MCP call timed out')), 2000);
  });

  const callMcpToolPromise = callMcpTool(connector as ConnectorRow, source.mcpToolName!, interpolatedArgs, { orgId: source.organizationId });

  let result: Awaited<ReturnType<typeof callMcpTool>>;
  try {
    result = await Promise.race([callMcpToolPromise, timeoutPromise]);
    clearTimeout(timerId);
  } catch (err) {
    clearTimeout(timerId);
    throw err; // re-throw so outer catch handles it
  }

  if (result.isError) {
    logger.warn('[contextSources] MCP tool returned error', { sourceId: source.id, toolName: source.mcpToolName });
    return null;
  }

  // Extract text from content array
  const text = result.content
    .filter((c) => c.type === 'text')
    .map((c) => c.text)
    .join('\n');

  // Parse and filter fields if needed
  let parsed: unknown = text;
  try { parsed = JSON.parse(text); } catch { /* keep as string */ }

  const filtered = filterFields(parsed, source.allowedFields);
  return truncate(filtered);
}

// ─── Fetch one REST source ────────────────────────────────────────────────────
async function fetchRestSource(
  source: ContextSourceRow,
  userVars: Record<string, string>,
): Promise<string | null> {
  if (!source.restUrl) return null;

  const interpolatedUrl = interpolate(source.restUrl, userVars) as string;

  try {
    await assertPublicUrl(interpolatedUrl);
  } catch (err) {
    logger.warn('[contextSources] SSRF blocked for REST source', { sourceId: source.id, url: interpolatedUrl, err: (err as Error).message });
    return null;
  }

  // Get auth headers from linked connector (if any)
  let headers: Record<string, string> = {};
  if (source.connectorId) {
    const connector = await prisma.mcpConnector.findUnique({
      where: { id: source.connectorId },
      select: { authType: true, authValue: true },
    });
    if (connector) {
      headers = authHeaders(connector.authType, connector.authValue);
    }
  }

  const res = await fetch(interpolatedUrl, {
    method: source.restMethod ?? 'GET',
    headers: { 'Accept': 'application/json', ...headers },
    signal: AbortSignal.timeout(2000),
  });

  if (!res.ok) {
    logger.warn('[contextSources] REST source returned non-OK status', { sourceId: source.id, status: res.status });
    return null;
  }

  const ct = res.headers.get('content-type') ?? '';
  const raw: unknown = ct.includes('application/json') ? await res.json() : await res.text();
  const filtered = filterFields(raw, source.allowedFields);
  return truncate(filtered);
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Fetches all enabled ContextSources for an org and returns a formatted LIVE CONTEXT block.
 * Called at session start. Results are cached per-session (caller caches, not this function).
 * Each source is fetched in parallel with a 2s hard timeout — failures are silently skipped.
 * Returns empty string if no sources configured or all fail.
 */
export async function fetchSessionContext(
  orgId: string,
  userVars: Record<string, string>,
): Promise<string> {
  // ── Load ContextSource rows with 60s cache ────────────────────────────────
  let sources: ContextSourceRow[];
  const cached = sourceCache.get(orgId);
  if (cached && Date.now() - cached.fetchedAt < SOURCE_CACHE_TTL_MS) {
    sources = cached.sources;
  } else {
    try {
      sources = await prisma.contextSource.findMany({
        where: { organizationId: orgId, enabled: true },
      }) as ContextSourceRow[];
      sourceCache.set(orgId, { sources, fetchedAt: Date.now() });
    } catch (err) {
      logger.warn('[contextSources] failed to load source list', { orgId, err: (err as Error).message });
      return '';
    }
  }

  if (sources.length === 0) return '';

  // ── Fetch each source in parallel ────────────────────────────────────────
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const isMcp  = !!source.mcpToolName;
      const isRest = !!source.restUrl;

      let value: string | null = null;

      try {
        if (isMcp) {
          value = await fetchMcpSource(source, userVars);
        } else if (isRest) {
          value = await fetchRestSource(source, userVars);
        } else {
          logger.warn('[contextSources] source has neither mcpToolName nor restUrl — skipping', { sourceId: source.id });
        }
      } catch (err) {
        logger.warn('[contextSources] source fetch failed', { sourceId: source.id, err: (err as Error).message });
      }

      return { contextKey: source.contextKey, value };
    })
  );

  // ── Aggregate into LIVE CONTEXT block ─────────────────────────────────────
  const lines: string[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.value !== null) {
      lines.push(`${result.value.contextKey}: ${result.value.value}`);
    }
  }

  if (lines.length === 0) return '';

  return [
    'LIVE CONTEXT (fetched at session start — treat as authoritative):',
    ...lines,
  ].join('\n');
}

/** Invalidate the org's source cache (call after any ContextSource write). */
export function invalidateContextSourceCache(orgId: string): void {
  sourceCache.delete(orgId);
}
