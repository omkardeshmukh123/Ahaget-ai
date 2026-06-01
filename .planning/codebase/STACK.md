# Technology Stack

**Analysis Date:** 2026-06-01

## Languages

**Primary:**
- TypeScript 5.3 — all apps (backend, dashboard, widget, landing)

**Secondary:**
- JavaScript — k6 load test scripts (`tests/load/k6.js`, `tests/load/k6-websocket.js`)

## Runtime

**Environment:**
- Node.js 20 (pinned in CI via `actions/setup-node@v4`; no `.nvmrc` present)

**Package Manager:**
- npm workspaces — root `package.json` defines workspaces `apps/*` and `packages/*`
- Lockfile: `package-lock.json` at repo root

## Applications in Monorepo

| App | Framework | Port | Purpose |
|-----|-----------|------|---------|
| `apps/backend` | Express 4.18 | 4000 | REST API + WebSocket server |
| `apps/dashboard` | Next.js 14.1 | 3000 | Admin SPA (App Router) |
| `apps/landing` | Next.js 14.1 | 3001 | Marketing site (static export) |
| `apps/widget` | Vite 5.1 | — | Embeddable JS bundle for customer apps |
| `packages/shared` | — | — | Shared types (currently empty) |

## Frameworks

**Backend:**
- Express 4.18 — HTTP server
- `express-async-errors` — async error propagation without try/catch wrappers
- `ts-node-dev 2.0` — dev server with hot reload
- `tsc` — production build (outputs to `apps/backend/dist/`)

**Dashboard / Landing:**
- Next.js 14.1 (App Router, React 18.2)
- Tailwind CSS 3.4 — utility-first styling
- No UI component library; all components use inline styles / raw HTML

**Widget:**
- Vite 5.1 — bundler
- `vite-plugin-css-injected-by-js` — CSS injected at runtime, no separate stylesheet
- Output: single IIFE bundle (`dist/widget.js`), served from CDN at `cdn.ahaget.ai`

## ORM / Database

- Prisma 5.10 — ORM, migrations, and schema
- Provider: PostgreSQL (version 15 used in CI)
- pgvector extension for KB embeddings (`embedding_vec` column with HNSW index)
- Client generated via `npx prisma generate`

## Key Dependencies

**Critical — AI / LLM:**
- `openai@4.47` — used via OpenRouter (`baseURL: https://openrouter.ai/api/v1`) for chat completions AND directly against `api.openai.com` for embeddings
- `@anthropic-ai/sdk@0.39` — declared in `package.json` but NOT actively used for inference (legacy; OpenRouter handles all LLM calls)

**Critical — Infrastructure:**
- `@prisma/client@5.10` — database access
- `bullmq@5.77` — async job queue (requires `REDIS_URL`; falls back to setTimeout crons)
- `ws@8.16` — WebSocket server at `/ws` (widget auth + dashboard live updates)
- `zod@3.22` — runtime input validation (backend controllers + dashboard forms)

**Payments & Comms:**
- `stripe@14.21` — billing subscriptions + webhook handler
- `resend@3.2` — transactional email (magic links, welcome, proactive, flow alerts)
- `@sentry/node@8.55` — error tracking and performance monitoring

**Security & HTTP:**
- `helmet@7.1` — HTTP security headers
- `morgan@1.10` — HTTP request logging
- `cors@2.8` — CORS handling
- `bcryptjs@2.4` — password hashing
- `jsonwebtoken@9.0` — JWT for dashboard users
- `uuid@9.0` — UUID generation

**Caching / Rate Limiting:**
- `@upstash/redis@1.28` — serverless Redis HTTP client (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`)

**File / Web Processing:**
- `multer@2.1` — file upload for KB article ingest
- `cheerio@1.2` — HTML parsing for KB URL crawl
- `node-html-markdown@2.0` — HTML → Markdown conversion

**Multilingual:**
- Sarvam AI (`SARVAM_API_KEY`) — Indian language translation, STT, TTS (REST calls to `https://api.sarvam.ai`)

**Dashboard Only:**
- `zustand@4.5` — global auth state store
- `react-hook-form@7.50` + `@hookform/resolvers@3.3` — form handling with Zod validation
- `recharts@2.12` — analytics line/bar charts

## AI Model Routing

All LLM inference goes through **OpenRouter** at `https://openrouter.ai/api/v1`, authenticated with `OPENROUTER_API_KEY`. The OpenAI SDK is used as the client.

Model selection logic in `apps/backend/src/services/agent/routing.ts`:
- `openai/gpt-4o-mini` — default; verify turns, init with pre-configured action, low-confidence KB
- `openai/gpt-4o` — when KB hit score ≥ 0.6

Embeddings bypass OpenRouter and hit **OpenAI directly** (`text-embedding-3-small`, `OPENAI_API_KEY`).

## Testing Frameworks

**Backend unit / integration:**
- Jest 29.7 + ts-jest 29.1, config at `apps/backend/jest.config.js` (not present — inferred from devDeps)
- supertest 6.3 for HTTP integration tests
- Test files: `apps/backend/src/__tests__/` (11 test files + helpers)

**Dashboard E2E:**
- Playwright 1.42, config at `apps/dashboard/playwright.config.ts`
- Spec files: `apps/dashboard/e2e/` (3 specs)

**AI Eval harness:**
- Custom TypeScript runner at `apps/backend/tests/evals/` (`runner.ts`, `report.ts`, `index.ts`)
- Run via `npm run eval` in backend workspace

**Load tests:**
- k6: `tests/load/k6.js` (HTTP) and `tests/load/k6-websocket.js` (WebSocket)

## Configuration

**Required env vars (validated at startup — missing → `process.exit(1)`):**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — dashboard JWT signing key

**Key optional env vars:**
- `OPENROUTER_API_KEY` — LLM inference (all chat completions)
- `OPENAI_API_KEY` — embeddings only
- `SENTRY_DSN` — error tracking
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — billing
- `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_SCALE` — Stripe price IDs
- `RESEND_API_KEY` — email
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — Redis for rate limiting
- `REDIS_URL` — BullMQ queue connection (falls back to setTimeout crons if absent)
- `SARVAM_API_KEY` — multilingual translation/STT/TTS
- `ADMIN_SECRET` — admin-only routes
- `CRON_ENABLED=false` — disable crons on replica instances
- `FRONTEND_URL` — CORS allowlist + email deep links

**Dashboard frontend:**
- `NEXT_PUBLIC_API_URL` — backend URL (defaults to `http://localhost:4000`)

## CI/CD

- GitHub Actions: `.github/workflows/ci.yml`
- Three parallel jobs: `backend` (type-check + unit tests with Postgres), `dashboard` (type-check + lint), `landing` (build)
- Triggers: push to `main`/`master`/`develop`, PRs to `main`/`master`
- Deployment: Railway (backend), Vercel (dashboard/landing) — not yet executed as of v1.0.0

---

*Stack analysis: 2026-06-01*
