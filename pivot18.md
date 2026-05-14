# Pivot 18 — Live Backend Data: Proactive Context Enrichment

## Status Assessment

**Partially implemented.** The low-level plumbing is solid:
- MCP protocol client (JSON-RPC 2.0) — tools/list + tools/call, 5-min cache
- REST connector with endpoint allowlist, auth injection, SSRF protection
- Agent tool dispatch — `call_api` and `mcp__*` tools wired in both step mode and goal mode
- Dashboard UI — connector CRUD, tool allow/block, endpoint management, test connection

**What's missing** is the product-level promise: *"Account status, billing info, feature flags, usage metrics — the agent sees what you let it see."* This implies the agent **already knows** this data when the conversation starts. Currently the agent only calls tools reactively mid-conversation when it decides to. There is no mechanism to pre-fetch data and inject it into the agent's context at session start.

---

## The Gap

### Current behavior
```
Session starts → agent sees: user metadata (plan/role from script tag) + MCP tool list notice
Agent decides mid-turn whether to call a tool → makes network call → gets data
```

### What the feature promises
```
Session starts → agent sees: user metadata + live account status + feature flags + usage metrics
Agent already knows the user's situation before the first message
```

This is a fundamentally different architecture. Right now MCP is a tool the agent can use. The feature needs MCP/REST to be a **data source** that enriches context before the agent speaks.

---

## Problem

Without proactive context enrichment:

1. The agent may give advice based on stale/wrong assumptions about the user's account state (e.g., guides a user to upgrade when they're already on Pro)
2. Multi-turn latency increases — the agent needs an extra round-trip to fetch data when it could have had it upfront
3. Feature flags can't gate flows (e.g., "only show the API integration flow if `feature_api_enabled: true`")
4. Operators can't do the core use case: "use my billing API to personalize what the agent says"

---

## Goal

Make MCP/REST connectors work as **session context sources** — data fetched automatically at session start and injected into the agent's system prompt — in addition to their existing role as mid-conversation tools.

---

## Scope

### 1. Schema — ContextSource model

**File:** `apps/backend/prisma/schema.prisma`

Add a `ContextSource` that points to either an MCP tool call or a REST endpoint to execute at session start:

```prisma
model ContextSource {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  name           String                           // e.g. "Account Status"
  description    String   @default("")
  enabled        Boolean  @default(true)

  // MCP source: call a specific tool on a connector
  connectorId    String?  @map("connector_id")   // FK → McpConnector
  mcpToolName    String?  @map("mcp_tool_name")  // tool to call on session start
  mcpToolArgs    Json     @default("{}") @map("mcp_tool_args") // static args (can use {{userId}})

  // REST source: GET a URL and inject the response
  restUrl        String?  @map("rest_url")       // full URL, supports {{userId}} etc.
  restMethod     String   @default("GET") @map("rest_method")

  // What the agent sees
  contextKey     String   @map("context_key")    // label in system prompt, e.g. "Account Status"
  allowedFields  String[] @default([]) @map("allowed_fields") // field-level allowlist; empty = all

  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  organization   Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  connector      McpConnector? @relation(fields: [connectorId], references: [id], onDelete: SetNull)

  @@index([organizationId])
  @@map("context_sources")
}
```

Migration: `apps/backend/prisma/migrations/20260514_add_context_sources/`

Also add `contextSources ContextSource[]` to the `Organization` model and `contextSources ContextSource[]` to `McpConnector`.

---

### 2. Backend — Context Source Fetcher Service

**New file:** `apps/backend/src/services/contextSources.ts`

```ts
// Fetches all enabled ContextSources for an org at session start.
// Returns a formatted string block for injection into the agent system prompt.
// Runs in parallel, with a 2s hard timeout per source.
// Field allowlist filtering applied to response before injection.
export async function fetchSessionContext(
  orgId: string,
  userVars: Record<string, string>,  // {userId, plan, role, ...} for {{interpolation}}
): Promise<string>
```

Internals:
- Load all enabled `ContextSource` rows for the org (60s cache, cleared on CRUD)
- For each source, run in parallel:
  - MCP source: call `tools/call` on the connector with interpolated args
  - REST source: GET the interpolated URL with connector auth headers
- Apply `allowedFields` filter to JSON response (field-level access control)
- Truncate each source response to 1000 chars
- Aggregate into a `LIVE CONTEXT` block:
  ```
  LIVE CONTEXT (fetched at session start — treat as authoritative):
  Account Status: {"plan":"pro","seats_used":8,"seats_limit":10,"status":"active"}
  Feature Flags: {"api_integration":true,"bulk_export":false,"sso":true}
  Usage (last 30d): {"api_calls":12400,"exports":3}
  ```
- Hard timeout: 2s per source, skip and log on failure — never block agent turn
- Cache: per-session (don't re-fetch on every message turn)

---

### 3. Agent — Inject LIVE CONTEXT into System Prompt

**File:** `apps/backend/src/services/agent.ts`

In `prepareAgentCall()` and `runAgentGoal()`:
- Add `liveContext?: string` to the inputs
- Inject into `buildSystemPrompt()` after `USER PROFILE`, before KB section:
  ```
  ${liveContext ? `\n${liveContext}\n` : ''}
  ```

In `buildSystemPrompt()`, add `liveContext` to the token budget guard — count it against the 40k char budget.

---

### 4. Session Start — Fetch Context Sources

**File:** `apps/backend/src/routes/session.ts`

In the session start handler (POST `/api/v1/session`):
- After loading the org and user metadata, call `fetchSessionContext(orgId, userVars)`
- Store the result in the session record (`liveContextSnapshot` JSON field) for debugging
- Pass to `runAgent` / `runAgentStream` via the new `liveContext` param

**Schema addition:**
```prisma
model Session {
  ...
  liveContextSnapshot  Json?  @map("live_context_snapshot")  // what the agent saw at session start
}
```

---

### 5. Backend Routes — Context Source CRUD

**New file:** `apps/backend/src/routes/contextSources.ts`

Endpoints:
- `GET /api/v1/context-sources` — list org's context sources
- `POST /api/v1/context-sources` — create
- `PUT /api/v1/context-sources/:id` — update
- `DELETE /api/v1/context-sources/:id` — delete
- `POST /api/v1/context-sources/:id/test` — dry-run fetch (returns raw + filtered response, for dashboard preview)

Register in `apps/backend/src/index.ts`.

---

### 6. Dashboard — Context Sources UI

**New file:** `apps/dashboard/app/(app)/mcp/context-sources.tsx` (sub-panel inside MCP page, not a new route)

UI sections:
1. **Context Sources list** — cards showing name, source type (MCP/REST), last fetch status
2. **Add Context Source form:**
   - Name (e.g. "Account Status")
   - Source type toggle: MCP Tool | REST Endpoint
   - If MCP: connector dropdown → tool name dropdown (populated from test connection)
   - If REST: URL input with `{{userId}}` hint, method selector
   - Allowed fields: comma-separated list ("plan,status,seats_used") — empty = all fields
3. **Test button** — shows raw API response + filtered output side-by-side
4. **Enable/disable toggle** per source

**File:** `apps/dashboard/lib/api.ts` — add `contextSources` namespace:
```ts
contextSources: {
  list: () => apiFetch<{ sources: ContextSource[] }>('/api/v1/context-sources'),
  create: (data: {...}) => apiFetch<{ source: ContextSource }>('/api/v1/context-sources', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<...>) => ...,
  delete: (id: string) => ...,
  test: (id: string) => apiFetch<{ raw: unknown; filtered: unknown; error?: string }>(`/api/v1/context-sources/${id}/test`, { method: 'POST' }),
},
```

---

### 7. Session Debug — Live Context Visibility

**File:** `apps/dashboard/app/(app)/sessions/[id]/page.tsx`

Add a "Live Context" card in the sidebar (next to the User Profile card from pivot17):
- Shows the `liveContextSnapshot` stored on the session
- Label: "Data fetched at session start"
- Each key-value pair as a readable row
- Empty state: "No context sources configured" with link to Settings → MCPs & APIs

---

### 8. Conditional Flow Triggering Based on Live Data (Phase 2 — not this pivot)

**Not in scope for pivot18** — document as follow-on:
- Flow targeting condition: `contextSource.accountStatus.plan === 'free'`
- Trigger rules based on live data values
- This requires a condition evaluator across live context fields — separate pivot

---

## Implementation Order

1. **Schema + migration** — 45 min (ContextSource model, liveContextSnapshot on Session)
2. **`contextSources.ts` service** — 2h (fetch, interpolate, filter, cache, timeout)
3. **Agent system prompt injection** — 30 min (new `liveContext` param through the chain)
4. **Session start wiring** — 30 min (call fetchSessionContext, store snapshot)
5. **CRUD routes + index.ts registration** — 1h
6. **Dashboard UI** — 2.5h (list, add form, test panel, session detail card)
7. **API lib** — 20 min

Total: ~1 day

---

## Success Criteria

- [ ] Operator can create a Context Source pointing to an MCP tool or REST endpoint
- [ ] On session start, enabled Context Sources are fetched and injected into the agent system prompt
- [ ] Agent references live data naturally (e.g., mentions current plan, flags correctly)
- [ ] Field allowlist works: only listed fields visible to the agent
- [ ] Individual source fetch timeout (2s) never blocks session start
- [ ] Session detail page shows what live data the agent received
- [ ] Test button in dashboard shows raw response and filtered preview

---

## Non-Goals

- Conditional flow targeting based on live context values — future pivot
- Streaming/webhook-based real-time updates mid-conversation — future pivot
- Agent writing back to context sources (read-only scope for now)
- Per-user caching of context source responses — future optimization

---

## Security Notes

- All context source URLs go through `assertPublicUrl()` (SSRF protection already in `ipGuard.ts`)
- Auth headers injected server-side — never exposed to widget/browser
- `allowedFields` filter is enforced server-side before injecting into system prompt
- `liveContextSnapshot` stored in DB — never returned to widget (server-side only)
- Context source responses truncated to 1000 chars each before prompt injection
