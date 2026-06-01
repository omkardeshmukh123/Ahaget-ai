// Rate limiter per org, per month.
// Uses Upstash Redis INCR when configured; falls back to in-memory Map (single-process only).

import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { PLANS } from '../utils/plans';
import { AuthenticatedRequest } from '../types';

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

// Called by analytics routes to get current usage for the dashboard
export async function getMonthlyUsage(orgId: string): Promise<number> {
  // Count from DB � accurate even after server restarts
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  return prisma.message.count({
    where: {
      role: 'assistant',          // one per AI response
      conversation: { organizationId: orgId },
      createdAt: { gte: start },
    },
  });
}

// --- MTU (Monthly Tracked Users) ---------------------------------------------
// Count unique end users seen this calendar month.
export async function getMtuUsage(orgId: string): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  return prisma.endUser.count({
    where: { organizationId: orgId, lastSeenAt: { gte: start } },
  });
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
