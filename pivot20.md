# Pivot 20 — Navigate Pages: Multi-Page Flow Orchestration

## Honest Assessment

The "Navigate pages" feature is **partially implemented** — the low-level plumbing exists but the product-level promise is not delivered.

### What already works
- `execute_page_action` tool with types: `fill_form`, `click`, `navigate`, `highlight`, `hover_tip`
- `navigate` action: saves resume state to `localStorage`, fires `window.location.href`
- `fill_form`: animated cursor + CSS selector fill with self-healing (7 fallback strategies)
- `click`: spotlight then `.click()`
- Native `<select>` value setting (`.value` + `change` event)
- `shouldVerify` / `__verify__`: agent re-reads DOM after fill/click
- `checkPageDivergence`: detects if agent navigated to wrong path
- `allowedActions` per step: operator can restrict which actions the agent can use
- `targetUrl` field exists on `OnboardingStep` schema

### What is missing

| Gap | Impact |
|---|---|
| No multi-page orchestration — agent navigates but has no structured instruction to "continue on next page" | Flows can't reliably span pages |
| `__verify__` dies on navigation — after `navigate`, the copilot instance is destroyed | Agent can't confirm success after page change |
| Flow builder has no UI to set `targetUrl`, selector, or fields per step | Operators can't configure anything; all judgment is left to the agent at runtime |
| Virtual component selects (Radix, MUI, Headless UI, Shadcn) not handled | `change` event alone doesn't trigger React/Vue virtual state — select fills appear to work but don't |
| No validation error detection — after fill/click the agent reads raw DOM but doesn't parse error messages | Agent can't recover from "email already taken" or "password too short" |
| No panel/tab/accordion open action — "open the correct settings panel" has no structured support | Agent must guess a `click` selector for expand/tab buttons |

---

## Goal

Make multi-page flows work reliably end-to-end:
1. Operator configures which URL a step targets and what the agent should do there
2. Agent navigates to the right page, executes actions, detects errors, and continues
3. Virtual component selects work (Radix, MUI, Shadcn)
4. Validation errors surface to the agent so it can adapt

---

## Scope

### 1. Post-Navigation Session Continuity

**Problem:** After `navigate` fires, the page reloads. The widget re-attaches via `_oai_resume` but the agent is not told "you just navigated, you're now on [new page], continue from step X."

**File:** `apps/widget/src/copilot.ts`

On widget mount, if `_oai_resume` exists:
- Send a synthetic `__navigated__` message instead of `__init__`
- Payload: `{ from: previousUrl, to: currentUrl, stepId, sessionId }`

**File:** `apps/backend/src/routes/session.ts` — handle `__navigated__` message type:
- Inject into the next agent turn: `NAVIGATION COMPLETE: You navigated from {from} to {to}. Current page is now loaded. Resume step {stepTitle} — re-scan LIVE PAGE ELEMENTS and continue.`
- Re-run DOM scan and inject fresh LIVE PAGE ELEMENTS before the agent responds

---

### 2. Step-Level Target URL + Action Config in Flow Builder

**Problem:** `targetUrl` and `actionConfig` exist in the schema but are invisible in the dashboard. Operators configure nothing. The agent decides everything at runtime.

**File:** `apps/dashboard/app/(app)/flows/[id]/page.tsx`

Add a "Step Actions" section in the step editor panel (below the existing prompt/questions fields):

```
Target URL (optional)
  [ https://app.example.com/settings/billing ]
  ↳ Agent navigates here before executing step actions

Action Type
  [ None ▾ ] [ Highlight ] [ Click ] [ Fill Form ]

  If "Click":
    Selector: [ #upgrade-button ]

  If "Fill Form":
    + Add Field
    [ selector ] → [ value or {{collectedData.email}} ]

  If "Highlight":
    Selector: [ .pricing-table ]
    Mode: [ spotlight ▾ ]
```

**File:** `apps/backend/src/routes/flow.ts` — already accepts `actionConfig` and `targetUrl` in step PATCH; no backend change needed.

---

### 3. Agent Prompt: Multi-Page Orchestration Instructions

**File:** `apps/backend/src/services/agent.ts`, `buildSystemPrompt()`

When a step has `targetUrl` set, inject before the step instructions:

```
MULTI-PAGE STEP: This step requires navigating to a specific page.
1. If current URL does not match "{targetUrl}" → call execute_page_action with type "navigate" and url "{targetUrl}" immediately. Do not ask the user first.
2. After navigation you will receive a NAVIGATION COMPLETE signal — then resume this step.
3. Only execute fill/click actions after confirming you are on the correct page.
```

Also update the `execute_page_action` tool description for `navigate`:
- Add: "After calling navigate, STOP. You will be re-invoked on the new page with NAVIGATION COMPLETE."

---

### 4. Virtual Component Select Support

**Problem:** React/Vue virtual selects (Radix UI, MUI Select, Headless UI, Shadcn) don't respond to direct `.value` assignment + `change` event. They manage state internally.

**File:** `apps/widget/src/cursor.ts`, `typeIntoField()`

Add a virtual select detection + interaction path:

```ts
// Detect Radix/Headless UI select patterns
function isVirtualSelect(el: HTMLElement): boolean {
  return (
    el.getAttribute('role') === 'combobox' ||
    el.getAttribute('data-radix-select-trigger') !== null ||
    el.closest('[data-radix-select-root]') !== null ||
    el.getAttribute('aria-haspopup') === 'listbox'
  );
}

async function fillVirtualSelect(el: HTMLElement, value: string): Promise<boolean> {
  // 1. Click trigger to open dropdown
  el.click();
  el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  await sleep(150);

  // 2. Find option by text content match
  const options = document.querySelectorAll('[role="option"]');
  for (const opt of options) {
    if (opt.textContent?.trim().toLowerCase().includes(value.toLowerCase())) {
      (opt as HTMLElement).click();
      return true;
    }
  }
  return false;
}
```

Update `typeIntoField()` to call `fillVirtualSelect` first if `isVirtualSelect()` returns true, falling back to direct `.value` set.

Also update `animatedFillFields()` to handle `HTMLElement` (not just form elements) for virtual component triggers.

---

### 5. Validation Error Detection

**Problem:** After `fill_form` + `__verify__`, the agent reads raw DOM. It can see new text on the page but doesn't know if it's a validation error vs. success confirmation.

**File:** `apps/widget/src/scanner.ts`, `scanPage()`

Add validation error detection to the page scan:

```ts
// Detect visible validation error messages near form fields
function scanValidationErrors(): string[] {
  const ERROR_SELECTORS = [
    '[role="alert"]',
    '[aria-live="polite"]',
    '[aria-live="assertive"]',
    '.error', '.error-message', '[data-error]',
    'input:invalid + *', 'input[aria-invalid="true"] + *',
  ];
  const errors: string[] = [];
  for (const sel of ERROR_SELECTORS) {
    document.querySelectorAll(sel).forEach((el) => {
      const text = (el as HTMLElement).innerText?.trim();
      if (text && text.length < 200) errors.push(text);
    });
  }
  return [...new Set(errors)]; // deduplicate
}
```

Add `validationErrors?: string[]` to `PageContext`. Inject into LIVE PAGE ELEMENTS block:
```
VALIDATION ERRORS ON PAGE:
- Email address is already in use
- Password must be at least 8 characters
```

Agent system prompt instruction: "If VALIDATION ERRORS are present after a fill/click, adapt your response to address them directly before retrying."

---

### 6. Panel / Tab / Accordion Open Action

**Problem:** "Open the correct settings panel" requires clicking expand buttons, switching tabs, or opening collapsibles. The agent uses `click` today but doesn't know to click a tab *before* trying to fill a field inside it.

**File:** `apps/backend/src/services/agent.ts`

Add `expand_panel` action type to `execute_page_action`:

```json
{
  "type": "expand_panel",
  "selector": "#billing-tab",
  "waitForSelector": ".billing-form",
  "description": "Click to open the Billing tab, then wait for the form to appear"
}
```

- Clicks the trigger element
- Waits up to 1.5s for `waitForSelector` to appear in DOM
- On success: fires `__verify__` with the revealed element list

**File:** `apps/widget/src/copilot.ts`, `executePageAction()` — implement `expand_panel` handler:
```ts
if (actionType === 'expand_panel') {
  const trigger = resolveFromIndex(payload.selector as string);
  if (trigger) {
    trigger.el.click();
    // Poll for waitForSelector up to 1.5s
    if (payload.waitForSelector) {
      await waitForElement(payload.waitForSelector as string, 1500);
    }
  }
}
```

Add `waitForElement(selector, timeoutMs)` utility to scanner.ts or copilot.ts.

---

## Implementation Order

1. **Post-navigation continuity** (3h) — `__navigated__` message, agent resumes correctly
2. **Virtual select support** (2h) — Radix/MUI/Headless UI fill path
3. **Validation error detection** (1.5h) — scan + inject into LIVE PAGE ELEMENTS
4. **Agent prompt: multi-page instructions** (1h) — targetUrl-aware system prompt injection
5. **`expand_panel` action** (1.5h) — widget + agent
6. **Flow builder: step action config UI** (3h) — targetUrl, action type, selector/fields per step

Total: ~12h (~1.5 days)

---

## Success Criteria

- [ ] Flow spanning 3 pages executes without manual user navigation — agent navigates, page reloads, agent continues from correct step
- [ ] Radix/Shadcn `<Select>` fills correctly (verified on a real app using those components)
- [ ] After failed fill, agent reads the validation error and tells user what went wrong
- [ ] Operator can configure targetUrl + actionConfig for a step in the flow builder — no manual selector hunting by the agent
- [ ] `expand_panel` action opens a tab/accordion before attempting field fills inside it
- [ ] `__verify__` after `expand_panel` correctly lists the newly revealed elements

---

## Non-Goals

- Automated selector discovery / visual picker (record-and-replay) — future pivot
- Support for shadow DOM / iframes — future pivot
- Browser extension mode (no script tag) — out of scope
- React Native / mobile WebViews — future pivot

---

## Security Notes

- `navigate` already validates URLs server-side via `assertPublicUrl()` — no change needed
- Virtual select interaction only fires synthetic `click`/`mousedown` — same trust model as existing `click` action
- Validation error text is read-only DOM observation — no new attack surface
