# Choke Point Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `GET /api/v1/analytics/choke-points` endpoint and a `/insights/choke-points` dashboard page that automatically ranks every flow step by a composite severity score (drop rate × avg attempts × avg time stuck × negative feedback rate), with an auto-refreshing UI and sidebar navigation link.

**Architecture:** The endpoint queries `UserStepProgress` and `SessionMessage` tables (all signals already collected), computes a 0–100 severity score per step, caches results for 60 seconds, and returns a ranked list. The dashboard page polls every 60 s. No schema migration needed.

**Tech Stack:** Express + Prisma (backend), Next.js App Router + React hooks (frontend), Jest + supertest (tests), TypeScript throughout.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `apps/backend/src/routes/analytics.ts` | Add `GET /analytics/choke-points` handler + `computeSeverityScore` helper |
| Modify | `apps/backend/src/__tests__/analytics.test.ts` | Add choke-points test suite |
| Modify | `apps/dashboard/lib/api.ts` | Add `ChokePoint`, `ChokePointsResponse`, `PageSummary` types + `api.analytics.chokePoints()` |
| Create | `apps/dashboard/app/(app)/insights/choke-points/page.tsx` | Full choke-points dashboard page |
| Modify | `apps/dashboard/components/Sidebar.tsx` | Add "Choke Points" nav item under ANALYTICS |

---

## Task 1: Severity Scoring Function + Backend Endpoint

**Files:**
- Modify: `apps/backend/src/routes/analytics.ts`

### Step 1.1 — Add `computeSeverityScore` helper (just above the router definition)

Open `apps/backend/src/routes/analytics.ts`. After the `classifyIntent` function (line ~25), add:

```typescript
function computeSeverityScore({
  dropRate,
  avgAttempts,
  avgTimeStuckSecs,
  negFeedbackRate,
}: {
  dropRate: number;
  avgAttempts: number;
  avgTimeStuckSecs: number;
  negFeedbackRate: number;
}): number {
  const attemptsNorm = Math.min(avgAttempts / 5, 1) * 100;
  const timeNorm = Math.min(avgTimeStuckSecs / 120, 1) * 100;
  return Math.round(
    dropRate * 0.40 +
    attemptsNorm * 0.25 +
    timeNorm * 0.20 +
    negFeedbackRate * 0.15,
  );
}

function severityLabel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}
```

### Step 1.2 — Add the in-memory cache map (after the router declaration `const router = Router();`)

```typescript
// 60-second in-memory cache keyed by "orgId:days"
const chokeCache = new Map<string, { data: unknown; expiresAt: number }>();
```

### Step 1.3 — Add the endpoint (add at the end of `analytics.ts`, before `export default router;`)

```typescript
// ─── GET /api/v1/analytics/choke-points?days=30 ──────────────────────────────
// Ranked list of flow steps where users struggle most, with composite severity.
router.get('/choke-points', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const days = Math.min(parseInt(req.query.days as string) || 30, 90);
  const cacheKey = `${organizationId}:${days}`;

  const hit = chokeCache.get(cacheKey);
  if (hit && Date.now() < hit.expiresAt) {
    res.json(hit.data);
    return;
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const priorSince = new Date(Date.now() - 2 * days * 24 * 60 * 60 * 1000);

  // Fetch all steps belonging to this org
  const steps = await prisma.onboardingStep.findMany({
    where: { flow: { organizationId } },
    select: {
      id: true,
      title: true,
      order: true,
      actionType: true,
      flow: { select: { id: true, name: true } },
    },
  });

  const chokePoints = await Promise.all(
    steps.map(async (step) => {
      const [started, completed, droppedProgress] = await Promise.all([
        prisma.userStepProgress.count({
          where: {
            stepId: step.id,
            session: { startedAt: { gte: since } },
            status: { in: ['in_progress', 'completed', 'skipped'] },
          },
        }),
        prisma.userStepProgress.count({
          where: {
            stepId: step.id,
            session: { startedAt: { gte: since } },
            status: 'completed',
          },
        }),
        prisma.userStepProgress.findMany({
          where: {
            stepId: step.id,
            session: { startedAt: { gte: since } },
            outcome: 'dropped',
          },
          select: { attempts: true, timeSpentMs: true, sessionId: true },
        }),
      ]);

      if (started < 3) return null;

      const dropRate = started > 0 ? Math.round(((started - completed) / started) * 100) : 0;

      const avgAttempts =
        droppedProgress.length > 0
          ? droppedProgress.reduce((s, p) => s + p.attempts, 0) / droppedProgress.length
          : 0;

      const avgTimeStuckSecs =
        droppedProgress.length > 0
          ? Math.round(
              droppedProgress.reduce((s, p) => s + p.timeSpentMs, 0) /
                droppedProgress.length /
                1000,
            )
          : 0;

      const [negMessages, totalMessages] = await Promise.all([
        prisma.sessionMessage.count({
          where: { stepId: step.id, feedback: -1, session: { startedAt: { gte: since } } },
        }),
        prisma.sessionMessage.count({
          where: { stepId: step.id, session: { startedAt: { gte: since } } },
        }),
      ]);

      const negFeedbackRate =
        totalMessages > 0 ? Math.round((negMessages / totalMessages) * 100) : 0;

      const score = computeSeverityScore({
        dropRate,
        avgAttempts,
        avgTimeStuckSecs,
        negFeedbackRate,
      });

      // Example user messages from dropped sessions (distinct, max 3)
      const droppedSessionIds = droppedProgress.slice(0, 20).map((p) => p.sessionId);
      const exampleMessages =
        droppedSessionIds.length > 0
          ? (
              await prisma.sessionMessage.findMany({
                where: {
                  stepId: step.id,
                  role: 'user',
                  sessionId: { in: droppedSessionIds },
                  content: { notIn: ['__init__', '__verify__'] },
                },
                select: { content: true },
                orderBy: { createdAt: 'desc' },
                take: 20,
              })
            )
              .map((m) => m.content.trim().slice(0, 200))
              .filter((c, i, arr) => arr.indexOf(c) === i)
              .slice(0, 3)
          : [];

      // Trend: compare drop_rate to prior period
      const [priorStarted, priorCompleted] = await Promise.all([
        prisma.userStepProgress.count({
          where: {
            stepId: step.id,
            session: { startedAt: { gte: priorSince, lt: since } },
            status: { in: ['in_progress', 'completed', 'skipped'] },
          },
        }),
        prisma.userStepProgress.count({
          where: {
            stepId: step.id,
            session: { startedAt: { gte: priorSince, lt: since } },
            status: 'completed',
          },
        }),
      ]);

      let trend: 'worsening' | 'improving' | 'stable' | 'new';
      if (priorStarted < 3) {
        trend = 'new';
      } else {
        const priorDropRate = Math.round(
          ((priorStarted - priorCompleted) / priorStarted) * 100,
        );
        const delta = dropRate - priorDropRate;
        trend = delta > 5 ? 'worsening' : delta < -5 ? 'improving' : 'stable';
      }

      return {
        step_id: step.id,
        step_title: step.title,
        flow_id: step.flow.id,
        flow_name: step.flow.name,
        action_type: step.actionType,
        field_choke: step.actionType === 'fill_form',
        frequency: started,
        drop_rate: dropRate,
        avg_attempts: Math.round(avgAttempts * 10) / 10,
        avg_time_stuck_secs: avgTimeStuckSecs,
        neg_feedback_rate: negFeedbackRate,
        severity_score: score,
        severity_label: severityLabel(score),
        example_messages: exampleMessages,
        trend,
      };
    }),
  );

  const ranked = chokePoints
    .filter((cp): cp is NonNullable<typeof cp> => cp !== null)
    .sort((a, b) => b.severity_score - a.severity_score)
    .map((cp, i) => ({ rank: i + 1, ...cp }));

  // Page summary: top URLs by session count in the window
  const pageSessions = await prisma.userOnboardingSession.groupBy({
    by: ['pageUrl'],
    where: { organizationId, startedAt: { gte: since }, pageUrl: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  });

  const pageSummary = pageSessions
    .filter((r) => r.pageUrl)
    .map((r) => ({ url: r.pageUrl!, sessions: r._count.id }));

  const result = { choke_points: ranked, page_summary: pageSummary, generated_at: new Date().toISOString(), days };
  chokeCache.set(cacheKey, { data: result, expiresAt: Date.now() + 60_000 });

  res.json(result);
});
```

- [ ] **Step 1.4 — Verify TypeScript compiles**

```bash
cd apps/backend && npx tsc --noEmit
```

Expected: no errors (or only pre-existing errors unrelated to analytics.ts).

- [ ] **Step 1.5 — Commit**

```bash
git add apps/backend/src/routes/analytics.ts
git commit -m "feat: GET /api/v1/analytics/choke-points — severity-ranked step friction detection"
```

---

## Task 2: Backend Tests

**Files:**
- Modify: `apps/backend/src/__tests__/analytics.test.ts`

- [ ] **Step 2.1 — Add the choke-points test suite at the end of `analytics.test.ts`**

Append after the last `describe` block (before end of file):

```typescript
describe('GET /api/v1/analytics/choke-points', () => {
  let cpOrgId: string;
  let cpToken: string;
  let cpFlowId: string;
  let cpStepId: string;
  let cpEndUserId: string;

  beforeAll(async () => {
    const org = await createTestOrg('Choke Points Test Org');
    cpOrgId = org.id;
    const user = await createTestUser(cpOrgId);
    cpToken = user.token;

    const flow = await prisma.onboardingFlow.create({
      data: { organizationId: cpOrgId, name: 'Test Flow', description: '', isActive: true },
    });
    cpFlowId = flow.id;

    const step = await prisma.onboardingStep.create({
      data: { flowId: cpFlowId, order: 0, title: 'Connect Source', intent: 'connect', actionType: 'fill_form' },
    });
    cpStepId = step.id;

    const endUser = await prisma.endUser.create({
      data: { organizationId: cpOrgId, externalId: `cp-user-${Date.now()}`, metadata: {} },
    });
    cpEndUserId = endUser.id;

    // Seed 4 sessions: 3 dropped, 1 completed — gives frequency=4, drop_rate=75
    for (let i = 0; i < 4; i++) {
      const isCompleted = i === 3;
      const session = await prisma.userOnboardingSession.create({
        data: {
          organizationId: cpOrgId,
          endUserId: cpEndUserId,
          flowId: cpFlowId,
          status: isCompleted ? 'completed' : 'abandoned',
          collectedData: {},
          lastActiveAt: new Date(),
          // Each session needs a unique endUser or we violate @@unique([endUserId, flowId])
          endUser: { connect: { id: cpEndUserId } },
        },
      });

      await prisma.userStepProgress.create({
        data: {
          sessionId: session.id,
          stepId: cpStepId,
          status: isCompleted ? 'completed' : 'in_progress',
          outcome: isCompleted ? 'completed' : 'dropped',
          attempts: isCompleted ? 1 : 3,
          timeSpentMs: isCompleted ? 5000 : 90000,
          messagesCount: 2,
          aiAssisted: false,
        },
      });

      if (!isCompleted) {
        await prisma.sessionMessage.create({
          data: {
            sessionId: session.id,
            stepId: cpStepId,
            role: 'user',
            content: 'I cannot find the API key field',
          },
        });
      }
    }
  });

  afterAll(async () => {
    await cleanupOrg(cpOrgId);
  });

  it('returns 200 with choke_points array and page_summary', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/choke-points?days=30')
      .set('Authorization', `Bearer ${cpToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.choke_points)).toBe(true);
    expect(Array.isArray(res.body.page_summary)).toBe(true);
    expect(typeof res.body.generated_at).toBe('string');
    expect(res.body.days).toBe(30);
  });

  it('detects the seeded choke step with correct shape', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/choke-points?days=30')
      .set('Authorization', `Bearer ${cpToken}`);

    expect(res.status).toBe(200);
    const cp = res.body.choke_points.find((c: { step_id: string }) => c.step_id === cpStepId);
    expect(cp).toBeDefined();
    expect(cp.step_title).toBe('Connect Source');
    expect(cp.flow_name).toBe('Test Flow');
    expect(cp.field_choke).toBe(true);
    expect(cp.frequency).toBe(4);
    expect(cp.drop_rate).toBe(75);
    expect(typeof cp.severity_score).toBe('number');
    expect(['critical', 'high', 'medium', 'low']).toContain(cp.severity_label);
    expect(['worsening', 'improving', 'stable', 'new']).toContain(cp.trend);
    expect(Array.isArray(cp.example_messages)).toBe(true);
    expect(cp.rank).toBe(1);
  });

  it('suppresses steps with fewer than 3 sessions', async () => {
    // The choke points org starts clean so if we check a fresh org with 2 sessions, it should be filtered
    const smallOrg = await createTestOrg('Small Org');
    const smallUser = await createTestUser(smallOrg.id);
    const smallFlow = await prisma.onboardingFlow.create({
      data: { organizationId: smallOrg.id, name: 'Tiny Flow', description: '', isActive: true },
    });
    const smallStep = await prisma.onboardingStep.create({
      data: { flowId: smallFlow.id, order: 0, title: 'Tiny Step', intent: 'tiny' },
    });
    const smallUser2 = await prisma.endUser.create({
      data: { organizationId: smallOrg.id, externalId: 'small-user', metadata: {} },
    });
    const s1 = await prisma.userOnboardingSession.create({
      data: { organizationId: smallOrg.id, endUserId: smallUser2.id, flowId: smallFlow.id, status: 'abandoned', collectedData: {}, lastActiveAt: new Date() },
    });
    await prisma.userStepProgress.create({
      data: { sessionId: s1.id, stepId: smallStep.id, status: 'in_progress', outcome: 'dropped', attempts: 2, timeSpentMs: 5000, messagesCount: 1, aiAssisted: false },
    });

    const res = await request(app)
      .get('/api/v1/analytics/choke-points?days=30')
      .set('Authorization', `Bearer ${smallUser.token}`);

    expect(res.status).toBe(200);
    // Only 1 session, below threshold of 3 — no choke points returned
    expect(res.body.choke_points).toHaveLength(0);

    await cleanupOrg(smallOrg.id);
  });

  it('rejects without JWT', async () => {
    const res = await request(app).get('/api/v1/analytics/choke-points');
    expect(res.status).toBe(401);
  });

  it('clamps days to max 90', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/choke-points?days=999')
      .set('Authorization', `Bearer ${cpToken}`);
    expect(res.status).toBe(200);
    expect(res.body.days).toBe(90);
  });
});
```

**Note on the session uniqueness constraint:** `UserOnboardingSession` has `@@unique([endUserId, flowId])`. The seed above creates one session per endUser+flow combo. To seed multiple sessions with different users, you need multiple endUsers. The simplified seed above reuses one endUser per flow — if you need more sessions, create more endUsers. For the test to work with 4 sessions for one step, you'd need 4 endUsers. Adjust the seed:

Replace the `beforeAll` session-creation loop with:

```typescript
for (let i = 0; i < 4; i++) {
  const isCompleted = i === 3;
  const eu = await prisma.endUser.create({
    data: { organizationId: cpOrgId, externalId: `cp-user-${Date.now()}-${i}`, metadata: {} },
  });
  const session = await prisma.userOnboardingSession.create({
    data: {
      organizationId: cpOrgId,
      endUserId: eu.id,
      flowId: cpFlowId,
      status: isCompleted ? 'completed' : 'abandoned',
      collectedData: {},
      lastActiveAt: new Date(),
    },
  });
  await prisma.userStepProgress.create({
    data: {
      sessionId: session.id,
      stepId: cpStepId,
      status: isCompleted ? 'completed' : 'in_progress',
      outcome: isCompleted ? 'completed' : 'dropped',
      attempts: isCompleted ? 1 : 3,
      timeSpentMs: isCompleted ? 5000 : 90000,
      messagesCount: 2,
      aiAssisted: false,
    },
  });
  if (!isCompleted) {
    await prisma.sessionMessage.create({
      data: {
        sessionId: session.id,
        stepId: cpStepId,
        role: 'user',
        content: 'I cannot find the API key field',
      },
    });
  }
}
```

- [ ] **Step 2.2 — Run tests**

```bash
cd apps/backend && npx jest --testPathPattern="analytics" --runInBand
```

Expected: all tests pass, including the new `GET /api/v1/analytics/choke-points` suite.

- [ ] **Step 2.3 — Commit**

```bash
git add apps/backend/src/__tests__/analytics.test.ts
git commit -m "test: choke-points endpoint — severity detection, threshold suppression, auth guard"
```

---

## Task 3: TypeScript Types + API Client Function

**Files:**
- Modify: `apps/dashboard/lib/api.ts`

- [ ] **Step 3.1 — Add types to `api.ts`**

Find the block of exported interfaces (around line 630+) and add after the `Insight` interface:

```typescript
export interface ChokePoint {
  rank: number;
  step_id: string;
  step_title: string;
  flow_id: string;
  flow_name: string;
  action_type: string | null;
  field_choke: boolean;
  frequency: number;
  drop_rate: number;
  avg_attempts: number;
  avg_time_stuck_secs: number;
  neg_feedback_rate: number;
  severity_score: number;
  severity_label: 'critical' | 'high' | 'medium' | 'low';
  example_messages: string[];
  trend: 'worsening' | 'improving' | 'stable' | 'new';
}

export interface PageSummary {
  url: string;
  sessions: number;
}

export interface ChokePointsResponse {
  choke_points: ChokePoint[];
  page_summary: PageSummary[];
  generated_at: string;
  days: number;
}
```

- [ ] **Step 3.2 — Add `api.analytics.chokePoints()` function**

In the `analytics` object (around line 83), add after `health`:

```typescript
chokePoints: (days = 30) =>
  apiFetch<ChokePointsResponse>(`/api/v1/analytics/choke-points?days=${days}`),
```

The full `analytics` object becomes:
```typescript
analytics: {
  overview: () => apiFetch<OverviewStats>('/api/v1/analytics/overview'),
  timeline: (days = 30) => apiFetch<TimelinePoint[]>(`/api/v1/analytics/timeline?days=${days}`),
  triggers: () => apiFetch<TriggerStat[]>('/api/v1/analytics/triggers'),
  intents: (days = 30, page?: string) => apiFetch<IntentsResponse>(`/api/v1/analytics/intents?days=${days}${page ? `&page=${encodeURIComponent(page)}` : ''}`),
  health: () => apiFetch<AgentHealth>('/api/v1/analytics/health'),
  chokePoints: (days = 30) =>
    apiFetch<ChokePointsResponse>(`/api/v1/analytics/choke-points?days=${days}`),
},
```

- [ ] **Step 3.3 — Commit**

```bash
git add apps/dashboard/lib/api.ts
git commit -m "feat: api client — ChokePoint types and analytics.chokePoints() function"
```

---

## Task 4: Dashboard Page

**Files:**
- Create: `apps/dashboard/app/(app)/insights/choke-points/page.tsx`

- [ ] **Step 4.1 — Create the file**

Create `apps/dashboard/app/(app)/insights/choke-points/page.tsx` with the complete implementation:

```tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, ChokePoint, PageSummary } from '@/lib/api';

const SEVERITY_CONFIG = {
  critical: { bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700',    label: 'CRITICAL' },
  high:     { bar: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700', label: 'HIGH'   },
  medium:   { bar: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-700', label: 'MEDIUM'  },
  low:      { bar: 'bg-slate-300',  badge: 'bg-slate-100 text-slate-600', label: 'LOW'     },
} as const;

const TREND_CONFIG = {
  worsening: { icon: '↑', color: 'text-red-500',   label: 'worsening' },
  improving: { icon: '↓', color: 'text-green-600', label: 'improving' },
  stable:    { icon: '→', color: 'text-slate-400', label: 'stable'    },
  new:       { icon: '★', color: 'text-indigo-500', label: 'new'      },
} as const;

type SeverityFilter = 'all' | ChokePoint['severity_label'];

function fmtSecs(s: number): string {
  if (s === 0) return '—';
  if (s < 60) return `${s}s`;
  return `${Math.round((s / 60) * 10) / 10}m`;
}

export default function ChokePointsPage() {
  const router = useRouter();
  const [data, setData] = useState<{ choke_points: ChokePoint[]; page_summary: PageSummary[]; generated_at: string } | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SeverityFilter>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    try {
      const res = await api.analytics.chokePoints(d);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(() => load(days), 60_000);
    return () => clearInterval(id);
  }, [days, load]);

  const choke_points = data?.choke_points ?? [];
  const page_summary = data?.page_summary ?? [];

  const filtered = filter === 'all'
    ? choke_points
    : choke_points.filter((cp) => cp.severity_label === filter);

  const counts = {
    critical: choke_points.filter((cp) => cp.severity_label === 'critical').length,
    high:     choke_points.filter((cp) => cp.severity_label === 'high').length,
    medium:   choke_points.filter((cp) => cp.severity_label === 'medium').length,
    low:      choke_points.filter((cp) => cp.severity_label === 'low').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Choke Point Detection</h1>
          <p className="text-slate-500 text-sm mt-1">
            Automatic ranking of where users struggle most — by frequency and severity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data?.generated_at && (
            <span className="text-xs text-slate-400 mr-2">
              Updated {new Date(data.generated_at).toLocaleTimeString()}
            </span>
          )}
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                days === d ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Severity filter tabs */}
      {!loading && choke_points.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sv) => {
            const count = sv === 'all' ? choke_points.length : counts[sv];
            const isActive = filter === sv;
            return (
              <button
                key={sv}
                onClick={() => setFilter(sv)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                }`}
              >
                {sv === 'all' ? 'All' : sv.charAt(0).toUpperCase() + sv.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-slate-400 text-sm animate-pulse">
          Analyzing sessions…
        </div>
      )}

      {/* Empty state */}
      {!loading && choke_points.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
          </div>
          <p className="font-medium text-slate-800 mb-1">No choke points detected yet</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Need at least 3 sessions per step to surface patterns. Check back as traffic grows.
          </p>
        </div>
      )}

      {/* Choke point list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2 mb-8">
          {filtered.map((cp) => {
            const sev = SEVERITY_CONFIG[cp.severity_label];
            const trend = TREND_CONFIG[cp.trend];
            const isExpanded = expanded === cp.step_id;

            return (
              <div
                key={cp.step_id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                {/* Main row */}
                <button
                  className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : cp.step_id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Rank */}
                    <span className="text-xs font-bold text-slate-400 w-5 pt-0.5 shrink-0">
                      #{cp.rank}
                    </span>

                    {/* Step info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-slate-900 text-sm">{cp.step_title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sev.badge}`}>
                          {sev.label}
                        </span>
                        {cp.field_choke && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                            fill_form
                          </span>
                        )}
                        <span className={`text-xs font-medium ${trend.color}`}>
                          {trend.icon} {trend.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 flex-wrap">
                        <span
                          className="text-indigo-600 hover:underline cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); router.push(`/flows/${cp.flow_id}?tab=analytics`); }}
                        >
                          {cp.flow_name}
                        </span>
                        <span>·</span>
                        <span>{cp.frequency} sessions</span>
                        <span>·</span>
                        <span>{cp.avg_attempts} avg attempts</span>
                        <span>·</span>
                        <span>{fmtSecs(cp.avg_time_stuck_secs)} avg stuck</span>
                      </div>
                    </div>

                    {/* Severity bar */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${sev.bar}`}
                          style={{ width: `${cp.severity_score}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-6 text-right">
                        {cp.severity_score}
                      </span>
                      <span className="text-slate-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-100">
                    <div className="grid grid-cols-4 gap-3 mt-3 mb-4">
                      {[
                        { label: 'Drop rate',      value: `${cp.drop_rate}%` },
                        { label: 'Avg attempts',   value: String(cp.avg_attempts) },
                        { label: 'Avg time stuck', value: fmtSecs(cp.avg_time_stuck_secs) },
                        { label: 'Neg feedback',   value: `${cp.neg_feedback_rate}%` },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                          <p className="text-base font-bold text-slate-900">{value}</p>
                        </div>
                      ))}
                    </div>

                    {cp.example_messages.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">
                          What users said when stuck:
                        </p>
                        <ul className="space-y-1">
                          {cp.example_messages.map((msg, i) => (
                            <li
                              key={i}
                              className="text-xs text-slate-700 bg-slate-50 rounded px-3 py-2 italic"
                            >
                              "{msg}"
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      className="mt-3 text-xs text-indigo-600 hover:underline font-medium"
                      onClick={() => router.push(`/flows/${cp.flow_id}?tab=analytics`)}
                    >
                      Open flow analytics →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Page summary table */}
      {!loading && page_summary.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Top pages by session volume</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-slate-500 border-b border-slate-100">
                <th className="text-left pb-2">URL</th>
                <th className="text-right pb-2">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {page_summary.map((p) => (
                <tr key={p.url} className="border-b border-slate-50 last:border-0">
                  <td className="py-2 font-mono text-xs text-slate-700 truncate max-w-xs">{p.url}</td>
                  <td className="py-2 text-right text-slate-800 font-medium">{p.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4.2 — Commit**

```bash
git add apps/dashboard/app/\(app\)/insights/choke-points/page.tsx
git commit -m "feat: /insights/choke-points dashboard — severity-ranked choke point detection"
```

---

## Task 5: Sidebar Navigation

**Files:**
- Modify: `apps/dashboard/components/Sidebar.tsx`

- [ ] **Step 5.1 — Add `AlertTriangleIcon` component at the end of the icon functions block**

Find the block of icon functions (starting around line 171) and add after `QuestionIcon`:

```tsx
function AlertTriangleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
```

- [ ] **Step 5.2 — Add "Choke Points" link to the ANALYTICS section**

In the `SECTIONS` array, find the `ANALYTICS` section items array. Add after the `{ href: '/insights', ... }` entry:

```typescript
{ href: '/insights/choke-points', label: 'Choke Points', icon: <AlertTriangleIcon /> },
```

The full ANALYTICS items array becomes:
```typescript
items: [
  { href: '/dashboard',            label: 'Dashboard',     icon: <GridIcon /> },
  { href: '/conversations',        label: 'Conversations', icon: <ChatIcon /> },
  { href: '/sessions',             label: 'Sessions',      icon: <SessionIcon /> },
  { href: '/escalations',          label: 'Escalations',   icon: <EscalationIcon /> },
  { href: '/questions',            label: 'Questions',     icon: <QuestionIcon /> },
  { href: '/insights',             label: 'Insights',      icon: <InsightIcon /> },
  { href: '/insights/choke-points', label: 'Choke Points', icon: <AlertTriangleIcon /> },
  { href: '/users',                label: 'Users',         icon: <UsersIcon /> },
  { href: '/expansion',            label: 'Expansion MRR', icon: <ExpansionIcon /> },
],
```

**Note:** The active-link check in Sidebar is `pathname.startsWith(href + '/')`. Because `/insights` is listed before `/insights/choke-points`, navigating to `/insights/choke-points` will highlight BOTH. Fix the `Insights` entry to use exact match by checking if the href is a prefix match:

The sidebar already uses `pathname === href || pathname.startsWith(href + '/')`. For `/insights`, this means it will be active when on `/insights/choke-points`. This is acceptable sidebar UX — both parent and child items appear active. If you prefer only the child to be active, change the `/insights` href active check to `pathname === href` only. That would require modifying the Sidebar `active` condition for that specific entry, which is scope creep. Leave it as-is.

- [ ] **Step 5.3 — Commit**

```bash
git add apps/dashboard/components/Sidebar.tsx
git commit -m "feat: sidebar — add Choke Points navigation link"
```

---

## Task 6: Full Test Run + Verification

- [ ] **Step 6.1 — Run full backend test suite**

```bash
cd apps/backend && npx jest --runInBand
```

Expected: all tests pass. Zero failures.

- [ ] **Step 6.2 — TypeScript check on dashboard**

```bash
cd apps/dashboard && npx tsc --noEmit
```

Expected: no errors in `insights/choke-points/page.tsx`, `lib/api.ts`, or `components/Sidebar.tsx`.

- [ ] **Step 6.3 — Start the dev server and verify the page loads**

```bash
# Terminal 1
cd apps/backend && npm run dev

# Terminal 2
cd apps/dashboard && npm run dev
```

Navigate to `http://localhost:3000/insights/choke-points`. Confirm:
- Page renders without errors
- Sidebar shows "Choke Points" link and it highlights when active
- Day-range filter (7d / 30d / 90d) switches correctly
- Empty state shows if no sufficient data
- If data exists: severity badges, trend indicators, expandable rows render correctly

- [ ] **Step 6.4 — Final commit (if any tweaks made during manual testing)**

```bash
git add -p
git commit -m "fix: choke-points page — visual tweaks from manual testing"
```

---

## Self-Review

### Spec coverage

| Requirement | Implemented in |
|------------|---------------|
| Automatic identification of fields/pages/flows where users struggle | Task 1 — endpoint ranks all steps by friction signals; `field_choke: true` on fill_form steps |
| Ranked by frequency and severity | Task 1 — composite severity score (drop_rate × attempts × time × feedback); sorted desc |
| Updated in real time as new sessions come in | Task 4 — 60s auto-refresh via `setInterval` + 60s server cache ensures fresh data per minute |
| Backend API with composite scoring | Task 1 — `computeSeverityScore()` + endpoint |
| TypeScript types in dashboard | Task 3 — `ChokePoint`, `PageSummary`, `ChokePointsResponse` |
| Dashboard page | Task 4 — `/insights/choke-points/page.tsx` |
| Sidebar navigation | Task 5 — `AlertTriangleIcon` + nav item |
| Tests | Task 2 — 5 test cases covering: response shape, choke detection, threshold suppression, auth guard, days clamping |

### Potential issues fixed

1. **Session uniqueness constraint** — `UserOnboardingSession` has `@@unique([endUserId, flowId])`. The test seed creates one endUser per session to avoid conflicts. Documented in Task 2.

2. **`chokeCache` type** — typed as `Map<string, { data: unknown; expiresAt: number }>` to avoid circular type reference with the response type. The actual shape matches `ChokePointsResponse`.

3. **Sidebar double-active** — documented as acceptable UX. No change needed.

4. **`SessionMessage.stepId` nullable** — the query `where: { stepId: step.id }` works because Prisma handles nullable FK lookups. Sessions without a `stepId` are naturally excluded.
