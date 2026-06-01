import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateJWT } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authenticateJWT);

const INACTIVITY_HIGH_DAYS    = 7;
const INACTIVITY_MEDIUM_DAYS  = 14;
const INACTIVITY_CRITICAL_DAYS = 30;

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

function scoreSession(s: {
  status: string;
  lastActiveAt: Date;
  firstValueAt: Date | null;
  stepProgress: Array<{ status: string }>;
  totalSteps: number;
}): { score: number; factors: string[]; recommendation: string } {
  let score = 0;
  const factors: string[] = [];
  const inactive = daysSince(s.lastActiveAt);

  if (s.status === 'abandoned') {
    score += 25;
    factors.push('Session abandoned');
  }

  if (inactive >= INACTIVITY_CRITICAL_DAYS) {
    score += 45;
    factors.push(`No activity for ${inactive} days`);
  } else if (inactive >= INACTIVITY_MEDIUM_DAYS) {
    score += 30;
    factors.push(`Inactive for ${inactive} days`);
  } else if (inactive >= INACTIVITY_HIGH_DAYS) {
    score += 15;
    factors.push(`No activity for ${inactive} days`);
  }

  if (!s.firstValueAt) {
    score += 15;
    factors.push('Has not reached first value milestone');
  }

  const completed = s.stepProgress.filter((p) => p.status === 'completed').length;
  const progress = s.totalSteps > 0 ? completed / s.totalSteps : 0;
  if (progress < 0.3 && s.totalSteps > 0) {
    score += 15;
    factors.push(`Low progress (${Math.round(progress * 100)}% of steps done)`);
  }

  const clamped = Math.min(100, score);

  let recommendation: string;
  if (clamped >= 70) {
    recommendation = 'Send immediate retention flow — critical churn risk';
  } else if (clamped >= 50) {
    recommendation = 'Trigger proactive re-engagement message';
  } else if (clamped >= 30) {
    recommendation = 'Schedule a check-in flow within the next 3 days';
  } else {
    recommendation = 'Monitor — no immediate action needed';
  }

  return { score: clamped, factors, recommendation };
}

// GET /api/v1/churn/at-risk
router.get('/at-risk', async (req: AuthenticatedRequest, res: Response) => {
  const orgId     = req.user!.organizationId;
  const minScore  = Math.max(0, Math.min(100,
    parseInt(String(req.query.minScore ?? '30'), 10) || 30));

  const sessions = await prisma.userOnboardingSession.findMany({
    where: { organizationId: orgId, status: { in: ['active', 'abandoned'] } },
    include: {
      flow:    { select: { name: true, steps: { select: { id: true } } } },
      endUser: { select: { externalId: true, metadata: true, firstSeenAt: true } },
      stepProgress: { select: { status: true } },
    },
    orderBy: { lastActiveAt: 'asc' },
    take: 500,
  });

  const scored = sessions
    .map((s) => {
      const totalSteps = s.flow.steps.length;
      const { score, factors, recommendation } = scoreSession({
        status:       s.status,
        lastActiveAt: s.lastActiveAt,
        firstValueAt: s.firstValueAt,
        stepProgress: s.stepProgress,
        totalSteps,
      });

      const completedSteps = s.stepProgress.filter((p) => p.status === 'completed').length;

      return {
        sessionId:       s.id,
        userId:          s.endUser.externalId,
        userMetadata:    s.endUser.metadata as Record<string, unknown>,
        flowName:        s.flow.name,
        status:          s.status,
        stepsCompleted:  completedSteps,
        totalSteps,
        progressFraction: totalSteps > 0 ? completedSteps / totalSteps : 0,
        lastActiveAt:    s.lastActiveAt.toISOString(),
        startedAt:       s.startedAt.toISOString(),
        firstSeenAt:     s.endUser.firstSeenAt.toISOString(),
        currentStepId:   s.currentStepId,
        score,
        risk: score >= 70 ? 'critical' : score >= 50 ? 'high' : score >= 30 ? 'medium' : 'low',
        factors,
        recommendation,
      };
    })
    .filter((u) => u.score >= minScore)
    .sort((a, b) => b.score - a.score);

  res.json({
    users: scored,
    breakdown: {
      critical: scored.filter((u) => u.risk === 'critical').length,
      high:     scored.filter((u) => u.risk === 'high').length,
      medium:   scored.filter((u) => u.risk === 'medium').length,
      total:    scored.length,
    },
  });
});

// GET /api/v1/churn/summary
router.get('/summary', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;

  const sessions = await prisma.userOnboardingSession.findMany({
    where: { organizationId: orgId, status: { in: ['active', 'abandoned'] } },
    include: {
      flow:         { select: { steps: { select: { id: true } } } },
      stepProgress: { select: { status: true } },
    },
    take: 500,
  });

  let critical = 0, high = 0, medium = 0, low = 0;

  for (const s of sessions) {
    const { score } = scoreSession({
      status:       s.status,
      lastActiveAt: s.lastActiveAt,
      firstValueAt: s.firstValueAt,
      stepProgress: s.stepProgress,
      totalSteps:   s.flow.steps.length,
    });
    if (score >= 70)      critical++;
    else if (score >= 50) high++;
    else if (score >= 30) medium++;
    else                   low++;
  }

  res.json({
    total:    sessions.length,
    breakdown: { critical, high, medium, low },
    atRisk:   critical + high + medium,
  });
});

export default router;
