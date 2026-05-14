# Session Tracking Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete session-level tracking by adding manual team handoffs from session replay, bidirectional session↔escalation linking, server-side search/date filtering, live polling for active sessions, user history deep-linking, and copy-link functionality.

**Architecture:** All changes are additive — no schema migrations needed. The backend gains one new route (`POST /api/v1/escalations/manual`) and two enhanced existing routes (sessions list filter, session detail escalation join). The frontend gains a hand-off modal, live polling, and filter controls — all in existing page files.

**Tech Stack:** TypeScript, Express, Prisma (PostgreSQL), Next.js 14 App Router, supertest (backend tests)

---

## File Map

| File | Change |
|---|---|
| `apps/backend/src/routes/escalations.ts` | Add `POST /manual` route (before `/:id`) |
| `apps/backend/src/routes/sessions.ts` | Add `q`/`from`/`to` filters to list; add `escalationTicketId` to detail |
| `apps/backend/src/__tests__/testApp.ts` | Register `sessionsRoutes` + `escalationsRoutes` |
| `apps/backend/src/__tests__/sessions.test.ts` | New — tests for sessions list, detail, manual handoff |
| `apps/dashboard/lib/api.ts` | Add `api.escalations.createManual()`; update `SessionDetail` type; update `sessions.list` params |
| `apps/dashboard/app/(app)/sessions/page.tsx` | Replace client-side search with debounced server-side; add date range filter |
| `apps/dashboard/app/(app)/sessions/[id]/page.tsx` | Add hand-off button + modal, escalation banner, live polling, user deep-link, copy-link button |

---

## Task 1: Register sessions + escalations routes in testApp

**Files:**
- Modify: `apps/backend/src/__tests__/testApp.ts`

- [ ] **Step 1: Add the two imports and mount the routes**

Open `apps/backend/src/__tests__/testApp.ts`. The current file ends at line 39. Replace the full file content:

```typescript
import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';

import authRoutes from '../routes/auth';
import conversationsRoutes from '../routes/conversations';
import messagesRoutes from '../routes/messages';
import eventsRoutes from '../routes/events';
import analyticsRoutes from '../routes/analytics';
import configRoutes from '../routes/config';
import billingRoutes, { stripeWebhookHandler } from '../routes/billing';
import sessionsRoutes from '../routes/sessions';
import escalationsRoutes from '../routes/escalations';
import { errorHandler } from '../middleware/errorHandler';

export function createApp() {
  const app = express();

  app.post('/api/v1/billing/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

  app.use(cors());
  app.use(express.json({ limit: '10kb' }));

  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/conversations', conversationsRoutes);
  app.use('/api/v1/messages', messagesRoutes);
  app.use('/api/v1/events', eventsRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/config', configRoutes);
  app.use('/api/v1/billing', billingRoutes);
  app.use('/api/v1/sessions', sessionsRoutes);
  app.use('/api/v1/escalations', escalationsRoutes);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use(errorHandler);

  return app;
}
```

- [ ] **Step 2: Verify the app compiles**

```bash
cd apps/backend && npx tsc --noEmit
```

Expected: no errors (or only pre-existing errors unrelated to this file).

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/__tests__/testApp.ts
git commit -m "test: register sessions + escalations routes in testApp"
```

---

## Task 2: Add `POST /api/v1/escalations/manual`

**Files:**
- Modify: `apps/backend/src/routes/escalations.ts` (insert before the `GET /:id` route at line 61)

- [ ] **Step 1: Write the failing test first**

Create `apps/backend/src/__tests__/sessions.test.ts`:

```typescript
import request from 'supertest';
import { createApp } from './testApp';
import { prisma } from '../lib/prisma';
import { createTestOrg, createTestUser, cleanupOrg, setTestEnv } from './helpers';

setTestEnv();

const app = createApp();

let orgId: string;
let token: string;
let flowId: string;
let stepId: string;
let endUserId: string;
let sessionId: string;

beforeAll(async () => {
  const org = await createTestOrg('Sessions Test Org');
  orgId = org.id;
  const user = await createTestUser(orgId);
  token = user.token;

  const flow = await prisma.onboardingFlow.create({
    data: {
      organizationId: orgId,
      name: 'Onboarding Flow',
      description: '',
      isActive: true,
    },
  });
  flowId = flow.id;

  const step = await prisma.onboardingStep.create({
    data: {
      flowId,
      order: 0,
      title: 'Welcome Step',
      intent: 'greet the user',
    },
  });
  stepId = step.id;

  const endUser = await prisma.endUser.create({
    data: { organizationId: orgId, externalId: 'user-handoff-test', metadata: {} },
  });
  endUserId = endUser.id;

  const session = await prisma.userOnboardingSession.create({
    data: {
      organizationId: orgId,
      endUserId,
      flowId,
      status: 'active',
      collectedData: {},
      lastActiveAt: new Date(),
    },
  });
  sessionId = session.id;

  await prisma.sessionMessage.create({
    data: {
      sessionId,
      role: 'assistant',
      content: 'I can help you get started.',
    },
  });
});

afterAll(async () => {
  await cleanupOrg(orgId);
  await prisma.$disconnect();
});

// ─── POST /api/v1/escalations/manual ─────────────────────────────────────────

describe('POST /api/v1/escalations/manual', () => {
  it('creates an escalation ticket for a valid session', async () => {
    const res = await request(app)
      .post('/api/v1/escalations/manual')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId, notes: 'User seems stuck on billing.' });

    expect(res.status).toBe(201);
    expect(res.body.ticket.id).toBeTruthy();
    expect(res.body.ticket.status).toBe('open');
    expect(res.body.ticket.createdAt).toBeTruthy();
  });

  it('returns 400 when sessionId is missing', async () => {
    const res = await request(app)
      .post('/api/v1/escalations/manual')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/sessionId/);
  });

  it('returns 404 for a session that does not belong to this org', async () => {
    const res = await request(app)
      .post('/api/v1/escalations/manual')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId: 'nonexistent-id' });

    expect(res.status).toBe(404);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/v1/escalations/manual')
      .send({ sessionId });

    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd apps/backend && npx jest --testPathPattern="sessions.test" --no-coverage 2>&1 | tail -20
```

Expected: FAIL — `POST /api/v1/escalations/manual` returns 404 (route doesn't exist yet).

- [ ] **Step 3: Add the route to escalations.ts**

Open `apps/backend/src/routes/escalations.ts`. Insert the following block **after** the `PATCH /:id` route comment at line 60 (i.e., immediately before `router.get('/:id', ...)`):

```typescript
// ─── POST /api/v1/escalations/manual ─────────────────────────────────────────
// Dashboard team member manually hands off a session to the support queue.
router.post('/manual', async (req: AuthenticatedRequest, res: Response) => {
  const { sessionId, notes } = req.body as { sessionId?: string; notes?: string };
  const { organizationId } = req.user!;

  if (!sessionId || typeof sessionId !== 'string') {
    res.status(400).json({ error: 'sessionId is required' });
    return;
  }

  // Verify the session belongs to this org
  const session = await prisma.userOnboardingSession.findFirst({
    where: { id: sessionId, organizationId },
    include: {
      endUser: { select: { id: true } },
      stepProgress: {
        where: { status: 'in_progress' },
        orderBy: { startedAt: 'desc' },
        take: 1,
        select: { stepId: true },
      },
    },
  });

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  // Last assistant message becomes the context snippet shown to the team
  const lastAssistant = await prisma.sessionMessage.findFirst({
    where: { sessionId, role: 'assistant' },
    orderBy: { createdAt: 'desc' },
    select: { content: true },
  });

  // Last 10 messages for full context
  const recentRaw = await prisma.sessionMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { role: true, content: true },
  });
  const recentMessages = recentRaw.reverse();

  const currentStepId = session.stepProgress[0]?.stepId ?? null;

  const ticket = await prisma.escalationTicket.create({
    data: {
      organizationId,
      endUserId: session.endUser.id,
      sessionId,
      stepId: currentStepId,
      trigger: 'manual',
      status: 'open',
      reason: notes ?? 'Manual handoff from session replay',
      agentMessage: lastAssistant?.content ?? '',
      context: { recentMessages },
    },
  });

  res.status(201).json({
    ticket: {
      id: ticket.id,
      status: ticket.status,
      createdAt: ticket.createdAt,
    },
  });
});
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd apps/backend && npx jest --testPathPattern="sessions.test" --no-coverage 2>&1 | tail -20
```

Expected: all 4 tests in `POST /api/v1/escalations/manual` pass.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/routes/escalations.ts apps/backend/src/__tests__/sessions.test.ts
git commit -m "feat: POST /api/v1/escalations/manual — manual team handoff from session"
```

---

## Task 3: Update GET /api/v1/sessions — server-side search + date filter

**Files:**
- Modify: `apps/backend/src/routes/sessions.ts` (the list route, lines 16–78)

- [ ] **Step 1: Add tests for filtering**

Append to `apps/backend/src/__tests__/sessions.test.ts`:

```typescript
// ─── GET /api/v1/sessions ────────────────────────────────────────────────────

describe('GET /api/v1/sessions', () => {
  it('returns session list with JWT', async () => {
    const res = await request(app)
      .get('/api/v1/sessions')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.sessions)).toBe(true);
    expect(typeof res.body.total).toBe('number');
  });

  it('filters by status=active', async () => {
    const res = await request(app)
      .get('/api/v1/sessions?status=active')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.sessions.forEach((s: { status: string }) => {
      expect(s.status).toBe('active');
    });
  });

  it('filters by q matching externalId', async () => {
    const res = await request(app)
      .get('/api/v1/sessions?q=user-handoff-test')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.sessions.length).toBeGreaterThanOrEqual(1);
    expect(res.body.sessions[0].endUser.externalId).toBe('user-handoff-test');
  });

  it('filters by q matching flow name', async () => {
    const res = await request(app)
      .get('/api/v1/sessions?q=Onboarding+Flow')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.sessions.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 400 for invalid from date', async () => {
    const res = await request(app)
      .get('/api/v1/sessions?from=not-a-date')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/sessions');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run to verify new tests fail**

```bash
cd apps/backend && npx jest --testPathPattern="sessions.test" --no-coverage 2>&1 | grep -E "PASS|FAIL|✓|✗|×|●" | head -20
```

Expected: `filters by q` and `returns 400 for invalid from date` tests fail.

- [ ] **Step 3: Update the list route in sessions.ts**

In `apps/backend/src/routes/sessions.ts`, replace the `GET /` handler (lines 16–78) with:

```typescript
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const orgId  = req.user!.organizationId;
  const limit  = Math.min(Number(req.query.limit  ?? 50), 200);
  const offset = Number(req.query.offset ?? 0);
  const status = req.query.status as string | undefined;
  const q      = req.query.q      as string | undefined;
  const from   = req.query.from   as string | undefined;
  const to     = req.query.to     as string | undefined;

  // Validate date params early
  if (from && isNaN(new Date(from).getTime())) {
    res.status(400).json({ error: 'Invalid from date' });
    return;
  }
  if (to && isNaN(new Date(to).getTime())) {
    res.status(400).json({ error: 'Invalid to date' });
    return;
  }

  const where: Parameters<typeof prisma.userOnboardingSession.findMany>[0]['where'] = {
    organizationId: orgId,
  };

  if (status && ['active', 'completed', 'abandoned'].includes(status)) {
    where.status = status;
  }

  if (from || to) {
    where.startedAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to   ? { lte: new Date(to)   } : {}),
    };
  }

  if (q) {
    where.OR = [
      { endUser: { externalId: { contains: q, mode: 'insensitive' } } },
      { flow:    { name:       { contains: q, mode: 'insensitive' } } },
    ];
  }

  const [sessions, total] = await Promise.all([
    prisma.userOnboardingSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        flow:    { select: { id: true, name: true, flowType: true } },
        endUser: { select: { id: true, externalId: true, metadata: true } },
        stepProgress: {
          select: {
            status: true,
            stepId: true,
            completedAt: true,
            dropReason: true,
            outcome: true,
          },
        },
      },
    }),
    prisma.userOnboardingSession.count({ where }),
  ]);

  const items = sessions.map((s) => {
    const completed = s.stepProgress.filter((p) => p.status === 'completed').length;
    const dropped   = s.stepProgress.find((p) => p.status === 'dropped');
    const durationMs = s.completedAt
      ? new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()
      : new Date(s.lastActiveAt).getTime() - new Date(s.startedAt).getTime();

    return {
      id:             s.id,
      status:         s.status,
      startedAt:      s.startedAt,
      completedAt:    s.completedAt,
      lastActiveAt:   s.lastActiveAt,
      firstValueAt:   s.firstValueAt,
      durationMs,
      stepsCompleted: completed,
      dropStepId:     dropped?.stepId ?? null,
      dropReason:     dropped?.dropReason ?? null,
      flow: s.flow,
      endUser: {
        id:         s.endUser.id,
        externalId: s.endUser.externalId,
        metadata:   s.endUser.metadata,
      },
    };
  });

  res.json({ sessions: items, total, limit, offset });
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd apps/backend && npx jest --testPathPattern="sessions.test" --no-coverage 2>&1 | tail -20
```

Expected: all tests in `GET /api/v1/sessions` pass.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/routes/sessions.ts apps/backend/src/__tests__/sessions.test.ts
git commit -m "feat: sessions list — server-side search (q) and date range (from/to) filters"
```

---

## Task 4: Add escalationTicketId to GET /api/v1/sessions/:id

**Files:**
- Modify: `apps/backend/src/routes/sessions.ts` (the `GET /:id` handler, lines 112–202)

- [ ] **Step 1: Add tests for the detail route**

Append to `apps/backend/src/__tests__/sessions.test.ts`:

```typescript
// ─── GET /api/v1/sessions/:id ────────────────────────────────────────────────

describe('GET /api/v1/sessions/:id', () => {
  it('returns session detail with escalationTicketId null when none exists', async () => {
    // Create a fresh session with no escalation
    const endUser2 = await prisma.endUser.create({
      data: { organizationId: orgId, externalId: 'user-detail-test', metadata: {} },
    });
    const session2 = await prisma.userOnboardingSession.create({
      data: {
        organizationId: orgId,
        endUserId: endUser2.id,
        flowId,
        status: 'active',
        collectedData: {},
        lastActiveAt: new Date(),
      },
    });

    const res = await request(app)
      .get(`/api/v1/sessions/${session2.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.session.id).toBe(session2.id);
    expect(res.body.session.escalationTicketId).toBeNull();
  });

  it('returns escalationTicketId when a manual ticket exists', async () => {
    // First create a manual ticket for our seeded session
    const ticketRes = await request(app)
      .post('/api/v1/escalations/manual')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId });

    const ticketId = ticketRes.body.ticket.id;

    const res = await request(app)
      .get(`/api/v1/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.session.escalationTicketId).toBe(ticketId);
  });

  it('returns 404 for unknown session', async () => {
    const res = await request(app)
      .get('/api/v1/sessions/does-not-exist')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
cd apps/backend && npx jest --testPathPattern="sessions.test" --no-coverage 2>&1 | grep -E "escalationTicketId|FAIL|●" | head -10
```

Expected: `returns session detail with escalationTicketId null` and `returns escalationTicketId when a manual ticket exists` tests fail.

- [ ] **Step 3: Update the GET /:id handler**

In `apps/backend/src/routes/sessions.ts`, update the `GET /:id` handler. The `const [session, rawMessages]` block at line 115 becomes a three-way parallel fetch — add the escalation lookup:

```typescript
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;

  const [session, rawMessages, escalationTicket] = await Promise.all([
    prisma.userOnboardingSession.findFirst({
      where: { id: req.params.id, organizationId },
      include: {
        flow: {
          include: {
            steps: { orderBy: { order: 'asc' } },
          },
        },
        endUser: {
          select: {
            id: true,
            externalId: true,
            metadata: true,
            firstSeenAt: true,
            lastSeenAt: true,
          },
        },
        stepProgress: true,
      },
    }),
    prisma.sessionMessage.findMany({
      where: { sessionId: req.params.id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: {
        id: true,
        role: true,
        content: true,
        actionType: true,
        stepId: true,
        feedback: true,
        createdAt: true,
      },
    }),
    prisma.escalationTicket.findFirst({
      where: { sessionId: req.params.id, organizationId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    }),
  ]);

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const messages = rawMessages.filter(
    (m) => m.content !== '__init__' && m.content !== '__verify__'
  );

  const steps = session.flow.steps.map((step) => {
    const progress = session.stepProgress.find((p) => p.stepId === step.id);
    return {
      stepId: step.id,
      order: step.order,
      title: step.title,
      intent: step.intent,
      isMilestone: step.isMilestone,
      actionType: step.actionType,
      status: progress?.status ?? 'not_started',
      startedAt: progress?.startedAt ?? null,
      completedAt: progress?.completedAt ?? null,
      timeSpentMs: progress?.timeSpentMs ?? 0,
      messagesCount: progress?.messagesCount ?? 0,
      aiAssisted: progress?.aiAssisted ?? false,
      attempts: progress?.attempts ?? 0,
      outcome: progress?.outcome ?? null,
      dropReason: progress?.dropReason ?? null,
    };
  });

  res.json({
    session: {
      id: session.id,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      lastActiveAt: session.lastActiveAt,
      firstValueAt: session.firstValueAt,
      collectedData: session.collectedData,
      escalationTicketId: escalationTicket?.id ?? null,
      flow: {
        id: session.flow.id,
        name: session.flow.name,
      },
      endUser: session.endUser,
      steps,
      messages,
    },
  });
});
```

- [ ] **Step 4: Run all session tests**

```bash
cd apps/backend && npx jest --testPathPattern="sessions.test" --no-coverage 2>&1 | tail -25
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/routes/sessions.ts apps/backend/src/__tests__/sessions.test.ts
git commit -m "feat: session detail — include escalationTicketId in response"
```

---

## Task 5: Update dashboard API client and types

**Files:**
- Modify: `apps/dashboard/lib/api.ts`

- [ ] **Step 1: Update `api.escalations` — add `createManual`**

In `apps/dashboard/lib/api.ts`, find the `escalations` object (around line 221). Add the new method after `update`:

```typescript
escalations: {
  list: (status?: string) =>
    apiFetch<{ tickets: EscalationTicket[]; counts: { open: number; in_progress: number; resolved: number } }>(
      `/api/v1/escalations${status ? `?status=${status}` : ''}`
    ),
  get: (id: string) => apiFetch<{ ticket: EscalationTicketDetail }>(`/api/v1/escalations/${id}`),
  update: (id: string, data: { status?: string; notes?: string }) =>
    apiFetch<{ ticket: EscalationTicket }>(`/api/v1/escalations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  createManual: (sessionId: string, notes?: string) =>
    apiFetch<{ ticket: { id: string; status: string; createdAt: string } }>('/api/v1/escalations/manual', {
      method: 'POST',
      body: JSON.stringify({ sessionId, notes }),
    }),
},
```

- [ ] **Step 2: Update `api.sessions.list` — add q/from/to params**

Find the `sessions` object (around line 333). Replace it:

```typescript
sessions: {
  list: (params?: {
    limit?: number;
    offset?: number;
    status?: 'active' | 'completed' | 'abandoned';
    q?: string;
    from?: string;
    to?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.limit)  qs.set('limit',  String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    if (params?.status) qs.set('status', params.status);
    if (params?.q)      qs.set('q',      params.q);
    if (params?.from)   qs.set('from',   params.from);
    if (params?.to)     qs.set('to',     params.to);
    return apiFetch<{ sessions: SessionListItem[]; total: number; limit: number; offset: number }>(`/api/v1/sessions?${qs}`);
  },
  get: (id: string) => apiFetch<{ session: SessionDetail }>(`/api/v1/sessions/${id}`),
},
```

- [ ] **Step 3: Update `SessionDetail` type — add `escalationTicketId`**

Find the `SessionDetail` interface (around line 1141). Add one field:

```typescript
export interface SessionDetail {
  id: string;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt: string | null;
  lastActiveAt: string;
  firstValueAt: string | null;
  collectedData: Record<string, unknown>;
  escalationTicketId: string | null;       // ← add this
  flow: { id: string; name: string };
  endUser: {
    id: string;
    externalId: string | null;
    metadata: Record<string, unknown>;
    firstSeenAt: string;
    lastSeenAt: string;
  };
  steps: SessionStepDetail[];
  messages: SessionMessage[];
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd apps/dashboard && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/lib/api.ts
git commit -m "feat: api client — sessions list filters, escalation manual handoff, SessionDetail type"
```

---

## Task 6: Sessions list — server-side search + date range filter

**Files:**
- Modify: `apps/dashboard/app/(app)/sessions/page.tsx`

- [ ] **Step 1: Replace the full page file**

The current file uses client-side filtering. Replace it entirely with:

```typescript
'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, SessionListItem } from '@/lib/api';

const PAGE_SIZE = 25;

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  completed: { bg: '#ecfdf5', text: '#059669', dot: '#10b981' },
  active:    { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' },
  abandoned: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
};

const FLOW_TYPE_COLORS: Record<string, string> = {
  onboarding: '#6366f1', adoption: '#0ea5e9', upsell: '#f59e0b',
  retention: '#ef4444', support: '#10b981',
};

function fmt(ms: number) {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function SessionsPage() {
  const [sessions, setSessions]     = useState<SessionListItem[]>([]);
  const [total, setTotal]           = useState(0);
  const [offset, setOffset]         = useState(0);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'abandoned'>('all');
  // search: what the input shows; searchQuery: what's sent to the API (debounced)
  const [search, setSearch]         = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate]     = useState('');
  const [toDate, setToDate]         = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch when any server-side param changes
  useEffect(() => {
    setLoading(true);
    api.sessions.list({
      limit: PAGE_SIZE,
      offset,
      status: statusFilter === 'all' ? undefined : statusFilter,
      q:    searchQuery || undefined,
      from: fromDate    || undefined,
      to:   toDate      || undefined,
    }).then((d) => {
      setSessions(d.sessions);
      setTotal(d.total);
    }).finally(() => setLoading(false));
  }, [offset, statusFilter, searchQuery, fromDate, toDate]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setOffset(0);
      setSearchQuery(value);
    }, 300);
  };

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    setOffset(0);
    if (field === 'from') setFromDate(value);
    else setToDate(value);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>Sessions</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Every agent session — what happened, which steps completed, where users dropped off.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Date range */}
          {(['from', 'to'] as const).map((f) => (
            <input
              key={f}
              type="date"
              value={f === 'from' ? fromDate : toDate}
              onChange={(e) => handleDateChange(f, e.target.value)}
              title={f === 'from' ? 'From date' : 'To date'}
              style={{
                padding: '7px 10px', background: 'var(--surface-low)',
                border: '1px solid rgba(70,69,84,0.2)', borderRadius: 8,
                color: 'var(--on-surface)', fontSize: 12,
              }}
            />
          ))}
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search user or flow…"
            style={{
              padding: '8px 12px', background: 'var(--surface-low)',
              border: '1px solid rgba(70,69,84,0.2)', borderRadius: 8,
              color: 'var(--on-surface)', fontSize: 13, width: 200,
            }}
          />
        </div>
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['all', 'active', 'completed', 'abandoned'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setOffset(0); }}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', border: '1px solid',
              background: statusFilter === s
                ? (s === 'all' ? 'var(--on-surface)' : STATUS_COLORS[s]?.bg)
                : 'transparent',
              color: statusFilter === s
                ? (s === 'all' ? 'var(--surface)' : STATUS_COLORS[s]?.text)
                : 'var(--muted)',
              borderColor: statusFilter === s
                ? (s === 'all' ? 'var(--on-surface)' : STATUS_COLORS[s]?.dot)
                : 'rgba(70,69,84,0.2)',
            }}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)', alignSelf: 'center' }}>
          {total} total
        </span>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>◎</div>
            <p style={{ fontWeight: 600, color: 'var(--on-surface)', margin: 0 }}>No sessions found</p>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
              {searchQuery || fromDate || toDate
                ? 'Try adjusting your search or date filters.'
                : 'Sessions appear once users start interacting with your agent flows.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
                {['User', 'Flow', 'Status', 'Steps done', 'Duration', 'Drop-off', 'Started'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 16px',
                    fontSize: 11, fontWeight: 600, color: 'var(--muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>{h}</th>
                ))}
                <th style={{ padding: '10px 16px' }} />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const sc = STATUS_COLORS[s.status] ?? STATUS_COLORS.abandoned;
                const fc = FLOW_TYPE_COLORS[s.flow.flowType] ?? '#6366f1';
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(70,69,84,0.06)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--on-surface)' }}>
                      {s.endUser.externalId
                        ? <code style={{ fontSize: 12, background: 'var(--surface-low)', padding: '2px 6px', borderRadius: 4 }}>{s.endUser.externalId}</code>
                        : <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>anonymous</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: `${fc}18`, color: fc,
                        border: `1px solid ${fc}30`, borderRadius: 6,
                        padding: '2px 8px', fontSize: 11, fontWeight: 600,
                      }}>{s.flow.name}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: sc.bg, color: sc.text,
                        border: `1px solid ${sc.dot}30`, borderRadius: 20,
                        padding: '2px 10px', fontSize: 11, fontWeight: 600,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--on-surface)', fontWeight: 600 }}>
                      {s.stepsCompleted}
                      {s.firstValueAt && <span style={{ marginLeft: 6, fontSize: 11, color: '#f59e0b' }} title="Reached first value milestone">⭐</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{fmt(s.durationMs)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {s.dropReason
                        ? <span style={{ fontSize: 11, color: '#dc2626', background: '#fef2f2', padding: '2px 6px', borderRadius: 4 }}>{s.dropReason.replace(/_/g, ' ')}</span>
                        : <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12 }}>{fmtDate(s.startedAt)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Link href={`/sessions/${s.id}`} style={{ fontSize: 12, fontWeight: 600, color: '#FF857A', textDecoration: 'none' }}>
                        Replay →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && total > PAGE_SIZE && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', borderTop: '1px solid rgba(70,69,84,0.1)',
            fontSize: 12, color: 'var(--muted)',
          }}>
            <span>Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: 'var(--surface-low)', border: '1px solid rgba(70,69,84,0.2)',
                  color: 'var(--muted)', cursor: offset === 0 ? 'not-allowed' : 'pointer',
                  opacity: offset === 0 ? 0.4 : 1,
                }}
              >← Prev</button>
              <button
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
                style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: 'var(--surface-low)', border: '1px solid rgba(70,69,84,0.2)',
                  color: 'var(--muted)', cursor: offset + PAGE_SIZE >= total ? 'not-allowed' : 'pointer',
                  opacity: offset + PAGE_SIZE >= total ? 0.4 : 1,
                }}
              >Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/dashboard && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/app/\(app\)/sessions/page.tsx
git commit -m "feat: sessions list — server-side search + date range filter"
```

---

## Task 7: Session replay — hand-off modal, escalation banner, live polling, copy link, user deep-link

**Files:**
- Modify: `apps/dashboard/app/(app)/sessions/[id]/page.tsx`

- [ ] **Step 1: Replace the full page file**

The new file adds: a `HandOffModal` component, live polling effect, escalation banner, copy-link button, and a linked user ID. Replace the entire file:

```typescript
'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, SessionDetail, SessionMessage } from '@/lib/api';

function fmt(ms: number) {
  if (!ms) return '—';
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const ACTION_BADGE: Record<string, { label: string; color: string }> = {
  ask_clarification:   { label: 'question',   color: '#6366f1' },
  execute_page_action: { label: 'action',      color: '#0ea5e9' },
  complete_step:       { label: 'step done',   color: '#10b981' },
  celebrate_milestone: { label: 'milestone',   color: '#f59e0b' },
  escalate_to_human:   { label: 'escalated',   color: '#ef4444' },
  chat:                { label: 'chat',         color: '#94a3b8' },
  goal_complete:       { label: 'goal done',   color: '#10b981' },
  degrade_to_manual:   { label: 'manual step', color: '#f97316' },
};

function ChatTranscript({
  messages,
  activeStepId,
}: {
  messages: SessionMessage[];
  activeStepId: string | null;
}) {
  const visible = activeStepId
    ? messages.filter((m) => m.stepId === activeStepId || m.stepId === null)
    : messages;
  if (visible.length === 0) return null;

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>Chat Transcript</p>
        <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>
          {activeStepId ? 'Showing messages for selected step' : 'Full session transcript'}
        </p>
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
        {visible.map((m) => {
          const isUser = m.role === 'user';
          const badge = m.actionType ? ACTION_BADGE[m.actionType] : null;
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '82%',
                background: isUser ? 'linear-gradient(135deg, #FF857A22, #EBAEE622)' : 'var(--surface-low)',
                border: `1px solid ${isUser ? 'rgba(255,133,122,0.25)' : 'rgba(70,69,84,0.12)'}`,
                borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                padding: '8px 12px',
              }}>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--on-surface)', lineHeight: 1.5 }}>{m.content}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                {badge && (
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: `${badge.color}18`, color: badge.color, border: `1px solid ${badge.color}30` }}>
                    {badge.label}
                  </span>
                )}
                {m.feedback === 1  && <span style={{ fontSize: 10, color: '#10b981' }}>👍</span>}
                {m.feedback === -1 && <span style={{ fontSize: 10, color: '#ef4444' }}>👎</span>}
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                  {new Date(m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Hand-Off Modal ───────────────────────────────────────────────────────────

function HandOffModal({
  session,
  onClose,
  onSuccess,
}: {
  session: SessionDetail;
  onClose: () => void;
  onSuccess: (ticketId: string) => void;
}) {
  const [notes, setNotes] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const submit = async () => {
    setState('loading');
    try {
      const res = await api.escalations.createManual(session.id, notes || undefined);
      onSuccess(res.ticket.id);
    } catch (e: unknown) {
      setState('error');
      setErrorMsg(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', borderRadius: 14, padding: 28, width: 440,
        border: '1px solid rgba(70,69,84,0.15)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)', margin: '0 0 6px' }}>
          Hand Off to Team
        </h2>
        <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 20px' }}>
          This creates an escalation ticket with the full session context pre-loaded.
        </p>

        {/* Context summary */}
        <div style={{ background: 'var(--surface-low)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, display: 'grid', gap: 8 }}>
          {[
            { label: 'User',  value: session.endUser.externalId ?? 'anonymous' },
            { label: 'Flow',  value: session.flow.name },
            { label: 'Steps', value: `${session.steps.filter(s => s.status === 'completed').length} / ${session.steps.length}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{label}</span>
              <span style={{ color: 'var(--on-surface)', fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Notes for your team (optional)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="e.g. User seems stuck on billing section, has asked 3 times…"
            style={{
              width: '100%', marginTop: 6, padding: '8px 10px',
              background: 'var(--surface-low)', border: '1px solid rgba(70,69,84,0.2)',
              borderRadius: 8, color: 'var(--on-surface)', fontSize: 12,
              resize: 'vertical', boxSizing: 'border-box',
            }}
          />
        </label>

        {state === 'error' && (
          <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{errorMsg}</p>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'var(--surface-low)', border: '1px solid rgba(70,69,84,0.2)',
              color: 'var(--muted)', cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={submit}
            disabled={state === 'loading'}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg, #FF857A, #EBAEE6)',
              color: '#3d1008', border: 'none', cursor: state === 'loading' ? 'not-allowed' : 'pointer',
              opacity: state === 'loading' ? 0.7 : 1,
            }}
          >
            {state === 'loading' ? 'Creating…' : 'Hand Off'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status constants ─────────────────────────────────────────────────────────

const STATUS_ICON: Record<string, { icon: string; color: string; label: string }> = {
  completed:   { icon: '✓', color: '#10b981', label: 'Completed' },
  in_progress: { icon: '●', color: '#3b82f6', label: 'In progress' },
  dropped:     { icon: '✗', color: '#ef4444', label: 'Dropped' },
  skipped:     { icon: '→', color: '#f59e0b', label: 'Skipped' },
  not_started: { icon: '○', color: '#94a3b8', label: 'Not started' },
};

const SESSION_STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  completed: { bg: '#ecfdf5', text: '#059669', dot: '#10b981' },
  active:    { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' },
  abandoned: { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444' },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SessionReplayPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [activeStep, setActiveStep]     = useState<string | null>(null);
  const [showHandOff, setShowHandOff]   = useState(false);
  const [handOffTicketId, setHandOffTicketId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSession = async () => {
    const data = await api.sessions.get(id);
    setSession(data.session);
    return data.session;
  };

  // Initial load
  useEffect(() => {
    api.sessions.get(id)
      .then((d) => {
        setSession(d.session);
        const focus = d.session.steps.find((s) =>
          s.outcome === 'dropped' || s.status === 'in_progress'
        ) ?? d.session.steps[0];
        if (focus) setActiveStep(focus.stepId);
      })
      .catch(() => setError('Session not found'))
      .finally(() => setLoading(false));
  }, [id]);

  // Live polling for active sessions
  useEffect(() => {
    if (!session || session.status !== 'active') {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }
    pollingRef.current = setInterval(async () => {
      try {
        const updated = await loadSession();
        if (updated.status !== 'active' && pollingRef.current) {
          clearInterval(pollingRef.current);
        }
      } catch {
        // silently ignore polling errors
      }
    }, 10_000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [session?.status, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading session…</div>
  );
  if (error || !session) return (
    <div style={{ padding: 48, textAlign: 'center', color: '#ef4444', fontSize: 13 }}>{error || 'Session not found'}</div>
  );

  const sc         = SESSION_STATUS_COLORS[session.status] ?? SESSION_STATUS_COLORS.abandoned;
  const totalSteps = session.steps.length;
  const doneSteps  = session.steps.filter((s) => s.status === 'completed').length;
  const dropStep   = session.steps.find((s) => s.outcome === 'dropped');
  const totalMs    = session.steps.reduce((acc, s) => acc + (s.timeSpentMs ?? 0), 0);
  const collectedEntries = Object.entries((session.collectedData ?? {}) as Record<string, unknown>);
  const selectedStep     = session.steps.find((s) => s.stepId === activeStep);
  const isHandedOff      = handOffTicketId !== null || session.escalationTicketId !== null;
  const existingTicketId = handOffTicketId ?? session.escalationTicketId;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1080 }}>
      {showHandOff && (
        <HandOffModal
          session={session}
          onClose={() => setShowHandOff(false)}
          onSuccess={(ticketId) => {
            setHandOffTicketId(ticketId);
            setShowHandOff(false);
          }}
        />
      )}

      {/* Back */}
      <button
        onClick={() => router.push('/sessions')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, marginBottom: 16, padding: 0 }}
      >
        ← Back to sessions
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
            Session Replay
            {session.status === 'active' && (
              <span style={{ marginLeft: 10, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#2563eb' }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#3b82f6',
                  boxShadow: '0 0 0 3px rgba(59,130,246,0.25)',
                  animation: 'pulse 2s infinite',
                  display: 'inline-block',
                }} />
                Live
              </span>
            )}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontFamily: 'monospace' }}>{session.id}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Copy link */}
          <button
            onClick={copyLink}
            title="Copy link to this session"
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'var(--surface-low)', border: '1px solid rgba(70,69,84,0.2)',
              color: copied ? '#10b981' : 'var(--muted)', cursor: 'pointer',
            }}
          >
            {copied ? '✓ Copied' : '⎘ Copy link'}
          </button>

          {/* Hand off / already handed off */}
          {isHandedOff ? (
            <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
              ✓ Handed off
              {existingTicketId && (
                <Link href={`/settings/audit`} style={{ marginLeft: 6, color: '#FF857A', textDecoration: 'none' }}>
                  View ticket →
                </Link>
              )}
            </span>
          ) : (
            <button
              onClick={() => setShowHandOff(true)}
              style={{
                padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: 'linear-gradient(135deg, #FF857A, #EBAEE6)',
                color: '#3d1008', border: 'none', cursor: 'pointer',
              }}
            >
              ↗ Hand Off to Team
            </button>
          )}

          {/* Status badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: sc.bg, color: sc.text,
            border: `1px solid ${sc.dot}40`, borderRadius: 20,
            padding: '4px 12px', fontSize: 12, fontWeight: 600,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
            {session.status}
          </span>
        </div>
      </div>

      {/* Escalation banner — shown when ticket already exists */}
      {session.escalationTicketId && !handOffTicketId && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
        }}>
          <span style={{ fontSize: 18 }}>🚨</span>
          <div>
            <strong style={{ color: '#dc2626' }}>This session was escalated</strong>
            <Link href="/settings/audit" style={{ marginLeft: 8, fontSize: 12, color: '#FF857A', textDecoration: 'none', fontWeight: 600 }}>
              View ticket →
            </Link>
          </div>
        </div>
      )}

      {/* New hand-off success banner */}
      {handOffTicketId && (
        <div style={{
          background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
        }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <span style={{ color: '#065f46' }}>
            <strong>Handed off to your team.</strong>
            <Link href="/settings/audit" style={{ marginLeft: 8, fontSize: 12, color: '#FF857A', textDecoration: 'none', fontWeight: 600 }}>
              View ticket →
            </Link>
          </span>
        </div>
      )}

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Flow',       value: session.flow.name },
          { label: 'User',       value: session.endUser.externalId ?? 'anonymous', href: '/users' },
          { label: 'Steps',      value: `${doneSteps} / ${totalSteps}` },
          { label: 'Time spent', value: fmt(totalMs) },
          { label: 'Started',    value: fmtDate(session.startedAt) },
        ].map(({ label, value, href }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)',
            borderRadius: 10, padding: '14px 16px',
          }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
            {href ? (
              <Link href={href} style={{ fontSize: 14, fontWeight: 700, color: '#FF857A', margin: '4px 0 0', display: 'block', textDecoration: 'none', wordBreak: 'break-all' }}>
                {value}
              </Link>
            ) : (
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', margin: '4px 0 0', wordBreak: 'break-all' }}>{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Drop-off banner */}
      {dropStep && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <strong style={{ color: '#dc2626' }}>Drop-off detected</strong>
            <span style={{ color: '#7f1d1d', marginLeft: 8 }}>
              at step {dropStep.order + 1}: <em>{dropStep.title}</em>
              {dropStep.dropReason && ` — ${dropStep.dropReason.replace(/_/g, ' ')}`}
            </span>
          </div>
        </div>
      )}

      {/* Milestone banner */}
      {session.firstValueAt && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 10,
          padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
        }}>
          <span style={{ fontSize: 18 }}>⭐</span>
          <span style={{ color: '#92400e' }}>
            <strong>First value reached</strong> at {fmtDate(session.firstValueAt)}
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Step timeline */}
        <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>Step Timeline</p>
          </div>
          <div style={{ padding: '8px 0' }}>
            {session.steps.map((step, idx) => {
              const meta = STATUS_ICON[step.status] ?? STATUS_ICON.not_started;
              const isSelected = activeStep === step.stepId;
              return (
                <button
                  key={step.stepId}
                  onClick={() => setActiveStep(step.stepId)}
                  style={{
                    width: '100%', textAlign: 'left', background: isSelected ? `${meta.color}10` : 'none',
                    border: 'none', borderLeft: isSelected ? `3px solid ${meta.color}` : '3px solid transparent',
                    padding: '10px 16px', cursor: 'pointer', display: 'block',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: '50%', border: `2px solid ${meta.color}`,
                      background: step.status === 'completed' ? meta.color : 'transparent',
                      color: step.status === 'completed' ? '#fff' : meta.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}>{meta.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {idx + 1}. {step.title}
                      </p>
                      <p style={{ margin: 0, fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
                        {meta.label}{step.timeSpentMs > 0 ? ` · ${fmt(step.timeSpentMs)}` : ''}
                        {step.isMilestone && ' ⭐'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selectedStep && (
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(70,69,84,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>
                  Step {selectedStep.order + 1}: {selectedStep.title}
                </p>
                {selectedStep.isMilestone && (
                  <span style={{ fontSize: 11, background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>
                    First value
                  </span>
                )}
              </div>
              <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    { label: 'Status',      value: STATUS_ICON[selectedStep.status]?.label ?? selectedStep.status },
                    { label: 'Time spent',  value: fmt(selectedStep.timeSpentMs) },
                    { label: 'AI-assisted', value: selectedStep.aiAssisted ? 'Yes' : 'No' },
                    { label: 'Attempts',    value: String(selectedStep.attempts) },
                    { label: 'Messages',    value: String(selectedStep.messagesCount) },
                    { label: 'Action type', value: selectedStep.actionType ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 500, color: 'var(--on-surface)' }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {[
                    { label: 'Started at',   value: fmtDate(selectedStep.startedAt) },
                    { label: 'Completed at', value: fmtDate(selectedStep.completedAt) },
                    { label: 'Outcome',      value: selectedStep.outcome ?? '—' },
                    { label: 'Drop reason',  value: selectedStep.dropReason?.replace(/_/g, ' ') ?? '—' },
                    { label: 'Intent',       value: selectedStep.intent || '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 500, color: 'var(--on-surface)', wordBreak: 'break-all' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {session.messages && session.messages.length > 0 && (
            <ChatTranscript messages={session.messages} activeStepId={activeStep} />
          )}

          {collectedEntries.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>Collected Data</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)' }}>Answers the user gave during the session</p>
              </div>
              <div style={{ padding: '14px 20px', display: 'grid', gap: 10 }}>
                {collectedEntries.map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>{k}</span>
                    <span style={{ fontSize: 12, color: 'var(--on-surface)', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {session.endUser && Object.keys(session.endUser.metadata ?? {}).length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(70,69,84,0.12)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(70,69,84,0.1)' }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>User Metadata</p>
              </div>
              <div style={{ padding: '14px 20px', display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>User ID</span>
                  <span style={{ color: 'var(--on-surface)', fontFamily: 'monospace' }}>{session.endUser.externalId ?? 'anonymous'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>First seen</span>
                  <span style={{ color: 'var(--on-surface)' }}>{fmtDate(session.endUser.firstSeenAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Last seen</span>
                  <span style={{ color: 'var(--on-surface)' }}>{fmtDate(session.endUser.lastSeenAt)}</span>
                </div>
                {Object.entries(session.endUser.metadata as Record<string, unknown>).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{k}</span>
                    <span style={{ color: 'var(--on-surface)', wordBreak: 'break-all', textAlign: 'right' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd apps/dashboard && npx tsc --noEmit 2>&1 | head -30
```

Expected: no new errors. If you see `eslint-disable-line` comment errors, those are warnings only and don't affect build.

- [ ] **Step 3: Commit**

```bash
git add "apps/dashboard/app/(app)/sessions/[id]/page.tsx"
git commit -m "feat: session replay — hand-off modal, escalation banner, live polling, copy link, user link"
```

---

## Task 8: Run the full backend test suite

- [ ] **Step 1: Run all tests**

```bash
cd apps/backend && npx jest --no-coverage 2>&1 | tail -30
```

Expected: all test suites pass. Note: sessions.test.ts should show all tests passing.

- [ ] **Step 2: If any pre-existing tests fail, check they're unrelated**

If only `sessions.test.ts` tests are failing, fix before committing. Pre-existing failures in other suites can be noted but shouldn't block this feature's commit.

- [ ] **Step 3: Final commit if any loose files**

```bash
git status
```

If clean: nothing to do. If any staged files remain:

```bash
git add -A
git commit -m "chore: session tracking completion — final cleanup"
```

---

## Self-Review

**Spec coverage check (against pivot11.md):**

| Gap from pivot11 | Task that covers it |
|---|---|
| Manual "Hand Off" button + endpoint | Task 2 (endpoint) + Task 7 (UI) |
| Session ↔ escalation bidirectional linking | Task 4 (escalationTicketId in response) + Task 7 (banners + links) |
| Server-side search (q) | Task 3 (backend) + Task 6 (frontend) |
| Date range filter (from/to) | Task 3 (backend) + Task 6 (frontend) |
| Live session indicator + polling | Task 7 (polling effect + live dot) |
| User history deep-link | Task 7 (User KPI card → /users) |
| Copy link | Task 7 (copy-link button) |
| testApp missing routes | Task 1 |

All gaps from pivot11.md are covered.

**Type consistency:**
- `api.escalations.createManual` returns `{ ticket: { id: string; status: string; createdAt: string } }` — matches what `HandOffModal.submit` destructures
- `SessionDetail.escalationTicketId` is `string | null` — matches all places it's read (`?? null`, `?? session.escalationTicketId`)
- `sessions.list` params `q`/`from`/`to` are `string | undefined` — match backend query param types
- `STATUS_ICON`, `ACTION_BADGE`, `SESSION_STATUS_COLORS` — same keys/shapes used in Tasks 1–7 as in original file
