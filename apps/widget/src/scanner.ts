// ─── Auto DOM Scanner ─────────────────────────────────────────────────────────
// Scans the live page for interactive elements and returns a semantic map.
// Sent to the agent on every message so it can reference real selectors
// without any per-flow CSS selector configuration.
//
// Each element is fingerprinted with every stable signal available
// (text, role, ariaLabel, placeholder, name, dataTestId, classes, rect)
// so the self-healing resolver can recover when a CSS selector breaks
// after a UI redesign.

export interface ScannedElement {
  tag: string;
  selector: string;       // primary CSS selector (may become stale after UI changes)
  text: string;           // visible text / button label
  type?: string;          // input[type]
  // ─── Fingerprint signals for self-healing ───────────────────────────────────
  ariaLabel?: string;     // aria-label attribute
  placeholder?: string;   // placeholder text (inputs/textareas)
  name?: string;          // name attribute
  dataTestId?: string;    // data-testid or data-cy
  role?: string;          // aria role or implicit role
  classes: string[];      // CSS classes (filtered, for fuzzy matching)
  rect: { x: number; y: number; w: number; h: number }; // viewport position
  disabled?: boolean;     // element is disabled
  checked?: boolean;      // checkbox/radio checked state (mirrors PageElement)
  selectedText?: string;  // <select> human-readable selected option (mirrors PageElement)
}

// PageElement includes value so the agent can verify fills
export type PageElement = Pick<ScannedElement, 'tag' | 'selector' | 'text' | 'type'> & {
  value?: string;
  checked?: boolean;       // checkbox/radio checked state
  disabled?: boolean;      // element is disabled/non-interactive
  selectedText?: string;   // <select> human-readable selected option label
};

export interface PageContext {
  url: string;
  title: string;
  headings: string[];
  elements: PageElement[];
  semanticSummary?: string;
  modalContext?: {
    title: string;
    elements: PageElement[];
  } | null;
  recentDomEvents?: string[];
  validationErrors?: string[];
}

// ─── Module-level element index ───────────────────────────────────────────────
// Updated on every scanPage() call. The resolver reads from this to find
// fingerprints by their original selector string.
let _elementIndex: Map<string, ScannedElement> = new Map();

export function getElementIndex(): ReadonlyMap<string, ScannedElement> {
  return _elementIndex;
}

// ─── DOM mutation delta buffer ─────────────────────────────────────────────────
// High-signal DOM changes (alerts, dialogs, error toasts) are captured here
// between user messages. scanPage() drains the buffer into recentDomEvents[].
// startDomObserver() (added in Task 7) populates this buffer via MutationObserver.
let _domDeltas: string[] = [];
const DOM_DELTA_CAP = 10;

export function flushDomDeltas(): string[] {
  const deltas = [..._domDeltas];
  _domDeltas = [];
  return deltas;
}

// Used by startDomObserver() to push high-signal events
export function pushDomDelta(sig: string): void {
  if (_domDeltas.length < DOM_DELTA_CAP) _domDeltas.push(sig);
}

function getNodeSignal(el: HTMLElement): string | null {
  if (el.closest && el.closest('#oai-root')) return null;
  const role = el.getAttribute('role');
  const text = el.innerText?.trim().slice(0, 80) ?? '';
  if (!text) return null;
  if (role === 'alert')  return `[ALERT] ${text}`;
  if (role === 'dialog') return `[DIALOG OPENED] ${text.slice(0, 40)}`;
  if (role === 'status') return `[STATUS] ${text}`;
  if (/\b(error|toast|notification|snackbar|alert)/i.test(el.className)) return `[DYNAMIC] ${text}`;
  return null;
}

export function startDomObserver(): void {
  if (typeof MutationObserver === 'undefined') return;
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of Array.from(m.addedNodes)) {
        if (!(node instanceof HTMLElement)) continue;
        const sig = getNodeSignal(node);
        if (sig) pushDomDelta(sig);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bestSelector(el: Element): string {
  if (el.id && !el.id.startsWith('oai-')) return `#${el.id}`;
  const name = el.getAttribute('name');
  if (name) return `[name="${name}"]`;
  const testId = el.getAttribute('data-testid') || el.getAttribute('data-cy');
  if (testId) return `[data-testid="${testId}"]`;
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return `[aria-label="${ariaLabel}"]`;
  const classes = Array.from(el.classList)
    .filter((c) => !c.startsWith('oai-'))
    .slice(0, 2)
    .join('.');
  return classes
    ? `${el.tagName.toLowerCase()}.${classes}`
    : el.tagName.toLowerCase();
}

function labelFor(el: Element): string {
  const id = el.id;
  if (id) {
    const label = document.querySelector<HTMLElement>(`label[for="${id}"]`);
    if (label) return label.innerText.trim();
  }
  const wrappingLabel = el.closest('label');
  if (wrappingLabel) {
    return wrappingLabel.innerText.replace((el as HTMLInputElement).value ?? '', '').trim();
  }
  return '';
}

function implicitRole(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const roleMap: Record<string, string> = {
    button: 'button', a: 'link', input: 'textbox',
    select: 'combobox', textarea: 'textbox', h1: 'heading',
    h2: 'heading', h3: 'heading', nav: 'navigation',
  };
  return el.getAttribute('role') || roleMap[tag] || tag;
}

function getRect(el: Element): ScannedElement['rect'] {
  const r = el.getBoundingClientRect();
  return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
}

function fingerprint(el: Element, tag: string, text: string, type?: string): ScannedElement {
  return {
    tag,
    selector: bestSelector(el),
    text,
    type,
    ariaLabel:   el.getAttribute('aria-label')   || undefined,
    placeholder: el.getAttribute('placeholder')  || undefined,
    name:        el.getAttribute('name')          || undefined,
    dataTestId:  el.getAttribute('data-testid') || el.getAttribute('data-cy') || undefined,
    role:        implicitRole(el),
    classes:     Array.from(el.classList).filter((c) => !c.startsWith('oai-')),
    rect:        getRect(el),
  };
}

// ─── Modal/dialog detection ───────────────────────────────────────────────────
// Returns the first open modal/dialog element, or null if none is found.
function detectModal(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[role="dialog"]:not([hidden]), [aria-modal="true"]:not([hidden]), ' +
    '.modal:not([hidden]):not(.oai-modal)'
  );
}

function modalTitle(el: HTMLElement): string {
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labeller = document.getElementById(labelledBy);
    if (labeller) return labeller.innerText?.trim().slice(0, 60) ?? '';
  }
  const heading = el.querySelector('h1, h2, h3, h4, [class*="modal-title"], [class*="dialog-title"]');
  if (heading) return (heading as HTMLElement).innerText?.trim().slice(0, 60) ?? '';
  return el.getAttribute('aria-label') ?? '';
}

// ─── Main scan ────────────────────────────────────────────────────────────────

export function scanPage(): PageContext {
  const elements: ScannedElement[] = [];
  const seen = new Set<string>();

  const push = (item: ScannedElement) => {
    if (seen.has(item.selector)) return;
    seen.add(item.selector);
    elements.push(item);
  };

  // Buttons
  document.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [role="button"], input[type="submit"], input[type="button"]'
  ).forEach((el) => {
    if (el.closest('#oai-root')) return;
    const text =
      el.innerText?.trim() ||
      el.getAttribute('aria-label') ||
      (el as HTMLInputElement).value ||
      '';
    if (!text) return;
    push(fingerprint(el, 'button', text));
  });

  // Inputs / textareas / selects — sensitive fields are excluded from the
  // page context sent to the AI (password, credit card, CVV, etc.)
  const SENSITIVE_AUTOCOMPLETE = new Set([
    'current-password', 'new-password', 'cc-number', 'cc-csc',
    'cc-exp', 'cc-exp-month', 'cc-exp-year', 'cc-name',
  ]);
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    'input:not([type="hidden"]):not([type="password"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'
  ).forEach((el) => {
    if (el.closest('#oai-root')) return;
    // Skip sensitive autocomplete hints (credit card, passwords)
    const ac = el.getAttribute('autocomplete') ?? '';
    if (SENSITIVE_AUTOCOMPLETE.has(ac)) return;
    // Skip any field whose name/id looks sensitive (password, SSN, credit card, etc.)
    const nameAttr = (el.getAttribute('name') ?? '').toLowerCase();
    const idAttr   = (el.getAttribute('id')   ?? '').toLowerCase();
    const combined = nameAttr + ' ' + idAttr;
    if (/password|passwd|secret|ssn|social.?security|credit.?card|card.?number|cvv|cvc|pin\b/.test(combined)) return;

    const text =
      labelFor(el) ||
      el.getAttribute('placeholder') ||
      el.getAttribute('aria-label') ||
      el.getAttribute('name') ||
      '';
    const fp = fingerprint(el, el.tagName.toLowerCase(), text, (el as HTMLInputElement).type || undefined);

    const inputType = (el as HTMLInputElement).type;
    const checked = (inputType === 'checkbox' || inputType === 'radio')
      ? (el as HTMLInputElement).checked
      : undefined;

    const selectedText = el.tagName.toLowerCase() === 'select'
      ? (() => {
          const sel = el as HTMLSelectElement;
          return sel.options[sel.selectedIndex]?.text?.trim() || undefined;
        })()
      : undefined;

    push({ ...fp, checked, selectedText } as ScannedElement);
  });

  // Links
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((el) => {
    if (el.closest('#oai-root')) return;
    const text = el.innerText?.trim();
    if (!text || text.length > 50) return;
    push(fingerprint(el, 'a', text));
  });

  // Disabled interactive elements — invisible to the agent without this scan
  document.querySelectorAll<HTMLElement>(
    'button[disabled]:not([type="hidden"]), input[disabled]:not([type="hidden"]):not([type="password"]), ' +
    'select[disabled], textarea[disabled], [role="button"][aria-disabled="true"]'
  ).forEach((el) => {
    if (el.closest('#oai-root')) return;
    const text =
      (el as HTMLButtonElement).innerText?.trim() ||
      el.getAttribute('aria-label') ||
      (el as HTMLInputElement).value ||
      el.getAttribute('placeholder') ||
      '';
    if (!text) return;
    const fp = fingerprint(el, el.tagName.toLowerCase(), text, (el as HTMLInputElement).type || undefined);
    push({ ...fp, disabled: true } as ScannedElement);
  });

  // Custom interactive elements: ARIA roles and contenteditable
  document.querySelectorAll<HTMLElement>(
    '[role="switch"], [role="combobox"]:not(select), [role="listbox"], [contenteditable="true"]'
  ).forEach((el) => {
    if (el.closest('#oai-root')) return;
    const text = el.getAttribute('aria-label') || el.innerText?.trim().slice(0, 60) || '';
    if (!text) return;
    const role = el.getAttribute('role') ?? 'contenteditable';
    push(fingerprint(el, role, text));
  });

  // ── Modal scan ────────────────────────────────────────────────────────────────
  const modalEl = detectModal();
  let modalContext: PageContext['modalContext'] = null;
  const modalSelectors = new Set<string>();

  if (modalEl) {
    const modalEls: PageElement[] = [];
    modalEl.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [role="button"], input:not([type="hidden"]):not([type="password"]):not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), a[href]'
    ).forEach((child) => {
      const childText =
        (child as HTMLButtonElement).innerText?.trim() ||
        child.getAttribute('aria-label') ||
        (child as HTMLInputElement).value ||
        child.getAttribute('placeholder') ||
        '';
      if (!childText) return;
      const childFp = fingerprint(child, child.tagName.toLowerCase(), childText, (child as HTMLInputElement).type || undefined);
      modalSelectors.add(childFp.selector);
      const childInputType = (child as HTMLInputElement).type;
      modalEls.push({
        tag: childFp.tag,
        selector: childFp.selector,
        text: childFp.text,
        type: childFp.type,
        checked: (childInputType === 'checkbox' || childInputType === 'radio')
          ? (child as HTMLInputElement).checked
          : undefined,
        disabled: (child as HTMLButtonElement).disabled || undefined,
      });
    });
    modalContext = { title: modalTitle(modalEl), elements: modalEls.slice(0, 15) };
  }

  // ── DOM event deltas from observer ───────────────────────────────────────────
  const recentDomEvents = flushDomDeltas();

  // ── Update module-level index for the resolver ───────────────────────────────
  _elementIndex = new Map(elements.map((e) => [e.selector, e]));

  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .map((h) => (h as HTMLElement).innerText?.trim())
    .filter(Boolean)
    .slice(0, 6) as string[];

  // ── Build lean PageElement list for agent — exclude elements in the modal ────
  const pageElements: PageElement[] = elements.slice(0, 50)
    .filter((e) => !modalSelectors.has(e.selector))
    .slice(0, 40)
    .map((e) => {
      const domEl = document.querySelector(e.selector) as HTMLInputElement | null;
      const value = (domEl && domEl.value) ? domEl.value : undefined;
      return {
        tag: e.tag,
        selector: e.selector,
        text: e.text,
        type: e.type,
        ...(value                          ? { value }                              : {}),
        ...(e.checked !== undefined        ? { checked: e.checked }                 : {}),
        ...((e as PageElement).disabled    ? { disabled: true }                     : {}),
        ...((e as PageElement).selectedText ? { selectedText: (e as PageElement).selectedText } : {}),
      };
    });

  const validationErrors = scanValidationErrors();

  return {
    url: window.location.pathname,
    title: document.title,
    headings,
    elements: pageElements,
    ...(modalContext             ? { modalContext }              : {}),
    ...(recentDomEvents.length   ? { recentDomEvents }           : {}),
    ...(validationErrors.length  ? { validationErrors }          : {}),
  };
}

// ─── Validation error scanner ────────────────────────────────────────────────
// Detects visible validation error messages near form fields and in ARIA live
// regions. Deduplicated and capped to avoid overwhelming the agent.
function scanValidationErrors(): string[] {
  const ERROR_SELECTORS = [
    '[role="alert"]',
    '[aria-live="polite"]',
    '[aria-live="assertive"]',
    '.error', '.error-message', '[data-error]',
    'input:invalid + *', 'input[aria-invalid="true"] + *',
  ];
  const errors: string[] = [];
  for (const sel of ERROR_SELECTORS) {
    try {
      document.querySelectorAll(sel).forEach((el) => {
        if (el.closest('#oai-root')) return;
        const text = (el as HTMLElement).innerText?.trim();
        if (text && text.length > 0 && text.length < 200) errors.push(text);
      });
    } catch { /* invalid selector in some browsers — skip */ }
  }
  return [...new Set(errors)].slice(0, 5);
}

// ─── Semantic DOM layer ───────────────────────────────────────────────────────
// Produces a structured natural-language summary of the current page state for
// goal-mode agent turns. Gives the agent richer reasoning material than a raw
// element dump.

function detectPageType(): string {
  // Wizard / stepper
  if (document.querySelector('[class*="wizard"], [class*="stepper"], [class*="step-indicator"], [role="tablist"]')) {
    return 'Multi-step wizard';
  }
  // Settings / config
  const title = document.title.toLowerCase();
  const h1 = document.querySelector('h1')?.textContent?.toLowerCase() ?? '';
  if (title.includes('setting') || h1.includes('setting') || h1.includes('config')) return 'Settings page';
  // Dashboard
  if (title.includes('dashboard') || h1.includes('dashboard') || document.querySelectorAll('[class*="card"], [class*="metric"], [class*="stat"]').length > 3) return 'Dashboard';
  // Form-heavy
  const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="search"]), textarea, select');
  if (inputs.length >= 3) return 'Form';
  return 'Page';
}

function detectWizard(): { current: number; total: number; stepTitle: string } | null {
  // Look for step indicators with active/current state
  const steps = Array.from(document.querySelectorAll('[class*="step"]:not([class*="complete"]):not([class*="done"])'));
  const activeStep = steps.find((el) =>
    el.classList.toString().match(/active|current|selected/) ||
    el.getAttribute('aria-current') === 'step'
  );
  if (!activeStep) return null;
  const total = steps.length;
  if (total < 2) return null;
  const current = steps.indexOf(activeStep) + 1;
  const stepTitle = (activeStep as HTMLElement).innerText?.trim().slice(0, 50) ?? '';
  return { current, total, stepTitle };
}

function detectFormSections(): string[] {
  const sections: string[] = [];
  // fieldset legends
  document.querySelectorAll('fieldset > legend').forEach((el) => {
    const text = (el as HTMLElement).innerText?.trim();
    if (text) sections.push(text);
  });
  // section headings near forms
  document.querySelectorAll('h2, h3, h4').forEach((el) => {
    const next = el.nextElementSibling;
    if (next && (next.tagName === 'FORM' || next.querySelector('input, select, textarea'))) {
      const text = (el as HTMLElement).innerText?.trim();
      if (text) sections.push(text);
    }
  });
  return sections.slice(0, 3);
}

function categorizeFields(): { required: string[]; optional: string[]; filled: string[] } {
  const required: string[] = [];
  const optional: string[] = [];
  const filled: string[] = [];

  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    'input:not([type="hidden"]):not([type="password"]):not([type="submit"]):not([type="button"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'
  ).forEach((el) => {
    if (el.closest('#oai-root')) return;
    const label = fieldLabel(el);
    if (!label) return;

    const value = (el as HTMLInputElement).value?.trim();
    const isRequired = el.required || el.getAttribute('aria-required') === 'true' || !!el.closest('[data-required]');

    if (value) {
      filled.push(`${label}="${value.slice(0, 30)}"`);
    } else if (isRequired) {
      required.push(label);
    } else {
      optional.push(label);
    }
  });

  return { required: required.slice(0, 8), optional: optional.slice(0, 5), filled: filled.slice(0, 8) };
}

function fieldLabel(el: Element): string {
  const id = el.id;
  if (id) {
    const lbl = document.querySelector<HTMLElement>(`label[for="${id}"]`);
    if (lbl) return lbl.innerText.trim().replace(/[*:]/g, '').trim();
  }
  const wrapping = el.closest('label');
  if (wrapping) return (wrapping as HTMLElement).innerText.replace((el as HTMLInputElement).value ?? '', '').trim().replace(/[*:]/g, '').trim();
  return el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('name') || '';
}

function detectPrimaryButton(): { label: string; disabled: boolean } | null {
  // Submit buttons and primary-styled buttons
  const candidates = Array.from(document.querySelectorAll<HTMLButtonElement | HTMLInputElement>(
    'button[type="submit"], input[type="submit"], button.primary, button[class*="primary"], button[class*="submit"], button[class*="save"], button[class*="continue"], button[class*="next"]'
  )).filter((el) => !el.closest('#oai-root'));

  if (candidates.length === 0) return null;
  const btn = candidates[0];
  const label = (btn as HTMLButtonElement).innerText?.trim() || (btn as HTMLInputElement).value || btn.getAttribute('aria-label') || 'Submit';
  return { label: label.slice(0, 40), disabled: (btn as HTMLButtonElement).disabled };
}

function detectErrors(): string[] {
  const errors: string[] = [];
  document.querySelectorAll<HTMLElement>(
    '[role="alert"], [class*="error"]:not([class*="oai"]), [class*="invalid"]:not([class*="oai"]), .field-error, [aria-invalid="true"] + *, [data-error]'
  ).forEach((el) => {
    if (el.closest('#oai-root')) return;
    const text = el.innerText?.trim();
    if (text && text.length < 120) errors.push(text);
  });
  return [...new Set(errors)].slice(0, 5);
}

export function buildSemanticSummary(): string {
  const lines: string[] = [];

  // ── Page type detection ──────────────────────────────────────────────────────
  const pageType = detectPageType();
  lines.push(`PAGE TYPE: ${pageType}`);

  // ── Modal awareness ──────────────────────────────────────────────────────────
  const openModal = detectModal();
  if (openModal) {
    const title = modalTitle(openModal);
    lines.push(`MODAL OPEN${title ? `: "${title}"` : ''}`);
  }

  // ── Loading state ─────────────────────────────────────────────────────────────
  const isLoading = !!(
    document.querySelector('[aria-busy="true"]') ||
    document.querySelector('[class*="skeleton"], [class*="loading"], [class*="spinner"]')
  );
  if (isLoading) lines.push('LOADING: true — page may still be rendering, avoid interactions');

  // ── ARIA live regions (dynamic server feedback) ───────────────────────────────
  const liveTexts: string[] = [];
  document.querySelectorAll<HTMLElement>(
    '[aria-live]:not([aria-live="off"]), [role="status"], [role="log"]'
  ).forEach((el) => {
    if (el.closest('#oai-root')) return;
    const t = el.innerText?.trim();
    if (t && t.length < 100) liveTexts.push(t);
  });
  if (liveTexts.length > 0) lines.push(`LIVE REGION: "${liveTexts[0]}"`);

  // ── Wizard / stepper detection ───────────────────────────────────────────────
  const wizard = detectWizard();
  if (wizard) lines.push(`WIZARD: Step ${wizard.current} of ${wizard.total} — "${wizard.stepTitle}"`);

  // ── Form sections ────────────────────────────────────────────────────────────
  const sections = detectFormSections();
  if (sections.length > 0) {
    lines.push(`ACTIVE SECTION: "${sections[0]}"`);
  }

  // ── Field states ─────────────────────────────────────────────────────────────
  const { required, optional, filled } = categorizeFields();
  if (required.length > 0) lines.push(`REQUIRED (empty): ${required.join(', ')}`);
  if (filled.length > 0)   lines.push(`FILLED: ${filled.join(', ')}`);
  if (optional.length > 0 && optional.length <= 5) lines.push(`OPTIONAL: ${optional.join(', ')}`);

  // ── Submit / primary action ───────────────────────────────────────────────────
  const primaryBtn = detectPrimaryButton();
  if (primaryBtn) lines.push(`PRIMARY ACTION: "${primaryBtn.label}" (${primaryBtn.disabled ? 'disabled' : 'enabled'})`);

  // ── Errors ───────────────────────────────────────────────────────────────────
  const errors = detectErrors();
  if (errors.length > 0) lines.push(`ERRORS: ${errors.slice(0, 3).join('; ')}`);
  else lines.push('ERRORS: None');

  return lines.join('\n');
}
