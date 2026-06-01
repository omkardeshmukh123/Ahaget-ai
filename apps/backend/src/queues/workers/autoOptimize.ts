import { Worker, Job } from 'bullmq';
import { getQueueConnection } from '../connection';
import { JOBS } from '../jobTypes';
import { prisma } from '../../utils/prisma';
import { chatWithFallback } from '../../services/agent/_openai';

const OPTIMIZE_MODEL = 'anthropic/claude-3.5-haiku';

export async function runAutoOptimize(): Promise<void> {
  if (!process.env.OPENROUTER_API_KEY) return;

  const configs = await prisma.autoOptimizeConfig.findMany({
    where: { enabled: true },
    select: { organizationId: true, threshold: true, minSessions: true },
  });

  for (const cfg of configs) {
    const flows = await prisma.onboardingFlow.findMany({
      where: { organizationId: cfg.organizationId, isActive: true },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    for (const flow of flows) {
      for (const step of flow.steps) {
        const rows = await prisma.userStepProgress.findMany({
          where: { stepId: step.id },
          select: { status: true, dropReason: true },
        });

        if (rows.length < cfg.minSessions) continue;

        const completed = rows.filter((r) => r.status === 'completed').length;
        const completionRate = completed / rows.length;
        if (completionRate * 100 >= cfg.threshold) continue;

        const dropReasons: Record<string, number> = {};
        for (const r of rows) {
          if (r.dropReason) dropReasons[r.dropReason] = (dropReasons[r.dropReason] ?? 0) + 1;
        }

        try {
          const response = await chatWithFallback({
            model: OPTIMIZE_MODEL,
            messages: [
              {
                role: 'system',
                content: `You are an expert at improving AI onboarding agent prompts. Return ONLY JSON: {"prompt": "...", "reason": "..."}`,
              },
              {
                role: 'user',
                content: `Step: ${step.title}\nIntent: ${step.intent || 'none'}\nCurrent prompt: ${step.aiPrompt || '(none)'}\nCompletion: ${Math.round(completionRate * 100)}% (${completed}/${rows.length})\nDrop reasons: ${Object.entries(dropReasons).map(([k, v]) => `${k}: ${v}`).join(', ') || 'none'}`,
              },
            ],
            max_tokens: 400,
            temperature: 0.4,
          });

          const raw = response.choices[0]?.message?.content ?? '';
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (!jsonMatch) continue;
          const parsed = JSON.parse(jsonMatch[0]) as { prompt?: string; reason?: string };
          if (!parsed.prompt) continue;

          await prisma.optimizationLog.create({
            data: {
              organizationId:      cfg.organizationId,
              stepId:              step.id,
              flowId:              flow.id,
              triggeredBy:         'auto',
              previousPrompt:      step.aiPrompt || null,
              newPrompt:           parsed.prompt,
              completionRateBefore: completionRate,
              reason:              parsed.reason ?? '',
            },
          });
        } catch (err) {
          console.error(`[auto-optimize] LLM error for step ${step.id}:`, (err as Error).message);
        }
      }
    }

    await prisma.autoOptimizeConfig.update({
      where: { organizationId: cfg.organizationId },
      data:  { lastRunAt: new Date() },
    });
  }

  console.log(`[auto-optimize] Processed ${configs.length} orgs`);
}

export function startAutoOptimizeWorker(): Worker | null {
  const connection = getQueueConnection();
  if (!connection) return null;

  const worker = new Worker(JOBS.AUTO_OPTIMIZE, async (_job: Job) => {
    await runAutoOptimize();
  }, { connection });

  worker.on('failed', (_job, err) => {
    console.error('[queue:auto_optimize] job failed:', err.message);
  });

  return worker;
}
