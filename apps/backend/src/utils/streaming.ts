/**
 * Extracts the current value of a named string field from a partially-built
 * JSON argument string during streaming. Used by both the agent (OpenAI tool
 * streaming) and the AI service (Claude streaming) to emit words before the
 * full tool call JSON is complete.
 */
export function extractJsonField(argsSoFar: string, fieldName: string): string {
  const key = `"${fieldName}":`;
  const keyIdx = argsSoFar.indexOf(key);
  if (keyIdx === -1) return '';

  let valueStart = argsSoFar.indexOf('"', keyIdx + key.length);
  if (valueStart === -1) return '';
  valueStart++;

  let text = '';
  let i = valueStart;
  while (i < argsSoFar.length) {
    const c = argsSoFar[i];
    if (c === '\\' && i + 1 < argsSoFar.length) {
      const next = argsSoFar[i + 1];
      if (next === '"') text += '"';
      else if (next === 'n') text += '\n';
      else if (next === 't') text += '\t';
      else text += next;
      i += 2;
    } else if (c === '"') {
      break;
    } else {
      text += c;
      i++;
    }
  }
  return text;
}
