import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticateJWT } from '../middleware/auth';
import { checkMcpConnectorLimit } from '../middleware/rateLimit';
import { AuthenticatedRequest } from '../types';
import { callMcpTool } from '../services/mcp';
import { encryptIfEnabled, decrypt } from '../utils/encrypt';

const router = Router();
router.use(authenticateJWT);

const SAFE_SELECT = {
  id: true, name: true, description: true, connectorType: true,
  serverUrl: true, authType: true, enabled: true,
  allowedTools: true, readOnly: true, allowInGoalMode: true,
  createdAt: true, updatedAt: true,
  // never return authValue in list responses
} as const;

const ConnectorSchema = z.object({
  name:          z.string().min(1).max(100),
  description:   z.string().max(500).optional().default(''),
  connectorType: z.enum(['mcp', 'rest']).optional().default('mcp'),
  serverUrl:     z.string().url(),
  authType:      z.enum(['none', 'bearer', 'api_key']).default('none'),
  authValue:     z.string().optional(),
  enabled:       z.boolean().default(true),
  allowedTools:  z.array(z.string()).optional().default([]),
  readOnly:      z.boolean().optional().default(false),
  allowInGoalMode: z.boolean().optional().default(false),
});

const EndpointSchema = z.object({
  method:      z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
  urlPattern:  z.string().url(),
  description: z.string().max(500).optional().default(''),
  readOnly:    z.boolean().optional().default(false),
});

// ─── GET /api/v1/mcp — list connectors ───────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const connectors = await prisma.mcpConnector.findMany({
    where: { organizationId: req.user!.organizationId },
    orderBy: { createdAt: 'asc' },
    select: SAFE_SELECT,
  });
  res.json({ connectors });
});

// ─── GET /api/v1/mcp/calls — list MCP call logs for org ──────────────────────
router.get('/calls', async (req: AuthenticatedRequest, res: Response) => {
  const orgId      = req.user!.organizationId;
  const limit      = Math.min(Number(req.query.limit)  || 50, 200);
  const offset     = Math.max(0, Number(req.query.offset) || 0);
  const connectorId = req.query.connectorId as string | undefined;

  if (connectorId) {
    const owned = await prisma.mcpConnector.findFirst({
      where: { id: connectorId, organizationId: orgId },
      select: { id: true },
    });
    if (!owned) {
      res.status(404).json({ error: 'Connector not found' });
      return;
    }
  }

  const calls = await prisma.mcpCallLog.findMany({
    where: {
      organizationId: orgId,
      ...(connectorId ? { connectorId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take:    limit,
    skip:    offset,
    select: {
      id:            true,
      connectorName: true,
      toolName:      true,
      callType:      true,
      isError:       true,
      latencyMs:     true,
      createdAt:     true,
      sessionId:     true,
      // do NOT include args/result in list — can be large
    },
  });
  res.json({ calls });
});

// ─── GET /api/v1/mcp/calls/session/:sessionId — call logs for a session ──────
router.get('/calls/session/:sessionId', async (req: AuthenticatedRequest, res: Response) => {
  const calls = await prisma.mcpCallLog.findMany({
    where: {
      organizationId: req.user!.organizationId,
      sessionId:      req.params.sessionId,
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id:            true,
      connectorName: true,
      toolName:      true,
      callType:      true,
      isError:       true,
      latencyMs:     true,
      createdAt:     true,
      args:          true,
      result:        true,
    },
  });
  res.json({ calls });
});

// ─── POST /api/v1/mcp — create connector ─────────────────────────────────────
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const data = ConnectorSchema.parse(req.body);
  const orgId = req.user!.organizationId;

  const limitErr = await checkMcpConnectorLimit(orgId);
  if (limitErr) {
    res.status(403).json({ error: limitErr, code: 'MCP_LIMIT_REACHED' });
    return;
  }

  const connector = await prisma.mcpConnector.create({
    data: {
      organizationId: orgId,
      ...data,
      authValue: data.authValue ? encryptIfEnabled(data.authValue) : data.authValue,
    },
    select: SAFE_SELECT,
  });
  res.status(201).json({ connector });
});

// ─── PUT /api/v1/mcp/:id — update connector ──────────────────────────────────
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const data = ConnectorSchema.partial().parse(req.body);
  const orgId = req.user!.organizationId;

  const result = await prisma.mcpConnector.updateMany({
    where: { id: req.params.id, organizationId: orgId },
    data: {
      ...data,
      ...(data.authValue !== undefined && {
        authValue: data.authValue ? encryptIfEnabled(data.authValue) : data.authValue,
      }),
    },
  });

  if (result.count === 0) {
    res.status(404).json({ error: 'Connector not found' });
    return;
  }

  const connector = await prisma.mcpConnector.findFirst({
    where: { id: req.params.id, organizationId: orgId },
    select: SAFE_SELECT,
  });
  res.json({ connector });
});

// ─── DELETE /api/v1/mcp/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  await prisma.mcpConnector.deleteMany({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
  });
  res.json({ deleted: true });
});

// ─── POST /api/v1/mcp/:id/test — ping MCP server, return tool list ───────────
router.post('/:id/test', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const connector = await prisma.mcpConnector.findFirst({
    where: { id: req.params.id, organizationId: orgId },
    select: { id: true, serverUrl: true, authType: true, authValue: true, connectorType: true },
  });
  if (!connector) {
    res.status(404).json({ error: 'Connector not found' });
    return;
  }

  const clearAuthValue = connector.authValue ? decrypt(connector.authValue) : null;

  if (connector.connectorType === 'rest') {
    // For REST connectors just do a HEAD/GET to the base URL
    try {
      const resp = await fetch(connector.serverUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(4000),
        headers: connector.authType === 'bearer' && clearAuthValue
          ? { Authorization: `Bearer ${clearAuthValue}` }
          : connector.authType === 'api_key' && clearAuthValue
          ? { 'X-API-Key': clearAuthValue }
          : {},
      });
      res.json({ ok: resp.ok, status: resp.status, tools: [], connectorType: 'rest' });
    } catch (err) {
      res.json({ ok: false, error: (err as Error).message, tools: [], connectorType: 'rest' });
    }
    return;
  }

  // MCP: call tools/list
  try {
    const authHeader: Record<string, string> = {};
    if (connector.authType === 'bearer' && clearAuthValue) authHeader['Authorization'] = `Bearer ${clearAuthValue}`;
    if (connector.authType === 'api_key' && clearAuthValue) authHeader['X-API-Key'] = clearAuthValue;

    const rpcRes = await fetch(connector.serverUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }),
      signal: AbortSignal.timeout(5000),
    });

    if (!rpcRes.ok) {
      res.json({ ok: false, error: `HTTP ${rpcRes.status}`, tools: [] });
      return;
    }

    const data = await rpcRes.json() as { result?: { tools: unknown[] }; error?: { message: string } };
    if (data.error) {
      res.json({ ok: false, error: data.error.message, tools: [] });
      return;
    }

    const tools = (data.result?.tools ?? []) as Array<{ name: string; description?: string }>;
    res.json({ ok: true, tools: tools.map((t) => ({ name: t.name, description: t.description ?? '' })) });
  } catch (err) {
    res.json({ ok: false, error: (err as Error).message, tools: [] });
  }
});

// ─── POST /api/v1/mcp/:id/call — invoke a specific tool with custom args ─────
router.post('/:id/call', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const { toolName, args } = req.body as { toolName?: string; args?: Record<string, unknown> };

  if (!toolName) {
    res.status(400).json({ error: 'toolName is required' });
    return;
  }

  const connector = await prisma.mcpConnector.findFirst({
    where: { id: req.params.id, organizationId: orgId },
    select: { id: true, name: true, serverUrl: true, authType: true, authValue: true, allowedTools: true, readOnly: true },
  });
  if (!connector) {
    res.status(404).json({ error: 'Connector not found' });
    return;
  }

  // Enforce allowedTools whitelist
  if (connector.allowedTools.length > 0 && !connector.allowedTools.includes(toolName)) {
    res.status(403).json({ error: `Tool "${toolName}" is not in the allowed tools list` });
    return;
  }

  try {
    const t0 = Date.now();
    const result = await callMcpTool(connector, toolName, args ?? {}, { orgId });
    const latencyMs = Date.now() - t0;
    res.json({ result: result.content, isError: result.isError ?? false, latencyMs });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message ?? 'Tool call failed', isError: true, latencyMs: 0 });
  }
});

// ─── GET /api/v1/mcp/:id/endpoints ───────────────────────────────────────────
router.get('/:id/endpoints', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const connector = await prisma.mcpConnector.findFirst({
    where: { id: req.params.id, organizationId: orgId },
  });
  if (!connector) { res.status(404).json({ error: 'Connector not found' }); return; }

  const endpoints = await prisma.restApiEndpoint.findMany({
    where: { connectorId: req.params.id },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ endpoints });
});

// ─── POST /api/v1/mcp/:id/endpoints ──────────────────────────────────────────
router.post('/:id/endpoints', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const connector = await prisma.mcpConnector.findFirst({
    where: { id: req.params.id, organizationId: orgId },
  });
  if (!connector) { res.status(404).json({ error: 'Connector not found' }); return; }

  const data = EndpointSchema.parse(req.body);
  const endpoint = await prisma.restApiEndpoint.create({
    data: { connectorId: req.params.id, ...data },
  });
  res.status(201).json({ endpoint });
});

// ─── DELETE /api/v1/mcp/:connectorId/endpoints/:endpointId ───────────────────
router.delete('/:id/endpoints/:endpointId', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const connector = await prisma.mcpConnector.findFirst({
    where: { id: req.params.id, organizationId: orgId },
  });
  if (!connector) { res.status(404).json({ error: 'Connector not found' }); return; }

  await prisma.restApiEndpoint.deleteMany({
    where: { id: req.params.endpointId, connectorId: req.params.id },
  });
  res.json({ deleted: true });
});

export default router;
