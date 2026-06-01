# BILLING AUDIT — Ahaget
> Revenue infrastructure, pricing strategy, and monetization gaps. Last updated: 2026-06-01.

---

## Current Billing State

| Component | Status | Notes |
|-----------|--------|-------|
| Stripe integration | Implemented | SDK `stripe@14.21` |
| 4-tier pricing | Implemented | Free / Starter / Growth / Scale |
| Stripe checkout | Implemented | `POST /billing/checkout` |
| Customer portal | Implemented | `POST /billing/portal` |
| Webhook handler | Implemented | Subscription created/updated/deleted |
| Plan feature gates | Implemented | `requireFeature()` middleware |
| MTU limits | Implemented | Monthly tracked users |
| Message limits | Implemented | Monthly message count |
| Annual billing | **MISSING** | Major revenue lever |
| 14-day trial | **MISSING** | Industry standard |
| Usage overage packs | **MISSING** | Prevents churn at limit |
| Upgrade prompt in UI | **MISSING** | 403 errors, no CTA |
| Usage notifications | **MISSING** | No "80% limit" emails |
| Idempotent webhooks | **MISSING** | Risk of double-processing |
| Invoice management | Delegated to Stripe portal | OK |

---

## Pricing Analysis

### Current Plans

| Plan | Price | MTU | Messages | Target | Notes |
|------|-------|-----|----------|--------|-------|
| Free | $0 | 100 | 1,000 | Developers | Too generous — no pressure to upgrade |
| Starter | $99/mo | 1,000 | 5,000 | Early SaaS | Fair price point |
| Growth | $299/mo | 10,000 | 25,000 | Growth SaaS | Good |
| Scale | $999/mo | Unlimited | ~999K | Enterprise | Too cheap for enterprise |

**INR pricing exists:** ₹7,999 / ₹24,999 / ₹79,999 — good for Indian market.

### Pricing Problems

1. **Free tier is too generous for scale**
   - 100 MTU free = a small bootstrapped app can stay free forever
   - 1,000 messages/month = actually useful for testing
   - Consider limiting free to 50 MTU or 7-day trial window

2. **No annual option**
   - Industry average: 30–40% of SaaS customers choose annual when offered
   - Annual billing provides 10–12 months of cash upfront
   - Typical discount: 15–20% off monthly price
   - **Revenue impact:** 10 Growth customers on annual = $29,400 upfront vs $2,990/month

3. **No seat-based pricing component**
   - Enterprise expects to pay per seat for dashboard users
   - Current model: one price for entire org regardless of team size
   - Consider: base platform fee + per-seat over N users

4. **Scale plan is underpriced**
   - $999/mo for unlimited users is far too cheap for enterprise
   - Intercom charges $399/seat/month
   - Consider: $999 base + custom quote above 50K MTU

5. **No overage billing**
   - When a customer hits their MTU limit, the widget stops working for new users
   - This is a hard stop that causes customer churn
   - Fix: Add $0.01/additional MTU or MTU packs ($49 = 5,000 extra MTU)

---

## Revenue Opportunities

### Opportunity 1: Annual Billing
**Implementation:**
- Add `interval: 'year'` Stripe price variants for each plan
- Add 20% discount for annual commitment
- Show annual toggle on pricing page
- Add Stripe price IDs: `STRIPE_PRICE_STARTER_ANNUAL`, etc.

**Estimated impact:** 30% of customers choose annual → $X MRR becomes $X × 0.8 × 12 upfront cash

---

### Opportunity 2: 14-Day Free Trial
**Implementation:**
- `stripe.checkout.sessions.create({ subscription_data: { trial_period_days: 14 } })`
- Mark org as `trialEnds: Date` in DB
- Show trial countdown in dashboard header
- Send trial ending email at day 10 and day 13

**Why this matters:** Free tier users rarely convert. Trial users with credit card convert at 25–35%.

---

### Opportunity 3: MTU Add-On Packs
**Implementation:**
- Create Stripe products for MTU packs: $49/5K, $99/15K, $249/50K
- When org hits MTU limit, show modal: "Add more users for $49 →"
- Track add-on purchases in DB

**Why this matters:** Converts "limit blocked" churn events into expansion revenue.

---

### Opportunity 4: Message Limit Overages
**Similar to MTU packs.** When monthly message limit hit, show upgrade or add-on option. $19 per 2,000 additional messages.

---

### Opportunity 5: Usage-Based Add-On: Eval Pack
**Concept:** Sell "AI Quality Pack" — weekly eval reports, prompt optimization suggestions, regression alerts.
- Price: $49/month add-on on any plan
- Builds on existing `AgentEvalLog` + `evalRegression.ts` infrastructure

---

## Webhook Handler Hardening

**Current issues (from SECURITY.md):**
1. Not idempotent — Stripe can deliver same event twice
2. Missing `payment_intent.payment_failed` handling — should notify org of failed payment
3. Missing `customer.subscription.trial_will_end` handling — should send trial expiration email
4. No graceful handling if `organizationId` not found in metadata (silently fails)

**Required webhook events to handle:**
```
checkout.session.completed        ✅ Handled
customer.subscription.created     ✅ Handled
customer.subscription.updated     ✅ Handled
customer.subscription.deleted     ✅ Handled
payment_intent.payment_failed     ❌ Missing
customer.subscription.trial_will_end ❌ Missing
invoice.payment_failed            ❌ Missing
```

---

## Tasks

---

### Task: Add annual billing option
**Priority:** P1
**Problem:** No annual billing option. Missing 30% of revenue.
**Solution:**
1. Create annual price variants in Stripe ($79/mo × 12 = $949/yr for Starter, etc.)
2. Add `STRIPE_PRICE_STARTER_ANNUAL`, `STRIPE_PRICE_GROWTH_ANNUAL`, `STRIPE_PRICE_SCALE_ANNUAL` env vars
3. Add annual/monthly toggle to billing page
4. Show annual savings ("Save $238/year")
**Files:**
- `apps/backend/src/utils/plans.ts` (add annual price IDs)
- `apps/dashboard/app/(app)/settings/page.tsx` (billing page toggle)
**Acceptance Criteria:**
- Customer can choose annual billing at 20% discount
- Stripe processes 12-month subscription
**Status:** [ ] Not Started

---

### Task: Add 14-day free trial
**Priority:** P1
**Problem:** No trial. Free tier users rarely convert to paid.
**Solution:**
1. Add `trial_period_days: 14` to Stripe checkout session
2. Add `trialEndsAt DateTime?` to Organization model
3. Show trial countdown banner in dashboard
4. Send trial-ending emails at day 10 and day 13
**Files:**
- `apps/backend/src/controllers/billing.ts`
- `apps/backend/prisma/schema.prisma`
- `apps/backend/src/utils/email.ts`
**Acceptance Criteria:**
- Customer sees "10 days left in trial" banner
- Receives email at day 10 with upgrade CTA
**Status:** [ ] Not Started

---

### Task: Add MTU overage packs
**Priority:** P1
**Problem:** MTU limit causes hard stops and churn.
**Solution:**
1. Create Stripe products for MTU packs
2. Add `/billing/buy-mtu-pack` endpoint
3. Show modal when MTU limit is hit with "Add more users" CTA
**Files:**
- `apps/backend/src/controllers/billing.ts`
- `apps/dashboard/components/MtuLimitModal.tsx` (new)
**Acceptance Criteria:**
- Customer hitting MTU limit sees modal with add-on purchase option
**Status:** [ ] Not Started

---

### Task: Handle payment failure webhook
**Priority:** P1
**Problem:** Failed payments don't trigger any notification.
**Solution:**
1. Handle `payment_intent.payment_failed` and `invoice.payment_failed` webhooks
2. Send payment failure email to org owner
3. After 3 failures (7 days), downgrade to free plan
**Files:** `apps/backend/src/controllers/billing.ts`
**Acceptance Criteria:**
- Org owner receives email on payment failure
- Failed subscription eventually downgrades to free
**Status:** [ ] Not Started

---

### Task: Add upgrade prompt in dashboard for gated features
**Priority:** P0
**Problem:** Hitting plan gates shows a JSON 403 error with no upgrade CTA.
**Solution:** Dashboard intercepts `PLAN_FEATURE_LOCKED` response → shows upgrade modal.
**Files:**
- `apps/dashboard/lib/api.ts` (intercept 403)
- `apps/dashboard/components/UpgradeModal.tsx` (new)
**Acceptance Criteria:**
- Clicking a locked feature opens upgrade modal with plan comparison and CTA
**Status:** [ ] Not Started

---

### Task: Add usage limit notification emails
**Priority:** P1
**Problem:** No warning when approaching/hitting limits.
**Solution:** Daily cron at 80% and 100% thresholds sends email.
**Files:**
- `apps/backend/src/queues/workers/usageLimitAlert.ts` (new)
- `apps/backend/src/utils/email.ts` (add template)
**Acceptance Criteria:**
- Org at 80% MTU receives email within 1 hour
- Email contains upgrade link
**Status:** [ ] Not Started

---

### Task: Make Stripe webhook idempotent
**Priority:** P1
**Problem:** Duplicate event delivery causes double-processing.
**Solution:** Store processed event IDs. Return 200 for duplicates.
**Files:** `apps/backend/src/controllers/billing.ts`
**Acceptance Criteria:**
- Same Stripe event delivered twice has identical DB outcome
**Status:** [ ] Not Started
