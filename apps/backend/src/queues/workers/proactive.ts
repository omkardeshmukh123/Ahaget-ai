import { Worker, Job } from 'bullmq';
import { getQueueConnection } from '../connection';
import { JOBS } from '../jobTypes';
import { runProactiveMessaging } from '../../services/proactive';

export function startProactiveWorker(): Worker | null {
  const connection = getQueueConnection();
  if (!connection) return null;

  const worker = new Worker(JOBS.PROACTIVE, async (_job: Job) => {
    await runProactiveMessaging();
  }, { connection });

  worker.on('failed', (_job, err) => {
    console.error('[queue:proactive] job failed:', err.message);
  });

  return worker;
}
