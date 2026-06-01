# TECH DEBT REGISTER — Ahaget
> Known issues, shortcuts, and incomplete implementations. Last updated: 2026-06-01.

---

## Summary

The codebase is generally clean TypeScript with good patterns (Prisma, Zod validation, structured logging, `express-async-errors`). The debt is concentrated in 4 areas:

1. **Stub routes** — 6 route groups are entirely stubbed with empty responses
2. **In-memory state** — Rate limiters use process-memory Maps (multi-instance unsafe)
3. **Untracked migrations** — 2 migrations not committed
4. **Missing production patterns** — No graceful shutdown, no connection pooler, no health check for Redis

---

## Debt Inventory

### TD-01: Stub Routes Masquerading as Features
**Severity:** HIGH
**Files:** `apps/backend/src/controllers/stubs.ts`
**Routes affected:**
- `GET/PUT /api/v1/followup/config`
- `GET /api/v1/churn/at-risk`
- `GET /api/v1/churn/summary`
- `GET/PUT /api/v1/autooptimize/settings`
- `POST /api/v1/autooptimize/run` (501)
- `GET /api/v1/autooptimize/log`
- `GET /api/v1/benchmarks/overview`
- `GET /api/v1/benchmarks/steps`
- `GET /api/v1/optimize/flow`
- `POST /api/v1/optimize/suggest/:stepId` (501)
- `POST /api/v1/optimize/apply/:stepId` (501)
- `GET/POST /api/v1/experiments`
- `GET /api/v1/experiments/:id/results`
- `PUT /api/v1/experiments/:id`

**Impact:** Dashboard shows these pages as real features. Paying customers are disappointed.
**Fix:** Hide from sidebar OR implement, one route at a time.
**Priority:** P0 (hide) / P2 (implement)

---

### TD-02: In-Memory Rate Limiter
**Severity:** HIGH
**File:** `apps/backend/src/controllers/session.ts:935-960`

```typescript
const actRateLimit = new Map<string, { count: number; windowStart: number }>();
```

**Problem:** Not shared across Railway instances. Trivially bypassed.
**Fix:** Move to Upstash Redis (see SECURITY.md Task).
**Priority:** P0

---

### TD-03: Untracked Prisma Migrations
**Severity:** MEDIUM
**Files:**
- `apps/backend/prisma/migrations/20260601_add_mcp_pending_jobs/`
- `apps/backend/prisma/migrations/20260601_add_user_memories_eval_logs_branding/`

**Problem:** These migrations are untracked by git (listed in `??` section of git status). If they're not committed, `npx prisma migrate deploy` on Railway won't apply them and the new tables (`McpPendingJob`, `UserMemory`, `AgentEvalLog`, `BrandingConfig`) won't exist.
**Fix:** `git add apps/backend/prisma/migrations/ && git commit`
**Priority:** P0

---

### TD-04: Monthly Message Limit Double Counting
**Severity:** MEDIUM
**Files:** `apps/backend/src/controllers/session.ts:837-844` and `:982-989`

Both `/act` and `/act/stream` do their own DB count for the monthly message limit instead of using the `enforceMessageLimit` middleware. The middleware (Redis INCR) and the inline check (DB count) can diverge.

**Fix:** Remove inline DB counts. Apply `enforceMessageLimit` middleware to both routes.
**Priority:** P1

---

### TD-05: `setInterval` Crons Fire in All Instances
**Severity:** MEDIUM
**File:** `apps/backend/src/index.ts:158-256`

The `setTimeout`/`setInterval` fallback crons run when `REDIS_URL` is absent AND `CRON_ENABLED !== 'false'`. On Railway with 2 instances, both instances run the crons, causing:
- Duplicate flow alert emails
- Duplicate proactive messages
- Duplicate KB refreshes

**Fix:**
1. Deploy with Redis (`REDIS_URL`) to use BullMQ instead
2. OR set `CRON_ENABLED=false` on all but one instance
3. Better: move cron guard to elect a "leader" via Redis lock

**Priority:** P1

---

### TD-06: Zod Validation Inline in Controllers
**Severity:** LOW
**Files:** Most controller files

Zod schemas are defined inline in controller functions rather than in shared schema files. This makes them hard to:
- Reuse across controllers
- Test independently
- Export for documentation

**Fix:** Move to `apps/backend/src/schemas/` directory, one file per resource.
**Priority:** P2 (non-blocking for launch)

---

### TD-07: `packages/shared` Is Empty
**Severity:** LOW
**File:** `packages/shared/src/`

The shared package for cross-app TypeScript types is empty. Widget and backend duplicate `AgentAction` types (widget has its own version in `copilot.ts`). Schema drift between them will cause silent type errors.

**Fix:** Move shared types to `packages/shared/src/types.ts`. Import from both apps.
**Priority:** P2

---

### TD-08: No Input Sanitization on Long Text Fields
**Severity:** MEDIUM
**Affected fields:**
- `KnowledgeBaseArticle.content` — stored as plain text, no max length
- `SessionMessage.content` — stored, no server-side max length beyond userMessage 2000 char check
- `PlaybookConfig.mustAlwaysDo` array — no length validation per item

**Risk:** Large inputs could cause slow DB queries or excessive LLM token usage.
**Fix:** Add Zod `max()` constraints on all text fields. Add DB-level `@db.VarChar(50000)` for article content.
**Priority:** P1

---

### TD-09: `authenticateApiKey` Has No Caching
**Severity:** MEDIUM
**File:** `apps/backend/src/middleware/auth.ts:7-28`

Every widget request (message, start session, page change, etc.) does a full `prisma.organization.findUnique` to resolve the API key. At 1,000 concurrent sessions, that's 1,000 DB lookups per request cycle.

**Fix:** Cache API key → Organization mapping in Upstash Redis with 60-second TTL. Invalidate on API key rotation.
**Priority:** P2

---

### TD-10: `session.ts` Is 1,534 Lines
**Severity:** LOW
**File:** `apps/backend/src/controllers/session.ts`

The session controller is massive. It handles:
- Session start/get
- Message handling (`/act`, `/act/stream`, `/act/goal`, `/act/plan`)
- Selector healing
- Feedback
- Events
- Page changes
- Abandon
- MCP resume
- STT/TTS

**Fix:** Split into `sessionLifecycle.ts`, `sessionMessages.ts`, `sessionEvents.ts`, `sessionMultimodal.ts`.
**Priority:** P2

---

## Prioritized Debt Resolution

| # | Debt | Priority | Effort |
|---|------|----------|--------|
| TD-03 | Commit untracked migrations | P0 | 5 min |
| TD-02 | Move rate limiter to Redis | P0 | 2h |
| TD-01 | Hide stub routes from sidebar | P0 | 30 min |
| TD-04 | Unify monthly message limit check | P1 | 2h |
| TD-05 | Fix duplicate crons on multi-instance | P1 | 2h |
| TD-08 | Input sanitization on long text fields | P1 | 3h |
| TD-09 | Cache API key resolution | P2 | 3h |
| TD-07 | Populate shared package with types | P2 | 4h |
| TD-06 | Move Zod schemas to shared directory | P2 | 4h |
| TD-10 | Split session controller | P2 | 1 day |
