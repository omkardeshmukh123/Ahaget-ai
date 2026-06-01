# Architecture

**Analysis Date:** 2026-06-01

## Pattern Overview

**Overall:** Multi-tenant SaaS B2B2C platform — thin-wrapper monorepo

**Key Characteristics:**
- Ahaget's customers are SaaS companies (Organizations). Their end-users are the people guided by the AI agent.
- The widget is installed on customers' web apps. The dashboard is for customers' admins. The backend serves both.
- Three-tier data model: `Organization` → `EndUser` → `UserOnboardingSession`
- All AI inference is server-side (backend calls OpenRouter); the widget sends page DOM context to the backend
- Feature gating: `planType` field on `Organization` controls access via `requireFeature()` middleware

## Applications

### `apps/backend` — Express REST API + WebSocket Server

**Entry point:** `apps/backend/src/index.ts`

**Responsibilities:**
- Validates required env vars at startup; exits on `DATABASE_URL` or `JWT_SECRET` missing
- Mounts 30+ REST route prefixes under `/api/v1/`
- Attaches WebSocket server at `/ws` (same HTTP server)
- Boots BullMQ workers when `REDIS_URL` is set; falls back to `setTimeout` cron loop
- Exposes `/health` endpoint with live DB ping

**Auth dual-mode:**
- Dashboard users: JWT (`Authorization: Bearer <token>`) via `authenticateJWT`
- Widget / end-users: API key (`X-API-Key`) via `authenticateApiKey`

### `apps/dashboard` — Next.js Admin SPA

**Entry point:** `apps/dashboard/app/layout.tsx`

**Route groups:**
- `(app)/` — authenticated admin pages (dashboard, flows, sessions, knowledge, billing, etc.)
- `(auth)/` — login, register, magic-link
- `(onboarding)/getting-started/` — multi-step onboarding wizard

**Patterns:**
- All pages are `'use client'` (no RSC data fetching — all API calls from the browser)
- Global state: `zustand` store at `apps/dashboard/store/auth.ts` (token, user, org from `localStorage`)
- API client: `apps/dashboard/lib/api.ts` — typed fetch wrapper; auto-attaches JWT; redirects to `/login` on 401
- No server actions or API routes defined in Next.js — all backend calls go to `apps/backend`

### `apps/widget` — Embeddable JavaScript Bundle

**Entry point:** `apps/widget/src/index.ts`

**Public API:**
```javascript
Ahaget('init', { apiKey: '...', userId: '...', metadata: { plan: '...' } })
Ahaget('event', 'event_name')   // fires a step-completion event
```

**Architecture:**
- Global `window.Ahaget` function queues calls made before the script loaded (`__oai_q`)
- `AhagetWidget` class (`apps/widget/src/controllers/widget.ts`) orchestrates the side panel
- `CopilotManager` class (`apps/widget/src/features/copilot.ts`) handles session state and API communication
- DOM scanning (`apps/widget/src/utils/scanner.ts`) sends live page elements to the backend with each agent turn
- Inspector mode: `?ahaget_inspect=1` query param boots a DOM inspector instead of the widget

**Communication with backend:**
- REST endpoints: `POST /api/v1/session/message`, `GET /api/v1/session`, `POST /api/v1/session/start`, `POST /api/v1/events`
- All widget requests use `X-API-Key` header
- Streaming: SSE-like token streaming supported via `POST /api/v1/session/message?stream=true`

### `apps/landing` — Next.js Static Export

- Marketing site, built as static HTML via `next build` + `output: 'export'`
- No backend calls; `out/` directory deployed to Vercel

## Agent Architecture

The core product: an AI agent that guides end-users through onboarding flows.

**Agent invocation paths** (`apps/backend/src/services/agent/index.ts`):

1. **`runAgentSafe`** — standard per-turn agent call. Calls OpenRouter, handles tool dispatch.
2. **`runAgentStream`** — streaming variant; sends SSE tokens to the widget.
3. **`runAgentGoal`** — goal mode; user states a free-form goal, agent plans and executes autonomously.
4. **`runAgentPlan`** — plan mode; agent generates a checklist of phases before executing.

**Agent tool set** (`apps/backend/src/services/agent/tools.ts`):
- `ask_clarification` — request user input with optional choice chips
- `execute_page_action` — DOM actions: `fill_form`, `click`, `navigate`, `highlight`, `hover_tip`, `expand_panel`, `clear_highlight`
- `complete_step` — mark step done, advance to next
- `celebrate_milestone` — first-value "aha moment" celebration
- `call_api` — HTTP call to pre-approved REST endpoints
- `escalate_to_human` — human handoff ticket
- `goal_complete`, `degrade_to_manual`, `suggest_upgrade` — goal/upsell/fallback actions
- Dynamic MCP tools: prefixed `mcp__<connectorName>__<toolName>`, loaded per-org at call time

**Context assembly** (`apps/backend/src/services/agent/context.ts`):
Before every agent call, the system prompt includes:
1. Org custom instructions + PlaybookConfig (tone, guardrails)
2. Current step config + smart questions
3. DOM summary of the user's live page (from widget scanner)
4. KB search results (hybrid pgvector + BM25 + RRF, up to 3 articles)
5. MCP tool descriptions (for connectors with `allowInGoalMode`)
6. InterfaceMap context (pre-annotated DOM elements from dashboard)
7. Cross-session user memory (last 10 facts from `UserMemory`)
8. Live context snapshot (pre-fetched at session start from `ContextSource` rows)
9. Conversation history (last N turns, summarized when > 12 messages)

**Model routing** (`apps/backend/src/services/agent/routing.ts`):
- `openai/gpt-4o-mini` by default
- `openai/gpt-4o` when KB cosine score ≥ 0.6
- `openai/gpt-4o-mini` for verify turns and pre-configured action init turns

## Data Flow

**Widget → Agent Turn:**

1. Widget DOM scanner sends `elements[]`, `headings`, `semanticSummary`, `modalContext` to backend
2. `POST /api/v1/session/message` receives page context + user message
3. `authenticateApiKey` resolves the `Organization`
4. `enforceMessageLimit` + `enforceMtuLimit` gates on plan limits
5. `prepareAgentCall` assembles system prompt (KB, MCP tools, interface map, memory, live context)
6. `openai().chat.completions.create()` via OpenRouter
7. Response tool call parsed → `AgentAction` returned as JSON
8. Widget receives action and executes DOM manipulation locally

**MCP Async Path (when `REDIS_URL` set):**

1. Agent decides to call an MCP tool
2. `McpPendingJob` row inserted to DB with full conversation context
3. BullMQ job enqueued to `mcp-tool-call` queue
4. Backend returns `{ type: 'tool_pending', jobId }` to widget immediately
5. Worker (`apps/backend/src/queues/workers/mcpToolCall.ts`) calls the MCP server
6. Worker runs follow-up LLM turn and stores result in `McpPendingJob.mcpResult`
7. Widget polls `GET /api/v1/session/mcp-result/:jobId` until `status === 'complete'`

**Session lifecycle:**
- Widget calls `POST /api/v1/session/start` → creates/resumes `UserOnboardingSession`
- Each agent turn calls `POST /api/v1/session/message` → creates `SessionMessage` rows
- Completed steps write `UserStepProgress`, `AuditLog`, `AgentEvalLog`, and trigger `extractAndSaveMemory`
- Abandoned sessions swept by `sessionSweep` worker (every 5 minutes: idle >30 min → `abandoned`)

## Background Jobs

All workers in `apps/backend/src/queues/workers/`:

| Worker | Schedule | Purpose |
|--------|----------|---------|
| `flowAlerts.ts` | Every hour | Zero-completion alerts → email |
| `kbRefresh.ts` | Every 6h | Re-crawl KB URL/sitemap sources |
| `proactive.ts` | Daily midnight | Send proactive re-engagement emails/in-app messages |
| `dailyTriggers.ts` | Daily 1am | Evaluate server-side trigger rules (inactivity, feature_unused) |
| `sessionSweep.ts` | Every 5 min | Mark abandoned sessions |
| `evalRegression.ts` | Monday 9am | Weekly eval regression check |
| `mcpToolCall.ts` | On demand | Execute async MCP tool calls |

When `REDIS_URL` is absent, equivalent logic runs via `setTimeout`/`setInterval` in `apps/backend/src/index.ts`.

## Flow Types (AgentFlow)

`OnboardingFlow.flowType` determines lifecycle stage:

| Type | Purpose | Priority |
|------|---------|---------|
| `onboarding` | First-time setup | Low |
| `adoption` | Drive feature usage | Medium |
| `support` | Answer questions | Low |
| `retention` | Re-engage inactive users | High |
| `upsell` | Upgrade to paid plan | High |

## Error Handling

**Strategy:** Centralized error handler middleware, Sentry for unexpected errors, graceful degradation for optional services.

**Patterns:**
- `express-async-errors` patches Express to catch async errors without try/catch
- `errorHandler` middleware (`apps/backend/src/middleware/errorHandler.ts`):
  - `ZodError` → 400 with field-level details
  - All other errors → 500 with `requestId`, exception sent to Sentry
- Optional services (Redis, Sentry, Resend, Sarvam) degrade silently when env vars absent
- Agent: `runAgentSafe` wraps the agent in a try/catch; errors return `{ type: 'chat', content: '<error message>' }` to the widget
- MCP/REST calls: 10s timeout; IP guard blocks private range URLs; errors logged to `McpCallLog`
- `withRetry` utility: 2 retries with 800ms delay for LLM calls

## Cross-Cutting Concerns

**Rate Limiting:**
- Monthly message limit (`enforceMessageLimit`) — Upstash Redis INCR, falls back to in-memory Map
- Monthly Tracked User (MTU) limit (`enforceMtuLimit`) — DB count
- Agent limit + MCP connector limit — DB count enforced on create
- Plan feature gates: `requireFeature(feature)` middleware in `apps/backend/src/middleware/planGate.ts`

**Request Tracing:**
- `requestId` middleware (`apps/backend/src/middleware/requestId.ts`) — UUID attached to every request
- Propagated to Sentry scope and error responses

**Logging:**
- Structured logger at `apps/backend/src/utils/logger.ts` with `latency()`, `httpError()` methods
- Morgan middleware for HTTP access logs

**Validation:**
- Zod schemas inline in controller files (no separate schema directory)

**Security:**
- Helmet for HTTP headers
- IP guard for agent-initiated HTTP calls (`assertPublicUrl` blocks private/loopback ranges)
- `readOnly` flag on MCP connectors blocks write-verb tool calls
- `allowedTools` whitelist per connector
- `requireFeature()` enforces plan gates on Starter+/Growth+/Scale-only endpoints

---

*Architecture analysis: 2026-06-01*
