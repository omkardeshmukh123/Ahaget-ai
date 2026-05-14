# pivot4.md — Session-Level Tracking

## Audit Result

The **data layer is fully built** (schema, backend routes, API client types).
What is **missing** is the dashboard UI that surfaces it.

### What exists (keep)
- `UserOnboardingSession`, `SessionMessage`, `UserStepProgress` Prisma models
- `GET /api/v1/sessions/:id` — full session detail with merged step progress
- `GET /api/v1/sessions/audit` — org-wide audit log
- `api.sessions.get()` in dashboard API client
- `SessionDetail` / `SessionStepDetail` types

### What is missing (build)
1. **Sessions list page** — `/sessions` — table of all flow sessions with status, flow name, user, completion
2. **Session replay page** — `/sessions/[id]` — full replay: step timeline, chat transcript, collected data, drop-off reason
3. **Backend: session list route** — `GET /api/v1/sessions` — paginated list for dashboard
4. **Drop-off indicator** on conversation detail `/conversations/[id]` — link to related session

## Implementation Steps

### Step 1 — Backend: Add session list endpoint
File: `apps/backend/src/routes/sessions.ts`
Add `GET /` route returning paginated `UserOnboardingSession` list with flow name, endUser, step counts.

### Step 2 — API client: Add `sessions.list()`
File: `apps/dashboard/lib/api.ts`
Add `sessions.list({ limit, offset, status? })` method and `SessionListItem` type.

### Step 3 — Sessions list page
File: `apps/dashboard/app/(app)/sessions/page.tsx`
Table: User · Flow · Status · Steps completed · Duration · Drop-off step · Started at → link to replay.

### Step 4 — Session replay page
File: `apps/dashboard/app/(app)/sessions/[id]/page.tsx`
Two-column layout:
- Left: step timeline with status icons (completed ✓ / dropped ✗ / not started ○), time spent, AI-assisted flag
- Right: chat transcript (from SessionMessage via conversations API), collected data, user metadata

### Step 5 — Sidebar nav
Add "Sessions" link to sidebar pointing to `/sessions`.

### Step 6 — Type check
`npx tsc --noEmit` across backend and dashboard.
