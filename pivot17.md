# Pivot 17 — User Data: Attribute-Based Personalization

## Problem

The agent already receives user metadata (plan, role, segment, any custom key) and injects it into the AI system prompt as `USER PROFILE`. The plumbing from script tag → widget → backend → AI is fully wired.

But the feature is invisible and incomplete:
- `account_age` has no first-class script tag shorthand (only plan/role/segment do)
- Flow targeting only works on `role`; `plan`, `segment`, `accountAge` can't target flows
- Dashboard shows no user metadata anywhere
- No flow-builder UI for attribute-based personalization rules
- Install snippet has no user-data example, so customers never know to use it

## Goal

Make user attributes a first-class, fully visible, and actually useful personalization primitive — from the install snippet through to the dashboard.

---

## Scope

### 1. Script Tag — Add `account_age` + generic shorthand

**File:** `apps/widget/src/config.ts`

Add `data-ahaget-account-age` as a first-class attribute in `readScriptTagConfig()`:

```ts
if (d.ahagetAccountAge) meta.accountAge = d.ahagetAccountAge;
```

Final supported attributes on the `<script>` tag:
```html
<script src="..."
  data-ahaget-key="ak_live_..."
  data-ahaget-user-id="u_123"
  data-ahaget-plan="pro"
  data-ahaget-role="admin"
  data-ahaget-segment="enterprise"
  data-ahaget-account-age="45"
  data-ahaget-metadata='{"custom":"value"}'
></script>
```

### 2. Backend — Attribute-Based Flow Targeting

**Problem:** `OnboardingFlow.targetRoles` only filters on `role`. Operators can't target flows by plan, segment, accountAge, or custom attributes.

**Solution:** Add a `targetSegments` field (mirrors `targetRoles` pattern) and a generic `targetConditions` JSON for arbitrary attribute matching.

**Schema change** (`apps/backend/prisma/schema.prisma`):
```prisma
model OnboardingFlow {
  ...
  targetRoles      String[] @default([]) @map("target_roles")
  targetSegments   String[] @default([]) @map("target_segments")  // NEW
  targetPlans      String[] @default([]) @map("target_plans")     // NEW
  // targetConditions: [{key, op, value}] for arbitrary attr matching — future
}
```

**Migration:** `apps/backend/prisma/migrations/20260514_add_target_segments_plans/`

**Session start logic** (`apps/backend/src/routes/session.ts`):
Extend the flow-selection query to also match `targetSegments` and `targetPlans` from metadata:
```ts
const userPlan    = (metadata?.plan    as string | undefined) ?? '';
const userSegment = (metadata?.segment as string | undefined) ?? '';

// Priority: role match > segment match > plan match > all-users flow
```

### 3. Agent System Prompt — Richer USER PROFILE

**File:** `apps/backend/src/services/agent.ts`, `buildSystemPrompt()`

Current output:
```
USER PROFILE: {"plan":"free","role":"admin"} — match your language and depth to this user's context.
```

Improve to give the agent more actionable framing:
```
USER PROFILE:
- Plan: free  →  budget-conscious, likely to have limits concerns
- Role: admin
- Segment: enterprise
- Account age: 12 days  →  still in early adoption window

Adapt guidance tone, depth, and upgrade mentions to this profile.
```

Logic: Parse known keys (plan, role, segment, accountAge) and add behavioral hints. Unknown keys shown verbatim.

### 4. Dashboard — User Metadata Visibility

#### 4a. Sessions List — show plan/role badge

**File:** `apps/dashboard/app/(app)/sessions/page.tsx`

Add a "User" column to the sessions table that shows:
- `externalId` (truncated)
- `plan` badge (if present in metadata)
- `role` badge (if present in metadata)

Requires the sessions list API (`GET /api/v1/sessions`) to return `endUser.metadata`.

**Backend:** `apps/backend/src/routes/sessions.ts` — add `endUser: { select: { externalId, metadata } }` to the session list query.

#### 4b. Session Detail — User Profile card

**File:** `apps/dashboard/app/(app)/sessions/[id]/page.tsx`

Add a "User Profile" card in the sidebar showing all metadata key/value pairs. Already available in the session detail response via `session.endUser.metadata`.

#### 4c. Questions page — filter by user attribute

**File:** `apps/dashboard/app/(app)/questions/page.tsx`

Add a "Plan" filter dropdown. Requires the questions API to support `?plan=` query param and join through endUser metadata.

### 5. Flow Builder — Attribute Targeting UI

**File:** `apps/dashboard/app/(app)/flows/[id]/page.tsx`

In the flow settings panel, add a "Target Audience" section:

```
Target Roles:     [admin] [member] [+add]
Target Plans:     [free] [pro] [+add]
Target Segments:  [enterprise] [+add]
```

Saves to the new `targetPlans` and `targetSegments` fields.

### 6. Install Snippet — User Data Example

**File:** `apps/landing` or wherever the docs/install snippet lives

Update the install snippet to show user data:
```html
<script src="https://cdn.ahaget.ai/widget.js"
  data-ahaget-key="ak_live_YOUR_KEY"
  data-ahaget-user-id="{{ current_user.id }}"
  data-ahaget-plan="{{ current_user.plan }}"
  data-ahaget-role="{{ current_user.role }}"
  data-ahaget-account-age="{{ current_user.days_since_signup }}"
></script>
```

Also add a JS init example:
```js
Ahaget('init', {
  apiKey: 'ak_live_...',
  userId: user.id,
  metadata: {
    plan: user.plan,
    role: user.role,
    segment: user.segment,
    accountAge: user.daysSinceSignup,
    company: user.company,         // any custom key works
  }
});
```

---

## Implementation Order

1. **Script tag `account_age`** — 15 min, no migration needed
2. **Agent prompt improvement** — 30 min, improves existing behavior immediately
3. **Session list + detail show metadata** — 1h, pure frontend + small backend change
4. **Schema: `targetPlans` + `targetSegments`** — 45 min (migration + session start logic)
5. **Flow builder targeting UI** — 1.5h
6. **Install snippet docs update** — 20 min

Total: ~1 day

---

## Success Criteria

- [ ] Script tag supports `data-ahaget-account-age`
- [ ] `plan` and `segment` can target specific flows (like `role` does today)
- [ ] Sessions list shows plan/role badges per session
- [ ] Session detail shows full user metadata card
- [ ] Agent prompt references plan/role/accountAge with behavioral hints
- [ ] Install snippet in docs shows user data example
- [ ] Flow builder has Audience targeting panel with plan/segment/role dropdowns

---

## Non-Goals

- Computed attributes (e.g. "in_trial" calculated server-side) — future
- Attribute-based step visibility (show/hide steps by attribute) — future
- Webhook to push metadata updates from customer backend — future
