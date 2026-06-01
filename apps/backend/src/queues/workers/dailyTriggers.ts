import { Worker, Job } from 'bullmq';
import { getQueueConnection } from '../connection';
import { JOBS } from '../jobTypes';
import { prisma } from '../../utils/prisma';

async function runDailyTriggers() {
  console.log('[triggers] Running daily server-side trigger evaluation...');
  const rules = await prisma.triggerRule.findMany({
    where: { isActive: true, triggerType: { in: ['inactivity', 'feature_unused', 'page_never_visited'] } },
    include: { flow: { select: { id: true, name: true, flowType: true, organizationId: true } } },
  });
  console.log(`[triggers] Evaluating ${rules.length} server-side rules`);
  // Per-rule evaluation is handled on-demand via /evaluate at widget init.
  // This cron is a hook for future push notifications (Phase 3).
}

export function startDailyTriggersWorker(): Worker | null {
  const connection = getQueueConnection();
  if (!connection) return null;

  const worker = new Worker(JOBS.DAILY_TRIGGERS, async (_job: Job) => {
    await runDailyTriggers();
  }, { connection });

  worker.on('failed', (_job, err) => {
    console.error('[queue:daily_triggers] job failed:', err.message);
  });

  return worker;
}
