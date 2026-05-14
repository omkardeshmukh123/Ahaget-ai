# Ahaget — Pivot 2: Train on Your Interface

> Last updated: 2026-05-03
> Status: Planning — nothing below is built yet unless marked ✅
> Depends on: Pivot 1 Phase 1 (Unified Flow Engine) — recommended but not required

---

## The Feature in One Sentence

> Navigate to any page in your product; Ahaget's inspector captures every element — fields, buttons, dropdowns, modals, error states — and lets you annotate each one with business context so the agent understands your product at the element level, not just the document level.

---

## Why This Matters (Product Strategist View)

### The problem with the current KB

Today's Knowledge Base is **document-level intelligence**: crawl a URL, upload a file, write an article. The agent can answer *"what does this feature do?"* but cannot reason about *"this specific dropdown means the user is selecting their billing entity, and selecting 'Personal' before they've verified their identity will cause a payment failure on submit"*.

The gap: **element-level business logic is locked inside engineers' heads.** No doc exists for it. Crawling won't surface it. The agent is blind to it.

### What "Train on Interface" unlocks

| Before | After |
|---|---|
| Agent knows what pages exist | Agent knows what every interactive element *means* |
| Agent fills forms by guessing field intent from placeholder text | Agent fills forms knowing business rules per field (e.g. "this field expects E.164 format") |
| Agent sees an error state and describes it generically | Agent sees `class="billing-error"` and knows "this means the user's card issuer blocked the charge — tell them to try a different card, not to contact support" |
| Agent works on standard React/Next apps reasonably well | Agent works correctly on any framework because element understanding is framework-agnostic |

### Competitive differentiation

| | Intercom | Appcues | Whatfix | **Ahaget with Pivot 2** |
|---|---|---|---|---|
| DOM-aware | No | No | Partial (static step recording) | **Yes — live + annotated** |
| Element-level business logic | No | No | No | **Yes** |
| Framework agnostic | N/A | N/A | Partially | **Yes** |
| Updates automatically when UI changes | No | No | No (breaks tours) | **Yes — live scan + self-healing** |
| Reviewer UX for non-engineers | No | No | No | **Yes — dashboard annotation UI** |

---

## Audit: What Already Exists (Do Not Rebuild) ✅

### Widget — `scanner.ts`
- `scanPage()` already captures: tag, selector, text, type, ariaLabel, placeholder, name, dataTestId, role, classes[], rect
- `buildSemanticSummary()` classifies page type, wizard state, required/filled fields, errors, primary button
- The element index (`_elementIndex`) is live and rebuilt on every agent message turn
- Self-healing resolver (`resolver.ts`) can recover broken selectors via fingerprint fallback

**Verdict**: The *live scanning engine* is production-grade. Pivot 2 does NOT touch it. We build a **capture + persist + annotate** layer on top.

### Backend — `KnowledgeBaseArticle`
- Text-level KB with vector + BM25 hybrid search ✅
- Page URL scoping (`pageUrlPattern`) ✅

**Verdict**: This is the *document-level* store. Pivot 2 adds a parallel *element-level* store. They are additive, not competing.

### Backend — `OnboardingStep.actionConfig`
- Already stores CSS selectors per step action ✅

**Verdict**: This is per-step, not per-element across the whole product. Pivot 2 is org-wide, persistent, and reviewer-managed.

---

## What Needs to Be Built — Phased Plan

---

### Phase 1 — Interface Capture Engine (Widget + Backend)

**Goal**: Let the SaaS owner click a button in the dashboard that says "Capture Interface", which opens their product URL in an inspector mode and sends the live element scan back to Ahaget for persistence.

#### 1A — Widget: Inspector Mode

Add a second operating mode to the widget: `mode=inspector` (toggled by URL param `?ahaget_inspect=1` + org API key header).

When inspector mode is active:
- Run `scanPage()` on load and after every route change (SPA-aware via `popstate` + `MutationObserver` on the root)
- Highlight detected elements with a subtle teal ring (visually distinct from normal widget styling)
- On click of any highlighted element, open a lightweight annotation sidebar (injected into the page)
- Annotation sidebar fields:
  - **Label** (human name, e.g. "Billing entity selector")
  - **Description** (free text, e.g. "Dropdown to select account type. Must match legal entity on file.")
  - **Business rule** (structured, e.g. "If value = 'Personal', disable Submit until email verified")
  - **Sensitive** toggle (masks value in agent context — extend existing sensitive field logic)
  - **Element type override** (in case scanner mis-classified: field / button / link / modal trigger / error indicator)
- "Done" sends a `POST /api/v1/interface-map/capture` with the full element snapshot + annotations

**Files to create/modify:**
- `apps/widget/src/inspector.ts` (new) — inspector mode UI, highlight overlay, annotation sidebar
- `apps/widget/src/index.ts` — detect `ahaget_inspect` param, boot inspector instead of copilot
- `apps/widget/src/scanner.ts` — export `scanPage()` result type for reuse in inspector (already done ✅)

#### 1B — Backend: Interface Map API

New Prisma models:

```prisma
// ─── InterfacePageSnapshot ────────────────────────────────────────────────────
// One captured state of a page in the customer's product.
// Multiple snapshots can exist per URL (captured at different times).
model InterfacePageSnapshot {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  url            String                          // captured page path (e.g. /settings/billing)
  title          String                          // document.title at capture time
  framework      String   @default("unknown")    // react | vue | angular | vanilla | server
  capturedAt     DateTime @default(now()) @map("captured_at")
  isActive       Boolean  @default(true) @map("is_active") // false = archived/replaced

  organization Organization        @relation(...)
  elements     InterfaceElement[]

  @@index([organizationId, url])
  @@map("interface_page_snapshots")
}

// ─── InterfaceElement ──────────────────────────────────────────────────────────
// One captured and optionally annotated DOM element.
model InterfaceElement {
  id          String   @id @default(uuid())
  snapshotId  String   @map("snapshot_id")
  // ── Raw scanner data (from ScannedElement) ───────────────────────────────────
  tag         String
  selector    String
  text        String
  elementType String   @map("element_type")      // button | input | select | textarea | link | modal_trigger | error_indicator
  inputType   String?  @map("input_type")         // input[type] if applicable
  ariaLabel   String?  @map("aria_label")
  placeholder String?
  name        String?
  dataTestId  String?  @map("data_test_id")
  role        String?
  classes     String[] @default([])
  rect        Json     @default("{}")             // {x, y, w, h} at capture time
  // ── Human annotation ─────────────────────────────────────────────────────────
  customLabel       String? @map("custom_label")       // human-readable name
  customDescription String? @map("custom_description") // what this element does
  businessRule      String? @map("business_rule")      // structured business logic note
  isSensitive       Boolean @default(false) @map("is_sensitive")
  // ── Meta ─────────────────────────────────────────────────────────────────────
  annotatedAt DateTime? @map("annotated_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  snapshot InterfacePageSnapshot @relation(...)

  @@index([snapshotId])
  @@index([snapshotId, selector])
  @@map("interface_elements")
}
```

New backend route file: `apps/backend/src/routes/interfaceMap.ts`

```
POST   /api/v1/interface-map/capture               — bulk-create snapshot + elements from widget scan
GET    /api/v1/interface-map/snapshots              — list all captured pages for org
GET    /api/v1/interface-map/snapshots/:id          — get one snapshot + elements
PATCH  /api/v1/interface-map/elements/:id          — update annotation on one element
DELETE /api/v1/interface-map/snapshots/:id         — archive snapshot
GET    /api/v1/interface-map/context?url=<path>    — agent-facing: returns annotated elements for current page
```

**Effort**: Medium-High — new Prisma models + migration + 5 API routes + inspector widget mode

---

### Phase 2 — Dashboard Review & Annotation UI

**Goal**: SaaS owner can open the "Interface" section in the dashboard, see all captured pages, review detected elements, and add/edit annotations without touching code.

#### New dashboard section: `/interface`

**Page: Interface Map** (`apps/dashboard/app/(app)/interface/page.tsx`)

Layout:
```
[Sidebar]   [Page selector — breadcrumb nav: /settings → /settings/billing → ...]
            [Framework badge: React | Vue | etc.]
            [Last captured: 3 hours ago | Re-capture button]

            [Element table / card grid]
              Each element card shows:
              - Tag + selector (monospace, truncated)
              - Detected type badge (button / input / select / ...)
              - Current value at capture time
              - Annotation status: ✅ Annotated | ○ Unannotated
              - [Edit annotation] button → slide-out panel
```

Annotation slide-out panel:
- Label field
- Description textarea
- Business rule textarea (with placeholder examples: "This field requires E.164 phone format", "Selecting 'Enterprise' unlocks SSO settings below", "Error class='plan-limit-error' means the user has hit their seat cap — do not suggest a retry")
- Sensitive toggle
- Element type override dropdown
- Save → PATCH `/api/v1/interface-map/elements/:id`

Stats bar at top:
- Pages captured: N
- Elements detected: N
- Annotated: N (%)
- Last capture: time ago

**Effort**: Medium — dashboard UI only, all data from Phase 1 API

---

### Phase 3 — Agent Integration (Element-Level Context at Session Start)

**Goal**: When the agent starts a session on page `/settings/billing`, it loads the annotated element map for that page and prepends it to the system prompt — before any conversation turn.

#### Changes to `agent.ts` (backend service)

New function: `loadInterfaceContext(orgId, pageUrl)`

```typescript
// Fetches annotated elements for the current page URL.
// Returns a compact string injected into the system prompt.
async function loadInterfaceContext(orgId: string, pageUrl: string): Promise<string> {
  const snapshot = await getActiveSnapshot(orgId, pageUrl); // fuzzy URL match
  if (!snapshot) return '';

  const annotated = snapshot.elements.filter(e => e.customLabel || e.businessRule);
  if (annotated.length === 0) return '';

  const lines = annotated.map(e => {
    const parts = [`[${e.elementType}] "${e.customLabel || e.text}" (${e.selector})`];
    if (e.customDescription) parts.push(`Description: ${e.customDescription}`);
    if (e.businessRule)      parts.push(`Rule: ${e.businessRule}`);
    if (e.isSensitive)       parts.push(`Sensitive: true — do not read or log this field's value`);
    return parts.join('\n  ');
  });

  return [
    '## Interface Map — Element-Level Context',
    `Page: ${pageUrl}`,
    lines.join('\n\n'),
  ].join('\n');
}
```

This context block is inserted after the existing live `scanPage()` snapshot in the prompt, so the agent has both:
1. **Live scan**: what is on the page right now (positions, current values, state)
2. **Annotated map**: what each element *means* (business logic, labels, rules)

**Effort**: Low — one new service function + prompt injection in existing session handler

---

### Phase 4 — Framework Detection & Multi-State Capture

**Goal**: Automatically detect the front-end framework and handle dynamic state changes (modals opening, step changes, async-loaded content) so the captured map reflects real usage patterns, not just the page-load state.

#### Framework detection (widget, inspector mode)

```typescript
function detectFramework(): 'react' | 'vue' | 'angular' | 'vanilla' | 'server' {
  if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) return 'react';
  if ((window as any).Vue || document.querySelector('[data-v-]')) return 'vue';
  if ((window as any).ng || document.querySelector('[ng-version]')) return 'angular';
  if (document.querySelectorAll('script[src]').length === 0) return 'server';
  return 'vanilla';
}
```

#### Multi-state capture (inspector mode)

Inspector mode adds a "Capture current state" button in the sidebar. Each press creates a **child snapshot** of the same page URL but at a different UI state:
- State name: SaaS owner labels it (e.g. "Billing settings — after payment method added")
- Same element detection + annotation workflow
- Agent loads all active snapshots for a URL and merges annotated context

**Effort**: Medium — framework detection is trivial; multi-state capture requires snapshot grouping in schema

---

### Phase 5 — Self-Updating Map (Auto Re-Capture on UI Change)

**Goal**: When the SaaS deploys a UI update, the element map becomes stale. Auto-detect staleness and surface it on the dashboard.

#### Staleness detection

On every agent session turn, compare `scanPage()` result (live) against the stored `InterfacePageSnapshot` for that URL:
- Selector present in stored map but not found in live scan → mark element as `stale`
- New selectors detected in live scan not in stored map → mark snapshot as `hasNewElements`

#### Dashboard alerting

- "Interface" dashboard section shows a ⚠️ badge on pages with stale/new elements
- Alert email (via existing Resend setup): "3 elements on /settings/billing may have changed since your last capture — review and re-capture"

**Effort**: Medium — diff algorithm + staleness fields on schema + dashboard badge

---

## Architecture Diagram

```
                        DASHBOARD (SaaS owner)
                        ┌──────────────────────────────────┐
                        │  /interface                       │
                        │  ┌─────────────┐ ┌─────────────┐ │
                        │  │ Page list   │ │ Element grid │ │
                        │  │ /settings   │ │ [Annotate]  │ │
                        │  │ /billing    │ │ [Edit rule] │ │
                        │  └─────────────┘ └─────────────┘ │
                        └──────────────┬───────────────────┘
                                       │ PATCH /elements/:id
                                       ▼
                        BACKEND
                        ┌──────────────────────────────────┐
                        │  /interface-map routes            │
                        │  InterfacePageSnapshot            │
                        │  InterfaceElement                 │
                        └──────────────┬───────────────────┘
                                       │
              ┌────────────────────────┤
              ▼                        ▼
  WIDGET (inspector mode)    WIDGET (copilot mode — agent session)
  ┌────────────────────┐     ┌────────────────────────────────────┐
  │ Inspector overlay  │     │ scanPage() — live DOM snapshot      │
  │ Annotation sidebar │     │ loadInterfaceContext() — annotated  │
  │ Capture button     │     │   map injected into system prompt   │
  │                    │     │ Agent now understands element intent │
  └────────────────────┘     └────────────────────────────────────┘
       POST /capture              GET /context?url=/billing
```

---

## Data Flow: End to End

```
1. SaaS owner opens dashboard → Interface tab → clicks "Add page"
2. Dashboard opens customer's product URL in a new tab with ?ahaget_inspect=1&key=<apiKey>
3. Widget boots in inspector mode → runs scanPage() → highlights all elements
4. Owner clicks each element → fills label / description / business rule in sidebar
5. Owner clicks "Save" → POST /api/v1/interface-map/capture → stored in DB
6. --- Later, end-user session starts on that page ---
7. Agent session handler calls loadInterfaceContext(orgId, '/billing')
8. Annotated element context prepended to system prompt
9. Agent fills "Billing entity" field knowing: "Must match legal entity on file; 'Personal' blocks payment for unverified accounts"
10. Agent sees billing error class → knows exactly what message to show
```

---

## Key Decisions Not Yet Made

1. **Inspector mode delivery**: Open in a new browser tab (simplest, zero CSP issues) OR embed as a panel alongside the customer's page (richer UX, more CSP risk). **Recommendation: new tab, phase 1.**

2. **Cross-origin capture**: If the SaaS owner's product is on a different domain, the widget script must be already installed there. Inspector mode requires the same script tag to be present with a `?ahaget_inspect=1` param recognized. **Constraint: widget must already be installed on the page being captured.** This is acceptable — only paying customers who have installed the widget will use this feature.

3. **Element annotation scope**: Per-snapshot (one specific page state) OR org-wide (all elements across all pages share a single namespace by selector). **Recommendation: per-snapshot, since selectors can collide across pages.**

4. **Multi-state grouping**: Should `/billing` with modal open and `/billing` without modal be one snapshot or two? **Recommendation: two child snapshots under the same page group, distinguished by a SaaS-owner-assigned state label.**

5. **Pricing**: Include in Growth plan (matches Knowledge Base positioning) OR gate behind Enterprise (higher value, interface-level = enterprise concern). **Decision needed before Phase 2.**

---

## Priority Order

```
Phase 1  Capture Engine               ← foundation, everything else requires stored data
Phase 2  Dashboard Review UI          ← can run in parallel with Phase 1 (mock data first)
Phase 3  Agent Integration            ← unlocks the actual value (annotated prompts)
Phase 4  Framework Detection + Multi-state  ← improves accuracy for complex SPAs
Phase 5  Self-Updating Map            ← reduces maintenance burden at scale
```

Phases 1–3 together are the **MVP**. A SaaS owner can capture one page, annotate 10 elements, and the agent immediately uses that context. That is the demo that sells this.

---

## What Already Exists and Must Not Be Changed

| Component | What it does | Leave it alone because… |
|---|---|---|
| `scanner.ts` — `scanPage()` | Live DOM scan for agent context | It's production-grade and used on every session turn. Inspector mode calls it too — no duplication. |
| `scanner.ts` — `buildSemanticSummary()` | Natural language page state for agent | Injected into prompt today. Phase 3 adds *annotated element context* alongside it — not replacing it. |
| `resolver.ts` | Self-healing selector lookup | Element map selectors will benefit from self-healing automatically. No changes needed. |
| `KnowledgeBaseArticle` | Document-level KB | Pivot 2 is an *additional* layer. Document KB and element KB are complementary. |
| `OnboardingStep.actionConfig` | Per-step CSS selectors | This is flow-step–scoped. Element map is org-wide and persistent across flows. |

---

## What We Tell Clients Right Now

Before any code ships:

> "Ahaget already reads every element on your page in real time — fields, buttons, states, errors. What we're building now is the layer that lets *you* tell it what each element means for your specific product. Once you annotate an element once, every user session on that page benefits from that context — permanently. No re-training, no maintenance, no re-recording broken tours."

---

## Competitive Positioning

| | Whatfix (static recording) | Pendo (event tagging) | **Ahaget Pivot 2** |
|---|---|---|---|
| Captures UI | Yes, at record time | No | Yes, live at any time |
| Survives UI redesigns | No (tours break) | N/A | Yes (self-healing resolver) |
| Business logic per element | No | No | **Yes — annotatable** |
| Error state awareness | No | No | **Yes** |
| Agent acts on element knowledge | No | No | **Yes** |
| Non-engineer can annotate | No | Partially | **Yes — dashboard UI** |
| Framework requirement | Must install proprietary SDK | JS snippet | 2-line embed (already installed) |
