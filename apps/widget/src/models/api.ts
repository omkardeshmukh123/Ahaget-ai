export interface ApiOptions {
  apiKey: string;
  apiUrl: string;
}

export async function trackEvent(
  opts: ApiOptions,
  endUserId: string,
  eventType: 'page_view' | 'idle' | 'exit_intent' | 'click' | 'form_start' | 'form_abandon' | 'custom',
  properties: Record<string, unknown> = {}
): Promise<void> {
  // fire-and-forget — don't await so it never blocks the UI
  fetch(`${opts.apiUrl}/api/v1/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': opts.apiKey,
    },
    body: JSON.stringify({ endUserId, eventType, properties }),
  }).catch(() => {
    // silently ignore — tracking should never crash the host app
  });
}

export interface TriggerMatch {
  rule: {
    id: string;
    triggerType: string;
    flowId: string;
  };
  flow: {
    id: string;
    name: string;
    flowType: string;
    executionMode: string;
  };
}

/**
 * Evaluate trigger rules server-side for this user+page combo.
 * Returns the highest-priority matching trigger+flow, or null if no match.
 */
export async function evaluateTriggers(
  opts: ApiOptions,
  userId: string,
  page: string,
  metadata?: Record<string, unknown>,
  event?: string
): Promise<TriggerMatch | null> {
  try {
    const params = new URLSearchParams({ userId, page });
    if (event) params.set('event', event);
    if (metadata) params.set('metadata', JSON.stringify(metadata));

    const res = await fetch(`${opts.apiUrl}/api/v1/triggers/evaluate?${params}`, {
      headers: { 'X-API-Key': opts.apiKey },
    });
    if (!res.ok) return null;
    const data = await res.json() as { match: TriggerMatch | null };
    return data.match;
  } catch {
    return null;
  }
}

export interface RemoteBranding {
  primaryColor: string;
  gradFrom: string;
  gradTo: string;
  position: 'bottom-right' | 'bottom-left';
  idleThreshold: number;
  whiteLabel?: boolean;
}

/**
 * Fetch branding config from the backend using the org API key.
 * Returns null on any failure — callers fall back to local defaults.
 */
export async function fetchBranding(opts: ApiOptions): Promise<RemoteBranding | null> {
  try {
    const res = await fetch(`${opts.apiUrl}/api/v1/config/branding`, {
      headers: { 'X-API-Key': opts.apiKey },
    });
    if (!res.ok) return null;
    return res.json() as Promise<RemoteBranding>;
  } catch {
    return null;
  }
}

export interface ProactiveMessage {
  id: string;
  channel: string;
  subject: string | null;
  bodySnippet: string | null;
  deepLink: string | null;
  status: string;
  sentAt: string;
  flow: { id: string; name: string; flowType: string } | null;
}

/**
 * Fetch the latest unread in-app proactive message for this user.
 * Returns null if none pending.
 */
export async function fetchPendingProactiveMessage(
  opts: ApiOptions,
  userId: string
): Promise<ProactiveMessage | null> {
  try {
    const res = await fetch(
      `${opts.apiUrl}/api/v1/proactive/pending?userId=${encodeURIComponent(userId)}`,
      { headers: { 'X-API-Key': opts.apiKey } }
    );
    if (!res.ok) return null;
    const data = await res.json() as { message: ProactiveMessage | null };
    return data.message;
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget beacon on widget close/hide to mark session abandoned.
 * Uses sendBeacon so it survives page unload.
 */
export function beaconAbandon(
  opts: ApiOptions,
  sessionId: string,
  stepId?: string,
): void {
  const url = `${opts.apiUrl}/api/v1/session/abandon`;
  const body = JSON.stringify({ sessionId, stepId, reason: 'user_closed' });
  try {
    navigator.sendBeacon(url + '?key=' + encodeURIComponent(opts.apiKey), new Blob([body], { type: 'application/json' }));
  } catch {
    // sendBeacon not supported — silent fail, sweeper will catch it
  }
}

/**
 * Mark a proactive message as opened or clicked.
 */
export async function markProactiveMessage(
  opts: ApiOptions,
  messageId: string,
  action: 'open' | 'click'
): Promise<void> {
  fetch(`${opts.apiUrl}/api/v1/proactive/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': opts.apiKey },
    body: JSON.stringify({ messageId }),
  }).catch(() => {});
}
