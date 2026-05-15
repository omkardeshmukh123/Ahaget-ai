// ─── Ahaget Widget — side-panel orchestrator ───────────────────────────────────
// Ahaget occupies the right 360px of the screen as a persistent sidebar.
// The host page body shifts left automatically via the `.__ahaget-open` class.
// There is no floating bubble — the panel slides in from the right when an
// active onboarding session exists, and can be collapsed to a thin tab.

import { WidgetConfig, DEFAULT_CONFIG } from '../models/config';
import { DropOffDetector } from '../features/detector';
import { trackEvent, evaluateTriggers, fetchPendingProactiveMessage, markProactiveMessage, beaconAbandon, fetchBranding } from '../models/api';
import { injectStyles } from '../views/styles';
import { startDomObserver } from '../utils/scanner';
import { CopilotManager, AgentAction, CopilotSession } from '../features/copilot';
import {
  createRoot, createSidePanel,
  addMessage, addFeedbackButtons, tryParseSteps, addStepsCard,
  addChips, addActionToast, addCelebration, addStepPill,
  renderStepProgress, createStreamingBubble,
  renderPlanChecklist, updatePlanPhase, PlanPhase,
} from '../views/ui';

export class AhagetWidget {
  private config: Required<Omit<WidgetConfig, 'userId' | 'metadata'>> & Pick<WidgetConfig, 'userId' | 'metadata'>;
  private isVisible = false;
  private isCollapsed = false;
  private isSending = false;
  private detector: DropOffDetector | null = null;
  private copilot: CopilotManager;

  // ─── Goal mode state ─────────────────────────────────────────────────────
  private goalMode = false;
  private goalText = '';
  private goalTurnHistory: Array<{ role: 'user' | 'assistant' | 'observe'; content: string }> = [];
  private goalTurnCount = 0;
  private goalRunning = false;
  private goalFailureCount = 0;
  private goalFailedSelectors = new Set<string>(); // Phase 4: accumulated failed selectors


  // ─── Plan mode state ─────────────────────────────────────────────────────
  private planActive = false;
  private planPhases: PlanPhase[] = [];
  private planCurrentPhaseIdx = 0;

  // DOM refs
  private messagesEl!: HTMLElement;
  private inputEl!: HTMLTextAreaElement;
  private sendBtn!: HTMLButtonElement;
  private panelEl!: HTMLElement;
  private progressBarEl!: HTMLElement;
  private stepTitleEl!: HTMLElement;
  private progressTextEl!: HTMLElement;

  constructor(config: WidgetConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.copilot = new CopilotManager(config.apiKey, config.apiUrl ?? DEFAULT_CONFIG.apiUrl);
  }

  getCopilot(): CopilotManager {
    return this.copilot;
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.mount());
    } else {
      this.mount();
    }
  }

  private async mount() {
    const brandingOpts = { apiKey: this.config.apiKey, apiUrl: this.config.apiUrl ?? DEFAULT_CONFIG.apiUrl };
    const remote = await fetchBranding(brandingOpts);
    if (remote) {
      // Remote wins only for fields the caller did not explicitly set
      if (!this.config.gradFrom) this.config.gradFrom = remote.gradFrom;
      if (!this.config.gradTo)   this.config.gradTo   = remote.gradTo;
      if (!this.config.position) this.config.position = remote.position;
      if (this.config.primaryColor === DEFAULT_CONFIG.primaryColor && remote.primaryColor !== DEFAULT_CONFIG.primaryColor) {
        this.config.primaryColor = remote.primaryColor;
      }
      if (this.config.idleThreshold === DEFAULT_CONFIG.idleThreshold) {
        this.config.idleThreshold = remote.idleThreshold;
      }
    }
    injectStyles({
      primaryColor: this.config.primaryColor,
      gradFrom: this.config.gradFrom ?? this.config.primaryColor,
      gradTo:   this.config.gradTo   ?? DEFAULT_CONFIG.gradTo,
    });
    startDomObserver();

    const root = createRoot();
    this.panelEl = createSidePanel(root);

    this.messagesEl = document.getElementById('oai-messages')!;
    this.inputEl    = document.getElementById('oai-input') as HTMLTextAreaElement;
    this.sendBtn    = document.getElementById('oai-send') as HTMLButtonElement;

    this.injectProgressBar();
    this.bindEvents();
    this.trackPageView();
    this.startDetection();
    this.copilot.watchNavigation();

    const userId = this.config.userId ?? 'anonymous_' + this.getOrCreateAnonId();
    const apiOpts = { apiKey: this.config.apiKey, apiUrl: this.config.apiUrl ?? DEFAULT_CONFIG.apiUrl };

    // ── Phase 3: detect ?ahaget_resume=flow_id URL param ─────────────────────
    const urlParams = new URLSearchParams(window.location.search);
    const resumeFlowId = urlParams.get('ahaget_resume');
    if (resumeFlowId) {
      // Store for copilot to use, then strip from URL
      localStorage.setItem('_oai_resume', resumeFlowId);
      const cleanUrl = window.location.pathname +
        (urlParams.toString().replace(`ahaget_resume=${resumeFlowId}`, '').replace(/^&|&$/, '') ? '?' + urlParams.toString().replace(`ahaget_resume=${resumeFlowId}`, '').replace(/^&|&$/, '') : '');
      window.history.replaceState({}, '', cleanUrl);
    }

    // Register BEFORE start() so the cache pre-warm fires synchronously
    this.copilot.onSessionUpdate((s) => this.updateProgressUI(s));

    const session = await this.copilot.start(userId, window.location.pathname, this.config.metadata ?? {});
    let active = session ?? this.copilot.getSession();

    // Apply configured agent name to the widget header
    const agentName = this.copilot.getAgentName();
    const titleEl = document.getElementById('oai-header-title');
    const subEl = document.getElementById('oai-header-sub');
    if (titleEl) titleEl.textContent = agentName;
    if (subEl) subEl.textContent = `Your AI employee · ${agentName}`;

    // ── Phase 2: if no active flow session, evaluate trigger rules ────────────
    if (!active) {
      const match = await evaluateTriggers(
        apiOpts,
        userId,
        window.location.pathname,
        this.config.metadata,
      );
      if (match) {
        // Start a session for the matched flow
        const triggered = await this.copilot.startFlow(
          userId,
          match.flow.id,
          window.location.pathname,
          this.config.metadata ?? {}
        );
        if (triggered) active = this.copilot.getSession();
      }
    }

    if (!active) return; // no active flow for this user

    // Respect server-side trigger controls
    const trigger = this.copilot.getTriggerConfig();

    if (!this.copilot.shouldTriggerOnCurrentPage()) return;

    if (trigger.maxTriggersPerUser > 0) {
      const countKey = `_ahaget_tc_${this.config.apiKey.slice(0, 8)}_${userId}`;
      const shown = parseInt(localStorage.getItem(countKey) ?? '0', 10);
      if (shown >= trigger.maxTriggersPerUser) return;
      localStorage.setItem(countKey, String(shown + 1));
    }

    // Returning users / resuming sessions open the panel instantly
    const resuming = this.consumeResumeToken();
    const hasCached = !!this.copilot.getCachedSession(userId);
    const delay = (resuming || hasCached) ? 0 : trigger.delayMs;

    setTimeout(() => this.openPanel(), delay);

    // ── Phase 3: check for pending in-app proactive message ───────────────────
    // If there's an unread message from the AI employee, show a pulsing badge
    // on the FAB bubble to draw attention even if the panel hasn't opened yet.
    fetchPendingProactiveMessage(apiOpts, userId).then((msg) => {
      if (!msg) return;
      this.showProactiveBadge(msg.id, msg.bodySnippet ?? msg.subject ?? 'Your AI employee has a message for you', apiOpts);
    }).catch(() => {/* silent */});
  }

  /** Render a pulsing notification badge on the FAB + a dismissable preview tooltip */
  private showProactiveBadge(
    messageId: string,
    preview: string,
    apiOpts: { apiKey: string; apiUrl: string }
  ): void {
    // Mark as opened immediately (user sees the badge)
    markProactiveMessage(apiOpts, messageId, 'open');

    const fab = document.getElementById('oai-fab');
    if (!fab) return;

    // Pulsing red dot
    const dot = document.createElement('span');
    dot.id = 'oai-proactive-dot';
    dot.style.cssText = `
      position: absolute; top: -4px; right: -4px;
      width: 12px; height: 12px; border-radius: 50%;
      background: #ef4444; border: 2px solid white;
      animation: oai-pulse 1.6s ease-in-out infinite;
      z-index: 9999;
    `;
    fab.style.position = 'relative';
    fab.appendChild(dot);

    // Tooltip preview
    const tooltip = document.createElement('div');
    tooltip.id = 'oai-proactive-tooltip';
    tooltip.style.cssText = `
      position: fixed; bottom: 80px; right: 20px;
      background: #1e293b; color: #f1f5f9;
      padding: 10px 14px; border-radius: 10px;
      font-size: 13px; max-width: 260px; line-height: 1.5;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      z-index: 9998; cursor: pointer;
      border: 1px solid rgba(255,255,255,0.08);
    `;
    tooltip.textContent = `💬 ${preview.length > 80 ? preview.slice(0, 80) + '…' : preview}`;
    document.body.appendChild(tooltip);

    // Click tooltip → open panel + mark clicked
    tooltip.addEventListener('click', () => {
      markProactiveMessage(apiOpts, messageId, 'click');
      tooltip.remove();
      dot.remove();
      this.openPanel();
    });

    // Auto-dismiss tooltip after 8s (badge stays)
    setTimeout(() => tooltip.remove(), 8000);
  }


  // ─── Progress bar ────────────────────────────────────────────────────────

  private injectProgressBar() {
    const header = document.getElementById('oai-header');
    if (!header) return;

    const bar = document.createElement('div');
    bar.id = 'oai-progress-wrap';
    bar.innerHTML = `
      <div id="oai-step-title"></div>
      <div id="oai-progress-track">
        <div id="oai-progress-bar"></div>
      </div>
      <div id="oai-progress-text"></div>
    `;
    header.insertAdjacentElement('afterend', bar);

    this.progressBarEl  = document.getElementById('oai-progress-bar')!;
    this.stepTitleEl    = document.getElementById('oai-step-title')!;
    this.progressTextEl = document.getElementById('oai-progress-text')!;
  }

  private updateProgressUI(session: CopilotSession) {
    const { completed, total, percent } = this.copilot.getProgress();
    if (this.progressBarEl)  this.progressBarEl.style.width = `${percent}%`;
    if (this.stepTitleEl) {
      this.stepTitleEl.textContent = session.status === 'completed'
        ? 'Flow complete!'
        : `Step ${session.currentStep.order + 1}: ${session.currentStep.title}`;
    }
    if (this.progressTextEl) {
      this.progressTextEl.textContent = `${completed} of ${total} steps done`;
    }

    const completedIds = session.flow.steps
      .filter((_, i) => i < session.currentStep.order)
      .map((s) => s.id);
    renderStepProgress(session.flow.steps, session.currentStep.id, completedIds);
  }

  // ─── Panel open / collapse ───────────────────────────────────────────────

  private get isMobile(): boolean {
    return window.innerWidth <= 640;
  }

  private openPanel() {
    this.isVisible = true;
    this.isCollapsed = false;
    this.panelEl.classList.remove('oai-hidden', 'oai-collapsed');
    if (!this.isMobile) {
      document.body.classList.add('__ahaget-open');
      document.body.classList.remove('__ahaget-collapsed');
    }
    this.startSession();
  }

  private collapsePanel() {
    this.isCollapsed = true;
    this.panelEl.classList.add('oai-collapsed');
    if (!this.isMobile) {
      document.body.classList.remove('__ahaget-open');
      document.body.classList.add('__ahaget-collapsed');
    }
  }

  private expandPanel() {
    this.isCollapsed = false;
    this.panelEl.classList.remove('oai-collapsed');
    if (!this.isMobile) {
      document.body.classList.add('__ahaget-open');
      document.body.classList.remove('__ahaget-collapsed');
    }
  }

  private hidePanel() {
    this.isVisible = false;
    this.panelEl.classList.add('oai-hidden');
    document.body.classList.remove('__ahaget-open', '__ahaget-collapsed');
  }

  // ─── Session start message flow ──────────────────────────────────────────

  private async startSession() {
    const session = this.copilot.getSession();
    if (!session) return;

    if (session.status === 'completed') {
      addMessage(this.messagesEl, '🎉 You\'ve completed this flow! Great work.', 'assistant');
      this.inputEl.disabled = true;
      this.inputEl.placeholder = 'Flow complete';
      this.sendBtn.disabled = true;
      return;
    }

    const step = session.currentStep;
    const { total } = this.copilot.getProgress();

    addStepPill(this.messagesEl, `Step ${step.order + 1} of ${total}`);
    addMessage(
      this.messagesEl,
      session.isReturning ? `Welcome back! Continuing: ${step.title}` : step.title,
      'assistant'
    );

    // Page mismatch — offer navigation
    if (step.targetUrl && !this.isOnTargetPage(step.targetUrl)) {
      addMessage(
        this.messagesEl,
        `This step happens on a different page. Want me to take you there?`,
        'assistant'
      );
      addChips(
        this.messagesEl,
        '',
        [`Go to ${this.shortUrl(step.targetUrl)}`],
        () => {
          this.copilot.executePageAction({
            type: 'execute_page_action',
            actionType: 'navigate',
            payload: { url: step.targetUrl! },
            message: `Navigating to ${step.targetUrl}…`,
          });
        }
      );
      this.enableInput();
      this.isSending = false;
      this.sendBtn.disabled = false;
      return;
    }

    // Auto-trigger agent — send __navigated__ if we just arrived via a navigate action
    const navResumeRaw = localStorage.getItem('_oai_nav_resume');
    localStorage.removeItem('_oai_nav_resume');
    let initMessage = '__init__';
    if (navResumeRaw) {
      try {
        const nav = JSON.parse(navResumeRaw) as { from?: string; to?: string; stepTitle?: string };
        initMessage = `__navigated__:${JSON.stringify({ from: nav.from, to: nav.to ?? window.location.pathname, stepTitle: nav.stepTitle ?? step.title })}`;
      } catch { /* malformed — fall back to __init__ */ }
    }

    this.enableInput();
    this.isSending = true;
    this.sendBtn.disabled = true;
    const streamDiv = createStreamingBubble(this.messagesEl);
    try {
      const result = await this.copilot.sendMessage(initMessage);
      if (result) {
        this.handleAgentAction(result.action, streamDiv, result.messageId);
      } else {
        streamDiv.textContent = 'Having trouble connecting. Type a message to try again.';
        streamDiv.classList.remove('oai-streaming');
        this.isSending = false;
        this.sendBtn.disabled = false;
      }
    } catch {
      streamDiv.textContent = 'Connection error. Please refresh and try again.';
      streamDiv.classList.remove('oai-streaming');
      this.isSending = false;
      this.sendBtn.disabled = false;
    }
  }

  // ─── Drop-off detection ──────────────────────────────────────────────────
  // Even in sidebar mode, we track rage clicks / form abandonment.
  // These signals appear in the analytics dashboard.

  private startDetection() {
    this.detector = new DropOffDetector(
      this.config.idleThreshold,
      (_reason, _meta) => {
        // In sidebar mode we don't pop anything — the panel is already visible.
        // Just ensure it's expanded if collapsed.
        if (this.isVisible && this.isCollapsed) this.expandPanel();
      },
      (eventType, props) => {
        const userId = this.config.userId ?? 'anonymous_' + this.getOrCreateAnonId();
        trackEvent(
          { apiKey: this.config.apiKey, apiUrl: this.config.apiUrl },
          userId,
          eventType as Parameters<typeof trackEvent>[2],
          props
        );
        this.copilot.fireEvent(eventType);
      }
    );
    this.detector.start();
  }

  private trackPageView() {
    const userId = this.config.userId ?? 'anonymous_' + this.getOrCreateAnonId();
    trackEvent(
      { apiKey: this.config.apiKey, apiUrl: this.config.apiUrl },
      userId,
      'page_view',
      { path: window.location.pathname, referrer: document.referrer }
    );
  }

  // ─── Message submission ───────────────────────────────────────────────────

  private async submitMessage() {
    const content = this.inputEl.value.trim();
    if (!content || this.isSending) return;

    this.inputEl.value = '';
    this.inputEl.style.height = 'auto';

    // ── Goal mode: user replied to an ask_clarification ──────────────────────
    if (this.goalMode && !this.goalRunning) {
      this.goalTurnHistory.push({ role: 'user', content });
      this.goalRunning = true;
      addMessage(this.messagesEl, content, 'user');
      await this.runGoalTurn();
      return;
    }

    this.isSending = true;
    this.sendBtn.disabled = true;

    const session = this.copilot.getSession();

    // ── No active flow session — treat message as a goal ─────────────────────
    if (!session) {
      this.startGoalMode(content);
      return;
    }

    addMessage(this.messagesEl, content, 'user');
    const streamDiv = createStreamingBubble(this.messagesEl);

    const result = await this.copilot.sendMessage(content, (word) => {
      // Live text streaming — append words as they arrive
      streamDiv.classList.remove('oai-streaming');
      streamDiv.textContent = (streamDiv.textContent ?? '') + word;
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    });
    if (result) {
      this.handleAgentAction(result.action, streamDiv, result.messageId);
    } else {
      streamDiv.textContent = 'Sorry, I had trouble responding. Please try again.';
      this.finishStreaming(streamDiv);
    }
  }

  // ─── Goal mode orchestration ─────────────────────────────────────────────

  private async startGoalMode(goal: string) {
    if (this.goalRunning) return;
    this.goalMode = true;
    this.goalText = goal;
    this.goalTurnHistory = [];
    this.goalTurnCount = 0;
    this.goalRunning = true;
    this.goalFailureCount = 0;
    this.goalFailedSelectors = new Set(); // Phase 4: reset on new goal

    addMessage(this.messagesEl, goal, 'user');

    const thinkingDiv = createStreamingBubble(this.messagesEl);
    thinkingDiv.textContent = 'Planning your steps…';
    thinkingDiv.classList.remove('oai-streaming');

    const phases = await this.copilot.sendPlanRequest(goal);
    thinkingDiv.remove();

    if (phases && phases.length > 1) {
      this.planPhases = phases;
      this.planCurrentPhaseIdx = 0;
      this.planActive = true;
      renderPlanChecklist(this.messagesEl, phases);
      await this.startNextPlanPhase();
    } else {
      await this.runGoalTurn();
    }
  }

  private async startNextPlanPhase() {
    const phase = this.planPhases[this.planCurrentPhaseIdx];
    if (!phase) {
      addCelebration(this.messagesEl, '✅ All done!', `Completed all ${this.planPhases.length} phases.`);
      this.goalRunning = false;
      this.goalMode = false;
      this.planActive = false;
      return;
    }
    updatePlanPhase(phase.id, 'active');
    addStepPill(this.messagesEl, `Phase ${this.planCurrentPhaseIdx + 1} of ${this.planPhases.length}: ${phase.title}`);
    this.goalText = `${phase.title}: ${phase.description}`;
    this.goalTurnHistory = [];
    this.goalTurnCount = 0;
    this.goalFailureCount = 0;
    this.goalFailedSelectors = new Set();
    this.goalRunning = true;
    await this.runGoalTurn();
  }

  private domFingerprint(): string {
    const inputs = Array.from(document.querySelectorAll('input, select, textarea'))
      .slice(0, 8)
      .map((el) => `${(el as HTMLInputElement).name ?? el.id}=${(el as HTMLInputElement).value ?? ''}`)
      .join('|');
    const count = document.querySelectorAll('button, a, input, select, textarea').length;
    return `${count}::${inputs}`;
  }

  private waitForDomChange(before: string, timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      const deadline = Date.now() + timeoutMs;
      const poll = () => {
        if (this.domFingerprint() !== before) { resolve(true); return; }
        if (Date.now() >= deadline) { resolve(false); return; }
        setTimeout(poll, 100);
      };
      setTimeout(poll, 100);
    });
  }

  private async runGoalTurn() {
    if (!this.goalRunning) return;

    const streamDiv = createStreamingBubble(this.messagesEl);
    this.isSending = true;
    this.sendBtn.disabled = true;

    const result = await this.copilot.sendGoalMessage({
      goal: this.goalText,
      turnHistory: this.goalTurnHistory,
      turnCount: this.goalTurnCount,
      // Phase 4: pass accumulated failed selectors for backend alternative lookup
      failedSelectors: Array.from(this.goalFailedSelectors),
    });

    streamDiv.remove();
    this.isSending = false;
    this.sendBtn.disabled = false;

    if (!result) {
      addMessage(this.messagesEl, 'Something went wrong. Please try again.', 'assistant');
      this.goalRunning = false;
      return;
    }

    const { action, done, turnCount } = result;
    this.goalTurnCount = turnCount;

    const actionDesc = this.describeAction(action);
    this.goalTurnHistory.push({ role: 'assistant', content: actionDesc });

    if (action.type === 'execute_page_action') {
      const before = this.domFingerprint();
      this.handleAgentAction(action, document.createElement('div'), null);

      const changed = await this.waitForDomChange(before, 1500);
      if (!changed) {
        // Phase 4: Extract the exact selector that failed and accumulate it
        const selector = action.actionType === 'fill_form'
          ? Object.keys((action.payload.fields as Record<string, string> | undefined) ?? {})[0] ?? null
          : (action.payload.selector as string | undefined) ?? null;

        if (selector) this.goalFailedSelectors.add(selector);

        // Use quoted format so backend regex `selector "..."`  parses reliably
        const selectorDisplay = selector ? `"${selector}"` : '"unknown"';
        this.goalTurnHistory.push({
          role: 'observe',
          content: `Action ${action.actionType} attempted on selector ${selectorDisplay} but page did not change. Selector may be stale.`,
        });
        this.goalFailureCount++;
        this.copilot.reportSoftFailure({ selector, actionType: action.actionType });
        if (!done) { setTimeout(() => this.runGoalTurn(), 200); return; }
      } else {
        this.goalFailureCount = 0;
        // Only reset failedSelectors on a successful page change (not just DOM noise)
        if (this.goalFailedSelectors.size > 0 && this.goalTurnCount > 0) {
          this.goalFailedSelectors.clear();
        }
      }
    } else {
      this.handleAgentAction(action, document.createElement('div'), null);
    }

    if (done) {
      if (this.planActive) {
        updatePlanPhase(this.planPhases[this.planCurrentPhaseIdx].id, 'done');
        this.planCurrentPhaseIdx++;
        this.goalRunning = false;
        setTimeout(() => this.startNextPlanPhase(), 800);
      } else {
        this.goalRunning = false;
        this.goalMode = false;
      }
      return;
    }

    setTimeout(() => this.runGoalTurn(), 500);
  }

  private describeAction(action: AgentAction): string {
    switch (action.type) {
      case 'execute_page_action':
        return `Executed ${action.actionType} action: ${action.message}`;
      case 'ask_clarification':
        return `Asked user: "${action.question}"`;
      case 'complete_step':
        return `Completed: ${action.message}`;
      case 'goal_complete':
        return `Goal achieved: ${action.summary}`;
      case 'escalate_to_human':
        return `Escalated: ${action.reason}`;
      case 'degrade_to_manual':
        return `Manual step required: ${action.instruction}`;
      default:
        return `Action: ${action.type}`;
    }
  }

  private handleAgentAction(action: AgentAction, streamDiv: HTMLDivElement, messageId: string | null = null) {
    streamDiv.remove();

    switch (action.type) {
      case 'ask_clarification': {
        const chipWrap = addChips(
          this.messagesEl,
          action.question,
          action.options ?? [],
          (opt) => {
            this.inputEl.value = opt;
            this.submitMessage();
          }
        );
        if (messageId) {
          addFeedbackButtons(chipWrap, (v) => this.copilot.sendFeedback(messageId, v));
        }
        break;
      }

      case 'execute_page_action': {
        this.copilot.executePageAction(action);
        addActionToast(this.messagesEl, action.message);
        // If agent flagged verification, check the DOM after the action settles
        if (action.shouldVerify) {
          this.copilot.scheduleVerify();
        }
        break;
      }

      case 'complete_step': {
        addMessage(this.messagesEl, action.message, 'assistant');
        const session = this.copilot.getSession();
        if (session) {
          setTimeout(() => {
            const next = session.flow.steps.find((s) => s.order > session.currentStep.order);
            if (next) {
              addMessage(this.messagesEl, `Next up: ${next.title} — ${next.description || 'ready when you are!'}`, 'assistant');
            }
          }, 800);
        }
        break;
      }

      case 'celebrate_milestone': {
        addCelebration(this.messagesEl, action.headline, action.insight);
        break;
      }

      case 'verify_integration': {
        const icon = action.success ? '✅' : '❌';
        addMessage(this.messagesEl, `${icon} ${action.message}`, 'assistant');
        break;
      }

      case 'escalate_to_human': {
        addMessage(this.messagesEl, action.message, 'assistant');
        this.inputEl.disabled = true;
        this.inputEl.placeholder = 'Waiting for a team member…';
        this.sendBtn.disabled = true;
        const pill = document.createElement('div');
        pill.style.cssText = 'margin:8px 12px;padding:8px 12px;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;font-size:11px;color:#92400e;display:flex;align-items:center;gap:6px;';
        pill.innerHTML = '<span style="width:7px;height:7px;border-radius:50%;background:#f59e0b;flex-shrink:0;"></span>Support ticket created — a team member will reach out soon.';
        this.messagesEl.appendChild(pill);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
        break;
      }

      case 'degrade_to_manual': {
        const card = document.createElement('div');
        card.className = 'oai-degrade-card';
        card.innerHTML = `
          <div class="oai-degrade-header">⚠ Manual step required</div>
          <div class="oai-degrade-instruction">${action.instruction}</div>
          <div class="oai-degrade-reason">Why: ${action.reason}</div>
          <div class="oai-degrade-actions">
            <button class="oai-degrade-done">✓ Done, continue</button>
            <button class="oai-degrade-escalate">Get human help</button>
          </div>
        `;
        this.messagesEl.appendChild(card);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
        card.querySelector('.oai-degrade-done')?.addEventListener('click', () => {
          card.remove();
          this.goalFailureCount = 0;
          this.goalTurnHistory.push({ role: 'user', content: 'Manual step completed. Please continue.' });
          this.goalRunning = true;
          this.runGoalTurn();
        });
        card.querySelector('.oai-degrade-escalate')?.addEventListener('click', () => {
          card.remove();
          this.goalRunning = false;
          this.goalMode = false;
          addMessage(this.messagesEl, 'Connecting you with the team…', 'assistant');
          this.copilot.sendMessage('__escalate__');
        });
        break;
      }

      case 'chat': {
        const steps = tryParseSteps(action.content);
        const msgEl = steps
          ? addStepsCard(this.messagesEl, steps)
          : addMessage(this.messagesEl, action.content, 'assistant');
        if (messageId) {
          addFeedbackButtons(msgEl, (v) => this.copilot.sendFeedback(messageId, v));
        }
        break;
      }

      case 'goal_complete': {
        addCelebration(this.messagesEl, '✅ Done!', action.summary);
        break;
      }

      case 'suggest_upgrade': {
        // Record the suggestion for attribution tracking (fire-and-forget)
        const session = this.copilot.getSession();
        const apiOpts = { apiKey: this.config.apiKey, apiUrl: this.config.apiUrl ?? DEFAULT_CONFIG.apiUrl };
        fetch(`${apiOpts.apiUrl}/api/v1/expansion/suggest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': apiOpts.apiKey },
          body: JSON.stringify({
            userId: this.config.userId ?? '',
            flowId: action.flowId,
            sessionId: session?.id,
          }),
        }).catch(() => {});

        // Render the upgrade card
        const card = document.createElement('div');
        card.className = 'oai-upgrade-card';

        const badge = document.createElement('div');
        badge.className = 'oai-upgrade-badge';
        badge.textContent = `✨ ${action.plan} Plan`;

        const headline = document.createElement('div');
        headline.className = 'oai-upgrade-headline';
        headline.textContent = action.headline;

        const pitch = document.createElement('div');
        pitch.className = 'oai-upgrade-pitch';
        pitch.textContent = action.pitch;

        const cta = document.createElement('a');
        cta.className = 'oai-upgrade-cta';
        cta.href = action.upgradeUrl;
        cta.target = '_blank';
        cta.rel = 'noopener noreferrer';
        cta.dataset.msgid = messageId ?? '';
        cta.textContent = 'Upgrade now →';

        const dismiss = document.createElement('button');
        dismiss.className = 'oai-upgrade-dismiss';
        dismiss.textContent = 'Maybe later';

        const actions = document.createElement('div');
        actions.className = 'oai-upgrade-actions';
        actions.appendChild(cta);
        actions.appendChild(dismiss);

        card.appendChild(badge);
        card.appendChild(headline);
        card.appendChild(pitch);
        card.appendChild(actions);
        this.messagesEl.appendChild(card);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;

        cta.addEventListener('click', () => {
          // Mark clicked for attribution
          fetch(`${apiOpts.apiUrl}/api/v1/expansion/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiOpts.apiKey },
            body: JSON.stringify({ userId: this.config.userId ?? '', plan: action.plan }),
          }).catch(() => {});
        });
        dismiss.addEventListener('click', () => {
          card.style.opacity = '0.5';
          card.style.pointerEvents = 'none';
        });
        break;
      }
    }

    this.isSending = false;
    this.sendBtn.disabled = false;
    this.inputEl.focus();
  }

  private finishStreaming(div: HTMLDivElement) {
    div.classList.remove('oai-streaming');
    this.isSending = false;
    this.sendBtn.disabled = false;
    this.inputEl.focus();
  }

  // ─── Event bindings ───────────────────────────────────────────────────────

  private bindEvents() {
    // Collapse / expand toggle tab
    document.getElementById('oai-toggle')!.addEventListener('click', () => {
      if (this.isCollapsed) {
        this.expandPanel();
      } else {
        this.collapsePanel();
      }
    });

    this.sendBtn.addEventListener('click', () => this.submitMessage());

    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.submitMessage();
      }
    });

    this.inputEl.addEventListener('input', () => {
      this.sendBtn.disabled = this.inputEl.value.trim().length === 0;
      this.inputEl.style.height = 'auto';
      this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 90) + 'px';
    });

    const abandonIfActive = () => {
      const session = this.copilot.getSession();
      if (!session) return;
      const apiOpts = { apiKey: this.config.apiKey, apiUrl: this.config.apiUrl ?? DEFAULT_CONFIG.apiUrl };
      beaconAbandon(apiOpts, session.id);
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') abandonIfActive();
    });
    window.addEventListener('beforeunload', abandonIfActive);
  }

  private enableInput() {
    this.inputEl.disabled = false;
    this.inputEl.placeholder = 'Type a message…';
  }

  private consumeResumeToken(): boolean {
    const raw = localStorage.getItem('_oai_resume');
    if (!raw) return false;
    localStorage.removeItem('_oai_resume');
    return true;
  }

  private isOnTargetPage(targetUrl: string): boolean {
    try {
      const target = new URL(targetUrl, window.location.origin);
      return target.origin === window.location.origin && window.location.pathname === target.pathname;
    } catch {
      return false;
    }
  }

  private shortUrl(url: string): string {
    try {
      const parsed = new URL(url, window.location.origin);
      if (parsed.origin !== window.location.origin) return parsed.hostname + parsed.pathname;
      return parsed.pathname;
    } catch {
      return url;
    }
  }

  private getOrCreateAnonId(): string {
    const KEY = '__oai_uid';
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(KEY, id);
    }
    return id;
  }
}

