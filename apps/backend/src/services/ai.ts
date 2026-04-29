import Anthropic from '@anthropic-ai/sdk';
import { WebSocket } from 'ws';
import { prisma } from '../lib/prisma';
import { Organization, EndUser } from '@prisma/client';
import { searchKnowledgeBase } from './knowledge';
import { extractJsonField } from '../lib/streaming';

const claude = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// Minimal page context forwarded from the widget for reactive conversations
export interface ConversationPageContext {
  url: string;
  title: string;
  headings: string[];
  elements: Array<{ tag: string; selector: string; text: string; type?: string }>;
  semanticSummary?: string;
}

// ─── Tool definitions ─────────────────────────────────────────────────────────
// Typed as any[] — root node_modules carries SDK 0.20.9 which predates the
// stable Tool type exports; runtime behaviour is unaffected.

const AI_TOOLS: any[] = [
  {
    name: 'chat_response',
    description: 'Send a plain conversational reply to the user. Use for greetings, simple answers, and anything that does not require numbered steps.',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: { type: 'string', description: 'The reply. Keep under 80 words.' },
      },
      required: ['content'],
    },
  },
  {
    name: 'step_by_step_guide',
    description: 'Send a numbered step-by-step guide. Use when the user asks "how do I…" or needs a multi-step walkthrough.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Short action title, under 8 words.' },
        steps: {
          type: 'array',
          items: { type: 'string' },
          description: '2–5 steps. Each under 15 words. Start each with a verb (Click, Enter, Select, etc.).',
        },
      },
      required: ['title', 'steps'],
    },
  },
];

// ─── Language instruction ─────────────────────────────────────────────────────
export function getLanguageInstruction(lang?: string | null): string {
  if (lang === 'hi') return '\nLANGUAGE: Always respond in Hindi (Devanagari script). Keep technical terms in English.';
  if (lang === 'hinglish') return '\nLANGUAGE: Respond in Hinglish — natural Hindi+English mix in Roman script. Example: "Yahan click karein, phir apna naam enter karein."';
  return '';
}

// ─── System prompt ────────────────────────────────────────────────────────────
function buildSystemPrompt(
  org: Organization,
  endUser: EndUser,
  pageContext?: ConversationPageContext,
): string {
  const metadata = endUser.metadata as Record<string, unknown>;

  const domSection = pageContext
    ? [
        `\nCURRENT PAGE: ${pageContext.title} (${pageContext.url})`,
        pageContext.semanticSummary ? pageContext.semanticSummary : '',
        pageContext.headings.length > 0
          ? `Headings: ${pageContext.headings.slice(0, 4).join(' | ')}`
          : '',
      ].filter(Boolean).join('\n') + '\n'
    : '';

  return `You are an AI onboarding assistant embedded inside "${org.name}".
Your job is to help users who are stuck or about to drop off during their onboarding flow.
Act like a knowledgeable product guide — friendly, direct, and action-oriented.

User context:
- User ID: ${endUser.externalId ?? 'Anonymous'}
- First seen: ${endUser.firstSeenAt.toISOString()}
- Current page: ${(metadata.page as string) ?? 'unknown'}
- Trigger: ${(metadata.triggeredBy as string) ?? 'manual'}
- Metadata: ${JSON.stringify(metadata)}
${domSection}
Rules:
1. Be concise — under 80 words for chat replies
2. Guide users to complete the step they're on — don't jump ahead
3. If you don't know a product-specific answer, say "Let me connect you with support"
4. Never mention competitors or make pricing promises
5. Always end with a clear next action
6. Use chat_response for plain replies; use step_by_step_guide when the user needs numbered steps

${org.customInstructions ?? ''}${getLanguageInstruction((org as Record<string, unknown>).languagePreference as string)}`.trim();
}

// ─── Parse completed tool call → content string ───────────────────────────────
// Keeps the same output contract the widget already understands:
//   chat_response        → plain text
//   step_by_step_guide   → JSON string {"type":"steps","title":"…","items":[…]}
function parseToolResult(response: Anthropic.Message): { content: string; tokensUsed: number } {
  const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

  const toolUse = response.content.find((b: any) => b.type === 'tool_use') as any;

  if (!toolUse) {
    const text = response.content.find((b: any) => b.type === 'text') as any;
    return { content: text?.text ?? '', tokensUsed };
  }

  if (toolUse.name === 'step_by_step_guide') {
    const input = toolUse.input as { title: string; steps: string[] };
    return {
      content: JSON.stringify({ type: 'steps', title: input.title, items: input.steps }),
      tokensUsed,
    };
  }

  // chat_response (default)
  const input = toolUse.input as { content: string };
  return { content: input.content ?? '', tokensUsed };
}

// extractJsonField is imported from ../lib/streaming (shared with agent.ts)

// ─── REST handler ─────────────────────────────────────────────────────────────
export async function handleMessage(
  conversationId: string,
  userMessage: string,
  pageContext?: ConversationPageContext,
): Promise<{ messageId: string; content: string; tokensUsed: number }> {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 10 },
      endUser: true,
      organization: true,
    },
  });
  conversation.messages.reverse();

  const kbResults = await Promise.race([
    searchKnowledgeBase(conversation.organization.id, userMessage).catch(() => []),
    new Promise<Awaited<ReturnType<typeof searchKnowledgeBase>>>((resolve) => setTimeout(() => resolve([]), 800)),
  ]);
  const kbSection = kbResults.length > 0
    ? `\nKNOWLEDGE BASE:\n${kbResults.map((r) => `[${r.title}]\n${r.content.slice(0, 400)}`).join('\n\n')}\n`
    : '';

  const systemPrompt = buildSystemPrompt(
    conversation.organization,
    conversation.endUser,
    pageContext,
  ) + kbSection;

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...conversation.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const response = await (claude.messages.create as any)({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages,
    tools: AI_TOOLS,
    tool_choice: { type: 'any' },
  }) as Anthropic.Message;

  const { content: assistantContent, tokensUsed } = parseToolResult(response);

  const [, assistantMsg] = await prisma.$transaction([
    prisma.message.create({ data: { conversationId, role: 'user', content: userMessage } }),
    prisma.message.create({ data: { conversationId, role: 'assistant', content: assistantContent, tokensUsed } }),
  ]);

  return { messageId: assistantMsg.id, content: assistantContent, tokensUsed };
}

// ─── Streaming handler — sends tokens over WebSocket as they arrive ───────────
export async function handleMessageStreaming(
  conversationId: string,
  userMessage: string,
  ws: WebSocket,
  pageContext?: ConversationPageContext,
): Promise<void> {
  await prisma.message.create({ data: { conversationId, role: 'user', content: userMessage } });

  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: 'desc' }, take: 10 },
      endUser: true,
      organization: true,
    },
  });
  conversation.messages.reverse();

  const kbResults = await Promise.race([
    searchKnowledgeBase(conversation.organization.id, userMessage).catch(() => []),
    new Promise<Awaited<ReturnType<typeof searchKnowledgeBase>>>((resolve) => setTimeout(() => resolve([]), 800)),
  ]);
  const kbSection = kbResults.length > 0
    ? `\nKNOWLEDGE BASE:\n${kbResults.map((r) => `[${r.title}]\n${r.content.slice(0, 400)}`).join('\n\n')}\n`
    : '';

  const systemPrompt = buildSystemPrompt(
    conversation.organization,
    conversation.endUser,
    pageContext,
  ) + kbSection;

  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...conversation.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  const stream = (claude.messages.stream as any)({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages,
    tools: AI_TOOLS,
    tool_choice: { type: 'any' },
  });

  // Stream words from the chat_response content field as JSON builds
  let currentToolName = '';
  let argsSoFar = '';
  let yieldedLength = 0;

  for await (const event of stream as AsyncIterable<any>) {
    if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
      currentToolName = event.content_block.name;
      argsSoFar = '';
      yieldedLength = 0;
    }

    if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
      argsSoFar += event.delta.partial_json;

      // Stream words for chat_response (content field) and step_by_step_guide (title field)
      if (currentToolName !== 'chat_response' && currentToolName !== 'step_by_step_guide') continue;

      const streamField = currentToolName === 'step_by_step_guide' ? 'title' : 'content';
      const text = extractJsonField(argsSoFar, streamField);
      if (text.length > yieldedLength) {
        const newChars = text.slice(yieldedLength);
        const words = newChars.split(' ');
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          if (!word) continue;
          // Hold the last segment — it may be mid-word
          if (i === words.length - 1 && !newChars.endsWith(' ')) {
            yieldedLength = text.length - word.length;
            break;
          }
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'token', content: word + ' ' }));
          }
          yieldedLength += word.length + 1;
        }
      }
    }
  }

  const finalMsg = await stream.finalMessage();
  const tokensUsed = finalMsg.usage.input_tokens + finalMsg.usage.output_tokens;
  const { content: fullContent } = parseToolResult(finalMsg);

  const assistantMsg = await prisma.message.create({
    data: { conversationId, role: 'assistant', content: fullContent, tokensUsed },
  });

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'done', messageId: assistantMsg.id, tokensUsed }));
  }
}
