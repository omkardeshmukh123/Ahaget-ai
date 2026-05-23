// ─── Visual Element Highlighter ───────────────────────────────────────────────
// Four modes:
//   spotlight    — dark backdrop with cutout + pulsing ring + tooltip (max attention)
//   beacon       — pulsing dot badge on element corner + dark tooltip (passive hint)
//   arrow        — auto-positioned speech bubble with arrow pointer (guided callout)
//   multi        — numbered rings on several elements simultaneously (tour overview)
//   ringOnly     — thin pulsing ring, no backdrop (used internally before clicks)

const OVERLAY_ID   = 'oai-spotlight-overlay';
const RING_ID      = 'oai-spotlight-ring';
const TIP_ID       = 'oai-spotlight-tip';
const BEACON_ID    = 'oai-beacon';
const BEACON_TIP   = 'oai-beacon-tip';
const ARROW_ID     = 'oai-arrow-callout';
const MULTI_PREFIX = 'oai-multi-';
const STYLE_ID     = 'oai-spotlight-style';

function injectKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes oai-ring-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(99,102,241,0.55), 0 0 16px rgba(99,102,241,0.3); }
      70%  { box-shadow: 0 0 0 10px rgba(99,102,241,0), 0 0 20px rgba(99,102,241,0.15); }
      100% { box-shadow: 0 0 0 0 rgba(99,102,241,0), 0 0 16px rgba(99,102,241,0.3); }
    }
    @keyframes oai-beacon-pulse {
      0%   { transform: scale(1);   box-shadow: 0 0 0 0 rgba(99,102,241,0.7); }
      60%  { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(99,102,241,0); }
      100% { transform: scale(1);   box-shadow: 0 0 0 0 rgba(99,102,241,0); }
    }
    @keyframes oai-overlay-in {
      from { opacity: 0; } to { opacity: 1; }
    }
    @keyframes oai-tip-in {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes oai-arrow-in {
      from { opacity: 0; transform: scale(0.92) translateY(4px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes oai-badge-in {
      from { opacity: 0; transform: scale(0.5); }
      to   { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

export function removeSpotlight(): void {
  document.getElementById(OVERLAY_ID)?.remove();
  document.getElementById(RING_ID)?.remove();
  document.getElementById(TIP_ID)?.remove();
}

export function removeBeacon(): void {
  document.getElementById(BEACON_ID)?.remove();
  document.getElementById(BEACON_TIP)?.remove();
}

export function removeArrow(): void {
  document.getElementById(ARROW_ID)?.remove();
}

export function removeMulti(): void {
  document.querySelectorAll(`[id^="${MULTI_PREFIX}"]`).forEach((el) => el.remove());
}

// ─── trackPosition ────────────────────────────────────────────────────────────
// rAF-based position tracker. Re-runs update callbacks when element rects drift
// by more than 1px (handles scroll, resize, and React re-renders uniformly).

function trackPosition(els: { el: HTMLElement; update: (rect: DOMRect) => void }[]): () => void {
  let running = true;
  let lastRects = els.map(({ el }) => el.getBoundingClientRect());

  function tick() {
    if (!running) return;
    els.forEach(({ el, update }, i) => {
      const rect = el.getBoundingClientRect();
      if (
        Math.abs(rect.top  - lastRects[i].top)  > 1 ||
        Math.abs(rect.left - lastRects[i].left) > 1
      ) {
        update(rect);
        lastRects[i] = rect;
      }
    });
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
  return () => { running = false; };
}

// ─── spotlight ────────────────────────────────────────────────────────────────
// Dark backdrop with cutout + pulsing ring + tooltip. Maximum attention.

export function spotlight(
  selector: string,
  label = '👆 Click here',
  durationMs = 4000,
  color = '#6366f1',
): (() => void) {
  injectKeyframes();
  removeSpotlight();

  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return () => {};

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  let stopTracking: (() => void) | null = null;

  const timer = setTimeout(() => {
    const rect = el.getBoundingClientRect();
    const pad = 10;

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483640;
      background: rgba(0,0,0,0.38);
      pointer-events: none;
      animation: oai-overlay-in 0.2s ease;
    `;

    const x = rect.left - pad;
    const y = rect.top - pad;
    const w = rect.width + pad * 2;
    const h = rect.height + pad * 2;
    overlay.style.clipPath =
      `polygon(0% 0%, 0% 100%, ${x}px 100%, ${x}px ${y}px, ${x + w}px ${y}px, ${x + w}px ${y + h}px, ${x}px ${y + h}px, ${x}px 100%, 100% 100%, 100% 0%)`;

    const ring = document.createElement('div');
    ring.id = RING_ID;
    ring.style.cssText = `
      position: fixed; z-index: 2147483641; pointer-events: none;
      left: ${x}px; top: ${y}px; width: ${w}px; height: ${h}px;
      border-radius: 10px; border: 2px solid ${color};
      animation: oai-ring-pulse 1.1s ease infinite;
    `;

    const tip = document.createElement('div');
    tip.id = TIP_ID;
    const tipTop = y - 38 < 8 ? y + h + 6 : y - 38;
    tip.style.cssText = `
      position: fixed; z-index: 2147483642; pointer-events: none;
      left: ${x}px; top: ${tipTop}px;
      background: ${color}; color: #fff;
      font-size: 12px; font-weight: 600;
      padding: 5px 12px; border-radius: 8px;
      white-space: nowrap;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 12px rgba(99,102,241,0.4);
      animation: oai-tip-in 0.25s ease;
    `;
    tip.textContent = label;

    document.body.appendChild(overlay);
    document.body.appendChild(ring);
    document.body.appendChild(tip);

    stopTracking = trackPosition([{
      el,
      update: (r) => {
        const nx = r.left - pad;
        const ny = r.top - pad;
        const nw = r.width + pad * 2;
        const nh = r.height + pad * 2;
        overlay.style.clipPath =
          `polygon(0% 0%, 0% 100%, ${nx}px 100%, ${nx}px ${ny}px, ${nx + nw}px ${ny}px, ${nx + nw}px ${ny + nh}px, ${nx}px ${ny + nh}px, ${nx}px 100%, 100% 100%, 100% 0%)`;
        ring.style.left = `${nx}px`; ring.style.top  = `${ny}px`;
        ring.style.width = `${nw}px`; ring.style.height = `${nh}px`;
        const ntipTop = ny - 38 < 8 ? ny + nh + 6 : ny - 38;
        tip.style.left = `${nx}px`; tip.style.top = `${ntipTop}px`;
      },
    }]);
  }, 300);

  const autoRemove = setTimeout(() => { stopTracking?.(); removeSpotlight(); }, durationMs);

  return () => {
    clearTimeout(timer);
    clearTimeout(autoRemove);
    stopTracking?.();
    removeSpotlight();
  };
}

// ─── beacon ───────────────────────────────────────────────────────────────────
// Pulsing dot badge anchored to the element's corner + a small dark tooltip.
// Non-intrusive — use for passive hints without blocking the UI.

export function beacon(
  selector: string,
  label = '👆 Here',
  durationMs = 5000,
): (() => void) {
  injectKeyframes();
  removeBeacon();

  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return () => {};

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  let stopTracking: (() => void) | null = null;

  const timer = setTimeout(() => {
    const rect = el.getBoundingClientRect();

    const dot = document.createElement('div');
    dot.id = BEACON_ID;
    dot.style.cssText = `
      position: fixed; z-index: 2147483641; pointer-events: none;
      left: ${rect.right - 9}px; top: ${rect.top - 9}px;
      width: 18px; height: 18px; border-radius: 50%;
      background: #6366f1; border: 2px solid #fff;
      box-shadow: 0 2px 8px rgba(99,102,241,0.5);
      animation: oai-beacon-pulse 1.4s ease infinite;
    `;

    const tip = document.createElement('div');
    tip.id = BEACON_TIP;
    const tipLeft = Math.max(8, Math.min(rect.left, window.innerWidth - 200));
    const tipTop = rect.top - 44 < 8 ? rect.bottom + 8 : rect.top - 44;
    tip.style.cssText = `
      position: fixed; z-index: 2147483642; pointer-events: none;
      left: ${tipLeft}px; top: ${tipTop}px;
      background: #1e293b; color: #f8fafc;
      font-size: 12px; font-weight: 500;
      padding: 5px 10px; border-radius: 6px;
      white-space: nowrap;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      animation: oai-tip-in 0.25s ease;
    `;
    tip.textContent = label;

    document.body.appendChild(dot);
    document.body.appendChild(tip);

    stopTracking = trackPosition([{
      el,
      update: (r) => {
        dot.style.left = `${r.right - 9}px`;
        dot.style.top  = `${r.top - 9}px`;
        const tl = Math.max(8, Math.min(r.left, window.innerWidth - 200));
        const tt = r.top - 44 < 8 ? r.bottom + 8 : r.top - 44;
        tip.style.left = `${tl}px`;
        tip.style.top  = `${tt}px`;
      },
    }]);
  }, 250);

  const cleanup = () => {
    clearTimeout(timer);
    clearTimeout(autoRemove);
    stopTracking?.();
    removeBeacon();
  };
  const autoRemove = setTimeout(cleanup, durationMs);
  return cleanup;
}

// ─── arrowCallout ─────────────────────────────────────────────────────────────
// Floating speech bubble with a directional arrow that points at the element.
// Auto-positions above the element; falls back to below if there's no room.

export function arrowCallout(
  selector: string,
  label = '👆 Here',
  durationMs = 5000,
  color = '#6366f1',
): (() => void) {
  injectKeyframes();
  removeArrow();

  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return () => {};

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const BUBBLE_H = 44;
  const ARROW_H  = 8;
  const GAP      = 6;
  let stopTracking: (() => void) | null = null;

  const timer = setTimeout(() => {
    const rect = el.getBoundingClientRect();

    const above = rect.top - BUBBLE_H - ARROW_H - GAP > 8;
    const tipTop = above
      ? rect.top - BUBBLE_H - ARROW_H - GAP
      : rect.bottom + GAP;

    const callout = document.createElement('div');
    callout.id = ARROW_ID;

    const arrowStyle = above
      ? `border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid ${color};`
      : `border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:8px solid ${color};`;
    const arrowPos = above ? `bottom:-8px; top:auto;` : `top:-8px; bottom:auto;`;

    const tipLeft = Math.max(8, Math.min(rect.left + rect.width / 2 - 90, window.innerWidth - 188));
    const arrowLeft = Math.max(8, rect.left + rect.width / 2 - tipLeft - 8);

    callout.style.cssText = `
      position: fixed; z-index: 2147483642; pointer-events: none;
      left: ${tipLeft}px; top: ${tipTop}px;
      background: ${color}; color: #fff;
      font-size: 12px; font-weight: 600;
      padding: 8px 14px; border-radius: 10px;
      max-width: 240px; width: max-content;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 6px 20px rgba(99,102,241,0.4);
      animation: oai-arrow-in 0.25s cubic-bezier(0.34,1.56,0.64,1);
      line-height: 1.4;
    `;
    callout.textContent = label;

    const arrow = document.createElement('div');
    arrow.style.cssText = `
      position: absolute; left: ${arrowLeft}px; ${arrowPos}
      width: 0; height: 0; ${arrowStyle}
    `;
    callout.appendChild(arrow);

    const pad = 6;
    const ring = document.createElement('div');
    ring.id = ARROW_ID + '-ring';
    ring.style.cssText = `
      position: fixed; z-index: 2147483641; pointer-events: none;
      left: ${rect.left - pad}px; top: ${rect.top - pad}px;
      width: ${rect.width + pad * 2}px; height: ${rect.height + pad * 2}px;
      border-radius: 8px; border: 2px solid ${color};
      animation: oai-ring-pulse 1.1s ease infinite;
    `;

    document.body.appendChild(ring);
    document.body.appendChild(callout);

    stopTracking = trackPosition([{
      el,
      update: (r) => {
        const isAbove = r.top - BUBBLE_H - ARROW_H - GAP > 8;
        const ntipTop = isAbove ? r.top - BUBBLE_H - ARROW_H - GAP : r.bottom + GAP;
        const ntipLeft = Math.max(8, Math.min(r.left + r.width / 2 - 90, window.innerWidth - 188));
        const narrowLeft = Math.max(8, r.left + r.width / 2 - ntipLeft - 8);
        callout.style.left = `${ntipLeft}px`;
        callout.style.top  = `${ntipTop}px`;
        arrow.style.left = `${narrowLeft}px`;
        if (isAbove) { arrow.style.bottom = '-8px'; arrow.style.top = 'auto'; }
        else         { arrow.style.top = '-8px'; arrow.style.bottom = 'auto'; }
        ring.style.left   = `${r.left - pad}px`; ring.style.top    = `${r.top - pad}px`;
        ring.style.width  = `${r.width + pad * 2}px`; ring.style.height = `${r.height + pad * 2}px`;
      },
    }]);
  }, 250);

  const cleanup = () => {
    clearTimeout(timer);
    clearTimeout(autoRemove);
    stopTracking?.();
    removeArrow();
    document.getElementById(ARROW_ID + '-ring')?.remove();
  };
  const autoRemove = setTimeout(cleanup, durationMs);
  return cleanup;
}

// ─── multiHighlight ───────────────────────────────────────────────────────────
// Numbered rings on several elements simultaneously.
// Each ring gets a numbered badge so the user can follow a sequence.

export function multiHighlight(
  selectors: string[],
  labels: string[] = [],
  durationMs = 6000,
  color = '#6366f1',
): (() => void) {
  injectKeyframes();
  removeMulti();

  const elements = selectors
    .map((sel, i) => ({ sel, el: document.querySelector<HTMLElement>(sel), i }))
    .filter((x): x is typeof x & { el: HTMLElement } => x.el !== null);

  if (elements.length === 0) return () => {};

  // Scroll to first element
  elements[0].el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  let stopTracking: (() => void) | null = null;

  const timer = setTimeout(() => {
    const rings: HTMLElement[] = [];
    const badges: HTMLElement[] = [];
    const tipEls: HTMLElement[] = [];

    elements.forEach(({ el, i }) => {
      const rect = el.getBoundingClientRect();
      const pad = 8;
      const num = i + 1;
      const label = labels[i] ?? `Step ${num}`;

      const ring = document.createElement('div');
      ring.id = `${MULTI_PREFIX}ring-${i}`;
      ring.style.cssText = `
        position: fixed; z-index: 2147483641; pointer-events: none;
        left: ${rect.left - pad}px; top: ${rect.top - pad}px;
        width: ${rect.width + pad * 2}px; height: ${rect.height + pad * 2}px;
        border-radius: 10px; border: 2px solid ${color};
        animation: oai-ring-pulse 1.1s ease infinite;
        animation-delay: ${i * 0.15}s;
      `;

      const badge = document.createElement('div');
      badge.id = `${MULTI_PREFIX}badge-${i}`;
      badge.style.cssText = `
        position: fixed; z-index: 2147483642; pointer-events: none;
        left: ${rect.left - pad - 4}px; top: ${rect.top - pad - 4}px;
        width: 20px; height: 20px; border-radius: 50%;
        background: ${color}; color: #fff;
        font-size: 11px; font-weight: 700;
        display: flex; align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        box-shadow: 0 2px 6px rgba(99,102,241,0.5);
        animation: oai-badge-in 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
        animation-delay: ${i * 0.1}s;
      `;
      badge.textContent = String(num);

      const tip = document.createElement('div');
      tip.id = `${MULTI_PREFIX}tip-${i}`;
      const tipTop = rect.top - pad - 32 < 8 ? rect.bottom + pad + 4 : rect.top - pad - 28;
      tip.style.cssText = `
        position: fixed; z-index: 2147483642; pointer-events: none;
        left: ${rect.left - pad + 20}px; top: ${tipTop}px;
        background: #1e293b; color: #f8fafc;
        font-size: 11px; font-weight: 500;
        padding: 3px 8px; border-radius: 5px;
        white-space: nowrap;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        animation: oai-tip-in 0.25s ease both;
        animation-delay: ${i * 0.12}s;
      `;
      tip.textContent = label;

      document.body.appendChild(ring);
      document.body.appendChild(badge);
      document.body.appendChild(tip);
      rings.push(ring);
      badges.push(badge);
      tipEls.push(tip);
    });

    stopTracking = trackPosition(
      elements.map(({ el }, idx) => ({
        el,
        update: (r: DOMRect) => {
          const pad = 8;
          rings[idx].style.left   = `${r.left - pad}px`;
          rings[idx].style.top    = `${r.top - pad}px`;
          rings[idx].style.width  = `${r.width + pad * 2}px`;
          rings[idx].style.height = `${r.height + pad * 2}px`;
          badges[idx].style.left  = `${r.left - pad - 4}px`;
          badges[idx].style.top   = `${r.top - pad - 4}px`;
          const tt = r.top - pad - 32 < 8 ? r.bottom + pad + 4 : r.top - pad - 28;
          tipEls[idx].style.left  = `${r.left - pad + 20}px`;
          tipEls[idx].style.top   = `${tt}px`;
        },
      }))
    );
  }, 300);

  const cleanup = () => {
    clearTimeout(timer);
    clearTimeout(autoRemove);
    stopTracking?.();
    removeMulti();
  };
  const autoRemove = setTimeout(cleanup, durationMs);
  return cleanup;
}

// ─── ringOnly ─────────────────────────────────────────────────────────────────
// Thin pulsing ring only — no backdrop, no tooltip. Used before fill_form actions.

export function ringOnly(selector: string, durationMs = 3000): () => void {
  injectKeyframes();
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) return () => {};

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  let stopTracking: (() => void) | null = null;
  let autoRemoveTimer: ReturnType<typeof setTimeout> | null = null;

  const innerTimer = setTimeout(() => {
    const rect = el.getBoundingClientRect();
    const pad = 6;
    const ring = document.createElement('div');
    ring.id = RING_ID;
    ring.style.cssText = `
      position: fixed; z-index: 2147483641; pointer-events: none;
      left: ${rect.left - pad}px; top: ${rect.top - pad}px;
      width: ${rect.width + pad * 2}px; height: ${rect.height + pad * 2}px;
      border-radius: 8px; border: 2px solid #6366f1;
      animation: oai-ring-pulse 1.1s ease infinite;
    `;
    document.getElementById(RING_ID)?.remove();
    document.body.appendChild(ring);

    stopTracking = trackPosition([{
      el,
      update: (r) => {
        ring.style.left   = `${r.left - pad}px`;
        ring.style.top    = `${r.top - pad}px`;
        ring.style.width  = `${r.width + pad * 2}px`;
        ring.style.height = `${r.height + pad * 2}px`;
      },
    }]);

    autoRemoveTimer = setTimeout(() => {
      stopTracking?.();
      ring.remove();
    }, durationMs);
  }, 200);

  return () => {
    clearTimeout(innerTimer);
    if (autoRemoveTimer) clearTimeout(autoRemoveTimer);
    stopTracking?.();
    document.getElementById(RING_ID)?.remove();
  };
}

// ─── hoverTip ──────────────────────────────────────────────────────────────────
// Passive tooltip that appears on mouseenter, hides on mouseleave.
// Does not require agent action — sits quietly on the element until removed.

const HOVER_TIP_PREFIX = 'oai-htip-';

export function hoverTip(selector: string, text: string, color = '#6366f1'): (() => void) | null {
  injectKeyframes();
  const el = document.querySelector<HTMLElement>(selector);
  if (!el || el.closest('#oai-root')) return null;

  const id = HOVER_TIP_PREFIX + Math.random().toString(36).slice(2, 8);

  // Small info badge anchored top-right of element
  const badge = document.createElement('div');
  badge.id = id + '-badge';
  badge.style.cssText = `
    position: fixed; z-index: 2147483641; pointer-events: none;
    width: 16px; height: 16px; border-radius: 50%;
    background: ${color}; color: white;
    font-size: 10px; font-weight: 700; font-family: system-ui, sans-serif;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    animation: oai-badge-in 0.2s ease both;
  `;
  badge.textContent = 'i';

  // Tooltip bubble (hidden by default)
  const tip = document.createElement('div');
  tip.id = id + '-tip';
  tip.style.cssText = `
    position: fixed; z-index: 2147483642; pointer-events: none;
    background: #1e293b; color: #f8fafc;
    font-size: 12px; font-family: system-ui, sans-serif; line-height: 1.45;
    padding: 7px 11px; border-radius: 8px; max-width: 220px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.22);
    opacity: 0; transition: opacity 0.15s ease;
    white-space: normal; word-break: break-word;
  `;
  tip.textContent = text;

  function position() {
    const rect = el!.getBoundingClientRect();
    badge.style.left = `${rect.right - 8}px`;
    badge.style.top  = `${rect.top - 8}px`;
    const tipTop = rect.top - 8 < 40 ? rect.bottom + 6 : rect.top - 42;
    tip.style.left = `${Math.min(rect.left, window.innerWidth - 240)}px`;
    tip.style.top  = `${tipTop}px`;
  }

  position();
  document.body.appendChild(badge);
  document.body.appendChild(tip);

  const show = () => { position(); tip.style.opacity = '1'; };
  const hide = () => { tip.style.opacity = '0'; };

  el.addEventListener('mouseenter', show);
  el.addEventListener('mouseleave', hide);
  window.addEventListener('scroll', position, { passive: true });

  return () => {
    badge.remove();
    tip.remove();
    el.removeEventListener('mouseenter', show);
    el.removeEventListener('mouseleave', hide);
    window.removeEventListener('scroll', position);
  };
}

export function removeHoverTips(): void {
  document.querySelectorAll(`[id^="${HOVER_TIP_PREFIX}"]`).forEach((el) => el.remove());
}

