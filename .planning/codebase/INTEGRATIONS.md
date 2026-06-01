# External Integrations

**Analysis Date:** 2026-06-01

## AI / LLM Services

**OpenRouter (primary LLM):**
- Purpose: All chat completions used by the agent (onboarding, goal mode, plan mode, verify turns)
- Client: `openai` SDK with custom `baseURL: https://openrouter.ai/api/v1`
- Auth env var: `OPENROUTER_API_KEY`
- Models routed: `openai/gpt-4o-mini` (default), `openai/gpt-4o` (high-confidence KB)
- Singleton: `apps/backend/src/services/agent/_openai.ts`

**OpenAI (embeddings only):**
- Purpose: Generate `text-embedding-3-small` vectors for KB articles and queries
- Client: `openai` SDK pointed at `api.openai.com`
- Auth env var: `OPENAI_API_KEY`
- Used in: `apps/backend/src/services/knowledge.ts`

**Sarvam AI (multilingual):**
- Purpose: Indian language translation (Hindi, Hinglish, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi), STT, TTS
- Transport: Direct REST to `https://api.sarvam.ai`
- Auth env var: `SARVAM_API_KEY` (feature disabled when absent)
- Used in: `apps/backend/src/services/sarvam.ts`

## Data Storage

**Database:**
- PostgreSQL (provider: Prisma)
- Connection env var: `DATABASE_URL`
- ORM/client: Prisma 5.10 (`@prisma/client`)
- Extensions: `pgvector` for `embedding_vec` HNSW index on `knowledge_base_articles`
- Migrations: `apps/backend/prisma/migrations/` (40+ migration directories)

**Redis (dual purpose):**
- Rate limiting: Upstash Redis HTTP API (`@upstash/redis`)
  - Env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - Falls back to in-memory `Map` when absent (single-process only)
- Job queue: ioredis-compatible Redis for BullMQ (`bullmq`)
  - Env var: `REDIS_URL`
  - Falls back to `setTimeout`-based crons when absent
  - Client: `apps/backend/src/queues/connection.ts`

**File Storage:**
- None — KB file uploads are processed in-memory (multer) and stored as plain text in PostgreSQL

## Payments

**Stripe:**
- Purpose: Subscription billing (Free/Starter/Growth/Scale plans), customer portal, upgrade flows
- SDK: `stripe@14.21`
- Auth env var: `STRIPE_SECRET_KEY`
- Webhook: `POST /api/v1/billing/webhook` (raw body, `STRIPE_WEBHOOK_SECRET` for verification)
- Price ID env vars: `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_SCALE`
- Client singleton: `apps/backend/src/utils/stripe.ts`
- Controller: `apps/backend/src/controllers/billing.ts`

## Email

**Resend:**
- Purpose: Transactional email — magic links, welcome emails with API key + snippet, flow zero-completion alerts, proactive re-engagement emails
- SDK: `resend@3.2`
- Auth env var: `RESEND_API_KEY` (emails skipped when absent, dev logs the link to console)
- From address: `Ahaget <hello@ahaget.ai>`
- Email templates: `apps/backend/src/utils/email.ts` (inline HTML)

## Error Tracking & Observability

**Sentry:**
- Purpose: Server-side exception capture with `requestId` tagging
- SDK: `@sentry/node@8.55`
- Auth env var: `SENTRY_DSN` (disabled when absent)
- Sample rate: 10% for traces
- Init: `apps/backend/src/utils/sentry.ts`

**Logging:**
- Custom `logger` utility: `apps/backend/src/utils/logger.ts`
- HTTP request logs: morgan (dev: `dev` format, production: `combined`)

## MCP — Model Context Protocol

**Outbound MCP connectors:**
- Purpose: Agent calls external tools (databases, APIs, internal services) during onboarding flows using JSON-RPC 2.0 over HTTP
- Configured per-org in `McpConnector` table
- Tool list cached in-memory per connector (5-minute TTL)
- Connector list cached per-org (60s TTL)
- Async path: BullMQ `McpPendingJob` table stores context while worker executes
- Client: `apps/backend/src/services/mcp.ts`

**REST API connector:**
- Purpose: Direct HTTP calls from agent (`call_api` tool) to org-defined REST endpoints
- Pre-approved via `RestApiEndpoint` table
- IP/URL guard: `apps/backend/src/utils/ipGuard.ts` (blocks private/internal ranges)
- 10-second timeout on all `call_api` calls

**Context Sources:**
- Purpose: Pre-session data (account status, feature flags, usage) fetched at session start and injected into agent system prompt as LIVE CONTEXT
- Sources can be MCP tool calls or REST GET requests
- Fetched in parallel with 2-second hard timeout per source
- Service: `apps/backend/src/services/contextSources.ts`

## Customer-Configured Outbound Integrations

Stored in `IntegrationConfig` table (per-org). Types:
- **Segment** — event tracking
- **Mixpanel** — event tracking
- **HubSpot** — contact sync
- **Webhook** — generic HTTP webhook

**Escalation webhooks:**
- Slack webhook URL (per-org in `PlaybookConfig.escalationWebhook`)
- Controller: `apps/backend/src/services/escalation.ts`

**Selector alert webhooks:**
- Per-org in `Organization.selectorAlertWebhook`

## Authentication

**Dashboard users:**
- JWT (`jsonwebtoken@9.0`), signed with `JWT_SECRET`, stored in `localStorage` as `oai_token`
- Magic link flow: token generated server-side, emailed via Resend, verified at `GET /api/v1/auth/magic-link/verify`
- Password: bcrypt hashed (`bcryptjs@2.4`)
- JWT utility: `apps/backend/src/utils/jwt.ts`
- Middleware: `apps/backend/src/middleware/auth.ts` (`authenticateJWT`)

**Widget / end-user:**
- API key authentication via `X-API-Key` header
- Key stored in `Organization.apiKey` (UUID)
- Middleware: `apps/backend/src/middleware/auth.ts` (`authenticateApiKey`)

## WebSockets

- Server: `ws@8.16`, attached to HTTP server at path `/ws`
- Widget mode: authenticated via API key (`{ type: 'auth', apiKey }`)
- Dashboard mode: authenticated via JWT (`{ type: 'subscribe', conversationId, token }`)
- Server: `apps/backend/src/utils/websocket.ts`
- Broadcasts: `broadcastToOrgWidgets(orgId, payload)` for live widget updates

## CI/CD & Deployment

**GitHub Actions:**
- `.github/workflows/ci.yml` — backend tests (Postgres 15), dashboard type-check + lint, landing build
- Triggered on: push to main/master/develop; PRs to main/master

**Hosting (planned, as of 2026-06-01):**
- Backend: Railway
- Dashboard/Landing: Vercel

**Widget CDN:**
- Served from `https://cdn.ahaget.ai/widget.js` (referenced in welcome email snippet and docs)

## Environment Configuration Summary

All secrets are environment variables. No secrets files committed.
Key vars by category:

| Category | Vars |
|----------|------|
| Required | `DATABASE_URL`, `JWT_SECRET` |
| LLM | `OPENROUTER_API_KEY`, `OPENAI_API_KEY` |
| Payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` |
| Email | `RESEND_API_KEY` |
| Redis | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `REDIS_URL` |
| Monitoring | `SENTRY_DSN` |
| Multilingual | `SARVAM_API_KEY` |
| Infra | `ADMIN_SECRET`, `FRONTEND_URL`, `CRON_ENABLED`, `PORT` |

---

*Integration audit: 2026-06-01*
