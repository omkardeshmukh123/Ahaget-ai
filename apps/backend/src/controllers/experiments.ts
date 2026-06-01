import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateJWT } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authenticateJWT);

// GET /api/v1/experiments
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;

  const experiments = await prisma.flowExperiment.findMany({
    where: { organizationId: orgId },
    include: {
      controlFlow: { select: { id: true, name: true } },
      variantFlow:  { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const enriched = await Promise.all(
    experiments.map(async (exp) => {
      const [controlSessions, variantSessions] = await Promise.all([
        prisma.userOnboardingSession.count({
          where: { experimentId: exp.id, experimentVariant: 'control' },
        }),
        prisma.userOnboardingSession.count({
          where: { experimentId: exp.id, experimentVariant: 'variant' },
        }),
      ]);
      return {
        id:              exp.id,
        name:            exp.name,
        status:          exp.status,
        trafficSplit:    exp.trafficSplit,
        winnerId:        exp.winnerId,
        startedAt:       exp.startedAt,
        concludedAt:     exp.concludedAt,
        controlFlow:     exp.controlFlow,
        variantFlow:     exp.variantFlow,
        controlSessions,
        variantSessions,
      };
    })
  );

  res.json({ experiments: enriched });
});

// POST /api/v1/experiments
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const { name, controlFlowId, variantFlowId, trafficSplit } = req.body;

  if (!name || !controlFlowId || !variantFlowId) {
    res.status(400).json({ error: 'name, controlFlowId, and variantFlowId are required' });
    return;
  }
  if (controlFlowId === variantFlowId) {
    res.status(400).json({ error: 'Control and variant must be different flows' });
    return;
  }

  const split = Math.max(0, Math.min(100, parseInt(String(trafficSplit ?? 50), 10) || 50));

  const [controlFlow, variantFlow] = await Promise.all([
    prisma.onboardingFlow.findFirst({ where: { id: controlFlowId, organizationId: orgId } }),
    prisma.onboardingFlow.findFirst({ where: { id: variantFlowId, organizationId: orgId } }),
  ]);

  if (!controlFlow || !variantFlow) {
    res.status(404).json({ error: 'One or both flows not found' });
    return;
  }

  const experiment = await prisma.flowExperiment.create({
    data: {
      organizationId: orgId,
      name:           String(name),
      controlFlowId,
      variantFlowId,
      trafficSplit:   split,
      status:         'running',
    },
    include: {
      controlFlow: { select: { id: true, name: true } },
      variantFlow:  { select: { id: true, name: true } },
    },
  });

  res.status(201).json({ experiment });
});

// GET /api/v1/experiments/:id/results
router.get('/:id/results', async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = req.params;

  const experiment = await prisma.flowExperiment.findFirst({
    where: { id, organizationId },
    include: {
      controlFlow: {
        select: {
          id: true, name: true,
          steps: { orderBy: { order: 'asc' }, select: { id: true, title: true, order: true } },
        },
      },
      variantFlow: {
        select: {
          id: true, name: true,
          steps: { orderBy: { order: 'asc' }, select: { id: true, title: true, order: true } },
        },
      },
    },
  });

  if (!experiment) {
    res.status(404).json({ error: 'Experiment not found' });
    return;
  }

  async function armStats(variant: string, flowSteps: Array<{ id: string; title: string; order: number }>) {
    const sessions = await prisma.userOnboardingSession.findMany({
      where: { experimentId: id, experimentVariant: variant, organizationId },
      select: {
        status:      true,
        startedAt:   true,
        completedAt: true,
        stepProgress: { select: { stepId: true, status: true } },
      },
    });

    const total     = sessions.length;
    const completed = sessions.filter((s) => s.status === 'completed').length;
    const completionRate = total > 0 ? completed / total : 0;

    const completedMs = sessions.reduce((acc, s) => {
      if (!s.completedAt) return acc;
      return acc + (new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime());
    }, 0);
    const avgTimeMs = completed > 0 ? Math.round(completedMs / completed) : null;

    const stepStats = flowSteps.map(({ id: stepId, title, order }) => {
      const started = sessions.filter((s) =>
        s.stepProgress.some((p) => p.stepId === stepId)
      ).length;
      const done = sessions.filter((s) =>
        s.stepProgress.some((p) => p.stepId === stepId && p.status === 'completed')
      ).length;
      return { stepId, title, order, completionRate: started > 0 ? done / started : 0 };
    });

    return { total, completed, completionRate, avgTimeMs, stepStats };
  }

  const [control, variant] = await Promise.all([
    armStats('control', experiment.controlFlow.steps),
    armStats('variant', experiment.variantFlow.steps),
  ]);

  // Two-proportion z-test
  const n1 = control.total, x1 = control.completed;
  const n2 = variant.total, x2 = variant.completed;
  let zScore = 0;
  let significant = false;
  if (n1 >= 10 && n2 >= 10) {
    const p  = (x1 + x2) / (n1 + n2);
    const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
    if (se > 0) {
      zScore = (variant.completionRate - control.completionRate) / se;
      significant = Math.abs(zScore) >= 1.96;
    }
  }

  const lift = control.completionRate > 0
    ? ((variant.completionRate - control.completionRate) / control.completionRate) * 100
    : null;

  res.json({
    experiment: {
      id:           experiment.id,
      name:         experiment.name,
      status:       experiment.status,
      trafficSplit: experiment.trafficSplit,
      winnerId:     experiment.winnerId,
      startedAt:    experiment.startedAt,
      concludedAt:  experiment.concludedAt,
      controlFlow:  { id: experiment.controlFlow.id, name: experiment.controlFlow.name },
      variantFlow:  { id: experiment.variantFlow.id,  name: experiment.variantFlow.name },
    },
    control,
    variant,
    significant,
    zScore: Math.round(zScore * 100) / 100,
    lift:   lift !== null ? Math.round(lift * 10) / 10 : null,
  });
});

// PUT /api/v1/experiments/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = req.params;
  const { status, winnerId } = req.body;

  const existing = await prisma.flowExperiment.findFirst({
    where: { id, organizationId },
  });
  if (!existing) {
    res.status(404).json({ error: 'Experiment not found' });
    return;
  }

  const data: Record<string, unknown> = {};
  if (status && ['running', 'paused', 'concluded'].includes(String(status))) {
    data.status = status;
    if (status === 'concluded') data.concludedAt = new Date();
  }
  if (winnerId !== undefined) {
    data.winnerId = winnerId ?? null;
  }

  const experiment = await prisma.flowExperiment.update({
    where: { id },
    data,
    include: {
      controlFlow: { select: { id: true, name: true } },
      variantFlow:  { select: { id: true, name: true } },
    },
  });

  res.json({ experiment });
});

export default router;
