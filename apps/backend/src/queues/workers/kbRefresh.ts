import { Worker, Job } from 'bullmq';
import { getQueueConnection } from '../connection';
import { JOBS } from '../jobTypes';
import { runKbRefresh } from '../../jobs/kbRefresh';

export function startKbRefreshWorker(): Worker | null {
  const connection = getQueueConnection();
  if (!connection) return null;

  const worker = new Worker(JOBS.KB_REFRESH, async (_job: Job) => {
    await runKbRefresh();
  }, { connection });

  worker.on('failed', (_job, err) => {
    console.error('[queue:kb_refresh] job failed:', err.message);
  });

  return worker;
}
