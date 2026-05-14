# Pivot 13 — Flow Completion & Drop-off Analytics

**Date:** 2026-05-07  
**Status:** Planning  
**Feature:** Track activation, onboarding completion, and feature adoption rates per flow. See exactly which step loses users and how completion changes over time.

---

## Situation Assessment

### What exists (not the feature, but useful primitives)

| Endpoint / Component | What it does | Gap |
|---|---|---|
| `GET /api/v1/activation/funnel` | Step drop-off for the **first active flow only** (hardcoded) | No `?flowId=` param — can't query any specific flow |
| `GET /api/v1/activation/flows` | Per-flow aggregate: totalSessions, completedSessions, completionRate | No step breakdown, no time series |
| `GET /api/v1/activation/overview` | Global completion rate + avg time-to-value | Global only |
| `GET /api/v1/activation/timeline` | Sessions started/completed per day | Global only, no per-flow filter |
| `GET /api/v1/analytics/lifecycle` | Stage-level funnel across all lifecycle stages | High-level only, no drill-down |
| `/lifecycle` dashboard page | Shows onboarding/adoption/etc. completion rates | Links to flows list — no step analytics |
| `/flows/[id]` dashboard page | Flow step editor | Zero analytics shown |
| `/flows` dashboard page | Flow list with type/status | No completion stats in table |

### What is completely missing

1. **Per-flow step drop-off UI** — No dashboard page that lets you pick a flow and see which step loses users
2. **Per-flow time series** — No graph showing "flow X completion rate over 30 days"
3. **Feature adoption post-flow** — No tracking of whether users actually used the feature after an adoption flow completed
4. **Funnel parametrization** — Backend funnel endpoint can't be queried for a specific flowId
5. **Flows list analytics** — The flow list table shows zero performance data (no completion rate column)

---

## Goal

A product manager or founder can:
1. Open the Flows page and immediately see completion rates for every flow
2. Click into a flow and see a step-by-step drop-off waterfall — which step bleeds the most users
3. See how that flow's completion rate changes over the last 30/60/90 days
4. Identify the single worst drop-off step with actionable context (time spent, AI assist rate)
5. Filter by flow type (onboarding / adoption / retention etc.)

---

## Implementation Plan

### Phase A — Backend: Parametrize the funnel endpoint

**File:** `apps/backend/src/routes/activation.ts`

1. Add `?flowId=` query param to `GET /api/v1/activation/funnel`
   - If `flowId` is provided, query that specific flow (validate org ownership)
   - If not provided, fall back to current behavior (first active flow) for backwards compat
   
2. Add `GET /api/v1/activation/flow-timeline?flowId=&days=30`
   - Returns daily `{ date, started, completed, completionRate }` for a specific flow
   - Reuse the existing `userOnboardingSession` query pattern from `/activation/timeline` but add `flowId` filter

3. Update `GET /api/v1/activation/flows` to include step-count and the worst drop-off step name
   - Join with `onboardingStep` to get step titles
   - Include `worstStepTitle` (step with highest dropOffRate) and `worstDropOffRate`

**Schema impact:** None — all data exists in `userStepProgress` and `userOnboardingSession`

---

### Phase B — Backend: Adoption rate tracking

**File:** `apps/backend/src/routes/activation.ts` (new endpoint)

Add `GET /api/v1/activation/adoption?flowId=`
- For flows with `flowType = 'adoption'`, count sessions where `firstValueAt IS NOT NULL` as "adopted"
- Return: `{ adoptionRate, adoptedCount, totalSessions, featureSlug }`
- `featureSlug` comes from `onboardingFlow.triggerCondition.featureSlug`

**API client:** Add to `apps/dashboard/lib/api.ts`
```ts
activation: {
  ...existing,
  flowTimeline: (flowId: string, days?: number) => apiFetch(...)
  adoption: (flowId: string) => apiFetch(...)
  funnelByFlow: (flowId: string) => apiFetch(...)
}
```

---

### Phase C — Dashboard: Flow list shows performance

**File:** `apps/dashboard/app/(app)/flows/page.tsx`

Add a second data fetch on mount: `api.activation.flows()` (already exists)

Augment the flows table with two new columns:
- **Sessions** — `totalSessions` number
- **Completion** — colored badge: `completionRate%` (green ≥70, amber 40–69, red <40)

Clicking a row navigates to `/flows/[id]` (existing behavior — analytics tab will be on that page)

---

### Phase D — Dashboard: Per-flow analytics tab in flow detail

**File:** `apps/dashboard/app/(app)/flows/[id]/page.tsx`

Add a tab switcher at the top: `[Steps] [Analytics]`

**Analytics tab content:**

#### 1. Header metrics row (4 stat cards)
- Total sessions
- Completion rate (%)
- Avg time to complete (mins)
- Worst drop-off step name + rate

#### 2. Step drop-off waterfall / funnel chart
- Horizontal bars: one per step in order
- Bar width = `started` users (relative to first step)
- Color fill = `completed` users
- Right-side label: `dropOffRate%` in red if >50%, amber if >25%
- Below each bar: avg time spent on step (seconds)
- Highlight the worst drop-off step with a red border

Implementation: Pure CSS/SVG bars (no charting library dependency)

```
Step 1: Connect account   ████████████████████████░░  87% completed
Step 2: Import data       █████████████████░░░░░░░░░  62% completed  ← worst drop-off
Step 3: Invite team       ████████████████░░░░░░░░░░  59% completed
Step 4: First action      ██████████████████░░░░░░░░  71% completed
```

#### 3. Completion rate over time (line chart)
- X axis: dates (last 30 days, switchable to 7d/90d)
- Y axis: daily completion rate %
- Second line: sessions started per day (secondary axis)
- Implementation: SVG path — no library needed

#### 4. AI assist rate per step (optional, shown as small badge on each step bar)
- "AI helped X% of completions"

---

### Phase E — Dashboard: Sidebar / navigation

**File:** `apps/dashboard/components/Sidebar.tsx`

No sidebar change needed — analytics lives inside the flow detail page.

Consider: add a small "↗ Analytics" link in the flows list table row (next to "Edit steps")

---

## Data Model Verification

All required data already exists in the schema:
- `userOnboardingSession` — `flowId`, `status`, `startedAt`, `completedAt`, `firstValueAt`
- `userStepProgress` — `stepId`, `status`, `timeSpentMs`, `aiAssisted`
- `onboardingStep` — `id`, `flowId`, `title`, `order`, `isMilestone`
- `onboardingFlow` — `id`, `organizationId`, `flowType`, `triggerCondition`

No migration needed.

---

## API Changes Summary

| Method | Route | Change |
|---|---|---|
| GET | `/api/v1/activation/funnel` | Add `?flowId=` param (backwards compat) |
| GET | `/api/v1/activation/flow-timeline` | New — daily completion per flow |
| GET | `/api/v1/activation/adoption` | New — adoption rate for adoption-type flows |
| GET | `/api/v1/activation/flows` | Enrich response with `worstStepTitle`, `worstDropOffRate` |

---

## UI Spec

### Flows list page additions

```
Name              Type        Steps   Sessions   Completion   Status
──────────────────────────────────────────────────────────────────────
User Onboarding   Onboarding  5       247        68%          Live
Feature Adoption  Adoption    3       89         41%          Live  ← amber
Re-engagement     Retention   4       12         25%          Draft ← red
```

### Flow analytics tab

```
[Steps]  [Analytics]   ← tab switcher at top of /flows/[id]

Total sessions    Completion    Avg time       Worst step
247               68%           4.2 min        "Import data" 38% drop
─────────────────────────────────────────────────────────────────

STEP DROP-OFF
─────────────────────────────────────────────────────────────────
Connect account  ████████████████████  91%  (avg 45s)
Import data      ████████████░░░░░░░░  53%  (avg 3m 12s)  ← 38% drop ⚠
Invite team      ██████████████████░░  82%  (avg 1m 04s)
First action     ████████████████████  88%  (avg 22s)

COMPLETION OVER TIME (30d)
─────────────────────────────────────────────────────────────────
[line chart: daily completion rate % + sessions started]
```

---

## Sequencing

1. **Phase A** (backend funnel param + flow-timeline) — 2–3 hours
2. **Phase B** (adoption endpoint) — 1 hour
3. **Phase C** (flows list completion column) — 1 hour
4. **Phase D** (analytics tab UI) — 4–5 hours
5. Test: verify funnel data flows end-to-end with seeded test data

Total estimate: ~1 working day

---

## Success Criteria

- [ ] Flows list table shows completion rate for every flow
- [ ] Clicking into a flow shows an Analytics tab (not just step editor)
- [ ] Analytics tab shows step-by-step drop-off waterfall with percentages
- [ ] The worst drop-off step is visually highlighted
- [ ] A line graph shows completion rate trend over 30 days for that flow
- [ ] `adoption`-type flows show feature adoption rate (firstValueAt-based)
- [ ] All data is scoped to org — cross-org isolation preserved
- [ ] No new DB migrations needed

---

## Out of Scope (for this pivot)

- Real-time drop-off alerts (separate alerting feature)
- A/B test comparison within analytics tab (experiments feature is separate)
- Export of funnel data to CSV (low priority)
- Cohort analysis (users who completed step X, did they retain?)
