# pivot5.md — Session Replay Completion

## Audit Result

The data layer and list view are solid. The replay page renders a step timeline but
**does not deliver the core feature promise**: "what the user asked, what the agent did."
Four gaps make the replay hollow.

---

## Gap Analysis

### Gap 1 — Chat transcript missing from replay (highest priority)
**Problem:** `SessionMessage` rows are written on every turn (`session.ts:439-457`) but
`GET /api/v1/sessions/:id` never fetches them. `SessionDetail` type has no `messages` field.
The replay page has no transcript panel — it shows step metadata only.

**Fix scope:** Backend adds messages to the session detail response. Frontend renders a
chat transcript panel in the replay's right column.

---

### Gap 2 — Drop-off never written to DB
**Problem:** `UserStepProgress.outcome` and `dropReason` are never set to `'dropped'`.
`complete_step` sets `outcome: 'completed'` but no code path writes `outcome: 'dropped'`.
Result: `dropStepId` and `dropReason` are null for every session in the list. The replay
drop-off banner never fires. The sessions list drop-off column is always "—".

**Fix scope:** A background cron job (or on-read computation) marks the in-progress step
of sessions that have been inactive > N minutes as `outcome: 'dropped'`. Also add a
`POST /api/v1/session/abandon` endpoint the widget can call on unload/close.

---

### Gap 3 — Sessions never transition to `abandoned`
**Problem:** `UserOnboardingSession.status` is only written as `completed` (in
`applyActionSideEffects`). Sessions where the user closed the widget stay `active` forever.
The "abandoned" filter in the sessions list returns nothing real.

**Fix scope:** A lightweight background job (`setInterval` in `index.ts` or a cron) that
marks sessions `active` with `lastActiveAt` older than 30 min as `abandoned` and writes
the `dropReason` to the current in-progress step.

---

### Gap 4 — Goal-mode turns produce no transcript
**Problem:** `POST /api/v1/session/act/goal` only writes to `auditLog`. It never creates
`SessionMessage` rows. Sessions run in copilot/goal mode are completely invisible in replay.

**Fix scope:** `act/goal` must persist each turn as `SessionMessage` rows (same pattern as
`applyActionSideEffects`), using `stepId: null` since goal mode isn't step-scoped.

---

## Implementation Steps

### Step 1 — Backend: return messages in session detail
**File:** `apps/backend/src/routes/sessions.ts`

In `GET /:id`, add a `prisma.sessionMessage.findMany` query alongside the existing session
fetch. Return a `messages` array on the response (role, content, actionType, createdAt,
stepId, feedback).

Filter out `__init__` and `__verify__` sentinel messages (these are internal — users never
see them). Limit to 200 messages max for replay safety.

### Step 2 — API types: add messages to SessionDetail
**File:** `apps/dashboard/lib/api.ts`

Add `SessionMessage` interface and extend `SessionDetail` with
`messages: SessionMessage[]`.

### Step 3 — Replay page: chat transcript panel
**File:** `apps/dashboard/app/(app)/sessions/[id]/page.tsx`

Add a "Chat Transcript" card in the right column, below the step detail card. Each message
renders as a chat bubble (user = right-aligned, agent = left-aligned). Agent messages show
the `actionType` as a small badge (e.g. `fill_form`, `ask_clarification`). Messages are
scoped to the selected step when a step is active, or show all when none selected.

### Step 4 — Session abandonment: background job
**File:** `apps/backend/src/index.ts`

Add a `setInterval` (runs every 5 min) that:
1. Finds sessions with `status: 'active'` and `lastActiveAt < now - 30min`
2. Marks them `status: 'abandoned'`, sets `completedAt: null`
3. For the session's current in-progress step progress row: sets `outcome: 'dropped'`,
   `dropReason: 'idle_timeout'`, `status: 'in_progress'` (leave as-is — dropped is outcome,
   not status per the schema)

### Step 5 — Widget: fire abandon on close
**File:** `apps/backend/src/routes/session.ts`

Add `POST /api/v1/session/abandon` (API-key auth). Accepts `{ sessionId, stepId?, reason? }`.
Marks session `status: 'abandoned'` and writes `outcome: 'dropped'` + `dropReason` to
the step progress. The widget calls this on `beforeunload` / visibilitychange.

**File:** `apps/widget/src/` (widget core — wherever session lifecycle lives)

On `visibilitychange` (hidden) + `beforeunload`, fire `navigator.sendBeacon` to
`/api/v1/session/abandon` with the current sessionId and stepId.

### Step 6 — Goal mode: persist turns as SessionMessage
**File:** `apps/backend/src/routes/session.ts`

In `POST /api/v1/session/act/goal`, after calling `runAgentGoal`, write two `SessionMessage`
rows: one for the goal text (`role: 'user'`) and one for the action (`role: 'assistant'`,
`actionType: action.type`). Use `stepId: null` (nullable FK — check schema permits this).
Skip the user row for internal sentinel turns if any.

### Step 7 — Type check
`npx tsc --noEmit` in both `apps/backend` and `apps/dashboard`.

---

## Acceptance Criteria

- Open a completed session replay → right column shows every user message and agent
  response in order, with action badges on agent turns
- Open an abandoned session → status badge shows "abandoned", drop-off banner shows the
  step where the user left, sessions list shows non-null drop-off column for that session
- Run a goal-mode session → replay shows the goal turns as transcript entries
- "Abandoned" filter in sessions list returns real rows within 30 min of a user leaving
