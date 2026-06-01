import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateJWT } from '../middleware/auth';
import { chatWithFallback } from '../services/agent/_openai';
import { AuthenticatedRequest } from '../types';

const router = Router();
router.use(authenticateJWT);

const OPTIMIZE_MODEL = 'anthropic/claude-3.5-haiku';

// GET /api/v1/autooptimize/settings
router.get('/settings', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const cfg = await prisma.autoOptimizeConfig.findUnique({ where: { organizationId: orgId } });
  res.json({
    enabled:    cfg?.enabled    ?? false,
    threshold:  cfg?.threshold  ?? 50,
    minSessions: cfg?.minSessions ?? 10,
    lastRunAt:  cfg?.lastRunAt?.toISOString() ?? null,
  });
});

// PUT /api/v1/autooptimize/settings
router.put('/settings', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const { enabled, threshold, minSessions } = req.body;

  const data: Record<string, unknown> = {};
  if (enabled    !== undefined) data.enabled    = Boolean(enabled);
  if (threshold  !== undefined) data.threshold  = Math.max(0, Math.min(100, Number(threshold)));
  if (minSessions !== undefined) data.minSessions = Math.max(1, Number(minSessions));

  const cfg = await prisma.autoOptimizeConfig.upsert({
    where:  { organizationId: orgId },
    create: { organizationId: orgId, ...data },
    update: data,
  });

  res.json({
    enabled:     cfg.enabled,
    threshold:   cfg.threshold,
    minSessions: cfg.minSessions,
    lastRunAt:   cfg.lastRunAt?.toISOString() ?? null,
  });
});

// POST /api/v1/autooptimize/run
// Finds underperforming steps and generates AI prompt suggestions (does not auto-apply).
router.post('/run', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;

  if (!process.env.OPENROUTER_API_KEY) {
    res.status(503).json({ message: 'OPENROUTER_API_KEY not configured' });
    return;
  }

  const cfg = await prisma.autoOptimizeConfig.findUnique({ where: { organizationId: orgId } });
  const threshold   = cfg?.threshold   ?? 50;
  const minSessions = cfg?.minSessions ?? 10;

  // Get all active flows with their steps
  const flows = await prisma.onboardingFlow.findMany({
    where: { organizationId: orgId, isActive: true },
    include: { steps: { orderBy: { order: 'asc' } } },
  });

  const optimized: Array<{
    stepId: string;
    stepTitle: string;
    completionRateBefore: number;
    previousPrompt: string | null;
    newPrompt: string;
    reason: string;
  }> = [];

  let stepsScanned  = 0;
  let stepsSkipped  = 0;

  for (const flow of flows) {
    for (const step of flow.steps) {
      stepsScanned++;

      const progressRows = await prisma.userStepProgress.findMany({
        where: { stepId: step.id },
        select: { status: true, messagesCount: true, dropReason: true },
      });

      if (progressRows.length < minSessions) {
        stepsSkipped++;
        continue;
      }

      const completedCount = progressRows.filter((p) => p.status === 'completed').length;
      const completionRate = completedCount / progressRows.length;

      if (completionRate * 100 >= threshold) {
        stepsSkipped++;
        continue;
      }

      // Build drop reason summary
      const dropReasons: Record<string, number> = {};
      for (const p of progressRows) {
        if (p.dropReason) dropReasons[p.dropReason] = (dropReasons[p.dropReason] ?? 0) + 1;
      }

      const dropSummary = Object.entries(dropReasons)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');

      const systemPrompt = `You are an expert at improving AI onboarding agent prompts.
Given a step in an onboarding flow that has a low completion rate, suggest an improved AI prompt.

Rules:
- Keep the same intent and goal
- Make it clearer and more actionable
- Address the specific drop reasons if available
- Return ONLY a JSON object: {"prompt": "...", "reason": "..."}
- prompt: the new AI prompt text (concise, max 3 sentences)
- reason: one sentence explaining what changed and why`;

      const userMsg = `Step: ${step.title}
Intent: ${step.intent || 'none'}
Current AI prompt: ${step.aiPrompt || '(none)'}
Completion rate: ${Math.round(completionRate * 100)}% (${completedCount}/${progressRows.length} sessions)
Drop reasons: ${dropSummary || 'unknown'}`;

      try {
        const response = await chatWithFallback({
          model: OPTIMIZE_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userMsg },
          ],
          max_tokens: 400,
          temperature: 0.4,
        });

        const raw = response.choices[0]?.message?.content ?? '';
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          stepsSkipped++;
          continue;
        }

        const parsed = JSON.parse(jsonMatch[0]) as { prompt?: string; reason?: string };
        if (!parsed.prompt) {
          stepsSkipped++;
          continue;
        }

        await prisma.optimizationLog.create({
          data: {
            organizationId:      orgId,
            stepId:              step.id,
            flowId:              flow.id,
            triggeredBy:         'manual',
            previousPrompt:      step.aiPrompt || null,
            newPrompt:           parsed.prompt,
            completionRateBefore: completionRate,
            reason:              parsed.reason ?? '',
          },
        });

        optimized.push({
          stepId:              step.id,
          stepTitle:           step.title,
          completionRateBefore: completionRate,
          previousPrompt:      step.aiPrompt || null,
          newPrompt:           parsed.prompt,
          reason:              parsed.reason ?? '',
        });
      } catch {
        stepsSkipped++;
      }
    }
  }

  await prisma.autoOptimizeConfig.upsert({
    where:  { organizationId: orgId },
    create: { organizationId: orgId, lastRunAt: new Date() },
    update: { lastRunAt: new Date() },
  });

  res.json({
    stepsScanned,
    stepsOptimized: optimized.length,
    stepsSkipped,
    optimized,
  });
});

// GET /api/v1/autooptimize/log
router.get('/log', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const limit = Math.min(Number(req.query.limit ?? 50), 200);

  const [logs, total] = await Promise.all([
    prisma.optimizationLog.findMany({
      where:   { organizationId: orgId },
      orderBy: { appliedAt: 'desc' },
      take:    limit,
      include: {
        step: { select: { title: true, intent: true } },
      },
    }),
    prisma.optimizationLog.count({ where: { organizationId: orgId } }),
  ]);

  res.json({
    logs: logs.map((l) => ({
      id:                   l.id,
      stepId:               l.stepId,
      stepTitle:            l.step.title,
      stepIntent:           l.step.intent,
      triggeredBy:          l.triggeredBy,
      completionRateBefore: l.completionRateBefore,
      previousPrompt:       l.previousPrompt,
      newPrompt:            l.newPrompt,
      reason:               l.reason,
      appliedAt:            l.appliedAt.toISOString(),
    })),
    total,
  });
});

export default router;
