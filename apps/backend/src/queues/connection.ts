import type { ConnectionOptions } from 'bullmq';

let _parsed: ConnectionOptions | null | undefined;

/**
 * Parses REDIS_URL into a BullMQ ConnectionOptions object.
 * Returns null when REDIS_URL is not configured.
 * Supports redis://, rediss://, and redis+sentinel:// schemes.
 */
export function getQueueConnection(): ConnectionOptions | null {
  if (_parsed !== undefined) return _parsed;

  const url = process.env.REDIS_URL;
  if (!url) { _parsed = null; return null; }

  try {
    const parsed = new URL(url);
    const opts: ConnectionOptions & Record<string, unknown> = {
      host:     parsed.hostname || 'localhost',
      port:     parsed.port ? parseInt(parsed.port, 10) : 6379,
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      maxRetriesPerRequest: null, // required by BullMQ
    };

    // rediss:// — TLS
    if (parsed.protocol === 'rediss:') {
      opts['tls'] = {};
    }

    // Path may encode the database number: redis://host/1
    if (parsed.pathname && parsed.pathname !== '/') {
      opts['db'] = parseInt(parsed.pathname.slice(1), 10) || 0;
    }

    _parsed = opts as ConnectionOptions;
    return _parsed;
  } catch (e) {
    console.error('[queue] Failed to parse REDIS_URL:', (e as Error).message);
    _parsed = null;
    return null;
  }
}

export function isQueueEnabled(): boolean {
  return getQueueConnection() !== null;
}
