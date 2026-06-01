# P1: FIRST PAYING CUSTOMERS — Ahaget
> High ROI improvements for months 1–30 days post-launch. Target: first 10 paying customers.
> Last updated: 2026-06-01.

---

## Goal

Convert early-adopter technical founders into paying Starter ($99) or Growth ($299) customers. At the end of month 1:
- 10+ paying customers
- ~$1,000–$3,000 MRR
- Customer NPS > 40 (measured via first feedback survey)
- No customer has contacted support for a critical bug

---

## P1 Task List

---

### Task: Empty state guidance on all data pages
**Priority:** P1
**Problem:** Sessions, Conversations, Users, Escalations, Failures, Insights all show blank tables on first visit.
**Solution:** Each page renders a helpful empty state component when data is empty.

**Template for each page:**
```tsx
// EmptyState.tsx
export function EmptyState({ 
  icon, title, description, cta 
}: { icon: ReactNode; title: string; description: string; cta: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
      <div className="text-4xl opacity-40">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-500 max-w-md text-sm">{description}</p>
      {cta}
    </div>
  );
}
```

**Pages and their empty states:**
- Sessions: "No sessions yet. Install the widget to start recording sessions." + Install Guide CTA
- Users: "No users tracked yet. Users appear here once they interact with your widget."
- Escalations: "No escalations. When users need human help, tickets appear here."
- Failures: "No failures detected. This inbox shows sessions where the AI couldn't help."

**Files:** All `apps/dashboard/app/(app)/*/page.tsx` files
**Acceptance Criteria:**
- No page shows a blank table on first visit
- Every empty state has at least a description + CTA
**Status:** [ ] Not Started

---

### Task: Widget install verification in onboarding wizard
**Priority:** P1
**Problem:** No confirmation that widget was installed correctly.
**Solution:**
1. Add `/getting-started/verify` page to wizard
2. Poll `GET /api/v1/analytics/has-first-session` every 3 seconds
3. Show "Waiting for first session..." with animated spinner
4. On first session: show "✅ Widget detected!" with confetti
5. Timeout after 5 min: show troubleshooting checklist

**Backend endpoint:**
```typescript
router.get('/has-first-session', authenticateJWT, async (req, res) => {
  const sessionCount = await prisma.userOnboardingSession.count({
    where: { organizationId: req.user!.organizationId }
  });
  res.json({ detected: sessionCount > 0, count: sessionCount });
});
```

**Files:**
- `apps/backend/src/controllers/analytics.ts`
- `apps/dashboard/app/(onboarding)/getting-started/verify/page.tsx` (new)
**Acceptance Criteria:**
- Customer installing widget sees success confirmation within 60 seconds of first session
**Status:** [ ] Not Started

---

### Task: Flow templates library
**Priority:** P1
**Problem:** Blank flow canvas on first use. Customers don't know what a good flow looks like.
**Solution:**
1. Add `GET /api/v1/flow/templates` returning 5 pre-built template objects
2. Add template selection modal on "Create flow" click
3. On selection, pre-populate flow name and steps

**5 templates:**
1. **SaaS Onboarding** (5 steps: account setup → data connection → invite team → explore dashboard → celebrate)
2. **API Integration** (3 steps: generate API key → first API call → verify connection)
3. **Feature Discovery** (3 steps: detect unused feature → show demo → guide to try)
4. **Retention Recovery** (2 steps: acknowledge inactivity → show quick win)
5. **Usage Upsell** (2 steps: show limit approaching → suggest upgrade)

**Files:**
- `apps/backend/src/controllers/flow.ts`
- `apps/dashboard/app/(app)/flows/page.tsx` (add template modal)
**Acceptance Criteria:**
- New customer can start with a template in under 2 minutes
**Status:** [ ] Not Started

---

### Task: Upgrade prompt when plan feature gated
**Priority:** P1
**Problem:** Hitting a plan gate returns 403 JSON. No upgrade CTA.
**Solution:**
1. `apps/dashboard/lib/api.ts`: when response status 403 and body has `code: 'PLAN_FEATURE_LOCKED'`, emit a global event
2. `apps/dashboard/components/UpgradeModal.tsx`: modal shows feature name, current plan, next plan features, "Upgrade Now" button
3. "Upgrade Now" calls `POST /billing/checkout` with next plan's priceId

**Files:**
- `apps/dashboard/lib/api.ts`
- `apps/dashboard/components/UpgradeModal.tsx` (new)
- `apps/dashboard/app/(app)/layout.tsx` (add modal listener)
**Acceptance Criteria:**
- Clicking a Growth-only feature on Starter plan shows upgrade modal (not 403 error)
**Status:** [ ] Not Started

---

### Task: Usage limit notification emails
**Priority:** P1
**Problem:** Customers hit limits with no warning.
**Solution:**
1. Daily cron (runs at 8am) checks all orgs
2. At 80% MTU: send "You're approaching your user limit" email with upgrade CTA
3. At 100% MTU: send "Your widget has stopped working for new users" email with upgrade CTA
4. Deduplicate: only send once per threshold crossing (track `limitNotifiedAt` on org)

**Files:**
- `apps/backend/src/queues/workers/usageLimitAlert.ts` (new)
- `apps/backend/prisma/schema.prisma` (add `limitNotifiedAt` field)
- `apps/backend/src/utils/email.ts` (add email templates)
- `apps/backend/src/queues/index.ts` (register worker)
**Acceptance Criteria:**
- Test: manually set org MTU to 81% → trigger cron → email received
**Status:** [ ] Not Started

---

### Task: Annual billing option
**Priority:** P1
**Problem:** Missing 30% revenue opportunity (annual commits).
**Solution:**
1. Create annual pricing in Stripe: Starter $79/mo × 12 = $948/yr, Growth $249/mo × 12 = $2,988/yr
2. Add annual price IDs to `PLANS` in plans.ts
3. Add billing period toggle (monthly/annual) to billing page
4. Show savings callout: "Save $348/year"
**Files:**
- `apps/backend/src/utils/plans.ts`
- `apps/dashboard/app/(app)/settings/page.tsx`
**Acceptance Criteria:**
- Customer can choose annual billing at 20% discount
**Status:** [ ] Not Started

---

### Task: Set up support system
**Priority:** P1
**Problem:** No way to handle customer support tickets. Every customer question goes to founder's personal email.
**Solution:** Add Crisp or Intercom chat widget to dashboard and landing page.
- $25/month for Crisp (acceptable at early stage)
- Add script tag to dashboard layout
- Configure automated responses for common questions

**Files:** `apps/dashboard/app/layout.tsx`
**Acceptance Criteria:**
- Customer can send a support message from within the dashboard
**Status:** [ ] Not Started

---

### Task: Public documentation site
**Priority:** P1
**Problem:** No documentation. Customers can't self-serve answers.
**Solution:**
1. Set up GitBook or Mintlify (free tier for docs)
2. Write 10 core docs:
   - Getting Started (install widget)
   - Creating your first flow
   - Knowledge Base setup
   - Branding & customization
   - MCP connectors
   - API reference
   - Billing FAQ
   - Troubleshooting widget install
   - Supported frameworks
   - Pricing & limits
**Acceptance Criteria:**
- Docs site publicly accessible
- Install guide covers React, Vue, plain HTML
**Status:** [ ] Not Started

---

### Task: Rate limit auth endpoints
**Priority:** P1
**Problem:** No brute-force protection on login.
**Solution:**
Apply 5-attempt per 15-minute per-IP rate limit to `POST /auth/login` and `GET /auth/magic-link/verify`.
**Files:** `apps/backend/src/controllers/auth.ts`
**Acceptance Criteria:**
- 6th login attempt from same IP in 15 min returns 429
**Status:** [ ] Not Started

---

### Task: LLM provider fallback
**Priority:** P1
**Problem:** All inference through OpenRouter. Single point of failure.
**Solution:** Catch OpenRouter errors in `_openai.ts`. Rotate to direct OpenAI on failure.
**Files:** `apps/backend/src/services/agent/_openai.ts`
**Acceptance Criteria:**
- During simulated OpenRouter outage, agent falls back to OpenAI within 3s
**Status:** [ ] Not Started

---

### Task: Build agent health dashboard panel
**Priority:** P1
**Problem:** `AgentEvalLog` data exists, no UI.
**Solution:** 
1. `GET /api/v1/analytics/agent-health` aggregates KPIs from `AgentEvalLog`
2. Add "Agent Health" section to dashboard home with 3 metrics + sparklines
**Files:**
- `apps/backend/src/controllers/analytics.ts`
- `apps/dashboard/app/(app)/dashboard/page.tsx`
**Acceptance Criteria:**
- Dashboard shows first-turn completion %, p95 latency, selector success rate
**Status:** [ ] Not Started

---

### Task: Handle Stripe payment failure webhook
**Priority:** P1
**Problem:** Failed payments don't trigger notifications.
**Solution:** Handle `invoice.payment_failed` → send email → downgrade after 3 failures.
**Files:** `apps/backend/src/controllers/billing.ts`
**Acceptance Criteria:**
- Org owner receives email on payment failure
**Status:** [ ] Not Started
