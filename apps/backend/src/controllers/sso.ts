import { Router, Request, Response } from 'express';
import { WorkOS } from '@workos-inc/node';
import { prisma } from '../utils/prisma';
import { signToken } from '../utils/jwt';
import { authenticateJWT } from '../middleware/auth';
import { PLANS } from '../utils/plans';
import { AuthenticatedRequest } from '../types';

const router = Router();

function getWorkOS(): WorkOS {
  const key = process.env.WORKOS_API_KEY;
  if (!key) throw new Error('WORKOS_API_KEY not configured');
  return new WorkOS(key);
}

function redirectUri(): string {
  return process.env.WORKOS_REDIRECT_URI
    ?? `${process.env.BACKEND_URL ?? 'http://localhost:4000'}/api/v1/auth/sso/callback`;
}

function requireSsoPlan(org: { planType: string }): string | null {
  const plan = PLANS[org.planType] ?? PLANS.free;
  if (!plan.gates.sso) return 'SSO requires the Scale plan. Upgrade to enable single sign-on.';
  return null;
}

// GET /api/v1/auth/sso/connection
router.get('/connection', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const org = await prisma.organization.findUnique({
    where: { id: req.user!.organizationId },
    select: { ssoWorkosOrgId: true, planType: true },
  });
  if (!org) { res.status(404).json({ error: 'Organization not found' }); return; }
  if (!org.ssoWorkosOrgId) { res.json({ configured: false }); return; }

  try {
    const wos = getWorkOS();
    const wosOrg = await wos.organizations.getOrganization(org.ssoWorkosOrgId);
    res.json({ configured: true, workosOrgId: wosOrg.id, name: wosOrg.name });
  } catch {
    res.json({ configured: false, stale: true });
  }
});

// POST /api/v1/auth/sso/admin-portal
// Returns a WorkOS Admin Portal URL so the org admin can configure their IdP.
router.post('/admin-portal', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const org = await prisma.organization.findUnique({
    where: { id: req.user!.organizationId },
    select: { id: true, name: true, planType: true, ssoWorkosOrgId: true },
  });
  if (!org) { res.status(404).json({ error: 'Organization not found' }); return; }

  const planErr = requireSsoPlan(org);
  if (planErr) { res.status(403).json({ error: planErr, code: 'PLAN_FEATURE_LOCKED' }); return; }

  const wos = getWorkOS();

  let workosOrgId = org.ssoWorkosOrgId;
  if (!workosOrgId) {
    const wosOrg = await wos.organizations.createOrganization({ name: org.name });
    workosOrgId = wosOrg.id;
    await prisma.organization.update({ where: { id: org.id }, data: { ssoWorkosOrgId: workosOrgId } });
  }

  const returnUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/settings/sso`;
  const { link } = await wos.adminPortal.generateLink({ organization: workosOrgId, intent: 'sso', returnUrl });
  res.json({ url: link });
});

// DELETE /api/v1/auth/sso/connection
router.delete('/connection', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const org = await prisma.organization.findUnique({
    where: { id: req.user!.organizationId },
    select: { id: true },
  });
  if (!org) { res.status(404).json({ error: 'Organization not found' }); return; }
  await prisma.organization.update({ where: { id: org.id }, data: { ssoWorkosOrgId: null } });
  res.json({ ok: true });
});

// GET /api/v1/auth/sso/authorize?email=user@company.com
// Returns the WorkOS auth URL to redirect the user to for SSO login.
router.get('/authorize', async (req: Request, res: Response) => {
  const email = req.query.email as string | undefined;
  if (!email) { res.status(400).json({ error: 'email required' }); return; }

  const org = await prisma.organization.findFirst({
    where: { ssoWorkosOrgId: { not: null } },
    select: { ssoWorkosOrgId: true },
  });
  if (!org?.ssoWorkosOrgId) {
    res.status(404).json({ error: 'No SSO connection found for this email domain' });
    return;
  }

  const wos = getWorkOS();
  const clientId = process.env.WORKOS_CLIENT_ID;
  if (!clientId) { res.status(503).json({ error: 'WORKOS_CLIENT_ID not configured' }); return; }

  const url = wos.sso.getAuthorizationUrl({
    organization: org.ssoWorkosOrgId,
    redirectUri: redirectUri(),
    clientId,
    state: email,
  });
  res.json({ url });
});

// GET /api/v1/auth/sso/callback?code=...
// WorkOS redirects here after successful IdP authentication.
router.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  if (!code) { res.redirect(`${frontendUrl}/login?error=sso_no_code`); return; }

  const clientId = process.env.WORKOS_CLIENT_ID;
  if (!clientId) { res.redirect(`${frontendUrl}/login?error=sso_misconfigured`); return; }

  let profileAndToken: Awaited<ReturnType<WorkOS['sso']['getProfileAndToken']>>;
  try {
    const wos = getWorkOS();
    profileAndToken = await wos.sso.getProfileAndToken({ code, clientId });
  } catch (err) {
    console.error('[sso] callback error:', err);
    res.redirect(`${frontendUrl}/login?error=sso_failed`);
    return;
  }

  const { email, firstName, lastName, organizationId: wosOrgId } = profileAndToken.profile;

  const org = wosOrgId
    ? await prisma.organization.findFirst({ where: { ssoWorkosOrgId: wosOrgId }, select: { id: true } })
    : null;

  if (!org) { res.redirect(`${frontendUrl}/login?error=sso_org_not_found`); return; }

  let user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, organizationId: true, role: true },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        organizationId: org.id,
        email,
        passwordHash: '',
        name: [firstName, lastName].filter(Boolean).join(' ') || email,
        role: 'member',
      },
      select: { id: true, organizationId: true, role: true },
    });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const token = signToken({ userId: user.id, organizationId: user.organizationId, role: user.role });
  res.redirect(`${frontendUrl}/sso-complete?token=${token}`);
});

export default router;
