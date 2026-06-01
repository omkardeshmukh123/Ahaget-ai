# INFRASTRUCTURE AUDIT — Ahaget
> Production readiness at scale. Last updated: 2026-06-01.

---

## Current Infrastructure State

| Component | Current State | Production Ready? |
|-----------|--------------|------------------|
| Backend | Express on Railway (not yet deployed) | NO — not deployed |
| Dashboard | Next.js on Vercel (not yet deployed) | NO — not deployed |
| Widget CDN | `cdn.ahaget.ai` (not yet deployed) | NO — CRITICAL |
| Database | PostgreSQL 15 (Railway managed) | Partial — no pooler |
| Redis (rate limit) | Upstash (optional) | Partial — falls back to memory |
| Redis (queues) | ioredis/BullMQ (optional) | Partial — falls back to setTimeout |
| File storage | None — in-memory multer | Risk — KB files lost on restart |
| Error tracking | Sentry (configured, optional) | OK when `SENTRY_DSN` set |
| Logging | Morgan + custom logger | Partial — no structured JSON logs to sink |
| Monitoring | None | Not started |

---

## Failure Point Analysis by Scale

### At 10 Customers (~5K sessions/month)
**What will break:**
- Widget CDN not deployed → product doesn't work for anyone
- setTimeout-based crons fire on every Railway instance restart → duplicate cron emails
- No `PGBOUNCER` → 10 connections per customer = 100 connections on 1 server instance

**What holds:**
- PostgreSQL easily handles this load
- Single Express instance sufficient

---

### At 100 Customers (~100K sessions/month)
**What will break:**
- In-memory `actRateLimit` Map: multiple Railway instances → bypass
- `events` table: 100 users × 20 events/day × 30 days × 100 customers = 6M rows/month. No partitioning.
- `audit_logs` table: unbounded growth, no retention policy
- `session_messages` table: no archival strategy
- BullMQ without dedicated Redis → setTimeout crons are inaccurate under load
- No DB connection pooler: Railway scales to 2 instances × 10 connections = 20 simultaneous, fine but watch it

**What holds:**
- Prisma handles queries well
- pgvector HNSW index handles KB search efficiently

---

### At 1,000 Customers (~1M sessions/month)
**What will break:**
- Events table: 600M rows/year → queries slow, disk expensive
- Audit log: similar growth, no partitioning
- Single Railway instance → need horizontal scaling with proper connection pooling (pgBouncer)
- OpenRouter rate limits → need per-org LLM rate limiting, queue-based inference
- Upstash Redis free tier (10K req/day) blown past immediately
- BullMQ memory: with 1M jobs/month, Redis memory becomes significant
- WebSocket: each widget connection held open → memory leak at scale
- `SELECT COUNT(*)` on messages for monthly limit check → expensive full table scan

**What holds:**
- pgvector HNSW index still fast at this scale
- BullMQ + proper Redis handles job volume
- PostgreSQL with proper indexes + partitioning handles this

---

### At 10,000 Customers (~10M sessions/month)
**What will break:**
- Need database read replicas for analytics queries
- `user_onboarding_sessions` table: 10M rows/month → need time-based partitioning
- Full table scan monthly message counts need materialized views
- Multi-region deployment required (current: single region)
- OpenRouter may not be enterprise-grade (uptime SLA?)
- Need SOC 2 compliance (currently no evidence of compliance)
- Railway may not provide the SLA guarantees enterprise customers need

**What holds:**
- Architecture is horizontally scalable in principle
- Prisma schema is migration-managed (clean upgrade path)

---

## Critical Infrastructure Tasks

---

### Task: Deploy CDN for widget.js
**Priority:** P0
**Problem:** `cdn.ahaget.ai/widget.js` is referenced in welcome emails and documentation but doesn't serve the file. Every customer who follows the install instructions gets a 404.
**Solution:**
1. Build widget: `cd apps/widget && npm run build`
2. Upload `dist/widget.js` to Cloudflare R2 or AWS S3
3. Configure CDN distribution at `cdn.ahaget.ai`
4. Set `Cache-Control: public, max-age=86400, s-maxage=31536000`
5. Add versioning: `cdn.ahaget.ai/widget@1.x.x/widget.js` + `cdn.ahaget.ai/widget@latest/widget.js`
**Files:** `apps/widget/`, deployment scripts
**Acceptance Criteria:**
- `curl https://cdn.ahaget.ai/widget.js` returns the widget bundle
- The script tag in the welcome email loads successfully
**Status:** [ ] Not Started

---

### Task: Execute Railway deployment
**Priority:** P0
**Problem:** Backend is not deployed. No production API URL exists.
**Solution:**
1. Create Railway project
2. Set all required env vars (`DATABASE_URL`, `JWT_SECRET`, etc.)
3. Set `CRON_ENABLED=false` on replica instances
4. Configure health check: `GET /health`
5. Set `NODE_ENV=production`
6. Run `npx prisma migrate deploy` on first deployment
**Files:** `apps/backend/`, `package.json`
**Acceptance Criteria:**
- `GET https://api.ahaget.ai/health` returns `{"status":"ok","db":"ok"}`
**Status:** [ ] Not Started

---

### Task: Add graceful shutdown handler
**Priority:** P0
**Problem:** Server doesn't handle `SIGTERM`. In-flight requests are dropped silently during Railway deployments.
**Solution:**
```typescript
// In apps/backend/src/index.ts
const shutdown = async (signal: string) => {
  console.log(`[server] ${signal} received — graceful shutdown`);
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Force exit after 30s if graceful shutdown hangs
  setTimeout(() => process.exit(1), 30_000);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
```
**Files:** `apps/backend/src/index.ts`
**Acceptance Criteria:**
- Deploying a new version doesn't drop active agent calls
**Status:** [ ] Not Started

---

### Task: Add database connection pooler
**Priority:** P1
**Problem:** Direct Prisma connections (10 default) will exhaust PostgreSQL limits when Railway scales to multiple instances.
**Solution:**
1. Enable `pgbouncer=true` in Railway's PostgreSQL add-on
2. Or deploy PgBouncer as a Railway service
3. Update `DATABASE_URL` to point to pgBouncer
4. Add `?pgbouncer=true&connection_limit=5` to Prisma connection string
**Acceptance Criteria:**
- 3 Railway instances + 5 connections each = 15 connections, within Railway's PostgreSQL limit
**Status:** [ ] Not Started

---

### Task: Add event table time-based partitioning
**Priority:** P2
**Problem:** `events` table will grow unboundedly. Analytics queries degrade.
**Solution:**
1. Add `PARTITION BY RANGE (created_at)` to events table
2. Create monthly partitions
3. Add automated partition creation job
4. Add data retention: drop partitions older than 12 months
**Acceptance Criteria:**
- Analytics queries stay under 100ms at 10M rows
**Status:** [ ] Not Started

---

### Task: Add structured logging to external sink
**Priority:** P1
**Problem:** Morgan logs to stdout only. No log search, no alerting, no retention.
**Solution:**
1. Use Railway's log drain → send to Datadog or Logtail
2. Ensure logger.ts outputs JSON format in production: `format: 'json'`
**Acceptance Criteria:**
- Can search logs by `orgId`, `requestId`, `sessionId` in dashboard
**Status:** [ ] Not Started

---

### Task: Add monitoring and alerting
**Priority:** P1
**Problem:** No uptime monitoring, no latency alerting, no error rate alerting.
**Solution:**
1. Uptime monitoring: BetterStack or UptimeRobot on `/health`
2. Error rate: Sentry alert when error rate > 1% over 5 minutes
3. Agent latency: alert when p95 latency > 10s
4. Stripe webhook: alert if webhook failures > 3 in 10 minutes
**Acceptance Criteria:**
- On-call receives alert within 5 minutes of an outage
**Status:** [ ] Not Started

---

### Task: Dedicated Redis for BullMQ
**Priority:** P1
**Problem:** When `REDIS_URL` is absent, jobs run in setTimeout loops. This is unreliable, doesn't survive restarts, and duplicates on multiple instances.
**Solution:**
1. Provision Redis on Railway (or use Upstash for BullMQ)
2. Set `REDIS_URL` in production
3. Set `CRON_ENABLED=false` on all instances except one (the cron leader)
**Acceptance Criteria:**
- Background jobs survive server restarts
- No duplicate cron emails
**Status:** [ ] Not Started

---

### Task: KB file storage to S3/R2
**Priority:** P2
**Problem:** Multer processes file uploads in memory. Files aren't persisted separately. If a customer uploads a large KB file, it consumes server memory.
**Solution:**
1. Add Cloudflare R2 or AWS S3 bucket for KB file storage
2. Process file content server-side but store raw file in object storage
3. Link `KnowledgeBaseArticle.sourceUrl` to the object storage URL
**Acceptance Criteria:**
- 10MB PDF upload doesn't spike memory
**Status:** [ ] Not Started

---

## Load Test Results (Planned)
k6 scripts exist at `tests/load/k6.js` and `tests/load/k6-websocket.js`. Run before launch:
```bash
k6 run tests/load/k6.js --vus 50 --duration 5m
```
Target: p95 < 2000ms at 50 concurrent users.
