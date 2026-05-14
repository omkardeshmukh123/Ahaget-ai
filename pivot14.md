# Pivot 14 — Choke Point Detection

**Date:** 2026-05-08
**Status:** Planning
**Goal:** Automatic identification of the fields, pages, and flows where users struggle most — ranked by composite severity score, updated on every request.

---

## Feature Definition

> Choke point detection: automatic ranking of the exact steps, pages, and form-fill actions where users struggle most — by frequency AND severity — visible in the dashboard without any manual analysis.

### Why this matters
Right now, customers can see per-flow step drop-off rates (the `AnalyticsTab` in the flow editor). But:
- They have to open each flow individually.
- "Worst drop-off step" is a single number, not a ranked list across their entire product.
- Severity is not calculated — a 70% drop-off on a step seen 3 times looks the same as 70% on 300 times.
- No page-level view (which URL is causing the most AI sessions to abort?).
- No field-level view (which fill_form step specifically causes the most failed attempts?).

---

## What Already Exists (Don't Rebuild)

| Signal | Location |
|--------|----------|
| `UserStepProgress.dropReason` | Schema — "idle" \| "exit" \| "explicit_skip" |
| `UserStepProgress.attempts` | Schema — how many tries |
| `UserStepProgress.timeSpentMs` | Schema — time at step |
| `UserStepProgress.messagesCount` | Schema — AI turns to complete |
| `UserStepProgress.aiAssisted` | Schema — did AI help |
| `SessionMessage.feedback` | Schema — thumbs up/down per message |
| `UserOnboardingSession.pageUrl` | Schema — which URL session started from |
| Per-step drop-off rate | `/api/v1/activation/funnel/:flowId` |
| Page intent grouping | `/api/v1/analytics/intents` (groups messages by pageUrl) |

**No schema migration is needed.** All the raw signals are already being collected.

---

## What to Build

### 1. Backend — Choke Point API

**Endpoint:** `GET /api/v1/analytics/choke-points?days=30`

Returns a ranked array of choke points across ALL flows for the org.

#### Algorithm

For each `OnboardingStep` that belongs to this org's flows:

```
frequency       = sessions that reached this step
drop_rate       = (started - completed) / started × 100
avg_attempts    = mean(attempts) for dropped records at this step
avg_time_stuck  = mean(timeSpentMs) for dropped records (in seconds)
neg_feedback    = (messages with feedback=-1 at this step) / total messages at step × 100

severity_score  = (drop_rate × 0.40)
                + (min(avg_attempts / 5, 1) × 100 × 0.25)
                + (min(avg_time_stuck / 120, 1) × 100 × 0.20)
                + (neg_feedback × 0.15)
```

Severity is 0–100. Normalizations:
- `avg_attempts`: capped at 5 attempts = max signal
- `avg_time_stuck`: capped at 120 seconds = max signal

Only include steps with `frequency >= 3` (minimum signal threshold to avoid noise on brand-new flows).

#### Response shape

```json
{
  "choke_points": [
    {
      "rank": 1,
      "entity_type": "step",
      "step_id": "...",
      "step_title": "Connect your data source",
      "flow_id": "...",
      "flow_name": "Onboarding",
      "page_url": "/settings/integrations",
      "frequency": 142,
      "drop_rate": 68,
      "avg_attempts": 3.2,
      "avg_time_stuck_secs": 94,
      "neg_feedback_rate": 22,
      "severity_score": 71,
      "severity_label": "high",
      "example_messages": [
        "I can't find where to paste the API key",
        "It says invalid but I copied it exactly"
      ],
      "trend": "worsening"
    }
  ],
  "page_summary": [
    { "url": "/settings/integrations", "sessions": 89, "choke_step_count": 2 }
  ],
  "generated_at": "2026-05-08T10:00:00Z",
  "days": 30
}
```

`severity_label`: `"critical"` (score ≥ 70) | `"high"` (50–69) | `"medium"` (30–49) | `"low"` (< 30)

`trend`: Compare current 30d severity vs prior 30d. `"worsening"` | `"improving"` | `"stable"` | `"new"` (no prior data).

`example_messages`: Top 3 distinct user messages at this step from sessions that eventually dropped, excluding `__init__`/`__verify__`.

#### Fill-form specific signal
For steps where `actionType = 'fill_form'`:
- Include `field_choke: true` flag on the choke point record.
- `avg_attempts` becomes the primary signal (users trying to fill the form multiple times).
- Example messages surface what users typed when stuck.

This gives "field" detection without requiring widget-level form instrumentation.

#### Implementation notes
- Run in a single pass: join `OnboardingStep → UserStepProgress → SessionMessage` per step.
- Use `Promise.all` per step, but batch the queries (avoid N+1 for example_messages — fetch all messages for dropped sessions then filter in JS).
- Cache aggressively: this query is expensive. Add a 60-second in-memory cache keyed by `orgId + days`.

---

### 2. Dashboard — Choke Points Page

**Route:** `/insights/choke-points`

**Access:** Linked from Sidebar under "Insights" section (after the existing "Questions" and before "Sessions").

#### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Choke Point Detection                        [7d] [30d] [90d]  │
│  Automatic ranking of where users struggle most.                 │
├─────────────────────────────────────────────────────────────────┤
│  CRITICAL (2)     HIGH (4)     MEDIUM (6)     LOW (3)           │
│  [Filter tabs]                                                   │
├──────┬──────────────────────────┬──────┬──────┬─────────────────┤
│ Rank │ Step / Page              │ Flow │ Drop │ Severity        │
├──────┼──────────────────────────┼──────┼──────┼─────────────────┤
│  1   │ Connect data source      │ Onb  │  68% │ ████████ 71 ↑  │
│      │  /settings/integrations  │      │      │ CRITICAL        │
│      │  142 sessions · 3.2 avg  │      │      │ fill_form       │
│      │  attempts · 94s avg      │      │      │                 │
│      │  "I can't find where..."  │      │      │                 │
├──────┼──────────────────────────┼──────┼──────┼─────────────────┤
│  2   │ ...                      │      │      │                 │
└──────┴──────────────────────────┴──────┴──────┴─────────────────┘

Page Summary
┌──────────────────────────┬──────────┬───────────────┐
│ URL                      │ Sessions │ Choke Steps   │
├──────────────────────────┼──────────┼───────────────┤
│ /settings/integrations   │ 89       │ 2             │
│ /dashboard               │ 61       │ 1             │
└──────────────────────────┴──────────┴───────────────┘
```

#### UX details
- Clicking a row expands to show full example messages.
- Clicking "Open flow" navigates to `flows/[flowId]?tab=analytics`.
- `trend` shown as `↑ worsening` (red) / `↓ improving` (green) / `→ stable` (slate) badge.
- `fill_form` badge on steps where `actionType = 'fill_form'`.
- Empty state: "No choke points detected yet — need at least 3 sessions per step. Check back as traffic grows."
- Auto-refresh: re-fetches every 60 seconds (so it updates "in real time as new sessions come in").

---

### 3. Sidebar Update

Add "Choke Points" link to the Sidebar under Insights:

```tsx
{ label: 'Choke Points', href: '/insights/choke-points', icon: AlertTriangleIcon }
```

---

## Implementation Plan

### Phase A — Backend API (Day 1)

1. Add `GET /api/v1/analytics/choke-points` to `analytics.ts`.
2. Write severity scoring function (pure TS, unit-testable).
3. Add example message extraction query (join SessionMessage where dropped sessions).
4. Add trend comparison (query same metrics for `days * 2` ago → `days` ago window).
5. Add 60-second in-memory cache.
6. Register route in `app.ts`.
7. Write tests: empty org, single step, multi-step multi-flow, fill_form flagging.

### Phase B — Dashboard Page (Day 1–2)

1. Add `api.analytics.chokePoints(days)` to `lib/api.ts`.
2. Create `apps/dashboard/app/(app)/insights/choke-points/page.tsx`.
3. Implement severity badge, trend indicator, expandable row with example messages.
4. Add page summary table below main list.
5. Add day-range filter tabs (7d / 30d / 90d).
6. Add 60-second auto-refresh via `setInterval`.

### Phase C — Sidebar + Navigation (Day 2)

1. Add "Choke Points" link in `Sidebar.tsx`.
2. Confirm route resolves and page loads with auth guard.

---

## What is Explicitly Out of Scope (for pivot14)

| Item | Why deferred |
|------|-------------|
| Widget-side form field instrumentation | Requires JS SDK changes + new event schema. Significant scope. Existing `attempts` signal covers 80% of the use case for fill_form steps. |
| WebSocket/SSE real-time push | Polling every 60s achieves the product goal. Real push requires infrastructure investment disproportionate to benefit at current scale. |
| Choke point → automated suggestion | "Fix this step" AI copilot. Depends on prompt optimization pipeline (already exists in `OptimizationLog`). Can link to it in a future pivot. |
| Alerting / webhooks when severity crosses threshold | Separate feature. Can reuse `selectorAlertWebhook` pattern but needs its own design. |

---

## Acceptance Criteria

- [ ] `GET /api/v1/analytics/choke-points` returns ranked array with severity scores.
- [ ] Severity score is computed from drop_rate, avg_attempts, avg_time_stuck, neg_feedback.
- [ ] Fill_form steps are flagged with `field_choke: true`.
- [ ] Example messages are included (up to 3 per choke point).
- [ ] Trend is computed vs prior period.
- [ ] Results are filtered to `frequency >= 3` to suppress noise.
- [ ] Dashboard page renders ranked list with severity badges and trend indicators.
- [ ] Page summary table shows top URLs by session count.
- [ ] Day-range filter works (7d / 30d / 90d).
- [ ] Page auto-refreshes every 60 seconds.
- [ ] Sidebar link added and navigates correctly.
- [ ] Empty state shown when insufficient data.
- [ ] Tests cover scoring function and API endpoint.
