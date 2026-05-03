# Ahaget — Pivot 1: From Onboarding Tool to AI Employee

> Last updated: 2026-04-29
> Status: Planning — nothing below is built yet unless marked ✅

---

## The Core Repositioning

| | Before | After |
|---|---|---|
| **What we say** | "AI-guided onboarding" | "AI employee inside your SaaS" |
| **When it works** | Day 1 setup only | Full user lifecycle, forever |
| **What it does** | Guides users through steps | Executes tasks on behalf of users |
| **Who buys it** | Head of Onboarding | Head of Growth / CPO |
| **Revenue metric** | Time-to-first-value | Activation + Adoption + Expansion MRR |

---

## Philosophy

**Competitors (Appcues, Pendo, Intercom Tours) are passive:**
- Show tooltips → user ignores them → nothing happens
- Play recorded tours → user skips → nothing happens
- Track events → send a Slack ping → human has to follow up

**Ahaget is execution-first:**
- Detects what the user is trying to do from the live page
- Asks one smart question
- Fills the form, clicks the button, navigates the page — done
- Does this at every stage of the lifecycle, not just day 1

**The one-line shift:**
> A tooltip says "click the Connect button."
> The AI employee says "I'll connect it for you — what's your API key?" — then does it.

---

## The AI Employee Job Description

| Role | Trigger | What It Does |
|---|---|---|
| Onboarding Specialist | New user, day 1 | Gets user to first value moment ✅ built |
| Feature Adoption Manager | User hasn't used feature X in 14 days | Surfaces it, explains why it's relevant to them, sets it up |
| Account Expansion Rep | User hits 80% of plan limit / power usage signal | Contextual upgrade pitch at the right moment |
| Retention Specialist | User inactive 8+ days | Re-engagement nudge based on exactly where they stopped |
| In-App Support Agent | User confused mid-task at any point | Answers, executes, unblocks — not just during onboarding |
| Upsell Engine | User manually doing something automatable | "I can automate that — it's on the Growth plan" |

---

## Full Lifecycle Map

```
Day 1         ACTIVATION
              Widget detects idle → opens → AI guides to first value
              Completion event fires → integrations notify (Segment, HubSpot, etc.)

Day 2–7       HABIT FORMATION
              AI surfaces features 2 and 3 based on user role + what they've done
              Goal: get user to log in 3 days in a row (habit loop)

Week 2        ADOPTION
              AI detects features the user has never visited
              Proactive nudge: "You've been doing X manually — here's a faster way"
              Drives breadth of usage, not just depth on one feature

Month 1       EXPANSION
              AI monitors usage against plan limits
              At 80% limit: contextual upgrade prompt inside the product
              Not a cold email — a conversation at the exact moment of need

Ongoing       RETENTION
              Churn score monitored per user (already built ✅)
              At score ≥ 50 OR 8 days inactive: re-engagement flow opens
              Specific message based on their last action, not a generic "we miss you"
```

---

## What Is Already Built ✅

- AI agent with 8 tools (ask, fill, click, navigate, highlight, complete, celebrate, escalate)
- Session system — tracks which step each user is on
- Churn score engine (0–100, opens widget at ≥ 50)
- Knowledge base (hybrid BM25 + vector search)
- MCP connectors (agent can call external APIs mid-conversation)
- Multilingual support via Sarvam AI (10 Indian languages)
- Integrations: Segment, Mixpanel, HubSpot, Webhook
- Failure inbox (sessions that went quiet mid-flow)
- A/B flow experiments
- Guardrails + sensitive field masking
- Audit log
- Stripe billing

---

## What Needs to Be Built — Phased Plan

---

### Phase 1 — Unified Flow Engine (Prerequisite for Everything)

**Problem:** `OnboardingFlow` is the only flow type. Everything is wired to linear onboarding steps.

**Goal:** One unified `AgentFlow` model with a `type` field so the same agent engine powers all lifecycle stages.

**Database changes:**
- Add `type` field to `OnboardingFlow`: `onboarding | adoption | upsell | retention | support`
- Add `triggerCondition` JSON field: defines when this flow auto-activates
- Rename `OnboardingFlow` → `AgentFlow` in schema (or add `type` and keep backward compat)

**Backend changes:**
- Flow selector logic: given a user + current page, pick the highest-priority matching flow
- Priority order: retention > upsell > adoption > onboarding
- A user can only be in one active flow at a time (current behavior, keep it)

**Dashboard changes:**
- Flow creation UI: "What type of flow?" with 5 options
- Each type has different default prompts and trigger UI

**Effort:** Medium — schema migration + flow selector logic

---

### Phase 2 — Trigger System Expansion

**Problem:** Widget only opens on idle (30s) or churn score. No triggers for adoption or expansion.

**Goal:** SaaS owners can define when the AI employee wakes up and acts.

**New trigger types to build:**

| Trigger | Config | Example |
|---|---|---|
| `page_visit` | URL pattern, first time only | User visits /reports for the first time → adoption flow |
| `page_never_visited` | URL pattern, days threshold | Never visited /integrations after 7 days → adoption nudge |
| `usage_threshold` | Metric + percentage | 80% of plan limit hit → expansion flow |
| `event_fired` | Event name | `dashboard_created` fires → surface next feature |
| `inactivity` | Days since last login | 8 days inactive → retention flow |
| `feature_unused` | Feature slug + days | Never used exports after 14 days → show exports |

**Widget changes:**
- On `init`, fetch trigger rules for this org
- Evaluate rules client-side against current page + user metadata
- Fire matching trigger → pick the right flow → open agent

**Backend changes:**
- New `TriggerRule` table linked to `AgentFlow`
- API endpoint: `GET /api/v1/triggers/evaluate?userId=...&page=...`
- Cron job: evaluate inactivity + usage triggers daily across all users

**Effort:** High — new data model + client-side evaluator + cron

---

### Phase 3 — Proactive Messaging (Agent Initiates)

**Problem:** Agent only responds when the user opens the widget. For retention, we need the agent to reach out first.

**Goal:** Agent can initiate contact via in-app notification or email when the user isn't actively using the product.

**In-app (user is in the product):**
- Widget bubble pulses + shows a message badge
- "You haven't connected your data source yet — want me to do it now?"
- User clicks → agent opens with context pre-loaded

**Out-of-app (user hasn't logged in):**
- Cron job evaluates retention triggers daily
- Fires email via Resend with a deep link back into the product
- Deep link includes a `?ahaget_resume=flow_id` param
- Widget detects param on load → opens immediately

**Backend changes:**
- `ProactiveMessage` table: tracks what was sent, when, to whom
- Deduplication: max 1 proactive message per user per 48 hours
- Unsubscribe mechanism (required for email)

**Effort:** Medium — cron + email template + widget param detection

---

### Phase 4 — Positioning & Messaging Update

**Problem:** Every surface says "onboarding." The product is now bigger than that.

**Files to update:**

**Landing page (`apps/landing`):**
- Hero headline: "Get every user to their first value moment" → "Give your SaaS an AI employee"
- Hero sub: rewrite around full lifecycle, not just onboarding
- HowItWorks: 4 steps → show the full lifecycle arc (activate → adopt → expand → retain)
- Pricing: reframe value props around lifecycle, not just sessions
- Footer tagline: "AI-powered onboarding for SaaS" → "The AI employee for SaaS"

**Dashboard (`apps/dashboard`):**
- "Onboarding Flows" sidebar label → "Agent Flows"
- "Activation" tab → stays but add "Adoption", "Expansion", "Retention" tabs
- Empty state copy on flow creation → reflect all 5 flow types
- Dashboard overview: show lifecycle funnel (activation → adoption → retention)

**Widget (`apps/widget`):**
- `oai-header-sub` text "Your onboarding guide · AI" → "Your AI assistant · Ahaget"

**Backend (`apps/backend`):**
- Route comments, log messages that say "onboarding" → "agent flow"
- `sendWelcomeEmail`: update copy to reflect full lifecycle pitch

**Effort:** Low-Medium — copy changes across 4 apps

---

### Phase 5 — Expansion Revenue Tooling (New Revenue Stream)

**Problem:** We detect churn risk but don't have dedicated upsell flow tooling.

**Goal:** SaaS owners can create upsell flows that trigger at the right moment and give Ahaget a share of the expansion MRR they drive.

**New features:**
- `UpsellFlow` type with a `targetPlan` field and `upgradeUrl`
- Agent tool: `suggest_upgrade` — presents a contextual upgrade card inside the widget
- Dashboard: "Expansion revenue" panel — tracks how much MRR each upsell flow drove
- Attribution: when user upgrades within 48h of an AI-initiated upsell, mark it as Ahaget-attributed

**Pricing implication:**
- Growth+ plans get upsell flow feature
- Future: revenue-share pricing tier (Ahaget takes % of attributed expansion MRR)

**Effort:** Medium

---

### Phase 6 — Analytics Expansion (Lifecycle Dashboard)

**Problem:** Dashboard currently shows activation funnel only.

**Goal:** Full lifecycle view so SaaS owners see Ahaget's ROI at every stage.

**New dashboard panels:**

| Panel | Metric |
|---|---|
| Activation | % users who completed onboarding (existing) |
| Feature Adoption | % users who used feature X within 14 days |
| Expansion | Upsells attributed to AI, MRR impact |
| Retention | Churn rate of users who engaged with AI vs. didn't |
| AI ROI | Estimated MRR saved from churn prevention + expansion |

**Effort:** Medium — new DB queries + dashboard UI

---

## Priority Order

```
Phase 1  Unified Flow Engine         ← foundation, nothing else works without it
Phase 4  Positioning Update          ← can run in parallel with Phase 1
Phase 2  Trigger System              ← unlocks adoption + retention flows
Phase 3  Proactive Messaging         ← unlocks retention + re-engagement
Phase 5  Expansion Tooling           ← new revenue stream
Phase 6  Analytics Expansion         ← shows ROI, drives upgrades
```

---

## Key Decisions Not Yet Made

1. **Schema rename:** Rename `OnboardingFlow` → `AgentFlow` everywhere (breaking migration) OR add `type` field and keep table name (safe, backward compat). Recommendation: add `type` field first, rename in Phase 2.

2. **Pricing model for Expansion flows:** Include in Growth plan OR make it a separate add-on with revenue share. Decision needed before Phase 5.

3. **Out-of-app proactive email:** Use existing Resend setup OR add a proper drip email system (Loops, Customer.io). Resend is fine for Phase 3, revisit at scale.

4. **Widget identity across flows:** Currently one widget = one active session. Multi-flow means a user could qualify for adoption AND retention simultaneously. Rule needed: highest priority wins, or queue them.

---

## What We Tell Clients Right Now

Even before Phases 1–6 are built, the repositioning pitch works today:

> "Ahaget is the AI employee inside your SaaS. Right now it specializes in activation — getting every new user to their first value moment, automatically. We're expanding it to handle feature adoption, retention, and expansion revenue throughout 2026. You embed it once, and it gets smarter over time."

The 2-line embed is the same. The value compounds as we ship phases.

---

## Competitive Positioning Summary

| | Appcues | Intercom | Ahaget |
|---|---|---|---|
| Onboarding | Passive tours | Passive tours | Active execution ✅ |
| Feature adoption | Tooltips | Tooltips | AI surfaces + sets up |
| Retention | Email (separate tool) | Email + chat | In-app proactive AI |
| Upsell | None | Manual | AI-attributed expansion |
| Execution | User follows along | User follows along | AI does it for them |
| Indian languages | No | No | 10 languages via Sarvam ✅ |
| Embed complexity | High (SDK) | High (SDK) | 2 lines of HTML |
