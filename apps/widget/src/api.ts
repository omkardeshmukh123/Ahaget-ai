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
