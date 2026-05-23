import request from 'supertest';
import { createApp } from './testApp';
import { prisma } from '../utils/prisma';
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

  it('returns 404 for a session belonging to a different org', async () => {
    // Seed a second org with its own session
    const otherOrg = await createTestOrg('Other Org');
    const otherFlow = await prisma.onboardingFlow.create({
      data: { organizationId: otherOrg.id, name: 'Other Flow', description: '', isActive: true },
    });
    const otherUser = await prisma.endUser.create({
      data: { organizationId: otherOrg.id, externalId: 'other-user', metadata: {} },
    });
    const otherSession = await prisma.userOnboardingSession.create({
      data: {
        organizationId: otherOrg.id,
        endUserId: otherUser.id,
        flowId: otherFlow.id,
        status: 'active',
        collectedData: {},
        lastActiveAt: new Date(),
      },
    });

    // Attempt to hand off other org's session using our org's token
    const res = await request(app)
      .post('/api/v1/escalations/manual')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId: otherSession.id });

    expect(res.status).toBe(404);

    // Cleanup the second org
    await cleanupOrg(otherOrg.id);
  });

  it('returns 409 when a ticket already exists for this session', async () => {
    // sessionId already has a ticket from the first test
    const res = await request(app)
      .post('/api/v1/escalations/manual')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId, notes: 'Trying to create a second ticket.' });

    expect(res.status).toBe(409);
    expect(res.body.ticketId).toBeTruthy();
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/v1/escalations/manual')
      .send({ sessionId });

    expect(res.status).toBe(401);
  });
});

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

  it('returns 400 for invalid to date', async () => {
    const res = await request(app)
      .get('/api/v1/sessions?to=not-a-date')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/sessions');
    expect(res.status).toBe(401);
  });
});

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
    // Use the main sessionId which already has a ticket from Task 2 tests
    const res = await request(app)
      .get(`/api/v1/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(typeof res.body.session.escalationTicketId).toBe('string');
    expect(res.body.session.escalationTicketId.length).toBeGreaterThan(0);
  });

  it('returns 404 for unknown session', async () => {
    const res = await request(app)
      .get('/api/v1/sessions/does-not-exist')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
