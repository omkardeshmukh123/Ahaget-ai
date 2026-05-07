import request from 'supertest';
import { createApp } from './testApp';
import { prisma } from '../lib/prisma';
import { createTestOrg, createTestUser, cleanupOrg, setTestEnv } from './helpers';

setTestEnv();

const app = createApp();

let orgId: string;
let token: string;

beforeAll(async () => {
  const org = await createTestOrg('Analytics Test Org');
  orgId = org.id;
  const user = await createTestUser(orgId);
  token = user.token;
});

afterAll(async () => {
  await cleanupOrg(orgId);
  await prisma.$disconnect();
});

describe('GET /api/v1/analytics/overview', () => {
  it('returns overview stats', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/overview')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.totalConversations).toBe('number');
    expect(typeof res.body.activeUsers).toBe('number');
    expect(typeof res.body.avgMessagesPerConv).toBe('number');
    expect(typeof res.body.conversionRate).toBe('number');
  });

  it('rejects without JWT', async () => {
    const res = await request(app).get('/api/v1/analytics/overview');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/analytics/timeline', () => {
  it('returns 30 data points by default', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/timeline')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(30);
    expect(res.body[0]).toHaveProperty('date');
    expect(res.body[0]).toHaveProperty('conversations');
  });

  it('respects ?days param', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/timeline?days=7')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(7);
  });
});

describe('GET /api/v1/analytics/triggers', () => {
  it('returns trigger breakdown array', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/triggers')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/v1/analytics/choke-points', () => {
  let cpOrgId: string;
  let cpToken: string;
  let cpFlowId: string;
  let cpStepId: string;

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

    // Seed 4 sessions: 3 dropped, 1 completed — gives frequency=4, drop_rate=75
    // Each session needs its own EndUser (unique constraint: endUserId+flowId)
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
  });

  afterAll(async () => {
    await cleanupOrg(cpOrgId);
  });

  it('returns 200 with choke_points array, page_summary, generated_at, and days', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/choke-points?days=30')
      .set('Authorization', `Bearer ${cpToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.choke_points)).toBe(true);
    expect(Array.isArray(res.body.page_summary)).toBe(true);
    expect(typeof res.body.generated_at).toBe('string');
    expect(res.body.days).toBe(30);
  });

  it('detects the seeded choke step with correct shape and values', async () => {
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
    expect(cp.severity_score).toBeGreaterThan(0);
    expect(['critical', 'high', 'medium', 'low']).toContain(cp.severity_label);
    expect(['worsening', 'improving', 'stable', 'new']).toContain(cp.trend);
    expect(Array.isArray(cp.example_messages)).toBe(true);
    expect(typeof cp.rank).toBe('number');
    expect(cp.rank).toBeGreaterThanOrEqual(1);
  });

  it('suppresses steps with fewer than 3 sessions', async () => {
    const smallOrg = await createTestOrg('Small Org Choke');
    const smallUser = await createTestUser(smallOrg.id);
    const smallFlow = await prisma.onboardingFlow.create({
      data: { organizationId: smallOrg.id, name: 'Tiny Flow', description: '', isActive: true },
    });
    const smallStep = await prisma.onboardingStep.create({
      data: { flowId: smallFlow.id, order: 0, title: 'Tiny Step', intent: 'tiny' },
    });
    const eu = await prisma.endUser.create({
      data: { organizationId: smallOrg.id, externalId: 'small-user-1', metadata: {} },
    });
    const s1 = await prisma.userOnboardingSession.create({
      data: { organizationId: smallOrg.id, endUserId: eu.id, flowId: smallFlow.id, status: 'abandoned', collectedData: {}, lastActiveAt: new Date() },
    });
    await prisma.userStepProgress.create({
      data: { sessionId: s1.id, stepId: smallStep.id, status: 'in_progress', outcome: 'dropped', attempts: 2, timeSpentMs: 5000, messagesCount: 1, aiAssisted: false },
    });

    const res = await request(app)
      .get('/api/v1/analytics/choke-points?days=30')
      .set('Authorization', `Bearer ${smallUser.token}`);

    expect(res.status).toBe(200);
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
