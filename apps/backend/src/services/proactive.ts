/**
 * proactive.ts — AI employee initiates outreach
 *
 * Runs on a daily cron (see index.ts). For each org:
 *   1. Loads active inactivity + feature_unused trigger rules
 *   2. Finds end users who match the conditions
 *   3. Deduplicates (max 1 proactive message per user per 48 hours)
 *   4. Sends: in-app badge (via DB flag) + out-of-app email (via Resend)
 *   5. Records each send in proactive_messages
 *
 * In-app badge: stored in a separate fetch from the widget via
 *   GET /api/v1/proactive/pending?userId=...&apiKey=...
 */

import { prisma } from '../utils/prisma';
import { sendProactiveEmail } from '../utils/email';

const APP_URL = process.env.APP_URL ?? process.env.FRONTEND_URL ?? 'https://app.ahaget.ai';
const DEDUP_HOURS = 48;

export async function runProactiveMessaging(): Promise<void> {
  console.log('[proactive] Starting daily proactive messaging run...');

  try {
    // Load all active inactivity + feature_unused + page_never_visited rules
    const rules = await prisma.triggerRule.findMany({
      where: {
        isActive: true,
        triggerType: { in: ['inactivity', 'feature_unused', 'page_never_visited'] },
      },
      include: {
        flow: { select: { id: true, name: true, organizationId: true, isActive: true, flowType: true } },
        organization: { select: { id: true, name: true, users: { where: { role: 'admin' }, select: { email: true }, take: 1 } } },
      },
    });

    console.log(`[proactive] Evaluating ${rules.length} server-side rules`);

    for (const rule of rules) {
      if (!rule.flow.isActive) continue;

      const orgId = rule.organizationId;
      const now = Date.now();

      // ── Find qualifying end users ──────────────────────────────────────────
      let qualifyingUsers: Array<{ id: string; externalId: string | null; email: string | null; unsubscribed: boolean; lastSeenAt: Date; firstSeenAt: Date }> = [];

      if (rule.triggerType === 'inactivity' && rule.daysThreshold) {
        const cutoff = new Date(now - rule.daysThreshold * 24 * 60 * 60 * 1000);
        qualifyingUsers = await prisma.endUser.findMany({
          where: { organizationId: orgId, lastSeenAt: { lt: cutoff }, unsubscribed: false },
          select: { id: true, externalId: true, email: true, unsubscribed: true, lastSeenAt: true, firstSeenAt: true },
          take: 200, // process up to 200 users per rule per day
        });
      } else if (rule.triggerType === 'feature_unused' && rule.featureSlug && rule.daysThreshold) {
        // Users who have never fired a feature_used event for this slug + old enough account
        const minAge = new Date(now - rule.daysThreshold * 24 * 60 * 60 * 1000);
        const allUsers = await prisma.endUser.findMany({
          where: { organizationId: orgId, firstSeenAt: { lt: minAge }, unsubscribed: false },
          select: { id: true, externalId: true, email: true, unsubscribed: true, lastSeenAt: true, firstSeenAt: true },
          take: 200,
        });
        // Filter out those who have already used the feature
        const featureUsers = await prisma.event.findMany({
          where: {
            organizationId: orgId,
            eventType: 'feature_used',
            properties: { path: ['feature'], equals: rule.featureSlug },
          },
          select: { endUserId: true },
          distinct: ['endUserId'],
        });
        const usedSet = new Set(featureUsers.map((e) => e.endUserId));
        qualifyingUsers = allUsers.filter((u) => !usedSet.has(u.id));
      }

      if (!qualifyingUsers.length) continue;

      // ── Process each user ─────────────────────────────────────────────────
      for (const user of qualifyingUsers) {
        // Deduplication: skip if we already sent within DEDUP_HOURS
        const recent = await prisma.proactiveMessage.findFirst({
          where: {
            endUserId: user.id,
            sentAt: { gt: new Date(now - DEDUP_HOURS * 60 * 60 * 1000) },
          },
        });
        if (recent) continue;

        // Build message body
        const { subject, bodyHtml } = buildMessageBody(rule, user, rule.flow.name);
        const deepLink = buildDeepLink(rule.flow.id, user.externalId);
        const unsubscribeUrl = `${APP_URL}/api/v1/proactive/unsubscribe?userId=${encodeURIComponent(user.id)}`;

        // ── 1. Record in-app proactive message ────────────────────────────
        await prisma.proactiveMessage.create({
          data: {
            organizationId: orgId,
            endUserId: user.id,
            flowId: rule.flowId,
            triggerRuleId: rule.id,
            channel: 'in_app',
            subject,
            bodySnippet: bodyHtml.replace(/<[^>]+>/g, '').slice(0, 200),
            deepLink,
            status: 'sent',
          },
        });

        // ── 2. Send email if user has an email address ─────────────────────
        if (user.email) {
          try {
            await sendProactiveEmail({ to: user.email, subject, bodyHtml, deepLink, unsubscribeUrl });
            await prisma.proactiveMessage.create({
              data: {
                organizationId: orgId,
                endUserId: user.id,
                flowId: rule.flowId,
                triggerRuleId: rule.id,
                channel: 'email',
                subject,
                bodySnippet: bodyHtml.replace(/<[^>]+>/g, '').slice(0, 200),
                deepLink,
                status: 'sent',
              },
            });
          } catch (err) {
            console.error(`[proactive] Email send failed for user ${user.id}:`, err);
          }
        }
      }
    }

    console.log('[proactive] Daily run complete');
  } catch (err) {
    console.error('[proactive] Run failed:', err);
    throw err;
  }
}

// ─── Message body builder ─────────────────────────────────────────────────────

function buildMessageBody(
  rule: { triggerType: string; daysThreshold: number | null; featureSlug: string | null; flow: { name: string } },
  user: { lastSeenAt: Date },
  flowName: string
): { subject: string; bodyHtml: string } {
  switch (rule.triggerType) {
    case 'inactivity': {
      const days = rule.daysThreshold ?? 8;
      return {
        subject: `Your AI employee misses you — pick up where you left off`,
        bodyHtml: `
<p style="margin:0 0 12px;color:#1e293b;font-size:15px;line-height:1.6;">
  It's been ${days}+ days since you were last in the product. Your AI employee has been waiting.
</p>
<p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.6;">
  I can pick up right where you left off — no need to remember what you were doing.
  Click below and I'll have context pre-loaded for you.
</p>`,
      };
    }
    case 'feature_unused': {
      return {
        subject: `You've been doing this manually — your AI employee can automate it`,
        bodyHtml: `
<p style="margin:0 0 12px;color:#1e293b;font-size:15px;line-height:1.6;">
  I noticed you haven't used <strong>${rule.featureSlug ?? 'this feature'}</strong> yet,
  even though it could save you time every week.
</p>
<p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.6;">
  Let me show you how it works and set it up for you in under 2 minutes.
</p>`,
      };
    }
    default: {
      return {
        subject: `Your AI employee has something for you`,
        bodyHtml: `
<p style="margin:0 0 12px;color:#1e293b;font-size:15px;line-height:1.6;">
  Your AI employee noticed something relevant and wants to help you.
  Jump back in and I'll explain.
</p>`,
      };
    }
  }
}

function buildDeepLink(flowId: string, externalUserId: string | null): string {
  const base = process.env.PRODUCT_APP_URL ?? APP_URL;
  const params = new URLSearchParams({ ahaget_resume: flowId });
  if (externalUserId) params.set('uid', externalUserId);
  return `${base}?${params}`;
}
