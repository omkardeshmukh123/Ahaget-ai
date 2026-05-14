# Pivot 15 — Real-Time Page Content Capture

**Date:** 2026-05-13
**Status:** Planning
**Goal:** Give the agent a complete, live view of every element on the host page — fields, buttons, values, error states, modals, dynamic content — not a frozen snapshot captured at message-send time.

---

## Feature Definition

> Page content: every element on the page in real time. Fields, buttons, values, error states, modals, dynamic content. Not a static snapshot.

### Why this matters
The agent currently makes decisions based on a point-in-time DOM scan taken the moment the user sends a message. This means:
- If a modal opens after an agent action, the agent doesn't know it exists.
- If a button becomes disabled because a required field is empty, the agent can't see it (disabled elements are excluded from the scan entirely).
- If an async validation error appears 200ms after a form fill, the agent never sees it unless the user sends another message.
- Checkboxes and radio buttons have no state — the agent can't tell if a consent box is checked or a plan is selected.
- Select dropdowns show a machine key (`"us-east-1"`) not the human label (`"US East (N. Virginia)"`).

The result: the agent gives guidance based on stale or incomplete context, leading to incorrect selectors, wrong next steps, and failed `__verify__` turns.

---

## Current State (Don't Rebuild)

| What exists | Location | Notes |
|---|---|---|
| `scanPage()` — scans buttons, inputs, textareas, selects, links | `apps/widget/src/scanner.ts:110` | Already filters sensitive fields (password, CC) |
| `buildSemanticSummary()` — page type, wizard, errors, filled fields | `apps/widget/src/scanner.ts:308` | Text summary injected into agent system prompt |
| `PageContext` type with `url, title, headings, elements, semanticSummary` | `apps/widget/src/scanner.ts:29` + `apps/backend/src/services/agent.ts:149` | Already wired through all agent paths |
| `scanPage()` called fresh on every `sendMessage()` | `apps/widget/src/copilot.ts:302,513` | Point-in-time, not reactive |
| Error detection via `[role="alert"]`, `[class*="error"]`, `[aria-invalid]` | `scanner.ts:296-306` | In semantic summary only, not per-element |
| `_elementIndex` — module-level fingerprint cache | `scanner.ts:39` | Updated by each `scanPage()` call |

---

## Gaps (Ordered by Impact)

### Gap 1 — Modal/Dialog blindness (Critical)
`scanPage()` does a global DOM query. When a modal opens, its elements land in the flat `elements[]` array with no signal that a modal is active. The agent cannot:
- Know a modal is open
- Scope actions to the modal (e.g. click the modal's "Confirm" button vs. a background button with the same label)
- Detect the modal's title or purpose

**What to add:** Modal detection in `scanPage()` — check for `[role="dialog"]`, `[aria-modal="true"]`, and common class patterns (`.modal`, `[class*="dialog"]`). If a modal is open, capture it separately as `modalContext: { title, elements }` in `PageContext` and prioritise it in the agent prompt.

### Gap 2 — Checkbox/radio state invisible (Critical for onboarding flows)
`scanPage()` scans `<input type="checkbox">` and `<input type="radio">` as elements but never reads `.checked`. The agent calls `fill_form` blindly without knowing the current toggle state, causing double-flips and wrong verification.

**What to add:** In `fingerprint()`, capture `checked?: boolean` for checkbox/radio types. Expose it in `PageElement`. Include it in the agent prompt as `checked=true/false`.

### Gap 3 — Disabled elements are invisible (High)
The scan explicitly filters `button:not([disabled])` and `input:not([disabled])`. Disabled elements are entirely absent from the agent's world. A common pattern: the "Next" or "Submit" button is disabled until required fields are filled — the agent has no idea the button exists, let alone that it's disabled.

**What to add:** Include disabled interactive elements in the scan with a `disabled: true` flag. The agent prompt should list them as `[DISABLED]` so the agent can reason about why the user can't proceed.

### Gap 4 — No real-time DOM observation (High)
The scan fires exactly once per user message. Between messages, DOM changes are invisible:
- Toast notifications appear → agent doesn't see them
- Async validation errors render → agent doesn't see them
- The page navigates (SPA) → handled by `/page-change` but modal/overlay changes are not

**What to add:** A lightweight `MutationObserver` in the widget that watches for high-signal DOM changes: `[role="alert"]`, `[role="dialog"]`, `[aria-live]` regions, and elements matching `[class*="error"]` / `[class*="toast"]`. When a significant mutation fires, update an internal `_pendingDomDeltas` buffer. On the next `scanPage()` call, merge deltas into the context. This avoids continuous scanning cost while keeping the agent informed.

### Gap 5 — Select option text lost (Medium)
`<select>` elements return their `.value` (e.g. `"us-east-1"`) but not the displayed text of the selected option (`"US East (N. Virginia)"`). The agent uses the wrong label in confirmations and fill_form verification.

**What to add:** In the element scan for `<select>`, read `el.options[el.selectedIndex]?.text` and include it as `selectedText` in `PageElement`.

### Gap 6 — ARIA live regions not monitored (Medium)
`[aria-live]`, `[role="status"]`, `[role="log"]` are the standard DOM contract for dynamic content announcements (success messages, loading indicators, inline validation). They are currently invisible.

**What to add:** Include ARIA live region content in `buildSemanticSummary()`. In the MutationObserver (Gap 4), prioritise mutations inside `[aria-live]` regions as high-signal events.

### Gap 7 — Loading states not detected (Low)
`aria-busy="true"`, elements with `[class*="loading"]` / `[class*="skeleton"]` / `[class*="spinner"]`, and `cursor: wait` are not detected. The agent may try to interact with a page that is still loading.

**What to add:** In `buildSemanticSummary()`, detect `[aria-busy="true"]` and common loading class patterns. Emit `LOADING: true` in the semantic summary so the agent knows to wait.

### Gap 8 — Custom interactive elements missed (Low)
Modern SPAs use `[tabindex="0"]`, custom `[role="combobox"]`, `[role="listbox"]`, `[role="switch"]`, rich-text editors (`[contenteditable]`), range sliders, etc. None of these are captured by the current `button/input/textarea/select/a` query list.

**What to add:** Extend the element scan to include `[tabindex]:not([tabindex="-1"])`, `[role="combobox"]`, `[role="switch"]`, `[role="listbox"] [aria-selected="true"]`, and `[contenteditable]` elements.

---

## Implementation Plan

### Phase A — Widget: Enrich `PageElement` and `PageContext` types
**Files:** `apps/widget/src/scanner.ts`, `apps/backend/src/services/agent.ts`

1. Extend `PageElement` type:
   ```ts
   export type PageElement = {
     tag: string; selector: string; text: string; type?: string;
     value?: string;
     checked?: boolean;        // Gap 2
     disabled?: boolean;       // Gap 3
     selectedText?: string;    // Gap 5
   };
   ```

2. Extend `PageContext` type:
   ```ts
   export interface PageContext {
     url: string; title: string; headings: string[];
     elements: PageElement[];
     semanticSummary?: string;
     modalContext?: {           // Gap 1
       title: string;
       elements: PageElement[];
     } | null;
     loadingState?: boolean;   // Gap 7
   }
   ```

3. Sync the same types in `agent.ts` (they are duplicated there — they should be imported from a shared package or at least kept in sync).

### Phase B — Widget: Update `scanPage()`
**File:** `apps/widget/src/scanner.ts`

1. **Checkbox/radio state (Gap 2):** In the input scan loop, after building the fingerprint, check `(el as HTMLInputElement).checked` for `type=checkbox|radio`. Add to returned `PageElement`.

2. **Disabled elements (Gap 3):** Run a second pass scanning `button[disabled], [role="button"][aria-disabled="true"], input[disabled], select[disabled]`. Mark each with `disabled: true`. Include in `elements[]`.

3. **Select option text (Gap 5):** In the select scan, read `(el as HTMLSelectElement).options[(el as HTMLSelectElement).selectedIndex]?.text` and include as `selectedText`.

4. **Modal detection (Gap 1):** Before the main element loop, check for open modals:
   ```ts
   const modalEl = document.querySelector<HTMLElement>(
     '[role="dialog"]:not([hidden]), [aria-modal="true"]:not([hidden]), .modal:not([hidden])'
   );
   ```
   If found, run the same element scan scoped to `modalEl` and populate `modalContext`. Exclude modal elements from the main `elements[]` scan to avoid double-counting.

5. **Custom interactive elements (Gap 8):** Add `[tabindex="0"]`, `[role="switch"]`, `[role="combobox"]`, `[contenteditable]` to the scan query.

### Phase C — Widget: `buildSemanticSummary()` updates
**File:** `apps/widget/src/scanner.ts`

1. **Loading state (Gap 7):** Detect `document.querySelector('[aria-busy="true"], [class*="loading"], [class*="skeleton"]')`. Add `LOADING: true` line.

2. **Modal awareness (Gap 1):** If a modal is detected, add `MODAL OPEN: "<title>"` line and list its primary action button.

3. **ARIA live region content (Gap 6):** Read text from `[aria-live]:not([aria-live="off"])` and `[role="status"]` elements. Add as `LIVE REGION: "<text>"` if non-empty.

4. **Disabled button states (Gap 3):** Extend `detectPrimaryButton()` to also report all disabled submit/primary buttons, not just the first primary one.

### Phase D — Widget: MutationObserver for delta tracking (Gap 4)
**File:** `apps/widget/src/scanner.ts` (new export) or `apps/widget/src/widget.ts`

Add a lightweight observer that tracks high-signal DOM mutations:

```ts
let _domDeltas: string[] = [];

export function startDomObserver(): void {
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        // High-signal: alert, dialog, error/toast patterns
        const sig = getNodeSignal(node);
        if (sig) _domDeltas.push(sig);
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function getNodeSignal(el: HTMLElement): string | null {
  const role = el.getAttribute('role');
  if (role === 'alert' || role === 'dialog' || role === 'status') {
    return `[${role.toUpperCase()}] ${el.innerText?.trim().slice(0, 80)}`;
  }
  if (/error|toast|notification|alert/i.test(el.className)) {
    return `[DYNAMIC] ${el.innerText?.trim().slice(0, 80)}`;
  }
  return null;
}

export function flushDomDeltas(): string[] {
  const deltas = [..._domDeltas];
  _domDeltas = [];
  return deltas;
}
```

Call `startDomObserver()` during widget init. In `scanPage()`, call `flushDomDeltas()` and include the result as `recentDomEvents?: string[]` in `PageContext`.

In the agent prompt, prepend any `recentDomEvents` before the LIVE PAGE ELEMENTS section.

### Phase E — Backend: Update agent prompt builder
**File:** `apps/backend/src/services/agent.ts`

1. In `prepareAgentCall()` / `domSummary` builder, handle:
   - `modalContext`: If present, prepend `MODAL OPEN: "<title>"` and list modal elements before main elements
   - `recentDomEvents`: If present, add `RECENT DOM EVENTS:\n<events>` section
   - `loadingState`: If `true`, add `PAGE IS LOADING — do not attempt interactions` line
   - `checked`/`disabled` on elements: include in the element line format, e.g. `[input[checkbox]] selector="..." label="Accept terms" checked=false`

2. Update `sanitizeDomText()` to handle the new fields.

### Phase F — Tests
**File:** `apps/backend/src/__tests__/` (new or existing session test file)

- Test that `modalContext` in `pageContext` results in `MODAL OPEN:` appearing in the system prompt
- Test that disabled elements with `disabled: true` appear as `[DISABLED]` in prompt
- Test that `checked=false` for a checkbox appears correctly
- Test that `recentDomEvents` are included in the prompt when present

---

## Data Flow After This Pivot

```
User sends message
    → copilot.ts: scanPage() + buildSemanticSummary() + flushDomDeltas()
    → PageContext now includes:
        • elements[] — buttons, inputs, selects, checkboxes (with checked state),
                       disabled elements (flagged), custom interactive elements
        • modalContext — if a modal/dialog is open, its title + elements (isolated)
        • semanticSummary — errors, loading state, wizard step, ARIA live regions, modal
        • recentDomEvents — high-signal DOM mutations since last scan
    → POST /api/v1/session/act/stream with enriched PageContext
    → agent.ts: builds system prompt with MODAL OPEN / RECENT DOM EVENTS / LIVE PAGE ELEMENTS
    → GPT-4o has full, accurate page context
```

---

## What NOT to Build

- Do NOT stream the DOM continuously over the WebSocket — too much data, too expensive.
- Do NOT send the full DOM tree or HTML — the flat element list + semantic summary is the right abstraction.
- Do NOT scan `display:none` or `visibility:hidden` elements — they are not actionable.
- Do NOT remove the sensitive field filter — it's a security requirement.
- Do NOT change the `_elementIndex` fingerprint system — it underpins the self-healing resolver.

---

## Acceptance Criteria

- [ ] When a modal is open, the agent prompt contains `MODAL OPEN:` with the modal's elements listed first
- [ ] Checkbox/radio elements include `checked=true/false` in the agent prompt
- [ ] Disabled buttons and inputs appear in the prompt marked `[DISABLED]`
- [ ] Select elements show both `value` and `selectedText` in the prompt
- [ ] A `[role="alert"]` that appears after a form fill is included in `recentDomEvents` on the next message
- [ ] `PAGE IS LOADING` appears in the prompt when `aria-busy="true"` is present
- [ ] All changes are backward-compatible — `pageContext` fields are optional, existing callers unaffected
- [ ] No sensitive data leaks through new element types (password, CC, SSN patterns must still be filtered)
