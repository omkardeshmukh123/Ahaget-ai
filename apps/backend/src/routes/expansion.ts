/**
 * expansion.ts — Expansion Revenue Tooling (Phase 5)
 *
 * Routes:
 *   POST /api/v1/expansion/suggest     (API key) — widget records a suggest_upgrade action
 *   POST /api/v1/expansion/confirm     (API key) — billing webhook / client confirms upgrade
 *   GET  /api/v1/expansion             (JWT)     — dashboard revenue panel
 *   GET  /api/v1/expansion/flows       (JWT)     — upsell flows with conversion stats
 *
 * Attribution window: 48 hours (configurable per-flow via attributionWindowH).
 * When a user upgrades within the window → MRR is credited to the flow.
 */

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateApiKey, authenticateJWT } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

// ─── POST /api/v1/expansion/suggest ─────────────────────────────────────────
// Called by the widget immediately after the agent shows a suggest_upgrade card.
// Creates a pending UpsellAttribution with a 48h window.
router.post('/suggest', authenticateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  const { userId, flowId, sessionId } = req.body as {
    userId: string;
    flowId: string;
    sessionId?: string;
  };

  if (!userId || !flowId) {
    res.status(400).json({ error: 'userId and flowId required' });
    return;
  }

  const orgId = req.user!.organizationId;

  const [flow, endUser] = await Promise.all([
    prisma.onboardingFlow.findFirst({
      where: { id: flowId, organizationId: orgId, flowType: 'upsell' },
      select: { id: true, targetPlan: true, upgradeUrl: true, mrrPerConversion: true },
    }),
    prisma.endUser.findFirst({
      where: { organizationId: orgId, externalId: userId },
      select: { id: true },
    }),
  ]);

  if (!flow || !endUser) {
    res.status(404).json({ error: 'Flow or user not found' });
    return;
  }

  // Dedup — don't create duplicate pending attribution within the same window
  const existingPending = await prisma.upsellAttribution.findFirst({
    where: {
      organizationId: orgId,
      endUserId: endUser.id,
      flowId,
      status: 'pending',
      expiresAt: { gt: new Date() },
    },
  });

  if (existingPending) {
    res.json({ attribution: existingPending, created: false });
    return;
  }

  const now = new Date();
  const windowH = 48;
  const attribution = await prisma.upsellAttribution.create({
    data: {
      organizationId: orgId,
      endUserId: endUser.id,
      flowId,
      sessionId: sessionId ?? null,
      targetPlan: flow.targetPlan ?? 'upgrade',
      attributionWindowH: windowH,
      status: 'pending',
      suggestedAt: now,
      expiresAt: new Date(now.getTime() + windowH * 60 * 60 * 1000),
    },
  });

  res.status(201).json({ attribution, created: true });
});

// ─── POST /api/v1/expansion/confirm ─────────────────────────────────────────
// Called by a billing webhook (Stripe, etc.) or directly from the client
// when the user completes an upgrade. Finds the pending attribution within
// the window and marks it confirmed + records MRR.
router.post('/confirm', authenticateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  const { userId, plan, mrr } = req.body as {
    userId: string;
    plan: string;         // the plan the user upgraded to (matched against targetPlan)
    mrr?: number;         // actual MRR delta (optional — falls back to mrrPerConversion)
  };

  if (!userId || !plan) {
    res.status(400).json({ error: 'userId and plan required' });
    return;
  }

  const orgId = req.user!.organizationId;

  const endUser = await prisma.endUser.findFirst({
    where: { organizationId: orgId, externalId: userId },
    select: { id: true },
  });
  if (!endUser) { res.status(404).json({ error: 'User not found' }); return; }

  // Find a pending attribution for this plan within its window
  const pending = await prisma.upsellAttribution.findFirst({
    where: {
      organizationId: orgId,
      endUserId: endUser.id,
      status: 'pending',
      expiresAt: { gt: new Date() },
      // Allow loose match: growth matches growth_annual etc.
      targetPlan: { contains: plan.split('_')[0] },
    },
    include: {
      flow: { select: { mrrPerConversion: true } },
    },
    orderBy: { suggestedAt: 'desc' },
  });

  if (!pending) {
    // No pending attribution — no conversion to record
    res.json({ attributed: false, message: 'No pending attribution in window' });
    return;
  }

  const confirmedMrr = mrr ?? pending.flow.mrrPerConversion ?? 0;

  const confirmed = await prisma.upsellAttribution.update({
    where: { id: pending.id },
    data: {
      status: 'confirmed',
      confirmedAt: new Date(),
      mrr: confirmedMrr,
    },
  });

  res.json({ attributed: true, attribution: confirmed, mrr: confirmedMrr });
});

// ─── GET /api/v1/expansion ───────────────────────────────────────────────────
// Dashboard revenue panel — aggregate stats for the org.
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const { period = '30d' } = req.query as { period?: string };

  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [all, confirmed, pending, recent] = await Promise.all([
    prisma.upsellAttribution.count({ where: { organizationId: orgId, suggestedAt: { gte: since } } }),
    prisma.upsellAttribution.findMany({
      where: { organizationId: orgId, status: 'confirmed', confirmedAt: { gte: since } },
      select: { mrr: true, confirmedAt: true, targetPlan: true },
    }),
    prisma.upsellAttribution.count({
      where: { organizationId: orgId, status: 'pending', expiresAt: { gt: new Date() } },
    }),
    prisma.upsellAttribution.findMany({
      where: { organizationId: orgId },
      orderBy: { suggestedAt: 'desc' },
      take: 20,
      include: {
        flow: { select: { name: true, targetPlan: true } },
        endUser: { select: { externalId: true, email: true } },  // fixed: was enduser
      },
    }),
  ]);

  const attributedMrr = confirmed.reduce((sum, a) => sum + (a.mrr ?? 0), 0);
  const conversionRate = all > 0 ? Math.round((confirmed.length / all) * 100) : 0;

  // MRR by plan
  const byPlan: Record<string, number> = {};
  for (const a of confirmed) {
    byPlan[a.targetPlan] = (byPlan[a.targetPlan] ?? 0) + (a.mrr ?? 0);
  }

  res.json({
    stats: {
      totalSuggestions: all,
      confirmed: confirmed.length,
      pending,
      attributedMrr: Math.round(attributedMrr * 100) / 100,
      conversionRate,
      mrrByPlan: byPlan,
    },
    recent,
    period,
  });
});

// ─── GET /api/v1/expansion/flows ────────────────────────────────────────────
// Per-flow upsell performance for the dashboard table.
router.get('/flows', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;

  const flows = await prisma.onboardingFlow.findMany({
    where: { organizationId: orgId, flowType: 'upsell' },
    select: {
      id: true, name: true, targetPlan: true, upgradeUrl: true,
      mrrPerConversion: true, isActive: true, createdAt: true,
      upsellAttributions: {
        select: { status: true, mrr: true, suggestedAt: true },
      },
    },
  });

  const result = flows.map((f) => {
    const total = f.upsellAttributions.length;
    const conf = f.upsellAttributions.filter((a) => a.status === 'confirmed');
    const mrr  = conf.reduce((s, a) => s + (a.mrr ?? f.mrrPerConversion ?? 0), 0);
    return {
      id: f.id,
      name: f.name,
      targetPlan: f.targetPlan,
      upgradeUrl: f.upgradeUrl,
      mrrPerConversion: f.mrrPerConversion,
      isActive: f.isActive,
      createdAt: f.createdAt,
      totalSuggestions: total,
      confirmed: conf.length,
      conversionRate: total > 0 ? Math.round((conf.length / total) * 100) : 0,
      attributedMrr: Math.round(mrr * 100) / 100,
    };
  });

  res.json({ flows: result });
});

// ─── PUT /api/v1/expansion/flows/:id ────────────────────────────────────────
// Update upsell-specific fields on a flow (targetPlan, upgradeUrl, mrrPerConversion).
router.put('/flows/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { targetPlan, upgradeUrl, mrrPerConversion } = req.body as {
    targetPlan?: string;
    upgradeUrl?: string;
    mrrPerConversion?: number;
  };

  const flow = await prisma.onboardingFlow.findFirst({
    where: { id, organizationId: req.user!.organizationId, flowType: 'upsell' },
  });
  if (!flow) { res.status(404).json({ error: 'Upsell flow not found' }); return; }

  const updated = await prisma.onboardingFlow.update({
    where: { id },
    data: {
      ...(targetPlan !== undefined && { targetPlan }),
      ...(upgradeUrl !== undefined && { upgradeUrl }),
      ...(mrrPerConversion !== undefined && { mrrPerConversion }),
    },
  });

  res.json({ flow: updated });
});

export default router;
