// Rate limiter per org, per month.
// Uses Upstash Redis INCR when configured; falls back to in-memory Map (single-process only).

import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { PLANS } from '../utils/plans';
import { AuthenticatedRequest } from '../types';
import { redisIncr } from '../utils/redis';

// Per-org per-minute API rate limits by plan tier (requests per minute)
const ORG_RATE_LIMITS: Record<string, number> = {
  free:    10,
  starter: 30,
  growth:  60,
  scale:  100,
};

const _rlFallback = new Map<string, { count: number; resetAt: number }>();
const ORG_RL_WINDOW_S = 60;

export async function enforceOrgRateLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const org = req.organization;
  if (!org) { next(); return; }

  const plan = PLANS[org.planType] ?? PLANS.free;
  const limit = ORG_RATE_LIMITS[org.planType] ?? ORG_RATE_LIMITS.free;
  const key = `org:rl:${org.id}`;

  const redisCount = await redisIncr(key, ORG_RL_WINDOW_S);
  if (redisCount !== null) {
    if (redisCount > limit) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        limit,
        plan: plan.name,
        retryAfterSeconds: ORG_RL_WINDOW_S,
      });
      return;
    }
    next();
    return;
  }

  // In-memory fallback
  const now = Date.now();
  const entry = _rlFallback.get(key);
  if (!entry || now >= entry.resetAt) {
    _rlFallback.set(key, { count: 1, resetAt: now + ORG_RL_WINDOW_S * 1000 });
    next();
    return;
  }
  entry.count++;
  if (entry.count > limit) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      limit,
      plan: plan.name,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    });
    return;
  }
  next();
}

// --- Redis client (optional) ------------------------------------------------
let _redis: import('@upstash/redis').Redis | null = null;
export function getRedis(): import('@upstash/redis').Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { Redis } = require('@upstash/redis');
  _redis = new Redis({ url, token }) as import('@upstash/redis').Redis;
  return _redis;
}

// In-memory fallback: { orgId_YYYY-MM → count }
const counts = new Map<string, number>();

function monthKey(orgId: string): string {
  const now = new Date();
  return `rl:msg:${orgId}_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function secondsUntilEndOfMonth(): number {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
  return Math.ceil((endOfMonth.getTime() - now.getTime()) / 1000);
}

async function incrementUsage(key: string): Promise<number> {
  const redis = getRedis();
  if (redis) {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, secondsUntilEndOfMonth());
    }
    return count;
  }
  const next = (counts.get(key) ?? 0) + 1;
  counts.set(key, next);
  return next;
}

export async function enforceMessageLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const org = req.organization;
  if (!org) { next(); return; }

  const key = monthKey(org.id);
  const used = await incrementUsage(key);

  if (used > org.monthlyMessageLimit) {
    res.status(429).json({
      error: 'Monthly message limit reached',
      limit: org.monthlyMessageLimit,
      used: used - 1,
      upgradeUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/settings/billing`,
    });
    return;
  }

  next();
}

// --- Monthly session-message counter (Redis-backed, DB fallback) -------------
export async function getSessionMsgCount(orgId: string): Promise<number> {
  const redis = getRedis();
  if (redis) {
    const key = monthKey(orgId);
    const val = await redis.get<number>(key);
    if (val !== null) return Number(val);
  }
  return getSessionMsgCountFromDb(orgId);
}

export async function incrementSessionMsgCount(orgId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const key = monthKey(orgId);
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, secondsUntilEndOfMonth());
}

async function getSessionMsgCountFromDb(orgId: string): Promise<number> {
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  type UsageRow = { message_count: bigint };
  const rows = await prisma.$queryRaw<UsageRow[]>`
    SELECT message_count FROM org_monthly_usage
    WHERE  organization_id = ${orgId} AND month = ${month} LIMIT 1`;
  if (rows.length > 0) return Number(rows[0].message_count);
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  return prisma.sessionMessage.count({
    where: { session: { organizationId: orgId }, role: 'assistant', createdAt: { gte: start } },
  });
}

// Called by analytics routes for the dashboard. Reads from the mat view
// (refreshed every 5 min) so it never triggers a full table scan.
export async function getMonthlyUsage(orgId: string): Promise<number> {
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  type UsageRow = { message_count: bigint };
  const rows = await prisma.$queryRaw<UsageRow[]>`
    SELECT message_count FROM org_monthly_usage
    WHERE  organization_id = ${orgId} AND month = ${month} LIMIT 1`;
  if (rows.length > 0) return Number(rows[0].message_count);
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  return prisma.message.count({
    where: { role: 'assistant', conversation: { organizationId: orgId }, createdAt: { gte: start } },
  });
}

// --- MTU (Monthly Tracked Users) ---------------------------------------------
// Reads from org_monthly_mtu mat view; falls back to live COUNT.
export async function getMtuUsage(orgId: string): Promise<number> {
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  type MtuRow = { unique_users: bigint };
  const rows = await prisma.$queryRaw<MtuRow[]>`
    SELECT unique_users FROM org_monthly_mtu
    WHERE  organization_id = ${orgId} AND month = ${month} LIMIT 1`;
  if (rows.length > 0) return Number(rows[0].unique_users);
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  return prisma.endUser.count({
    where: { organizationId: orgId, lastSeenAt: { gte: start } },
  });
}

// Refreshes both materialized views concurrently (non-blocking reads during refresh).
// Called from the 5-minute cron in index.ts.
export async function refreshUsageMatViews(): Promise<void> {
  await Promise.all([
    prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY org_monthly_usage'),
    prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY org_monthly_mtu'),
  ]);
}

// Enforce MTU limit � call this before creating or touching an end user record.
// Pass `isNewUser: true` when the end user doesn't exist yet (first session).
export async function enforceMtuLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const org = req.organization;
  if (!org) { next(); return; }

  const plan = PLANS[org.planType] ?? PLANS.free;
  if (plan.mtuLimit === 0) { next(); return; } // unlimited

  // Only block genuinely new users � existing ones already counted
  const userId = (req.body?.userId ?? req.query?.userId) as string | undefined;
  if (!userId) { next(); return; }

  const existing = await prisma.endUser.findUnique({
    where: { organizationId_externalId: { organizationId: org.id, externalId: userId } },
    select: { id: true, lastSeenAt: true },
  });

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  // Existing user already seen this month � let them through (already counted)
  if (existing && existing.lastSeenAt >= monthStart) {
    next(); return;
  }

  // New user or returning from a prior month � check if there's room
  const used = await getMtuUsage(org.id);
  if (used >= plan.mtuLimit) {
    res.status(429).json({
      error: 'Monthly Tracked User limit reached',
      limit: plan.mtuLimit,
      used,
      upgradeUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/settings/billing`,
    });
    return;
  }

  next();
}

// --- Agent (flow) limit -------------------------------------------------------
// Returns an error string when the org is at limit, null when they can create.
export async function checkAgentLimit(orgId: string): Promise<string | null> {
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { planType: true } });
  const plan = PLANS[org?.planType ?? 'free'] ?? PLANS.free;
  if (plan.agentLimit === 0) return null; // unlimited

  const count = await prisma.onboardingFlow.count({ where: { organizationId: orgId } });
  if (count >= plan.agentLimit) {
    return `Agent limit reached (${plan.agentLimit} on the ${plan.name} plan). Upgrade to create more.`;
  }
  return null;
}

// --- MCP connector limit ------------------------------------------------------
export async function checkMcpConnectorLimit(orgId: string): Promise<string | null> {
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { planType: true } });
  const plan = PLANS[org?.planType ?? 'free'] ?? PLANS.free;
  if (plan.mcpConnectorLimit === 0) return null;

  const count = await prisma.mcpConnector.count({ where: { organizationId: orgId } });
  if (count >= plan.mcpConnectorLimit) {
    return `MCP connector limit reached (${plan.mcpConnectorLimit} on the ${plan.name} plan). Upgrade to add more.`;
  }
  return null;
}
