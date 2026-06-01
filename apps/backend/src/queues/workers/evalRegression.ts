import { Worker, Job } from 'bullmq';
import * as Sentry from '@sentry/node';
import { getQueueConnection } from '../connection';
import { JOBS } from '../jobTypes';
import { prisma } from '../../utils/prisma';

const FIRST_TURN_THRESHOLD  = 60; // alert if below 60%
const SELECTOR_THRESHOLD    = 90; // alert if below 90%

async function runEvalRegressionCheck() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const rows = await prisma.agentEvalLog.findMany({
    where: { createdAt: { gte: since } },
    select: { isInit: true, stepCompletedOnTurn: true, selectorValid: true },
  });

  if (rows.length < 10) return; // not enough data to be meaningful

  const initTurns = rows.filter((r) => r.isInit);
  const firstTurnCompletionRate = initTurns.length > 0
    ? Math.round((initTurns.filter((r) => r.stepCompletedOnTurn).length / initTurns.length) * 100)
    : null;

  const selectorRows = rows.filter((r) => r.selectorValid !== null);
  const selectorSuccessRate = selectorRows.length > 0
    ? Math.round((selectorRows.filter((r) => r.selectorValid === true).length / selectorRows.length) * 100)
    : null;

  const alerts: string[] = [];

  if (firstTurnCompletionRate !== null && firstTurnCompletionRate < FIRST_TURN_THRESHOLD) {
    alerts.push(`firstTurnCompletionRate=${firstTurnCompletionRate}% is below ${FIRST_TURN_THRESHOLD}% threshold`);
  }
  if (selectorSuccessRate !== null && selectorSuccessRate < SELECTOR_THRESHOLD) {
    alerts.push(`selectorSuccessRate=${selectorSuccessRate}% is below ${SELECTOR_THRESHOLD}% threshold`);
  }

  if (alerts.length > 0) {
    const msg = `[eval-regression] KPI alert (7d window, ${rows.length} turns): ${alerts.join('; ')}`;
    console.error(msg);
    Sentry.captureMessage(msg, 'warning');
  } else {
    console.log(`[eval-regression] KPIs OK — firstTurn=${firstTurnCompletionRate ?? 'n/a'}%, selector=${selectorSuccessRate ?? 'n/a'}% (${rows.length} turns, 7d)`);
  }
}

export function startEvalRegressionWorker(): Worker | null {
  const connection = getQueueConnection();
  if (!connection) return null;

  const worker = new Worker(JOBS.EVAL_REGRESSION, async (_job: Job) => {
    await runEvalRegressionCheck();
  }, { connection });

  worker.on('failed', (_job, err) => {
    console.error('[queue:eval_regression] job failed:', err.message);
  });

  return worker;
}

// Export for use in setTimeout fallback path
export { runEvalRegressionCheck };
