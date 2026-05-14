import { Router, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { invalidateContextSourceCache } from '../services/contextSources';
import { callMcpTool } from '../services/mcp';
import { interpolate } from '../services/apicall';
import { assertPublicUrl } from '../lib/ipGuard';

const router = Router();
router.use(authenticateJWT);

const SAFE_SELECT = {
  id: true, name: true, description: true, enabled: true,
  connectorId: true, mcpToolName: true, mcpToolArgs: true,
  restUrl: true, restMethod: true,
  contextKey: true, allowedFields: true,
  createdAt: true, updatedAt: true,
} as const;

const SourceSchema = z.object({
  name:          z.string().min(1).max(100),
  description:   z.string().max(500).optional().default(''),
  enabled:       z.boolean().optional().default(true),
  connectorId:   z.string().uuid().nullable().optional(),
  mcpToolName:   z.string().max(200).nullable().optional(),
  mcpToolArgs:   z.record(z.unknown()).optional().default({}),
  restUrl:       z.string().url().nullable().optional(),
  restMethod:    z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional().default('GET'),
  contextKey:    z.string().min(1).max(100),
  allowedFields: z.array(z.string()).optional().default([]),
});

function filterFields(data: unknown, allowedFields: string[]): unknown {
  if (allowedFields.length === 0) return data;
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return data;
  const obj = data as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in obj) out[key] = obj[key];
  }
  return out;
}

function authHeaders(authType: string, authValue: string | null): Record<string, string> {
  if (authType === 'bearer' && authValue) return { Authorization: `Bearer ${authValue}` };
  if (authType === 'api_key' && authValue)  return { 'X-API-Key': authValue };
  return {};
}

// ─── GET /api/v1/context-sources ─────────────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const sources = await prisma.contextSource.findMany({
    where: { organizationId: req.user!.organizationId },
    orderBy: { createdAt: 'asc' },
    select: SAFE_SELECT,
  });
  res.json({ sources });
});

// ─── POST /api/v1/context-sources ────────────────────────────────────────────
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const data = SourceSchema.parse(req.body);
  const orgId = req.user!.organizationId;

  const source = await prisma.contextSource.create({
    data: { organizationId: orgId, ...data, mcpToolArgs: (data.mcpToolArgs ?? {}) as Prisma.InputJsonValue },
    select: SAFE_SELECT,
  });

  invalidateContextSourceCache(orgId);
  res.status(201).json({ source });
});

// ─── PUT /api/v1/context-sources/:id ─────────────────────────────────────────
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const data = SourceSchema.partial().parse(req.body);
  const orgId = req.user!.organizationId;

  // Verify ownership before update
  const existing = await prisma.contextSource.findFirst({
    where: { id: req.params.id, organizationId: orgId },
    select: { id: true },
  });
  if (!existing) {
    res.status(404).json({ error: 'Context source not found' });
    return;
  }

  const { mcpToolArgs, ...restData } = data;
  const updateData: Prisma.ContextSourceUncheckedUpdateInput = {
    ...restData,
    ...(mcpToolArgs !== undefined ? { mcpToolArgs: mcpToolArgs as unknown as Prisma.InputJsonValue } : {}),
  };
  const source = await prisma.contextSource.update({
    where: { id: req.params.id },
    data: updateData,
    select: SAFE_SELECT,
  });

  invalidateContextSourceCache(orgId);
  res.json({ source });
});

// ─── DELETE /api/v1/context-sources/:id ──────────────────────────────────────
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  await prisma.contextSource.deleteMany({
    where: { id: req.params.id, organizationId: orgId },
  });
  invalidateContextSourceCache(orgId);
  res.json({ deleted: true });
});

// ─── POST /api/v1/context-sources/:id/test ───────────────────────────────────
// Dry-run: fetch the source and return raw + filtered response for dashboard preview.
router.post('/:id/test', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const source = await prisma.contextSource.findFirst({
    where: { id: req.params.id, organizationId: orgId },
    select: { ...SAFE_SELECT, connectorId: true },
  });

  if (!source) {
    res.status(404).json({ error: 'Context source not found' });
    return;
  }

  // Use {{userId}} placeholder for test preview
  const userVars: Record<string, string> = { userId: 'test_user', plan: 'pro', role: 'admin' };

  try {
    if (source.mcpToolName && source.connectorId) {
      // MCP path
      const connector = await prisma.mcpConnector.findUnique({
        where: { id: source.connectorId },
        select: { id: true, name: true, serverUrl: true, authType: true, authValue: true, allowedTools: true, readOnly: true },
      });

      if (!connector) {
        res.json({ error: 'Connector not found', raw: null, filtered: null });
        return;
      }

      const interpolatedArgs = interpolate(source.mcpToolArgs, userVars) as Record<string, unknown>;
      const result = await Promise.race([
        callMcpTool(connector, source.mcpToolName, interpolatedArgs, { orgId }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timed out after 5s')), 5000)),
      ]);

      if (result.isError) {
        res.json({ error: 'MCP tool returned an error', raw: result.content, filtered: null });
        return;
      }

      const text = result.content
        .filter((c: { type: string; text?: string }) => c.type === 'text')
        .map((c: { text?: string }) => c.text ?? '')
        .join('\n');

      let raw: unknown = text;
      try { raw = JSON.parse(text); } catch { /* keep as string */ }

      const filtered = filterFields(raw, source.allowedFields);
      res.json({ raw, filtered });

    } else if (source.restUrl) {
      // REST path
      const interpolatedUrl = interpolate(source.restUrl, userVars) as string;

      try {
        await assertPublicUrl(interpolatedUrl);
      } catch (err) {
        res.json({ error: `SSRF blocked: ${(err as Error).message}`, raw: null, filtered: null });
        return;
      }

      let headers: Record<string, string> = {};
      if (source.connectorId) {
        const connector = await prisma.mcpConnector.findUnique({
          where: { id: source.connectorId },
          select: { authType: true, authValue: true },
        });
        if (connector) headers = authHeaders(connector.authType, connector.authValue);
      }

      const httpRes = await fetch(interpolatedUrl, {
        method: source.restMethod ?? 'GET',
        headers: { Accept: 'application/json', ...headers },
        signal: AbortSignal.timeout(5000),
      });

      if (!httpRes.ok) {
        res.json({ error: `HTTP ${httpRes.status}`, raw: null, filtered: null });
        return;
      }

      const ct = httpRes.headers.get('content-type') ?? '';
      const raw: unknown = ct.includes('application/json') ? await httpRes.json() : await httpRes.text();
      const filtered = filterFields(raw, source.allowedFields);
      res.json({ raw, filtered });

    } else {
      res.json({ error: 'Source has no mcpToolName or restUrl configured', raw: null, filtered: null });
    }
  } catch (err) {
    res.json({ error: (err as Error).message, raw: null, filtered: null });
  }
});

export default router;
