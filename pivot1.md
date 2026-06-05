# pivot1 — Self-Healing Selector Recovery: Full Stack Completion

## Context

Tandem AI's stated differentiator over legacy DAPs is "self-repair capability — the agent
can detect and adapt to UI changes such as CSS selector shifts." Ahaget has the majority
of this built already (8-strategy client-side resolver, fingerprint scanner, heal endpoint,
DB schema). Four gaps remain before the feature is fully closed.

---

## Gap Analysis

| # | Gap | Impact |
|---|-----|--------|
| 1 | Agent treats pre-configured selectors as mandates ("use exact values") rather than hints to validate against the live DOM | Stale actionConfig selectors cause preventable failures even though the resolver could heal them |
| 2 | `resolveFromIndex` has no fallback to stored fingerprints when a pre-configured selector isn't in the current DOM scan | Pre-configured flows with stale selectors can't self-heal; resolver returns null immediately |
| 3 | `SelectorHealLog` table has data but no dashboard surface | Product teams can't see which selectors are drifting or where users are failing silently |
| 4 | Successful heals are logged but the interface map is never updated | The same drift must be healed for every new user session indefinitely |

---

## Phase 1 — Fix actionConfig Selector Mandate

**What:** Change the agent system prompt so a pre-configured selector is treated as a
reference hint, not a mandate. The agent should validate it against live page elements
before using it.

**File:** `apps/backend/src/services/agent/index.ts`

**Change:** In `actionHint`, replace:
```
"use these exact values with execute_page_action"
```
with:
```
"use these values if the selector appears in LIVE PAGE ELEMENTS — otherwise find
the closest matching element by label, placeholder, or visible text"
```

**Why this matters:** Without this, the agent calls `execute_page_action` with a stale
selector. The widget's `resolveFromIndex` looks up the selector in the current element
index — but a stale selector isn't there, so hints are `undefined`, and healing can't run.
With this change, the agent validates first and picks a live selector when the original is
gone.

---

## Phase 2 — Fingerprint Fallback for Pre-configured Selectors

**What:** When `resolveFromIndex` can't find a selector in the live element index, look up
its fingerprint from the interface map (already stored in `InterfaceElement`) and use it as
healing hints.

**Files:**
- `apps/backend/src/controllers/session.ts` — include fingerprints in session start response
- `apps/widget/src/features/copilot.ts` — cache fingerprints, pass to resolver on miss

**Backend:** On `POST /api/v1/session/start` and `GET /api/v1/session`, if the current
step has `actionConfig.selector`, look up the `InterfaceElement` record for that selector
on the current step's `targetUrl` (or any active snapshot for the org). Return
`currentStep.actionConfig.fingerprint` containing `{text, ariaLabel, placeholder, name,
dataTestId, classes}`.

**Widget:** `CopilotManager` stores a `Map<string, ScannedElement>` of remote fingerprints
loaded from the session response. `executePageAction` passes these as hints to
`resolveElement` when `resolveFromIndex` returns null.

**New widget helper:** `resolveWithFallback(selector, remoteHints?)` — tries
`resolveFromIndex` first, then `resolveElement(selector, remoteHints.get(selector))`.

---

## Phase 3 — Selector Drift Dashboard Page

**What:** New dashboard page at `/flows/drift` (linked from Flows sidebar item) showing
heal telemetry so product teams can see which selectors are breaking and where.

**Files:**
- `apps/backend/src/controllers/analytics.ts` — `GET /api/v1/analytics/heal-stats`
- `apps/dashboard/app/(app)/flows/drift/page.tsx` — new dashboard page

**API response shape:**
```json
{
  "summary": {
    "totalActions": 1240,
    "healedCount": 87,
    "failedCount": 12,
    "healRate": 0.93
  },
  "topDriftingSelectors": [
    { "selector": "button.btn-primary", "failures": 9, "lastPage": "/checkout", "lastSeen": "..." }
  ],
  "strategyDistribution": {
    "primary": 1153, "aria-label": 42, "exact-text": 28, "fuzzy-text": 17,
    "fuzzy-class": 8, "name": 5, "placeholder": 4, "data-testid": 3, "failed": 12
  },
  "trend": [{ "date": "2026-06-01", "healed": 14, "failed": 2 }]
}
```

**Dashboard page:** Summary chips (heal rate, total healed, total failed), strategy
donut chart, top drifting selectors table, 7-day trend sparkline.

---

## Phase 4 — Interface Map Auto-Update on Successful Heal

**What:** When a heal is logged with `strategy !== 'failed'` and `usedSelector` is
present, update the `InterfaceElement` record to use the new selector going forward. This
prevents the same selector drift from requiring healing in every future session.

**File:** `apps/backend/src/controllers/session.ts` (heal endpoint)

**Change:** After logging the `SelectorHealLog`, if `strategy !== 'failed'` and
`usedSelector` is defined:
1. Find any `InterfaceElement` with `selector = originalSelector` for this org
2. Update its `selector` to `usedSelector` and mark `updatedAt`
3. No migration needed — just a Prisma `updateMany`

This makes the interface map self-correcting: after the first user triggers a heal, all
subsequent users get the correct selector in the agent's interface context.

---

## Success Criteria

- [ ] Agent never sends a stale pre-configured selector to the widget without DOM validation
- [ ] `resolveFromIndex` + remote fingerprint fallback heals pre-configured selector drift silently
- [ ] Dashboard shows heal rate, top drifting selectors, strategy distribution, 7-day trend
- [ ] Interface map auto-corrects after first successful heal (no recurring heals for same drift)
- [ ] All changes committed atomically per phase

---

## Non-Goals (out of scope for this pivot)

- Selector alert settings UI (backend fields exist, low urgency)
- Proactive drift detection before it affects users (requires periodic DOM diffing job)
- Multi-page fingerprint pre-loading (only current step's selector is pre-loaded)
