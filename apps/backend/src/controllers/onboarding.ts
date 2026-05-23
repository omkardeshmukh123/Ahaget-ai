import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticateJWT } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { generateApiKey } from '../utils/apiKey';

const router = Router();

// --- GET /api/v1/onboarding/status ------------------------------------------
// Returns a checklist of 5 onboarding steps for the org (legacy dashboard widget).
router.get('/status', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;

  const [org, eventCount, conversationCount] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.event.count({ where: { organizationId: orgId } }),
    prisma.conversation.count({ where: { organizationId: orgId } }),
  ]);

  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }

  const steps = [
    {
      id: 'account_created',
      label: 'Create your account',
      description: "You're signed in and your org is set up.",
      done: true,
    },
    {
      id: 'widget_installed',
      label: 'Install the widget',
      description: 'Paste the embed snippet before </body> in your app.',
      done: eventCount > 0,
    },
    {
      id: 'first_conversation',
      label: 'See your first conversation',
      description: 'Wait for a user to idle 30s — the AI will kick in.',
      done: conversationCount > 0,
    },
    {
      id: 'ai_customized',
      label: 'Customize the AI',
      description: 'Add custom instructions so the AI knows your product.',
      done: !!org.customInstructions,
    },
    {
      id: 'upgraded',
      label: 'Upgrade to a paid plan',
      description: 'Unlock more conversations and priority support.',
      done: org.planType !== 'free',
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  res.json({
    steps,
    completedCount,
    totalCount: steps.length,
    allDone: completedCount === steps.length,
  });
});

// --- PATCH /api/v1/onboarding/wizard ----------------------------------------
// Upserts wizard state: { websiteUrl?, attribution?, step? }
const WizardSchema = z.object({
  websiteUrl: z.string().optional(),
  attribution: z.enum(['ai_search', 'google', 'linkedin', 'word_of_mouth', 'other']).optional(),
  step: z.string().optional(),
}).strict();

router.patch('/wizard', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const body = WizardSchema.parse(req.body);

  // Normalise websiteUrl ? hostname only
  let websiteUrl = body.websiteUrl;
  if (websiteUrl) {
    try {
      const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
      websiteUrl = new URL(url).hostname;
    } catch {
      // leave as-is — will be caught by validation if truly invalid
    }
  }

  const org = await prisma.organization.update({
    where: { id: orgId },
    data: {
      ...(websiteUrl !== undefined && { websiteUrl }),
      ...(body.attribution !== undefined && { attribution: body.attribution }),
      ...(body.step !== undefined && { onboardingStep: body.step }),
    },
    select: {
      id: true,
      websiteUrl: true,
      attribution: true,
      onboardingStep: true,
      onboardingComplete: true,
    },
  });

  res.json({ org });
});

// --- POST /api/v1/onboarding/workspace --------------------------------------
// Saves description as customInstructions, creates default flow, marks onboarding in-progress.
const WorkspaceSchema = z.object({
  description: z.string().min(1, 'Description is required'),
});

router.post('/workspace', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;
  const body = WorkspaceSchema.parse(req.body);

  const [org] = await prisma.$transaction([
    prisma.organization.update({
      where: { id: orgId },
      data: {
        customInstructions: body.description,
        onboardingStep: 'install',
      },
      select: { id: true, name: true, apiKey: true },
    }),
  ]);

  // Create a default onboarding flow if none exists
  const existingFlows = await prisma.onboardingFlow.count({ where: { organizationId: orgId } });
  if (existingFlows === 0) {
    await prisma.onboardingFlow.create({
      data: {
        organizationId: orgId,
        name: 'Default Onboarding',
        description: body.description,
        isActive: true,
      },
    });
  }

  res.json({ workspace: org });
});

// --- GET /api/v1/onboarding/snippet -----------------------------------------
// Returns personalised embed snippet for the org.
router.get('/snippet', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { apiKey: true, websiteUrl: true },
  });

  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }

  const snippet = `<script>
  window.ahagetSettings = {
    app_id: "${org.apiKey}",
    user: {
      id: "USER_ID",       // replace with your user's ID
      name: "USER_NAME",   // optional
      email: "USER_EMAIL", // optional
    }
  };
</script>
<script async src="https://cdn.ahaget.ai/widget.js"></script>`;

  res.json({ snippet, apiKey: org.apiKey, domain: org.websiteUrl });
});

// --- GET /api/v1/onboarding/install-status -----------------------------------
// Checks if any event has been received from the org's domain (install detection).
router.get('/install-status', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;

  const eventCount = await prisma.event.count({ where: { organizationId: orgId } });
  const installed = eventCount > 0;

  if (installed) {
    // Mark onboarding complete
    await prisma.organization.update({
      where: { id: orgId },
      data: { onboardingComplete: true, onboardingStep: 'done' },
    });
  }

  res.json({ installed, eventCount });
});

// --- POST /api/v1/onboarding/complete ----------------------------------------
// Skip installation — mark onboarding complete.
router.post('/complete', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;

  await prisma.organization.update({
    where: { id: orgId },
    data: { onboardingComplete: true, onboardingStep: 'done' },
  });

  res.json({ done: true });
});

// --- GET /api/v1/onboarding/wizard-state -------------------------------------
// Returns current wizard state so the frontend can redirect to the right step.
router.get('/wizard-state', authenticateJWT, async (req: AuthenticatedRequest, res: Response) => {
  const orgId = req.user!.organizationId;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      websiteUrl: true,
      attribution: true,
      onboardingStep: true,
      onboardingComplete: true,
      customInstructions: true,
      apiKey: true,
    },
  });

  if (!org) {
    res.status(404).json({ error: 'Organization not found' });
    return;
  }

  res.json({ wizardState: org });
});

export default router;
