import 'dotenv/config';
import 'express-async-errors';
import { initSentry } from './utils/sentry';
initSentry();
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './controllers/auth';
import conversationsRoutes from './controllers/conversations';
import eventsRoutes from './controllers/events';
import analyticsRoutes from './controllers/analytics';
import configRoutes from './controllers/config';
import billingRoutes, { stripeWebhookHandler } from './controllers/billing';
import onboardingRoutes from './controllers/onboarding';
import adminRoutes from './controllers/admin';
import checklistRoutes from './controllers/checklist';
import flowRoutes from './controllers/flow';
import sessionRoutes from './controllers/session';
import activationRoutes from './controllers/activation';
import kbRoutes from './controllers/kb';
import usersRoutes from './controllers/users';
import escalationsRoutes from './controllers/escalations';
import failuresRoutes from './controllers/failures';
import sessionsRoutes from './controllers/sessions';
import mcpRoutes from './controllers/mcp';
import contextSourcesRoutes from './controllers/contextSources';
import contactRoutes from './controllers/contact';
import triggersRoutes from './controllers/triggers';
import proactiveRoutes from './controllers/proactive';
import expansionRoutes from './controllers/expansion';
import interfaceMapRoutes from './controllers/interfaceMap';
import messagesRoutes from './controllers/messages';
import { prisma } from './utils/prisma';
import { errorHandler } from './middleware/errorHandler';
import { requestId } from './middleware/requestId';
import { attachWebSocketServer } from './utils/websocket';
import { checkFlowAlerts } from './services/alerting';
import { runProactiveMessaging } from './services/proactive';
import { runKbRefresh } from './jobs/kbRefresh';

// ─── Startup env validation ───────────────────────────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const OPTIONAL_ENV = ['OPENROUTER_API_KEY', 'OPENAI_API_KEY'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`[startup] Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}
const missingOptional = OPTIONAL_ENV.filter((k) => !process.env[k]);
if (missingOptional.length > 0) {
  console.warn(`[startup] Optional env vars not set (some features disabled): ${missingOptional.join(', ')}`);
}
if (!process.env.ADMIN_SECRET) {
  console.warn('[startup] ADMIN_SECRET not set — admin routes will return 503');
}

const app = express();
const PORT = process.env.PORT ?? 4000;

// ─── Health check (Render) ────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Stripe webhook — MUST be before express.json() ─────────────────────────
app.post(
  '/api/v1/billing/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);

// ─── Global middleware ───────────────────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5173',
    ].filter(Boolean);
    if (allowed.includes(origin!)) return cb(null, true);
    cb(null, true); // widget endpoints are API-key protected — CORS is defence-in-depth
  },
  credentials: false,
}));

app.use(express.json({ limit: '2mb' })); // KB manual articles can be long
app.use(express.urlencoded({ extended: false, limit: '2mb' }));

app.use(requestId);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── REST routes ─────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/conversations', conversationsRoutes);
app.use('/api/v1/events', eventsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/config', configRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/checklist', checklistRoutes);
app.use('/api/v1/flow', flowRoutes);
app.use('/api/v1/session', sessionRoutes);
app.use('/api/v1/activation', activationRoutes);
app.use('/api/v1/kb', kbRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/escalations', escalationsRoutes);
app.use('/api/v1/failures', failuresRoutes);
app.use('/api/v1/sessions', sessionsRoutes);
app.use('/api/v1/mcp', mcpRoutes);
app.use('/api/v1/context-sources', contextSourcesRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/triggers', triggersRoutes);
app.use('/api/v1/proactive', proactiveRoutes);
app.use('/api/v1/expansion', expansionRoutes);
app.use('/api/v1/interface-map', interfaceMapRoutes);
app.use('/api/v1/messages', messagesRoutes);

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'ok', ts: new Date() });
  } catch {
    res.status(503).json({ status: 'error', db: 'unreachable', ts: new Date() });
  }
});

app.use(errorHandler);

// ─── HTTP server + WebSocket ──────────────────────────────────────────────────
const httpServer = http.createServer(app);
attachWebSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`[server] HTTP → http://localhost:${PORT}`);
  console.log(`[server] WS   → ws://localhost:${PORT}/ws`);
  console.log(`[server] Env  → ${process.env.NODE_ENV ?? 'development'}`);

  // ── Cron guard: set CRON_ENABLED=false on replica instances to prevent duplicate runs ──
  const CRON_ENABLED = process.env.CRON_ENABLED !== 'false';
  if (!CRON_ENABLED) {
    console.log('[cron] CRON_ENABLED=false — all scheduled jobs disabled on this instance');
  }

  if (CRON_ENABLED) {
    // ── Flow alert scheduler ───────────────────────────────────────────────
    // Run once 2 minutes after startup, then every hour.
    const ALERT_INTERVAL_MS = 60 * 60 * 1000; // 1 h
    setTimeout(() => {
      checkFlowAlerts().catch((e) => console.error('[alerting] uncaught error:', e));
      setInterval(() => {
        checkFlowAlerts().catch((e) => console.error('[alerting] uncaught error:', e));
      }, ALERT_INTERVAL_MS);
    }, 2 * 60 * 1000);

    // ── Daily trigger evaluator ─────────────────────────────────────────────
    // Evaluates inactivity + feature_unused triggers for all orgs once per day.
    const DAILY_MS = 24 * 60 * 60 * 1000;
    const runDailyTriggers = async () => {
      console.log('[triggers] Running daily server-side trigger evaluation...');
      try {
        const rules = await prisma.triggerRule.findMany({
          where: { isActive: true, triggerType: { in: ['inactivity', 'feature_unused', 'page_never_visited'] } },
          include: { flow: { select: { id: true, name: true, flowType: true, organizationId: true } } },
        });
        console.log(`[triggers] Evaluating ${rules.length} server-side rules`);
        // Per-rule evaluation is handled on-demand via /evaluate at widget init.
        // This cron is a hook for future push notifications (Phase 3).
      } catch (e) {
        console.error('[triggers] daily evaluation error:', e);
      }
    };
    setTimeout(() => {
      runDailyTriggers();
      setInterval(runDailyTriggers, DAILY_MS);
    }, 5 * 60 * 1000); // 5 min after startup

    // ── Proactive messaging cron ────────────────────────────────────────────
    // Runs daily at startup + 24h interval.
    const PROACTIVE_INTERVAL_MS = 24 * 60 * 60 * 1000;
    setTimeout(() => {
      runProactiveMessaging().catch((e) => console.error('[proactive] cron error:', e));
      setInterval(() => {
        runProactiveMessaging().catch((e) => console.error('[proactive] cron error:', e));
      }, PROACTIVE_INTERVAL_MS);
    }, 10 * 60 * 1000); // 10 min after startup

    // ── KB auto-refresh cron ────────────────────────────────────────────────
    // Re-crawls URL sources older than 24 h. Runs every 6 h; first run 60 s after boot.
    const KB_CRON_MS = 6 * 60 * 60 * 1000;
    setTimeout(() => {
      runKbRefresh().catch((e) => console.error('[kb-refresh] startup run error:', e));
      setInterval(() => {
        runKbRefresh().catch((e) => console.error('[kb-refresh] cron error:', e));
      }, KB_CRON_MS);
    }, 60_000);

    // ── Session abandonment sweeper ─────────────────────────────────────────
    // Marks sessions inactive for >30 min as abandoned. Runs every 5 minutes.
    const ABANDON_THRESHOLD_MS = 30 * 60 * 1000; // 30 min
    const ABANDON_INTERVAL_MS  = 5 * 60 * 1000;  // 5 min

    const sweepAbandonedSessions = async () => {
      const cutoff = new Date(Date.now() - ABANDON_THRESHOLD_MS);
      try {
        const stale = await prisma.userOnboardingSession.findMany({
          where: { status: 'active', lastActiveAt: { lt: cutoff } },
          select: { id: true, currentStepId: true },
          take: 200,
        });
        if (stale.length === 0) return;

        const sessionIds = stale.map((s) => s.id);

        await prisma.userOnboardingSession.updateMany({
          where: { id: { in: sessionIds } },
          data: { status: 'abandoned' },
        });

        for (const s of stale) {
          if (!s.currentStepId) continue;
          await prisma.userStepProgress.updateMany({
            where: { sessionId: s.id, stepId: s.currentStepId, status: 'in_progress' },
            data: { outcome: 'dropped', dropReason: 'idle_timeout' },
          });
        }

        console.log(`[sweeper] Marked ${stale.length} sessions abandoned`);
      } catch (e) {
        console.error('[sweeper] abandonment sweep error:', e);
      }
    };

    setInterval(() => {
      sweepAbandonedSessions();
    }, ABANDON_INTERVAL_MS);
  }
});

export default app;
