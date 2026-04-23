# Prism – Onboarding Flow Roadmap
> **Goal:** When a user clicks "Start for Free" on the landing page they flow through a guided setup wizard and land on a fully functional dashboard. Modelled after the Tandem reference screenshots in `features-screenshots/`.

---

## Milestone 1 — Signup-to-Dashboard Onboarding Flow

### Phase 1 — Auth: Sign-up & Magic-Link Login
**Goal:** Replace / augment the plain email+password login with a magic-link (passwordless) flow styled like the reference (Screenshot 749). Users can also sign in with Google OAuth.

**Scope:**
- `apps/dashboard/app/(auth)/login/page.tsx` — add Google OAuth button + magic-link email form
- `apps/dashboard/app/(auth)/register/page.tsx` — consolidate into unified Sign-in/Sign-up page ("Sign in to your account or create a new one")
- `apps/backend/src/routes/auth.ts` — add `POST /auth/magic-link/send` + `GET /auth/magic-link/verify` endpoints
- UI: split-screen layout: left = form, right = assistant preview panel teaser
- After successful auth → redirect to `/getting-started/workspace` (new onboarding wizard)

**UAT:**
- [ ] Entering email sends a magic-link email and shows "Check your inbox" state
- [ ] Clicking magic-link in email logs user in and redirects to onboarding
- [ ] Google OAuth button visible and functional
- [ ] Existing users who already have workspaces skip onboarding → go directly to `/dashboard`

---

### Phase 2 — Onboarding Wizard: Step 1 – Workspace URL
**Goal:** After first login, capture the user's website URL (Screenshot 750 – "Let's start with a link").

**Scope:**
- New route group: `apps/dashboard/app/(onboarding)/getting-started/`
- `apps/dashboard/app/(onboarding)/getting-started/layout.tsx` — minimal Prism-branded header (no sidebar), step progress indicator
- `apps/dashboard/app/(onboarding)/getting-started/workspace/page.tsx` — URL input form ("Your website URL", `acme.com` placeholder)
- `apps/dashboard/app/(onboarding)/getting-started/workspace/actions.ts` — save domain to org record
- Backend: `PATCH /api/v1/org/onboarding` — upsert onboarding state `{ websiteUrl, step }`
- On Continue → redirect to `/getting-started/attribution`

**UAT:**
- [ ] URL field accepts bare domain and full URL, normalises to hostname
- [ ] Validation error shown for invalid URLs
- [ ] Continue advances to attribution step

---

### Phase 3 — Onboarding Wizard: Step 2 – Attribution
**Goal:** "Where did you hear about us?" (Screenshot 751).

**Scope:**
- `apps/dashboard/app/(onboarding)/getting-started/attribution/page.tsx` — radio-card list: AI search, Google, LinkedIn, Word of mouth, Other
- Submit saves to backend `PATCH /api/v1/org/onboarding` `{ attribution }`
- Back → `/getting-started/workspace`; Continue → `/getting-started/description`

**UAT:**
- [ ] One option can be selected at a time (highlighted state)
- [ ] Back navigation preserves previously entered URL
- [ ] Continue enabled only after a selection

---

### Phase 4 — Onboarding Wizard: Step 3 – Product Description
**Goal:** "What does your product do?" (Screenshot 752).

**Scope:**
- `apps/dashboard/app/(onboarding)/getting-started/description/page.tsx` — textarea for product description
- "Create workspace" CTA calls `POST /api/v1/org/workspace` which:
  1. Saves description as `customInstructions` on the org
  2. Creates default onboarding flow
  3. Marks org `onboardingComplete = false` (still needs install)
  4. Returns workspace slug
- Redirect → `/getting-started/install`

**UAT:**
- [ ] Textarea has placeholder text, autofocused
- [ ] "Create workspace" disabled when empty
- [ ] Submitting creates workspace and navigates to install step

---

### Phase 5 — Onboarding Wizard: Step 4 – Installation Method
**Goal:** "How would you like to install Prism?" (Screenshot 753 – Script tag vs Chrome Extension).

**Scope:**
- `apps/dashboard/app/(onboarding)/getting-started/install/page.tsx` — two option cards: "Script tag" and "Chrome Extension"
- Selection stored in local state; Continue → `/getting-started/snippet/[workspaceId]`
- Backend: `GET /api/v1/org/snippet` → returns personalised `<script>` embed code

**UAT:**
- [ ] Script tag card selected by default (highlighted)
- [ ] Selecting Chrome Extension changes highlight
- [ ] Continue navigates to correct snippet page

---

### Phase 6 — Onboarding Wizard: Step 5 – Script Snippet & Install Detection
**Goal:** Show personalised embed snippet and poll for installation (Screenshots 754, 755).

**Scope:**
- `apps/dashboard/app/(onboarding)/getting-started/snippet/[workspaceId]/page.tsx`
  - Code block with copy button: `window.prismSettings = { app_id, user: { id, name, email } }` 
  - "Copy a prompt for your AI coding agent" utility card
  - "Waiting for installation on [domain]…" status indicator with polling
- Backend: `GET /api/v1/org/install-status` → checks if any event received for org
- Polling every 3s; on detection → button changes to "Continue to Dashboard →"
- "Skip it for now" link → goes directly to dashboard
- "Install on another domain" link → back to workspace step

**UAT:**
- [ ] Code block displays correct app_id and placeholder tokens
- [ ] Copy button copies code to clipboard with feedback toast
- [ ] Status indicator shows "Waiting…" / "Detected!" states
- [ ] Skip link works and redirects to dashboard

---

### Phase 7 — Dashboard: Empty State & Sidebar Navigation
**Goal:** After completing onboarding (or skipping), land on the dashboard with the Tandem-style sidebar (Screenshot 756 – In-Page Assistant empty state).

**Scope:**
- `apps/dashboard/components/Sidebar.tsx` — update to match Tandem's sidebar design:
  - Sections: **Agent** (In-Page Assistant, User Flows), **Integrations** (Knowledge, MCP), **Account** (Branding, Settings)
  - "Edit in your app" CTA button at top
  - Workspace switcher dropdown
- `apps/dashboard/app/(app)/dashboard/page.tsx` — detect `onboardingComplete = false` → show empty-state onboarding checklist card (like Screenshot 756) instead of / alongside metrics
- `apps/dashboard/app/(app)/in-page-assistant/page.tsx` *(new)* — empty state: "Open the Prism Editor in your app to create your first AI agent" + CTA button

**UAT:**
- [ ] Sidebar shows correct sections and active state
- [ ] "Edit in your app" button links to the Prism editor overlay
- [ ] Empty-state page renders with correct CTA

---

### Phase 8 — Dashboard Sub-pages: Knowledge, MCP, Branding, Settings
**Goal:** Scaffold the remaining post-onboarding dashboard pages visible in screenshots 757–760.

**Scope:**
- `apps/dashboard/app/(app)/knowledge/page.tsx` — Knowledge Sources page: URL input + language selector + Add button + empty table (Screenshot 757)
- `apps/dashboard/app/(app)/mcp/page.tsx` — MCP Integrations page: table with Name / Server / Connection / Actions columns + "+ Create new" button (Screenshot 758)  
- `apps/dashboard/app/(app)/branding/page.tsx` — Branding page: Theme / Entry points / Sidebar tabs, primary color picker, gradient colors, quick presets (Screenshot 759)
- `apps/dashboard/app/(app)/settings/page.tsx` — Settings page: General / Hosts / Members / Advanced tabs, Account Name field, App ID (read-only copy), Description textarea (Screenshot 760)
- Update `Sidebar.tsx` nav links to point to these new routes
- Backend endpoints wired: `GET/POST /api/v1/kb/sources`, `GET/POST /api/v1/mcp`, `GET/PATCH /api/v1/org/branding`, `GET/PATCH /api/v1/org/settings`

**UAT:**
- [ ] Knowledge page: entering a URL and clicking Add POSTs to backend and shows in table
- [ ] MCP page: "+ Create new" opens modal or route; existing integrations listed
- [ ] Branding page: colour picker updates preview widget in real time
- [ ] Settings page: saving Account Name PATCHes backend; App ID copyable

---

## Backlog

- `999.1` — Email template for magic-link (branded Prism email)
- `999.2` — Google OAuth production credentials + callback URL configuration
- `999.3` — Chrome Extension install path (out of scope for MVP wizard)
- `999.4` — Onboarding progress persistence if user closes browser mid-wizard
- `999.5` — User Flows page (currently stubbed in sidebar)
