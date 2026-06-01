import { Worker, Job } from 'bullmq';
import { getQueueConnection } from '../connection';
import { JOBS } from '../jobTypes';
import { prisma } from '../../utils/prisma';
import { PLANS } from '../../utils/plans';
import { getMtuUsage } from '../../middleware/rateLimit';
import { sendUsageLimitEmail } from '../../utils/email';

export async function runUsageLimitAlert(): Promise<void> {
  console.log('[usage-limit-alert] Running daily MTU limit check...');

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const orgs = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      planType: true,
      limitAlert80SentAt: true,
      limitAlert100SentAt: true,
      users: {
        where: { role: 'owner' },
        select: { email: true },
        take: 1,
      },
    },
  });

  let checked = 0;
  let alerted = 0;

  for (const org of orgs) {
    const plan = PLANS[org.planType];
    if (!plan || plan.mtuLimit === 0) continue; // unlimited or unknown plan

    const ownerEmail = org.users[0]?.email;
    if (!ownerEmail) continue;

    const mtuUsed = await getMtuUsage(org.id);
    const pct = mtuUsed / plan.mtuLimit;
    checked++;

    // 100% threshold — sent at most once per billing month
    if (pct >= 1.0) {
      const alreadySent = org.limitAlert100SentAt && org.limitAlert100SentAt >= monthStart;
      if (!alreadySent) {
        try {
          await sendUsageLimitEmail({
            to: ownerEmail,
            orgName: org.name,
            mtuUsed,
            mtuLimit: plan.mtuLimit,
            threshold: 100,
          });
          await prisma.organization.update({
            where: { id: org.id },
            data: { limitAlert100SentAt: new Date() },
          });
          alerted++;
          console.log(`[usage-limit-alert] Sent 100% alert to ${ownerEmail} (org ${org.id})`);
        } catch (err) {
          console.error(`[usage-limit-alert] Failed to send 100% alert for org ${org.id}:`, err);
        }
      }
      continue; // skip 80% check when already at 100%
    }

    // 80% threshold — sent at most once per billing month
    if (pct >= 0.8) {
      const alreadySent = org.limitAlert80SentAt && org.limitAlert80SentAt >= monthStart;
      if (!alreadySent) {
        try {
          await sendUsageLimitEmail({
            to: ownerEmail,
            orgName: org.name,
            mtuUsed,
            mtuLimit: plan.mtuLimit,
            threshold: 80,
          });
          await prisma.organization.update({
            where: { id: org.id },
            data: { limitAlert80SentAt: new Date() },
          });
          alerted++;
          console.log(`[usage-limit-alert] Sent 80% alert to ${ownerEmail} (org ${org.id})`);
        } catch (err) {
          console.error(`[usage-limit-alert] Failed to send 80% alert for org ${org.id}:`, err);
        }
      }
    }
  }

  console.log(`[usage-limit-alert] Done — checked ${checked} orgs, sent ${alerted} alerts`);
}

export function startUsageLimitAlertWorker(): Worker | null {
  const connection = getQueueConnection();
  if (!connection) return null;

  const worker = new Worker(JOBS.USAGE_LIMIT_ALERT, async (_job: Job) => {
    await runUsageLimitAlert();
  }, { connection });

  worker.on('failed', (_job, err) => {
    console.error('[queue:usage_limit_alert] job failed:', err.message);
  });

  return worker;
}
