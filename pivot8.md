# Pivot 8 — REST API Guardrail Enforcement

## Status Audit: Feature 03 "Connect your MCPs and APIs"

### What's fully shipped
- MCP JSON-RPC integration: tools/list + tools/call, 5-min tool cache, SSRF guard, parallel fetch
- MCP scoped permissions: `allowedTools` whitelist (filtered at load), `readOnly` write-verb
  guard (enforced at load-time AND call-time in `mcp.ts`)
- `call_api` built-in agent tool executes arbitrary HTTP requests with SSRF protection
- Dashboard UI: create/configure/enable/disable/delete connectors, live tool preview with
  per-tool allow/block toggle, REST endpoint manager (add urlPattern + method per connector)
- User context via script tag: `data-ahaget-plan/role/segment` → `metadata` → `USER PROFILE`
  injected into every system prompt turn

### The gaps

**Gap 1 — REST endpoint allowlist never enforced (critical)**
`RestApiEndpoint` rows accumulate in the DB as operators add them via the dashboard.
But `agent.ts:728` — the `call_api` handler — only calls `assertPublicUrl` (SSRF check).
It never queries `RestApiEndpoint`. The agent can call any public URL with any HTTP method
regardless of what operators configured. The permissions UI is cosmetic.

**Gap 2 — REST connector auth headers never applied to `call_api`**
When a connector is `connectorType = 'rest'`, `loadMcpTools` attempts JSON-RPC `tools/list`
on it (which returns nothing). The connector's `authType/authValue` and `readOnly` flag
are never forwarded to `call_api` at execution time. Operators who set Bearer/API-key auth
on a REST connector get no effect.

---

## Pivot 8 Plan

Two targeted fixes in `agent.ts` + one new helper in `mcp.ts`. No schema migration needed.

---

### Fix 1 — Enforce REST endpoint allowlist in `call_api` (~30 lines)

**Files:** `apps/backend/src/services/mcp.ts`, `apps/backend/src/services/agent.ts`

#### Step A — Add `loadRestEndpoints` to `mcp.ts`

```typescript
// Cache: orgId → { endpoints, fetchedAt }
const restEndpointCache = new Map<string, { endpoints: RestEndpointRow[]; fetchedAt: number }>();
const REST_ENDPOINT_CACHE_TTL_MS = 60_000;

interface RestEndpointRow {
  method: string;
  urlPattern: string;
  readOnly: boolean;
}

export async function loadRestEndpoints(orgId: string): Promise<RestEndpointRow[]> {
  const cached = restEndpointCache.get(orgId);
  if (cached && Date.now() - cached.fetchedAt < REST_ENDPOINT_CACHE_TTL_MS) {
    return cached.endpoints;
  }
  const endpoints = await prisma.restApiEndpoint.findMany({
    where: { connector: { organizationId: orgId, enabled: true, connectorType: 'rest' } },
    select: { method: true, urlPattern: true, readOnly: true },
  });
  restEndpointCache.set(orgId, { endpoints, fetchedAt: Date.now() });
  return endpoints;
}

export function matchesRestEndpoint(
  url: string,
  method: string,
  endpoints: RestEndpointRow[],
): { allowed: boolean; reason?: string } {
  if (endpoints.length === 0) return { allowed: true }; // no rules = allow all (backward-compat)
  const matching = endpoints.filter((ep) => url.toLowerCase().startsWith(ep.urlPattern.toLowerCase()));
  if (matching.length === 0) return { allowed: false, reason: `URL not in approved endpoint list` };
  const methodMatch = matching.find((ep) => ep.method === method || ep.method === 'GET');
  if (!methodMatch) return { allowed: false, reason: `Method ${method} not permitted for this endpoint` };
  if (methodMatch.readOnly && method !== 'GET') {
    return { allowed: false, reason: `Endpoint is read-only; only GET is permitted` };
  }
  return { allowed: true };
}
```

#### Step B — Add enforcement in `agent.ts` `call_api` handler

Replace the existing SSRF-only check with:

```typescript
if (name === 'call_api') {
  // SSRF guard (existing)
  try { await assertPublicUrl(input.url as string); }
  catch (err) { return { type: 'chat', content: `Cannot reach that URL: ${(err as Error).message}` }; }

  // REST endpoint allowlist enforcement (new)
  const restEndpoints = await loadRestEndpoints(opts.org.id).catch(() => []);
  const { allowed, reason } = matchesRestEndpoint(
    input.url as string,
    (input.method as string ?? 'GET').toUpperCase(),
    restEndpoints,
  );
  if (!allowed) {
    return { type: 'chat', content: `API call blocked: ${reason}. Ask your administrator to add this endpoint in Settings → MCPs & APIs.` };
  }

  // ... rest of handler unchanged
}
```

Apply the same check in the streaming path (`agent.ts:913`).

**Acceptance criteria:**
- [ ] Org with no `RestApiEndpoint` rows: `call_api` still works (backward-compat)
- [ ] Org with endpoint rows: URL not matching any pattern → blocked with user-facing message
- [ ] Method mismatch (POST on a GET-only endpoint) → blocked
- [ ] readOnly endpoint: GET allowed, POST/PUT/DELETE blocked

---

### Fix 2 — Apply REST connector auth + readOnly to `call_api` (~20 lines)

**File:** `apps/backend/src/services/mcp.ts` + `agent.ts`

Export the matching REST connector (auth headers + readOnly) alongside the endpoints so
`call_api` can forward auth credentials the operator configured.

#### In `mcp.ts`, extend `loadRestEndpoints` return shape:

```typescript
interface RestConnectorContext {
  authType: string;
  authValue: string | null;
  readOnly: boolean;
  endpoints: RestEndpointRow[];
}

export async function loadRestContext(orgId: string): Promise<RestConnectorContext | null> {
  // ... load first enabled rest connector for this org (or merge all)
  // return { authType, authValue, readOnly, endpoints }
}
```

#### In `agent.ts` `call_api` handler:

After the allowlist check, add auth headers from the connector:

```typescript
const extraHeaders: Record<string, string> = {};
if (restContext?.authType === 'bearer' && restContext.authValue) {
  extraHeaders['Authorization'] = `Bearer ${restContext.authValue}`;
} else if (restContext?.authType === 'api_key' && restContext.authValue) {
  extraHeaders['X-API-Key'] = restContext.authValue;
}

const apiResult = await executeApiCall({
  url:     input.url as string,
  method:  ...,
  headers: { ...extraHeaders, ...(input.headers as Record<string, string> | undefined) },
  body:    resolvedBody,
});
```

**Acceptance criteria:**
- [ ] REST connector with Bearer auth: agent's call_api requests include Authorization header
- [ ] Connector with API key: X-API-Key forwarded
- [ ] Connector readOnly=true: write-verb calls blocked even if endpoint allowlist would allow it

---

## Execution order
1. Fix 1A — `loadRestEndpoints` + `matchesRestEndpoint` in `mcp.ts`
2. Fix 1B — wire enforcement into both `call_api` paths in `agent.ts`
3. Fix 2 — auth header forwarding (can ship separately; unblocks operators who set auth on REST connectors)

All changes are backend-only. No schema migrations. No dashboard changes needed.
