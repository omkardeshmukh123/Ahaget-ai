import OpenAI from 'openai';

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
