# External Integrations

**Analysis Date:** 2026-05-13

## APIs & External Services

**AI / LLM:**
- OpenAI - Primary AI engine for all agent interactions and embeddings
  - SDK/Client: `openai ^4.47.0` (`apps/backend/src/services/agent.ts`, `apps/backend/src/services/knowledge.ts`)
  - Models used: `gpt-4o` (agent tool calls), `text-embedding-3-small` (KB embeddings)
  - Auth: `OPENAI_API_KEY` env var
  - Lazy-initialized singleton: `let _openai: OpenAI | null = null; const openai = () => { ... }`

- Anthropic - SDK present but not actively called in reviewed code paths
  - SDK/Client: `@anthropic-ai/sdk ^0.39.0`
  - Auth: would use `ANTHROPIC_API_KEY`

- Sarvam AI - Indian language translation, language detection, STT/TTS
  - Client: direct `fetch` calls to `https://api.sarvam.ai` (`apps/backend/src/services/sarvam.ts`)
  - Auth: `SARVAM_API_KEY` env var (header: `api-subscription-key`)
  - Languages: en-IN, hi-IN (Hindi/Hinglish), bn-IN, ta-IN, te-IN, mr-IN, gu-IN, kn-IN, ml-IN, pa-IN
  - Feature flag: `isSarvamEnabled()` checks `!!SARVAM_KEY`

**Payments:**
- Stripe - Billing and subscription management
  - SDK/Client: `stripe ^14.21.0` (`apps/backend/src/lib/stripe.ts`)
  - API version: `2023-10-16`
  - Auth: `STRIPE_SECRET_KEY`
  - Webhook endpoint: `POST /api/v1/billing/webhook` (raw body required, registered before `express.json()`)
  - Price IDs: `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_SCALE`
  - Plans defined in: `apps/backend/src/lib/plans.ts`

**Email:**
- Resend - Transactional email delivery
  - SDK/Client: `resend ^3.2.0` (`apps/backend/src/lib/email.ts`)
  - Auth: `RESEND_API_KEY`
  - From address: `Ahaget <hello@ahaget.ai>`
  - Graceful degradation: if `RESEND_API_KEY` not set, logs magic link to console and skips send
  - Used for: magic-link sign-in, escalation alerts to support team, proactive outreach emails

## Data Storage

**Databases:**
- PostgreSQL - Primary database
  - Connection: `DATABASE_URL` env var
  - Client: Prisma 5.10 (`apps/backend/src/lib/prisma.ts`)
  - Schema: `apps/backend/prisma/schema.prisma` (26 models, 50+ migrations)
  - Embeddings stored as `Json` column (float[] from `text-embedding-3-small`) in `KnowledgeBaseArticle`

**File Storage:**
- Local memory only (multer `memoryStorage`) — uploaded KB files processed immediately and discarded. No persistent file storage (no S3/GCS).

**Caching:**
- Upstash Redis (`@upstash/redis ^1.28.0`) - Configured but rate limiting currently uses in-memory `Map` fallback
  - Auth: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - See comment in `apps/backend/src/middleware/rateLimit.ts`: "swap the Map for Redis INCR + EXPIREAT"
- In-process caches:
  - MCP tool list: 5-minute TTL per connector (`apps/backend/src/services/mcp.ts`)
  - MCP connector list: 60-second TTL (`apps/backend/src/services/mcp.ts`)
  - Analytics choke-point results: 60-second TTL (`apps/backend/src/routes/analytics.ts`)

## Authentication & Identity

**Auth Provider:**
- Custom (no third-party auth provider)
  - Dashboard users: email/password + JWT (`apps/backend/src/lib/jwt.ts` — 7-day tokens)
  - Magic link: email token via Resend → `GET /api/v1/auth/magic-link/verify`
  - Widget clients: `org_<64-hex>` API key via `X-API-Key` header
  - Token stored: `localStorage` key `oai_token` (dashboard)

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Datadog, Rollbar integrations)

**Logs:**
- Structured JSON logger (`apps/backend/src/lib/logger.ts`) writing to stdout
- Format: `{ ts, level, event, ...fields }` — Railway captures stdout for log search
- Morgan HTTP request logging (`combined` in production)

## CI/CD & Deployment

**Hosting:**
- Railway (primary) — health check endpoint `GET /health` comments reference Railway
- Widget output (`dist/widget/`) intended for CDN hosting

**CI Pipeline:**
- Not detected (no `.github/workflows/` or `.circleci/` found)

## Webhooks & Callbacks

**Incoming:**
- `POST /api/v1/billing/webhook` - Stripe subscription events (payment success, cancellation, plan change)
  - Must be registered before `express.json()` middleware (uses `express.raw`)
  - Handles: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

**Outgoing (org-configurable):**
- Slack webhook: `FollowUpConfig.slackWebhookUrl` — escalation notifications to org's Slack channel
- Custom webhook: `PlaybookConfig.escalationWebhook` — fires on AI escalation events
- `IntegrationConfig` table supports: Segment, Mixpanel, HubSpot, generic webhook (outbound event forwarding)
- `Organization.selectorAlertWebhook` — fires when broken CSS selectors are detected

## MCP (Model Context Protocol) Connectors

- Per-org external tool servers (`McpConnector` table)
- JSON-RPC 2.0 over HTTP (stateless, no SSE)
- Auth types: `none | bearer | api_key`
- Permission scoping: `allowedTools[]`, `readOnly` flag
- Tool list cached 5 minutes; connector list cached 60 seconds
- SSRF protection: `apps/backend/src/lib/ipGuard.ts` blocks private/loopback IPs for all outbound fetch calls

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - Dashboard token signing

**Important optional env vars:**
- `OPENAI_API_KEY` - AI agent features
- `STRIPE_SECRET_KEY` - Billing
- `RESEND_API_KEY` - Email
- `SARVAM_API_KEY` - Multilingual support
- `ADMIN_SECRET` - Admin route access
- `FRONTEND_URL` - CORS + redirect URLs (defaults to `https://app.ahaget.ai`)
- `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_SCALE` - Plan price IDs (fatal in production if absent for paid plans)

**Secrets location:**
- `.env` file(s) — not committed

---

*Integration audit: 2026-05-13*
