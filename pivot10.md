# Pivot 10 — Playbook & Triggers: Closing the Gap

## Status Audit

### What's already shipped

**Triggers (~80% done):**
- `TriggerRule` schema with 6 types: `page_visit`, `page_never_visited`, `event_fired`,
  `usage_threshold`, `inactivity`, `feature_unused`
- Full backend CRUD + `/evaluate` endpoint (widget calls this on init)
- Dashboard `/triggers` page — create, toggle, delete all 6 types

**Tone/persona (25% done):**
- `Organization.customInstructions` (2000 chars free text) → injected into agent system prompt
- Dashboard `/settings/ai` page with instructions textarea
- `Organization.languagePreference` field exists in schema but is **never surfaced in the UI**

**Guardrails (20% done):**
- `OnboardingStep.allowedActions` per-step — schema exists but **not exposed in step editor**
- `McpConnector.allowedTools` + `readOnly` — connector-level restriction
- Free-text `customInstructions` (operator writes "never do X" inline) — not structured

**Escalation (20% done):**
- `EscalationTicket` model + ticket queue dashboard
- `escalate_to_human` agent tool fires correctly
- Escalation *conditions* are **hardcoded** in `agent.ts` — no operator config
- No notification routing (no email/Slack/webhook on escalation)

---

## Gaps to Close

### Gap 1 — No "Playbook" as a first-class concept (critical UX gap)
Persona, tone, guardrails, and language are spread across `/settings/ai` (free text),
`/branding` (colors only), and per-step editors. Operators have no single place that says
"here is your agent's personality and rules."

### Gap 2 — Agent name not configurable
The widget hardcodes "Ahaget Assistant." Operators need to set their own assistant name
(e.g., "Aria from Acme") for brand alignment.

### Gap 3 — Language preference UI missing
`Organization.languagePreference` exists in schema but is never shown in the dashboard.
The multilingual Sarvam AI integration is blind to the operator's preference.

### Gap 4 — Guardrails are unstructured
Only free text (`customInstructions`). No structured "must always / must never" rule list.
`OnboardingStep.allowedActions` isn't surfaced in the step editor at all.

### Gap 5 — Escalation conditions are hardcoded
The agent always escalates on: user_requested, repeated_failure, billing/bug/refund.
Operators cannot configure this. They also can't set a notification channel for when
escalation fires.

### Gap 6 — `error_state` trigger type missing
There's no trigger that fires when a detected error appears on the user's page. This is
a listed product feature ("trigger on error state") and the most valuable moment to
proactively intervene.

---

## Pivot 10 Plan

Six targeted additions. Two require schema changes; the rest are frontend + config changes.

---

### Fix 1 — `/playbook` page (new nav entry, unified config)

**Purpose:** Single operator destination for "how does my agent behave?"

**File:** `apps/dashboard/app/(app)/playbook/page.tsx` (new file)
**Nav:** Add `{ href: '/playbook', label: 'Playbook', icon: <PlaybookIcon /> }` to the
AGENT section in `apps/dashboard/components/Sidebar.tsx`, between Triggers and
Lifecycle Engine.

**Page layout (4 cards):**

```
┌─────────────────────────────────────────────────┐
│  PERSONA                                        │
│  Agent name: [Aria]                             │
│  Language:   [English ▾]                        │
│  Tone:       [Friendly] [Formal] [Concise]      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  INSTRUCTIONS                                   │
│  (same textarea as /settings/ai — deduplicate)  │
│  Tell the AI how to behave…                     │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  GUARDRAILS                                     │
│  Must always do: [+ Add rule]                   │
│    • Always confirm before submitting a form    │
│  Must never do:  [+ Add rule]                   │
│    • Never share pricing without asking role    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ESCALATION                                     │
│  Escalate when:                                 │
│    ☑ User explicitly asks for a human           │
│    ☑ Same question fails 3+ times               │
│    ☐ Billing / refund topics (configurable)     │
│  Notify via: [Webhook URL ____________]         │
└─────────────────────────────────────────────────┘
```

All sections call `PUT /api/v1/config/playbook` (one endpoint, partial updates).

---

### Fix 2 — Schema: add `PlaybookConfig` model

**File:** `apps/backend/prisma/schema.prisma`

```prisma
model PlaybookConfig {
  id                  String   @id @default(uuid())
  organizationId      String   @unique @map("organization_id")
  agentName           String   @default("AI Assistant") @map("agent_name")
  tone                String   @default("friendly")      // friendly | formal | concise | custom
  language            String   @default("en")
  mustAlwaysDo        String[] @default([]) @map("must_always_do")
  mustNeverDo         String[] @default([]) @map("must_never_do")
  // Escalation conditions
  escalateOnUserRequest   Boolean @default(true)  @map("escalate_on_user_request")
  escalateOnRepeatedFail  Boolean @default(true)  @map("escalate_on_repeated_fail")
  escalateOnBillingTopics Boolean @default(false) @map("escalate_on_billing_topics")
  escalationWebhook       String? @map("escalation_webhook")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@map("playbook_configs")
}
```

Add `playbookConfig PlaybookConfig?` relation to `Organization`.

Migration: `apps/backend/prisma/migrations/20260507_add_playbook_config/`

---

### Fix 3 — Backend: `PUT /api/v1/config/playbook` endpoint

**File:** `apps/backend/src/routes/config.ts`

```typescript
// GET /api/v1/config/playbook
router.get('/playbook', authenticateJWT, async (req, res) => {
  const config = await prisma.playbookConfig.findUnique({
    where: { organizationId: req.user!.organizationId },
  });
  res.json({ config: config ?? defaultPlaybook });
});

// PUT /api/v1/config/playbook
router.put('/playbook', authenticateJWT, async (req, res) => {
  const data = PlaybookSchema.parse(req.body);
  const config = await prisma.playbookConfig.upsert({
    where: { organizationId: req.user!.organizationId },
    update: data,
    create: { organizationId: req.user!.organizationId, ...data },
  });
  res.json({ config });
});
```

**Acceptance criteria:**
- [ ] GET returns current config or defaults
- [ ] PUT upserts — creates on first save, updates thereafter
- [ ] Agent system prompt builder in `agent.ts` reads `PlaybookConfig` and injects:
  - `AGENT NAME: {agentName}`
  - `TONE: {tone}`
  - `MUST ALWAYS: {mustAlwaysDo.join('; ')}`
  - `MUST NEVER: {mustNeverDo.join('; ')}`

---

### Fix 4 — Agent: inject playbook into system prompt

**File:** `apps/backend/src/services/agent.ts`

In the `runAgentTurn` function (or wherever the system prompt is assembled), load
`PlaybookConfig` for the org and inject before the flow context block:

```typescript
const playbook = await prisma.playbookConfig.findUnique({
  where: { organizationId: orgId },
});

if (playbook) {
  sections.push(`AGENT NAME: ${playbook.agentName}`);
  sections.push(`TONE: ${playbook.tone}`);
  if (playbook.mustAlwaysDo.length)
    sections.push(`MUST ALWAYS DO:\n${playbook.mustAlwaysDo.map(r => `- ${r}`).join('\n')}`);
  if (playbook.mustNeverDo.length)
    sections.push(`MUST NEVER DO:\n${playbook.mustNeverDo.map(r => `- ${r}`).join('\n')}`);
}
```

Also update escalation logic: instead of the hardcoded condition list, check the
org's `PlaybookConfig.escalateOn*` flags before calling `escalate_to_human`.

**Acceptance criteria:**
- [ ] Agent system prompt includes name, tone, must-always, must-never when configured
- [ ] Escalation fires based on configurable flags, not hardcoded strings
- [ ] Widget displays `agentName` instead of "Ahaget Assistant" (pass via session start response)

---

### Fix 5 — Escalation webhook: fire on escalation

**File:** `apps/backend/src/routes/session.ts` (or wherever `escalate_to_human` tool result is handled)

When `escalate_to_human` fires and a `PlaybookConfig.escalationWebhook` is set, POST:

```typescript
const payload = {
  event: 'escalation_created',
  ticketId: ticket.id,
  userId: endUserId,
  reason: tool.reason,
  trigger: tool.trigger,
  sessionId,
  context: { messages: last10Messages, collectedData },
};
await fetch(config.escalationWebhook, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

**Acceptance criteria:**
- [ ] Webhook fires synchronously (best-effort, fire-and-forget with try/catch)
- [ ] Payload includes full context: reason, trigger, session messages, collected data

---

### Fix 6 — `error_state` trigger type

**Schema:** Add `error_state` to `TriggerRule.triggerType` enum docs.
No migration needed — it's stored as a string.

**Backend:** `apps/backend/src/routes/triggers.ts` — add `error_state` case to `/evaluate`:

```typescript
case 'error_state': {
  // Widget sends metadata.hasError = true when an error element is detected on page
  if (meta.hasError === true) matches = true;
  break;
}
```

**Widget:** `apps/widget/src/widget.ts` — on init, scan the DOM for error indicators
(`.error`, `[role="alert"]`, `.alert-danger`, elements with `aria-invalid="true"`) and
pass `metadata.hasError = true` to the trigger evaluate call when found.

**Dashboard:** `apps/dashboard/app/(app)/triggers/page.tsx` — add `error_state` to
`TRIGGER_TYPES` array:

```typescript
{ value: 'error_state', label: 'Error State', icon: '🔴', desc: 'Fire when an error is detected on the page' },
```

**Acceptance criteria:**
- [ ] Widget detects common error DOM patterns and sets `hasError` flag
- [ ] Trigger rule evaluator matches `error_state` when flag is true
- [ ] Dashboard trigger builder shows `error_state` as a selectable type
- [ ] No type-specific fields required (error detection is automatic)

---

### Fix 7 — Surface `agentName` in widget

**File:** `apps/widget/src/widget.ts`

The session start response should include the org's `agentName`. The widget header
currently hardcodes "Ahaget Assistant" — replace with:

```typescript
const agentName = sessionData.agentName ?? 'AI Assistant';
// Use agentName in widget header render
```

**Backend:** `apps/backend/src/routes/session.ts` — include `agentName` from
`PlaybookConfig` in the session start response.

**Acceptance criteria:**
- [ ] Widget header shows configured agent name
- [ ] Falls back to "AI Assistant" if not set

---

## Execution order

1. **Fix 2** — Schema migration (unblocks everything else) — 10 min
2. **Fix 3** — Backend GET/PUT `/config/playbook` — 20 min
3. **Fix 4** — Agent prompt injection + escalation flag checks — 30 min
4. **Fix 1** — Playbook dashboard page — 90 min (most UI work)
5. **Fix 5** — Escalation webhook — 20 min
6. **Fix 6** — Error state trigger type — 30 min (backend + widget + dashboard)
7. **Fix 7** — Agent name in widget — 15 min

**Total: ~3.5 hours**

No existing routes broken. All changes are additive or replace hardcoded strings.
Widget changes are backward-compatible (fallback values everywhere).

---

## Files touched

| File | Change |
|---|---|
| `schema.prisma` | Add `PlaybookConfig` model + relation |
| `migrations/20260507_add_playbook_config/` | New migration |
| `routes/config.ts` | Add GET/PUT `/playbook` handlers |
| `services/agent.ts` | Inject playbook into system prompt; flag-gated escalation |
| `routes/session.ts` | Include `agentName` in session start response; fire escalation webhook |
| `routes/triggers.ts` | Add `error_state` case to evaluate |
| `widget/src/widget.ts` | DOM error detection; use `agentName` from session response |
| `dashboard/app/(app)/playbook/page.tsx` | New page |
| `dashboard/components/Sidebar.tsx` | Add Playbook nav item |
| `dashboard/app/(app)/triggers/page.tsx` | Add `error_state` type |
| `dashboard/lib/api.ts` | Add `playbook.get`, `playbook.update` |
