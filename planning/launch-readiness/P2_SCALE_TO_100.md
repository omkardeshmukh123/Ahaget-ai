# P2: SCALE TO 100 CUSTOMERS — Ahaget
> Architecture and product improvements for months 2–3. Target: 100 paying customers.
> Last updated: 2026-06-01.

---

## Goal

Scale from 10 to 100 paying customers:
- 100 customers × avg $200 ARPU = $20,000 MRR
- Infrastructure handles 100,000 sessions/month without degradation
- Product retention > 85% at 90-day mark
- 3+ enterprise pilots started

---

## Product Improvements

---

### Task: Build actual A/B experiment UI
**Priority:** P2
**Problem:** A/B experiment data model exists. Schema supports it. But API is fully stubbed (`/experiments` returns empty list).
**Solution:**
1. Implement `GET/POST /api/v1/experiments` in controllers
2. Experiment creation: pick control flow + variant flow + traffic split
3. Results page: completion rate for each variant, statistical significance
4. "Declare winner" button that pauses losing variant
5. Remove from `stubs.ts`, implement fully in `experiments.ts`

**Files:**
- `apps/backend/src/controllers/experiments.ts` (new, replaces stub)
- `apps/dashboard/app/(app)/experiments/` (new page directory)
**Acceptance Criteria:**
- Customer can create an A/B test between two flows
- After 50+ sessions per variant, results show with statistical significance indicator
**Status:** [x] Done — `controllers/experiments.ts`, `dashboard/app/(app)/experiments/page.tsx`

---

### Task: Session replay UI (Starter+ feature)
**Priority:** P2
**Problem:** `sessionReplay` is gated on Starter+. Feature doesn't actually exist.
**Solution:**
1. `GET /api/v1/sessions/:id/replay` returns full conversation timeline
2. Dashboard renders: message timeline, step transitions, action types, feedback
3. Show user metadata, device, flow name, duration
4. Add "Flag this session" for quality review

**Files:**
- `apps/backend/src/controllers/sessions.ts`
- `apps/dashboard/app/(app)/sessions/[id]/page.tsx`
**Acceptance Criteria:**
- Starter+ customers can view full conversation timeline for any session
**Status:** [x] Done — `controllers/sessions.ts` + `dashboard/app/(app)/sessions/[id]/page.tsx` (already built)

---

### Task: Auto-optimize flow implementation
**Priority:** P2
**Problem:** `AutoOptimizeConfig` schema exists, stub API exists, no actual AI optimization.
**Solution:**
1. Background job analyzes completion rates for each step
2. For steps with < threshold completion: run LLM to suggest improved prompt
3. Show suggestion in `OptimizationLog` with before/after
4. "Apply suggestion" button applies the new prompt
5. Track improvement in next 30 sessions

**Files:**
- `apps/backend/src/queues/workers/autoOptimize.ts` (new)
- `apps/backend/src/controllers/autooptimize.ts` (new, replace stub)
**Acceptance Criteria:**
- Steps with < 30% completion receive AI prompt suggestion automatically
**Status:** [x] Done — `controllers/autooptimize.ts`, `controllers/optimize.ts`, `queues/workers/autoOptimize.ts`

---

### Task: Churn prediction model
**Priority:** P2
**Problem:** `/churn/at-risk` stub returns empty. Customers have no early warning system.
**Solution:**
Simple rule-based churn scoring (no ML needed initially):
1. Score each EndUser weekly: days since last session, steps completed, engagement depth
2. Users with score < threshold = "at risk"
3. `GET /api/v1/churn/at-risk` returns ranked list with scores
4. Dashboard shows "At Risk Users" panel with CTA to start retention flow

**Files:**
- `apps/backend/src/controllers/churn.ts` (new, replace stub)
- `apps/backend/src/queues/workers/churnScoring.ts` (new)
**Acceptance Criteria:**
- Users with 7+ days inactivity + incomplete flow appear in at-risk list
**Status:** [x] Done — `controllers/churn.ts` (rule-based scoring, `/at-risk` + `/summary`)

---

### Task: Zapier integration (triggers)
**Priority:** P2
**Problem:** No integration marketplace. Missing discovery channel and buyer persona.
**Solution:**
1. Create Zapier app with triggers:
   - `onboarding_completed` — fires when session status → completed
   - `step_completed` — fires on UserStepProgress.status → completed
   - `user_escalated` — fires on EscalationTicket create
   - `milestone_reached` — fires when `firstValueAt` is set
2. Webhook-based delivery to Zapier
3. Submit to Zapier marketplace
**Acceptance Criteria:**
- Working Zapier app that customers can connect
**Status:** [ ] Not Started

---

### Task: Referral program
**Priority:** P2
**Problem:** No word-of-mouth mechanism.
**Solution:**
1. Add `referralCode String? @unique` to Organization
2. Generate 8-char code on org creation
3. `GET /settings/referral` page with shareable link
4. On signup with `?ref=CODE`: associate referral
5. On referred org's first paid month: credit `REFERRAL_CREDIT_USD` to referring org
6. Track in `ReferralConversion` table

**Acceptance Criteria:**
- Customer has shareable referral link that tracks conversions
- Credit applied automatically when referred customer pays month 1
**Status:** [x] Done — `controllers/referral.ts`, schema migration, auth `?ref=CODE` attribution

---

## Infrastructure Improvements for 100 Customers

---

### Task: Add database connection pooler
**Priority:** P2
**Problem:** Direct connections will exhaust PostgreSQL limits with multiple Railway instances.
**Solution:** Enable PgBouncer in Railway. Update DATABASE_URL.
**Acceptance Criteria:**
- 5 Railway instances × 5 connections = 25 connections (within Railway PostgreSQL limit)
**Status:** [ ] Not Started

---

### Task: Add structured logging to sink
**Priority:** P2
**Problem:** Logs go only to stdout. No search, no alerts.
**Solution:** Configure Railway log drain → Logtail or Datadog. Add JSON format in production.
**Acceptance Criteria:**
- Can search by `orgId` and `sessionId` in log dashboard
**Status:** [ ] Not Started

---

### Task: Add monitoring and alerting
**Priority:** P2
**Problem:** No uptime monitoring.
**Solution:** BetterStack Uptime + Sentry alerting rules.
**Acceptance Criteria:**
- Alert fires within 5 minutes of API outage
**Status:** [ ] Not Started

---

### Task: Cache API key authentication
**Priority:** P2
**Problem:** Every widget request does a DB lookup to resolve API key. At 100 customers with active widgets, this is 1,000+ DB lookups/minute.
**Solution:** Cache `apiKey → Organization` in Upstash Redis with 60-second TTL. Invalidate on rotation.
**Files:** `apps/backend/src/middleware/auth.ts`
**Acceptance Criteria:**
- API key resolution adds < 5ms latency (Redis) vs < 50ms (DB direct)
**Status:** [x] Done — Redis-backed 60s TTL cache in `middleware/auth.ts`

---

### Task: Events table retention policy
**Priority:** P2
**Problem:** Events table grows unboundedly. At 100 customers, ~600K events/month.
**Solution:**
1. Add monthly cron to delete events older than 12 months
2. Add index hint for time-range queries: `@@index([organizationId, createdAt])`
**Acceptance Criteria:**
- Events table never exceeds 12 months of data
**Status:** [x] Done — `queues/workers/eventsRetention.ts`, monthly cron `0 3 1 * *`

---

## Sales Milestones for P2

- [ ] 5 paying customers by day 30
- [ ] Product Hunt launch by day 45
- [ ] 25 paying customers by day 60
- [ ] First enterprise pilot started by day 60
- [ ] 50 paying customers by day 75
- [ ] 100 paying customers by day 90
- [ ] $20K MRR achieved

---

## Enterprise Pilot Checklist

Before starting any enterprise pilot (>$5K ACV), ensure:
- [ ] Audit log viewer built (Growth+ requirement)
- [ ] SOC 2 questionnaire answered (even without certification)
- [ ] Data processing agreement (DPA) template ready
- [ ] GDPR delete-user endpoint working
- [ ] Custom contract template prepared
- [ ] SLA document prepared
- [ ] Dedicated Slack channel set up for pilot customer
