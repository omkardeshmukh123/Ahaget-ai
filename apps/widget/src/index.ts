import { AhagetWidget } from './controllers/widget';
import { WidgetConfig, DEFAULT_CONFIG, readScriptTagConfig } from './models/config';
import { initInspector } from './utils/inspector';

// ─── Inspector mode boot ─────────────────────────────────────────────────────
// Activated when ?ahaget_inspect=1 is in the URL.
// The page must already have the widget snippet installed with a valid apiKey.
// Inspector runs standalone — the normal copilot widget does NOT boot.
(function checkInspectorMode() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('ahaget_inspect') !== '1') return;

  // apiKey must be provided via ?ahaget_key=<key> OR the queued init call
  const keyFromParam = params.get('ahaget_key');
  if (keyFromParam) {
    const apiUrl = params.get('ahaget_api_url') ?? DEFAULT_CONFIG.apiUrl;
    initInspector({ apiKey: keyFromParam, apiUrl });
    return; // skip normal widget boot
  }

  // Otherwise wait for Ahaget('init', ...) to fire and intercept the apiKey
  const origAhaget = (window as any).Ahaget;
  (window as any).__ahaget_inspector_pending = true;
  (window as any).Ahaget = function (cmd: string, payload: WidgetConfig | string) {
    if (cmd === 'init' && (window as any).__ahaget_inspector_pending) {
      (window as any).__ahaget_inspector_pending = false;
      const cfg = payload as WidgetConfig;
      initInspector({
        apiKey: cfg.apiKey,
        apiUrl: cfg.apiUrl ?? DEFAULT_CONFIG.apiUrl,
      });
      return; // do NOT boot the normal widget
    }
    if (origAhaget) origAhaget(cmd, payload);
  };
})();

// ─── Public API surface ──────────────────────────────────────────────────────
// Customers call:
//   Ahaget('init', { apiKey: '...', userId: '...' })
//   Ahaget('event', 'data_connected')   ← fire a step completion event

type Command = 'init' | 'event';

declare global {
  interface Window {
    Ahaget: (cmd: Command, payload: WidgetConfig | string) => void;
    __oai_widget?: AhagetWidget;
  }
}

// Only define the normal Ahaget global if inspector mode didn't already replace it
if (!(window as any).__ahaget_inspector_pending) {
  window.Ahaget = function (cmd: Command, payload: WidgetConfig | string) {
    if (cmd === 'init') {
      if (window.__oai_widget) return; // prevent double init
      // Merge script-tag attrs first; JS Ahaget('init', ...) values win
      const scriptCfg = readScriptTagConfig();
      const merged: WidgetConfig = { ...scriptCfg, ...(payload as WidgetConfig) };
      // Merge metadata objects (script-tag metadata merged under JS metadata)
      if (scriptCfg.metadata && (payload as WidgetConfig).metadata) {
        merged.metadata = { ...scriptCfg.metadata, ...(payload as WidgetConfig).metadata };
      }
      const widget = new AhagetWidget(merged);
      widget.init();
      window.__oai_widget = widget;
      return;
    }

    if (cmd === 'event') {
      // Fire a step completion event — call after user completes a step in the SaaS product
      // e.g. Ahaget('event', 'data_connected')
      const eventType = payload as string;
      window.__oai_widget?.getCopilot().fireEvent(eventType);
      return;
    }
  };
}

// Replay any queued calls made before the script loaded
if (Array.isArray((window as any).__oai_q)) {
  (window as any).__oai_q.forEach(([cmd, p]: [Command, WidgetConfig | string]) =>
    window.Ahaget(cmd, p)
  );
}

