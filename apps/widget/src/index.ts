import { AhagetWidget } from './widget';
import { WidgetConfig } from './config';

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

window.Ahaget = function (cmd: Command, payload: WidgetConfig | string) {
  if (cmd === 'init') {
    if (window.__oai_widget) return; // prevent double init
    const widget = new AhagetWidget(payload as WidgetConfig);
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

// Replay any queued calls made before the script loaded
if (Array.isArray((window as any).__oai_q)) {
  (window as any).__oai_q.forEach(([cmd, p]: [Command, WidgetConfig | string]) =>
    window.Ahaget(cmd, p)
  );
}
