export interface WidgetConfig {
  apiKey: string;
  userId?: string;
  /** Free-form user context passed to the agent as USER PROFILE */
  metadata?: Record<string, unknown>;
  apiUrl?: string;
  /** How long (ms) user must be idle before widget re-expands if collapsed */
  idleThreshold?: number;
  primaryColor?: string;
}

export const DEFAULT_CONFIG: Required<Omit<WidgetConfig, 'apiKey' | 'userId' | 'metadata'>> = {
  apiUrl: 'https://api.ahaget.ai',
  idleThreshold: 30_000,
  primaryColor: '#6366f1', // indigo
};

/**
 * readScriptTagConfig — reads `data-ahaget-*` attributes off the widget's own
 * <script> tag so operators can inject user context server-side without extra JS:
 *
 *   <script src="..." data-ahaget-key="ak_live_..."
 *           data-ahaget-user-id="u_123"
 *           data-ahaget-plan="pro"
 *           data-ahaget-role="admin"
 *           data-ahaget-segment="enterprise"
 *           data-ahaget-metadata='{"company":"Acme"}'
 *   ></script>
 *
 * Returns a partial WidgetConfig; caller merges with Ahaget('init', ...) values.
 * JS `init` values always win over script-tag attrs.
 */
export function readScriptTagConfig(): Partial<WidgetConfig> {
  const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'));
  const self = scripts.find(
    (s) => s.src.includes('ahaget') || s.dataset.ahagetKey != null
  );
  if (!self) return {};

  const d = self.dataset;
  const config: Partial<WidgetConfig> = {};

  if (d.ahagetKey)    config.apiKey = d.ahagetKey;
  if (d.ahagetUserId) config.userId = d.ahagetUserId;
  if (d.ahagetApiUrl) config.apiUrl = d.ahagetApiUrl;

  // Build metadata from individual attrs AND/OR a JSON blob
  const meta: Record<string, unknown> = {};
  if (d.ahagetPlan)       meta.plan       = d.ahagetPlan;
  if (d.ahagetRole)       meta.role       = d.ahagetRole;
  if (d.ahagetSegment)    meta.segment    = d.ahagetSegment;
  if (d.ahagetAccountAge) meta.accountAge = d.ahagetAccountAge;

  try {
    if (d.ahagetMetadata) {
      const parsed = JSON.parse(d.ahagetMetadata) as Record<string, unknown>;
      Object.assign(meta, parsed);
    }
  } catch { /* ignore malformed JSON */ }

  if (Object.keys(meta).length > 0) config.metadata = meta;

  return config;
}
