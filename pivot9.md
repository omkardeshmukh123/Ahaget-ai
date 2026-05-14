# Pivot 9 — "Create Your Flows" UX Completion

## Status Audit

### What's fully shipped
- `OnboardingFlow` schema: all 4 types (onboarding | adoption | support | upsell | retention)
- Backend CRUD: `GET/POST/PUT/DELETE /api/v1/flow` + steps sub-resource
- Flow selector: priority-based matching (`retention > upsell > adoption > onboarding > support`)
- Dashboard `/flows` list: type filter, toggle live/draft, create, delete
- Dashboard `/flows/[id]` editor: step list, AI prompt, smart questions, action type, guardrails
- Widget runtime: session start/resume, progress bar, step-by-step guidance, trigger evaluation
- Script tag attributes: `data-ahaget-plan/role/segment/user-id` → merged into every agent system prompt
- Backend `FLOW_TEMPLATES` library + `/from-template` endpoint (4 templates wired)

### The gaps

**Gap 1 — Template picker not exposed (high value)**
The backend has `GET /api/v1/flow/templates` and `POST /api/v1/flow/from-template`, but the
dashboard "New flow" dialog has no template step. Operators build every flow from a blank
step list. The existing onboarding/adoption/support/upsell templates go unused.

**Gap 2 — No flow-level goal statement (product accuracy)**
The product copy says "the agent knows what done looks like." The current schema has only
per-step `completionEvent`. There is no `goal` field at the flow level that the agent system
prompt can anchor to. The agent can complete individual steps but has no top-level success
definition to orient around.

**Gap 3 — `targetUrl` (page mapping) not in step editor**
`OnboardingStep.targetUrl` exists in the schema and the widget handles it (offers navigation
if the user is on the wrong page), but the field is not exposed in the `/flows/[id]` step
form. Operators cannot configure "this step runs on /settings/billing" from the dashboard.

**Gap 4 — Feature adoption flow has no `featureSlug` binding in create UX**
`TriggerRule.featureSlug` + `feature_unused` trigger type exist in the schema, but the flow
editor doesn't surface a "which feature is this flow teaching?" field for adoption flows.
Without it, operators can't tie an adoption flow to the right trigger rule from the flow
creation experience.

---

## Pivot 9 Plan

Four targeted UI additions. No schema migrations needed. All changes are frontend-only
(dashboard) except Gap 2 which requires a one-line agent prompt change.

---

### Fix 1 — Template picker in "New flow" dialog (~80 lines)

**File:** `apps/dashboard/app/(app)/flows/page.tsx`

Replace the current "What type of flow?" + name input with a two-step form:

**Step A — Template gallery:**
Fetch `GET /api/v1/flow/templates` on modal open. Render cards:
```
[Blank onboarding]  [SaaS onboarding]  [Feature adoption]  [Support deflection]
[Blank adoption]    [Upsell at limit]  — from backend templates list
```
Each card shows: name, stepCount badge, 1-line description.

**Step B — Name + confirm:**
After template selection, show name input (pre-filled with template name, editable).
"Create" calls `POST /api/v1/flow/from-template` if a template was chosen, or the existing
`POST /api/v1/flow` for blank.

```typescript
// In FlowsPage — replace showNew inline form:
const [step, setStep] = useState<'type' | 'template' | 'name'>('type');
const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

async function createFlow() {
  if (selectedTemplate) {
    const d = await api.flow.createFromTemplate(selectedTemplate, newName.trim());
    router.push(`/flows/${d.flow.id}`);
  } else {
    const d = await api.flow.create(newName.trim(), undefined, newType);
    router.push(`/flows/${d.flow.id}`);
  }
}
```

Add to `apps/dashboard/lib/api.ts`:
```typescript
createFromTemplate: async (templateId: string, name?: string) => {
  const r = await authFetch('/api/v1/flow/from-template', {
    method: 'POST',
    body: JSON.stringify({ templateId, name }),
  });
  return r.json();
},
```

**Acceptance criteria:**
- [ ] "New flow" modal shows template gallery fetched from backend
- [ ] Selecting a template pre-fills the name field
- [ ] Creating from template lands on `/flows/[id]` with all steps pre-populated
- [ ] "Start blank" option still available for each flow type

---

### Fix 2 — Flow-level goal statement (~25 lines total)

**Files:** `apps/dashboard/app/(app)/flows/[id]/page.tsx`, `apps/backend/src/services/agent.ts`

#### A — Dashboard: add `goal` textarea to flow editor header

Below the flow name/description in `FlowEditorPage`, add:

```tsx
<div className="mb-4">
  <label className="text-xs font-medium text-slate-500 block mb-1">
    Flow goal — what does success look like?
  </label>
  <textarea
    value={flowGoal}
    onChange={(e) => setFlowGoal(e.target.value)}
    placeholder="User has connected their first data source and seen their first chart."
    rows={2}
    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm ..."
  />
  <p className="text-xs text-slate-400 mt-1">
    The AI uses this to know when the flow is truly complete.
  </p>
</div>
```

Save via existing `PUT /api/v1/flow/:id` — add `description` field update (or repurpose
`description` as the goal field; the schema already has it, it's just not prominently
surfaced as "goal").

**Actually:** `OnboardingFlow.description` already exists. Rename its label in the UI from
"Description" to "Flow goal — what does success look like?" and move it above the steps
list. No schema change needed.

#### B — Agent: inject flow goal into system prompt

In `apps/backend/src/services/agent.ts`, in the section that builds the system prompt
(search for `FLOW CONTEXT` or similar), add:

```typescript
if (flow.description) {
  sections.push(`FLOW GOAL: ${flow.description}`);
}
```

This ensures every agent turn knows the end state to drive toward.

**Acceptance criteria:**
- [ ] Flow editor shows "Flow goal" prominently above steps
- [ ] Saving a goal description persists via existing PUT endpoint
- [ ] Agent system prompt includes `FLOW GOAL: ...` when description is set

---

### Fix 3 — `targetUrl` (page) field in step editor (~15 lines)

**File:** `apps/dashboard/app/(app)/flows/[id]/page.tsx`

In the `StepForm` component, add a `targetUrl` field to the 3-column bottom grid:

```tsx
<div>
  <label className="text-xs font-medium text-slate-500 block mb-1">
    Target page (optional)
  </label>
  <input
    value={(step as OnboardingStep).targetUrl ?? ''}
    onChange={(e) => set('targetUrl', e.target.value || null)}
    placeholder="/settings/billing"
    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm ..."
  />
  <p className="text-xs text-slate-400 mt-1">
    Widget will offer to navigate if user is on a different page.
  </p>
</div>
```

Also add `targetUrl` to the `PUT /api/v1/flow/:id/steps/:stepId` handler body destructure
in `flow.ts` (it currently doesn't include it):

```typescript
// In flow.ts PUT /:id/steps/:stepId
const { ..., targetUrl } = req.body as Record<string, unknown>;
// In update data:
...(targetUrl !== undefined && { targetUrl: targetUrl as string | null }),
```

**Acceptance criteria:**
- [ ] Step form shows "Target page" input
- [ ] Saving persists `targetUrl` to DB
- [ ] Widget continues to handle navigation offers correctly (no widget change needed)

---

### Fix 4 — Feature slug binding for adoption flows (~20 lines)

**File:** `apps/dashboard/app/(app)/flows/[id]/page.tsx`

When `flow.flowType === 'adoption'`, show a conditional field below the goal:

```tsx
{flow.flowType === 'adoption' && (
  <div className="mb-4">
    <label className="text-xs font-medium text-slate-500 block mb-1">
      Feature slug
    </label>
    <input
      value={featureSlug}
      onChange={(e) => setFeatureSlug(e.target.value)}
      placeholder="csv-import"
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm ..."
    />
    <p className="text-xs text-slate-400 mt-1">
      Identifier for the feature this flow teaches. Used by trigger rules to fire
      only when the feature hasn't been used.
    </p>
  </div>
)}
```

Save via `PUT /api/v1/flow/:id` — `triggerCondition` JSON already stores arbitrary keys:

```typescript
await api.flow.update(id, {
  triggerCondition: { ...flow.triggerCondition, featureSlug },
});
```

In the triggers page / trigger rule creation, pre-fill `featureSlug` from the flow's
`triggerCondition.featureSlug` when the user links a `feature_unused` rule to an adoption
flow. (Read-only cross-link — no new API needed.)

**Acceptance criteria:**
- [ ] Adoption flows show "Feature slug" field in editor
- [ ] Value persists in `triggerCondition.featureSlug`
- [ ] Triggers page can read and display this slug when creating a `feature_unused` rule

---

## Execution order

1. Fix 3 — `targetUrl` in step editor (15 min, high completeness value, no dependencies)
2. Fix 2 — rename `description` → goal label + agent prompt injection (10 min)
3. Fix 1 — template picker (60 min, highest onboarding value for new operators)
4. Fix 4 — feature slug for adoption flows (20 min, adoption flow completeness)

All changes are dashboard-side except the 1-line agent prompt change in Fix 2.
No schema migrations. No widget changes.
