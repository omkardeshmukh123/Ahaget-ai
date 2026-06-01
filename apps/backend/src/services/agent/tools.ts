import OpenAI from 'openai';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { openai, chatWithFallback } from './_openai';
import { AgentAction } from './types';
import { executeApiCall, interpolate } from '../apicall';
import { assertPublicUrl } from '../../utils/ipGuard';
import { loadRestContext, matchesRestEndpoint, resolveMcpCall, callMcpToolWithPoll, ConnectorToolBundle } from '../mcp';
import { prisma } from '../../utils/prisma';
import { logger, withRetry } from '../../utils/logger';
import { extractJsonField } from '../../utils/streaming';
import { getMcpQueue, isQueueEnabled } from '../../queues';
import { JOBS } from '../../queues/jobTypes';
const JOBS_MCP = JOBS.MCP_TOOL_CALL;

// ─── Tool definitions ─────────────────────────────────────────────────────────

export const AGENT_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'ask_clarification',
      description:
        'Ask the user ONE focused question to collect information needed to proceed. Include 2-4 options when possible. Use at most once per turn.',
      parameters: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
        },
        required: ['question'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'execute_page_action',
      description:
        'Perform an action on the current page. Use CSS selectors exclusively from the LIVE PAGE ELEMENTS list — never invent selectors.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['fill_form', 'click', 'navigate', 'highlight', 'hover_tip', 'expand_panel', 'clear_highlight'],
          },
          selector: { type: 'string', description: 'CSS selector for click, highlight, hover_tip, or expand_panel trigger (must be from live page elements)' },
          waitForSelector: { type: 'string', description: 'expand_panel: CSS selector to wait for after clicking the trigger (e.g. the panel contents)' },
          url:      { type: 'string', description: 'URL for navigate action. After calling navigate, STOP — you will be re-invoked on the new page with NAVIGATION COMPLETE.' },
          fields: {
            type: 'object',
            description: 'fill_form: { "CSS selector": "value" } — substitute user-provided values from collectedData',
          },
          message: { type: 'string', description: 'Short confirmation shown to the user (≤12 words)' },
          highlightMode: {
            type: 'string',
            enum: ['spotlight', 'beacon', 'arrow', 'multi', 'ring'],
            description: 'spotlight — dark backdrop + ring (max attention). beacon — pulsing dot badge (passive hint). arrow — speech bubble pointing at element. multi — numbered rings on several elements. ring — thin pulsing ring only, no backdrop. Use ring before fill_form when you want to indicate a field without blocking the UI.',
          },
          highlightLabel: { type: 'string' },
          highlightSelectors: { type: 'array', items: { type: 'string' } },
          highlightLabels: { type: 'array', items: { type: 'string' } },
          highlightDuration: {
            type: 'number',
            description: 'How long the highlight stays visible in milliseconds. Default 4000. Use shorter (1500) for quick attention, longer (8000) for complex instructions.',
          },
          highlightColor: {
            type: 'string',
            description: 'Hex color for the highlight ring and label. Defaults to indigo #6366f1.',
          },
          hoverTipText: {
            type: 'string',
            description: 'Text to show in the hover tooltip (required for hover_tip action).',
          },
          hoverTipColor: {
            type: 'string',
            description: 'Hex color for hover tooltip badge (optional, defaults to indigo).',
          },
          shouldVerify: {
            type: 'boolean',
            description: 'Set true for fill_form/click so the widget sends a __verify__ follow-up after execution.',
          },
        },
        required: ['type', 'message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'complete_step',
      description:
        'Mark this step complete and advance. Only call when the user has actually finished the step — not speculatively.',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          collectedData: { type: 'object' },
        },
        required: ['message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'celebrate_milestone',
      description: 'User reached the first-value / aha-moment milestone.',
      parameters: {
        type: 'object',
        properties: {
          headline: { type: 'string' },
          insight:  { type: 'string' },
        },
        required: ['headline', 'insight'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'escalate_to_human',
      description:
        'Hand off to a human agent. Only when: user explicitly asks, repeated failure to help, or billing/bug/refund issue.',
      parameters: {
        type: 'object',
        properties: {
          reason:  { type: 'string' },
          trigger: { type: 'string', enum: ['user_requested', 'agent_detected'] },
          message: { type: 'string' },
        },
        required: ['reason', 'trigger', 'message'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'call_api',
      description:
        'Make an HTTP request to verify a setup, create a resource, or fetch data. Response is returned to you for a follow-up action.',
      parameters: {
        type: 'object',
        properties: {
          url:     { type: 'string' },
          method:  { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
          headers: { type: 'object' },
          body:    { type: 'object', description: 'Use {{variable}} to reference collectedData values' },
          reason:  { type: 'string' },
        },
        required: ['url', 'method', 'reason'],
      },
    },
  },
];

// ─── Parse tool call → AgentAction ───────────────────────────────────────────

export function parseToolCall(name: string, input: Record<string, unknown>): AgentAction | null {
  if (name === 'ask_clarification') {
    return {
      type: 'ask_clarification',
      question: input.question as string,
      options: input.options as string[] | undefined,
    };
  }
  if (name === 'execute_page_action') {
    const { message, shouldVerify, ...rest } = input;
    return {
      type: 'execute_page_action',
      actionType: rest.type as string,
      payload: rest,
      message: message as string,
      shouldVerify: shouldVerify as boolean | undefined,
    };
  }
  if (name === 'complete_step') {
    return {
      type: 'complete_step',
      message: input.message as string,
      collectedData: input.collectedData as Record<string, unknown> | undefined,
    };
  }
  if (name === 'celebrate_milestone') {
    return {
      type: 'celebrate_milestone',
      headline: input.headline as string,
      insight: input.insight as string,
    };
  }
  if (name === 'call_api') {
    return {
      type: 'call_api',
      url: input.url as string,
      method: input.method as string,
      reason: input.reason as string,
    };
  }
  if (name === 'escalate_to_human') {
    return {
      type: 'escalate_to_human',
      reason: input.reason as string,
      trigger: input.trigger as string,
      message: input.message as string,
    };
  }
  if (name === 'goal_complete') {
    return { type: 'goal_complete', summary: input.summary as string };
  }
  if (name === 'degrade_to_manual') {
    return {
      type: 'degrade_to_manual',
      instruction: input.instruction as string,
      reason: input.reason as string,
    };
  }
  if (name === 'suggest_upgrade') {
    return {
      type: 'suggest_upgrade',
      plan: input.plan as string,
      headline: input.headline as string,
      pitch: input.pitch as string,
      upgradeUrl: input.upgradeUrl as string,
      flowId: input.flowId as string,
    };
  }
  return null;
}

// ─── Streaming text extractor ─────────────────────────────────────────────────

export function extractStreamingText(argsSoFar: string, toolName: string): string {
  if (toolName === 'ask_clarification') return extractJsonField(argsSoFar, 'question');
  if (toolName === 'chat')              return extractJsonField(argsSoFar, 'content');
  if (toolName === 'celebrate_milestone') return extractJsonField(argsSoFar, 'headline');
  return '';
}

// ─── KB content truncation at sentence boundary ───────────────────────────────

export function truncateAtSentence(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const boundary = text.lastIndexOf('.', maxChars);
  return boundary > maxChars * 0.6 ? text.slice(0, boundary + 1) : text.slice(0, maxChars);
}

// ─── Shared call_api follow-up turn handler ───────────────────────────────────

export async function executeCallApiTurn(
  call: { id: string; function: { name: string; arguments: string } },
  collectedData: Record<string, unknown>,
  org: { id: string },
  sessionId: string | undefined,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  toolsForStep: OpenAI.Chat.ChatCompletionTool[],
  model: string,
  input: Record<string, unknown>,
): Promise<AgentAction> {
  try { await assertPublicUrl(input.url as string); }
  catch (err) { return { type: 'chat', content: `Cannot reach that URL: ${(err as Error).message}` }; }

  const restCtx = await loadRestContext(org.id).catch(() => null);
  if (restCtx) {
    const { allowed, reason } = matchesRestEndpoint(input.url as string, (input.method as string ?? 'GET').toUpperCase(), restCtx);
    if (!allowed) return { type: 'chat', content: `API call blocked: ${reason}. Ask your administrator to approve this endpoint in Settings → MCPs & APIs.` };
  }
  const connectorHeaders: Record<string, string> =
    restCtx?.authType === 'bearer' && restCtx.authValue ? { Authorization: `Bearer ${restCtx.authValue}` } :
    restCtx?.authType === 'api_key' && restCtx.authValue ? { 'X-API-Key': restCtx.authValue } :
    {};

  const sanitizedData = Object.fromEntries(
    Object.entries(collectedData).map(([k, v]) => [k, typeof v === 'string' ? v.slice(0, 500) : v])
  );
  const rawBody      = input.body as Record<string, unknown> | undefined;
  const resolvedBody = rawBody ? interpolate(rawBody, sanitizedData) as Record<string, unknown> : undefined;

  const CALL_API_TIMEOUT_MS = 10_000;
  const t0 = Date.now();
  const apiResult = await Promise.race([
    executeApiCall({
      url:     input.url as string,
      method:  (input.method as string ?? 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      headers: { ...connectorHeaders, ...(input.headers as Record<string, string> | undefined) },
      body:    resolvedBody,
    }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Request timed out after 10s')), CALL_API_TIMEOUT_MS)),
  ]).catch((err: unknown) => ({ ok: false, status: 0, data: null, error: err instanceof Error ? err.message : 'Request timed out' }));

  prisma.mcpCallLog.create({
    data: {
      organizationId: org.id,
      sessionId:      sessionId ?? null,
      connectorId:    null,
      connectorName:  'REST (call_api)',
      toolName:       `${input.method as string} ${input.url as string}`,
      callType:       'rest',
      args:           { url: input.url, method: input.method, body: resolvedBody ?? input.body } as Prisma.InputJsonValue,
      result:         apiResult ? (apiResult as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      isError:        !apiResult || !apiResult.ok,
      latencyMs:      Date.now() - t0,
    },
  }).catch(() => {});

  const oaiCall = call as OpenAI.Chat.ChatCompletionMessageToolCall;
  const followUpMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    ...messages,
    { role: 'assistant' as const, content: null, tool_calls: [oaiCall] },
    {
      role: 'tool' as const,
      tool_call_id: oaiCall.id,
      content: JSON.stringify({
        ok: apiResult.ok,
        status: apiResult.status,
        data: apiResult.data,
        ...(apiResult.error ? { error: apiResult.error } : {}),
      }),
    },
  ];

  const followUp = await withRetry(
    () => chatWithFallback({
      model,
      max_tokens: 1500,
      temperature: 0,
      tools: toolsForStep.filter((t) => t.function.name !== 'call_api'),
      tool_choice: 'required',
      messages: [{ role: 'system', content: systemPrompt }, ...followUpMessages],
    }),
    { retries: 2, delayMs: 800, label: `agent.call_api_followup org=${org.id}` }
  );

  const fc = followUp.choices[0].message.tool_calls?.[0];
  if (fc) {
    const action = parseToolCall(fc.function.name, JSON.parse(fc.function.arguments));
    if (action) return action;
  }
  return { type: 'chat', content: followUp.choices[0].message.content ?? 'API call completed.' };
}

// ─── Handle MCP tool call + follow-up turn ────────────────────────────────────

export async function handleMcpCall(
  call: OpenAI.Chat.ChatCompletionMessageToolCall,
  mcpBundles: ConnectorToolBundle[],
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  toolsForStep: OpenAI.Chat.ChatCompletionTool[],
  model: string,
  meta: { orgId: string; sessionId?: string },
): Promise<AgentAction> {
  const resolved = resolveMcpCall(call.function.name, mcpBundles);
  if (!resolved) {
    return { type: 'chat', content: 'Could not resolve MCP tool call.' };
  }

  // ── Async path: queue the MCP call and return tool_pending immediately ──────
  if (isQueueEnabled()) {
    const mcpQueue = getMcpQueue();
    if (mcpQueue) {
      const jobId = uuidv4();
      const { connector } = resolved;

      // Persist context so the resume endpoint can run the follow-up LLM turn
      await prisma.$executeRaw`
        INSERT INTO mcp_pending_jobs (id, org_id, session_id, status, context, created_at, updated_at)
        VALUES (
          ${jobId},
          ${meta.orgId},
          ${meta.sessionId ?? null},
          'pending',
          ${JSON.stringify({ systemPrompt, messages, toolsForStep, model, call })}::jsonb,
          NOW(),
          NOW()
        )
      `;

      await mcpQueue.add(JOBS_MCP, {
        jobId,
        orgId:         meta.orgId,
        sessionId:     meta.sessionId,
        connectorId:   connector.id,
        connectorName: connector.name,
        serverUrl:     connector.serverUrl,
        authType:      connector.authType,
        authValue:     connector.authValue,
        mcpToolName:   resolved.mcpToolName,
        args:          JSON.parse(call.function.arguments),
        readOnly:      connector.readOnly,
        allowedTools:  connector.allowedTools,
      });

      return { type: 'tool_pending', jobId, toolName: resolved.mcpToolName };
    }
  }

  // ── Sync path (fallback when REDIS_URL not set) ──────────────────────────────
  const args = JSON.parse(call.function.arguments) as Record<string, unknown>;
  const result = await callMcpToolWithPoll(resolved.connector, resolved.mcpToolName, args, meta);

  const resultText = result.content.map((c) => c.text).join('\n');

  const followUpMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    ...messages,
    { role: 'assistant' as const, content: null, tool_calls: [call] },
    { role: 'tool' as const, tool_call_id: call.id, content: resultText },
  ];

  const followUp = await withRetry(
    () => chatWithFallback({
      model,
      max_tokens: 1500,
      temperature: 0,
      tools: toolsForStep.filter((t) => !t.function.name.startsWith('mcp__')),
      tool_choice: 'required',
      messages: [{ role: 'system', content: systemPrompt }, ...followUpMessages],
    }),
    { retries: 2, delayMs: 800, label: 'agent.mcp_followup' }
  );

  const fc = followUp.choices[0].message.tool_calls?.[0];
  if (fc) {
    const action = parseToolCall(fc.function.name, JSON.parse(fc.function.arguments));
    if (action) return action;
  }

  return { type: 'chat', content: followUp.choices[0].message.content ?? 'Tool call completed.' };
}
