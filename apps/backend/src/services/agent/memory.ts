import { chatWithFallback } from './_openai';
import { prisma } from '../../utils/prisma';
import { logger } from '../../utils/logger';

export const SUMMARIZE_THRESHOLD = 12;
export const RECENT_WINDOW = 6;
const SUMMARIZE_TIMEOUT_MS = 1_500;

// ─── Conversation summarization ───────────────────────────────────────────────
export async function summarizeHistory(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<string> {
  const result = await Promise.race([
    chatWithFallback({
      model: 'openai/gpt-4o-mini',
      max_tokens: 150,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: 'Summarize this conversation in 2-3 sentences. Focus on what the user has already completed and any information collected.',
        },
        {
          role: 'user',
          content: messages.map((m) => `${m.role}: ${m.content}`).join('\n'),
        },
      ],
    }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), SUMMARIZE_TIMEOUT_MS)),
  ]);
  return result?.choices[0].message.content ?? '';
}

// ─── Cross-session user memory ────────────────────────────────────────────────

export async function loadUserMemory(
  orgId: string,
  endUserId: string,
): Promise<string> {
  try {
    const memories = await prisma.userMemory.findMany({
      where: { organizationId: orgId, endUserId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { memoryType: true, content: true },
    });
    if (memories.length === 0) return '';
    const lines = memories.map((m) => `- [${m.memoryType}] ${m.content}`).join('\n');
    return `\nUSER MEMORY (from past sessions):\n${lines}\nUse this context to skip steps the user has already completed and personalise guidance.\n`;
  } catch {
    return '';
  }
}

// ─── Memory extraction after step completion ─────────────────────────────────
// Fires fire-and-forget after a complete_step action to extract facts and store them.

const EXTRACT_TIMEOUT_MS = 3_000;

export function extractAndSaveMemory(opts: {
  orgId: string;
  endUserId: string;
  stepTitle: string;
  collectedData: Record<string, unknown>;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
}): void {
  const { orgId, endUserId, stepTitle, collectedData, conversationHistory } = opts;
  const recentMessages = conversationHistory.slice(-6);

  Promise.race([
    chatWithFallback({
      model: 'openai/gpt-4o-mini',
      max_tokens: 200,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `Extract 1-3 facts from this onboarding step that would help in future sessions.
For each fact output a line: TYPE: content
Types: completed_step | failed_attempt | stated_goal | objection
Only include facts that are genuinely useful for personalising future interactions.
Example: "completed_step: User completed payment setup with Stripe"`,
        },
        {
          role: 'user',
          content: `Step: "${stepTitle}"\nCollected data: ${JSON.stringify(collectedData).slice(0, 300)}\nRecent conversation:\n${recentMessages.map((m) => `${m.role}: ${m.content}`).join('\n')}`,
        },
      ],
    }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), EXTRACT_TIMEOUT_MS)),
  ])
    .then((result) => {
      if (!result) return;
      const text = result.choices[0].message.content ?? '';
      const facts = text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.includes(': '));

      const creates = facts.map((line) => {
        const colonIdx = line.indexOf(': ');
        const rawType = line.slice(0, colonIdx).toLowerCase().trim();
        const content = line.slice(colonIdx + 2).trim();
        const validTypes = ['completed_step', 'failed_attempt', 'stated_goal', 'objection'];
        const memoryType = validTypes.includes(rawType) ? rawType : 'completed_step';
        return prisma.userMemory.create({
          data: { organizationId: orgId, endUserId, memoryType, content, confidence: 0.8 },
        });
      });

      Promise.all(creates).catch((err) => logger.warn('memory.extract.save_failed', { orgId, endUserId, error: String(err) }));
    })
    .catch((err) => logger.warn('memory.extract.failed', { orgId, endUserId, error: String(err) }));
}
