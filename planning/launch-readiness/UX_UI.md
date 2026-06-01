# UX/UI AUDIT — Ahaget
> Dashboard experience analysis. Last updated: 2026-06-01.

---

## Overall UX Assessment

The dashboard is functional but feels like an engineer's tool, not a product a Head of Growth would use. The core problems:

1. **Too many navigation items** — 20+ flat sidebar items with no grouping
2. **Empty states missing** — Blank tables on first visit
3. **No progressive disclosure** — Everything is shown to everyone regardless of plan or setup state
4. **Stub features visible** — "Coming soon" messages erode trust
5. **No in-product guidance** — No tooltips, no help text, no walkthrough
6. **Enterprise expectations unmet** — No RBAC UI, no audit log viewer, no SSO management

---

## Page-by-Page Analysis

### Dashboard (Home)
**Current:** Shows metrics (active sessions, completion rate, MTU, messages). Good foundation.
**Missing:**
- No week-over-week trends for primary metric
- No "Quick Actions" panel for first-time setup
- No "Agent Health" KPIs (first-turn completion, latency, selector success rate)
- No "Recent Activity" feed showing last 5 sessions
**Enterprise expectation:** Executive-level summary with trend arrows, benchmark comparisons

**Redesign suggestion:**
```
Top row: 4 metric cards with trend arrows
  [Active Sessions] [Completion Rate] [MTU Used] [Messages Used]
Middle: 2-column
  Left: Activity chart (line chart, 30 days)
  Right: Agent Health panel (completion %, latency, selector success)
Bottom: Recent sessions table (last 5 with status)
```

---

### Flows
**Current:** List of flows with create button.
**Missing:**
- No template library for first-time users
- No drag-and-drop step reordering
- No per-flow analytics showing completion rate and drop-off point
- No "Preview in browser" button
- No flow duplication button
**Enterprise expectation:** Flow versioning, approval workflow before publish

---

### Sessions
**Current:** Table of sessions with status.
**Missing:**
- Empty state guidance (most important page for new users)
- No session timeline/replay view (feature is gated but not implemented)
- No filter by flow, status, date range
- No export to CSV
**Enterprise expectation:** SOC 2 compliance — session replay with full audit trail

---

### Knowledge Base
**Current:** Article list with create/upload/URL crawl options.
**Missing:**
- No article quality score (is this article actually being retrieved?)
- No KB search test tool ("Test: what happens when user asks X?")
- No embedding status visualization (which articles have fresh embeddings?)
- No per-article performance (was it retrieved? did it help?)

---

### Branding
**Current:** Color pickers, position config.
**Missing:**
- No live preview of widget with current settings
- No mobile preview
**Enterprise expectation:** Custom CSS override, white-label domain for widget

---

### Playbook
**Current:** Agent name, tone, guardrails config.
**Missing:**
- No test mode within the playbook editor ("how does my agent respond with these guardrails?")
- "Must never do" list has no validation (could conflict with "Must always do")

---

### MCP Connectors
**Current:** List of connectors with add/edit flow.
**Missing:**
- No connection test button ("Test connector" → try a sample tool call)
- No usage logs visible inline (how many times was this connector called?)
- Auth value field shows asterisks but has no "reveal" option for debugging
**Enterprise expectation:** Connector health monitoring, per-connector token usage

---

### Settings
**Current:** Multiple sub-pages (billing, AI config, widget, integrations, audit).
**Missing:**
- **Team management** — No invite flow, no user list, no role assignment
- **API key management** — No "rotate API key" button (dangerous — have to edit DB)
- **Danger zone** — No "Delete organization" option (GDPR requirement)
- **Audit log viewer** — Feature exists in DB but no UI built
**Enterprise expectation:** SAML SSO config, IP allowlist, session timeout config

---

### Insights
**Current:** Completion rate charts.
**Missing:**
- Drop-off analysis (which step loses most users?)
- Time-to-complete distribution
- KB article performance
- Comparison against industry benchmarks

---

## Quick Wins (1–3 hours each)

1. **Add section headers to sidebar** — 30 minutes. Groups 20 items into 4 sections visually.
2. **Add empty state to Sessions page** — 1 hour. Most visited page, highest impact.
3. **Add "Rotate API Key" button to Settings** — 2 hours. Security hygiene for customers.
4. **Add filter/search to all tables** — 3 hours each.
5. **Add loading skeletons** — 2 hours. Currently shows blank white during API calls.

---

## Tasks

---

### Task: Sidebar reorganization with section groups
**Priority:** P0
**Problem:** 20+ flat items, no hierarchy, confusing for new users.
**Solution:** Add 4 section groups with collapsible headers.
**Files:** `apps/dashboard/components/Sidebar.tsx`
**Acceptance Criteria:**
- Sidebar has Build / Monitor / Configure / Account sections
- New user can find "Create Flow" within 30 seconds
**Status:** [ ] Not Started

---

### Task: Dashboard home page redesign
**Priority:** P1
**Problem:** Missing agent health KPIs, trend arrows, quick actions.
**Solution:** Add agent health row, recent activity feed, and trend indicators.
**Files:** `apps/dashboard/app/(app)/dashboard/page.tsx`
**Acceptance Criteria:**
- Dashboard shows 7-day trend for all metrics
- Agent health panel shows 3 KPIs
**Status:** [ ] Not Started

---

### Task: Flow performance metrics on flows list
**Priority:** P1
**Problem:** Flows list shows no analytics. Admin can't tell if flow is working.
**Solution:** Add completion rate % and MTU count to each flow card.
**Files:**
- `apps/backend/src/controllers/flow.ts` (add analytics per flow)
- `apps/dashboard/app/(app)/flows/page.tsx`
**Acceptance Criteria:**
- Each flow shows "completion rate: 67%" and "users: 234"
**Status:** [ ] Not Started

---

### Task: Add KB search test tool
**Priority:** P1
**Problem:** Customers can't test if their KB articles are retrieved correctly.
**Solution:** Add "Test Search" panel on KB page — enter a query, see top 3 retrieved articles with scores.
**Files:**
- `apps/backend/src/controllers/kb.ts` (add `GET /kb/test?query=`)
- `apps/dashboard/app/(app)/knowledge/page.tsx`
**Acceptance Criteria:**
- Customer can type "how do I connect my database?" and see which articles the agent would retrieve
**Status:** [ ] Not Started

---

### Task: Add "Rotate API Key" button
**Priority:** P1
**Problem:** No way to rotate API key without direct DB access.
**Solution:** `POST /api/v1/config/rotate-api-key` — generates new UUID, updates org, invalidates old key immediately.
**Files:**
- `apps/backend/src/controllers/config.ts`
- `apps/dashboard/app/(app)/settings/page.tsx`
**Acceptance Criteria:**
- Old API key returns 401 after rotation
- Widget snippet in install docs reflects new key
**Status:** [ ] Not Started

---

### Task: Add MCP connector test button
**Priority:** P1
**Problem:** No way to test if an MCP connector works.
**Solution:** `POST /api/v1/mcp/:id/test` — lists tools, runs a sample tool call.
**Files:**
- `apps/backend/src/controllers/mcp.ts`
- `apps/dashboard/app/(app)/mcp/page.tsx`
**Acceptance Criteria:**
- Clicking "Test Connection" on a connector shows tool list and sample response
**Status:** [ ] Not Started

---

### Task: Add loading skeletons to all data pages
**Priority:** P1
**Problem:** Pages show blank white for 200–500ms on API calls.
**Solution:** Add skeleton loaders matching the table/card layout.
**Files:** All `(app)/*/page.tsx` files
**Acceptance Criteria:**
- No flash of blank content on any page load
**Status:** [ ] Not Started

---

### Task: Add team management UI
**Priority:** P0
**Problem:** No way to view or manage team members.
**Solution:** Settings → Team tab showing user list + invite button + role dropdown.
**Files:**
- `apps/dashboard/app/(app)/settings/page.tsx`
- (requires Team Invite backend — see PRODUCT.md)
**Acceptance Criteria:**
- Owner can invite users, see all team members, change roles, remove users
**Status:** [ ] Not Started

---

### Task: Add audit log viewer
**Priority:** P1 (Growth+ feature)
**Problem:** Audit logs exist in DB but no UI.
**Solution:** Settings → Audit tab with filterable log entries.
**Files:**
- `apps/backend/src/controllers/admin.ts` (add `/api/v1/audit-log` endpoint)
- `apps/dashboard/app/(app)/settings/page.tsx`
**Acceptance Criteria:**
- Growth+ users can view all agent actions with timestamp, session ID, action type
- Supports date range filter and export to CSV
**Status:** [ ] Not Started
