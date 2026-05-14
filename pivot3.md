# Pivot 3 — Connect your MCPs and APIs

**Date:** 2026-05-03  
**Author:** Senior SWE / Product Strategist  
**Feature:** Connect MCPs and APIs  

> If you want the agent to do more than read the screen, connect it to your backend. Ahaget supports MCP servers and direct API calls, so the agent can fetch live data, create records, trigger workflows, or call any service your product uses.
> - MCP servers: your tools, exposed as capabilities the agent can call
> - REST APIs: fetch data, create records, trigger actions
> - Scoped permissions: define what the agent can read and write
> - Pass user context (plan, role, segment) via script tag attributes

---

## Audit — What Exists Today

### ✅ Already Implemented (solid foundations)

| Component | Status | Detail |
|---|---|---|
| **McpConnector Prisma model** | ✅ Complete | `schema.prisma` — id, name, serverUrl, authType, authValue, enabled |
| **MCP CRUD routes** | ✅ Complete | `routes/mcp.ts` — GET list, POST create, PUT update, DELETE |
| **MCP service + JSON-RPC** | ✅ Complete | `services/mcp.ts` — tool list cache (5min), call execution, SSRF guard, name sanitisation |
| **Agent MCP call dispatch** | ✅ Complete | `agent.ts` — `loadMcpTools`, `toOpenAITools`, `handleMcpCall`, follow-up turn |
| **`call_api` built-in tool** | ✅ Complete | Agent can make arbitrary HTTP requests with URL guard, body interpolation, 10s timeout |
| **`allowedActions` guardrails** | ✅ Complete | `agent.ts` — per-step action type filtering from `step.allowedActions[]` |
| **`userMetadata` → agent prompt** | ✅ Complete | `agent.ts` — injected as `USER PROFILE:` section from session `metadata` field |
| **MCP dashboard page** | ✅ Complete | `app/(app)/mcp/page.tsx` — create/toggle/delete connectors |
| **Widget `metadata` field** | ✅ Complete | `config.ts` + `widget/api.ts` — passed as query param on session init |
| **Session route role routing** | ✅ Complete | `session.ts` — reads `metadata.role`, prefers role-targeted flow |

### ❌ Missing — Gaps in the Feature

| Gap | Impact | Priority |
|---|---|---|
| **No per-connector scoped permissions** | Agent can call any tool on a connector with no read/write boundary | **P0** |
| **No REST API connector type** | Only MCP (JSON-RPC) is supported; no way to register plain REST endpoints | **P0** |
| **No tool-level permission UI** | Dashboard has no interface to restrict which tools a connector exposes | **P1** |
| **Widget script-tag attribute reader** | `metadata` must be set in JS (`Ahaget('init', {...})`); no `data-ahaget-plan` HTML attrs | **P1** |
| **No "test connection" endpoint** | Users cannot verify a connector works before saving | **P1** |
| **MCP dashboard is minimal** | No tool list preview, no live connection status, no description field | **P2** |
| **No `call_api` dashboard UI** | Operators cannot define pre-approved API call templates per-step | **P2** |
| **No user context sandbox** | Operators cannot preview how user metadata changes agent behavior | **P3** |

---

## What Needs to Be Built

### Phase 1 — REST API Connector (P0)
Add a second connector type alongside MCP: plain REST endpoints. Operators define a base URL, auth, and a list of allowed endpoint patterns. The agent calls `call_api` but only to pre-approved URLs.

### Phase 2 — Scoped Permissions (P0)
Add a `permissions` JSON field to `McpConnector`:
- `allowedTools: string[]` — whitelist which MCP tools the agent may call (empty = all)
- `readOnly: boolean` — block any tool whose name contains write verbs (create, update, delete, set, post, put, patch)
- Backend enforces this in `services/mcp.ts` before dispatching `tools/call`

### Phase 3 — Script-Tag Attributes (P1)
Widget reads `data-ahaget-*` attributes from its own `<script>` tag so context can be injected server-side without JS:
```html
<script src="..." data-ahaget-key="..." data-ahaget-user-id="u_123"
        data-ahaget-plan="pro" data-ahaget-role="admin" data-ahaget-segment="enterprise">
</script>
```

### Phase 4 — Test Connection + Tool Preview (P1)
- `POST /api/v1/mcp/:id/test` — backend pings the MCP server, returns tool list or error
- Dashboard shows live tool list inline after connect
- Red/green status badge on connector card

### Phase 5 — Enhanced Dashboard UI (P2)
- Connector detail panel (edit name, URL, auth, permissions)
- Tool list preview with allow/block toggles per tool
- `call_api` template builder UI per flow step
- Connection status indicators

---

## Implementation Plan

### Step 1: Scoped permissions on McpConnector schema
- Add `allowedTools String[] @default([])` and `readOnly Boolean @default(false)` to `McpConnector`
- Create migration `20260503_add_connector_permissions`

### Step 2: Enforce permissions in `services/mcp.ts`
- Filter tool list by `allowedTools` before sending to agent
- Block `tools/call` if `readOnly=true` and tool name matches write-verb regex

### Step 3: REST API connector
- Add `connectorType String @default("mcp")` to schema (`mcp` | `rest`)
- New `RestApiEndpoint` child model: `{ id, connectorId, method, urlPattern, description }`
- Backend: `GET /api/v1/mcp/:id/endpoints`, `POST`, `DELETE`
- Agent: when `call_api` fires, validate URL against org's approved endpoint patterns

### Step 4: Widget script-tag attribute reader
- In `widget.ts` constructor, read `document.currentScript.dataset.*`
- Merge into `WidgetConfig` before session init
- Keys: `ahagetKey`, `ahagetUserId`, `ahagetPlan`, `ahagetRole`, `ahagetSegment`, `ahagetMetadata`

### Step 5: Test connection endpoint
- `POST /api/v1/mcp/:id/test` — calls `tools/list` with 3s timeout, returns `{ ok, tools[], error? }`
- Dashboard "Test connection" button shows tool list or error message inline

### Step 6: Enhanced MCP dashboard
- Replace minimal table with card grid
- Add connector detail slide-out panel with permission controls
- Tool list preview (fetched via test endpoint)
- Inline tool toggle (allowed / blocked per connector)

---

## Files to Create / Modify

| File | Change |
|---|---|
| `apps/backend/prisma/schema.prisma` | Add `allowedTools`, `readOnly`, `connectorType` to `McpConnector`; add `RestApiEndpoint` model |
| `apps/backend/prisma/migrations/20260503_add_connector_permissions/` | New migration SQL |
| `apps/backend/src/services/mcp.ts` | Enforce `allowedTools` filter + `readOnly` guard in `callMcpTool` and `loadMcpTools` |
| `apps/backend/src/routes/mcp.ts` | Add `POST /:id/test`, `GET/POST/DELETE /:id/endpoints` |
| `apps/widget/src/widget.ts` | Read `data-ahaget-*` from `currentScript.dataset` |
| `apps/widget/src/config.ts` | Add `plan`, `role`, `segment` to `WidgetConfig` |
| `apps/dashboard/app/(app)/mcp/page.tsx` | Full redesign — card grid, detail panel, tool preview, permission toggles |
| `apps/dashboard/lib/api.ts` | Add `mcp.test()`, `mcp.listEndpoints()`, `mcp.addEndpoint()`, `mcp.deleteEndpoint()` |

---

## Success Criteria

- [ ] Operator can register an MCP server, restrict it to specific tools, and mark it read-only
- [ ] Operator can register REST API base URLs; agent `call_api` only reaches approved patterns
- [ ] Widget reads `data-ahaget-plan/role/segment` from `<script>` tag; agent receives them as USER PROFILE
- [ ] "Test connection" shows live tool list within 5 seconds
- [ ] Dashboard displays connection status badge (green/red) per connector
- [ ] All TypeScript compiles with 0 errors after each step
