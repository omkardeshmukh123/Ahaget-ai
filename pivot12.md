# Pivot 12 — Question Clustering: Gap Analysis & Build Plan

**Feature spec:** Group questions users ask across sessions. Surface the top 10 things confusing users on any page. Find patterns your product team can act on. Hand off to your team with full context.

---

## Audit Result: Partially Built Shell

The skeleton exists. The core differentiators are missing.

### What's already built

| Layer | What exists |
|-------|-------------|
| Backend | `GET /api/v1/analytics/intents?days=N` — regex-classifies messages into 5 buckets (how_to, stuck, navigation, question, other), deduplicates by normalised text, returns top 100 sorted by frequency |
| Frontend | `/questions` page — 2-col layout: intent bucket sidebar + question-variation detail panel |
| API client | `api.analytics.intents(days)`, `IntentQuestion` type, `IntentsResponse` type |
| UX | Day-range selector (7/30/90 days) |

### What's missing (the actual feature)

#### Gap 1 — Page context doesn't exist in the data model ❌
The feature promise is "on **any page**." The `Conversation` and `Message` models have **zero URL fields**. The widget knows what page it's on but never sends it. No migration exists.

Without this, you cannot answer: *"What are users confused about on /pricing?"*

**Affected files:**
- `apps/backend/prisma/schema.prisma` — `Conversation` model needs `pageUrl`
- `apps/widget/src/` — widget must capture `window.location.pathname` on conversation start
- `apps/backend/src/routes/conversations.ts` — store pageUrl on create
- `apps/backend/src/routes/analytics.ts` — intents endpoint needs `?page=` filter + per-page breakdown

#### Gap 2 — "Top 10 per page" view doesn't exist ❌
Even if page data existed, there's no UI to select a page and see its top 10 confusion clusters.

**Need:** A page-picker (dropdown or search) that filters the questions panel to a specific URL slug, with a ranked top-10 list rather than the current unbounded list.

#### Gap 3 — Team handoff is completely absent ❌
"Hand off to your team with full context" = nothing is built. No export, no share link, no Slack digest, no copy-to-clipboard.

**Need (pick one, ship it, iterate):**
- **Slack digest** — weekly POST to the org's existing `slackWebhookUrl` from `FollowUpConfig`, containing top 10 clusters per page with example quotes
- **CSV export** — one-click download from the questions page
- **Share link** — read-only public URL for a snapshot (more complex, do later)

Slack digest is the fastest path because the webhook infrastructure (`FollowUpConfig.slackWebhookUrl`) already exists.

#### Gap 4 — The `/questions` page is not in the sidebar nav ❌
`apps/dashboard/components/Sidebar.tsx` has no entry for `/questions`. The page exists and is fully built but is **unreachable from the UI**. This is a zero-effort fix.

#### Gap 5 — Clustering is regex dedup, not semantic ⚠️ (v2 concern)
"Can't find billing", "where is billing section", "billing page not loading" are three separate entries today. Real clustering would group them. This is a v2 concern — the regex approach is fine for launch but will frustrate teams with high message volume where the same confusion shows up in 20 surface forms.

---

## Build Plan

### Phase 1 — Make the data model real (prerequisite)

**1a. Schema migration**
```sql
-- Add pageUrl to conversations
ALTER TABLE conversations ADD COLUMN page_url TEXT;
```
Prisma schema: add `pageUrl String? @map("page_url")` to `model Conversation`.

**1b. Widget — capture page on start**
In `apps/widget/src/`, when a conversation is created, include `pageUrl: window.location.pathname` in the POST body.

**1c. Backend — store pageUrl**
In `apps/backend/src/routes/conversations.ts`, on conversation create, persist `pageUrl` from request body.

**1d. Analytics endpoint — add page filter**
`GET /api/v1/analytics/intents?days=30&page=/pricing`
- If `page` param is present, filter `conversation.pageUrl` (contains match)
- Add a `pages` field to the response: `{ url: string; questionCount: number }[]` sorted by question volume — this powers the page-picker dropdown

---

### Phase 2 — UI: Top 10 per page

**New layout for `/questions` page:**
```
[ Page picker dropdown: "All pages" | /pricing | /settings | /signup ... ]

Left panel: Top 10 clusters (ranked)   Right panel: Question variations + count + last seen
```

- Replace intent-bucket sidebar with a **ranked top-10 list** (the most-asked normalised clusters)
- Add page picker at the top that reloads with `?page=` filter
- Keep the day-range selector

The "top 10" should be global by default (same as now) and scoped when a page is selected.

---

### Phase 3 — Team handoff

**Option A (ship first): Slack weekly digest**

Cron or manual trigger in backend:
```
POST FollowUpConfig.slackWebhookUrl
Body: "Top 10 questions this week across your AI assistant:
1. [×47] 'how do I change my plan' — /settings/billing
2. [×31] 'cant find the export button' — /reports
...
View full breakdown → https://dashboard.ahaget.com/questions"
```

Trigger: weekly on Monday 9am org timezone (use existing cron infrastructure if any, or a simple `node-cron` in the backend).
Config toggle: add `questionDigestEnabled Boolean @default(false)` to `FollowUpConfig`.

**Option B: CSV export**

Button on `/questions` page → `GET /api/v1/analytics/intents/export?days=30&format=csv`
Returns: `question,count,intent,lastSeen,page`

CSV is faster to build than Slack and covers the "full context" handoff need for async review.

**Recommendation:** Build CSV export first (1 endpoint + 1 button, ~2h), then Slack digest.

---

### Phase 4 — Sidebar nav fix (5 minutes)

In `apps/dashboard/components/Sidebar.tsx`, add to the ANALYTICS section:
```ts
{ href: '/questions', label: 'Questions', icon: <QuestionIcon /> },
```

This is a blocker — the page is invisible without this.

---

## Effort estimate

| Phase | What | Effort |
|-------|------|--------|
| 1a-1d | Schema + widget + backend + analytics filter | ~1 day |
| 2 | UI: page picker + top-10 layout | ~0.5 day |
| 3 (CSV) | Export endpoint + button | ~2h |
| 3 (Slack digest) | Weekly Slack digest | ~3h |
| 4 | Sidebar nav link | 5 min |

**Total to MVP with all 4 gaps closed:** ~2 days

---

## Decision needed

1. **Handoff format** — CSV export or Slack digest first? (Slack reuses existing infrastructure but needs config toggle; CSV is always useful)
2. **Page URL granularity** — store full `pathname` only (e.g. `/settings/billing`) or also `origin` (cross-site widgets)? Pathname-only is fine for single-app installs.
3. **Clustering v2** — accept regex dedup for launch or invest in LLM batch clustering now? Recommendation: ship regex, revisit at 10k+ messages/org.
