import OpenAI from 'openai';
import { logger } from '../../utils/logger';

let _openai: OpenAI | null = null;
export function openai(): OpenAI {
  if (!_openai) _openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://ahaget.ai',
      'X-Title': 'Ahaget',
    },
  });
  return _openai;
}

let _direct: OpenAI | null = null;
function directOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!_direct) _direct = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _direct;
}

function stripProvider(model: string): string {
  return model.replace(/^openai\//, '');
}

function isFallbackError(err: unknown): boolean {
  const status = (err as Record<string, unknown>)?.status as number | undefined;
  return !status || status >= 500 || status === 429;
}

export async function chatWithFallback(
  params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
): Promise<OpenAI.Chat.ChatCompletion> {
  try {
    return await openai().chat.completions.create(params);
  } catch (err) {
    const direct = directOpenAI();
    if (!direct || !isFallbackError(err)) throw err;
    logger.warn('llm.openrouter.fallback', {
      model: params.model,
      status: (err as Record<string, unknown>)?.status,
    });
    return direct.chat.completions.create({ ...params, model: stripProvider(params.model) });
  }
}

export async function chatStreamWithFallback(
  params: OpenAI.Chat.ChatCompletionCreateParamsStreaming,
) {
  try {
    return openai().chat.completions.create(params);
  } catch (err) {
    const direct = directOpenAI();
    if (!direct || !isFallbackError(err)) throw err;
    logger.warn('llm.openrouter.fallback', {
      model: params.model,
      status: (err as Record<string, unknown>)?.status,
      streaming: true,
    });
    return direct.chat.completions.create({ ...params, model: stripProvider(params.model) });
  }
}
