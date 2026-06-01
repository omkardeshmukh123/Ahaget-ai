import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth';

// Stub routes for planned features — return sensible empty responses so the
// dashboard never crashes with 404 while these features are being built.

// ── /api/v1/followup ──────────────────────────────────────────────────────────
export const followupRoutes = Router();
followupRoutes.use(authenticateJWT);
followupRoutes.get('/config', (_req, res) => {
  res.json({
    enabled: false,
    delayHours: 24,
    maxFollowups: 3,
    template: null,
  });
});
followupRoutes.put('/config', (_req, res) => {
  res.json({ saved: false, message: 'Follow-up configuration coming soon.' });
});

// ── /api/v1/churn ─────────────────────────────────────────────────────────────
export const churnRoutes = Router();
churnRoutes.use(authenticateJWT);
churnRoutes.get('/at-risk', (_req, res) => {
  res.json({ users: [], total: 0 });
});
churnRoutes.get('/summary', (_req, res) => {
  res.json({ atRiskCount: 0, averageScore: 0, trend: 'stable' });
});

// ── /api/v1/autooptimize ──────────────────────────────────────────────────────
export const autooptimizeRoutes = Router();
autooptimizeRoutes.use(authenticateJWT);
autooptimizeRoutes.get('/settings', (_req, res) => {
  res.json({ enabled: false, threshold: 0.6, minSessions: 50 });
});
autooptimizeRoutes.put('/settings', (_req, res) => {
  res.json({ enabled: false, threshold: 0.6, minSessions: 50 });
});
autooptimizeRoutes.post('/run', (_req, res) => {
  res.status(501).json({ message: 'Auto-optimize not yet available.' });
});
autooptimizeRoutes.get('/log', (_req, res) => {
  res.json({ logs: [], total: 0 });
});

// ── /api/v1/benchmarks ───────────────────────────────────────────────────────
export const benchmarksRoutes = Router();
benchmarksRoutes.use(authenticateJWT);
benchmarksRoutes.get('/overview', (_req, res) => {
  res.json({ completionRate: null, avgSteps: null, p50DurationMs: null, p90DurationMs: null });
});
benchmarksRoutes.get('/steps', (_req, res) => {
  res.json({ flowName: null, steps: [] });
});

// ── /api/v1/optimize ─────────────────────────────────────────────────────────
export const optimizeRoutes = Router();
optimizeRoutes.use(authenticateJWT);
optimizeRoutes.get('/flow', (_req, res) => {
  res.json({ flowId: null, flowName: null, steps: [] });
});
optimizeRoutes.post('/suggest/:stepId', (_req, res) => {
  res.status(501).json({ message: 'AI optimization suggestions coming soon.' });
});
optimizeRoutes.post('/apply/:stepId', (_req, res) => {
  res.status(501).json({ applied: false, message: 'AI optimization not yet available.' });
});

// ── /api/v1/experiments ──────────────────────────────────────────────────────
export const experimentsRoutes = Router();
experimentsRoutes.use(authenticateJWT);
experimentsRoutes.get('/', (_req, res) => {
  res.json({ experiments: [] });
});
experimentsRoutes.post('/', (_req, res) => {
  res.status(501).json({ message: 'A/B experiments coming soon.' });
});
experimentsRoutes.get('/:id/results', (_req, res) => {
  res.status(404).json({ message: 'Experiment not found.' });
});
experimentsRoutes.put('/:id', (_req, res) => {
  res.status(501).json({ message: 'A/B experiments coming soon.' });
});
