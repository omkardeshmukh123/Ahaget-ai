import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticateJWT } from '../middleware/auth';
import { requireFeature } from '../middleware/planGate';
import { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authenticateJWT);

const CreateSchema = z.object({ name: z.string().min(1).max(80) });
const RenameSchema = z.object({ name: z.string().min(1).max(80) });

// ─── GET /api/v1/workspaces ───────────────────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const workspaces = await prisma.workspace.findMany({
    where: { organizationId: req.user!.organizationId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true, name: true, isDefault: true, createdAt: true,
      _count: { select: { onboardingFlows: true } },
    },
  });
  res.json({ workspaces });
});

// ─── POST /api/v1/workspaces — Scale plan only ────────────────────────────────
router.post('/', requireFeature('multiWorkspace'), async (req: AuthenticatedRequest, res: Response) => {
  const { name } = CreateSchema.parse(req.body);
  const orgId = req.user!.organizationId;

  const existing = await prisma.workspace.count({ where: { organizationId: orgId } });
  if (existing >= 10) {
    res.status(400).json({ error: 'Maximum 10 workspaces per organization' });
    return;
  }

  const workspace = await prisma.workspace.create({
    data: { organizationId: orgId, name, isDefault: false },
    select: { id: true, name: true, isDefault: true, createdAt: true },
  });
  res.status(201).json({ workspace });
});

// ─── PATCH /api/v1/workspaces/:id ─────────────────────────────────────────────
router.patch('/:id', requireFeature('multiWorkspace'), async (req: AuthenticatedRequest, res: Response) => {
  const { name } = RenameSchema.parse(req.body);
  const orgId = req.user!.organizationId;

  const ws = await prisma.workspace.findFirst({
    where: { id: req.params.id, organizationId: orgId },
  });
  if (!ws) { res.status(404).json({ error: 'Workspace not found' }); return; }
  if (ws.isDefault) { res.status(400).json({ error: 'Cannot rename the default workspace' }); return; }

  const updated = await prisma.workspace.update({
    where: { id: ws.id },
    data: { name },
    select: { id: true, name: true, isDefault: true, createdAt: true },
  });
  res.json({ workspace: updated });
});

// ─── DELETE /api/v1/workspaces/:id ────────────────────────────────────────────
router.delete('/:id', requireFeature('multiWorkspace'), async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;

  const ws = await prisma.workspace.findFirst({
    where: { id: req.params.id, organizationId: orgId },
  });
  if (!ws) { res.status(404).json({ error: 'Workspace not found' }); return; }
  if (ws.isDefault) { res.status(400).json({ error: 'Cannot delete the default workspace' }); return; }

  const flowCount = await prisma.onboardingFlow.count({ where: { workspaceId: ws.id } });
  if (flowCount > 0) {
    res.status(400).json({ error: `Cannot delete: workspace has ${flowCount} flow(s). Move or delete them first.` });
    return;
  }

  await prisma.workspace.delete({ where: { id: ws.id } });
  res.status(204).send();
});

export default router;
