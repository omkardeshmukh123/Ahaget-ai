import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateJWT } from '../middleware/auth';
import { requireFeature } from '../middleware/planGate';
import { AuthenticatedRequest } from '../types';

const router = Router();

// 60-second in-memory cache keyed by "orgId:days"
const chokeCache = new Map<string, { data: unknown; expiresAt: number }>();
const chokeInflight = new Map<string, Promise<unknown>>();

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

function classifyIntent(text: string): 'how_to' | 'stuck' | 'navigation' | 'question' | 'other' {
  const t = text.toLowerCase();
  if (/\bhow\b/.test(t) || /steps to/.test(t)) return 'how_to';
  if (/can'?t|cannot|error|broken|doesn'?t work|not working|fail|issue|problem|stuck/.test(t)) return 'stuck';
  if (/\bwhere\b|\bfind\b|\bnavigate\b|\bgo to\b|\btake me\b|\bshow me\b/.test(t)) return 'navigation';
  if (/\bwhat\b|\bwhy\b|\bwhich\b|\bexplain\b|\btell me\b|\bdoes\b/.test(t) || t.includes('?')) return 'question';
  return 'other';
}

function computeSeverityScore({
  dropRate,
  avgAttempts,
  avgTimeStuckSecs,
  negFeedbackRate,
}: {
  dropRate: number;
  avgAttempts: number;
  avgTimeStuckSecs: number;
  negFeedbackRate: number;
}): number {
  const attemptsNorm = Math.min(avgAttempts / 5, 1) * 100;
  const timeNorm = Math.min(avgTimeStuckSecs / 120, 1) * 100;
  return Math.round(
    dropRate * 0.40 +
    attemptsNorm * 0.25 +
    timeNorm * 0.20 +
    negFeedbackRate * 0.15,
  );
}

function severityLabel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

// ─── GET /api/v1/analytics/overview ─────────────────────────────────────────
router.get('/overview', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalConversations,
    conversationsThisWeek,
    totalMessages,
    activeUsers,
    closedConversations,
  ] = await Promise.all([
    prisma.conversation.count({ where: { organizationId } }),
    prisma.conversation.count({
      where: { organizationId, startedAt: { gte: sevenDaysAgo } },
    }),
    prisma.message.count({
      where: { conversation: { organizationId } },
    }),
    prisma.endUser.count({
      where: { organizationId, lastSeenAt: { gte: thirtyDaysAgo } },
    }),
    prisma.conversation.count({
      where: { organizationId, status: 'closed' },
    }),
  ]);

  const avgMessagesPerConv =
    totalConversations > 0
      ? Math.round((totalMessages / totalConversations) * 10) / 10
      : 0;

  const conversionRate =
    totalConversations > 0
      ? Math.round((closedConversations / totalConversations) * 100) / 100
      : 0;

  res.json({
    totalConversations,
    conversationsThisWeek,
    activeUsers,
    avgMessagesPerConv,
    conversionRate,
    periodDays: 30,
  });
});

// ─── GET /api/v1/analytics/timeline?days=30 ──────────────────────────────────
router.get('/timeline', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const days = Math.min(parseInt(req.query.days as string) || 30, 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Raw SQL for grouping by date (Ahageta doesn't have groupBy date truncation)
  const rows = await prisma.$queryRaw<Array<{ date: Date; conversations: bigint }>>`
    SELECT
      DATE_TRUNC('day', "started_at") AS date,
      COUNT(*)::bigint                AS conversations
    FROM conversations
    WHERE organization_id = ${organizationId}
      AND started_at >= ${since}
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  // Fill in missing days with 0
  const map = new Map(rows.map((r) => [r.date.toISOString().slice(0, 10), Number(r.conversations)]));
  const timeline = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    timeline.push({ date: key, conversations: map.get(key) ?? 0 });
  }

  res.json(timeline);
});

// ─── GET /api/v1/analytics/triggers ──────────────────────────────────────────
// Breakdown of what triggered conversations (idle, exit_intent, manual)
router.get('/triggers', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;

  const rows = await prisma.conversation.groupBy({
    by: ['triggeredBy'],
    where: { organizationId },
    _count: { id: true },
  });

  const data = rows.map((r) => ({
    trigger: r.triggeredBy ?? 'manual',
    count: r._count.id,
  }));

  res.json(data);
});

// ─── GET /api/v1/analytics/intents?days=30 ───────────────────────────────────
// Surfaces what users actually typed in the widget — grouped by normalised text,
// classified by intent category, sorted by frequency.
// Intent categories: how_to | stuck | navigation | question | other
router.get('/intents', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const days = Math.min(parseInt(req.query.days as string) || 30, 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const pageFilter = req.query.page as string | undefined;

  const messages = await prisma.sessionMessage.findMany({
    where: {
      role: 'user',
      createdAt: { gte: since },
      session: {
        organizationId,
        ...(pageFilter ? { pageUrl: { contains: pageFilter } } : {}),
      },
    },
    select: {
      content: true,
      createdAt: true,
      session: { select: { pageUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 2000,
  });

  // Skip internal widget system messages — never expose these in intent analytics
  const SKIP = new Set(['__init__', '__verify__']);

  // Group by normalised content
  const map = new Map<string, { raw: string; count: number; lastSeen: Date; intent: ReturnType<typeof classifyIntent>; pageUrl: string | null }>();
  for (const msg of messages) {
    const norm = normalise(msg.content);
    if (!norm || SKIP.has(norm)) continue;
    if (!map.has(norm)) {
      map.set(norm, { raw: msg.content.trim().slice(0, 200), count: 0, lastSeen: msg.createdAt, intent: classifyIntent(norm), pageUrl: msg.session.pageUrl });
    }
    const entry = map.get(norm)!;
    entry.count++;
    if (msg.createdAt > entry.lastSeen) entry.lastSeen = msg.createdAt;
  }

  // Sort by count desc, take top 100
  const questions = [...map.entries()]
    .map(([, v]) => v)
    .sort((a, b) => b.count - a.count)
    .slice(0, 100);

  // Category summary
  const categorySummary: Record<string, number> = { how_to: 0, stuck: 0, navigation: 0, question: 0, other: 0 };
  for (const q of questions) categorySummary[q.intent] += q.count;

  const pageMap = new Map<string, number>();
  for (const q of questions) {
    if (q.pageUrl) {
      pageMap.set(q.pageUrl, (pageMap.get(q.pageUrl) ?? 0) + q.count);
    }
  }
  const pages = [...pageMap.entries()]
    .map(([url, questionCount]) => ({ url, questionCount }))
    .sort((a, b) => b.questionCount - a.questionCount);

  res.json({ questions, categorySummary, totalMessages: messages.length, days, pages });
});

// ─── GET /api/v1/analytics/health ────────────────────────────────────────────
// Agent health: last 10 sessions, 24-h success rate, avg step response time
router.get('/health', authenticateJWT, requireFeature('agentHealth'), async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const since7d  = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);

  // Last 10 sessions (any status) ordered by most recent activity
  const recentSessions = await prisma.userOnboardingSession.findMany({
    where: { organizationId },
    orderBy: { lastActiveAt: 'desc' },
    take: 10,
    include: {
      flow: { select: { name: true } },
      endUser: { select: { externalId: true } },
    },
  });

  // 24-h session counts for success rate
  const [total24h, completed24h] = await Promise.all([
    prisma.userOnboardingSession.count({
      where: { organizationId, startedAt: { gte: since24h } },
    }),
    prisma.userOnboardingSession.count({
      where: { organizationId, startedAt: { gte: since24h }, status: 'completed' },
    }),
  ]);

  // Fall back to 7-day window if no 24-h sessions
  const useFallback = total24h === 0;
  const [totalWindow, completedWindow] = useFallback
    ? await Promise.all([
        prisma.userOnboardingSession.count({
          where: { organizationId, startedAt: { gte: since7d } },
        }),
        prisma.userOnboardingSession.count({
          where: { organizationId, startedAt: { gte: since7d }, status: 'completed' },
        }),
      ])
    : [total24h, completed24h];

  const successRate = totalWindow > 0 ? Math.round((completedWindow / totalWindow) * 100) : null;

  // Avg time-spent per completed step (proxy for "AI response time per turn")
  const avgResult = await prisma.userStepProgress.aggregate({
    where: {
      status: 'completed',
      timeSpentMs: { gt: 0 },
      session: { organizationId, startedAt: { gte: useFallback ? since7d : since24h } },
    },
    _avg: { timeSpentMs: true },
  });
  const avgResponseMs = avgResult._avg.timeSpentMs
    ? Math.round(avgResult._avg.timeSpentMs)
    : null;

  // Status signal
  let status: 'green' | 'yellow' | 'red' | 'unknown';
  if (successRate === null) {
    status = 'unknown';
  } else if (successRate >= 60) {
    status = 'green';
  } else if (successRate >= 20) {
    status = 'yellow';
  } else {
    status = 'red';
  }

  res.json({
    status,
    successRate,
    totalSessions: totalWindow,
    completedSessions: completedWindow,
    avgResponseMs,
    windowHours: useFallback ? 168 : 24,
    sessions: recentSessions.map((s) => ({
      id: s.id,
      status: s.status,
      flowName: s.flow.name,
      userId: s.endUser.externalId,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      lastActiveAt: s.lastActiveAt,
    })),
  });
});

// ─── GET /api/v1/analytics/insights ──────────────────────────────────────────
// Surfaces actionable insight cards from user message patterns and overview stats.
// Each insight has a type, severity, title, description, count, and example quotes.
router.get('/insights', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const days = 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [messages, totalConversations, totalMessages] = await Promise.all([
    prisma.message.findMany({
      where: { role: 'user', createdAt: { gte: since }, conversation: { organizationId } },
      select: { content: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 2000,
    }),
    prisma.conversation.count({ where: { organizationId } }),
    prisma.message.count({ where: { conversation: { organizationId } } }),
  ]);

  const SKIP = new Set(['__init__', '__verify__']);
  const map = new Map<string, { raw: string; count: number; lastSeen: Date; intent: ReturnType<typeof classifyIntent> }>();

  for (const msg of messages) {
    const norm = normalise(msg.content);
    if (!norm || SKIP.has(norm)) continue;
    if (!map.has(norm)) {
      map.set(norm, { raw: msg.content.trim().slice(0, 200), count: 0, lastSeen: msg.createdAt, intent: classifyIntent(norm) });
    }
    const entry = map.get(norm)!;
    entry.count++;
    if (msg.createdAt > entry.lastSeen) entry.lastSeen = msg.createdAt;
  }

  const questions = [...map.values()].sort((a, b) => b.count - a.count);

  type InsightSeverity = 'high' | 'medium' | 'low';
  type InsightType = 'pain_point' | 'knowledge_gap' | 'navigation_confusion' | 'frequent_question' | 'low_engagement';

  interface Insight {
    id: string;
    type: InsightType;
    severity: InsightSeverity;
    title: string;
    description: string;
    count: number;
    examples: string[];
    detectedAt: string;
  }

  const insights: Insight[] = [];

  // Pain points — stuck intents
  const stuckItems = questions.filter((q) => q.intent === 'stuck');
  if (stuckItems.length > 0) {
    const top = stuckItems.slice(0, 5);
    const totalCount = stuckItems.reduce((s, q) => s + q.count, 0);
    insights.push({
      id: 'pain_points',
      type: 'pain_point',
      severity: totalCount >= 10 ? 'high' : totalCount >= 3 ? 'medium' : 'low',
      title: 'Users are hitting blockers',
      description: `${stuckItems.length} distinct issues reported across ${totalCount} messages. Users are unable to complete actions and expressing frustration.`,
      count: totalCount,
      examples: top.map((q) => q.raw),
      detectedAt: stuckItems[0].lastSeen.toISOString(),
    });
  }

  // Knowledge gaps — how_to intents
  const howToItems = questions.filter((q) => q.intent === 'how_to');
  if (howToItems.length > 0) {
    const top = howToItems.slice(0, 5);
    const totalCount = howToItems.reduce((s, q) => s + q.count, 0);
    insights.push({
      id: 'knowledge_gaps',
      type: 'knowledge_gap',
      severity: totalCount >= 15 ? 'high' : totalCount >= 5 ? 'medium' : 'low',
      title: 'Users need step-by-step guidance',
      description: `${howToItems.length} how-to questions asked ${totalCount} times. Consider adding these to your knowledge base or improving your AI instructions.`,
      count: totalCount,
      examples: top.map((q) => q.raw),
      detectedAt: howToItems[0].lastSeen.toISOString(),
    });
  }

  // Navigation confusion
  const navItems = questions.filter((q) => q.intent === 'navigation');
  if (navItems.length > 0) {
    const top = navItems.slice(0, 5);
    const totalCount = navItems.reduce((s, q) => s + q.count, 0);
    insights.push({
      id: 'navigation_confusion',
      type: 'navigation_confusion',
      severity: totalCount >= 10 ? 'high' : totalCount >= 3 ? 'medium' : 'low',
      title: 'Users struggle to find things',
      description: `${navItems.length} navigation questions asked ${totalCount} times. Users can't locate key features or pages in your product.`,
      count: totalCount,
      examples: top.map((q) => q.raw),
      detectedAt: navItems[0].lastSeen.toISOString(),
    });
  }

  // Frequent questions — general question intent
  const questionItems = questions.filter((q) => q.intent === 'question' && q.count >= 2);
  if (questionItems.length > 0) {
    const top = questionItems.slice(0, 5);
    const totalCount = questionItems.reduce((s, q) => s + q.count, 0);
    insights.push({
      id: 'frequent_questions',
      type: 'frequent_question',
      severity: 'low',
      title: 'Recurring questions detected',
      description: `${questionItems.length} questions asked multiple times. These could be addressed in your product UI or documentation.`,
      count: totalCount,
      examples: top.map((q) => q.raw),
      detectedAt: questionItems[0].lastSeen.toISOString(),
    });
  }

  // Low engagement signal
  const avgMessages = totalConversations > 0 ? totalMessages / totalConversations : 0;
  if (totalConversations >= 5 && avgMessages < 3) {
    insights.push({
      id: 'low_engagement',
      type: 'low_engagement',
      severity: 'medium',
      title: 'Short conversations — users disengaging quickly',
      description: `Average of ${avgMessages.toFixed(1)} messages per conversation. Users may not be finding value in the AI assistant. Review your AI instructions and knowledge base.`,
      count: totalConversations,
      examples: [],
      detectedAt: new Date().toISOString(),
    });
  }

  // Sort: high → medium → low
  const order: InsightSeverity[] = ['high', 'medium', 'low'];
  insights.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));

  res.json({ insights, generatedAt: new Date().toISOString(), days });
});

// ─── GET /api/v1/analytics/lifecycle ─────────────────────────────────────────
// Single endpoint for the Lifecycle funnel view in the dashboard.
// Returns counts for each stage (onboarding | adoption | upsell | retention | support)
// and calculates stage drop-off rates.
router.get('/lifecycle', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { period = '30d' } = req.query as { period?: string };
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const stages = ['onboarding', 'adoption', 'upsell', 'retention', 'support'] as const;

  // Session counts per stage
  const stageCounts = await Promise.all(
    stages.map((stage) =>
      prisma.userOnboardingSession.count({
        where: { organizationId, startedAt: { gte: since }, flow: { flowType: stage } },
      })
    )
  );

  const stageCompleted = await Promise.all(
    stages.map((stage) =>
      prisma.userOnboardingSession.count({
        where: { organizationId, startedAt: { gte: since }, status: 'completed', flow: { flowType: stage } },
      })
    )
  );

  // Proactive outreach for retention stage
  const [proactiveSent, proactiveOpened, proactiveClicked] = await Promise.all([
    prisma.proactiveMessage.count({ where: { organizationId, sentAt: { gte: since } } }),
    prisma.proactiveMessage.count({ where: { organizationId, sentAt: { gte: since }, status: { in: ['opened', 'clicked'] } } }),
    prisma.proactiveMessage.count({ where: { organizationId, sentAt: { gte: since }, status: 'clicked' } }),
  ]);

  // Upsell attribution for expansion stage
  const [upsellPitched, upsellConverted, upsellMrr] = await Promise.all([
    prisma.upsellAttribution.count({ where: { organizationId, suggestedAt: { gte: since } } }),
    prisma.upsellAttribution.count({ where: { organizationId, suggestedAt: { gte: since }, status: 'confirmed' } }),
    prisma.upsellAttribution.aggregate({
      where: { organizationId, status: 'confirmed', confirmedAt: { gte: since } },
      _sum: { mrr: true },
    }),
  ]);

  const stageData = stages.map((stage, i) => ({
    stage,
    started: stageCounts[i],
    completed: stageCompleted[i],
    completionRate: stageCounts[i] > 0 ? Math.round((stageCompleted[i] / stageCounts[i]) * 100) : 0,
  }));

  // Total unique users who have any session in the window
  const uniqueUsers = await prisma.endUser.count({
    where: { organizationId, lastSeenAt: { gte: since } },
  });

  res.json({
    period,
    uniqueUsers,
    stages: stageData,
    proactive: {
      sent: proactiveSent,
      opened: proactiveOpened,
      clicked: proactiveClicked,
      openRate: proactiveSent > 0 ? Math.round((proactiveOpened / proactiveSent) * 100) : 0,
      clickRate: proactiveSent > 0 ? Math.round((proactiveClicked / proactiveSent) * 100) : 0,
    },
    expansion: {
      pitched: upsellPitched,
      converted: upsellConverted,
      attributedMrr: Math.round((upsellMrr._sum.mrr ?? 0) * 100) / 100,
      conversionRate: upsellPitched > 0 ? Math.round((upsellConverted / upsellPitched) * 100) : 0,
    },
  });
});

// ─── GET /api/v1/analytics/intents/export?days=30&page= ──────────────────────
router.get('/intents/export', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const days = Math.min(parseInt(req.query.days as string) || 30, 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const pageFilter = req.query.page as string | undefined;

  const messages = await prisma.sessionMessage.findMany({
    where: {
      role: 'user',
      createdAt: { gte: since },
      session: {
        organizationId,
        ...(pageFilter ? { pageUrl: { contains: pageFilter } } : {}),
      },
    },
    select: {
      content: true,
      createdAt: true,
      session: { select: { pageUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const SKIP = new Set(['__init__', '__verify__']);
  const map = new Map<string, { raw: string; count: number; lastSeen: Date; intent: ReturnType<typeof classifyIntent>; pageUrl: string | null }>();
  for (const msg of messages) {
    const norm = normalise(msg.content);
    if (!norm || SKIP.has(norm)) continue;
    if (!map.has(norm)) {
      map.set(norm, { raw: msg.content.trim().slice(0, 200), count: 0, lastSeen: msg.createdAt, intent: classifyIntent(norm), pageUrl: msg.session.pageUrl });
    }
    const entry = map.get(norm)!;
    entry.count++;
    if (msg.createdAt > entry.lastSeen) entry.lastSeen = msg.createdAt;
  }

  const rows = [...map.values()].sort((a, b) => b.count - a.count);

  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines: string[] = ['question,count,intent,lastSeen,page'];
  for (const r of rows) {
    lines.push([escape(r.raw), r.count, r.intent, r.lastSeen.toISOString(), escape(r.pageUrl ?? '')].join(','));
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="questions.csv"');
  res.send(lines.join('\n'));
});

// ─── GET /api/v1/analytics/choke-points?days=30 ──────────────────────────────
// Ranked list of flow steps where users struggle most, with composite severity.
router.get('/choke-points', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const days = Math.min(parseInt(req.query.days as string) || 30, 90);
  const cacheKey = `${organizationId}:${days}`;

  const hit = chokeCache.get(cacheKey);
  if (hit && Date.now() < hit.expiresAt) {
    res.json(hit.data);
    return;
  }

  const inflight = chokeInflight.get(cacheKey);
  if (inflight) {
    res.json(await inflight);
    return;
  }

  try {
    const computePromise = (async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const priorSince = new Date(Date.now() - 2 * days * 24 * 60 * 60 * 1000);

      // Fetch all steps belonging to this org
      const steps = await prisma.onboardingStep.findMany({
        where: { flow: { organizationId } },
        select: {
          id: true,
          title: true,
          order: true,
          actionType: true,
          flow: { select: { id: true, name: true } },
        },
      });

      const chokePoints = await Promise.all(
        steps.map(async (step) => {
          const [started, completed, droppedProgress] = await Promise.all([
            prisma.userStepProgress.count({
              where: {
                stepId: step.id,
                session: { startedAt: { gte: since } },
                status: { in: ['in_progress', 'completed', 'skipped'] },
              },
            }),
            prisma.userStepProgress.count({
              where: {
                stepId: step.id,
                session: { startedAt: { gte: since } },
                status: 'completed',
              },
            }),
            prisma.userStepProgress.findMany({
              where: {
                stepId: step.id,
                session: { startedAt: { gte: since } },
                outcome: 'dropped',
              },
              select: { attempts: true, timeSpentMs: true, sessionId: true },
              take: 500,
            }),
          ]);

          if (started < 3) return null;

          const dropRate = Math.round(((started - completed) / started) * 100);

          const avgAttempts =
            droppedProgress.length > 0
              ? droppedProgress.reduce((s, p) => s + p.attempts, 0) / droppedProgress.length
              : 0;

          const avgTimeStuckSecs =
            droppedProgress.length > 0
              ? Math.round(
                  droppedProgress.reduce((s, p) => s + p.timeSpentMs, 0) /
                    droppedProgress.length /
                    1000,
                )
              : 0;

          const [negMessages, totalMessages] = await Promise.all([
            prisma.sessionMessage.count({
              where: { stepId: step.id, feedback: -1, session: { startedAt: { gte: since } } },
            }),
            prisma.sessionMessage.count({
              where: { stepId: step.id, session: { startedAt: { gte: since } } },
            }),
          ]);

          const negFeedbackRate =
            totalMessages > 0 ? Math.round((negMessages / totalMessages) * 100) : 0;

          const score = computeSeverityScore({
            dropRate,
            avgAttempts,
            avgTimeStuckSecs,
            negFeedbackRate,
          });

          // Example user messages from dropped sessions (distinct, max 3)
          const droppedSessionIds = droppedProgress.slice(0, 20).map((p) => p.sessionId);
          const exampleMessages =
            droppedSessionIds.length > 0
              ? (
                  await prisma.sessionMessage.findMany({
                    where: {
                      stepId: step.id,
                      role: 'user',
                      sessionId: { in: droppedSessionIds },
                      content: { notIn: ['__init__', '__verify__'] },
                    },
                    select: { content: true },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                  })
                )
                  .map((m) => m.content.trim().slice(0, 200))
                  .filter((c, i, arr) => arr.indexOf(c) === i)
                  .slice(0, 3)
              : [];

          // Trend: compare drop_rate to prior period
          const [priorStarted, priorCompleted] = await Promise.all([
            prisma.userStepProgress.count({
              where: {
                stepId: step.id,
                session: { startedAt: { gte: priorSince, lt: since } },
                status: { in: ['in_progress', 'completed', 'skipped'] },
              },
            }),
            prisma.userStepProgress.count({
              where: {
                stepId: step.id,
                session: { startedAt: { gte: priorSince, lt: since } },
                status: 'completed',
              },
            }),
          ]);

          let trend: 'worsening' | 'improving' | 'stable' | 'new';
          if (priorStarted < 3) {
            trend = 'new';
          } else {
            const priorDropRate = Math.round(
              ((priorStarted - priorCompleted) / priorStarted) * 100,
            );
            const delta = dropRate - priorDropRate;
            trend = delta > 5 ? 'worsening' : delta < -5 ? 'improving' : 'stable';
          }

          return {
            step_id: step.id,
            step_title: step.title,
            flow_id: step.flow.id,
            flow_name: step.flow.name,
            action_type: step.actionType,
            field_choke: step.actionType === 'fill_form',
            frequency: started,
            drop_rate: dropRate,
            avg_attempts: Math.round(avgAttempts * 10) / 10,
            avg_time_stuck_secs: avgTimeStuckSecs,
            neg_feedback_rate: negFeedbackRate,
            severity_score: score,
            severity_label: severityLabel(score),
            example_messages: exampleMessages,
            trend,
          };
        }),
      );

      const ranked = chokePoints
        .filter((cp): cp is NonNullable<typeof cp> => cp !== null)
        .sort((a, b) => b.severity_score - a.severity_score)
        .map((cp, i) => ({ rank: i + 1, ...cp }));

      // Page summary: top URLs by session count in the window
      const pageSessions = await prisma.userOnboardingSession.groupBy({
        by: ['pageUrl'],
        where: { organizationId, startedAt: { gte: since }, pageUrl: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      const pageSummary = pageSessions
        .filter((r) => r.pageUrl)
        .map((r) => ({ url: r.pageUrl!, sessions: r._count.id }));

      const result = { choke_points: ranked, page_summary: pageSummary, generated_at: new Date().toISOString(), days };
      chokeCache.set(cacheKey, { data: result, expiresAt: Date.now() + 60_000 });
      chokeInflight.delete(cacheKey);
      return result;
    })();

    chokeInflight.set(cacheKey, computePromise);
    res.json(await computePromise);
  } catch (err) {
    chokeInflight.delete(cacheKey);
    console.error('choke-points error:', err);
    res.status(500).json({ error: 'Failed to compute choke points' });
  }
});

export default router;
