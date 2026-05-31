# Ahaget — pivot1 Technical Hardening Plan

Source: YC Founder Office Hours critique (2026-05-31)

---

## AI Agent — Critical Issues

### ❌ 1. Streaming (DONE ✅)
`runAgentStream` is wired in `session.ts:1027` and streams tokens via SSE. Already implemented.

### ❌ 2. Cross-Session Memory — The Agent Forgets Everything
**Status:** DONE ✅ (pivot1-w3)

Every session starts fresh. No cross-session facts about a user's past failures, stated goals, or completed steps.

**Fix:**
- Add `UserMemory` Prisma model: `id, orgId, endUserId, memoryType, content, confidence, createdAt`
- After each session, background job extracts facts from conversation and stores them
- Inject top 10 relevant memories into every new session system prompt
- `memoryType`: `completed_step | failed_attempt | stated_goal | objection`

**File:** `services/agent/memory.ts` (when splitting agent.ts)

---

### ❌ 3. Selector Fragility — Hallucinated Selectors
**Status:** TODO (Week 2)

LLM can hallucinate CSS selectors that don't exist on the live DOM. Silent failures.

**Fix:**
- Before executing `fill_form`/`click`, validate selector exists in `pageContext.elements`
- Track `selectorValid` flag in eval log
- If selector not found → return error action with healing hint

**File:** `controllers/session.ts` — validate before `applyActionSideEffects`

---

### ❌ 4. No Eval Framework — Flying Blind on Quality
**Status:** PARTIALLY DONE (Week 1 logging added)

No measurement of: step completion rate, first-turn success, hallucination rate, model routing effectiveness.

**Fix:**
- Week 1: Emit `agent.eval` structured log per turn (latency, tool called, completion status) ✅ DONE
- Week 2: Add `AgentEvalLog` Prisma model for queryable history
- Month 1: Weekly regression test: if `firstTurnCompletionRate < 60%` → alert

**Prisma model to add:**
```prisma
model AgentEvalLog {
  id                    String   @id @default(uuid())
  organizationId        String
  sessionId             String?
  stepId                String?
  model                 String
  toolCalled            String
  latencyMs             Int
  isInit                Boolean
  isVerify              Boolean
  kbHit                 Boolean
  kbTopScore            Float?
  selectorValid         Boolean?
  stepCompletedOnTurn   Boolean
  createdAt             DateTime @default(now())
  @@index([organizationId])
  @@index([createdAt])
}
```

---

### ❌ 5. Context Window Built Wrong — Token-Stuffing
**Status:** TODO (Month 1)

KB section gets sliced when context grows — worst answers when conversation is longest.

**Fix:**
- Static system prompt (cached) for role/rules
- Dynamic sections ranked by relevance to THIS message
- Use 4k token limit for simple action steps, 16k for KB Q&A
- Cuts cost ~60%, improves latency

---

## Backend — Critical Issues

### ❌ 6. agent.ts is 71KB — Single Point of Failure
**Status:** DONE ✅ (pivot1-w3)

1800-line file. Every change touches the same file.

**Fix — split into:**
```
services/agent/
├── index.ts        ← runAgent() entry point
├── context.ts      ← buildSystemPrompt(), buildDomSummary()
├── routing.ts      ← selectModel(), flow type routing
├── tools.ts        ← AGENT_TOOLS + parseToolCall()
├── memory.ts       ← summarizeHistory(), loadUserMemory()
├── kb.ts           ← KB search + KB section builder
└── streaming.ts    ← runAgentStream(), token streaming
```

---

### ❌ 7. Zero Observability — Can't Debug Production
**Status:** DONE ✅ (Week 1 — Sentry added)

No structured error tracking. No request correlation IDs. No production log querying.

**Fix:**
- `@sentry/node` initialized in `index.ts` ✅
- Sentry captures unhandled errors in `errorHandler.ts` ✅
- Request correlation IDs: TODO Week 2
- Deep health endpoint: TODO Week 2

---

### ❌ 8. MCP Tool Calls Block Response
**Status:** TODO (Month 2)

Synchronous MCP calls inside AI pipeline. 3s MCP → 3s+ widget latency.

**Fix:**
- Background job pattern for slow MCP tools
- Return `{ type: 'tool_pending', jobId }` immediately
- Push result via WebSocket when done
- Widget shows "working on it..." spinner

---

### ❌ 9. In-Process Cron Jobs Will Bite You
**Status:** PARTIALLY DONE (Week 1 — CRON_ENABLED guard added ✅)

5 setTimeout/setInterval chains. 2 Railway instances = every cron runs twice.

**Fix:**
- `CRON_ENABLED=true` env var guard ✅ (set false on replica instances)
- Month 2: BullMQ (Redis-backed queue) with dedup, retry, dashboard

---

### ❌ 10. KB Search Has No Vector Index — Dies Past 1000 Articles
**Status:** TODO (Month 1)

In-memory cosine similarity. Works at 50 articles; unusable at 5000.

**Fix:**
- pgvector extension + HNSW index
- `embedding Unsupported("vector(1536)")` in Prisma
- Native `<=>` operator for cosine distance in SQL
- ~10ms at any scale (vs ~500ms+ in-memory at scale)

---

## 3 Metrics to Track

| Metric | Target | Implementation |
|---|---|---|
| First-turn completion rate | >50% | `agent.eval` log: `isInit=true AND toolCalled=complete_step` |
| Agent p95 latency | <2 seconds | `agent.eval` log: `latencyMs` |
| Selector success rate | >90% | `agent.eval` log: `selectorValid` flag |

---

## Execution Timeline

### Week 1 — Survival
- [x] Add Sentry — 10 min
- [x] Add CRON_ENABLED guard — 30 min
- [x] Log agent eval metrics per turn — 2 hours

### Week 2 — Product Quality
- [x] Selector validation before execution — 1 day (session.ts:897–899)
- [x] Request correlation IDs — half day (middleware/requestId.ts, threaded into Sentry + errorHandler)
- [x] AgentEvalLog Prisma model — half day (agent_eval_logs table live, fire-and-forget writes in session.ts)

### Month 1 — Competitive Moat
- [x] Cross-session user memory store — UserMemory model, extractAndSaveMemory, loadUserMemory wired
- [x] Split agent.ts into modules — 7-file agent/ module (types, routing, tools, context, memory, _openai, index)
- [ ] pgvector for KB search — 2 days
- [ ] Hierarchical context management — 3 days

### Month 2 — Scale
- [ ] BullMQ job queue — 1 week
- [ ] Async MCP tool calling — 3 days
- [ ] Full eval framework + regression testing — 1 week
