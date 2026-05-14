# Pivot 11 — Session Tracking: Gaps & Completion Plan

## Status Audit

The core session tracking feature landed in pivot10, but the "hand off to your team, with full context" slice is unbuilt. Gaps below, ordered by user impact.

---

## What's Already Working

| Area | File | Status |
|---|---|---|
| Sessions list page (pagination, status filter, search) | `dashboard/app/(app)/sessions/page.tsx` | ✅ Done |
| Session replay detail — step timeline, step cards, chat transcript, collected data, user metadata | `dashboard/app/(app)/sessions/[id]/page.tsx` | ✅ Done |
| Backend list + get routes (JWT, plan gate `sessionReplay`) | `backend/src/routes/sessions.ts` | ✅ Done |
| API client + TypeScript types | `dashboard/lib/api.ts` | ✅ Done |
| Sidebar nav — Sessions in ANALYTICS section | `dashboard/components/Sidebar.tsx` | ✅ Done |
| Plan gate — Starter+ | `backend/src/lib/plans.ts` | ✅ Done |
| Auto-escalation by agent (`escalate_to_human` action type) | `backend/src/services/escalation.ts` | ✅ Done |

---

## Gaps

### Gap 1 — Manual "Hand Off to Team" from Session Replay (Critical)

**What's missing:** No button in the session replay page to manually create an escalation ticket. A support lead sees a struggling session and has no way to hand it off with context pre-loaded.

**The feature description literally says:** *"when to hand off to your team, with full context"*

**What needs to be built:**
- "Hand Off" button in `sessions/[id]/page.tsx` header area
- `POST /api/v1/escalations/manual` endpoint — creates an `EscalationTicket` with `trigger: 'manual'`, pre-populates `reason`, `agentMessage` (last AI message), `sessionId`, `endUserId`, `stepId` (current step)
- New `api.escalations.createManual(sessionId, notes?)` client method
- Confirmation modal: shows user, flow, step, optional notes field before submitting
- After submit: shows success state with link to the created ticket

**Data already available in session detail response:** user, flow, steps, messages, collected data — nothing new to fetch.

---

### Gap 2 — Session ↔ Escalation Ticket Bidirectional Linking (High)

**What's missing:** When the agent auto-escalates (`escalate_to_human` detected in messages), the session replay shows an action badge but there's no link to the escalation ticket. From the escalation ticket UI, there's no link back to the originating session.

**What needs to be built:**

*Backend:*
- `GET /api/v1/sessions/:id` — add `escalationTicketId` to response (join on `sessionId` in `EscalationTicket`)
- `GET /api/v1/escalations/:id` — already returns `sessionId`; confirm it's exposed in the API response and type

*Frontend — session replay:*
- If `session.escalationTicketId` exists, show a banner: *"This session was escalated — [View ticket →]"*
- Banner links to `/escalations` (or `/escalations?highlight=<ticketId>` when the escalations page supports deep-linking)

*Frontend — escalation ticket detail:*
- Add *"View session →"* link that navigates to `/sessions/<sessionId>`

---

### Gap 3 — Server-Side Search + Date Range Filter (Medium)

**What's missing:** Search is client-side across one loaded page (25 rows). If there are 500 sessions, searching "john" only searches the first 25. Date range filter doesn't exist — no way to look at sessions from a specific week.

**What needs to be built:**

*Backend — `GET /api/v1/sessions`:*
- Accept `q` query param — Prisma `contains` on `endUser.externalId` and `flow.name`
- Accept `from` and `to` query params — filter on `startedAt`

*Frontend — sessions list page:*
- Move search `input` onChange to debounced API call (300ms) instead of local array filter
- Add date range picker (two `<input type="date">` fields, `from` / `to`) next to status pills
- Reset offset to 0 on filter change

---

### Gap 4 — Live Session Indicator + Auto-Refresh (Medium)

**What's missing:** Active sessions have `status: 'active'` but the UI shows them identically to completed sessions. There's no live indicator and no refresh — a team member watching an active session sees a stale transcript.

**What needs to be built:**

*Session replay page:*
- If `session.status === 'active'`, show a pulsing green dot and "Live" label in the header
- Poll `GET /api/v1/sessions/:id` every 10 seconds while status is `active`
- New messages and step status changes update in place without full remount
- Stop polling when status transitions to `completed` or `abandoned`

---

### Gap 5 — User History Deep-Link from Session (Low)

**What's missing:** The `endUser.externalId` displayed in session replay is just a monospace text label. Clicking it doesn't navigate to the user's full history across all sessions.

**What needs to be built:**
- Wrap `externalId` (and the "User" KPI card) in a `<Link href="/users">` (or `/users?highlight=<userId>` if the users page supports it)
- The Users page already has `api.users.history(userId)` wired — it just needs to be linkable

---

### Gap 6 — Session Export / Shareable Transcript (Low)

**What's missing:** No way to export or share a session replay. For async handoffs, a team member can't send a colleague a transcript or a direct link.

**What needs to be built:**
- "Copy link" button that copies the full URL (`/sessions/<id>`) to clipboard
- "Export transcript" button that generates a plain-text or JSON download of messages + step summary
- No new backend required — everything is already in the session detail response

---

## Implementation Order

| Priority | Gap | Effort | Why first |
|---|---|---|---|
| 1 | Manual hand-off button + endpoint | M (1–2 days) | Core of the stated feature. Zero value without it. |
| 2 | Session ↔ escalation linking | S (0.5 day) | Closes the loop from gap 1; escalation tickets already have sessionId |
| 3 | Server-side search + date filter | M (1 day) | Useless at scale without it |
| 4 | Live session indicator + polling | S (0.5 day) | Big UX win for support teams watching active sessions |
| 5 | User history deep-link | XS (1 hour) | Low effort, unblocks cross-session context |
| 6 | Export / copy link | XS (1 hour) | Nice-to-have for async collaboration |

**Estimated total: ~4–5 days of focused work.**

---

## New Backend Endpoint Spec

### `POST /api/v1/escalations/manual`

Auth: JWT (`authenticateJWT` + `requireFeature('failureInbox')`)

Request body:
```json
{
  "sessionId": "string",
  "notes": "string (optional)"
}
```

Logic:
1. Fetch session by `sessionId` + `organizationId` (security check)
2. Find the last `assistant` message in `SessionMessage` for the session → `agentMessage`
3. Find the current in-progress or last-completed step → `stepId`
4. Create `EscalationTicket` with:
   - `trigger: 'manual'`
   - `reason: notes ?? 'Manual handoff from session replay'`
   - `agentMessage`: last assistant message content
   - `sessionId`, `endUserId`, `stepId`, `organizationId`
   - `status: 'open'`
5. Return `{ ticket: { id, status, createdAt } }`

### Updated `GET /api/v1/sessions/:id`

Add to response:
```json
{
  "session": {
    ...existing fields,
    "escalationTicketId": "string | null"
  }
}
```

Join: `prisma.escalationTicket.findFirst({ where: { sessionId: id, organizationId } })` then attach `?.id`.

---

## Frontend Spec — Hand Off Button

Location: Session replay page header, right of the status badge.

```
[Session Replay]  ●  completed        [↗ Hand Off to Team]
```

Button behavior:
1. Click → open modal
2. Modal shows: User ID, Flow name, Current step, optional Notes textarea
3. "Hand Off" submits → calls `api.escalations.createManual(sessionId, notes)`
4. On success: replace button with `✓ Handed off · View ticket →` (links to `/settings/audit` or a dedicated escalations page)
5. On error: show inline error message

---

## Files to Create / Edit

| File | Change |
|---|---|
| `backend/src/routes/escalations.ts` | Add `POST /manual` route |
| `backend/src/routes/sessions.ts` | Add `escalationTicketId` to GET /:id response |
| `dashboard/lib/api.ts` | Add `api.escalations.createManual()`, update `SessionDetail` type to include `escalationTicketId` |
| `dashboard/app/(app)/sessions/[id]/page.tsx` | Add hand-off button, escalation banner, live polling |
| `dashboard/app/(app)/sessions/page.tsx` | Move search to server-side, add date range filter |

No new pages required. No schema migrations required — `EscalationTicket` already has `sessionId`, `trigger`, and `reason` fields.
