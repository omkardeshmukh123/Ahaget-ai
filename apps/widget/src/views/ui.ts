// --- UI components for the Ahaget side-panel widget ---------------------------

export interface StepsResponse {
  type: 'steps';
  title: string;
  items: string[];
}

export function tryParseSteps(text: string): StepsResponse | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.type === 'steps' && Array.isArray(parsed.items)) return parsed as StepsResponse;
  } catch { /* not JSON */ }
  return null;
}

export function createRoot(): HTMLDivElement {
  const root = document.createElement('div');
  root.id = 'oai-root';
  document.body.appendChild(root);
  return root;
}

// -- Side panel -----------------------------------------------------------------
export function createSidePanel(root: HTMLElement): HTMLDivElement {
  const win = document.createElement('div');
  win.id = 'oai-window';
  win.className = 'oai-hidden';
  win.setAttribute('role', 'complementary');
  win.setAttribute('aria-label', 'Ahaget AI assistant');
  win.innerHTML = `
    <!-- Collapse/expand tab on the left edge -->
    <button id="oai-toggle" aria-label="Collapse panel">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>

    <div id="oai-header">
      <div id="oai-header-top">
        <div id="oai-avatar">?</div>
        <div id="oai-header-text">
          <p id="oai-header-title">Ahaget</p>
          <p id="oai-header-sub">Your AI employee · Ahaget</p>
        </div>
      </div>
      <div id="oai-steps-nav"></div>
    </div>

    <div id="oai-messages" role="log" aria-live="polite"></div>

    <div id="oai-input-row">
      <textarea
        id="oai-input"
        rows="1"
        placeholder="Type a message�"
        aria-label="Message input"
      ></textarea>
      <button id="oai-send" aria-label="Send" disabled>
        <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </div>

    <div id="oai-footer">AI employee by <a href="https://ahaget.ai" target="_blank" rel="noopener">Ahaget</a></div>
  `;
  root.appendChild(win);
  return win;
}

// -- Step progress nav ----------------------------------------------------------
export function renderStepProgress(
  steps: Array<{ id: string; title: string; order: number }>,
  currentStepId: string,
  completedStepIds: string[]
) {
  const nav = document.getElementById('oai-steps-nav');
  if (!nav) return;
  nav.innerHTML = '';

  steps.forEach((step, i) => {
    const isDone = completedStepIds.includes(step.id);
    const isActive = step.id === currentStepId && !isDone;

    const node = document.createElement('div');
    node.className = `oai-step-node${isDone ? ' done' : ''}${isActive ? ' active' : ''}`;

    const circle = document.createElement('div');
    circle.className = 'oai-step-circle';
    circle.textContent = isDone ? '?' : String(i + 1);

    const label = document.createElement('div');
    label.className = 'oai-step-label';
    label.textContent = step.title;

    node.appendChild(circle);
    node.appendChild(label);
    nav.appendChild(node);
  });
}

// -- Messages -------------------------------------------------------------------
export function addMessage(
  messagesEl: HTMLElement,
  content: string,
  role: 'user' | 'assistant'
) {
  const div = document.createElement('div');
  div.className = role === 'assistant' ? 'oai-msg-ai' : 'oai-msg-user';
  div.textContent = content;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

// -- Feedback buttons (thumbs up / down on assistant messages) -----------------
export function addFeedbackButtons(
  msgEl: HTMLElement,
  onFeedback: (value: 1 | -1) => void
) {
  const row = document.createElement('div');
  row.className = 'oai-feedback';

  const up   = document.createElement('button');
  const down = document.createElement('button');
  up.className   = 'oai-feedback-btn';
  down.className = 'oai-feedback-btn';
  up.setAttribute('aria-label', 'Helpful');
  down.setAttribute('aria-label', 'Not helpful');
  up.textContent   = '??';
  down.textContent = '??';

  const handle = (value: 1 | -1, active: HTMLButtonElement, inactive: HTMLButtonElement) => {
    active.classList.add('oai-feedback-active');
    inactive.disabled = true;
    active.disabled   = true;
    onFeedback(value);
  };

  up.addEventListener('click',   () => handle(1,  up,   down));
  down.addEventListener('click', () => handle(-1, down, up));

  row.appendChild(up);
  row.appendChild(down);
  msgEl.appendChild(row);
  return row;
}

export function addStepPill(messagesEl: HTMLElement, label: string) {
  const pill = document.createElement('div');
  pill.className = 'oai-step-pill';
  pill.textContent = label;
  messagesEl.appendChild(pill);
}

// -- Action toast ---------------------------------------------------------------
export function addActionToast(messagesEl: HTMLElement, message: string) {
  const toast = document.createElement('div');
  toast.className = 'oai-action-toast';
  const icon = document.createElement('span');
  icon.className = 'oai-toast-icon';
  icon.textContent = '?';
  const text = document.createElement('span');
  text.textContent = message;
  toast.appendChild(icon);
  toast.appendChild(text);
  messagesEl.appendChild(toast);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return toast;
}

// -- Quick-reply chips ----------------------------------------------------------
export function addChips(
  messagesEl: HTMLElement,
  question: string,
  options: string[],
  onSelect: (opt: string) => void
) {
  const wrap = document.createElement('div');
  wrap.className = 'oai-msg-ai';

  if (question) {
    const q = document.createElement('div');
    q.style.marginBottom = '10px';
    q.textContent = question;
    wrap.appendChild(q);
  }

  const row = document.createElement('div');
  row.className = 'oai-chips';
  options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'oai-chip';
    btn.textContent = opt;
    btn.style.animationDelay = `${i * 0.06}s`;
    btn.addEventListener('click', () => {
      wrap.querySelectorAll('.oai-chip').forEach((c) => ((c as HTMLButtonElement).disabled = true));
      onSelect(opt);
    });
    row.appendChild(btn);
  });

  wrap.appendChild(row);
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return wrap;
}

// -- Celebration card -----------------------------------------------------------
export function addCelebration(messagesEl: HTMLElement, headline: string, insight: string) {
  const card = document.createElement('div');
  card.className = 'oai-celebration';
  const emoji = document.createElement('span');
  emoji.className = 'oai-celebration-emoji';
  emoji.textContent = '??';
  const h = document.createElement('div');
  h.className = 'oai-celebration-headline';
  h.textContent = headline;
  const ins = document.createElement('div');
  ins.className = 'oai-celebration-insight';
  ins.textContent = insight;
  card.append(emoji, h, ins);
  messagesEl.appendChild(card);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return card;
}

// -- Streaming bubble -----------------------------------------------------------
export function createStreamingBubble(messagesEl: HTMLElement): HTMLDivElement {
  const div = document.createElement('div');
  div.className = 'oai-msg-ai oai-streaming';
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

// -- Plan checklist -------------------------------------------------------------
export interface PlanPhase { id: string; title: string; description: string }

export function renderPlanChecklist(messagesEl: HTMLElement, phases: PlanPhase[]): HTMLElement {
  const card = document.createElement('div');
  card.className = 'oai-plan-card';
  const header = document.createElement('div');
  header.className = 'oai-plan-header';
  header.textContent = "Here's the plan:";
  card.appendChild(header);
  const list = document.createElement('ol');
  list.className = 'oai-plan-list';
  phases.forEach((phase, i) => {
    const item = document.createElement('li');
    item.id = `oai-plan-phase-${phase.id}`;
    item.className = 'oai-plan-phase oai-plan-pending';
    item.innerHTML = `<div class="oai-plan-phase-circle">${i + 1}</div><div class="oai-plan-phase-content"><div class="oai-plan-phase-title">${phase.title}</div><div class="oai-plan-phase-desc">${phase.description}</div></div>`;
    list.appendChild(item);
  });
  card.appendChild(list);
  messagesEl.appendChild(card);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return card;
}

export function updatePlanPhase(phaseId: string, status: 'active' | 'done') {
  const item = document.getElementById(`oai-plan-phase-${phaseId}`);
  if (!item) return;
  item.className = `oai-plan-phase oai-plan-${status}`;
  if (status === 'done') {
    const circle = item.querySelector('.oai-plan-phase-circle');
    if (circle) circle.textContent = '?';
  }
}

// -- Execution steps card (collapsible, live-ticking, with elapsed timer) -------
// Matches the Tandem "Show N steps ⏱ 4s" card that appears when the agent
// starts executing a multi-step task on the page.
export interface ExecStep {
  id: string;
  label: string;
  status: 'pending' | 'doing' | 'done';
}

let _execCardTimer: ReturnType<typeof setInterval> | null = null;

export function addStepsCard(messagesEl: HTMLElement, steps: StepsResponse): HTMLDivElement {
  // Convert simple StepsResponse into ExecStep array
  const execSteps: ExecStep[] = steps.items.map((label, i) => ({
    id: `exec-${Date.now()}-${i}`,
    label,
    status: 'pending',
  }));
  return addExecStepsCard(messagesEl, steps.title, execSteps);
}

export function addExecStepsCard(
  messagesEl: HTMLElement,
  title: string,
  steps: ExecStep[]
): HTMLDivElement {
  // Stop any previous timer
  if (_execCardTimer) { clearInterval(_execCardTimer); _execCardTimer = null; }

  const card = document.createElement('div');
  card.className = 'oai-exec-card';

  // ── Collapsed header row ─────────────────────────────────────────────────
  const headerBtn = document.createElement('button');
  headerBtn.className = 'oai-exec-header';

  const chevron = document.createElement('span');
  chevron.className = 'oai-exec-chevron oai-exec-open';
  chevron.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>`;

  const headerLabel = document.createElement('span');
  headerLabel.className = 'oai-exec-header-label';
  headerLabel.textContent = `${title} · ${steps.length} steps`;

  const timerEl = document.createElement('span');
  timerEl.className = 'oai-exec-timer';
  timerEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span class="oai-exec-secs">0s</span>`;

  headerBtn.appendChild(chevron);
  headerBtn.appendChild(headerLabel);
  headerBtn.appendChild(timerEl);
  card.appendChild(headerBtn);

  // ── Steps list ───────────────────────────────────────────────────────────
  const list = document.createElement('div');
  list.className = 'oai-exec-list';

  const stepEls: HTMLDivElement[] = steps.map((step) => {
    const row = document.createElement('div');
    row.className = 'oai-exec-step';
    row.id = `oai-exec-step-${step.id}`;

    const icon = document.createElement('span');
    icon.className = 'oai-exec-icon oai-exec-pending';
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/></svg>`;

    const lbl = document.createElement('span');
    lbl.className = 'oai-exec-label';
    lbl.textContent = step.label;

    row.appendChild(icon);
    row.appendChild(lbl);
    list.appendChild(row);
    return row;
  });

  card.appendChild(list);
  messagesEl.appendChild(card);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // ── Collapse/expand toggle ────────────────────────────────────────────────
  let open = true;
  headerBtn.addEventListener('click', () => {
    open = !open;
    list.style.display = open ? '' : 'none';
    chevron.classList.toggle('oai-exec-open', open);
  });

  // ── Elapsed timer ─────────────────────────────────────────────────────────
  const startMs = Date.now();
  const secsEl = card.querySelector<HTMLElement>('.oai-exec-secs');
  _execCardTimer = setInterval(() => {
    const elapsed = Math.round((Date.now() - startMs) / 1000);
    if (secsEl) secsEl.textContent = `${elapsed}s`;
  }, 1000);

  return card;
}

/** Tick a step to done (✓) or doing (spinner) by its index in the most recent exec card */
export function tickExecStep(
  cardEl: HTMLDivElement,
  stepIndex: number,
  status: 'doing' | 'done'
) {
  const steps = cardEl.querySelectorAll<HTMLDivElement>('.oai-exec-step');
  const row = steps[stepIndex];
  if (!row) return;
  const icon = row.querySelector<HTMLElement>('.oai-exec-icon');
  if (!icon) return;

  icon.className = `oai-exec-icon oai-exec-${status}`;

  if (status === 'done') {
    icon.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-5"/></svg>`;
    row.classList.add('oai-exec-step-done');
    // Update header label with done count
    const headerLabel = cardEl.querySelector<HTMLElement>('.oai-exec-header-label');
    if (headerLabel) {
      const total = steps.length;
      const done  = cardEl.querySelectorAll('.oai-exec-step-done').length;
      if (done === total) {
        // All done — stop timer
        if (_execCardTimer) { clearInterval(_execCardTimer); _execCardTimer = null; }
        headerLabel.textContent = `Done · ${total} steps`;
      } else {
        headerLabel.textContent = `${done} of ${total} done`;
      }
    }
  } else {
    // doing — show spinning ring
    icon.innerHTML = `<svg class="oai-exec-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="9" stroke-dasharray="28 56" stroke-dashoffset="0"/></svg>`;
  }
}


// -- Numbered choice card (Tandem-style intake) ---------------------------------
// Renders a paginated card with numbered options, a write-in row, and Skip.
export interface ChoiceCardOptions {
  question: string;
  options: string[];
  questionIndex: number;   // 0-based
  questionTotal: number;   // total questions in this intake (or 0 if unknown)
  onSelect: (answer: string) => void;
  onSkip?: () => void;
}

export function addChoiceCard(messagesEl: HTMLElement, opts: ChoiceCardOptions): HTMLDivElement {
  const { question, options, questionIndex, questionTotal, onSelect, onSkip } = opts;
  const card = document.createElement('div');
  card.className = 'oai-choice-card';

  // ── Header row ──────────────────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'oai-choice-header';

  const title = document.createElement('span');
  title.className = 'oai-choice-title';
  title.textContent = question;

  const pagination = document.createElement('div');
  pagination.className = 'oai-choice-pagination';
  if (questionTotal > 0) {
    pagination.innerHTML = `
      <button class="oai-choice-page-btn oai-choice-prev" aria-label="Previous" disabled>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span class="oai-choice-page-num">${questionIndex + 1} of ${questionTotal}</span>
      <button class="oai-choice-page-btn oai-choice-next" aria-label="Next" disabled>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    `;
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'oai-choice-close';
  closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  closeBtn.setAttribute('aria-label', 'Dismiss');
  closeBtn.addEventListener('click', () => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(-4px)';
    setTimeout(() => card.remove(), 200);
    onSkip?.();
  });

  header.appendChild(title);
  if (questionTotal > 0) header.appendChild(pagination);
  header.appendChild(closeBtn);
  card.appendChild(header);

  // ── Divider ──────────────────────────────────────────────────────────────────
  const divider = document.createElement('div');
  divider.className = 'oai-choice-divider';
  card.appendChild(divider);

  // ── Options list ─────────────────────────────────────────────────────────────
  const list = document.createElement('div');
  list.className = 'oai-choice-list';

  const disable = () => {
    list.querySelectorAll<HTMLButtonElement>('.oai-choice-option').forEach(b => (b.disabled = true));
    const writeIn = card.querySelector<HTMLInputElement>('.oai-choice-write-input');
    if (writeIn) writeIn.disabled = true;
  };

  options.forEach((opt, i) => {
    const row = document.createElement('button');
    row.className = 'oai-choice-option';
    row.innerHTML = `
      <span class="oai-choice-num">${i + 1}</span>
      <span class="oai-choice-label">${opt}</span>
    `;
    row.addEventListener('click', () => {
      row.classList.add('oai-choice-selected');
      disable();
      card.style.opacity = '0.7';
      card.style.pointerEvents = 'none';
      setTimeout(() => onSelect(opt), 150);
    });

    if (i < options.length - 1) {
      const sep = document.createElement('div');
      sep.className = 'oai-choice-sep';
      list.appendChild(row);
      list.appendChild(sep);
    } else {
      list.appendChild(row);
    }
  });

  card.appendChild(list);

  // ── Write-in + Skip row ───────────────────────────────────────────────────────
  const footer = document.createElement('div');
  footer.className = 'oai-choice-footer';

  const writeRow = document.createElement('div');
  writeRow.className = 'oai-choice-write-row';

  const pencilIcon = document.createElement('span');
  pencilIcon.className = 'oai-choice-pencil';
  pencilIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';

  const writeIn = document.createElement('input');
  writeIn.className = 'oai-choice-write-input';
  writeIn.placeholder = 'Something else';
  writeIn.setAttribute('aria-label', 'Custom answer');
  writeIn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && writeIn.value.trim()) {
      disable();
      card.style.opacity = '0.7';
      card.style.pointerEvents = 'none';
      onSelect(writeIn.value.trim());
    }
  });

  const skipBtn = document.createElement('button');
  skipBtn.className = 'oai-choice-skip';
  skipBtn.textContent = 'Skip';
  skipBtn.addEventListener('click', () => {
    card.style.opacity = '0.7';
    card.style.pointerEvents = 'none';
    onSkip?.();
  });

  writeRow.appendChild(pencilIcon);
  writeRow.appendChild(writeIn);
  footer.appendChild(writeRow);
  footer.appendChild(skipBtn);
  card.appendChild(footer);

  messagesEl.appendChild(card);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return card;
}

// ─── Proactive contextual suggestion card (Tandem-style) ─────────────────────
// A dark floating overlay that appears after a user action, reads page context,
// and suggests the next logical step with a direct "Start now" CTA.
export interface ProactiveSuggestionOpts {
  agentName: string;
  agentInitial: string;
  gradFrom: string;
  gradTo: string;
  headline: string;
  // Body text with **bold** markdown-style fragments supported
  body: string;
  ctaLabel?: string;
  onStart: () => void;
  onDismiss?: () => void;
}

export function addProactiveSuggestionCard(opts: ProactiveSuggestionOpts): HTMLDivElement {
  const {
    agentName, agentInitial, gradFrom, gradTo,
    headline, body, ctaLabel = 'Start now',
    onStart, onDismiss,
  } = opts;

  // Remove any existing suggestion card first
  document.getElementById('oai-proactive-card')?.remove();

  const card = document.createElement('div');
  card.id = 'oai-proactive-card';
  card.className = 'oai-suggest-card';

  // ── Header row ────────────────────────────────────────────────────────────
  const headerRow = document.createElement('div');
  headerRow.className = 'oai-suggest-header';

  // Agent avatar
  const avatar = document.createElement('div');
  avatar.className = 'oai-suggest-avatar';
  avatar.style.background = `linear-gradient(135deg, ${gradFrom}, ${gradTo})`;
  avatar.textContent = agentInitial;

  const agentLabel = document.createElement('span');
  agentLabel.className = 'oai-suggest-agent-name';
  agentLabel.textContent = agentName;

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'oai-suggest-close';
  closeBtn.setAttribute('aria-label', 'Dismiss');
  closeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  closeBtn.addEventListener('click', () => dismiss());

  headerRow.appendChild(avatar);
  headerRow.appendChild(agentLabel);
  headerRow.appendChild(closeBtn);
  card.appendChild(headerRow);

  // ── "Suggested for you" badge ─────────────────────────────────────────────
  const badge = document.createElement('div');
  badge.className = 'oai-suggest-badge';
  badge.textContent = 'SUGGESTED FOR YOU';
  card.appendChild(badge);

  // ── Headline ──────────────────────────────────────────────────────────────
  const titleEl = document.createElement('div');
  titleEl.className = 'oai-suggest-title';
  titleEl.textContent = headline;
  card.appendChild(titleEl);

  // ── Body (supports **bold** syntax) ───────────────────────────────────────
  const bodyEl = document.createElement('div');
  bodyEl.className = 'oai-suggest-body';
  bodyEl.innerHTML = body.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  card.appendChild(bodyEl);

  // ── CTA button ────────────────────────────────────────────────────────────
  const ctaBtn = document.createElement('button');
  ctaBtn.className = 'oai-suggest-cta';
  ctaBtn.textContent = ctaLabel + ' →';
  ctaBtn.addEventListener('click', () => {
    dismiss();
    onStart();
  });
  card.appendChild(ctaBtn);

  document.body.appendChild(card);

  // Animate in
  requestAnimationFrame(() => {
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  });

  // Auto-dismiss after 20s
  const autoDismiss = setTimeout(() => dismiss(), 20000);

  function dismiss() {
    clearTimeout(autoDismiss);
    card.style.opacity = '0';
    card.style.transform = 'translateY(8px)';
    setTimeout(() => card.remove(), 280);
    onDismiss?.();
  }

  return card;
}
