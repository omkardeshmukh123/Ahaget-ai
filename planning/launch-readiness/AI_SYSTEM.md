# AI SYSTEM AUDIT — Ahaget
> Agent quality, safety, reliability, and evaluation. Last updated: 2026-06-01.

---

## AI Architecture Overview

The agent is the core product. It receives a system prompt assembled from:
1. Org custom instructions + playbook config (tone, guardrails)
2. Current step config + smart questions
3. Live DOM summary of user's page
4. KB search results (pgvector + BM25 + RRF, up to 3 articles)
5. MCP tool descriptions
6. Interface map context (pre-annotated DOM elements)
7. Cross-session user memory (last 10 facts)
8. Live context snapshot (pre-fetched from customer APIs)
9. Conversation history (last 20 messages, summarized at 12)

**Modes:**
- `runAgentSafe` — per-turn tool call (default)
- `runAgentStream` — SSE token streaming
- `runAgentGoal` — free-form goal, ReAct loop (max 12 turns)
- `runAgentPlan` — goal → phases checklist

**Model routing:**
- `openai/gpt-4o-mini` — default
- `openai/gpt-4o` — when KB hit score ≥ 0.6

---

## AI Quality Assessment

### Strengths
1. **Tool-calling architecture** — Clean separation between agent decision (tool call) and widget execution. Agent never writes raw JS; it returns structured `AgentAction` objects.
2. **Context richness** — DOM context + KB + memory + live context is significantly richer than competitors. This is a real competitive advantage.
3. **Self-healing selectors** — 8 fallback strategies when CSS selectors break. Reduces maintenance burden for customers.
4. **A/B experiment infrastructure** — Data model supports it. (UI not built yet.)
5. **Eval framework** — `AgentEvalLog` tracks first-turn completion, latency, selector success. This is the right foundation.
6. **Memory extraction** — Cross-session UserMemory extracts facts after each step completion.
7. **Goal mode** — ReAct loop with 12-turn max and graceful `escalate_to_human` fallback.

### Weaknesses

#### AI-01: Single LLM provider dependency
**Problem:** All chat completions go through OpenRouter. If OpenRouter goes down, the product is 100% unavailable. No fallback provider.
**Impact:** At 100 customers, a 30-minute OpenRouter outage = 100 angry customers.
**Fix:** Add direct Anthropic (claude-3-haiku-20240307) as fallback in `_openai.ts`. Detect failures and rotate provider.

#### AI-02: Context window not validated
**Problem:** The system prompt includes: org instructions + step config + DOM summary + KB (3 articles) + MCP tools + interface map + memory + live context + conversation history. For complex orgs, this could exceed 128K tokens.
**Currently:** No token counting before sending to OpenRouter.
**Risk:** Silent truncation by OpenRouter → agent loses critical context → bad responses.
**Fix:** Count tokens before sending (tiktoken or approximation). If > 100K tokens, truncate lower-priority sections (DOM summary first, then older history).

#### AI-03: Prompt injection not fully mitigated
**Problem:** Described in SECURITY.md. Page DOM content is injected verbatim.
**Additional concern:** KB article content (from customer URLs) is also injected. A malicious actor could create a KB article containing injection instructions.
**Fix:** Sanitize both DOM and KB content. See SECURITY.md VULN-05.

#### AI-04: No hallucination detection
**Problem:** Agent responses (especially `chat` type and `ask_clarification` text) are passed directly to the user. If the agent hallucinates a step or product feature, the user follows incorrect instructions.
**No current mitigation.**
**Fix:**
1. For `complete_step` actions: verify that smart questions are answered (already done via `guardCompleteStep`).
2. For `chat` actions: add a confidence signal. When KB miss (score < 0.3) and no context, fall back to `escalate_to_human`.
3. For `execute_page_action`: verify the selector exists in the live DOM before returning (already done via `selectorValid` in eval log, but not enforced at action time).

#### AI-05: Model routing is too coarse
**Problem:** Only two models. `gpt-4o-mini` is cheap but lacks reasoning depth for complex MCP tool chains. `gpt-4o` is routed only by KB score — not by action type or complexity.
**Better routing:**
- Goal mode → always `gpt-4o` (reasoning-heavy)
- MCP tool chain (2+ tools) → `gpt-4o`
- Simple step guide (DOM action + no KB) → `gpt-4o-mini`
- Verify turns → `gpt-4o-mini`
- STT/TTS → never need LLM upgrade

#### AI-06: No eval metrics visible in dashboard
**Problem:** `AgentEvalLog` exists and is populated. Three KPIs are tracked: first-turn completion rate, p95 latency, selector success rate. But there is NO dashboard UI showing these metrics.
**Impact:** Customers and founders cannot see if agent quality is degrading. Regressions go unnoticed.
**Fix:** Build `Agent Health` dashboard panel showing:
- First-turn completion % (week-over-week)
- P95 latency (week-over-week)
- Selector success rate (week-over-week)
- Model cost estimate

#### AI-07: Memory extraction quality
**Problem:** `extractAndSaveMemory` runs after `complete_step`. The current implementation extracts facts from conversation history. But there's no quality validation — a hallucinated fact gets stored with `confidence: 0.8` default.
**Fix:** Add confidence scoring. Don't save memories from very short conversations (< 3 turns). Cap at 20 memories per user (evict oldest low-confidence).

#### AI-08: Goal mode has no budget/cost control
**Problem:** `runAgentGoal` can run up to 12 turns. Each turn calls OpenRouter. For a complex goal on `gpt-4o`, that's 12 × ~$0.05 = $0.60 per goal execution.
**At 10,000 goal executions/month:** $6,000 in LLM costs for one customer.
**Fix:** Track `goalModeTokensUsed` per session. Enforce a token budget per goal execution (default: 10K tokens). Gate `goal_mode` on Growth+ plan.

---

## Eval Framework Assessment

**Exists:** `apps/backend/tests/evals/` — runner.ts, report.ts, scenarios.
**Three tracked KPIs:**
1. First-turn completion rate (target: >60%)
2. P95 agent latency (target: <3000ms)
3. Selector success rate (target: >90%)

**Weekly regression check:** `evalRegression.ts` worker runs Mondays.

**Gaps:**
- No eval scenarios for goal mode (only step-mode evals)
- No evaluation of KB answer quality (is the retrieved article relevant?)
- No "red team" eval scenarios (prompt injection, off-topic queries)
- Evals run against test fixtures, not real production conversations
- No eval results visible anywhere except server logs

---

## MCP Security Review

**Current protection:**
- `readOnly` flag blocks write-verb tool calls
- `allowedTools` whitelist per connector
- `allowInGoalMode` flag controls goal-mode access
- 10-second timeout on all MCP calls

**Gaps:**
1. **MCP server URL validation** — The `serverUrl` in `McpConnector` is not validated against a private IP range check. Customer could point to `http://internal-db/` and the MCP client would call it.
2. **MCP auth value in plaintext** — See SECURITY.md VULN-02.
3. **No MCP tool output sanitization** — MCP tool results are injected into the LLM prompt verbatim. A malicious MCP server could inject agent instructions through its tool output.
4. **Tool call argument injection** — `mcpToolArgs` from `ContextSource` is interpolated at call time with user variables. If a user controls a variable value, they could potentially inject extra arguments.

---

## Tasks

---

### Task: Add LLM provider fallback
**Priority:** P0
**Problem:** Single OpenRouter dependency. Product unavailable during OpenRouter outages.
**Solution:** Catch OpenRouter 5xx errors in `_openai.ts`. Rotate to direct OpenAI API on failure.
**Files:** `apps/backend/src/services/agent/_openai.ts`
**Acceptance Criteria:**
- During simulated OpenRouter outage, agent falls back to OpenAI within 3s
**Status:** [ ] Not Started

---

### Task: Add token budget validation before LLM call
**Priority:** P1
**Problem:** No token counting; large contexts may exceed model window silently.
**Solution:** Estimate token count (chars/4 approximation or tiktoken). If > 100K, truncate DOM summary and older history.
**Files:** `apps/backend/src/services/agent/context.ts`
**Acceptance Criteria:**
- System prompt + messages never exceeds 120K tokens
**Status:** [ ] Not Started

---

### Task: Build Agent Health dashboard panel
**Priority:** P1
**Problem:** `AgentEvalLog` data exists but no UI shows it.
**Solution:** Add `GET /api/v1/analytics/agent-health` endpoint + dashboard section showing KPIs.
**Files:**
- `apps/backend/src/controllers/analytics.ts`
- `apps/dashboard/app/(app)/dashboard/page.tsx`
**Acceptance Criteria:**
- Dashboard shows first-turn completion %, p95 latency, selector success rate with 7-day trends
**Status:** [ ] Not Started

---

### Task: Improve model routing
**Priority:** P1
**Problem:** Only KB score drives model selection. Goal mode, MCP tool chains deserve gpt-4o always.
**Solution:** Update routing.ts to consider action type and mode.
**Files:** `apps/backend/src/services/agent/routing.ts`
**Acceptance Criteria:**
- Goal mode always uses gpt-4o
- Simple step guidance uses gpt-4o-mini
**Status:** [ ] Not Started

---

### Task: Add goal mode token budget
**Priority:** P1
**Problem:** Goal mode can make 12 × gpt-4o calls with no cost control.
**Solution:** Track token usage across goal turns. Abort with `degrade_to_manual` if budget exceeded.
**Files:** `apps/backend/src/services/agent/index.ts` (`runAgentGoal`)
**Acceptance Criteria:**
- Goal mode never uses more than 15K tokens total
- Customers on free plan cannot use goal mode (gate on Growth+)
**Status:** [ ] Not Started

---

### Task: Add SSRF protection to MCP server URLs
**Priority:** P0
**Problem:** `McpConnector.serverUrl` not validated against IP guard.
**Solution:** Apply `assertPublicUrl` when saving and when calling MCP servers.
**Files:** `apps/backend/src/services/mcp.ts`, `apps/backend/src/controllers/mcp.ts`
**Acceptance Criteria:**
- Creating MCP connector with `http://localhost:5432` returns 400 validation error
**Status:** [ ] Not Started

---

### Task: Add MCP tool output sanitization
**Priority:** P1
**Problem:** MCP tool results injected verbatim into LLM prompt could contain injection instructions.
**Solution:** Apply same sanitization as DOM content (see SECURITY.md VULN-05).
**Files:** `apps/backend/src/services/mcp.ts`
**Acceptance Criteria:**
- MCP tool output containing "ignore previous instructions" is neutralized
**Status:** [ ] Not Started
