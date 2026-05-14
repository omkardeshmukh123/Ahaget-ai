import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { generateApiKey } from '../lib/apiKey';
import { sendWelcomeEmail, sendMagicLinkEmail } from '../lib/email';

const router = Router();

// ─── In-memory magic-link token store (TTL 15 minutes) ──────────────────────
// In production swap for Redis. Acceptable for MVP.
const magicTokenStore = new Map<string, { email: string; expiresAt: number }>();

// ─── Schema validation ──────────────────────────────────────────────────────

const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  orgName: z.string().min(1, 'Organization name is required'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const MagicLinkSendSchema = z.object({
  email: z.string().email(),
});

// ─── POST /api/v1/auth/register ─────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const body = RegisterSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const apiKey = generateApiKey();

  const { user, organization } = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: body.orgName, apiKey },
    });
    const user = await tx.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
        role: 'owner',
        organizationId: organization.id,
      },
    });
    return { user, organization };
  });

  const token = signToken({
    userId: user.id,
    organizationId: organization.id,
    role: user.role,
  });

  sendWelcomeEmail({ to: body.email, name: body.name, orgName: body.orgName, apiKey }).catch(
    (err) => console.error('[email] welcome email failed:', err),
  );

  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    organization: {
      id: organization.id,
      name: organization.name,
      apiKey: organization.apiKey,
      onboardingComplete: organization.onboardingComplete,
      onboardingStep: organization.onboardingStep,
    },
    requiresOnboarding: true,
  });
});

// ─── POST /api/v1/auth/login ─────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  let body: { email: string; password: string };
  try {
    body = LoginSchema.parse(req.body);
  } catch {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: body.email },
    include: { organization: true },
  });

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const passwordMatch = await bcrypt.compare(body.password, user.passwordHash);
  if (!passwordMatch) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const token = signToken({
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
  });

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    organization: {
      id: user.organization.id,
      name: user.organization.name,
      apiKey: user.organization.apiKey,
      planType: user.organization.planType,
      onboardingComplete: user.organization.onboardingComplete,
      onboardingStep: user.organization.onboardingStep,
    },
  });
});

// ─── POST /api/v1/auth/magic-link/send ──────────────────────────────────────
router.post('/magic-link/send', async (req: Request, res: Response) => {
  const { email } = MagicLinkSendSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const tokenStr = crypto.randomBytes(32).toString('hex');
    magicTokenStore.set(tokenStr, { email, expiresAt: Date.now() + 15 * 60 * 1000 });

    const DASHBOARD_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const magicUrl = `${DASHBOARD_URL}/auth/magic-link/verify?token=${tokenStr}`;

    sendMagicLinkEmail({ to: email, magicUrl, name: user.name ?? email }).catch(
      (err) => console.error('[email] magic-link email failed:', err),
    );
  }

  res.json({ sent: true });
});

// ─── GET /api/v1/auth/magic-link/verify ─────────────────────────────────────
router.get('/magic-link/verify', async (req: Request, res: Response) => {
  const tokenStr = req.query.token as string;
  if (!tokenStr) {
    res.status(400).json({ error: 'Token required' });
    return;
  }

  const entry = magicTokenStore.get(tokenStr);
  if (!entry || entry.expiresAt < Date.now()) {
    magicTokenStore.delete(tokenStr);
    res.status(401).json({ error: 'Invalid or expired magic link' });
    return;
  }

  magicTokenStore.delete(tokenStr);

  const user = await prisma.user.findUnique({
    where: { email: entry.email },
    include: { organization: true },
  });

  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const jwt = signToken({
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
  });

  res.json({
    token: jwt,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    organization: {
      id: user.organization.id,
      name: user.organization.name,
      apiKey: user.organization.apiKey,
      planType: user.organization.planType,
      onboardingComplete: user.organization.onboardingComplete,
      onboardingStep: user.organization.onboardingStep,
    },
  });
});

export default router;
