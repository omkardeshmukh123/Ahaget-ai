import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { generateApiKey } from '../utils/apiKey';
import { authenticateJWT, invalidateApiKeyCache } from '../middleware/auth';
import { verifyToken } from '../utils/jwt';
import { PLANS } from '../utils/plans';
import { AuthenticatedRequest } from '../types';

const router = Router();

const AIConfigSchema = z.object({
  customInstructions: z.string().max(2000).optional(),
});

// --- PUT /api/v1/config/ai ---------------------------------------------------
router.put('/ai', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId } = req.user!;
  const body = AIConfigSchema.parse(req.body);

  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: { customInstructions: body.customInstructions ?? null },
    select: { id: true, customInstructions: true },
  });

  res.json({ updated: true, customInstructions: org.customInstructions });
});

// --- GET /api/v1/config ------------------------------------------------------
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

// --- GET /api/v1/config/alerts -----------------------------------------------
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

// --- PUT /api/v1/config/alerts ------------------------------------------------
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

// --- GET /api/v1/config/playbook ---------------------------------------------
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

// --- PUT /api/v1/config/playbook ----------------------------------------------
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

// ─── Branding defaults ────────────────────────────────────────────────────────
const BRANDING_DEFAULTS = {
  primaryColor: '#6366f1',
  gradFrom:     '#6366f1',
  gradTo:       '#8b5cf6',
  position:     'bottom-right',
  idleThreshold: 30000,
};

const BrandingSchema = z.object({
  primaryColor:  z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  gradFrom:      z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  gradTo:        z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  position:      z.enum(['bottom-right', 'bottom-left']).optional(),
  idleThreshold: z.number().int().min(0).max(300_000).optional(),
});

// --- GET /api/v1/config/branding ---------------------------------------------
// Accepts JWT (dashboard) or X-API-Key (widget). Returns defaults if no row yet.
router.get('/branding', async (req: AuthenticatedRequest, res: Response) => {
  let orgId: string | undefined;

  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(authHeader.replace('Bearer ', ''));
      orgId = req.user.organizationId;
    } catch { /* fall through */ }
  }

  if (!orgId && apiKey) {
    const org = await prisma.organization.findUnique({ where: { apiKey }, select: { id: true } });
    if (org) orgId = org.id;
  }

  if (!orgId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const [row, org] = await Promise.all([
    prisma.brandingConfig.findUnique({ where: { organizationId: orgId } }),
    prisma.organization.findUnique({ where: { id: orgId }, select: { planType: true } }),
  ]);
  const plan = PLANS[org?.planType ?? 'free'] ?? PLANS.free;
  res.json({ ...(row ?? BRANDING_DEFAULTS), whiteLabel: plan.gates.whiteLabel });
});

// --- PUT /api/v1/config/branding ---------------------------------------------
router.put('/branding', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const data  = BrandingSchema.parse(req.body);

  const row = await prisma.brandingConfig.upsert({
    where:  { organizationId: orgId },
    update: data,
    create: { organizationId: orgId, ...BRANDING_DEFAULTS, ...data },
  });
  res.json(row);
});

// --- POST /api/v1/config/rotate-key -----------------------------------------
// Generates a new API key (old one stops working immediately)
router.post('/rotate-key', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const { organizationId, role } = req.user!;

  if (role !== 'owner' && role !== 'admin') {
    res.status(403).json({ error: 'Only owners and admins can rotate API keys' });
    return;
  }

  const current = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { apiKey: true },
  });

  const newKey = generateApiKey();
  const org = await prisma.organization.update({
    where: { id: organizationId },
    data: { apiKey: newKey },
    select: { apiKey: true },
  });

  // Evict old key from cache so it stops working immediately
  await invalidateApiKeyCache(current.apiKey);

  res.json({ apiKey: org.apiKey });
});

export default router;
