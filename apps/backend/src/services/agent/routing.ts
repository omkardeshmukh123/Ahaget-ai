export function selectModel(opts: {
  isInit: boolean;
  isVerify: boolean;
  hasActionConfig: boolean;
  hasUnansweredQuestions: boolean;
  hasKbResults: boolean;
  kbTopScore?: number;
}): string {
  const { isInit, isVerify, hasActionConfig, hasUnansweredQuestions, hasKbResults, kbTopScore = 0 } = opts;

  if (isVerify) return 'openai/gpt-4o-mini';
  if (isInit && hasActionConfig && !hasUnansweredQuestions) return 'openai/gpt-4o-mini';
  // Only use gpt-4o when KB hit is high-confidence (score >= 0.6)
  if (hasKbResults && kbTopScore >= 0.6) return 'openai/gpt-4o';
  return 'openai/gpt-4o-mini';
}
