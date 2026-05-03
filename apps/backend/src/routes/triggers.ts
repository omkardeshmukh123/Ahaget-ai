import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateJWT, authenticateApiKey } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

// ─── CRUD routes (JWT — dashboard use) ───────────────────────────────────────
// GET    /api/v1/triggers              — list all rules for org
// POST   /api/v1/triggers              — create a rule
// PUT    /api/v1/triggers/:id          — update a rule
// DELETE /api/v1/triggers/:id          — delete a rule
// GET    /api/v1/triggers/evaluate     — evaluate rules for a user+page (API key)

// ─── List ─────────────────────────────────────────────────────────────────────
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const rules = await prisma.triggerRule.findMany({
    where: { organizationId: req.user!.organizationId },
    include: { flow: { select: { id: true, name: true, flowType: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ rules });
});

// ─── Create ───────────────────────────────────────────────────────────────────
router.post('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const {
    flowId, triggerType, isActive,
    urlPattern, firstTimeOnly, daysThreshold,
    eventName, usageMetric, usagePercent, featureSlug,
  } = req.body as {
    flowId: string;
    triggerType: string;
    isActive?: boolean;
    urlPattern?: string;
    firstTimeOnly?: boolean;
    daysThreshold?: number;
    eventName?: string;
    usageMetric?: string;
    usagePercent?: number;
    featureSlug?: string;
  };

  // Verify flow belongs to org
  const flow = await prisma.onboardingFlow.findFirst({
    where: { id: flowId, organizationId: req.user!.organizationId },
  });
  if (!flow) {
    res.status(404).json({ error: 'Flow not found' });
    return;
  }

  const rule = await prisma.triggerRule.create({
    data: {
      organizationId: req.user!.organizationId,
      flowId,
      triggerType,
      isActive: isActive ?? true,
      urlPattern: urlPattern ?? null,
      firstTimeOnly: firstTimeOnly ?? false,
      daysThreshold: daysThreshold ?? null,
      eventName: eventName ?? null,
      usageMetric: usageMetric ?? null,
      usagePercent: usagePercent ?? null,
      featureSlug: featureSlug ?? null,
    },
    include: { flow: { select: { id: true, name: true, flowType: true } } },
  });
  res.status(201).json({ rule });
});

// ─── Update ───────────────────────────────────────────────────────────────────
router.put('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const {
    isActive, urlPattern, firstTimeOnly, daysThreshold,
    eventName, usageMetric, usagePercent, featureSlug, triggerType,
  } = req.body as Record<string, unknown>;

  const rule = await prisma.triggerRule.updateMany({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
    data: {
      ...(isActive !== undefined && { isActive: isActive as boolean }),
      ...(triggerType !== undefined && { triggerType: triggerType as string }),
      ...(urlPattern !== undefined && { urlPattern: urlPattern as string | null }),
      ...(firstTimeOnly !== undefined && { firstTimeOnly: firstTimeOnly as boolean }),
      ...(daysThreshold !== undefined && { daysThreshold: daysThreshold as number | null }),
      ...(eventName !== undefined && { eventName: eventName as string | null }),
      ...(usageMetric !== undefined && { usageMetric: usageMetric as string | null }),
      ...(usagePercent !== undefined && { usagePercent: usagePercent as number | null }),
      ...(featureSlug !== undefined && { featureSlug: featureSlug as string | null }),
    },
  });
  res.json({ updated: rule.count > 0 });
});

// ─── Delete ───────────────────────────────────────────────────────────────────
router.delete('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  await prisma.triggerRule.deleteMany({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
  });
  res.json({ deleted: true });
});

// ─── GET /api/v1/triggers/evaluate ───────────────────────────────────────────
// Called by the widget on init. Returns matching trigger + flow to open.
// Auth: API key (widget-side, no JWT)
//
// Query params:
//   userId   — end-user external ID
//   page     — current window.location.pathname
//   event    — (optional) event that just fired
//   metadata — (optional) JSON with { usageMetric, usagePercent, plan, ... }
//
// Algorithm:
//   1. Load all active trigger rules for this org
//   2. For client-side triggers (page_visit, event_fired): evaluate immediately
//   3. For server-side triggers (inactivity, page_never_visited, feature_unused):
//      check the events/sessions tables
//   4. Return the highest-priority matching rule + flow
router.get('/evaluate', authenticateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  const { userId, page, event, metadata: rawMeta } = req.query as {
    userId?: string;
    page?: string;
    event?: string;
    metadata?: string;
  };

  const orgId = req.user!.organizationId;
  const meta = rawMeta ? JSON.parse(rawMeta) as Record<string, unknown> : {};

  // Load all active rules with their flows
  const rules = await prisma.triggerRule.findMany({
    where: { organizationId: orgId, isActive: true },
    include: {
      flow: {
        select: {
          id: true, name: true, flowType: true, isActive: true,
          executionMode: true, steps: { orderBy: { order: 'asc' }, take: 1 },
        },
      },
    },
  });

  // Only consider rules whose flows are active
  const activeRules = rules.filter((r) => r.flow.isActive);

  // Find matching end user if userId provided
  let endUser: { id: string; lastSeenAt: Date } | null = null;
  if (userId) {
    endUser = await prisma.endUser.findFirst({
      where: { organizationId: orgId, externalId: userId },
      select: { id: true, lastSeenAt: true },
    });
  }

  const FLOW_TYPE_PRIORITY: Record<string, number> = {
    retention: 5, upsell: 4, adoption: 3, onboarding: 2, support: 1,
  };

  const matchingRules: typeof activeRules = [];

  for (const rule of activeRules) {
    let matches = false;

    switch (rule.triggerType) {
      case 'page_visit': {
        if (!page) break;
        if (!rule.urlPattern) { matches = true; break; }
        try { matches = new RegExp(rule.urlPattern).test(page); }
        catch { matches = page.includes(rule.urlPattern); }

        // firstTimeOnly: check if user has ever visited this page
        if (matches && rule.firstTimeOnly && endUser) {
          const priorVisit = await prisma.event.findFirst({
            where: {
              organizationId: orgId,
              endUserId: endUser.id,
              eventType: 'page_view',
              properties: { path: page },
            },
          });
          if (priorVisit) matches = false;
        }
        break;
      }

      case 'event_fired': {
        if (event && rule.eventName && event === rule.eventName) matches = true;
        break;
      }

      case 'usage_threshold': {
        // Client sends usagePercent in metadata
        const pct = typeof meta.usagePercent === 'number' ? meta.usagePercent
          : (meta[rule.usageMetric ?? ''] as number | undefined);
        if (pct !== undefined && rule.usagePercent !== null && pct >= rule.usagePercent) {
          matches = true;
        }
        break;
      }

      case 'inactivity': {
        if (!endUser || !rule.daysThreshold) break;
        const daysSinceLastSeen = (Date.now() - endUser.lastSeenAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastSeen >= rule.daysThreshold) matches = true;
        break;
      }

      case 'page_never_visited': {
        if (!endUser || !rule.urlPattern || !rule.daysThreshold) break;
        const daysSinceFirstSeen = endUser
          ? (Date.now() - (await prisma.endUser.findUnique({
              where: { id: endUser.id }, select: { firstSeenAt: true },
            }))!.firstSeenAt.getTime()) / (1000 * 60 * 60 * 24)
          : 0;
        if (daysSinceFirstSeen < rule.daysThreshold) break; // not enough time yet
        let pat: RegExp;
        try { pat = new RegExp(rule.urlPattern); } catch { pat = new RegExp(rule.urlPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); }
        const visited = await prisma.event.findFirst({
          where: { organizationId: orgId, endUserId: endUser.id, eventType: 'page_view' },
        });
        // Crude check: see if any page_view event path matches the pattern
        const visitedMatchingPage = await prisma.event.findFirst({
          where: { organizationId: orgId, endUserId: endUser.id, eventType: 'page_view',
            properties: { path: { string_contains: rule.urlPattern.replace(/[.*+?^${}()|[\]\\]/g, '') } } },
        });
        void visited; // suppress unused warning
        if (!visitedMatchingPage) matches = true;
        void pat; // used above
        break;
      }

      case 'feature_unused': {
        if (!endUser || !rule.featureSlug || !rule.daysThreshold) break;
        const featureEvent = await prisma.event.findFirst({
          where: {
            organizationId: orgId,
            endUserId: endUser.id,
            eventType: `feature_used`,
            properties: { feature: rule.featureSlug },
          },
        });
        if (!featureEvent) {
          const daysSinceFirstSeen = (Date.now() - (await prisma.endUser.findUnique({
            where: { id: endUser.id }, select: { firstSeenAt: true },
          }))!.firstSeenAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceFirstSeen >= rule.daysThreshold) matches = true;
        }
        break;
      }
    }

    if (matches) matchingRules.push(rule);
  }

  if (!matchingRules.length) {
    res.json({ match: null });
    return;
  }

  // Pick highest-priority flow type
  const best = matchingRules.sort(
    (a, b) => (FLOW_TYPE_PRIORITY[b.flow.flowType] ?? 0) - (FLOW_TYPE_PRIORITY[a.flow.flowType] ?? 0)
  )[0];

  res.json({
    match: {
      rule: best,
      flow: best.flow,
    },
  });
});

export default router;
