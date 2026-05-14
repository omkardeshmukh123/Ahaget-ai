# Pivot 21 — MCP Feature Completeness: Observability, Goal-Mode Access, and Async Workflows

## Honest Assessment

The core MCP infrastructure is built and wired. An operator can register an MCP server or REST API, the agent loads tools from it, calls them mid-session, and results feed back into the conversation. The plumbing works.

What is missing is everything that makes an operator **trust** it in production and the flexibility to use it in all agent modes.

### What already works
- Full CRUD for MCP connectors and REST connectors (`routes/mcp.ts`)
- MCP client: JSON-RPC 2.0 `tools/list` + `tools/call` with 5-min cache, SSRF guard, write-verb blocking, tool allowlist filter (`services/mcp.ts`)
- Agent loads MCP tools at runtime and dispatches calls back to the server (`agent.ts:677`)
- `call_api` tool with endpoint allowlist enforcement for REST connectors
- Dashboard: create/edit/toggle connectors, tool allow/block per connector, REST endpoint whitelist, context sources
- Auth: none / bearer / api_key per connector

### What is missing

| Gap | Impact |
|---|---|
| No MCP tool call audit log | Operators cannot see what the agent called, what arguments it sent, or what the external system returned. Blocks enterprise trust. |
| `call_api` blocked in autonomous/goal mode | `agent.ts:1515` explicitly filters `call_api` as "too risky." Operators who want REST HTTP calls in goal mode have no opt-in path. |
| No async/webhook workflow support | All MCP calls are synchronous with a 10 s hard timeout. Long-running operations (e.g. "provision workspace") have no poll-until-complete mechanism. |
| No test-call UI in dashboard | Operators can discover tool names via "Test Connection" but cannot invoke a specific tool with custom arguments from the dashboard to verify behavior before deploying. |
| `AuditLog` model omits MCP calls | The existing `AuditLog` records `fill_form`, `click`, `navigate` etc. but has no `actionType` entries for `mcp_tool_call` or `call_api`. |

---

## Goal

Make MCP a trustworthy, fully observable, and flexible capability:
1. Every MCP / REST tool call made by the agent is logged with args, result, latency, and session ID
2. Operators can view call history per connector and per session in the dashboard
3. Operators can opt specific connectors into goal/autonomous mode for `call_api`
4. Long-running tool calls have a poll-until-complete pattern so the agent doesn't time out on slow workflows
5. Operators can test-call any tool from the dashboard with custom args and see the raw result

---

## Scope

### 1. MCP Call Audit Log — Schema + Persistence

**Problem:** The existing `AuditLog` covers UI actions but not external API calls. There's no way to answer "did the agent actually create that record?" or "what did the CRM return?"

**File:** `apps/backend/prisma/schema.prisma`

Add a new model after `ContextSource`:

```prisma
// ─── McpCallLog (every MCP/REST tool call the agent made) ────────────────────
model McpCallLog {
  id             String   @id @default(uuid())
  organizationId String   @map("organization_id")
  sessionId      String?  @map("session_id")
  connectorId    String?  @map("connector_id")
  connectorName  String   @map("connector_name")     // snapshot — connector may be deleted
  toolName       String   @map("tool_name")          // e.g. "create_ticket" or "GET /users/123"
  callType       String   @map("call_type")          // "mcp" | "rest"
  args           Json     @default("{}")             // what the agent sent
  result         Json?                               // what came back (null on timeout/error)
  isError        Boolean  @default(false) @map("is_error")
  latencyMs      Int?     @map("latency_ms")
  createdAt      DateTime @default(now()) @map("created_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId, createdAt(sort: Desc)])
  @@index([sessionId])
  @@map("mcp_call_logs")
}
```

Add `mcpCallLogs McpCallLog[]` to the `Organization` model relation list.

**Migration:** `apps/backend/prisma/migrations/20260514_add_mcp_call_log/`

---

### 2. MCP Call Audit Log — Service Writes

**File:** `apps/backend/src/services/mcp.ts`

After every successful or failed `callMcpTool` invocation, write a `McpCallLog` row. This must be non-blocking — wrap in `prisma.mcpCallLog.create(...).catch(() => {})` so a DB failure never kills the agent turn.

Modify `callMcpTool` signature to accept `orgId` and `sessionId` (already available at call sites in `agent.ts`):

```ts
export async function callMcpTool(
  connector: ConnectorRow,
  toolName: string,
  args: Record<string, unknown>,
  meta: { orgId: string; sessionId?: string },
): Promise<McpToolResult>
```

Inside, after `rpc()` resolves:

```ts
const latencyMs = Date.now() - t0;
prisma.mcpCallLog.create({
  data: {
    organizationId: meta.orgId,
    sessionId:      meta.sessionId ?? null,
    connectorId:    connector.id,
    connectorName:  connector.name,
    toolName,
    callType:       'mcp',
    args,
    result:         result ? (result as unknown as Prisma.InputJsonValue) : null,
    isError:        !result || !!result.isError,
    latencyMs,
  },
}).catch(() => {});
```

Similarly, log `call_api` REST calls in `agent.ts` at the point where `executeApiCall` returns (lines ~896 and ~1101). Use `callType: 'rest'` and `toolName: "${method} ${url}"`.

**File:** `apps/backend/src/services/agent.ts`

Update both `call_api` handler branches to pass `{ orgId: opts.org.id, sessionId: opts.sessionId }` to `callMcpTool`. Update the two `handleMcpCall` call sites similarly.

---

### 3. MCP Call Log — Backend Route

**File:** `apps/backend/src/routes/mcp.ts`

Add two read-only endpoints:

```
GET /api/v1/mcp/calls?limit=50&offset=0&connectorId=<id>
  → returns McpCallLog rows for the org, newest first
  → connectorId filter is optional

GET /api/v1/mcp/calls/session/:sessionId
  → returns all McpCallLog rows for a specific session
```

Both require `authenticateJWT`. Return fields: `id, connectorName, toolName, callType, isError, latencyMs, createdAt` only in list view. For detail, add `args` and `result` via a separate endpoint if needed (avoid leaking large blobs in list).

---

### 4. MCP Call Log — Dashboard UI

**File:** `apps/dashboard/app/(app)/mcp/page.tsx`

Add a "Recent Activity" section below the Context Sources section on the MCP page.

Layout:
```
Recent Activity                                         [ Refresh ]

CONNECTOR       TOOL                 STATUS   LATENCY   TIME
Production DB   create_ticket        ✓ OK     243 ms    2 min ago
CRM API         GET /contacts/u123   ✓ OK     89 ms     5 min ago
Billing MCP     update_subscription  ✗ Error  10.0 s    12 min ago
```

Click a row to expand inline: show `args` and `result` as formatted JSON.

Fetch from `GET /api/v1/mcp/calls?limit=20`. Poll every 30 s when the page is open (or add a manual Refresh button). No websocket needed.

**File:** `apps/dashboard/lib/api.ts`

Add `mcp.listCalls(params?: { connectorId?: string; limit?: number }): Promise<{ calls: McpCallLog[] }>`.

---

### 5. Goal-Mode Opt-In for `call_api`

**Problem:** `agent.ts:1515` permanently removes `call_api` from goal/autonomous mode. The concern is valid — unguarded REST calls in autonomous mode are risky. But operators with a locked-down endpoint allowlist should be able to opt in.

**File:** `apps/backend/prisma/schema.prisma`

Add a field to `McpConnector`:

```prisma
allowInGoalMode Boolean @default(false) @map("allow_in_goal_mode")
```

**File:** `apps/backend/src/services/agent.ts`, `runAgentGoal()`

Change the hard filter at line 1515 from:

```ts
.filter((t) => t.function.name !== 'call_api')
```

to:

```ts
.filter((t) => {
  if (t.function.name !== 'call_api') return true;
  // allow call_api only if the org has at least one REST connector with allow_in_goal_mode
  return restConnectorAllowedInGoalMode;
})
```

Where `restConnectorAllowedInGoalMode` is resolved before tool construction:

```ts
const restConnectorAllowedInGoalMode = await prisma.mcpConnector.findFirst({
  where: { organizationId: org.id, connectorType: 'rest', enabled: true, allowInGoalMode: true },
  select: { id: true },
}).then(Boolean).catch(() => false);
```

**File:** `apps/dashboard/app/(app)/mcp/page.tsx`, `DetailPanel`

Add a checkbox below the existing `readOnly` checkbox, only visible when `connectorType === 'rest'`:

```
☐ Allow in autonomous mode — permit call_api calls during goal-directed sessions
  Only enable if your endpoint allowlist is locked down.
```

**File:** `apps/backend/src/routes/mcp.ts`

Add `allowInGoalMode: z.boolean().optional().default(false)` to `ConnectorSchema`.

---

### 6. Test-Call UI in Dashboard

**Problem:** Operators discover tool names from "Test Connection" but can't verify what a tool actually does before the agent calls it in a live session.

**File:** `apps/backend/src/routes/mcp.ts`

Add a new endpoint:

```
POST /api/v1/mcp/:id/call
Body: { toolName: string; args: Record<string, unknown> }
```

Validates:
- Connector belongs to org
- `toolName` is in `allowedTools` (if allowedTools is non-empty)
- Connector is not `readOnly` or toolName doesn't match WRITE_VERB_RE if readOnly

Then calls `callMcpTool` and returns `{ result, latencyMs, isError }`. Logs a `McpCallLog` row with `sessionId: null`.

**File:** `apps/dashboard/app/(app)/mcp/page.tsx`, `ToolPreview` component

Add a "Test Call" button next to each tool in the live tool list. On click, open an inline form:

```
Tool: create_ticket
Args (JSON):
┌─────────────────────────────────┐
│ {                               │
│   "title": "Test ticket",       │
│   "priority": "high"            │
│ }                               │
└─────────────────────────────────┘
[ Run Test Call ]

Result (243 ms):
┌─────────────────────────────────┐
│ { "id": "TKT-001", "status":    │
│   "created" }                   │
└─────────────────────────────────┘
```

**File:** `apps/dashboard/lib/api.ts`

Add `mcp.callTool(connectorId: string, toolName: string, args: Record<string, unknown>): Promise<{ result: unknown; latencyMs: number; isError: boolean }>`.

---

### 7. Async / Long-Running Tool Call Pattern

**Problem:** The current `callMcpTool` has a 10 s hard timeout. Workflows like "provision workspace" or "run migration" can take 30–120 s. The agent times out and the user sees an error.

This is addressed with a poll-until-complete convention exposed as a standard tool pattern. No new infrastructure is needed — this is a prompt + service-level pattern.

**File:** `apps/backend/src/services/mcp.ts`

Add a `callMcpToolAsync` wrapper that:
1. Calls `tools/call` with a `30_000` ms timeout instead of `10_000`
2. If the result contains `{ status: "pending", jobId: "..." }` (a convention MCP servers can adopt), enters a poll loop: calls a `tools/call` with `{ name: "check_job_status", arguments: { jobId } }` every 3 s, up to 10 attempts (30 s total), until `status !== "pending"` or exhausted

```ts
export async function callMcpToolWithPoll(
  connector: ConnectorRow,
  toolName: string,
  args: Record<string, unknown>,
  meta: { orgId: string; sessionId?: string },
): Promise<McpToolResult>
```

The agent does not need to know about this — it calls the tool normally and the service resolves synchronously from its perspective (blocking up to 30 s).

**File:** `apps/backend/src/services/agent.ts`, `handleMcpCall()`

Replace `callMcpTool` with `callMcpToolWithPoll` for the async-capable path. The synchronous `callMcpTool` remains for context sources.

**Dashboard guidance:** Document the async tool convention in the "MCPs & APIs" page how-to callout:

```
⚡ Long-running tools — if your tool returns { "status": "pending", "jobId": "..." },
Ahaget will automatically poll for completion (up to 30 s). No changes needed on your end.
```

---

## Execution Order

| Phase | Scope items | Why first |
|---|---|---|
| 1 | Items 1–3 (audit log: schema + writes + route) | Schema first; everything else reads from this table |
| 2 | Item 4 (dashboard activity feed) | Immediate operator value; just a read view |
| 3 | Item 5 (goal-mode opt-in) | Small schema + service change; unlocks blocked use case |
| 4 | Item 6 (test-call UI) | Operator DX; depends on new route from item 3 |
| 5 | Item 7 (async poll pattern) | No schema change; service-only; implement last to avoid blocking earlier wins |

---

## Success Criteria

- [ ] Every agent-initiated MCP tool call and `call_api` REST call produces a `McpCallLog` row
- [ ] Dashboard "Recent Activity" shows calls with tool name, connector, status, latency — oldest within 30 s of the call
- [ ] Operators with a locked REST connector can enable `allow_in_goal_mode` and the agent uses `call_api` in autonomous flows
- [ ] Operator can test-call a tool from the dashboard and see the raw result before it goes live
- [ ] Tools that return `{ status: "pending", jobId }` resolve within 30 s instead of timing out at 10 s
- [ ] No MCP call log write ever crashes or slows an agent turn (non-blocking fire-and-forget pattern)
- [ ] `McpCallLog` rows with `isError: true` are visually distinct in the dashboard (red status)
