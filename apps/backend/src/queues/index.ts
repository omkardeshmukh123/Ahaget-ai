import { Queue } from 'bullmq';
import { getQueueConnection, isQueueEnabled } from './connection';
import { JOBS } from './jobTypes';
import { startFlowAlertsWorker } from './workers/flowAlerts';
import { startKbRefreshWorker } from './workers/kbRefresh';
import { startProactiveWorker } from './workers/proactive';
import { startSessionSweepWorker } from './workers/sessionSweep';
import { startDailyTriggersWorker } from './workers/dailyTriggers';
import { startEvalRegressionWorker } from './workers/evalRegression';
import { startMcpToolCallWorker } from './workers/mcpToolCall';
import { startUsageLimitAlertWorker } from './workers/usageLimitAlert';
import { startEventsRetentionWorker } from './workers/eventsRetention';
import { startAutoOptimizeWorker } from './workers/autoOptimize';

export { getMcpQueue } from './workers/mcpToolCall';
export { isQueueEnabled } from './connection';

// ─── Recurring job schedules ──────────────────────────────────────────────────

const SCHEDULES: Record<string, string> = {
  [JOBS.FLOW_ALERTS]:     '0 * * * *',      // every hour
  [JOBS.KB_REFRESH]:      '0 */6 * * *',    // every 6 hours
  [JOBS.PROACTIVE]:       '0 0 * * *',      // daily at midnight
  [JOBS.DAILY_TRIGGERS]:  '0 1 * * *',      // daily at 1am
  [JOBS.SESSION_SWEEP]:   '*/5 * * * *',    // every 5 minutes
  [JOBS.EVAL_REGRESSION]:   '0 9 * * 1',      // Monday at 9am
  [JOBS.USAGE_LIMIT_ALERT]: '0 8 * * *',      // daily at 8am
  [JOBS.EVENTS_RETENTION]:  '0 3 1 * *',      // monthly, 1st at 3am
  [JOBS.AUTO_OPTIMIZE]:     '0 2 * * 0',      // weekly, Sunday at 2am
};

/**
 * Boot all BullMQ workers and schedule recurring jobs.
 * No-op when REDIS_URL is not configured.
 */
export async function bootQueues(): Promise<void> {
  if (!isQueueEnabled()) {
    console.log('[queue] REDIS_URL not set — BullMQ disabled, falling back to setTimeout crons');
    return;
  }

  const connection = getQueueConnection()!;

  // Start workers
  startFlowAlertsWorker();
  startKbRefreshWorker();
  startProactiveWorker();
  startSessionSweepWorker();
  startDailyTriggersWorker();
  startEvalRegressionWorker();
  startMcpToolCallWorker();
  startUsageLimitAlertWorker();
  startEventsRetentionWorker();
  startAutoOptimizeWorker();

  // Schedule recurring jobs (upsert — safe to call on every boot)
  // Each Queue is closed after scheduling to avoid idle Redis connections.
  for (const [jobName, cron] of Object.entries(SCHEDULES)) {
    const queue = new Queue(jobName, { connection });
    await queue.upsertJobScheduler(
      `${jobName}:recurring`,
      { pattern: cron },
      { name: jobName, data: {}, opts: { removeOnComplete: 10, removeOnFail: 20 } }
    );
    await queue.close();
  }

  console.log('[queue] BullMQ workers started — recurring jobs scheduled');
}
