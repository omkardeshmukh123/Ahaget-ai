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
