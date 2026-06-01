import { Router, Response } from 'express';
import { prisma } from '../utils/prisma';
import { authenticateJWT } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import crypto from 'crypto';

const router = Router();
router.use(authenticateJWT);

const REFERRAL_CREDIT_USD = 20;

function generateCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 chars, e.g. A3F2C1D9
}

// GET /api/v1/referral
// Returns the org's referral code (generates one if missing) and conversion stats.
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;

  let org = await prisma.organization.findUnique({
    where:  { id: orgId },
    select: { referralCode: true, name: true },
  });

  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }

  // Auto-generate code if not yet set
  if (!org.referralCode) {
    let code: string;
    let attempts = 0;
    do {
      code = generateCode();
      attempts++;
      const existing = await prisma.organization.findUnique({ where: { referralCode: code } });
      if (!existing) break;
    } while (attempts < 10);

    await prisma.organization.update({
      where: { id: orgId },
      data:  { referralCode: code! },
    });
    org = { ...org, referralCode: code! };
  }

  const conversions = await prisma.referralConversion.findMany({
    where:   { referringOrgId: orgId },
    select:  { status: true, creditUsd: true, createdAt: true, referredOrg: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const credited = conversions.filter((c) => c.status === 'credited');
  const totalCreditUsd = credited.reduce((s, c) => s + (c.creditUsd ?? REFERRAL_CREDIT_USD), 0);
  const appUrl = process.env.FRONTEND_URL ?? 'https://app.ahaget.ai';

  res.json({
    referralCode: org.referralCode,
    referralLink: `${appUrl}/register?ref=${org.referralCode}`,
    conversions: conversions.map((c) => ({
      referredOrgName: c.referredOrg.name,
      status:          c.status,
      creditUsd:       c.creditUsd,
      createdAt:       c.createdAt.toISOString(),
    })),
    stats: {
      total:          conversions.length,
      credited:       credited.length,
      pending:        conversions.filter((c) => c.status === 'pending').length,
      totalCreditUsd,
      creditPerReferral: REFERRAL_CREDIT_USD,
    },
  });
});

export default router;
