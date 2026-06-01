# Codebase Structure

**Analysis Date:** 2026-06-01

## Directory Layout

```
Ahaget/                           # Monorepo root
├── apps/
│   ├── backend/                  # Express REST API + WebSocket server
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Prisma schema (source of truth for DB)
│   │   │   ├── migrations/       # 40+ migration directories (timestamped)
│   │   │   └── seed.ts           # DB seed script
│   │   ├── src/
│   │   │   ├── index.ts          # App entry point — Express setup, cron boot
│   │   │   ├── controllers/      # Route handlers (one file per resource)
│   │   │   ├── services/
│   │   │   │   ├── agent/        # AI agent core
│   │   │   │   ├── knowledge.ts  # KB hybrid search (pgvector + BM25 + RRF)
│   │   │   │   ├── mcp.ts        # MCP connector client
│   │   │   │   ├── contextSources.ts  # Live context injection
│   │   │   │   ├── apicall.ts    # call_api tool executor
│   │   │   │   ├── alerting.ts   # Flow zero-completion alerts
│   │   │   │   ├── proactive.ts  # Proactive message sending
│   │   │   │   ├── crawl.ts      # KB URL/sitemap crawler
│   │   │   │   ├── escalation.ts # Human handoff tickets
│   │   │   │   ├── intent.ts     # User intent detection
│   │   │   │   ├── sarvam.ts     # Indian language ML layer
│   │   │   │   └── userhistory.ts# User history formatting
│   │   │   ├── queues/
│   │   │   │   ├── index.ts      # BullMQ boot + job scheduling
│   │   │   │   ├── connection.ts # REDIS_URL parser
│   │   │   │   ├── jobTypes.ts   # Job name constants
│   │   │   │   └── workers/      # One file per background job
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts       # authenticateApiKey, authenticateJWT
│   │   │   │   ├── errorHandler.ts
│   │   │   │   ├── planGate.ts   # requireFeature() plan gate
│   │   │   │   ├── rateLimit.ts  # message/MTU/agent/MCP limits
│   │   │   │   └── requestId.ts
│   │   │   ├── utils/
│   │   │   │   ├── prisma.ts     # Prisma client singleton
│   │   │   │   ├── jwt.ts        # JWT sign/verify
│   │   │   │   ├── email.ts      # Resend email templates
│   │   │   │   ├── stripe.ts     # Stripe client singleton
│   │   │   │   ├── redis.ts      # Upstash Redis helpers
│   │   │   │   ├── sentry.ts     # Sentry init
│   │   │   │   ├── logger.ts     # Structured logger + withRetry
│   │   │   │   ├── websocket.ts  # WS server + org/conversation broadcast
│   │   │   │   ├── plans.ts      # Plan limits, gates, Stripe price IDs
│   │   │   │   ├── ipGuard.ts    # Block private IP ranges in call_api
│   │   │   │   ├── apiKey.ts     # API key generation
│   │   │   │   ├── streaming.ts  # SSE streaming helpers
│   │   │   │   └── templates.ts  # Misc string templates
│   │   │   ├── types/            # Shared TypeScript types (AuthenticatedRequest, etc.)
│   │   │   ├── jobs/
│   │   │   │   └── kbRefresh.ts  # KB refresh job logic (called by worker)
│   │   │   └── __tests__/        # Jest unit + integration tests
│   │   ├── tests/
│   │   │   └── evals/            # AI eval harness (runner.ts, report.ts, scenarios/)
│   │   ├── dist/                 # Compiled output (gitignored)
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── dashboard/                # Next.js 14 admin SPA
│   │   ├── app/
│   │   │   ├── layout.tsx        # Root layout (metadata, globals.css)
│   │   │   ├── page.tsx          # Root redirect (→ /dashboard or /login)
│   │   │   ├── globals.css       # CSS variables (color tokens, dark theme)
│   │   │   ├── (app)/            # Route group: authenticated app pages
│   │   │   │   ├── layout.tsx    # App shell (Sidebar, auth guard)
│   │   │   │   ├── dashboard/    # Overview + metrics
│   │   │   │   ├── flows/        # Flow list + editor + [id]/
│   │   │   │   ├── sessions/     # Session list + [id] replay
│   │   │   │   ├── conversations/# Conversation list + [id]
│   │   │   │   ├── knowledge/    # KB article management
│   │   │   │   ├── users/        # End-user profiles
│   │   │   │   ├── escalations/  # Escalation tickets
│   │   │   │   ├── mcp/          # MCP connector config
│   │   │   │   ├── interface/    # Interface map / DOM annotation
│   │   │   │   ├── triggers/     # Trigger rule config
│   │   │   │   ├── proactive/    # Proactive message history
│   │   │   │   ├── expansion/    # Upsell attribution dashboard
│   │   │   │   ├── branding/     # Widget branding config
│   │   │   │   ├── playbook/     # Agent persona + guardrails
│   │   │   │   ├── insights/     # Analytics + choke-points
│   │   │   │   ├── failures/     # Failure inbox
│   │   │   │   ├── lifecycle/    # Lifecycle flows
│   │   │   │   ├── questions/    # Smart questions
│   │   │   │   ├── in-page-assistant/ # In-page assistant config
│   │   │   │   └── settings/     # Billing, AI, widget, integrations, audit
│   │   │   ├── (auth)/           # Route group: unauthenticated
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── magic-link/verify/
│   │   │   └── (onboarding)/getting-started/  # Post-signup wizard
│   │   │       ├── workspace/ → attribution/ → description/ → install/ → snippet/
│   │   ├── components/           # Shared UI components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── AhagetLogo.tsx
│   │   │   ├── AhagetAssistantPanel.tsx
│   │   │   └── charts/
│   │   ├── lib/
│   │   │   ├── api.ts            # Typed fetch wrapper + all API call definitions
│   │   │   └── auth.ts           # Auth helpers
│   │   ├── store/
│   │   │   └── auth.ts           # Zustand auth store
│   │   ├── e2e/                  # Playwright E2E tests
│   │   ├── public/               # Static assets (logos, favicons)
│   │   └── package.json
│   │
│   ├── widget/                   # Vite embeddable bundle
│   │   ├── src/
│   │   │   ├── index.ts          # Entry: Ahaget() global API + inspector mode
│   │   │   ├── controllers/
│   │   │   │   ├── widget.ts     # AhagetWidget class — side panel orchestrator
│   │   │   │   └── checklist.ts  # Checklist controller
│   │   │   ├── features/
│   │   │   │   ├── copilot.ts    # CopilotManager — session + API calls
│   │   │   │   ├── detector.ts   # Drop-off detection (idle, exit intent)
│   │   │   │   ├── recapture.ts  # Recapture flow logic
│   │   │   │   └── styles.ts     # Widget CSS definitions
│   │   │   ├── models/
│   │   │   │   ├── api.ts        # Widget API client (all fetch calls)
│   │   │   │   └── config.ts     # WidgetConfig type + defaults + script tag reader
│   │   │   ├── views/
│   │   │   │   └── ui.ts         # DOM rendering (panel, messages, cards, chips)
│   │   │   └── utils/
│   │   │       ├── scanner.ts    # DOM element scanner (builds page context)
│   │   │       ├── resolver.ts   # Self-healing CSS selector resolver
│   │   │       ├── highlighter.ts# DOM highlight effects (spotlight, beacon, arrow, etc.)
│   │   │       ├── cursor.ts     # Animated form fill (cursor simulation)
│   │   │       └── inspector.ts  # DOM inspector mode
│   │   ├── vite.dev.config.ts
│   │   └── package.json
│   │
│   └── landing/                  # Next.js static marketing site
│       ├── app/                  # App Router pages
│       ├── public/
│       └── out/                  # Static export output
│
├── packages/
│   └── shared/src/               # Shared TypeScript types (currently empty)
│
├── tests/
│   └── load/                     # k6 load tests
│       ├── k6.js                 # HTTP load test
│       └── k6-websocket.js       # WS load test
│
├── docs/                         # Documentation
├── logo/                         # Brand assets
├── .github/workflows/ci.yml      # GitHub Actions CI
├── .planning/codebase/           # GSD codebase maps (this directory)
├── package.json                  # Workspace root
└── package-lock.json
```

## Key File Locations

**Entry Points:**
- `apps/backend/src/index.ts` — Express app + WS server + cron boot
- `apps/widget/src/index.ts` — `window.Ahaget` global definition
- `apps/dashboard/app/layout.tsx` — Next.js root layout
- `apps/landing/app/` — Marketing pages

**AI Agent:**
- `apps/backend/src/services/agent/index.ts` — `runAgentSafe`, `runAgentStream`, `runAgentGoal`, `runAgentPlan`
- `apps/backend/src/services/agent/tools.ts` — tool definitions + `parseToolCall` + `handleMcpCall`
- `apps/backend/src/services/agent/context.ts` — system prompt builder
- `apps/backend/src/services/agent/routing.ts` — model selection
- `apps/backend/src/services/agent/memory.ts` — cross-session memory
- `apps/backend/src/services/agent/types.ts` — `AgentAction`, `PageContext` types
- `apps/backend/src/services/agent/_openai.ts` — OpenRouter client singleton

**Database:**
- `apps/backend/prisma/schema.prisma` — complete Prisma schema (single file, 870 lines)
- `apps/backend/prisma/migrations/` — migration history

**API Client (Dashboard):**
- `apps/dashboard/lib/api.ts` — all typed API calls (the only place to add new dashboard API calls)

**Widget API Client:**
- `apps/widget/src/models/api.ts` — all widget fetch calls

**Plan / Feature Gates:**
- `apps/backend/src/utils/plans.ts` — `PLANS` map, `PlanFeatures` interface, `planFromPriceId`
- `apps/backend/src/middleware/planGate.ts` — `requireFeature()` middleware

## Naming Conventions

**Files:**
- Backend controllers: `camelCase.ts` (e.g., `contextSources.ts`, `interfaceMap.ts`)
- Backend services: `camelCase.ts`
- Backend workers: `camelCase.ts` (e.g., `evalRegression.ts`)
- Dashboard pages: `page.tsx` (Next.js convention)
- Dashboard components: `PascalCase.tsx`

**Directories:**
- Backend: flat `controllers/`, `services/`, `utils/`, `middleware/` (no subdirs except `agent/`)
- Dashboard: Next.js App Router convention with route groups in parentheses

**TypeScript:**
- Interfaces: `PascalCase` (e.g., `AgentAction`, `PageContext`, `PlanFeatures`)
- Types union: `PascalCase` (e.g., `AgentAction`)
- Env vars: `SCREAMING_SNAKE_CASE`
- Prisma model names: `PascalCase` → table names: `snake_case` via `@@map`

## Where to Add New Code

**New backend route:**
1. Create `apps/backend/src/controllers/<resource>.ts` (use `Router`, apply auth middleware, export default)
2. Import and mount in `apps/backend/src/index.ts` under `/api/v1/<resource>`
3. Add corresponding types to `apps/dashboard/lib/api.ts`

**New agent tool:**
1. Add tool definition to `AGENT_TOOLS` array in `apps/backend/src/services/agent/tools.ts`
2. Add case to `parseToolCall` in the same file
3. Add type to `AgentAction` union in `apps/backend/src/services/agent/types.ts`
4. Add type to widget's `AgentAction` union in `apps/widget/src/features/copilot.ts`
5. Handle the new action in `apps/widget/src/controllers/widget.ts`

**New background job:**
1. Create worker file `apps/backend/src/queues/workers/<name>.ts` (export `start<Name>Worker`)
2. Add job name constant to `apps/backend/src/queues/jobTypes.ts`
3. Register worker in `apps/backend/src/queues/index.ts` (`bootQueues`)
4. Add cron schedule to `SCHEDULES` map in the same file
5. Add setTimeout fallback in `apps/backend/src/index.ts` (for no-Redis dev)

**New dashboard page:**
1. Create directory under `apps/dashboard/app/(app)/<page>/page.tsx`
2. Mark `'use client'` at top
3. Add sidebar link in `apps/dashboard/components/Sidebar.tsx`
4. Add API call definition to `apps/dashboard/lib/api.ts`

**New database model:**
1. Add model to `apps/backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name <name>` from `apps/backend/`
3. Run `npx prisma generate`

**New plan feature gate:**
1. Add field to `PlanFeatures` interface in `apps/backend/src/utils/plans.ts`
2. Set gate value per plan in the `*_GATES` constants
3. Add `requireFeature('<field>')` middleware to protected routes

## Special Directories

**`apps/backend/dist/`:**
- TypeScript compiled output
- Generated, not committed

**`apps/backend/prisma/migrations/`:**
- All database migrations, committed to git
- Named `YYYYMMDD[_HHMMSS]_<description>/`
- Two untracked as of 2026-06-01: `20260601_add_mcp_pending_jobs/`, `20260601_add_user_memories_eval_logs_branding/`

**`apps/dashboard/.next/`:**
- Next.js build cache
- Not committed

**`apps/landing/out/`:**
- Static export for landing page
- Committed (deployed directly)

**`.planning/codebase/`:**
- GSD codebase map documents (this file)
- Committed; updated by `/gsd-map-codebase`

**`apps/widget/src/utils/inspector.ts`:**
- DOM inspector mode activated via `?ahaget_inspect=1`; completely separate boot path from normal widget

---

*Structure analysis: 2026-06-01*
