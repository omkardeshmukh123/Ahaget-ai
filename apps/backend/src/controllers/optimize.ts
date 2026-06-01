import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateJWT } from '../middleware/auth';
import { chatWithFallback } from '../services/agent/_openai';
import { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authenticateJWT);

const OPTIMIZE_MODEL = 'anthropic/claude-3.5-haiku';

// GET /api/v1/optimize/flow?flowId=...
// Returns the steps of the most-sessioned active flow (or a specified one) with completion stats.
router.get('/flow', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  let flowId = req.query.flowId as string | undefined;

  if (!flowId) {
    // Pick the active flow with the most sessions
    const top = await prisma.userOnboardingSession.groupBy({
      by: ['flowId'],
      where: { organizationId: orgId },
      _count: { flowId: true },
      orderBy: { _count: { flowId: 'desc' } },
      take: 1,
    });
    flowId = top[0]?.flowId;
  }

  if (!flowId) {
    res.json({ flowId: null, flowName: null, steps: [] });
    return;
  }

  const flow = await prisma.onboardingFlow.findFirst({
    where: { id: flowId, organizationId: orgId },
    include: { steps: { orderBy: { order: 'asc' } } },
  });

  if (!flow) {
    res.status(404).json({ error: 'Flow not found' });
    return;
  }

  const cfg = await prisma.autoOptimizeConfig.findUnique({
    where: { organizationId: orgId },
  });
  const threshold = cfg?.threshold ?? 50;

  const steps = await Promise.all(
    flow.steps.map(async (step) => {
      const rows = await prisma.userStepProgress.findMany({
        where: { stepId: step.id },
        select: { status: true, messagesCount: true, timeSpentMs: true, dropReason: true, promptSnapshot: true },
      });

      const total     = rows.length;
      const completed = rows.filter((r) => r.status === 'completed').length;
      const dropped   = rows.filter((r) => r.status === 'dropped').length;
      const completionRate = total > 0 ? completed / total : null;

      const totalMessages = rows.reduce((s, r) => s + r.messagesCount, 0);
      const avgMessages   = total > 0 ? Math.round((totalMessages / total) * 10) / 10 : null;

      const completedRows = rows.filter((r) => r.timeSpentMs > 0);
      const avgTimeSecs   = completedRows.length > 0
        ? Math.round(completedRows.reduce((s, r) => s + r.timeSpentMs, 0) / completedRows.length / 1000)
        : null;

      const dropReasons: Record<string, number> = {};
      for (const r of rows) {
        if (r.dropReason) dropReasons[r.dropReason] = (dropReasons[r.dropReason] ?? 0) + 1;
      }

      // Latest prompt snapshot from a completed session
      const latestSnapshot = rows.find((r) => r.promptSnapshot)?.promptSnapshot ?? null;

      const health = completionRate !== null ? Math.round(completionRate * 100) : 50;

      return {
        stepId:   step.id,
        stepTitle: step.title,
        intent:   step.intent,
        order:    step.order,
        isMilestone: step.isMilestone,
        currentPrompt:   step.aiPrompt || null,
        latestSnapshot,
        stats: { total, completed, dropped, completionRate, avgMessages, avgTimeSecs, dropReasons },
        health,
        needsOptimization: completionRate !== null && completionRate * 100 < threshold && total >= 5,
      };
    })
  );

  res.json({ flowId: flow.id, flowName: flow.name, steps });
});

// POST /api/v1/optimize/suggest/:stepId
// Generates an AI-powered prompt suggestion for the step (does NOT apply it).
router.post('/suggest/:stepId', async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { stepId } = req.params;

  if (!process.env.OPENROUTER_API_KEY) {
    res.status(503).json({ message: 'OPENROUTER_API_KEY not configured' });
    return;
  }

  const step = await prisma.onboardingStep.findFirst({
    where: { id: stepId, flow: { organizationId } },
    include: { flow: { select: { id: true, name: true } } },
  });

  if (!step) {
    res.status(404).json({ error: 'Step not found' });
    return;
  }

  const rows = await prisma.userStepProgress.findMany({
    where: { stepId },
    select: { status: true, messagesCount: true, dropReason: true },
  });

  const total     = rows.length;
  const completed = rows.filter((r) => r.status === 'completed').length;
  const completionRate = total > 0 ? completed / total : 0;
  const avgMessages = total > 0 ? Math.round(rows.reduce((s, r) => s + r.messagesCount, 0) / total * 10) / 10 : 0;

  const dropReasons: Record<string, number> = {};
  for (const r of rows) {
    if (r.dropReason) dropReasons[r.dropReason] = (dropReasons[r.dropReason] ?? 0) + 1;
  }

  const dropSummary = Object.entries(dropReasons).map(([k, v]) => `${k}: ${v}`).join(', ');

  const systemPrompt = `You are an expert at improving AI onboarding agent prompts.
Suggest an improved AI prompt for a step with a low completion rate.
Return ONLY a JSON object:
{
  "suggestedPrompt": "the improved prompt text",
  "changes": ["change 1", "change 2"],
  "expectedImpact": "brief description of expected improvement",
  "reasoning": "why these changes will help"
}`;

  const userMsg = `Flow: ${step.flow.name}
Step ${step.order + 1}: ${step.title}
Intent: ${step.intent || 'not set'}
Current prompt: ${step.aiPrompt || '(none set)'}
Completion rate: ${Math.round(completionRate * 100)}% (${completed}/${total} sessions)
Avg messages to complete: ${avgMessages}
Drop reasons: ${dropSummary || 'none recorded'}`;

  const response = await chatWithFallback({
    model: OPTIMIZE_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userMsg },
    ],
    max_tokens: 600,
    temperature: 0.3,
  });

  const raw = response.choices[0]?.message?.content ?? '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    res.status(500).json({ error: 'Failed to parse AI response' });
    return;
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    suggestedPrompt?: string;
    changes?: string[];
    expectedImpact?: string;
    reasoning?: string;
  };

  res.json({
    stepId,
    stepTitle:       step.title,
    currentPrompt:   step.aiPrompt || null,
    suggestedPrompt: parsed.suggestedPrompt ?? '',
    changes:         parsed.changes ?? [],
    expectedImpact:  parsed.expectedImpact ?? '',
    reasoning:       parsed.reasoning ?? '',
    stats:           { total, completed, completionRate, avgMessages },
  });
});

// POST /api/v1/optimize/apply/:stepId
// Applies a new prompt to the step and creates an OptimizationLog entry.
router.post('/apply/:stepId', async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { stepId } = req.params;
  const { prompt } = req.body;

  if (!prompt) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  const step = await prisma.onboardingStep.findFirst({
    where: { id: stepId, flow: { organizationId } },
    include: { flow: { select: { id: true } } },
  });

  if (!step) {
    res.status(404).json({ error: 'Step not found' });
    return;
  }

  const rows = await prisma.userStepProgress.findMany({
    where: { stepId },
    select: { status: true },
  });
  const total = rows.length;
  const completed = rows.filter((r) => r.status === 'completed').length;
  const completionRateBefore = total > 0 ? completed / total : null;

  await Promise.all([
    prisma.onboardingStep.update({
      where: { id: stepId },
      data:  { aiPrompt: String(prompt) },
    }),
    prisma.optimizationLog.create({
      data: {
        organizationId,
        stepId,
        flowId:              step.flow.id,
        triggeredBy:         'manual',
        previousPrompt:      step.aiPrompt || null,
        newPrompt:           String(prompt),
        completionRateBefore,
        reason:              'Applied via manual optimization UI',
      },
    }),
  ]);

  res.json({ applied: true, stepId });
});

export default router;
