# Codebase Structure

**Analysis Date:** 2026-05-13

## Directory Layout

```
D:/Ahaget/                              # Monorepo root
├── apps/
│   ├── backend/                        # Express REST + WebSocket API (port 4000)
│   │   ├── prisma/
│   │   │   ├── schema.prisma           # 26-model PostgreSQL schema
│   │   │   ├── migrations/             # 30+ Prisma migration directories
│   │   │   └── seed.ts                 # DB seed script
│   │   ├── src/
│   │   │   ├── index.ts                # Entry point: Express setup, route mounting, crons
│   │   │   ├── routes/                 # 23 route files — one per domain
│   │   │   ├── services/               # Business logic and AI orchestration
│   │   │   ├── middleware/             # Auth, planGate, rateLimit, errorHandler
│   │   │   ├── lib/                    # Shared utilities (prisma, jwt, email, stripe, logger…)
│   │   │   ├── jobs/                   # Background job functions (kbRefresh)
│   │   │   ├── types/                  # Shared TypeScript types (AuthenticatedRequest)
│   │   │   └── __tests__/              # Jest integration tests + test helpers
│   │   ├── tests/
│   │   │   └── evals/                  # AI eval scenarios
│   │   ├── jest.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── dashboard/                      # Next.js 14 admin dashboard (port 3000)
│   │   ├── app/
│   │   │   ├── layout.tsx              # Root HTML shell
│   │   │   ├── page.tsx                # Redirects to /dashboard
│   │   │   ├── globals.css             # Global CSS + CSS custom properties (design tokens)
│   │   │   ├── (auth)/                 # Unauthenticated routes: login, register, magic-link
│   │   │   ├── (onboarding)/           # Setup wizard: workspace, attribution, install, snippet
│   │   │   └── (app)/                  # Protected app routes (requires JWT)
│   │   │       ├── layout.tsx          # Auth guard + Sidebar shell
│   │   │       ├── dashboard/          # Overview page with charts
│   │   │       ├── flows/              # Agent flow builder and list
│   │   │       ├── sessions/           # Session replay and detail views
│   │   │       ├── conversations/      # Chat conversation list and detail
│   │   │       ├── escalations/        # Human escalation ticket inbox
│   │   │       ├── questions/          # User questions inbox
│   │   │       ├── knowledge/          # Knowledge base article management
│   │   │       ├── users/              # End-user list
│   │   │       ├── insights/           # Analytics: choke-points
│   │   │       ├── expansion/          # Upsell revenue analytics
│   │   │       ├── lifecycle/          # User lifecycle view
│   │   │       ├── triggers/           # Trigger rule management
│   │   │       ├── playbook/           # Agent persona + guardrails config
│   │   │       ├── interface/          # Interface map / DOM snapshot browser
│   │   │       ├── in-page-assistant/  # Widget preview
│   │   │       ├── mcp/                # MCP connector management
│   │   │       ├── branding/           # Widget branding config
│   │   │       └── settings/           # Nested settings: ai, audit, billing, general, integrations, knowledge, widget
│   │   ├── components/
│   │   │   ├── Sidebar.tsx             # Navigation sidebar (220px fixed)
│   │   │   ├── MetricCard.tsx          # Reusable metric display card
│   │   │   └── charts/                 # Recharts wrapper components
│   │   ├── lib/
│   │   │   └── api.ts                  # Full typed API client (apiFetch wrapper + all api.* namespaces)
│   │   ├── store/
│   │   │   └── auth.ts                 # Zustand auth store (token, user, org)
│   │   ├── e2e/                        # Playwright E2E tests
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── widget/                         # Embeddable browser widget (IIFE bundle)
│   │   ├── src/
│   │   │   ├── index.ts                # Entry: window.Ahaget() public API, inspector mode detection
│   │   │   ├── widget.ts               # AhagetWidget class — side-panel orchestrator
│   │   │   ├── copilot.ts              # CopilotManager — session lifecycle, streaming
│   │   │   ├── api.ts                  # Fetch helpers: trackEvent, evaluateTriggers, proactive
│   │   │   ├── ui.ts                   # DOM builder functions for side panel, messages, steps
│   │   │   ├── styles.ts               # CSS injection utilities
│   │   │   ├── config.ts               # WidgetConfig type + DEFAULT_CONFIG + script-tag attr reader
│   │   │   ├── detector.ts             # DropOffDetector (idle + exit-intent detection)
│   │   │   ├── scanner.ts              # DOM element scanner (live page element list for agent)
│   │   │   ├── inspector.ts            # Inspector mode: interactive element selector
│   │   │   ├── resolver.ts             # Selector self-healing (7 fallback strategies)
│   │   │   ├── recapture.ts            # Selector re-verification after actions
│   │   │   ├── highlighter.ts          # DOM highlight modes (spotlight, beacon, arrow, multi)
│   │   │   ├── formFiller.ts           # Automated form fill execution
│   │   │   ├── cursor.ts               # Animated cursor for visual navigation guidance
│   │   │   └── checklist.ts            # Onboarding checklist UI component
│   │   ├── vite.config.ts              # Production IIFE build → dist/widget/
│   │   ├── vite.dev.config.ts          # Dev server config
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── landing/                        # Next.js 14 marketing site (port 3001)
│       ├── app/                        # Pages: docs, legal/privacy, legal/terms
│       ├── components/                 # Marketing components
│       ├── public/                     # Static assets
│       └── package.json
│
├── packages/
│   └── shared/                         # Shared package (src/ exists but empty — not yet used)
│
├── tests/
│   └── load/                           # k6 load tests
│       ├── k6.js                       # HTTP load test
│       └── k6-websocket.js             # WebSocket load test
│
├── dist/
│   └── widget/                         # Built widget IIFE output (gitignored typically)
│
├── ahaget-website/                     # Older/alternate website (Next.js, not in workspaces)
│
├── .planning/
│   └── codebase/                       # Codebase map documents (this directory)
│
├── docs/                               # Internal planning docs
├── package.json                        # Root workspaces config
└── package-lock.json
```

## Directory Purposes

**`apps/backend/src/routes/`:**
- Purpose: HTTP route handlers — thin layer, delegates to services or Prisma directly
- Contains: One `.ts` file per domain (e.g., `session.ts`, `flow.ts`, `analytics.ts`)
- Auth applied at router level (top of file or per-route middleware)
- Key files: `apps/backend/src/routes/session.ts` (AI agent entry), `apps/backend/src/routes/billing.ts` (Stripe), `apps/backend/src/routes/analytics.ts` (choke-points, overview)

**`apps/backend/src/services/`:**
- Purpose: Core business logic; AI agent, knowledge search, outreach, MCP
- Key files: `apps/backend/src/services/agent.ts` (GPT-4o tool loop), `apps/backend/src/services/knowledge.ts` (BM25+vector search), `apps/backend/src/services/mcp.ts` (MCP client), `apps/backend/src/services/sarvam.ts` (multilingual)

**`apps/backend/src/lib/`:**
- Purpose: Singletons and utilities used across routes and services
- Key files: `apps/backend/src/lib/prisma.ts` (Prisma singleton), `apps/backend/src/lib/plans.ts` (plan definitions + gates), `apps/backend/src/lib/email.ts` (Resend), `apps/backend/src/lib/stripe.ts` (Stripe client), `apps/backend/src/lib/ipGuard.ts` (SSRF protection), `apps/backend/src/lib/logger.ts` (structured logger)

**`apps/backend/src/middleware/`:**
- Purpose: Express middleware chain components
- Key files: `apps/backend/src/middleware/auth.ts`, `apps/backend/src/middleware/planGate.ts`, `apps/backend/src/middleware/rateLimit.ts`, `apps/backend/src/middleware/errorHandler.ts`

**`apps/dashboard/lib/api.ts`:**
- Purpose: Single file containing ALL dashboard API calls — typed, organized into namespaces (`api.auth`, `api.flow`, `api.sessions`, `api.analytics`, etc.)
- This is the only file the dashboard uses to call the backend

**`apps/dashboard/store/`:**
- Purpose: Zustand state stores
- Currently only `auth.ts` — all other page state is local `useState`

**`apps/widget/src/`:**
- Purpose: All widget source — no subdirectories, flat structure, ~16 files
- Each file is a focused module (scanner, resolver, highlighter, etc.)

## Key File Locations

**Entry Points:**
- `apps/backend/src/index.ts` - Backend server boot, all route mounting, cron jobs
- `apps/dashboard/app/layout.tsx` - Dashboard root HTML
- `apps/dashboard/app/(app)/layout.tsx` - Auth guard + sidebar shell for protected pages
- `apps/widget/src/index.ts` - Widget public API (`window.Ahaget`)

**Configuration:**
- `apps/backend/prisma/schema.prisma` - Database schema (26 models)
- `apps/backend/src/lib/plans.ts` - Plan definitions and feature gates
- `apps/backend/src/lib/prisma.ts` - Prisma client singleton
- `apps/backend/src/lib/stripe.ts` - Stripe client
- `apps/widget/src/config.ts` - Widget defaults and script-tag config reader

**Core Logic:**
- `apps/backend/src/services/agent.ts` - AI agent tool-calling loop
- `apps/backend/src/services/knowledge.ts` - Hybrid BM25 + vector KB search
- `apps/backend/src/lib/websocket.ts` - WebSocket server (dual-mode: widget + dashboard)
- `apps/backend/src/middleware/auth.ts` - Auth middleware (both schemes)
- `apps/backend/src/middleware/planGate.ts` - Feature gating by plan tier
- `apps/dashboard/lib/api.ts` - Complete typed API client for dashboard

**Testing:**
- `apps/backend/src/__tests__/` - Jest integration tests (supertest, real DB)
- `apps/backend/src/__tests__/testApp.ts` - Test Express app factory
- `apps/backend/src/__tests__/helpers.ts` - `createTestOrg`, `createTestUser`, `cleanupOrg`
- `apps/dashboard/e2e/` - Playwright E2E tests (3 spec files)
- `tests/load/` - k6 load test scripts

## Naming Conventions

**Files:**
- Backend routes: `camelCase.ts` matching the domain (e.g., `interfaceMap.ts`, `proactive.ts`)
- Backend services/lib: `camelCase.ts` matching the service name
- Dashboard pages: `page.tsx` (Next.js App Router convention), `layout.tsx`
- Widget modules: `camelCase.ts` matching the concern (e.g., `formFiller.ts`, `highlighter.ts`)
- Tests: `<subject>.test.ts` (Jest), `<subject>.spec.ts` (Playwright)

**Directories:**
- Dashboard routes: kebab-case (e.g., `in-page-assistant`, `choke-points`)
- Backend: no nesting — flat `routes/`, `services/`, `lib/`, `middleware/`

## Where to Add New Code

**New Backend Route:**
- Add route file: `apps/backend/src/routes/<domain>.ts`
- Register in: `apps/backend/src/index.ts` — add import + `app.use('/api/v1/<path>', <name>Routes)`
- Add auth middleware at top of router: `router.use(authenticateJWT)` or `router.use(authenticateApiKey)`
- Add plan gate if feature-gated: `router.use(requireFeature('featureKey'))` or per-route

**New Backend Service:**
- Add: `apps/backend/src/services/<name>.ts`
- Import and call from route(s) that need it

**New Dashboard Page:**
- Add: `apps/dashboard/app/(app)/<route-name>/page.tsx` (protected, requires auth)
- Add navigation link in: `apps/dashboard/components/Sidebar.tsx`
- Add API methods in: `apps/dashboard/lib/api.ts` in the appropriate namespace

**New API Client Method (Dashboard):**
- Add to: `apps/dashboard/lib/api.ts` inside the relevant `api.<namespace>` object
- Follow the `apiFetch<ReturnType>(path, opts)` pattern

**New Widget Module:**
- Add: `apps/widget/src/<module>.ts`
- Import into: `apps/widget/src/widget.ts` or `apps/widget/src/copilot.ts` as needed

**New DB Model:**
- Edit: `apps/backend/prisma/schema.prisma`
- Run: `npm run db:migrate --workspace=apps/backend`
- Add `organizationId` FK + `@@index([organizationId])` for every tenant-scoped model

**New Plan Feature Gate:**
- Add key to `PlanFeatures` interface in `apps/backend/src/lib/plans.ts`
- Set the boolean for each plan tier in the `*_GATES` constants
- Use `requireFeature('newKey')` middleware in the route

**New Background Job:**
- Add job function in `apps/backend/src/jobs/<name>.ts`
- Schedule with `setTimeout`/`setInterval` in `apps/backend/src/index.ts` (see existing pattern)

## Special Directories

**`apps/backend/prisma/migrations/`:**
- Purpose: Prisma auto-generated migration SQL files
- Generated: Yes (by `prisma migrate dev`)
- Committed: Yes (required for production deployment)

**`dist/widget/`:**
- Purpose: Production IIFE build of the widget
- Generated: Yes (by `npm run build --workspace=apps/widget`)
- Committed: Typically no (build artifact)

**`.planning/codebase/`:**
- Purpose: Codebase map documents consumed by GSD planning commands
- Generated: Yes (by `/gsd-map-codebase`)
- Committed: Yes

**`apps/backend/src/__tests__/`:**
- Purpose: Integration tests that hit a real test database
- Note: `jest.config.ts` excludes `apps/backend/src/index.ts` from coverage (not unit-testable)

---

*Structure analysis: 2026-05-13*
