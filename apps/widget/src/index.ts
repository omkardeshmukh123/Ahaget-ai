import { Tesseract AIWidget } from './widget';
import { WidgetConfig } from './config';

// ─── Public API surface ──────────────────────────────────────────────────────
// Customers call:
//   Tesseract AI('init', { apiKey: '...', userId: '...' })
//   Tesseract AI('event', 'data_connected')   ← fire a step completion event

type Command = 'init' | 'event';

declare global {
  interface Window {
    Tesseract AI: (cmd: Command, payload: WidgetConfig | string) => void;
    __oai_widget?: Tesseract AIWidget;
  }
}

window.Tesseract AI = function (cmd: Command, payload: WidgetConfig | string) {
  if (cmd === 'init') {
    if (window.__oai_widget) return; // prevent double init
    const widget = new Tesseract AIWidget(payload as WidgetConfig);
    widget.init();
    window.__oai_widget = widget;
    return;
  }

  if (cmd === 'event') {
    // Fire a step completion event — call after user completes a step in the SaaS product
    // e.g. Tesseract AI('event', 'data_connected')
    const eventType = payload as string;
    window.__oai_widget?.getCopilot().fireEvent(eventType);
    return;
  }
};

// Replay any queued calls made before the script loaded
if (Array.isArray((window as any).__oai_q)) {
  (window as any).__oai_q.forEach(([cmd, p]: [Command, WidgetConfig | string]) =>
    window.Tesseract AI(cmd, p)
  );
}
