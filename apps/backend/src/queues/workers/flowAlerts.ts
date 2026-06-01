import { Worker, Job } from 'bullmq';
import { getQueueConnection } from '../connection';
import { JOBS } from '../jobTypes';
import { checkFlowAlerts } from '../../services/alerting';

export function startFlowAlertsWorker(): Worker | null {
  const connection = getQueueConnection();
  if (!connection) return null;

  const worker = new Worker(JOBS.FLOW_ALERTS, async (_job: Job) => {
    await checkFlowAlerts();
  }, { connection });

  worker.on('failed', (_job, err) => {
    console.error('[queue:flow_alerts] job failed:', err.message);
  });

  return worker;
}
