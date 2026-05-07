// ─── Escalations routes (JWT-protected, dashboard only) ──────────────────────
//
// GET    /api/v1/escalations          — list tickets (filter by status)
// GET    /api/v1/escalations/:id      — single ticket with full context
// PATCH  /api/v1/escalations/:id      — update status / notes

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT } from '../middleware/auth';
import { requireFeature } from '../middleware/planGate';
import { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authenticateJWT);
router.use(requireFeature('failureInbox'));

// ─── GET /api/v1/escalations ──────────────────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.query as { status?: string };

  const tickets = await prisma.escalationTicket.findMany({
    where: {
      organizationId: req.user!.organizationId,
      ...(status ? { status } : {}),
    },
    include: {
      endUser: { select: { externalId: true, metadata: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const counts = await prisma.escalationTicket.groupBy({
    by: ['status'],
    where: { organizationId: req.user!.organizationId },
    _count: { id: true },
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count.id]));

  res.json({
    tickets: tickets.map((t) => ({
      id: t.id,
      status: t.status,
      trigger: t.trigger,
      reason: t.reason,
      agentMessage: t.agentMessage,
      notes: t.notes,
      userId: t.endUser.externalId,
      userMetadata: t.endUser.metadata,
      createdAt: t.createdAt,
      resolvedAt: t.resolvedAt,
    })),
    counts: {
      open: countMap['open'] ?? 0,
      in_progress: countMap['in_progress'] ?? 0,
      resolved: countMap['resolved'] ?? 0,
    },
  });
});

// ─── POST /api/v1/escalations/manual ─────────────────────────────────────────
// Dashboard team member manually hands off a session to the support queue.
router.post('/manual', async (req: AuthenticatedRequest, res: Response) => {
  const { sessionId, notes } = req.body as { sessionId?: string; notes?: string };
  const { organizationId } = req.user!;

  if (!sessionId || typeof sessionId !== 'string') {
    res.status(400).json({ error: 'sessionId is required' });
    return;
  }

  // Verify the session belongs to this org
  const session = await prisma.userOnboardingSession.findFirst({
    where: { id: sessionId, organizationId },
    include: {
      endUser: { select: { id: true } },
      stepProgress: {
        where: { status: 'in_progress' },
        orderBy: { startedAt: 'desc' },
        take: 1,
        select: { stepId: true },
      },
    },
  });

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  // Prevent duplicate tickets for the same session
  const existingTicket = await prisma.escalationTicket.findFirst({
    where: { sessionId, organizationId },
    select: { id: true },
  });

  if (existingTicket) {
    res.status(409).json({
      error: 'An escalation ticket already exists for this session',
      ticketId: existingTicket.id,
    });
    return;
  }

  // Last assistant message becomes the context snippet shown to the team
  const lastAssistant = await prisma.sessionMessage.findFirst({
    where: { sessionId, role: 'assistant' },
    orderBy: { createdAt: 'desc' },
    select: { content: true },
  });

  // Last 10 messages for full context
  const recentRaw = await prisma.sessionMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { role: true, content: true },
  });
  const recentMessages = recentRaw.reverse();

  const currentStepId = session.stepProgress[0]?.stepId ?? null;

  const ticket = await prisma.escalationTicket.create({
    data: {
      organizationId,
      endUserId: session.endUser.id,
      sessionId,
      stepId: currentStepId,
      trigger: 'manual',
      status: 'open',
      reason: notes ?? 'Manual handoff from session replay',
      agentMessage: lastAssistant?.content ?? '',
      context: { recentMessages },
    },
  });

  res.status(201).json({
    ticket: {
      id: ticket.id,
      status: ticket.status,
      createdAt: ticket.createdAt,
    },
  });
});

// ─── GET /api/v1/escalations/:id ─────────────────────────────────────────────
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const ticket = await prisma.escalationTicket.findFirst({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
    include: {
      endUser: { select: { externalId: true, metadata: true, firstSeenAt: true } },
    },
  });

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  res.json({ ticket: {
    id: ticket.id,
    status: ticket.status,
    trigger: ticket.trigger,
    reason: ticket.reason,
    agentMessage: ticket.agentMessage,
    notes: ticket.notes,
    context: ticket.context,
    userId: ticket.endUser.externalId,
    userMetadata: ticket.endUser.metadata,
    userFirstSeen: ticket.endUser.firstSeenAt,
    sessionId: ticket.sessionId,
    stepId: ticket.stepId,
    createdAt: ticket.createdAt,
    resolvedAt: ticket.resolvedAt,
  }});
});

// ─── PATCH /api/v1/escalations/:id ───────────────────────────────────────────
const VALID_TICKET_STATUSES = new Set(['open', 'in_progress', 'resolved']);

router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { status, notes } = req.body as { status?: string; notes?: string };

  if (status !== undefined && !VALID_TICKET_STATUSES.has(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${[...VALID_TICKET_STATUSES].join(', ')}` });
    return;
  }

  const ticket = await prisma.escalationTicket.findFirst({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
  });

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const updated = await prisma.escalationTicket.update({
    where: { id: req.params.id },
    data: {
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(status === 'resolved' && ticket.status !== 'resolved' ? { resolvedAt: new Date() } : {}),
    },
  });

  res.json({ ticket: updated });
});

export default router;
