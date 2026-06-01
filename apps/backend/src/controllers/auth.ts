import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { signToken } from '../utils/jwt';
import { generateApiKey } from '../utils/apiKey';
import { sendWelcomeEmail, sendMagicLinkEmail, sendInviteEmail } from '../utils/email';
import { authenticateJWT } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
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
// 5 attempts per IP per 15-minute window.
// Redis-backed when configured; falls back to per-process Map.
const _loginFallback = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_S = 15 * 60;
const LOGIN_MAX_ATTEMPTS = 5;

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

// --- Magic-link rate limiters ------------------------------------------------
// Send: 3 requests per IP per 15-minute window (prevents email spam).
// Verify: 10 attempts per IP per 15-minute window (prevents token enumeration).
const _magicSendFallback = new Map<string, { count: number; resetAt: number }>();
const _magicVerifyFallback = new Map<string, { count: number; resetAt: number }>();
const MAGIC_WINDOW_S = 15 * 60;
const MAGIC_SEND_MAX = 3;
const MAGIC_VERIFY_MAX = 10;

async function checkMagicSendRateLimit(ip: string): Promise<boolean> {
  const key = `magic:send:rl:${ip}`;
  const count = await redisIncr(key, MAGIC_WINDOW_S);
  if (count !== null) return count <= MAGIC_SEND_MAX;
  const now = Date.now();
  const entry = _magicSendFallback.get(key);
  if (!entry || now >= entry.resetAt) {
    _magicSendFallback.set(key, { count: 1, resetAt: now + MAGIC_WINDOW_S * 1000 });
    return true;
  }
  if (entry.count >= MAGIC_SEND_MAX) return false;
  entry.count++;
  return true;
}

async function checkMagicVerifyRateLimit(ip: string): Promise<boolean> {
  const key = `magic:verify:rl:${ip}`;
  const count = await redisIncr(key, MAGIC_WINDOW_S);
  if (count !== null) return count <= MAGIC_VERIFY_MAX;
  const now = Date.now();
  const entry = _magicVerifyFallback.get(key);
  if (!entry || now >= entry.resetAt) {
    _magicVerifyFallback.set(key, { count: 1, resetAt: now + MAGIC_WINDOW_S * 1000 });
    return true;
  }
  if (entry.count >= MAGIC_VERIFY_MAX) return false;
  entry.count++;
  return true;
}

// --- Schema validation ------------------------------------------------------

const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  orgName: z.string().min(1, 'Organization name is required'),
  refCode: z.string().optional(), // optional referral code
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const MagicLinkSendSchema = z.object({
  email: z.string().email(),
});

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['member', 'admin']).optional().default('member'),
});

const AcceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
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

  // Generate unique referral code for this new org
  let newReferralCode: string | undefined;
  let attempts = 0;
  do {
    newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const exists = await prisma.organization.findUnique({ where: { referralCode: newReferralCode } });
    if (!exists) break;
    attempts++;
  } while (attempts < 10);

  // Validate referring org if refCode supplied
  let referringOrg: { id: string; referralCode: string } | null = null;
  if (body.refCode) {
    const found = await prisma.organization.findUnique({
      where:  { referralCode: body.refCode },
      select: { id: true, referralCode: true },
    });
    if (found?.referralCode) {
      referringOrg = { id: found.id, referralCode: found.referralCode };
    }
  }

  const { user, organization } = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: body.orgName,
        apiKey,
        referralCode: newReferralCode,
        referredByCode: referringOrg?.referralCode ?? null,
      },
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
    if (referringOrg) {
      await tx.referralConversion.create({
        data: {
          referringOrgId: referringOrg.id,
          referredOrgId:  organization.id,
          referralCode:   referringOrg.referralCode,
          status:         'pending',
        },
      });
    }
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
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown';
  if (!(await checkMagicSendRateLimit(ip))) {
    res.status(429).json({ error: 'Too many magic link requests. Please try again later.' });
    return;
  }

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
  const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.socket.remoteAddress ?? 'unknown';
  if (!(await checkMagicVerifyRateLimit(ip))) {
    res.status(429).json({ error: 'Too many verification attempts. Please try again later.' });
    return;
  }

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

const INVITE_TTL_DAYS = 7;

// --- POST /api/v1/auth/invite -----------------------------------------------
router.post('/invite', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  const { userId, organizationId, role: callerRole } = req.user!;
  if (callerRole !== 'owner' && callerRole !== 'admin') {
    res.status(403).json({ error: 'Only owners and admins can invite team members' });
    return;
  }

  const body = InviteSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing && existing.organizationId === organizationId) {
    res.status(409).json({ error: 'This email is already a member of your workspace' });
    return;
  }

  // Revoke any existing pending invite for this email+org
  await prisma.teamInvite.deleteMany({
    where: { organizationId, email: body.email, acceptedAt: null },
  });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.teamInvite.create({
    data: { organizationId, email: body.email, token, role: body.role, expiresAt },
  });

  const inviter = await prisma.user.findUnique({ where: { id: userId } });
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  const DASHBOARD_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  const inviteUrl = `${DASHBOARD_URL}/auth/accept-invite/${token}`;

  sendInviteEmail({
    to: body.email,
    inviterName: inviter?.name ?? inviter?.email ?? 'A teammate',
    orgName: org?.name ?? 'your team',
    inviteUrl,
  }).catch((err) => console.error('[email] invite email failed:', err));

  res.json({ sent: true });
});

// --- GET /api/v1/auth/invite/:token -----------------------------------------
router.get('/invite/:token', async (req, res) => {
  const invite = await prisma.teamInvite.findUnique({
    where: { token: req.params.token },
    include: { organization: { select: { name: true } } },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    res.status(404).json({ error: 'Invalid or expired invitation' });
    return;
  }

  res.json({ email: invite.email, orgName: invite.organization.name, role: invite.role });
});

// --- POST /api/v1/auth/accept-invite ----------------------------------------
router.post('/accept-invite', async (req, res) => {
  const body = AcceptInviteSchema.parse(req.body);

  const invite = await prisma.teamInvite.findUnique({
    where: { token: body.token },
    include: { organization: true },
  });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    res.status(400).json({ error: 'Invalid or expired invitation' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    return;
  }

  const passwordHash = await bcrypt.hash(body.password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: invite.email,
        name: body.name,
        passwordHash,
        role: invite.role,
        organizationId: invite.organizationId,
      },
    });
    await tx.teamInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    return newUser;
  });

  const jwtToken = signToken({
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
  });

  res.status(201).json({
    token: jwtToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    organization: {
      id: invite.organization.id,
      name: invite.organization.name,
      apiKey: invite.organization.apiKey,
      planType: invite.organization.planType,
      onboardingComplete: invite.organization.onboardingComplete,
      onboardingStep: invite.organization.onboardingStep,
    },
  });
});

// --- GET /api/v1/auth/team --------------------------------------------------
router.get('/team', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  const { organizationId } = req.user!;

  const [members, pendingInvites] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId },
      select: { id: true, email: true, name: true, role: true, createdAt: true, lastLoginAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.teamInvite.findMany({
      where: { organizationId, acceptedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, role: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  res.json({ members, pendingInvites });
});

// --- DELETE /api/v1/auth/team/:userId ----------------------------------------
router.delete('/team/:userId', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  const { userId: callerId, organizationId, role: callerRole } = req.user!;

  if (callerRole !== 'owner' && callerRole !== 'admin') {
    res.status(403).json({ error: 'Only owners and admins can remove team members' });
    return;
  }

  const { userId } = req.params;

  if (userId === callerId) {
    res.status(400).json({ error: 'You cannot remove yourself' });
    return;
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.organizationId !== organizationId) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (target.role === 'owner' && callerRole !== 'owner') {
    res.status(403).json({ error: 'Only the owner can remove another owner' });
    return;
  }

  await prisma.user.delete({ where: { id: userId } });
  res.json({ removed: true });
});

// --- DELETE /api/v1/auth/invite/:inviteId ------------------------------------
router.delete('/invite/:inviteId', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  const { organizationId, role: callerRole } = req.user!;

  if (callerRole !== 'owner' && callerRole !== 'admin') {
    res.status(403).json({ error: 'Only owners and admins can revoke invitations' });
    return;
  }

  const invite = await prisma.teamInvite.findUnique({ where: { id: req.params.inviteId } });
  if (!invite || invite.organizationId !== organizationId) {
    res.status(404).json({ error: 'Invitation not found' });
    return;
  }

  await prisma.teamInvite.delete({ where: { id: req.params.inviteId } });
  res.json({ revoked: true });
});

export default router;
