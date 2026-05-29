/**
 * Shared Upstash Redis client.
 * Lazy-initialized singleton — returns null when env vars are absent
 * so the app runs in dev without Redis configured.
 *
 * Use `getRedis()` everywhere instead of importing @upstash/redis directly.
 */

import type { Redis as RedisType } from '@upstash/redis';

let _client: RedisType | null = null;

export function getRedis(): RedisType | null {
  if (_client) return _client;

  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Redis } = require('@upstash/redis') as { Redis: new (opts: { url: string; token: string }) => RedisType };
    _client = new Redis({ url, token });
  } catch {
    console.warn('[redis] Failed to initialize Upstash Redis client — falling back to in-memory');
    return null;
  }

  return _client;
}

/** Returns true when Upstash env vars are present and client initialized successfully. */
export function isRedisConfigured(): boolean {
  return getRedis() !== null;
}

/**
 * SET with EX (seconds TTL). Falls back silently if Redis is not configured.
 */
export async function redisSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(key, value, { ex: ttlSeconds });
}

/**
 * GET a string value. Returns null if Redis is not configured or key not found.
 */
export async function redisGet(key: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  const val = await redis.get<string>(key);
  return val ?? null;
}

/**
 * DELETE a key. No-ops if Redis is not configured.
 */
export async function redisDel(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(key);
}

/**
 * INCR with optional EX on first increment. Returns the new count.
 * Falls back to null if Redis is not configured.
 */
export async function redisIncr(key: string, ttlSeconds?: number): Promise<number | null> {
  const redis = getRedis();
  if (!redis) return null;
  const count = await redis.incr(key);
  if (count === 1 && ttlSeconds) {
    await redis.expire(key, ttlSeconds);
  }
  return count;
}
