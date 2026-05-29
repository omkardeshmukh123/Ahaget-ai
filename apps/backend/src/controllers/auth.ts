import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { signToken } from '../utils/jwt';
import { generateApiKey } from '../utils/apiKey';
import { sendWelcomeEmail, sendMagicLinkEmail } from '../utils/email';
import { redisSet, redisGet, redisDel, redisIncr, isRedisConfigured } from '../utils/redis';

const router = Router();

// --- Magic-link token store --------------------------------------------------
// Backed by Upstash Redis when configured; falls back to in-memory Map for
// local dev without Redis. Redis ensures tokens survive server restarts.
const _magicTokenFallback = new Map<string, { email: string; expiresAt: number }>();
const MAGIC_LINK_TTL_S = 15 * 60; // 15 minutes

async function storeMagicToken(token: string, email: string): Promise<void> {
  if (isRedisConfigured()) {
    await redisSet(`magic:${token}`, email, MAGIC_LINK_TTL_S);
  } else {
    // Redis not configured — use in-memory fallback
    _magicTokenFallback.set(token, { email, expiresAt: Date.now() + MAGIC_LINK_TTL_S * 1000 });
  }
}

async function consumeMagicToken(token: string): Promise<string | null> {
  const redisEmail = await redisGet(`magic:${token}`);
  if (redisEmail !== null) {
    await redisDel(`magic:${token}`);
    return redisEmail;
  }
  // Fallback to in-memory
  const entry = _magicTokenFallback.get(token);
  if (!entry) return null;
  _magicTokenFallback.delete(token);
  if (entry.expiresAt < Date.now()) return null;
  return entry.email;
}

// --- Login brute-force guard -------------------------------------------------
// 20 attempts per IP per 15-minute window.
// Redis-backed when configured; falls back to per-process Map.
const _loginFallback = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_S = 15 * 60;
const LOGIN_MAX_ATTEMPTS = 20;

async function checkLoginRateLimit(ip: string): Promise<boolean> {
  const key = `login:rl:${ip}`;
  const count = await redisIncr(key, LOGIN_WINDOW_S);
  if (count !== null) {
    return count <= LOGIN_MAX_ATTEMPTS;
  }
  // Fallback to in-memory
  const now = Date.now();
  const entry = _loginFallback.get(key);
  if (!entry || now >= entry.resetAt) {
    _loginFallback.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_S * 1000 });
    return true;
  }
  if (entry.count >= LOGIN_MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

// --- Schema validation ------------------------------------------------------

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

// --- POST /api/v1/auth/register ---------------------------------------------
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

// --- POST /api/v1/auth/login -------------------------------------------------
router.post('/login', async (req: Request, res: Response) => {
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown';
  if (!(await checkLoginRateLimit(ip))) {
    res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
    return;
  }

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

// --- POST /api/v1/auth/magic-link/send --------------------------------------
router.post('/magic-link/send', async (req: Request, res: Response) => {
  const { email } = MagicLinkSendSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const tokenStr = crypto.randomBytes(32).toString('hex');
    await storeMagicToken(tokenStr, email);

    const DASHBOARD_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const magicUrl = `${DASHBOARD_URL}/auth/magic-link/verify?token=${tokenStr}`;

    sendMagicLinkEmail({ to: email, magicUrl, name: user.name ?? email }).catch(
      (err) => console.error('[email] magic-link email failed:', err),
    );
  }

  res.json({ sent: true });
});

// --- GET /api/v1/auth/magic-link/verify -------------------------------------
router.get('/magic-link/verify', async (req: Request, res: Response) => {
  const tokenStr = req.query.token as string;
  if (!tokenStr) {
    res.status(400).json({ error: 'Token required' });
    return;
  }

  const email = await consumeMagicToken(tokenStr);
  if (!email) {
    res.status(401).json({ error: 'Invalid or expired magic link' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
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
