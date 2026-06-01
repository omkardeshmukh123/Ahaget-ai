# GROWTH & REVENUE AUDIT — Ahaget
> Monetization, viral loops, and path to first 100 customers. Last updated: 2026-06-01.

---

## Current Growth State

**Blunt assessment: Almost nothing is built for growth.** The product is engineer-built — feature complete in AI capabilities, but completely unequipped to acquire, convert, or retain customers without founder involvement at every step.

| Growth Component | Status |
|-----------------|--------|
| Referral program | ❌ Not built |
| Annual billing | ❌ Not built |
| Free trial | ❌ Not built |
| Usage notifications (limit alerts) | ❌ Not built |
| Upgrade prompt in product | ❌ Not built |
| "Powered by Ahaget" badge | ❌ Not built |
| Zapier/Make integration | ❌ Not built |
| Blog / content marketing | ❌ Not built |
| Public changelog | ❌ Not built |
| G2 / Capterra listing | ❌ Not done |
| Case studies | ❌ Not built |
| Demo video | ❌ Not built |
| Product Hunt launch | ❌ Not done |
| Viral loop (any) | ❌ None |
| Email nurture sequence | ❌ Not built |
| In-product success metrics shown to customer | ❌ Missing |

---

## Viral Loop Opportunities

### Loop 1: B2B2C "Powered by Ahaget" Badge
**How it works:**
- Widget footer shows "Powered by Ahaget" with link to ahaget.ai landing page
- End-users of customer's product (who are often startup founders themselves) see it
- Curious users visit ahaget.ai
- Conversion: ~0.1% of end-users sign up
- At 10K MTU/month (Growth plan): 10 signups/month from badge alone

**Implementation:**
- Add optional badge to widget footer (on by default, toggle in BrandingConfig)
- Gate removal on Growth+ plan ("Remove badge" is a Growth+ feature)
- This makes the badge doubly monetizable: free marketing AND an upgrade driver

---

### Loop 2: Widget-to-Signup for Growth Teams
**How it works:**
- When the agent completes a flow, add "Want to build this for your product? Try Ahaget free →" CTA
- Only shows to users who are in "admin" or "developer" role metadata
- Trackable via UTM parameter

---

### Loop 3: Customer Success Metrics → Social Proof
**How it works:**
1. Track "activation rate improvement" for each customer (before Ahaget vs after)
2. Show this in the dashboard: "Your activation rate improved 34% since installing Ahaget"
3. Prompt customers to share: "Share this on LinkedIn →"
4. Template tweet/LinkedIn post with their metric

---

## Acquisition Channels

### Channel 1: Content Marketing (Indian SaaS Market)
**Opportunity:** No major AI onboarding tool explicitly targets the Indian SaaS market. Ahaget has Sarvam AI integration for 10 Indian languages.

**Content strategy:**
- Blog: "How top Indian SaaS companies are using AI for onboarding"
- Landing pages for Indian SaaS categories (EdTech, FinTech, B2B SaaS)
- SEO target: "AI onboarding for SaaS India" — low competition, high intent

**Effort:** 2 hours/week
**Expected impact:** 50–100 signups/month within 90 days

---

### Channel 2: Product Hunt Launch
**Timing:** After P0 fixes and first 3–5 paying customers
**Required pre-work:**
- Video demo (90 seconds)
- Product screenshots
- First customer testimonials
- Hunter outreach (start 2 weeks before)

**Expected impact:** 500–2,000 visitors, 50–200 signups in first week

---

### Channel 3: YC/Startup Community Network
**Direct outreach to SaaS founders with:**
- A specific "activation rate" problem
- Existing Intercom/Appcues spend
- Indian SaaS community connections

**Approach:** Personal DMs with "I noticed your product has X steps before value. We can halve that. Want to see?"

**Target:** 5 customers from first 50 outreach conversations

---

### Channel 4: Integration Marketplaces
**Zapier:** List Ahaget in Zapier marketplace → "When user completes onboarding step → trigger Zapier action"
**Make:** Same
**Impact:** These get traffic from high-intent buyers looking for onboarding automation tools

---

## Retention Strategy

### Current retention mechanisms:
- Proactive re-engagement messages (built)
- Trigger rules for inactivity (built)
- Flow alerts on zero completion (built)

### Missing retention mechanisms:
1. **Monthly success report email** — "Your AI agent helped 234 users complete onboarding this month (up 15%)" → sent to org admins
2. **Product stickiness** — customers invested in KB articles, flows, and interface maps won't easily leave (good moat)
3. **Usage-based upgrade pressure** — as customers grow, they naturally hit limits and must upgrade or churn

### Churn risk factors:
- Widget breaks when customer deploys new UI (selector failures) → self-healing mitigates, but needs monitoring
- LLM quality degrades → eval regression check mitigates
- Competitive alternatives improve → need ongoing product development

---

## Expansion Revenue

### Current expansion mechanisms:
- MTU overages → upgrade plan (but no overage billing, so it's churn risk)
- Upsell attribution tracks AI-driven upgrades for customers' end-users

### Missing expansion mechanisms:
- **Usage-based overages** (MTU packs, message packs)
- **White-label option** (scale tier add-on: remove all Ahaget branding, custom domain)
- **Multi-workspace** (single org with multiple products — they'd pay per workspace)
- **Dedicated customer success** (Scale tier premium add-on: dedicated CSM, quarterly reviews)

---

## Pricing Page Recommendations

**Current:** Pricing exists in the dashboard billing page only. Landing page pricing is static HTML.

**Recommended changes:**
1. Add "Most Popular" badge to Growth plan
2. Show monthly vs. annual toggle with savings callout
3. Add FAQ section: "What counts as a tracked user?", "Can I switch plans?", etc.
4. Add customer logo bar above fold ("Trusted by X SaaS companies")
5. Add feature comparison table (all plans side-by-side with checkmarks)
6. Add "Talk to Sales" CTA for Scale plan instead of self-serve

---

## Tasks

---

### Task: Add "Powered by Ahaget" badge to widget
**Priority:** P1
**Problem:** No viral loop from widget to new signups.
**Solution:** Add optional badge to widget footer. Gate badge removal on Growth+.
**Files:**
- `apps/widget/src/views/ui.ts` (add badge to panel footer)
- `apps/backend/prisma/schema.prisma` (add `hideBadge` field to BrandingConfig)
- `apps/backend/src/utils/plans.ts` (add `hideBadge` to plan gates)
**Acceptance Criteria:**
- Badge visible on free/starter plans with link to ahaget.ai
- Growth+ customers can toggle it off in branding settings
**Status:** [ ] Not Started

---

### Task: Add monthly success report email
**Priority:** P1
**Problem:** Customers don't see their ROI after initial setup. Easy to forget value and churn.
**Solution:** Monthly email with: sessions count, completion rate, time-to-value, users helped.
**Files:**
- `apps/backend/src/queues/workers/monthlyReport.ts` (new)
- `apps/backend/src/utils/email.ts` (add template)
**Acceptance Criteria:**
- Org owner receives monthly report email with key metrics
**Status:** [ ] Not Started

---

### Task: Build referral program
**Priority:** P2
**Problem:** No word-of-mouth mechanism.
**Solution:**
1. Add `referralCode` to Organization model
2. `GET /settings/referral` page showing referral link
3. Referred org signs up and pays → referring org gets $50 credit or 1 month free
4. Track with `ReferralConversion` table
**Acceptance Criteria:**
- Customer has a shareable referral link
- Credit applied automatically when referred customer pays
**Status:** [ ] Not Started

---

### Task: Add activation rate improvement metric to dashboard
**Priority:** P1
**Problem:** Customers don't see their ROI from Ahaget in numbers.
**Solution:** Calculate "baseline activation rate" vs "with Ahaget activation rate" from session data.
**Files:**
- `apps/backend/src/controllers/analytics.ts`
- `apps/dashboard/app/(app)/dashboard/page.tsx`
**Acceptance Criteria:**
- Dashboard shows "Activation rate: 67% (↑23% vs. 30 days ago)"
**Status:** [ ] Not Started

---

### Task: Zapier integration
**Priority:** P2
**Problem:** No integration marketplace presence. Zapier customers are high-intent buyers.
**Solution:**
1. Create Zapier app with triggers: `onboarding_completed`, `step_completed`, `user_escalated`
2. Create Zapier actions: `start_flow_for_user`, `send_proactive_message`
3. Submit to Zapier marketplace
**Acceptance Criteria:**
- Zapier workflow: "When onboarding_completed → add to HubSpot"
**Status:** [ ] Not Started
