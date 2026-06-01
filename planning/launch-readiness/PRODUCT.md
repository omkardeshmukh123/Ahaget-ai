# PRODUCT AUDIT — Ahaget
> Customer experience from signup to value. Last updated: 2026-06-01.

---

## Product Readiness Assessment

### Customer Journey Audit

| Stage | Current State | Blocking Issues |
|-------|--------------|----------------|
| Signup / Registration | Works. Email + password, magic link. | No email verification. |
| Onboarding Wizard | 5 steps: workspace → attribution → description → install → snippet | Install step has no verification. Users get stuck. |
| First Flow Setup | Flow editor exists and works | No template flows for common products. Empty canvas intimidates. |
| Widget Install | Snippet provided | No "confirm widget loaded" step. |
| First Agent Test | Test mode exists (`testMode: true`) | Test mode preview is buried. Users don't find it. |
| Live Launch | Toggle flow to "active" | No launch checklist or pre-launch review. |
| Monitoring | Sessions, conversations, analytics pages | Most metrics pages show empty state without explanation. |
| Upgrade | Billing page with Stripe checkout | No in-product upgrade prompt when limits hit. |
| Team Collaboration | No invite flow | CRITICAL — can't add teammates. |

---

## Feature Discoverability Problems

### Problem 1: The sidebar has 20+ items with no hierarchy

**Current structure (flat list):**
Dashboard / Flows / Sessions / Conversations / Knowledge / Users / Escalations / MCP / Interface / Triggers / Proactive / Expansion / Branding / Playbook / Insights / Failures / Lifecycle / Questions / In-page assistant / Settings

**Impact:** New customers don't know where to start. They open 5 pages, see mostly empty tables, and close the tab.

**Fix:** Reorganize into 4 sections:
```
📦 Build
  ├── Flows
  ├── Knowledge Base
  ├── Branding
  └── Playbook

📊 Monitor
  ├── Dashboard
  ├── Sessions
  ├── Conversations
  ├── Escalations
  └── Failures

⚙️ Configure
  ├── Triggers
  ├── MCP Connectors
  ├── Interface Map
  ├── Context Sources
  └── Integrations

👤 Account
  └── Settings
```

---

### Problem 2: No empty state guidance

**Affected pages (all show blank tables):**
- Sessions — "No sessions yet" but no CTA to install widget
- Conversations — blank table
- Users — blank table
- Escalations — blank
- Failures — blank
- Insights — blank charts

**Impact:** Customer's first thought: "Is this broken?" Then: "Am I doing something wrong?"

**Fix:** Each empty state must have:
1. An illustration or icon
2. A headline: "No sessions yet"
3. A description: "Install the widget on your app to start collecting sessions."
4. A primary CTA: "View install instructions →"

---

### Problem 3: No widget install verification

**Current flow:**
1. Customer copies snippet
2. Customer pastes into their app
3. ...nothing tells them if it worked

**Impact:** 40% of customers get the snippet wrong (wrong API key, wrong domain, JS errors). They wait for sessions that never come.

**Fix:** Add a `/getting-started/verify` step:
- Poll `GET /api/v1/analytics/overview` every 3 seconds
- When `totalSessions > 0`, show "✅ Widget detected! Your first session was recorded."
- Timeout after 5 minutes with "Troubleshooting guide →"

---

### Problem 4: No flow templates

**Current:** New org lands in Flows → "No flows yet" → must build from scratch.

**Impact:** Customers don't know what a good flow looks like. They build 1-step flows that don't capture value.

**Fix:** Provide 5 starter templates:
1. **SaaS Onboarding** — 5-step: connect, configure, invite team, explore features, celebrate
2. **Data Integration** — 3-step: connect data source, verify, done
3. **Feature Discovery** — 4-step: detect unused feature → show value → guide → confirm
4. **Retention Recovery** — 3-step: detect inactive → remind value → re-engage
5. **Upgrade Prompt** — 2-step: detect limit → suggest plan → link to checkout

---

### Problem 5: Stub routes visible in production

**Affected sidebar items:**
- "Lifecycle" → `/lifecycle` → stubs
- "Questions" → `/questions` → stubs  
- "In-page assistant" → stubs
- Several settings sub-pages hit stub endpoints

**Impact:** Customer sees "Feature coming soon" responses. Trust evaporates.

**Fix:** Either:
A. Remove these sidebar items until implementation exists, OR
B. Add a "Beta" or "Coming Soon" badge to the sidebar item so it's clearly labeled

---

## Time-to-Value Analysis

**Current TTV for a technical customer:**
1. Register: 2 min
2. Onboarding wizard: 5 min
3. Create first flow: 15 min
4. Copy snippet: 1 min
5. Install on app: varies (5–60 min for non-technical)
6. First session: depends on user

**Total: 25+ minutes before they see ANY value.**

**Target TTV:** Under 10 minutes to "aha moment."

**How to achieve it:**
1. Provide a demo/sandbox mode where customers can see the widget working without installing it (use a sample SaaS app demo)
2. Provide 1-click flow templates
3. Shorten onboarding wizard to 3 steps (workspace → install → done)

---

## Tasks

---

### Task: Reorganize dashboard sidebar
**Priority:** P0
**Problem:** 20+ flat items make navigation confusing.
**Solution:** Group into 4 sections with section headers.
**Files:** `apps/dashboard/components/Sidebar.tsx`
**Acceptance Criteria:**
- Sidebar has 4 collapsible sections
- New user study shows 80%+ find "create flow" within 30 seconds
**Status:** [ ] Not Started

---

### Task: Add empty state guidance to all data pages
**Priority:** P0
**Problem:** Blank tables on first visit look broken.
**Solution:** Each page renders a helpful empty state with CTA when data array is empty.
**Files:** Sessions, Conversations, Users, Escalations, Failures, Insights pages in `apps/dashboard/app/(app)/`
**Acceptance Criteria:**
- Every page with a table has an empty state with an illustration and CTA
**Status:** [ ] Not Started

---

### Task: Widget install verification step
**Priority:** P0
**Problem:** No confirmation that the widget loaded correctly after install.
**Solution:** Add polling step to onboarding wizard at `/getting-started/verify`.
**Files:**
- `apps/dashboard/app/(onboarding)/getting-started/verify/page.tsx` (new)
- `apps/backend/src/controllers/analytics.ts` (add `hasFirstSession` endpoint)
**Acceptance Criteria:**
- Customer sees green checkmark when widget sends first session
**Status:** [ ] Not Started

---

### Task: Add 5 starter flow templates
**Priority:** P1
**Problem:** Blank flow canvas is intimidating. No best-practice examples.
**Solution:** Add template selection modal on first flow creation.
**Files:**
- `apps/backend/src/controllers/flow.ts` (add `/templates` endpoint)
- Flow creation modal in dashboard
**Acceptance Criteria:**
- Customer can select a template and get a pre-built flow with steps
**Status:** [ ] Not Started

---

### Task: Build team invite flow
**Priority:** P0
**Problem:** No mechanism to add teammates to the organization.
**Solution:**
1. `POST /api/v1/auth/invite` — generates invite token, emails via Resend
2. `GET /api/v1/auth/accept-invite/:token` — validates token, creates user
3. UI: Settings → Team → Invite by email
**Files:**
- `apps/backend/src/controllers/auth.ts`
- `apps/dashboard/app/(app)/settings/page.tsx`
**Acceptance Criteria:**
- Team member receives email, clicks link, sets password, sees dashboard
**Status:** [ ] Not Started

---

### Task: Add upgrade prompt when plan features are gated
**Priority:** P1
**Problem:** Hitting a plan gate returns a 403 with JSON error. No upgrade CTA.
**Solution:** Dashboard catches `PLAN_FEATURE_LOCKED` response code → renders upgrade modal with plan comparison table and "Upgrade" CTA.
**Files:**
- `apps/dashboard/lib/api.ts` (intercept 403 with PLAN_FEATURE_LOCKED)
- `apps/dashboard/components/UpgradeModal.tsx` (new)
**Acceptance Criteria:**
- Clicking a gated feature shows upgrade modal with CTA to billing page
**Status:** [ ] Not Started

---

### Task: Hide stub routes from sidebar until implemented
**Priority:** P0
**Problem:** Stub routes visible in sidebar show "coming soon" to paying customers.
**Solution:** Remove from sidebar or add "Beta" label. Do not remove the routes (backward compat).
**Files:** `apps/dashboard/components/Sidebar.tsx`
**Acceptance Criteria:**
- Customers don't see incomplete features in production sidebar
**Status:** [ ] Not Started

---

### Task: Add usage limit notification emails
**Priority:** P1
**Problem:** Customers hit their message/MTU limit with no warning.
**Solution:** Daily cron checks usage. At 80% → send "approaching limit" email. At 100% → send "limit reached" email with upgrade CTA.
**Files:**
- `apps/backend/src/queues/workers/usageLimitAlert.ts` (new)
- `apps/backend/src/utils/email.ts` (add template)
**Acceptance Criteria:**
- Org at 80% MTU receives email within 1 hour
**Status:** [ ] Not Started
