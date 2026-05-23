import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateApiKey, authenticateJWT } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

// ─── GET /api/v1/proactive/pending ──────────────────────────────────────────
// Called by the widget on init (API key auth).
// Returns the latest unread in-app proactive message for this user.
// Widget uses this to show the pulsing badge + preview text.
//
// Query: userId (end-user's external ID)
router.get('/pending', authenticateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.query as { userId?: string };
  if (!userId) { res.json({ message: null }); return; }

  const orgId = req.user!.organizationId;

  const endUser = await prisma.endUser.findFirst({
    where: { organizationId: orgId, externalId: userId },
    select: { id: true },
  });
  if (!endUser) { res.json({ message: null }); return; }

  const msg = await prisma.proactiveMessage.findFirst({
    where: {
      organizationId: orgId,
      endUserId: endUser.id,
      channel: 'in_app',
      status: 'sent', // only unread messages
    },
    orderBy: { sentAt: 'desc' },
    include: { flow: { select: { id: true, name: true, flowType: true } } },
  });

  res.json({ message: msg ?? null });
});

// ─── POST /api/v1/proactive/open ─────────────────────────────────────────────
// Widget calls this when user clicks the badge (mark as opened).
router.post('/open', authenticateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  const { messageId } = req.body as { messageId?: string };
  if (!messageId) { res.status(400).json({ error: 'messageId required' }); return; }

  await prisma.proactiveMessage.updateMany({
    where: { id: messageId, organizationId: req.user!.organizationId },
    data: { status: 'opened', openedAt: new Date() },
  });
  res.json({ ok: true });
});

// ─── POST /api/v1/proactive/click ────────────────────────────────────────────
// Widget calls this when user clicks the deep-link CTA.
router.post('/click', authenticateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  const { messageId } = req.body as { messageId?: string };
  if (!messageId) { res.status(400).json({ error: 'messageId required' }); return; }

  await prisma.proactiveMessage.updateMany({
    where: { id: messageId, organizationId: req.user!.organizationId },
    data: { status: 'clicked', clickedAt: new Date() },
  });
  res.json({ ok: true });
});

// ─── GET /api/v1/proactive/unsubscribe ───────────────────────────────────────
// One-click unsubscribe link in email footer.
// No auth required — uses userId (internal UUID) as the token.
router.get('/unsubscribe', async (req, res: Response) => {
  const { userId } = req.query as { userId?: string };
  if (!userId) { res.status(400).send('Missing userId'); return; }

  await prisma.endUser.updateMany({
    where: { id: userId },
    data: { unsubscribed: true },
  });

  res.send(`
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Unsubscribed</title></head>
    <body style="font-family:sans-serif;text-align:center;padding:60px 20px;background:#f8fafc;">
      <h2 style="color:#1e293b;">You've been unsubscribed</h2>
      <p style="color:#64748b;">You'll no longer receive proactive emails from your AI employee.</p>
      <p style="color:#94a3b8;font-size:12px;">In-app messages will still appear. Contact support to re-subscribe.</p>
    </body>
    </html>
  `);
});

// ─── GET /api/v1/proactive (dashboard — JWT) ──────────────────────────────────
// Returns recent proactive message history for the org's dashboard panel.
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const limit = Math.min(parseInt((req.query.limit as string) ?? '50'), 200);

  const messages = await prisma.proactiveMessage.findMany({
    where: { organizationId: orgId },
    orderBy: { sentAt: 'desc' },
    take: limit,
    include: {
      endUser: { select: { externalId: true, email: true } },
      flow: { select: { id: true, name: true, flowType: true } },
    },
  });

  // Summary stats
  const total = await prisma.proactiveMessage.count({ where: { organizationId: orgId } });
  const opened = await prisma.proactiveMessage.count({ where: { organizationId: orgId, status: { in: ['opened', 'clicked'] } } });
  const clicked = await prisma.proactiveMessage.count({ where: { organizationId: orgId, status: 'clicked' } });

  res.json({
    messages,
    stats: {
      total,
      openRate: total > 0 ? Math.round((opened / total) * 100) : 0,
      clickRate: total > 0 ? Math.round((clicked / total) * 100) : 0,
    },
  });
});

// ─── POST /api/v1/proactive/send (manual send — JWT) ─────────────────────────
// Dashboard: manually trigger a proactive message to a user or segment.
router.post('/send', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { endUserId, flowId, subject, bodySnippet, channel } = req.body as {
    endUserId: string;
    flowId: string;
    subject?: string;
    bodySnippet?: string;
    channel?: 'in_app' | 'email';
  };

  if (!endUserId || !flowId) {
    res.status(400).json({ error: 'endUserId and flowId required' });
    return;
  }

  const orgId = req.user!.organizationId;

  // Verify flow + endUser belong to this org
  const [flow, user] = await Promise.all([
    prisma.onboardingFlow.findFirst({ where: { id: flowId, organizationId: orgId }, select: { id: true, name: true } }),
    prisma.endUser.findFirst({ where: { id: endUserId, organizationId: orgId }, select: { id: true, email: true, unsubscribed: true } }),
  ]);
  if (!flow || !user) { res.status(404).json({ error: 'Flow or user not found' }); return; }

  const deepLink = `${process.env.PRODUCT_APP_URL ?? process.env.FRONTEND_URL ?? 'https://app.ahaget.ai'}?ahaget_resume=${flowId}&uid=${endUserId}`;

  const msg = await prisma.proactiveMessage.create({
    data: {
      organizationId: orgId,
      endUserId,
      flowId,
      channel: channel ?? 'in_app',
      subject: subject ?? 'Your AI employee has something for you',
      bodySnippet: bodySnippet?.slice(0, 200),
      deepLink,
      status: 'sent',
    },
  });

  res.status(201).json({ message: msg });
});

export default router;
