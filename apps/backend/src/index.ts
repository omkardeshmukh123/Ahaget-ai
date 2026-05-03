import 'dotenv/config';
import 'express-async-errors';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth';
import conversationsRoutes from './routes/conversations';
import eventsRoutes from './routes/events';
import analyticsRoutes from './routes/analytics';
import configRoutes from './routes/config';
import billingRoutes, { stripeWebhookHandler } from './routes/billing';
import onboardingRoutes from './routes/onboarding';
import adminRoutes from './routes/admin';
import checklistRoutes from './routes/checklist';
import flowRoutes from './routes/flow';
import sessionRoutes from './routes/session';
import activationRoutes from './routes/activation';
import kbRoutes from './routes/kb';
import usersRoutes from './routes/users';
import escalationsRoutes from './routes/escalations';
import failuresRoutes from './routes/failures';
import sessionsRoutes from './routes/sessions';
import mcpRoutes from './routes/mcp';
import contactRoutes from './routes/contact';
import triggersRoutes from './routes/triggers';
import proactiveRoutes from './routes/proactive';
import expansionRoutes from './routes/expansion';
import { prisma } from './lib/prisma';
import { errorHandler } from './middleware/errorHandler';
import { attachWebSocketServer } from './lib/websocket';
import { checkFlowAlerts } from './services/alerting';
import { runProactiveMessaging } from './services/proactive';

// ─── Startup env validation ───────────────────────────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const OPTIONAL_ENV = ['OPENAI_API_KEY'];
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

app.use(express.json({ limit: '10kb' }));
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
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/triggers', triggersRoutes);
app.use('/api/v1/proactive', proactiveRoutes);
app.use('/api/v1/expansion', expansionRoutes);

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

  // ── Flow alert scheduler ─────────────────────────────────────────────────
  // Run once 2 minutes after startup, then every hour.
  const ALERT_INTERVAL_MS = 60 * 60 * 1000; // 1 h
  setTimeout(() => {
    checkFlowAlerts().catch((e) => console.error('[alerting] uncaught error:', e));
    setInterval(() => {
      checkFlowAlerts().catch((e) => console.error('[alerting] uncaught error:', e));
    }, ALERT_INTERVAL_MS);
  }, 2 * 60 * 1000);

  // ── Daily trigger evaluator ───────────────────────────────────────────────
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

  // ── Proactive messaging cron ──────────────────────────────────────────────
  // Runs daily at startup + 24h interval.
  // Identifies users who qualify for proactive outreach and sends in-app + email.
  const PROACTIVE_INTERVAL_MS = 24 * 60 * 60 * 1000;
  setTimeout(() => {
    runProactiveMessaging().catch((e) => console.error('[proactive] cron error:', e));
    setInterval(() => {
      runProactiveMessaging().catch((e) => console.error('[proactive] cron error:', e));
    }, PROACTIVE_INTERVAL_MS);
  }, 10 * 60 * 1000); // 10 min after startup
});

export default app;
