import crypto from 'crypto';
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticateJWT } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

const VALID_EVENT_TYPES = [
  'onboarding_completed',
  'step_completed',
  'user_escalated',
  'milestone_reached',
] as const;

const CreateSchema = z.object({
  eventType: z.enum(VALID_EVENT_TYPES),
  url: z.string().url(),
});

// ─── GET /api/v1/webhooks ─────────────────────────────────────────────────────
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const hooks = await prisma.webhook.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, eventType: true, url: true, enabled: true, createdAt: true },
  });
  res.json(hooks);
});

// ─── POST /api/v1/webhooks ────────────────────────────────────────────────────
router.post('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { eventType, url } = CreateSchema.parse(req.body);

  const secret = crypto.randomBytes(32).toString('hex');
  const hook = await prisma.webhook.create({
    data: { organizationId, eventType, url, secret },
    select: { id: true, eventType: true, url: true, secret: true, enabled: true, createdAt: true },
  });
  res.status(201).json(hook);
});

// ─── PATCH /api/v1/webhooks/:id ───────────────────────────────────────────────
router.patch('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body);

  const hook = await prisma.webhook.findFirst({
    where: { id: req.params.id, organizationId },
  });
  if (!hook) { res.status(404).json({ error: 'Webhook not found' }); return; }

  const updated = await prisma.webhook.update({
    where: { id: hook.id },
    data: { enabled },
    select: { id: true, eventType: true, url: true, enabled: true, createdAt: true },
  });
  res.json(updated);
});

// ─── DELETE /api/v1/webhooks/:id ─────────────────────────────────────────────
router.delete('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const hook = await prisma.webhook.findFirst({
    where: { id: req.params.id, organizationId },
  });
  if (!hook) { res.status(404).json({ error: 'Webhook not found' }); return; }

  await prisma.webhook.delete({ where: { id: hook.id } });
  res.status(204).send();
});

// ─── POST /api/v1/webhooks/:id/test ──────────────────────────────────────────
router.post('/:id/test', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const hook = await prisma.webhook.findFirst({
    where: { id: req.params.id, organizationId },
  });
  if (!hook) { res.status(404).json({ error: 'Webhook not found' }); return; }

  const samplePayload = {
    event: hook.eventType,
    createdAt: new Date().toISOString(),
    data: sampleData(hook.eventType),
  };

  const body = JSON.stringify(samplePayload);
  const sig = 'sha256=' + crypto.createHmac('sha256', hook.secret).update(body).digest('hex');

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10_000);
    const resp = await fetch(hook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ahaget-Signature': sig,
        'User-Agent': 'Ahaget-Webhooks/1.0',
      },
      body,
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    res.json({ ok: resp.ok, status: resp.status });
  } catch (err) {
    res.json({ ok: false, error: String(err) });
  }
});

function sampleData(eventType: string): Record<string, unknown> {
  switch (eventType) {
    case 'onboarding_completed':
      return { sessionId: 'ses_example', endUserId: 'usr_example', flowId: 'flw_example', completedAt: new Date().toISOString() };
    case 'step_completed':
      return { sessionId: 'ses_example', endUserId: 'usr_example', stepId: 'stp_example', stepName: 'Example Step', completedAt: new Date().toISOString() };
    case 'user_escalated':
      return { ticketId: 'esc_example', sessionId: 'ses_example', endUserId: 'usr_example', trigger: 'user_requested', reason: 'Test escalation' };
    case 'milestone_reached':
      return { sessionId: 'ses_example', endUserId: 'usr_example', milestoneStepId: 'stp_example', reachedAt: new Date().toISOString() };
    default:
      return {};
  }
}

export default router;
