import { Worker, Job } from 'bullmq';
import { getQueueConnection } from '../connection';
import { JOBS } from '../jobTypes';
import { prisma } from '../../utils/prisma';

const RETENTION_MONTHS = 12;

export async function runEventsRetention(): Promise<void> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);

  const { count } = await prisma.event.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  if (count > 0) {
    console.log(`[events-retention] Deleted ${count} events older than ${RETENTION_MONTHS} months`);
  }
}

export function startEventsRetentionWorker(): Worker | null {
  const connection = getQueueConnection();
  if (!connection) return null;

  const worker = new Worker(JOBS.EVENTS_RETENTION, async (_job: Job) => {
    await runEventsRetention();
  }, { connection });

  worker.on('failed', (_job, err) => {
    console.error('[queue:events_retention] job failed:', err.message);
  });

  return worker;
}
