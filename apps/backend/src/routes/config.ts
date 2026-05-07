import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { generateApiKey } from '../lib/apiKey';
import { authenticateJWT } from '../middleware/auth';
import { requireFeature } from '../middleware/planGate';
import { AuthenticatedRequest } from '../types';

const router = Router();

const AIConfigSchema = z.object({
  customInstructions: z.string().max(2000).optional(),
});

// ─── PUT /api/v1/config/ai ───────────────────────────────────────────────────
router.put('/ai', authenticateJWT, requireFeature('guardrails'), async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const body = AIConfigSchema.parse(req.body);

  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: { customInstructions: body.customInstructions ?? null },
    select: { id: true, customInstructions: true },
  });

  res.json({ updated: true, customInstructions: org.customInstructions });
});

// ─── GET /api/v1/config ──────────────────────────────────────────────────────
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, apiKey: true, planType: true, customInstructions: true },
  });

  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }

  res.json(org);
});

// ─── GET /api/v1/config/alerts ───────────────────────────────────────────────
router.get('/alerts', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { selectorAlertEnabled: true, selectorAlertWebhook: true },
  });
  res.json({
    selectorAlertEnabled: org?.selectorAlertEnabled ?? false,
    selectorAlertWebhook: org?.selectorAlertWebhook ?? null,
  });
});

const AlertConfigSchema = z.object({
  selectorAlertEnabled: z.boolean().optional(),
  selectorAlertWebhook: z.string().url().nullable().optional(),
});

// ─── PUT /api/v1/config/alerts ────────────────────────────────────────────────
router.put('/alerts', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const body = AlertConfigSchema.parse(req.body);
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...(body.selectorAlertEnabled !== undefined && { selectorAlertEnabled: body.selectorAlertEnabled }),
      ...(body.selectorAlertWebhook !== undefined && { selectorAlertWebhook: body.selectorAlertWebhook }),
    },
  });
  res.json({ saved: true });
});

// ─── GET /api/v1/config/playbook ─────────────────────────────────────────────
router.get('/playbook', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const config = await prisma.playbookConfig.findUnique({
    where: { organizationId: req.user!.organizationId },
  });
  res.json({
    config: config ?? {
      agentName: 'AI Assistant',
      tone: 'friendly',
      language: 'en',
      mustAlwaysDo: [],
      mustNeverDo: [],
      escalateOnUserRequest: true,
      escalateOnRepeatedFail: true,
      escalateOnBillingTopics: false,
      escalationWebhook: null,
    },
  });
});

const PlaybookSchema = z.object({
  agentName: z.string().min(1).max(60).optional(),
  tone: z.enum(['friendly', 'formal', 'concise', 'custom']).optional(),
  language: z.string().max(10).optional(),
  mustAlwaysDo: z.array(z.string().max(200)).max(20).optional(),
  mustNeverDo: z.array(z.string().max(200)).max(20).optional(),
  escalateOnUserRequest: z.boolean().optional(),
  escalateOnRepeatedFail: z.boolean().optional(),
  escalateOnBillingTopics: z.boolean().optional(),
  escalationWebhook: z.string().url().nullable().optional(),
});

// ─── PUT /api/v1/config/playbook ──────────────────────────────────────────────
router.put('/playbook', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const data = PlaybookSchema.parse(req.body);
  const orgId = req.user!.organizationId;
  const config = await prisma.playbookConfig.upsert({
    where: { organizationId: orgId },
    update: data,
    create: { organizationId: orgId, ...data },
  });
  res.json({ config });
});

// ─── POST /api/v1/config/rotate-key ─────────────────────────────────────────
// Generates a new API key (old one stops working immediately)
router.post('/rotate-key', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId, role } = req.user!;

  if (role !== 'owner' && role !== 'admin') {
    res.status(403).json({ error: 'Only owners and admins can rotate API keys' });
    return;
  }

  const newKey = generateApiKey();
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: { apiKey: newKey },
    select: { apiKey: true },
  });

  res.json({ apiKey: org.apiKey });
});

export default router;
