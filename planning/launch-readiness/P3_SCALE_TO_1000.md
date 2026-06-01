# P3: SCALE TO 1,000 CUSTOMERS — Ahaget
> Advanced infrastructure and enterprise features. Target: months 4–12.
> Last updated: 2026-06-01.

---

## Goal

Scale from 100 to 1,000 paying customers:
- 1,000 customers × avg $250 ARPU = $250,000 MRR
- Infrastructure handles 1M+ sessions/month without degradation
- Enterprise customers (Scale tier): 5–10 at $1,000–$10,000 MRR each
- SOC 2 Type II certification in progress
- Series A conversation possible

---

## Enterprise Features

---

### Task: SSO / SAML implementation
**Priority:** P3
**Problem:** Enterprise customers require SSO. `sso` gate exists in plans.ts but not implemented.
**Solution:**
1. Use Auth0 or WorkOS (recommended: WorkOS for B2B SSO — $3K/year)
2. Implement SAML 2.0 and OIDC flows
3. Map IdP attributes to Ahaget user roles
4. `POST /api/v1/auth/sso/configure` — SAML metadata upload
5. `GET /api/v1/auth/sso/init` — SP-initiated SSO redirect

**Acceptance Criteria:**
- Enterprise customer with Okta can configure SSO
- SSO login works end-to-end
**Status:** [ ] Not Started

---

### Task: SOC 2 Type II preparation
**Priority:** P3
**Problem:** Enterprise customers require SOC 2 compliance evidence.
**Solution:**
1. Engage SOC 2 audit firm (cost: $10–30K)
2. Implement required controls:
   - Access control: MFA enforcement, quarterly access reviews
   - Availability: uptime SLA monitoring, incident response plan
   - Confidentiality: encryption at rest and in transit
   - Processing integrity: change management process
3. Security training documentation
4. Penetration testing (annual)

**Acceptance Criteria:**
- SOC 2 Type I report available to share with prospects
**Status:** [ ] Not Started

---

### Task: White-label widget (Scale+ add-on)
**Priority:** P3
**Problem:** Enterprise customers want to remove Ahaget branding entirely.
**Solution:**
1. Add `whiteLabel Boolean @default(false)` to Organization
2. When enabled: strip all Ahaget references from widget
3. Custom widget CDN URL: `cdn.customer.com/widget.js` (or serve via their CDN)
4. Gate on Scale plan

**Acceptance Criteria:**
- Enterprise customer's end-users see no Ahaget branding
**Status:** [ ] Not Started

---

### Task: Multi-workspace organization support
**Priority:** P3
**Problem:** Large SaaS companies have multiple products. Want one Ahaget contract for all.
**Solution:**
1. `Workspace` model — child of `Organization`, parent of flows/users/sessions
2. Admin can create and switch between workspaces
3. Billing: per workspace or shared limit
4. SSO assignment: users can be assigned to specific workspaces

**Acceptance Criteria:**
- Customer with 3 products manages them in 3 workspaces under one billing account
**Status:** [ ] Not Started

---

### Task: GDPR compliance (delete user)
**Priority:** P3
**Problem:** GDPR Article 17 "right to erasure." No mechanism to delete end-user data.
**Solution:**
1. `DELETE /api/v1/users/:endUserId` — cascade delete all data for this end user
2. Or: anonymize rather than delete (preserve aggregate stats)
3. Soft delete flag + 30-day grace period before hard delete
4. Audit log the deletion event

**Acceptance Criteria:**
- Customer can delete an end-user's complete data within 30 days of request
**Status:** [ ] Not Started

---

## Infrastructure for 1M Sessions/Month

---

### Task: Database read replicas for analytics
**Priority:** P3
**Problem:** Analytics queries (full table scans over events, sessions, messages) compete with transactional workloads on the same DB instance.
**Solution:**
1. Enable read replica on Railway PostgreSQL
2. Route analytics queries to replica: `prisma.useReplica()`
3. Route write/transactional queries to primary

**Acceptance Criteria:**
- Analytics page queries don't affect agent response latency
**Status:** [ ] Not Started

---

### Task: Materialized views for usage metrics
**Priority:** P3
**Problem:** Monthly message count queries (`COUNT(*) on session_messages WHERE created_at >= month_start`) are full table scans at 1M rows+.
**Solution:**
1. Create materialized view `org_monthly_usage` refreshed hourly
2. Use view for billing checks and dashboard metrics
3. Exact real-time count still available for hard limit enforcement

**Acceptance Criteria:**
- Usage count query responds in < 10ms at 1M rows
**Status:** [ ] Not Started

---

### Task: Time-series partitioning for high-volume tables
**Priority:** P3
**Problem:** `events`, `session_messages`, `audit_logs`, `agent_eval_logs` will have hundreds of millions of rows.
**Solution:**
1. `events` → partition by month
2. `session_messages` → partition by month
3. `audit_logs` → partition by month, drop partitions > 90 days (Growth) / custom (Scale)
4. `agent_eval_logs` → partition by month, keep 6 months

**Acceptance Criteria:**
- Query performance stable at 100M rows per partitioned table
**Status:** [ ] Not Started

---

### Task: Multi-region deployment
**Priority:** P3
**Problem:** Single Railway region. Latency for customers in US or EU is 150–300ms round-trip.
**Solution:**
1. Deploy backend to Railway US East (primary), EU West (replica)
2. Route widget requests to nearest region via Cloudflare
3. Database: single primary, read replicas per region
4. BullMQ: regional queues with shared job coordination

**Acceptance Criteria:**
- Agent latency < 100ms network overhead for US/EU customers
**Status:** [ ] Not Started

---

### Task: API rate limiting by organization tier
**Priority:** P3
**Problem:** Free tier customers can spam the API at the same rate as Scale customers.
**Solution:**
Per-org rate limits based on plan:
- Free: 10 req/min per session
- Starter: 30 req/min
- Growth: 60 req/min
- Scale: 100 req/min
Use Upstash Redis sliding window.

**Acceptance Criteria:**
- Free tier customer exceeding 10 req/min gets 429
**Status:** [ ] Not Started

---

## Revenue Targets for P3

| Month | Customers | ARPU | MRR |
|-------|-----------|------|-----|
| 4 | 100 | $200 | $20,000 |
| 6 | 250 | $220 | $55,000 |
| 9 | 500 | $240 | $120,000 |
| 12 | 1,000 | $250 | $250,000 |

**Key assumptions:**
- 15% monthly customer growth from month 3 onward
- ARPU grows as enterprise customers join (Scale tier at $999+)
- Annual billing adoption: 30% of customers by month 9

**Series A metrics at $250K MRR:**
- ARR: $3M
- Growth rate: 15% MoM (rule of 40 = 40+ if margins are >25%)
- Churn: < 5% monthly (industry standard)
- NPS: > 50
