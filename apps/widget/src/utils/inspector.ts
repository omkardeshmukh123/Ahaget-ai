// ─── Inspector Mode ───────────────────────────────────────────────────────────
// Activated when the widget script detects ?ahaget_inspect=1 in the URL.
// Highlights every interactive element, lets the SaaS owner click to annotate,
// and sends the full capture to POST /api/v1/interface-map/capture.
//
// Zero dependency on the copilot / widget state machine — runs standalone.

import { scanPage, ScannedElement } from './scanner';

interface InspectorConfig {
  apiKey: string;
  apiUrl: string;
}

interface AnnotationState {
  customLabel: string;
  customDescription: string;
  businessRule: string;
  isSensitive: boolean;
  elementType: string;
}

// ─── Framework detection ──────────────────────────────────────────────────────
function detectFramework(): string {
  if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) return 'react';
  if ((window as any).Vue || document.querySelector('[data-v-]')) return 'vue';
  if ((window as any).ng || document.querySelector('[ng-version]')) return 'angular';
  const scripts = document.querySelectorAll('script[src]');
  if (scripts.length === 0) return 'server';
  return 'vanilla';
}

// ─── Captured elements store ──────────────────────────────────────────────────
// Maps selector → {element, annotation}
const captured: Map<string, { el: ScannedElement; annotation: AnnotationState }> = new Map();

// ─── Inspector styles ─────────────────────────────────────────────────────────
function injectStyles() {
  const style = document.createElement('style');
  style.id = 'ahaget-inspector-styles';
  style.textContent = `
    .ahaget-highlight {
      outline: 2px solid rgba(99,102,241,0.7) !important;
      outline-offset: 2px !important;
      cursor: pointer !important;
      position: relative !important;
      transition: outline-color 0.15s !important;
    }
    .ahaget-highlight:hover {
      outline-color: rgba(99,102,241,1) !important;
      background: rgba(99,102,241,0.05) !important;
    }
    .ahaget-highlight.annotated {
      outline-color: rgba(16,185,129,0.8) !important;
    }
    #ahaget-inspector-toolbar {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      background: #1a1a2e;
      border: 1px solid rgba(99,102,241,0.3);
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      font-size: 12px;
      color: #e2e2ef;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      user-select: none;
    }
    #ahaget-inspector-toolbar .dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #10b981; animation: pulse-dot 2s infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
    }
    #ahaget-inspector-toolbar .stat {
      font-weight: 700; color: #6366f1;
    }
    #ahaget-save-btn {
      background: linear-gradient(135deg,#6366f1,#8b5cf6);
      color: #fff; border: none; border-radius: 8px;
      padding: 7px 14px; font-size: 12px; font-weight: 700;
      cursor: pointer; transition: opacity 0.15s;
    }
    #ahaget-save-btn:hover { opacity: 0.85; }
    #ahaget-save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    #ahaget-annotation-panel {
      position: fixed;
      top: 0; right: 0;
      width: 360px; height: 100vh;
      background: #1a1a2e;
      border-left: 1px solid rgba(99,102,241,0.25);
      z-index: 2147483646;
      display: flex; flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      box-shadow: -8px 0 32px rgba(0,0,0,0.3);
      transform: translateX(100%);
      transition: transform 0.2s ease;
    }
    #ahaget-annotation-panel.open { transform: translateX(0); }
    .ahaget-panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(99,102,241,0.15);
      display: flex; align-items: center; justify-content: space-between;
    }
    .ahaget-panel-title { font-size: 13px; font-weight: 700; color: #e2e2ef; }
    .ahaget-panel-close {
      background: none; border: none; color: #6b7280; font-size: 18px;
      cursor: pointer; padding: 0 4px; line-height: 1;
    }
    .ahaget-panel-close:hover { color: #e2e2ef; }
    .ahaget-panel-body { flex: 1; overflow-y: auto; padding: 16px 20px; }
    .ahaget-field { margin-bottom: 14px; }
    .ahaget-field label {
      display: block; font-size: 10px; font-weight: 700;
      color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em;
      margin-bottom: 5px;
    }
    .ahaget-field input, .ahaget-field textarea, .ahaget-field select {
      width: 100%; padding: 8px 10px; border-radius: 7px; font-size: 12px;
      background: #0f0f23; border: 1px solid rgba(99,102,241,0.2);
      color: #e2e2ef; outline: none; box-sizing: border-box; font-family: inherit;
      transition: border-color 0.15s;
    }
    .ahaget-field input:focus, .ahaget-field textarea:focus, .ahaget-field select:focus {
      border-color: rgba(99,102,241,0.6);
    }
    .ahaget-field textarea { min-height: 72px; resize: vertical; line-height: 1.5; }
    .ahaget-toggle {
      display: flex; align-items: center; gap: 10px;
      font-size: 12px; color: #9ca3af; cursor: pointer; margin-bottom: 14px;
    }
    .ahaget-toggle input { width: auto; }
    .ahaget-el-meta {
      background: #0f0f23; border-radius: 7px;
      padding: 8px 10px; margin-bottom: 14px;
      font-size: 11px; color: #6b7280; font-family: monospace;
      word-break: break-all;
    }
    .ahaget-panel-footer {
      padding: 14px 20px;
      border-top: 1px solid rgba(99,102,241,0.15);
      display: flex; gap: 10px;
    }
    .ahaget-btn-primary {
      flex: 1; background: linear-gradient(135deg,#6366f1,#8b5cf6);
      color: #fff; border: none; border-radius: 8px;
      padding: 9px; font-size: 12px; font-weight: 700; cursor: pointer;
    }
    .ahaget-btn-primary:hover { opacity: 0.85; }
    .ahaget-btn-secondary {
      background: rgba(99,102,241,0.1); color: #9ca3af;
      border: 1px solid rgba(99,102,241,0.2); border-radius: 8px;
      padding: 9px 14px; font-size: 12px; cursor: pointer;
    }
    .ahaget-btn-secondary:hover { color: #e2e2ef; }
    .ahaget-toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #1a1a2e; border: 1px solid rgba(99,102,241,0.3);
      border-radius: 10px; padding: 10px 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
      font-size: 12px; font-weight: 600; color: #e2e2ef;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 2147483647; white-space: nowrap;
      animation: slideUp 0.2s ease;
    }
    @keyframes slideUp {
      from { transform: translateX(-50%) translateY(10px); opacity: 0; }
      to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg: string, duration = 3000) {
  const existing = document.getElementById('ahaget-inspector-toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'ahaget-inspector-toast';
  el.className = 'ahaget-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
function createToolbar(): HTMLElement {
  const bar = document.createElement('div');
  bar.id = 'ahaget-inspector-toolbar';
  bar.innerHTML = `
    <div class="dot"></div>
    <span>Ahaget Inspector</span>
    <span><span class="stat" id="ahaget-el-count">0</span> elements</span>
    <span><span class="stat" id="ahaget-ann-count">0</span> annotated</span>
    <input id="ahaget-state-label" placeholder="State label (e.g. Modal open)"
      style="padding:5px 10px;border-radius:6px;font-size:11px;border:1px solid rgba(99,102,241,0.3);background:#0f0f23;color:#e2e2ef;outline:none;width:190px;" />
    <button id="ahaget-save-btn">Save Capture</button>
  `;
  document.body.appendChild(bar);

  document.getElementById('ahaget-save-btn')!.addEventListener('click', handleSave);
  return bar;
}

function updateToolbar() {
  const elCountEl = document.getElementById('ahaget-el-count');
  const annCountEl = document.getElementById('ahaget-ann-count');
  if (elCountEl) elCountEl.textContent = String(captured.size);
  if (annCountEl) {
    const annotated = Array.from(captured.values()).filter(
      (v) => v.annotation.customLabel || v.annotation.customDescription || v.annotation.businessRule
    );
    annCountEl.textContent = String(annotated.length);
  }
}

// ─── Annotation panel ─────────────────────────────────────────────────────────
let currentSelector: string | null = null;

function createAnnotationPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.id = 'ahaget-annotation-panel';
  panel.innerHTML = `
    <div class="ahaget-panel-header">
      <span class="ahaget-panel-title">Annotate Element</span>
      <button class="ahaget-panel-close" id="ahaget-panel-close">✕</button>
    </div>
    <div class="ahaget-panel-body">
      <div class="ahaget-el-meta" id="ahaget-el-meta"></div>
      <div class="ahaget-field">
        <label>Label</label>
        <input id="ahaget-ann-label" placeholder='e.g. "Billing entity selector"' />
      </div>
      <div class="ahaget-field">
        <label>Description</label>
        <textarea id="ahaget-ann-desc" placeholder="What does this element do?"></textarea>
      </div>
      <div class="ahaget-field">
        <label>Business Rule</label>
        <textarea id="ahaget-ann-rule" placeholder='e.g. "Selecting Personal blocks payment for unverified accounts"'></textarea>
      </div>
      <div class="ahaget-field">
        <label>Element Type Override</label>
        <select id="ahaget-ann-type">
          <option value="">Auto-detected</option>
          <option value="button">Button</option>
          <option value="input">Input</option>
          <option value="select">Select / Dropdown</option>
          <option value="textarea">Textarea</option>
          <option value="link">Link</option>
          <option value="modal_trigger">Modal Trigger</option>
          <option value="error_indicator">Error Indicator</option>
        </select>
      </div>
      <label class="ahaget-toggle">
        <input type="checkbox" id="ahaget-ann-sensitive" />
        Mark as sensitive (agent won't read or log this field's value)
      </label>
    </div>
    <div class="ahaget-panel-footer">
      <button class="ahaget-btn-primary" id="ahaget-ann-save">Save Annotation</button>
      <button class="ahaget-btn-secondary" id="ahaget-ann-cancel">Cancel</button>
    </div>
  `;
  document.body.appendChild(panel);

  document.getElementById('ahaget-panel-close')!.addEventListener('click', closePanel);
  document.getElementById('ahaget-ann-cancel')!.addEventListener('click', closePanel);
  document.getElementById('ahaget-ann-save')!.addEventListener('click', saveAnnotation);

  return panel;
}

function openPanel(el: ScannedElement) {
  currentSelector = el.selector;
  const panel = document.getElementById('ahaget-annotation-panel')!;

  // Load existing annotation if any
  const existing = captured.get(el.selector);
  const ann = existing?.annotation ?? {
    customLabel: '', customDescription: '', businessRule: '', isSensitive: false, elementType: '',
  };

  (document.getElementById('ahaget-el-meta') as HTMLElement).textContent =
    `<${el.tag}> ${el.selector}${el.text ? ` — "${el.text.slice(0, 40)}"` : ''}`;
  (document.getElementById('ahaget-ann-label') as HTMLInputElement).value = ann.customLabel;
  (document.getElementById('ahaget-ann-desc') as HTMLTextAreaElement).value = ann.customDescription;
  (document.getElementById('ahaget-ann-rule') as HTMLTextAreaElement).value = ann.businessRule;
  (document.getElementById('ahaget-ann-type') as HTMLSelectElement).value = ann.elementType;
  (document.getElementById('ahaget-ann-sensitive') as HTMLInputElement).checked = ann.isSensitive;

  panel.classList.add('open');
}

function closePanel() {
  const panel = document.getElementById('ahaget-annotation-panel');
  panel?.classList.remove('open');
  currentSelector = null;
}

function saveAnnotation() {
  if (!currentSelector) return;
  const entry = captured.get(currentSelector);
  if (!entry) return;

  entry.annotation = {
    customLabel:       (document.getElementById('ahaget-ann-label') as HTMLInputElement).value.trim(),
    customDescription: (document.getElementById('ahaget-ann-desc') as HTMLTextAreaElement).value.trim(),
    businessRule:      (document.getElementById('ahaget-ann-rule') as HTMLTextAreaElement).value.trim(),
    isSensitive:       (document.getElementById('ahaget-ann-sensitive') as HTMLInputElement).checked,
    elementType:       (document.getElementById('ahaget-ann-type') as HTMLSelectElement).value,
  };

  // Update DOM highlight state
  const domEl = document.querySelector(currentSelector);
  if (domEl) {
    const hasAnnotation = !!(entry.annotation.customLabel || entry.annotation.customDescription || entry.annotation.businessRule);
    domEl.classList.toggle('annotated', hasAnnotation);
  }

  updateToolbar();
  closePanel();
  showToast('✅ Annotation saved');
}

// ─── Element highlighting ─────────────────────────────────────────────────────
function highlightElements(elements: ScannedElement[]) {
  // Clear existing highlights first
  document.querySelectorAll('.ahaget-highlight').forEach((el) => {
    el.classList.remove('ahaget-highlight', 'annotated');
  });

  elements.forEach((el) => {
    const domEl = document.querySelector(el.selector);
    if (!domEl) return;

    // Skip anything already part of the inspector UI
    if (domEl.closest('#ahaget-inspector-toolbar') ||
        domEl.closest('#ahaget-annotation-panel')) return;

    domEl.classList.add('ahaget-highlight');
    captured.set(el.selector, {
      el,
      annotation: captured.get(el.selector)?.annotation ?? {
        customLabel: '', customDescription: '', businessRule: '',
        isSensitive: false, elementType: '',
      },
    });

    domEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openPanel(el);
    }, { capture: true });
  });

  updateToolbar();
}

// ─── Save capture ──────────────────────────────────────────────────────────────
async function handleSave() {
  const btn = document.getElementById('ahaget-save-btn') as HTMLButtonElement;
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = 'Saving…';

  const config = (window as any).__ahaget_inspector_config as InspectorConfig;
  const framework = detectFramework();

  const elements = Array.from(captured.values()).map(({ el, annotation }) => ({
    tag:         el.tag,
    selector:    el.selector,
    text:        el.text,
    elementType: annotation.elementType || undefined,
    inputType:   el.type,
    ariaLabel:   el.ariaLabel,
    placeholder: el.placeholder,
    name:        el.name,
    dataTestId:  el.dataTestId,
    role:        el.role,
    classes:     el.classes,
    rect:        el.rect,
    // Annotations are sent here too so the backend can store them immediately
    customLabel:       annotation.customLabel || undefined,
    customDescription: annotation.customDescription || undefined,
    businessRule:      annotation.businessRule || undefined,
    isSensitive:       annotation.isSensitive || undefined,
  }));

  try {
    const res = await fetch(`${config.apiUrl}/api/v1/interface-map/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
      body: JSON.stringify({
        url:        window.location.pathname,
        title:      document.title,
        stateLabel: (document.getElementById('ahaget-state-label') as HTMLInputElement)?.value.trim() || 'Default',
        framework,
        elements,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    showToast(`✅ Capture saved — ${data.snapshot?.elements?.length ?? elements.length} elements stored`);
    btn.textContent = '✅ Saved';
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Save Capture';
    }, 3000);
  } catch (err) {
    console.error('[ahaget-inspector] save failed:', err);
    showToast('❌ Save failed — check console');
    btn.disabled = false;
    btn.textContent = 'Save Capture';
  }
}

// ─── SPA route-change re-scan ─────────────────────────────────────────────────
function watchRouteChanges(rescan: () => void) {
  let lastUrl = window.location.href;

  // History API
  const orig = history.pushState.bind(history);
  history.pushState = (...args) => {
    orig(...args);
    if (window.location.href !== lastUrl) { lastUrl = window.location.href; rescan(); }
  };
  window.addEventListener('popstate', () => {
    if (window.location.href !== lastUrl) { lastUrl = window.location.href; rescan(); }
  });
}

// ─── Main entry ───────────────────────────────────────────────────────────────
export function initInspector(config: InspectorConfig) {
  // Store config globally for save handler
  (window as any).__ahaget_inspector_config = config;

  injectStyles();
  createToolbar();
  createAnnotationPanel();

  function rescan() {
    // Clear captured on route change
    captured.clear();
    const page = scanPage();
    highlightElements(page.elements as unknown as ScannedElement[]);
  }

  // Initial scan (wait for DOM settle)
  setTimeout(rescan, 300);

  // Re-scan on SPA navigation
  watchRouteChanges(() => setTimeout(rescan, 300));

  // Re-scan when significant DOM changes occur
  const observer = new MutationObserver(() => {
    clearTimeout((window as any).__ahaget_rescan_timeout);
    (window as any).__ahaget_rescan_timeout = setTimeout(rescan, 500);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  showToast('🔍 Ahaget Inspector active — click any element to annotate');
}
