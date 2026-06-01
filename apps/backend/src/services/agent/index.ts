import OpenAI from 'openai';
import { OnboardingStep, Organization } from '@prisma/client';

import { openai, chatWithFallback, chatStreamWithFallback } from './_openai';
import { AgentAction, PageContext, GoalTurn, GoalPlanPhase } from './types';
import { AGENT_TOOLS, parseToolCall, extractStreamingText, truncateAtSentence, executeCallApiTurn, handleMcpCall } from './tools';
import { buildSystemPrompt, buildDomSummary, loadInterfaceContext, sanitizeDomText } from './context';
import { selectModel } from './routing';
import { summarizeHistory, loadUserMemory, extractAndSaveMemory, SUMMARIZE_THRESHOLD, RECENT_WINDOW } from './memory';
import { searchKnowledgeBase } from '../knowledge';
import { loadMcpTools, toOpenAITools, isCallApiAllowedInGoalMode, ConnectorToolBundle } from '../mcp';
import { prisma } from '../../utils/prisma';
import { logger, withRetry, timer } from '../../utils/logger';

export type { AgentAction, PageContext, GoalTurn, GoalPlanPhase };
export { buildDomSummary, extractAndSaveMemory };

// ─── Shared agent setup ───────────────────────────────────────────────────────
async function prepareAgentCall(opts: {
  org: Organization;
  step: OnboardingStep;
  userMessage: string;
  collectedData: Record<string, unknown>;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  isLastStep: boolean;
  pageContext?: PageContext;
  userHistoryFormatted?: string;
  userMetadata?: Record<string, unknown>;
  detectedLang?: string;
  flowGoal?: string;
  liveContext?: string;
  sessionId?: string;
  endUserId?: string;
}) {
  const {
    org, step, userMessage, collectedData, conversationHistory,
    isLastStep, pageContext, userHistoryFormatted, userMetadata,
    detectedLang, flowGoal, liveContext, endUserId,
  } = opts;

  const isInit   = userMessage === '__init__';
  const isVerify = userMessage === '__verify__';

  const smartQuestions      = (step.smartQuestions as string[]) ?? [];
  const answeredQuestions   = Object.keys(collectedData);
  const unansweredQuestions = smartQuestions.filter((q) => !answeredQuestions.includes(q));

  const actionConfig    = step.actionConfig as Record<string, unknown> | null;
  const hasActionConfig = !!(actionConfig && Object.keys(actionConfig).length > 0);

  const actionHint = hasActionConfig
    ? `\nPRE-CONFIGURED ACTION (use these exact values with execute_page_action):\n- type: "${step.actionType || 'highlight'}"\n${actionConfig!.selector ? `- selector: "${actionConfig!.selector}"\n` : ''}${actionConfig!.url ? `- url: "${actionConfig!.url}"\n` : ''}${actionConfig!.fields ? `- fields: ${JSON.stringify(actionConfig!.fields)} (replace empty strings with values from collectedData or user answer)\n` : ''}`
    : '';

  const domSummary = pageContext ? buildDomSummary(pageContext) : '';

  // Skip KB search on init/verify turns (800ms cap)
  const kbTimer = timer();
  const kbResults = (isInit || isVerify)
    ? []
    : await Promise.race([
        searchKnowledgeBase(org.id, userMessage, 3, 0.25, pageContext?.url).catch(() => []),
        new Promise<Awaited<ReturnType<typeof searchKnowledgeBase>>>((resolve) =>
          setTimeout(() => resolve([]), 800)
        ),
      ]);
  if (!isInit && !isVerify) logger.latency('kb.search', kbTimer(), { orgId: org.id, hits: kbResults.length });

  const seenKbTitles = new Set<string>();
  const uniqueKbResults = kbResults.filter((r) => {
    if (seenKbTitles.has(r.title)) return false;
    seenKbTitles.add(r.title);
    return true;
  });
  const kbSection = uniqueKbResults.length > 0
    ? `\nKNOWLEDGE BASE:\n${uniqueKbResults.map((r) => `[${r.title}]\n${truncateAtSentence(r.content, 500)}`).join('\n\n')}\n`
    : '';

  const mcpTimer = timer();
  const mcpBundles: ConnectorToolBundle[] = (isInit || isVerify)
    ? []
    : await loadMcpTools(org.id).catch(() => []);
  if (!isInit && !isVerify && mcpBundles.length > 0) logger.latency('mcp.load', mcpTimer(), { orgId: org.id, connectors: mcpBundles.length });

  const mcpOAITools = toOpenAITools(mcpBundles);
  const mcpSection = mcpBundles.length > 0
    ? `\nMCP TOOLS AVAILABLE: You have ${mcpOAITools.length} external tool(s) from ${mcpBundles.length} connector(s). Use them when they help complete this step.\n`
    : '';

  const interfaceMapSection = await Promise.race([
    loadInterfaceContext(org.id, pageContext?.url),
    new Promise<string>((resolve) => setTimeout(() => resolve(''), 100)),
  ]);

  // Load cross-session user memory (skip on init/verify for latency)
  const memorySection = (!isInit && !isVerify && endUserId)
    ? await loadUserMemory(org.id, endUserId).catch(() => '')
    : '';

  const model = selectModel({
    isInit,
    isVerify,
    hasActionConfig,
    hasUnansweredQuestions: unansweredQuestions.length > 0,
    hasKbResults: kbResults.length > 0,
    kbTopScore: kbResults.length > 0 ? Math.max(...kbResults.map((r) => (r as typeof r & { score?: number }).score ?? 0)) : 0,
  });

  const playbookConfig = await prisma.playbookConfig.findUnique({
    where: { organizationId: org.id },
    select: { agentName: true, tone: true, mustAlwaysDo: true, mustNeverDo: true },
  });

  const systemPrompt = buildSystemPrompt({
    orgName: org.name,
    customInstructions: org.customInstructions,
    step,
    collectedData,
    isLastStep,
    userMetadata,
    userHistoryFormatted,
    domSummary,
    kbSection,
    mcpSection,
    interfaceMapSection,
    isInit,
    isVerify,
    unansweredQuestions,
    actionHint,
    detectedLang,
    flowGoal,
    liveContext,
    memorySection,
    playbook: playbookConfig,
  });

  let messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  if (conversationHistory.length > SUMMARIZE_THRESHOLD) {
    const older = conversationHistory.slice(0, -RECENT_WINDOW);
    const recent = conversationHistory.slice(-RECENT_WINDOW);
    const [summary] = await Promise.all([summarizeHistory(older)]);
    const summaryPrefix: Array<{ role: 'user' | 'assistant'; content: string }> = summary
      ? [
          { role: 'user', content: `[Summary of earlier conversation: ${summary}]` },
          { role: 'assistant', content: 'Understood.' },
        ]
      : [];
    messages = [...summaryPrefix, ...recent, { role: 'user', content: userMessage }];
  } else {
    messages = [...conversationHistory.slice(-RECENT_WINDOW), { role: 'user', content: userMessage }];
  }

  const allowedActions = (step.allowedActions as string[] | undefined) ?? [];
  let baseTools: OpenAI.Chat.ChatCompletionTool[];
  if (allowedActions.length === 0) {
    baseTools = AGENT_TOOLS;
  } else {
    baseTools = AGENT_TOOLS.reduce<OpenAI.Chat.ChatCompletionTool[]>((acc, tool) => {
      if (tool.function.name !== 'execute_page_action') { acc.push(tool); return acc; }
      const params = tool.function.parameters as Record<string, unknown>;
      const props  = params.properties as Record<string, { type: string; enum?: string[] }>;
      const filteredEnum = (props.type.enum ?? []).filter((t) => allowedActions.includes(t));
      if (filteredEnum.length === 0) return acc;
      acc.push({ ...tool, function: { ...tool.function, parameters: { ...params, properties: { ...props, type: { ...props.type, enum: filteredEnum } } } } });
      return acc;
    }, []);
  }

  const toolsForStep = [...baseTools, ...mcpOAITools];
  return { model, systemPrompt, messages, toolsForStep, mcpBundles, collectedData, isInit, isVerify };
}

// ─── Core agent (non-streaming) ───────────────────────────────────────────────

export async function runAgent(opts: {
  org: Organization;
  step: OnboardingStep;
  userMessage: string;
  collectedData: Record<string, unknown>;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  isLastStep: boolean;
  pageContext?: PageContext;
  userHistoryFormatted?: string;
  userMetadata?: Record<string, unknown>;
  detectedLang?: string;
  flowGoal?: string;
  liveContext?: string;
  sessionId?: string;
  endUserId?: string;
}): Promise<AgentAction> {
  const { model, systemPrompt, messages, toolsForStep, mcpBundles, collectedData } = await prepareAgentCall(opts);

  const response = await withRetry(
    () => chatWithFallback({
      model,
      max_tokens: model === 'openai/gpt-4o-mini' ? 512 : 1500,
      temperature: 0,
      tools: toolsForStep,
      tool_choice: 'required',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
    { retries: 2, delayMs: 800, label: `agent.openai org=${opts.org.id}` }
  );

  const msg = response.choices[0].message;
  logger.agentAction(opts.org.id, 'n/a', msg.tool_calls?.[0]?.function?.name ?? 'none', {
    stepId: opts.step.id,
    model,
    tokens: response.usage?.total_tokens,
  });

  if (msg.tool_calls && msg.tool_calls.length > 0) {
    const call  = msg.tool_calls[0];
    const name  = call.function.name;
    let input: Record<string, unknown>;
    try {
      input = JSON.parse(call.function.arguments) as Record<string, unknown>;
    } catch {
      return { type: 'chat', content: 'Let me help you with that.' };
    }

    if (name.startsWith('mcp__')) {
      return handleMcpCall(call, mcpBundles, systemPrompt, messages, toolsForStep, model, { orgId: opts.org.id });
    }

    if (name === 'call_api') {
      return executeCallApiTurn(call, collectedData, opts.org, opts.sessionId, systemPrompt, messages, toolsForStep, model, input);
    }

    const action = parseToolCall(name, input);
    if (action) return action;
  }

  return { type: 'chat', content: msg.content ?? 'Let me help you with that.' };
}

// ─── Streaming agent ──────────────────────────────────────────────────────────

export async function* runAgentStream(
  opts: Parameters<typeof runAgent>[0],
): AsyncGenerator<{ type: 'word'; word: string } | { type: 'action'; action: AgentAction }> {
  const { model, systemPrompt, messages, toolsForStep, mcpBundles, collectedData } = await prepareAgentCall(opts);

  const stream = await chatStreamWithFallback({
    model,
    max_tokens: model === 'openai/gpt-4o-mini' ? 512 : 1500,
    temperature: 0,
    tools: toolsForStep,
    tool_choice: 'required',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    stream: true,
  });

  let toolName = '';
  let argsSoFar = '';
  let yieldedTextLength = 0;
  let finishReason = '';
  const accToolCalls: Array<{ id: string; function: { name: string; arguments: string }; type: 'function' }> = [];

  for await (const chunk of stream) {
    const choice = chunk.choices[0];
    if (!choice) continue;
    if (choice.finish_reason) finishReason = choice.finish_reason;

    const delta = choice.delta;
    if (!delta?.tool_calls?.[0]) continue;

    const tc = delta.tool_calls[0];
    const idx = tc.index ?? 0;

    if (!accToolCalls[idx]) {
      accToolCalls[idx] = { id: tc.id ?? '', function: { name: '', arguments: '' }, type: 'function' };
    }
    if (tc.id) accToolCalls[idx].id = tc.id;
    if (tc.function?.name) accToolCalls[idx].function.name += tc.function.name;
    if (tc.function?.arguments) accToolCalls[idx].function.arguments += tc.function.arguments;

    if (tc.function?.name) toolName += tc.function.name;
    if (tc.function?.arguments) {
      argsSoFar += tc.function.arguments;
      const currentText = extractStreamingText(argsSoFar, toolName);
      if (currentText.length > yieldedTextLength) {
        const newChars = currentText.slice(yieldedTextLength);
        yieldedTextLength = currentText.length;
        const words = newChars.split(' ');
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          if (!word) continue;
          if (i === words.length - 1 && !newChars.endsWith(' ')) { yieldedTextLength -= word.length; break; }
          yield { type: 'word', word: word + ' ' };
        }
      }
    }
  }

  void finishReason;
  const call = accToolCalls[0];
  logger.agentAction(opts.org.id, 'n/a', call?.function?.name ?? 'none', { stepId: opts.step.id, model, streaming: true });

  if (!call) { yield { type: 'action', action: { type: 'chat', content: '' } }; return; }

  const name = call.function.name;
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(call.function.arguments) as Record<string, unknown>;
  } catch {
    yield { type: 'action', action: { type: 'chat', content: 'Let me help you with that.' } };
    return;
  }

  if (name.startsWith('mcp__') || name === 'call_api') {
    yield { type: 'word', word: 'Working… ' };
  }

  if (name.startsWith('mcp__')) {
    const action = await handleMcpCall(call as OpenAI.Chat.ChatCompletionMessageToolCall, mcpBundles, systemPrompt, messages, toolsForStep, model, { orgId: opts.org.id });
    yield { type: 'action', action };
    return;
  }

  if (name === 'call_api') {
    const action = await executeCallApiTurn(call as OpenAI.Chat.ChatCompletionMessageToolCall, collectedData, opts.org, opts.sessionId, systemPrompt, messages, toolsForStep, model, input);
    yield { type: 'action', action };
    return;
  }

  const action = parseToolCall(name, input);
  yield { type: 'action', action: action ?? { type: 'chat', content: 'Let me help you with that.' } };
}

// ─── Plan mode ────────────────────────────────────────────────────────────────

export async function runAgentPlan(opts: {
  org: Organization;
  goal: string;
  pageContext?: PageContext;
}): Promise<GoalPlanPhase[]> {
  const { org, goal, pageContext } = opts;

  const planTool: OpenAI.Chat.ChatCompletionTool = {
    type: 'function',
    function: {
      name: 'create_plan',
      description: 'Break the user goal into 2–5 sequential phases',
      parameters: {
        type: 'object',
        properties: {
          phases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id:          { type: 'string' },
                title:       { type: 'string', description: 'Action title, max 6 words' },
                description: { type: 'string', description: 'One sentence: what happens in this phase' },
              },
              required: ['id', 'title', 'description'],
            },
          },
        },
        required: ['phases'],
      },
    },
  };

  const pageHint = pageContext ? `Current page: ${sanitizeDomText(pageContext.title)} (${pageContext.url})` : '';
  const systemPrompt = `You are Ahaget, planning a multi-step workflow inside "${org.name}".\nBreak the user's goal into 2–5 sequential, concrete phases. Each phase is one focused task completable on a single page or screen.\nPhase titles must be under 6 words and action-oriented (e.g. "Create company profile", "Add payment method").\n${pageHint}`.trim();

  const response = await withRetry(
    () => chatWithFallback({
      model: 'openai/gpt-4o',
      max_tokens: 1024,
      temperature: 0,
      tools: [planTool],
      tool_choice: { type: 'function', function: { name: 'create_plan' } },
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: goal }],
    }),
    { retries: 2, delayMs: 600, label: `agent.plan org=${org.id}` }
  );

  const call = response.choices[0].message.tool_calls?.[0];
  if (!call) return [{ id: 'phase_1', title: goal.slice(0, 40), description: 'Complete the requested task.' }];

  try {
    const input = JSON.parse(call.function.arguments) as { phases: GoalPlanPhase[] };
    return input.phases.map((p, i) => ({ ...p, id: p.id || `phase_${i + 1}` }));
  } catch {
    return [{ id: 'phase_1', title: goal.slice(0, 40), description: 'Complete the requested task.' }];
  }
}

// ─── Failure recovery helpers ─────────────────────────────────────────────────

function buildAlternativeSelectorBlock(failedSelectors: Set<string>, elements: PageContext['elements'], goal: string): string {
  if (failedSelectors.size === 0) return '';
  const lines: string[] = ['ALTERNATIVE SELECTORS (use these instead of the failed ones):'];
  let found = false;
  for (const failed of failedSelectors) {
    const hint = failed.replace(/[\[\]"'=.#]/g, ' ').replace(/button|input|select|textarea|div|span|a\b/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const goalWords = goal.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const searchTerms = [...hint.split(' ').filter((w) => w.length > 2), ...goalWords];
    const alternatives: string[] = [];
    for (const el of elements) {
      if (failed === el.selector) continue;
      const haystack = [el.text, el.selector, (el as Record<string, unknown>).placeholder as string ?? '', (el as Record<string, unknown>).ariaLabel as string ?? ''].join(' ').toLowerCase();
      const score = searchTerms.filter((term) => haystack.includes(term)).length;
      if (score >= 2) { alternatives.push(`  • "${el.selector}" (label: "${el.text}")`); if (alternatives.length >= 3) break; }
    }
    if (alternatives.length > 0) { lines.push(`For failed selector "${failed}":`); lines.push(...alternatives); found = true; }
  }
  if (!found) return '';
  return lines.join('\n');
}

function detectWrongPage(pageContext: PageContext, turnHistory: GoalTurn[]): string {
  for (let i = turnHistory.length - 1; i >= 0; i--) {
    const turn = turnHistory[i];
    if (turn.role !== 'assistant') continue;
    const m = turn.content.match(/navigate.*?([/][\w/%-]+)/i);
    if (!m) continue;
    const expectedPath = m[1];
    const currentPath = pageContext.url;
    if (expectedPath.length > 1 && !currentPath.includes(expectedPath.replace(/\/$/, ''))) {
      return `WRONG PAGE DETECTED: Navigation targeted "${expectedPath}" but current page is "${currentPath}".\nYou must navigate to the correct page or replan if that page is inaccessible.`;
    }
    break;
  }
  return '';
}

function buildDegradationInstruction(goal: string, pageContext: PageContext, failedSelectors: Set<string>): string {
  const pageName = pageContext.title || 'current page';
  const failedList = Array.from(failedSelectors).slice(0, 2).join(', ');
  const hint = failedList ? ` The automated action on ${failedList} could not complete.` : '';
  const pageHint = pageContext.semanticSummary ? ` Page context: ${pageContext.semanticSummary.slice(0, 120)}.` : '';
  return `On the "${pageName}" page, manually complete: ${goal}.${hint}${pageHint} Look for the relevant input field or button and perform the action directly.`;
}

// ─── Goal mode ────────────────────────────────────────────────────────────────

export async function runAgentGoal(opts: {
  org: Organization;
  goal: string;
  pageContext: PageContext;
  turnHistory: GoalTurn[];
  sessionId: string;
  userMetadata?: Record<string, unknown>;
  userHistoryFormatted?: string;
  detectedLang?: string;
  liveContext?: string;
}): Promise<AgentAction> {
  const { org, goal, pageContext, turnHistory, userMetadata, userHistoryFormatted, detectedLang } = opts;

  const isFirstGoalTurn = turnHistory.length === 0;
  const lastUserTurn = [...turnHistory].reverse().find((t) => t.role === 'user');
  const INTERROGATIVE_RE = /\b(how|what|why|where|when|which|who|can|could|does|do|is|are|will|would|should)\b/i;
  const lastUserIsQuestion = lastUserTurn ? lastUserTurn.content.includes('?') || INTERROGATIVE_RE.test(lastUserTurn.content) : false;
  const shouldSearchKb = isFirstGoalTurn || lastUserIsQuestion;
  const kbQuery = lastUserIsQuestion && lastUserTurn ? lastUserTurn.content : goal;

  const kbResults = shouldSearchKb
    ? await Promise.race([
        searchKnowledgeBase(org.id, kbQuery, 3, 0.25, pageContext.url).catch(() => []),
        new Promise<Awaited<ReturnType<typeof searchKnowledgeBase>>>((resolve) => setTimeout(() => resolve([]), 800)),
      ])
    : [];
  const mcpBundles: ConnectorToolBundle[] = await loadMcpTools(org.id).catch(() => []);
  const mcpOAITools = toOpenAITools(mcpBundles);
  const mcpSection = mcpBundles.length > 0 ? `\nMCP TOOLS AVAILABLE: You have ${mcpOAITools.length} external tool(s) from ${mcpBundles.length} connector(s). Use them when they help complete this goal.\n` : '';

  const seenGoalKbTitles = new Set<string>();
  const uniqueGoalKbResults = kbResults.filter((r) => { if (seenGoalKbTitles.has(r.title)) return false; seenGoalKbTitles.add(r.title); return true; });
  const kbSection = uniqueGoalKbResults.length > 0 ? `\nKNOWLEDGE BASE:\n${uniqueGoalKbResults.map((r) => `[${r.title}]\n${truncateAtSentence(r.content, 500)}`).join('\n\n')}\n` : '';

  const goalCompleteTool: OpenAI.Chat.ChatCompletionTool = {
    type: 'function',
    function: { name: 'goal_complete', description: 'Call this when the user goal is fully achieved. Summarize what was accomplished.', parameters: { type: 'object', properties: { summary: { type: 'string', description: 'What was accomplished, under 20 words' } }, required: ['summary'] } },
  };

  const domSummary = buildDomSummary(pageContext);

  const GOAL_SUMMARIZE_THRESHOLD = 10;
  const GOAL_RECENT_WINDOW = 4;
  let historyText: string;
  if (turnHistory.length === 0) {
    historyText = 'None yet.';
  } else if (turnHistory.length > GOAL_SUMMARIZE_THRESHOLD) {
    const olderGoalTurns = turnHistory.slice(0, -GOAL_RECENT_WINDOW).map((t) => `${t.role}: ${t.content}`).join('\n');
    const recentGoalTurns = turnHistory.slice(-GOAL_RECENT_WINDOW).map((t, i) => `Turn ${turnHistory.length - GOAL_RECENT_WINDOW + i + 1} [${t.role}]: ${t.content}`).join('\n');
    const goalSummary = await summarizeHistory(turnHistory.slice(0, -GOAL_RECENT_WINDOW).map((t) => ({ role: t.role === 'user' ? 'user' : 'assistant' as const, content: t.content })));
    historyText = goalSummary ? `[Earlier turns summary: ${goalSummary}]\n${recentGoalTurns}` : `${olderGoalTurns}\n${recentGoalTurns}`;
  } else {
    historyText = turnHistory.map((t, i) => `Turn ${i + 1} [${t.role}]: ${t.content}`).join('\n');
  }

  const observeCount = turnHistory.filter((t) => t.role === 'observe').length;
  const turnTimer = timer();

  const failedSelectors = new Set<string>();
  for (const turn of turnHistory) {
    if (turn.role !== 'observe') continue;
    const m = turn.content.match(/selector\s+"([^"]+)"/);
    if (m) failedSelectors.add(m[1]);
  }
  const alternativeSelectorBlock = buildAlternativeSelectorBlock(failedSelectors, pageContext.elements, goal);
  const wrongPageBlock = detectWrongPage(pageContext, turnHistory);

  const failureContextBlock = (observeCount > 0 || wrongPageBlock) ? `\n\nFAILURE RECOVERY CONTEXT:\n${observeCount > 0 ? `A previous action did not change the page (${observeCount} failed attempt${observeCount > 1 ? 's' : ''}).` : ''}\n${wrongPageBlock || ''}\n${alternativeSelectorBlock}\n\nRecovery strategy (in order):\n1. Try the ALTERNATIVE SELECTORS listed above\n2. If no alternative listed, try selecting by visible label text, input placeholder, or proximity to a heading\n3. If you have exhausted 2+ different selectors and all failed, call degrade_to_manual — do NOT call escalate_to_human\n4. Only escalate_to_human after degrade_to_manual has been shown and the user chose "Get human help"\n\nNever repeat a selector that appears in a failed observe turn.\n${observeCount >= 3 ? '\nYou have reached 3 failures. You MUST call degrade_to_manual now — not escalate_to_human.' : ''}` : '';

  const userProfile = userMetadata && Object.keys(userMetadata).length > 0 ? `USER PROFILE: ${JSON.stringify(userMetadata)} — match your language and depth to this user's context.\n` : '';
  const priorHistorySection = userHistoryFormatted ? `\n${userHistoryFormatted}\n` : '';
  const liveContextSection = opts.liveContext ? `\n${opts.liveContext}\n` : '';
  const goalLangInstruction = detectedLang === 'hi' ? '\nLANGUAGE: Always respond in Hindi (Devanagari script). Keep technical terms in English.' : detectedLang === 'hinglish' ? '\nLANGUAGE: Respond in Hinglish — natural Hindi+English mix in Roman script.' : '';

  const systemPrompt = `You are Ahaget, an AI agent inside "${org.name}".\n${userProfile}${liveContextSection}${priorHistorySection}\nGOAL: ${goal}\n\nTURN HISTORY (what you have done so far):\n${historyText}\n\nCURRENT PAGE:\n${domSummary}\n${kbSection}${mcpSection}\nYou must look at the current page and decide the single best next action to make progress toward the goal.\n\nRULES:\n- Call goal_complete ONLY when the goal is provably achieved based on what you can see on the page\n- Call ask_clarification ONLY when you genuinely cannot proceed without user input — one question max\n- Call escalate_to_human ONLY after degrade_to_manual has already been tried and the user chose to escalate\n- Only use selectors that appear verbatim in LIVE PAGE ELEMENTS\n- Keep all user-facing text under 25 words\n- Never repeat an action that already failed — try a different approach\n- Do not call complete_step or celebrate_milestone in goal mode — use goal_complete instead\n- If the user asks a factual question and the KNOWLEDGE BASE section above is empty or contains no relevant answer, respond via ask_clarification with exactly: "I don't have that in my knowledge base. Please reach out to support."\n- NEVER fill or read fields of type password, or whose name/label contains: password, ssn, social security, credit card, card number, cvv, cvc, or pin — skip them entirely\n- If stuck after 2+ attempts, call degrade_to_manual BEFORE escalate_to_human\n\n${org.customInstructions ?? ''}${failureContextBlock}${goalLangInstruction}`.trim();

  const degradeToManualTool: OpenAI.Chat.ChatCompletionTool = {
    type: 'function',
    function: { name: 'degrade_to_manual', description: 'When you cannot complete an action after multiple attempts, produce a precise manual instruction for the user. Do NOT escalate — instruct. Use specific visual landmarks: color, position, label text.', parameters: { type: 'object', properties: { instruction: { type: 'string', description: 'Exact step-by-step manual instruction' }, reason: { type: 'string', description: 'One sentence explaining why automation failed' } }, required: ['instruction', 'reason'] } },
  };

  const restAllowedInGoalMode = await isCallApiAllowedInGoalMode(org.id);
  const tools = [...AGENT_TOOLS, goalCompleteTool, degradeToManualTool, ...mcpOAITools].filter((t) => t.function.name !== 'call_api' || restAllowedInGoalMode);

  const GOAL_TURN_TIMEOUT_MS = 8_000;
  const hasKbInContext = kbResults.length > 0;
  const needsBigModel = isFirstGoalTurn || hasKbInContext || wrongPageBlock.length > 0;
  const goalModel = needsBigModel ? 'openai/gpt-4o' : 'openai/gpt-4o-mini';

  const goalMessages: OpenAI.Chat.ChatCompletionMessageParam[] = turnHistory
    .filter((t) => t.role === 'user' || t.role === 'assistant')
    .map((t) => ({ role: t.role as 'user' | 'assistant', content: t.content }));

  const rawResponse = await withRetry(
    () => Promise.race([
      chatWithFallback({
        model: goalModel,
        max_tokens: 1500,
        temperature: 0,
        tools,
        tool_choice: 'required',
        messages: [{ role: 'system', content: systemPrompt }, ...goalMessages],
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), GOAL_TURN_TIMEOUT_MS)),
    ]),
    { retries: 2, delayMs: 800, label: `agent.goal org=${org.id}` }
  );

  if (!rawResponse) {
    logger.warn('agent.goal.timeout', { orgId: org.id, sessionId: opts.sessionId });
    return { type: 'ask_clarification', question: 'This is taking longer than expected. Want to continue or try a simpler approach?', options: ['Continue', 'Try a simpler approach'] };
  }

  const msg = rawResponse.choices[0].message;
  const actionName = msg.tool_calls?.[0]?.function?.name ?? 'none';

  logger.latency('agent.goal.turn', turnTimer(), { orgId: org.id, sessionId: opts.sessionId, model: goalModel, action: actionName, observeCount, tokens: rawResponse.usage?.total_tokens, failedSelectors: failedSelectors.size });
  logger.agentAction(org.id, opts.sessionId, actionName, { goalMode: true, model: goalModel, tokens: rawResponse.usage?.total_tokens, failedSelectors: failedSelectors.size, observeCount });

  if (msg.tool_calls && msg.tool_calls.length > 0) {
    const call = msg.tool_calls[0];
    let input: Record<string, unknown>;
    try { input = JSON.parse(call.function.arguments) as Record<string, unknown>; }
    catch { return { type: 'chat', content: 'Let me help you with that.' }; }

    if (call.function.name.startsWith('mcp__')) {
      return handleMcpCall(call as OpenAI.Chat.ChatCompletionMessageToolCall, mcpBundles, systemPrompt, [], tools, goalModel, { orgId: org.id, sessionId: opts.sessionId });
    }

    if (call.function.name === 'escalate_to_human' && observeCount >= 2) {
      const degradeAlreadyShown = turnHistory.some((t) => t.role === 'degrade' || (t.role === 'assistant' && t.content.toLowerCase().includes('manually')));
      if (!degradeAlreadyShown) {
        logger.warn('agent.goal.escalation_intercepted', { orgId: org.id, sessionId: opts.sessionId, observeCount, redirectingTo: 'degrade_to_manual' });
        return { type: 'degrade_to_manual', instruction: buildDegradationInstruction(goal, pageContext, failedSelectors), reason: `Automation could not reliably execute the action after ${observeCount} attempt${observeCount > 1 ? 's' : ''}. The page element may have changed.` };
      }
    }

    const action = parseToolCall(call.function.name, input);
    if (action) return action;
  }

  return { type: 'chat', content: msg.content ?? 'Let me help you with that.' };
}

// ─── Safe wrapper ─────────────────────────────────────────────────────────────

export async function runAgentSafe(
  opts: Parameters<typeof runAgent>[0] & { sessionId?: string }
): Promise<AgentAction> {
  try {
    return await runAgent(opts);
  } catch (err) {
    logger.agentError(opts.org.id, opts.sessionId ?? 'unknown', err, { stepId: opts.step.id, fallback: true });
    const fallbackText = opts.step.description ? `Here's how to do this step manually:\n\n${opts.step.description}` : `I'm having trouble. Please try: ${opts.step.title}`;
    return { type: 'ask_clarification', question: fallbackText, options: ['Got it, continue', 'I need more help'] };
  }
}
