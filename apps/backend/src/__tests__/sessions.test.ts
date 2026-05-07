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
