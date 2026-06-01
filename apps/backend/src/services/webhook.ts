import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export type WebhookEventType =
  | 'onboarding_completed'
  | 'step_completed'
  | 'user_escalated'
  | 'milestone_reached';

function sign(secret: string, body: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

async function deliver(url: string, secret: string, payload: unknown): Promise<void> {
  const body = JSON.stringify(payload);
  const sig = sign(secret, body);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Ahaget-Signature': sig,
        'User-Agent': 'Ahaget-Webhooks/1.0',
      },
      body,
      signal: ctrl.signal,
    });
    if (!res.ok) {
      logger.warn('webhook.delivery.failed', { url, status: res.status });
    }
  } catch (err) {
    logger.warn('webhook.delivery.error', { url, error: String(err) });
  } finally {
    clearTimeout(timer);
  }
}

export function dispatchWebhook(
  organizationId: string,
  eventType: WebhookEventType,
  data: Record<string, unknown>,
): void {
  const payload = { event: eventType, createdAt: new Date().toISOString(), data };

  // Fire-and-forget — never block the calling request
  prisma.webhook
    .findMany({ where: { organizationId, eventType, enabled: true } })
    .then((hooks) => Promise.all(hooks.map((h) => deliver(h.url, h.secret, payload))))
    .catch((err) => logger.warn('webhook.dispatch.error', { organizationId, eventType, error: String(err) }));
}
