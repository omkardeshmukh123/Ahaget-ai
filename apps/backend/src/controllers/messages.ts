import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authenticateApiKey } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

const MessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

router.post('/', authenticateApiKey, async (req: AuthenticatedRequest, res: Response) => {
  const body = MessageSchema.parse(req.body);

  const conv = await prisma.conversation.findFirst({
    where: { id: body.conversationId, organizationId: req.organization!.id },
  });

  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const message = await prisma.message.create({
    data: { conversationId: conv.id, role: 'user', content: body.content },
  });

  res.json({ messageId: message.id });
});

export default router;
