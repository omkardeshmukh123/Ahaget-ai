import { Worker, Job } from 'bullmq';
import { getQueueConnection } from '../connection';
import { JOBS } from '../jobTypes';
import { prisma } from '../../utils/prisma';

const ABANDON_THRESHOLD_MS = 30 * 60 * 1000;

async function sweepAbandonedSessions() {
  const cutoff = new Date(Date.now() - ABANDON_THRESHOLD_MS);
  const stale = await prisma.userOnboardingSession.findMany({
    where: { status: 'active', lastActiveAt: { lt: cutoff } },
    select: { id: true, currentStepId: true },
    take: 200,
  });
  if (stale.length === 0) return;

  const sessionIds = stale.map((s) => s.id);
  await prisma.userOnboardingSession.updateMany({
    where: { id: { in: sessionIds } },
    data: { status: 'abandoned' },
  });

  for (const s of stale) {
    if (!s.currentStepId) continue;
    await prisma.userStepProgress.updateMany({
      where: { sessionId: s.id, stepId: s.currentStepId, status: 'in_progress' },
      data: { outcome: 'dropped', dropReason: 'idle_timeout' },
    });
  }

  console.log(`[sweeper] Marked ${stale.length} sessions abandoned`);
}

export function startSessionSweepWorker(): Worker | null {
  const connection = getQueueConnection();
  if (!connection) return null;

  const worker = new Worker(JOBS.SESSION_SWEEP, async (_job: Job) => {
    await sweepAbandonedSessions();
  }, { connection });

  worker.on('failed', (_job, err) => {
    console.error('[queue:session_sweep] job failed:', err.message);
  });

  return worker;
}
