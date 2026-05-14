// ─── contextSources.test.ts ───────────────────────────────────────────────────
// Unit tests for apps/backend/src/services/contextSources.ts
// All external dependencies (Prisma, fetch, callMcpTool, assertPublicUrl) are mocked.

import { fetchSessionContext, invalidateContextSourceCache } from '../services/contextSources';

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('../lib/prisma', () => ({
  prisma: {
    contextSource: { findMany: jest.fn() },
    mcpConnector:  { findUnique: jest.fn() },
  },
}));

jest.mock('../services/mcp', () => ({
  callMcpTool: jest.fn(),
}));

jest.mock('../lib/ipGuard', () => ({
  assertPublicUrl: jest.fn().mockResolvedValue(undefined),
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────
import { prisma } from '../lib/prisma';
import { callMcpTool } from '../services/mcp';
import { assertPublicUrl } from '../lib/ipGuard';

const mockFindMany   = prisma.contextSource.findMany as jest.MockedFunction<typeof prisma.contextSource.findMany>;
const mockFindUnique = prisma.mcpConnector.findUnique as jest.MockedFunction<typeof prisma.mcpConnector.findUnique>;
const mockCallMcp    = callMcpTool as jest.MockedFunction<typeof callMcpTool>;
const mockAssertUrl  = assertPublicUrl as jest.MockedFunction<typeof assertPublicUrl>;

// ─── Global fetch mock ────────────────────────────────────────────────────────
const globalFetch = jest.fn();
global.fetch = globalFetch as unknown as typeof fetch;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ORG_ID  = 'org-test-123';
const USER_VARS = { userId: 'u-1', plan: 'pro' };

function makeSource(overrides: Record<string, unknown> = {}) {
  return {
    id: 'src-1',
    organizationId: ORG_ID,
    name: 'Test Source',
    enabled: true,
    connectorId: null,
    mcpToolName: null,
    mcpToolArgs: {},
    restUrl: null,
    restMethod: 'GET',
    contextKey: 'AccountStatus',
    allowedFields: [],
    ...overrides,
  };
}

function makeJsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

// Clear caches and mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  invalidateContextSourceCache(ORG_ID);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('fetchSessionContext()', () => {

  // ── 1. Empty sources → returns '' ──────────────────────────────────────────
  describe('when no enabled sources exist', () => {
    it('returns empty string', async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await fetchSessionContext(ORG_ID, USER_VARS);

      expect(result).toBe('');
      expect(mockFindMany).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID, enabled: true },
      });
    });
  });

  // ── 2. REST source with allowedFields filtering ─────────────────────────────
  describe('REST source', () => {
    it('returns LIVE CONTEXT block with full response when allowedFields is empty', async () => {
      mockFindMany.mockResolvedValue([
        makeSource({ restUrl: 'https://api.example.com/account', allowedFields: [] }),
      ] as never);

      globalFetch.mockReturnValue(makeJsonResponse({ plan: 'pro', seats_used: 8, internal: 'secret' }));

      const result = await fetchSessionContext(ORG_ID, USER_VARS);

      expect(result).toContain('LIVE CONTEXT (fetched at session start');
      expect(result).toContain('AccountStatus:');
      expect(result).toContain('"plan"');
      expect(result).toContain('"seats_used"');
      expect(result).toContain('"internal"');
    });

    it('filters response to allowedFields only', async () => {
      mockFindMany.mockResolvedValue([
        makeSource({ restUrl: 'https://api.example.com/account', allowedFields: ['plan', 'seats_used'] }),
      ] as never);

      globalFetch.mockReturnValue(makeJsonResponse({ plan: 'pro', seats_used: 8, internal_token: 'abc123' }));

      const result = await fetchSessionContext(ORG_ID, USER_VARS);

      expect(result).toContain('AccountStatus:');
      expect(result).toContain('"plan"');
      expect(result).toContain('"seats_used"');
      // internal_token must be stripped
      expect(result).not.toContain('internal_token');
      expect(result).not.toContain('abc123');
    });

    it('interpolates {{key}} placeholders in restUrl', async () => {
      mockFindMany.mockResolvedValue([
        makeSource({ restUrl: 'https://api.example.com/users/{{userId}}/account' }),
      ] as never);

      globalFetch.mockReturnValue(makeJsonResponse({ plan: 'pro' }));

      await fetchSessionContext(ORG_ID, USER_VARS);

      const calledUrl = (globalFetch.mock.calls[0] as unknown[])[0] as string;
      expect(calledUrl).toBe('https://api.example.com/users/u-1/account');
    });

    it('uses connector auth headers when connectorId is set', async () => {
      mockFindMany.mockResolvedValue([
        makeSource({
          restUrl: 'https://api.example.com/account',
          connectorId: 'conn-1',
        }),
      ] as never);

      mockFindUnique.mockResolvedValue({
        authType: 'bearer',
        authValue: 'my-token',
      } as never);

      globalFetch.mockReturnValue(makeJsonResponse({ plan: 'pro' }));

      await fetchSessionContext(ORG_ID, USER_VARS);

      const calledInit = (globalFetch.mock.calls[0] as unknown[])[1] as RequestInit;
      expect((calledInit.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
    });

    it('skips source on non-OK HTTP status', async () => {
      mockFindMany.mockResolvedValue([
        makeSource({ restUrl: 'https://api.example.com/account' }),
      ] as never);

      globalFetch.mockReturnValue(makeJsonResponse({}, 500));

      const result = await fetchSessionContext(ORG_ID, USER_VARS);

      expect(result).toBe('');
    });
  });

  // ── 3. Source timeout → skipped, other sources still appear ─────────────────
  describe('source timeout behaviour', () => {
    it('skips timed-out source but returns other sources', async () => {
      mockFindMany.mockResolvedValue([
        makeSource({ id: 'src-slow', contextKey: 'SlowSource', restUrl: 'https://api.example.com/slow' }),
        makeSource({ id: 'src-fast', contextKey: 'FastSource', restUrl: 'https://api.example.com/fast' }),
      ] as never);

      // First call (slow) rejects after delay; second call (fast) resolves immediately
      let callCount = 0;
      globalFetch.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Simulate AbortError (timeout)
          return Promise.reject(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }));
        }
        return makeJsonResponse({ status: 'ok' });
      });

      const result = await fetchSessionContext(ORG_ID, USER_VARS);

      // Slow source should be absent, fast source should be present
      expect(result).not.toContain('SlowSource');
      expect(result).toContain('FastSource');
      expect(result).toContain('LIVE CONTEXT');
    });

    it('returns empty string when all sources fail', async () => {
      mockFindMany.mockResolvedValue([
        makeSource({ restUrl: 'https://api.example.com/account' }),
      ] as never);

      globalFetch.mockRejectedValue(new Error('network failure'));

      const result = await fetchSessionContext(ORG_ID, USER_VARS);
      expect(result).toBe('');
    });
  });

  // ── 4. MCP source ────────────────────────────────────────────────────────────
  describe('MCP source', () => {
    it('returns result from callMcpTool', async () => {
      mockFindMany.mockResolvedValue([
        makeSource({
          connectorId: 'conn-1',
          mcpToolName: 'get_account_status',
          mcpToolArgs: {},
          contextKey: 'AccountStatus',
        }),
      ] as never);

      mockFindUnique.mockResolvedValue({
        id: 'conn-1',
        name: 'Acme MCP',
        serverUrl: 'https://mcp.example.com',
        authType: 'bearer',
        authValue: 'tok',
        allowedTools: [],
        readOnly: false,
      } as never);

      mockCallMcp.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({ plan: 'pro' }) }],
        isError: false,
      });

      const result = await fetchSessionContext(ORG_ID, USER_VARS);

      expect(result).toContain('AccountStatus:');
      expect(result).toContain('"plan"');
    });

    it('skips MCP source when connector not found', async () => {
      mockFindMany.mockResolvedValue([
        makeSource({
          connectorId: 'missing-conn',
          mcpToolName: 'get_data',
          contextKey: 'MissingConnector',
        }),
      ] as never);

      mockFindUnique.mockResolvedValue(null);

      const result = await fetchSessionContext(ORG_ID, USER_VARS);
      expect(result).toBe('');
    });

    it('skips MCP source when tool returns isError=true', async () => {
      mockFindMany.mockResolvedValue([
        makeSource({
          connectorId: 'conn-1',
          mcpToolName: 'bad_tool',
          contextKey: 'ErrorSource',
        }),
      ] as never);

      mockFindUnique.mockResolvedValue({
        id: 'conn-1', name: 'Test', serverUrl: 'https://mcp.example.com',
        authType: 'none', authValue: null, allowedTools: [], readOnly: false,
      } as never);

      mockCallMcp.mockResolvedValue({
        content: [{ type: 'text', text: 'Tool failed' }],
        isError: true,
      });

      const result = await fetchSessionContext(ORG_ID, USER_VARS);
      expect(result).toBe('');
    });
  });

  // ── 5. Misconfigured source (no mcpToolName, no restUrl) ─────────────────────
  describe('misconfigured source', () => {
    it('skips and returns empty string', async () => {
      mockFindMany.mockResolvedValue([
        makeSource({ mcpToolName: null, restUrl: null }),
      ] as never);

      const result = await fetchSessionContext(ORG_ID, USER_VARS);
      expect(result).toBe('');
    });
  });

  // ── 6. Truncation ─────────────────────────────────────────────────────────────
  describe('result truncation', () => {
    it('truncates results longer than 1000 chars', async () => {
      mockFindMany.mockResolvedValue([
        makeSource({ restUrl: 'https://api.example.com/data' }),
      ] as never);

      const longString = 'x'.repeat(2000);
      globalFetch.mockReturnValue(makeJsonResponse(longString));

      const result = await fetchSessionContext(ORG_ID, USER_VARS);

      // Result should contain truncation marker
      expect(result).toContain('[truncated]');
      // The AccountStatus line should not exceed 1000 chars (plus key prefix + small overhead)
      const line = result.split('\n').find((l) => l.startsWith('AccountStatus:')) ?? '';
      const valueStr = line.slice('AccountStatus: '.length);
      expect(valueStr.length).toBeLessThanOrEqual(1015); // 1000 + '…[truncated]' overhead
    });
  });

  // ── 7. SSRF protection ────────────────────────────────────────────────────────
  describe('SSRF protection', () => {
    it('skips source when assertPublicUrl throws', async () => {
      mockFindMany.mockResolvedValue([
        makeSource({ restUrl: 'http://169.254.169.254/latest/meta-data/' }),
      ] as never);

      mockAssertUrl.mockRejectedValueOnce(new Error('Private/loopback URLs are not allowed'));

      const result = await fetchSessionContext(ORG_ID, USER_VARS);
      expect(result).toBe('');
      // fetch should not have been called
      expect(globalFetch).not.toHaveBeenCalled();
    });
  });

  // ── 8. 60-second source-list cache ───────────────────────────────────────────
  describe('source list caching', () => {
    it('does not re-query DB within cache TTL', async () => {
      mockFindMany.mockResolvedValue([
        makeSource({ restUrl: 'https://api.example.com/account' }),
      ] as never);

      globalFetch.mockReturnValue(makeJsonResponse({ plan: 'pro' }));

      // Call twice — DB should only be queried once
      await fetchSessionContext(ORG_ID, USER_VARS);
      await fetchSessionContext(ORG_ID, USER_VARS);

      expect(mockFindMany).toHaveBeenCalledTimes(1);
    });

    it('re-queries DB after cache is invalidated', async () => {
      mockFindMany.mockResolvedValue([
        makeSource({ restUrl: 'https://api.example.com/account' }),
      ] as never);

      globalFetch.mockReturnValue(makeJsonResponse({ plan: 'pro' }));

      await fetchSessionContext(ORG_ID, USER_VARS);
      invalidateContextSourceCache(ORG_ID);
      await fetchSessionContext(ORG_ID, USER_VARS);

      expect(mockFindMany).toHaveBeenCalledTimes(2);
    });
  });

  // ── 9. DB load failure → returns '' without throwing ──────────────────────────
  describe('DB load failure', () => {
    it('returns empty string when prisma.contextSource.findMany throws', async () => {
      mockFindMany.mockRejectedValue(new Error('Connection refused'));

      const result = await fetchSessionContext(ORG_ID, USER_VARS);

      expect(result).toBe('');
      // fetch should never have been called
      expect(globalFetch).not.toHaveBeenCalled();
    });
  });

  // ── 10. MCP timeout → source skipped, others still returned ──────────────────
  describe('MCP source timeout', () => {
    it('skips MCP source that exceeds 2s timeout but returns other sources', async () => {
      jest.useFakeTimers();

      mockFindMany.mockResolvedValue([
        makeSource({
          id: 'src-mcp-slow',
          contextKey: 'SlowMcp',
          connectorId: 'conn-1',
          mcpToolName: 'slow_tool',
          mcpToolArgs: {},
        }),
        makeSource({
          id: 'src-rest-fast',
          contextKey: 'FastRest',
          restUrl: 'https://api.example.com/fast',
        }),
      ] as never);

      mockFindUnique.mockResolvedValue({
        id: 'conn-1',
        name: 'Slow MCP',
        serverUrl: 'https://mcp.example.com',
        authType: 'none',
        authValue: null,
        allowedTools: [],
        readOnly: false,
      } as never);

      // callMcpTool never resolves (hangs forever — simulates a slow MCP server)
      mockCallMcp.mockReturnValue(new Promise(() => {}));

      globalFetch.mockReturnValue(makeJsonResponse({ status: 'ok' }));

      // Start the call, then advance time past the 2s MCP timeout and flush microtasks
      const promise = fetchSessionContext(ORG_ID, USER_VARS);
      await jest.runAllTimersAsync();

      const result = await promise;

      expect(result).not.toContain('SlowMcp');
      expect(result).toContain('FastRest');
      expect(result).toContain('LIVE CONTEXT');

      jest.useRealTimers();
    });
  });

  // ── 11. Multi-source aggregation ──────────────────────────────────────────────
  describe('multiple sources', () => {
    it('aggregates all successful sources into one LIVE CONTEXT block', async () => {
      mockFindMany.mockResolvedValue([
        makeSource({ id: 'src-1', contextKey: 'AccountStatus', restUrl: 'https://api.example.com/acct' }),
        makeSource({ id: 'src-2', contextKey: 'FeatureFlags',  restUrl: 'https://api.example.com/flags' }),
      ] as never);

      let call = 0;
      globalFetch.mockImplementation(() => {
        call++;
        return call === 1
          ? makeJsonResponse({ plan: 'pro', seats_used: 8 })
          : makeJsonResponse({ api_integration: true });
      });

      const result = await fetchSessionContext(ORG_ID, USER_VARS);

      expect(result).toContain('LIVE CONTEXT (fetched at session start');
      expect(result).toContain('AccountStatus:');
      expect(result).toContain('FeatureFlags:');
      expect(result).toContain('"plan"');
      expect(result).toContain('"api_integration"');
    });
  });
});
