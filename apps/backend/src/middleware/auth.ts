import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import { AuthenticatedRequest } from '../types';
import { getRedis } from '../utils/redis';

const API_KEY_CACHE_TTL = 60; // seconds
const cacheKey = (k: string) => `org:apikey:${k}`;

// Used by the JS widget — validates X-API-Key header
export async function authenticateApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({ error: 'API key required' });
    return;
  }

  // Check Redis cache first to avoid a DB round-trip on every widget request
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get<string>(cacheKey(apiKey));
      if (cached) {
        req.organization = JSON.parse(cached);
        next();
        return;
      }
    } catch {
      // Cache miss or error — fall through to DB
    }
  }

  const org = await prisma.organization.findUnique({ where: { apiKey } });

  if (!org) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  // Populate cache for subsequent requests
  if (redis) {
    try {
      await redis.set(cacheKey(apiKey), JSON.stringify(org), { ex: API_KEY_CACHE_TTL });
    } catch {
      // non-fatal
    }
  }

  req.organization = org;
  next();
}

/** Call after rotating an org's API key so the old key is evicted immediately. */
export async function invalidateApiKeyCache(oldApiKey: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(cacheKey(oldApiKey));
  } catch {
    // non-fatal
  }
}

// Used by the admin dashboard � validates Authorization: Bearer <JWT>
export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
