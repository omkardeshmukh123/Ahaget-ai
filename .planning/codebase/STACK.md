# Technology Stack

**Analysis Date:** 2026-05-13

## Languages

**Primary:**
- TypeScript 5.3 - All apps (backend, dashboard, widget, landing)

**Secondary:**
- JavaScript - k6 load tests (`tests/load/k6.js`, `tests/load/k6-websocket.js`)

## Runtime

**Environment:**
- Node.js 20.x (inferred from `@types/node: ^20.11.0` in all packages)

**Package Manager:**
- npm workspaces (root `package.json` with `"workspaces": ["apps/*", "packages/*"]`)
- Lockfile: `package-lock.json` present at root

## Frameworks

**Core:**
- Express 4.18 (`apps/backend`) - REST API server + WebSocket (ws 8.16)
- Next.js 14.1 (`apps/dashboard`) - Dashboard SPA (App Router, client-only rendering pattern)
- Next.js 14.1 (`apps/landing`) - Marketing/landing site
- Vite 5.1 (`apps/widget`) - Browser widget bundled as IIFE via `vite-plugin-css-injected-by-js`

**Testing:**
- Jest 29 + ts-jest 29 - Backend unit/integration tests (`apps/backend`)
- Playwright 1.42 - Dashboard E2E tests (`apps/dashboard/e2e/`)

**Build/Dev:**
- ts-node-dev 2.0 - Backend hot-reload in dev
- concurrently 8.2 - Root-level `npm run dev` boots all three apps in parallel

## Key Dependencies

**Critical:**
- `@anthropic-ai/sdk ^0.39.0` - Anthropic Claude SDK (imported but `openai` is primary at runtime; Anthropic SDK present for potential dual-model usage)
- `openai ^4.47.0` - OpenAI GPT-4o as primary AI engine; `gpt-4o` for agent calls, `text-embedding-3-small` for KB embeddings
- `@prisma/client ^5.10.0` + `prisma ^5.10.0` - PostgreSQL ORM; schema at `apps/backend/prisma/schema.prisma`
- `stripe ^14.21.0` - Billing; Stripe API version `2023-10-16`
- `resend ^3.2.0` - Transactional email (magic links, escalation notifications, proactive outreach)
- `ws ^8.16.0` - WebSocket server attached to Express HTTP server at `/ws`

**Infrastructure:**
- `@upstash/redis ^1.28.0` - Redis client (configured but rate limiting currently falls back to in-memory `Map`; see `apps/backend/src/middleware/rateLimit.ts`)
- `zod ^3.22.4` - Runtime validation (backend routes + dashboard forms via `@hookform/resolvers`)
- `bcryptjs ^2.4.3` - Password hashing (low rounds in test env for speed)
- `jsonwebtoken ^9.0.2` - Dashboard JWT auth (7-day expiry)
- `helmet ^7.1.0` - HTTP security headers
- `morgan ^1.10.0` - HTTP request logging (`combined` in production, `dev` otherwise)
- `node-cron ^3.0.3` - Imported but cron scheduling is done with `setInterval`/`setTimeout` in `apps/backend/src/index.ts`
- `multer ^2.1.1` - File upload for KB article ingest (in-memory, 5 MB limit)
- `cheerio ^1.2.0` - HTML parsing for URL crawl (`apps/backend/src/services/crawl.ts`)
- `node-html-markdown ^2.0.0` - HTML-to-markdown conversion during KB crawl

**Frontend:**
- `recharts ^2.12.0` - Charts on dashboard (used in `apps/dashboard/app/(app)/dashboard/page.tsx`)
- `zustand ^4.5.2` - Client-side state management (`apps/dashboard/store/auth.ts`)
- `react-hook-form ^7.50.1` + `@hookform/resolvers ^3.3.4` - Form handling in dashboard
- Tailwind CSS 3.4 - Styling for dashboard and landing

## Configuration

**Environment:**
- `DATABASE_URL` - Required; PostgreSQL connection string
- `JWT_SECRET` - Required; signs dashboard auth tokens
- `OPENAI_API_KEY` - Optional (disables AI features if absent); uses `openai` client
- `STRIPE_SECRET_KEY` - Required for billing; warns on startup if missing
- `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_SCALE` - Stripe price IDs for paid plans
- `RESEND_API_KEY` - Optional; email silently skipped if absent
- `SARVAM_API_KEY` - Optional; enables Indian language translation/TTS layer
- `ADMIN_SECRET` - Optional; admin routes return 503 if absent
- `FRONTEND_URL` - CORS allow-list origin and upgrade URL construction
- `PORT` - Defaults to 4000
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - Optional; Redis for rate limiting

**Build:**
- `apps/backend/tsconfig.json` - target ES2020, commonjs modules, outDir `./dist`, paths alias `@/*`
- `apps/dashboard/tsconfig.json` - target ES2017, esnext modules, Next.js plugin, paths alias `@/*`
- `apps/widget/tsconfig.json` - target ES2017, ESNext modules, DOM lib
- `apps/widget/vite.config.ts` - IIFE format, single bundle, outputs to `../../dist/widget/`

## Platform Requirements

**Development:**
- Node.js 20+
- PostgreSQL (local or remote; `DATABASE_URL` required)
- npm 9+ (workspaces support)

**Production:**
- Deployment target: Railway (health check at `/health` mentions Render in comment; `morgan` uses `combined` log format for Railway log ingestion)
- Widget output: static IIFE at `dist/widget/widget.iife.js` served from CDN or static hosting
- Dashboard: standard Next.js deployment (Vercel or any Node host)

---

*Stack analysis: 2026-05-13*
