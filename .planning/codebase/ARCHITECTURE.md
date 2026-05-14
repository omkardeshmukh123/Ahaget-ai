# Architecture

**Analysis Date:** 2026-05-13

## Pattern Overview

**Overall:** Multi-tenant B2B SaaS — AI-powered user lifecycle platform ("AI employee" for SaaS onboarding, adoption, upsell, retention, and support). Four-app monorepo with a headless API backend, a React dashboard, an embeddable browser widget, and a marketing landing site.

**Key Characteristics:**
- Multi-tenant with hard org-level data isolation (`organizationId` FK on every model, Cascade deletes)
- Dual auth scheme: JWT (dashboard users) and API key (widget/external clients)
- AI agent is tool-calling GPT-4o with 8 built-in tools (ask_clarification, execute_page_action, complete_step, etc.) augmented by per-org MCP connectors
- Widget is a self-contained IIFE (no framework, no external deps) injected into customer pages
- WebSocket dual-mode: widget auth uses API key, dashboard subscribe uses JWT

## Apps

**`apps/backend` — Express REST + WebSocket API:**
- Purpose: All data operations, AI agent execution, billing, background jobs
- Location: `apps/backend/src/`
- Port: 4000 (default)
- Depends on: PostgreSQL (Prisma), OpenAI, Stripe, Resend, Sarvam AI
- Used by: dashboard, widget

**`apps/dashboard` — Next.js 14 Admin Dashboard:**
- Purpose: Configuration UI for Ahaget customers — create flows, view analytics, manage KB, handle escalations
- Location: `apps/dashboard/`
- Port: 3000
- Auth: localStorage JWT (`oai_token`) hydrated into Zustand store
- Route groups: `(auth)` login/register/magic-link, `(onboarding)` setup wizard, `(app)` protected app pages

**`apps/widget` — Embeddable Browser Widget:**
- Purpose: Injected into customer SaaS products via `<script>` tag; surfaces AI agent as right-side panel
- Location: `apps/widget/src/`
- Bundle: `dist/widget/widget.iife.js` (IIFE, self-contained, CSS injected by JS)
- Auth: `X-API-Key` API key provided by customer

**`apps/landing` — Marketing Site:**
- Purpose: Public marketing pages (Next.js 14, port 3001)
- Location: `apps/landing/`

## Layers (Backend)

**Routes Layer:**
- Purpose: HTTP request parsing, auth middleware, input validation (Zod), response serialization
- Location: `apps/backend/src/routes/` (23 route files)
- Auth applied per-router: `authenticateJWT` for dashboard routes, `authenticateApiKey` for widget routes, some routes support both
- Plan gating: `requireFeature('featureName')` middleware inserted per route
- Depends on: Services, Prisma, Middleware

**Services Layer:**
- Purpose: Business logic, AI agent orchestration, external API calls
- Location: `apps/backend/src/services/`
- Key services:
  - `agent.ts` — GPT-4o tool-calling loop; 8 built-in tools + MCP tool injection
  - `knowledge.ts` — Hybrid BM25 + cosine similarity (RRF) search over `KnowledgeBaseArticle`
  - `mcp.ts` — JSON-RPC 2.0 MCP connector client with in-process cache
  - `escalation.ts` — Creates EscalationTickets, notifies via email + Slack webhook
  - `proactive.ts` — Daily cron: identifies users matching inactivity/feature_unused rules, sends in-app + email
  - `crawl.ts` — Fetches URL → cheerio → clean text for KB ingestion
  - `sarvam.ts` — Sarvam AI: language detection, translation, STT, TTS for Indian languages
  - `intent.ts` — Lightweight message intent classification
  - `userhistory.ts` — Loads user's session/step history for agent context
  - `alerting.ts` — Broken-selector alert detection (runs hourly)
  - `apicall.ts` — Executes `call_api` agent tool calls against pre-approved REST endpoints

**Data Layer:**
- Purpose: All database access via Prisma client
- Location: `apps/backend/src/lib/prisma.ts` (singleton)
- Schema: `apps/backend/prisma/schema.prisma` (26 models)
- No repository pattern — Prisma calls made directly in services and routes

**Middleware Layer:**
- Location: `apps/backend/src/middleware/`
- `auth.ts` — `authenticateApiKey` (X-API-Key → org) and `authenticateJWT` (Bearer JWT → user)
- `planGate.ts` — `requireFeature(key: keyof PlanFeatures)` — 403 with `PLAN_FEATURE_LOCKED` code if plan gate fails
- `rateLimit.ts` — `enforceMessageLimit` — monthly AI message usage check (DB-backed count)
- `errorHandler.ts` — ZodError → 400, all others → 500; structured logging

**Jobs Layer:**
- Location: `apps/backend/src/jobs/`
- `kbRefresh.ts` — Re-crawls stale URL-sourced KB articles (>24h old), max 3 concurrent
- Scheduled via `setTimeout`/`setInterval` in `apps/backend/src/index.ts`

## Data Flow

**Widget → AI Agent Response:**
1. Customer page loads widget IIFE, calls `Ahaget('init', { apiKey, userId, metadata })`
2. Widget calls `POST /api/v1/session/start` with `X-API-Key` → creates/gets `UserOnboardingSession`
3. User sends message → `POST /api/v1/session/:id/message` (or WebSocket `message` event)
4. `session.ts` route: detect language (Sarvam) → load user history → run agent (`runAgentSafe`)
5. `agent.ts`: build system prompt with org config + live page elements + KB results → call GPT-4o with tools
6. Agent returns tool calls (ask_clarification, execute_page_action, complete_step, etc.)
7. Response translated back to user language if non-English (Sarvam)
8. Widget receives action JSON → executes DOM operations (highlight, click, fill form) client-side

**Dashboard Auth Flow:**
1. User submits `/login` → `POST /api/v1/auth/login` → JWT returned
2. JWT stored in `localStorage['oai_token']`; Zustand `useAuthStore` hydrates on page load
3. All API calls via `apps/dashboard/lib/api.ts` → `apiFetch()` attaches `Authorization: Bearer <token>`
4. 401 response clears localStorage and redirects to `/login`

**KB Hybrid Search:**
1. Query text embedded via OpenAI `text-embedding-3-small`
2. BM25 scoring computed in-memory over article tokens
3. Cosine similarity computed between query embedding and stored `embedding` JSON arrays
4. Reciprocal Rank Fusion (RRF) merges BM25 + vector rankings
5. Top-N results returned to agent as context in system prompt

**Trigger Evaluation (Widget Init):**
1. Widget calls `GET /api/v1/triggers/evaluate?userId=&page=`
2. Server loads active `TriggerRule` rows for org, evaluates against user history + current page
3. Returns highest-priority matching flow (priority: retention > upsell > adoption > onboarding > support)
4. Widget automatically starts session for matching flow

**Proactive Messaging (Daily Cron):**
1. `runProactiveMessaging()` loads inactivity/feature_unused/page_never_visited trigger rules
2. Finds matching end users (not seen in N days, unsubscribed=false)
3. Deduplicates: max 1 message per user per 48 hours
4. Writes `ProactiveMessage` rows (in_app + email channels)
5. Sends email via Resend with deep link `?ahaget_resume=<token>`

## State Management

**Backend:**
- All state in PostgreSQL via Prisma; no in-memory application state except short-lived caches
- Session state held in `UserOnboardingSession` + `SessionMessage` rows
- `collectedData` JSON field accumulates agent-collected answers across turns

**Dashboard:**
- Zustand `useAuthStore` (`apps/dashboard/store/auth.ts`) — token, user, org from localStorage
- All other state: local `useState` per page component (no shared state beyond auth)

## Entry Points

**Backend:**
- Location: `apps/backend/src/index.ts`
- Starts Express + WebSocket server, validates required env vars, registers all routes, boots background cron jobs

**Dashboard:**
- Location: `apps/dashboard/app/layout.tsx` → `apps/dashboard/app/(app)/layout.tsx`
- Auth guard in `(app)/layout.tsx` redirects to `/login` if no token

**Widget:**
- Location: `apps/widget/src/index.ts`
- Public API: `window.Ahaget(cmd, payload)` — `init` starts widget, `event` fires step completion events
- Inspector mode: `?ahaget_inspect=1` URL param boots inspector instead of normal widget

## Error Handling

**Strategy:** Centralized global error handler (`apps/backend/src/middleware/errorHandler.ts`) catches all route errors via `express-async-errors`

**Patterns:**
- ZodError → 400 with field-level details array
- All other errors → 500 with generic message; full error logged via structured logger
- Auth errors: 401 (missing/invalid credentials), 403 (plan feature locked)
- Rate limit: 429 with `{ error, limit, used, upgradeUrl }`
- Widget API calls: fire-and-forget; errors silently swallowed to never crash host page
- AI agent: `withRetry()` with exponential backoff for transient OpenAI errors (4xx non-429 throw immediately)

## Cross-Cutting Concerns

**Logging:**
- Structured JSON to stdout via `apps/backend/src/lib/logger.ts`
- Events use dot-notation keys (e.g., `kb.search`, `agent.tool_call`)
- `timer()` utility for high-resolution latency measurements

**Validation:**
- Backend: Zod schemas inline in route files
- Dashboard forms: `react-hook-form` + `@hookform/resolvers/zod`

**Authentication:**
- Two schemes applied per endpoint type:
  - Widget/public client endpoints: `authenticateApiKey` (resolves to `req.organization`)
  - Dashboard endpoints: `authenticateJWT` (resolves to `req.user` with `userId`, `organizationId`, `role`)

**SSRF Protection:**
- All outbound HTTP (MCP servers, KB URL crawl, REST API tool calls) passes through `assertPublicUrl()` in `apps/backend/src/lib/ipGuard.ts`
- Blocks private IP ranges, loopback, non-HTTP protocols

**Multi-tenancy:**
- Every DB query filters by `organizationId` from authenticated context
- No row-level security at DB level — enforced in application code

---

*Architecture analysis: 2026-05-13*
