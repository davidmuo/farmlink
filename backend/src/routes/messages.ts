import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /messages/:commitmentId — get all messages for a commitment
router.get('/:commitmentId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const commitmentId = parseInt(req.params.commitmentId);
    const userId = req.user!.id;

    const commitment = await prisma.commitment.findUnique({
      where: { id: commitmentId },
      include: {
        farmer: { include: { user: true } },
        demand: { include: { buyer: { include: { user: true } } } },
      },
    });

    if (!commitment) {
      res.status(404).json({ error: 'Commitment not found' });
      return;
    }

    const farmerUserId = commitment.farmer.user.id;
    const buyerUserId = commitment.demand.buyer.user.id;

    if (userId !== farmerUserId && userId !== buyerUserId && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Access denied: not a party to this commitment' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { commitmentId },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(messages);
  } catch (err) {
    console.error('[Messages] GET error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /messages/:commitmentId — send a message
router.post('/:commitmentId', authenticate, async (req: AuthRequest, res: Response) => {
  const { content } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  try {
    const commitmentId = parseInt(req.params.commitmentId);
    const userId = req.user!.id;

    const commitment = await prisma.commitment.findUnique({
      where: { id: commitmentId },
      include: {
        farmer: { include: { user: true } },
        demand: { include: { buyer: { include: { user: true } } } },
      },
    });

    if (!commitment) {
      res.status(404).json({ error: 'Commitment not found' });
      return;
    }

    const farmerUserId = commitment.farmer.user.id;
    const buyerUserId = commitment.demand.buyer.user.id;

    if (userId !== farmerUserId && userId !== buyerUserId) {
      res.status(403).json({ error: 'Only the farmer or buyer of this commitment can send messages' });
      return;
    }

    const message = await prisma.message.create({
      data: {
        commitmentId,
        senderId: userId,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    // Notify the other party
    const recipientUserId = userId === farmerUserId ? buyerUserId : farmerUserId;
    const senderName = req.user!.role === 'farmer'
      ? commitment.farmer.user.name
      : commitment.demand.buyer.user.name;

    await prisma.notification.create({
      data: {
        userId: recipientUserId,
        type: 'new_message',
        title: `New message from ${senderName}`,
        body: content.trim().length > 100 ? content.trim().slice(0, 97) + '...' : content.trim(),
        link: `/commitments/${commitmentId}`,
      },
    });

    res.status(201).json(message);
  } catch (err) {
    console.error('[Messages] POST error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
