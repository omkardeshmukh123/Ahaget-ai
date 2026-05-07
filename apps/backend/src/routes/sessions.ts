// ─── Dashboard-facing session detail routes ────────────────────────────────
// Separate from session.ts (which is widget-facing, API-key auth).

import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth';
import { requireFeature } from '../middleware/planGate';
import { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authenticateJWT);
router.use(requireFeature('sessionReplay'));

// ─── GET /api/v1/sessions ─────────────────────────────────────────────────────
// Paginated list of all flow sessions for this org.
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const orgId  = req.user!.organizationId;
  const limit  = Math.min(Number(req.query.limit  ?? 50), 200);
  const offset = Number(req.query.offset ?? 0);
  const status = req.query.status as string | undefined;
  const q      = req.query.q      as string | undefined;
  const from   = req.query.from   as string | undefined;
  const to     = req.query.to     as string | undefined;

  // Validate date params early
  if (from && isNaN(new Date(from).getTime())) {
    res.status(400).json({ error: 'Invalid from date' });
    return;
  }
  if (to && isNaN(new Date(to).getTime())) {
    res.status(400).json({ error: 'Invalid to date' });
    return;
  }

  const where: Prisma.UserOnboardingSessionWhereInput = {
    organizationId: orgId,
  };

  if (status && ['active', 'completed', 'abandoned'].includes(status)) {
    where.status = status;
  }

  if (from || to) {
    where.startedAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to   ? { lte: new Date(to)   } : {}),
    };
  }

  if (q) {
    where.OR = [
      { endUser: { externalId: { contains: q, mode: 'insensitive' } } },
      { flow:    { name:       { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [sessions, total] = await Promise.all([
    prisma.userOnboardingSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        flow:    { select: { id: true, name: true, flowType: true } },
        endUser: { select: { id: true, externalId: true, metadata: true } },
        stepProgress: {
          select: {
            status: true,
            stepId: true,
            completedAt: true,
            dropReason: true,
            outcome: true,
          },
        },
      },
    }),
    prisma.userOnboardingSession.count({ where }),
  ]);

  const items = sessions.map((s) => {
    const completed = s.stepProgress.filter((p) => p.status === 'completed').length;
    const dropped   = s.stepProgress.find((p) => p.status === 'dropped');
    const durationMs = s.completedAt
      ? new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()
      : new Date(s.lastActiveAt).getTime() - new Date(s.startedAt).getTime();

    return {
      id:             s.id,
      status:         s.status,
      startedAt:      s.startedAt,
      completedAt:    s.completedAt,
      lastActiveAt:   s.lastActiveAt,
      firstValueAt:   s.firstValueAt,
      durationMs,
      stepsCompleted: completed,
      dropStepId:     dropped?.stepId ?? null,
      dropReason:     dropped?.dropReason ?? null,
      flow: s.flow,
      endUser: {
        id:         s.endUser.id,
        externalId: s.endUser.externalId,
        metadata:   s.endUser.metadata,
      },
    };
  });

  res.json({ sessions: items, total, limit, offset });
});

// ─── GET /api/v1/sessions/audit ──────────────────────────────────────────────
// Dashboard audit log — every AI action for this org (JWT auth).
// Must be before /:id to avoid route conflict.
router.get('/audit', async (req: AuthenticatedRequest, res: Response) => {
  const orgId  = req.user!.organizationId;
  const limit  = Math.min(Number(req.query.limit ?? 100), 200);
  const offset = Number(req.query.offset ?? 0);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        sessionId: true,
        endUserId: true,
        stepId: true,
        actionType: true,
        payload: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where: { organizationId: orgId } }),
  ]);

  res.json({ logs, total });
});

// ─── GET /api/v1/sessions/:id ─────────────────────────────────────────────────
// Full session detail: flow, steps with progress, collected data, user info, transcript.
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;

  const [session, rawMessages] = await Promise.all([
    prisma.userOnboardingSession.findFirst({
      where: { id: req.params.id, organizationId },
      include: {
        flow: {
          include: {
            steps: { orderBy: { order: 'asc' } },
          },
        },
        endUser: {
          select: {
            id: true,
            externalId: true,
            metadata: true,
            firstSeenAt: true,
            lastSeenAt: true,
          },
        },
        stepProgress: true,
      },
    }),
    prisma.sessionMessage.findMany({
      where: { sessionId: req.params.id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: {
        id: true,
        role: true,
        content: true,
        actionType: true,
        stepId: true,
        feedback: true,
        createdAt: true,
      },
    }),
  ]);

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  // Filter out internal sentinel messages — users never see these
  const messages = rawMessages.filter(
    (m) => m.content !== '__init__' && m.content !== '__verify__'
  );

  // Merge flow steps with their progress records
  const steps = session.flow.steps.map((step) => {
    const progress = session.stepProgress.find((p) => p.stepId === step.id);
    return {
      stepId: step.id,
      order: step.order,
      title: step.title,
      intent: step.intent,
      isMilestone: step.isMilestone,
      actionType: step.actionType,
      status: progress?.status ?? 'not_started',
      startedAt: progress?.startedAt ?? null,
      completedAt: progress?.completedAt ?? null,
      timeSpentMs: progress?.timeSpentMs ?? 0,
      messagesCount: progress?.messagesCount ?? 0,
      aiAssisted: progress?.aiAssisted ?? false,
      attempts: progress?.attempts ?? 0,
      outcome: progress?.outcome ?? null,
      dropReason: progress?.dropReason ?? null,
    };
  });

  res.json({
    session: {
      id: session.id,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      lastActiveAt: session.lastActiveAt,
      firstValueAt: session.firstValueAt,
      collectedData: session.collectedData,
      flow: {
        id: session.flow.id,
        name: session.flow.name,
      },
      endUser: session.endUser,
      steps,
      messages,
    },
  });
});

export default router;
