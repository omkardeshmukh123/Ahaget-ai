# Pivot 7 — Interface Map: Fix Critical Auth Bug + Snapshot Hygiene

## Status Audit: Feature 02 "Train Ahaget on your interface"

### What's fully shipped
- `scanner.ts` — full DOM scan: buttons, inputs, selects, textareas, links; fingerprinted with
  selector, text, ariaLabel, placeholder, name, dataTestId, role, classes, rect
- `buildSemanticSummary()` — real-time page state (wizard step, filled/required fields, errors, primary action)
- `inspector.ts` — inspector overlay: element highlighting, per-element annotation panel,
  MutationObserver rescan, SPA route-change watcher, framework detection
- Per-element annotation: customLabel, customDescription, businessRule, isSensitive, elementType override
- Schema: `InterfacePageSnapshot` + `InterfaceElement` with full CRUD routes
- Agent: `loadInterfaceContext` → `interfaceMapSection` injected into every system prompt turn
- Dashboard: `/interface` page — snapshot list, annotation progress bar, element grid,
  annotation slide-out panel, search/filter by type, archive

### Critical bug
**`/capture` requires JWT; the widget inspector sends `X-API-Key`.**

`interfaceMap.ts:91` — `router.use(authenticateJWT)` gates all routes below it,
including `POST /capture`. But `inspector.ts:396-401` sends only `X-API-Key` (the
same credential the widget uses everywhere). Every "Save Capture" click returns 401.
The feature's core interaction is entirely broken.

### Secondary gaps
1. **Duplicate snapshots** — each inspector save creates a new snapshot. For the same
   URL the agent matches ALL active snapshots, so repeated captures produce conflicting
   or redundant annotations with no cleanup path.
2. **No state label input in inspector** — `stateLabel` is hard-coded to `'Default'`.
   Operators can't capture and label distinct states ("Modal open", "Payment error",
   "Free plan view") from the inspector UI.

---

## Pivot 7 Plan

Three targeted fixes, in priority order. No schema migration required.

---

### Fix 1 — Auth bug on `/capture` (CRITICAL, ~10 lines)

**File:** `apps/backend/src/routes/interfaceMap.ts`

Move the `/capture` route ABOVE `router.use(authenticateJWT)` and add
`authenticateApiKey` middleware directly, matching the pattern used by `/context`.
The orgId comes from `(req as AuthenticatedRequest).organization?.id` (same as
the context endpoint).

```typescript
// Before the JWT block:
router.post('/capture', authenticateApiKey, async (req: Request, res: Response) => {
  const orgId = (req as AuthenticatedRequest).organization?.id;
  if (!orgId) { res.status(401).json({ error: 'Unauthorized' }); return; }
  // ... rest of handler unchanged
});
```

Remove the duplicate `router.post('/capture', ...)` that currently sits after
`router.use(authenticateJWT)`.

**Acceptance criteria:**
- [ ] Inspector "Save Capture" returns 201 when called with a valid API key
- [ ] Returns 401 with an invalid key
- [ ] Dashboard JWT-auth routes (list, detail, patch, delete) still require JWT

---

### Fix 2 — Upsert semantics on `/capture` (snapshot hygiene, ~20 lines)

Instead of always creating a new snapshot, upsert by `(organizationId, url, stateLabel)`.
If an active snapshot already exists for that combo, replace its elements.

```typescript
// Inside the /capture handler, replace prisma.interfacePageSnapshot.create with:

// 1. Find existing active snapshot for this org+url+stateLabel
const existing = await prisma.interfacePageSnapshot.findFirst({
  where: { organizationId: orgId, url: url.trim(), stateLabel: stateLabel?.trim() || 'Default', isActive: true },
  select: { id: true },
});

let snapshot;
if (existing) {
  // Delete old elements and replace
  await prisma.interfaceElement.deleteMany({ where: { snapshotId: existing.id } });
  snapshot = await prisma.interfacePageSnapshot.update({
    where: { id: existing.id },
    data: {
      title: title?.trim() || url.trim(),
      framework: framework?.trim() || 'unknown',
      elementCount: elements.length,
      annotatedCount: 0,
      capturedAt: new Date(),
      elements: { create: elements.map(mapElement) },
    },
    include: { elements: { select: { id: true, tag: true, selector: true, text: true, elementType: true } } },
  });
} else {
  snapshot = await prisma.interfacePageSnapshot.create({ data: { ... }, include: { ... } });
}
```

Extract the element-mapping logic into a `mapElement()` helper to avoid repeating it.

**Acceptance criteria:**
- [ ] Saving the same URL+stateLabel twice results in 1 snapshot, not 2
- [ ] Re-save updates the element list and resets annotatedCount to 0
- [ ] Different stateLabels for the same URL create separate snapshots

---

### Fix 3 — State label input in inspector UI (~15 lines)

**File:** `apps/widget/src/inspector.ts`

Add a text input to the toolbar so the operator can name the current capture state
before clicking Save. Wire the value into `handleSave`.

```typescript
// In createToolbar(), replace the inner HTML Save button section with:
bar.innerHTML = `
  <div class="dot"></div>
  <span>Ahaget Inspector</span>
  <span><span class="stat" id="ahaget-el-count">0</span> elements</span>
  <span><span class="stat" id="ahaget-ann-count">0</span> annotated</span>
  <input id="ahaget-state-label" placeholder="State label (e.g. Modal open)"
    style="padding:5px 10px;border-radius:6px;font-size:11px;border:1px solid rgba(99,102,241,0.3);
           background:#0f0f23;color:#e2e2ef;outline:none;width:180px;" />
  <button id="ahaget-save-btn">Save Capture</button>
`;
```

```typescript
// In handleSave(), replace hard-coded stateLabel:
const stateLabel = (document.getElementById('ahaget-state-label') as HTMLInputElement)?.value.trim() || 'Default';
```

**Acceptance criteria:**
- [ ] Inspector toolbar shows a text input defaulting to empty (placeholder "State label")
- [ ] Saving with no input → stateLabel = 'Default'
- [ ] Saving with "Modal open" → stateLabel = 'Modal open'; creates a separate snapshot
    from the Default one (thanks to Fix 2 upsert key)

---

## Execution order
1. Fix 1 first — unblocks the entire feature
2. Fix 2 second — prevents snapshot accumulation before any real usage starts
3. Fix 3 last — UX polish, no functional dependency on 1 or 2

All three fit in a single PR. No migrations needed.
