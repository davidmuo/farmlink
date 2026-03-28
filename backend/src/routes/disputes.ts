import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /disputes — farmer or buyer raises a dispute on a commitment
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { commitmentId, reason } = req.body;
  if (!commitmentId || !reason?.trim()) {
    res.status(400).json({ error: 'commitmentId and reason are required' });
    return;
  }

  // Verify the user is a party to this commitment
  const commitment = await prisma.commitment.findUnique({
    where: { id: parseInt(commitmentId) },
    include: {
      farmer: { include: { user: true } },
      demand:  { include: { buyer: { include: { user: true } } } },
    },
  });

  if (!commitment) {
    res.status(404).json({ error: 'Commitment not found' });
    return;
  }

  const isParty =
    commitment.farmer.user.id === req.user!.id ||
    commitment.demand.buyer.user.id === req.user!.id;

  if (!isParty) {
    res.status(403).json({ error: 'Not a party to this commitment' });
    return;
  }

  // Prevent duplicate open disputes
  const existing = await prisma.dispute.findFirst({
    where: { commitmentId: parseInt(commitmentId), raisedById: req.user!.id, status: 'open' },
  });
  if (existing) {
    res.status(409).json({ error: 'You already have an open dispute for this commitment' });
    return;
  }

  const dispute = await prisma.dispute.create({
    data: {
      commitmentId: parseInt(commitmentId),
      raisedById: req.user!.id,
      reason: reason.trim(),
    },
    include: {
      raisedBy: { select: { id: true, name: true, role: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'RAISE_DISPUTE',
      details: `Dispute raised on commitment #${commitmentId}: ${reason.trim().slice(0, 80)}`,
    },
  });

  res.status(201).json(dispute);
});

// GET /disputes — admin sees all; parties see their own
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user!.role === 'admin';

  const disputes = await prisma.dispute.findMany({
    where: isAdmin ? {} : { raisedById: req.user!.id },
    include: {
      raisedBy: { select: { id: true, name: true, role: true } },
      commitment: {
        include: {
          farmer: { include: { user: { select: { id: true, name: true } } } },
          demand:  { include: { crop: { select: { cropName: true } }, buyer: { include: { user: { select: { id: true, name: true } } } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(disputes);
});

// PATCH /disputes/:id/resolve — admin resolves or dismisses
router.patch('/:id/resolve', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { action, resolution } = req.body; // action: "resolved" | "dismissed"
  if (!['resolved', 'dismissed'].includes(action)) {
    res.status(400).json({ error: 'action must be "resolved" or "dismissed"' });
    return;
  }

  const dispute = await prisma.dispute.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!dispute) {
    res.status(404).json({ error: 'Dispute not found' });
    return;
  }
  if (dispute.status !== 'open') {
    res.status(409).json({ error: 'Dispute is already closed' });
    return;
  }

  const updated = await prisma.dispute.update({
    where: { id: dispute.id },
    data: {
      status: action,
      resolution: resolution?.trim() || null,
      resolvedAt: new Date(),
    },
    include: {
      raisedBy: { select: { id: true, name: true, role: true } },
    },
  });

  // Notify the person who raised the dispute
  await prisma.notification.create({
    data: {
      userId: dispute.raisedById,
      type: 'delivery_update',
      title: `Your dispute has been ${action}`,
      body: resolution?.trim() || `An admin has ${action} your dispute on commitment #${dispute.commitmentId}.`,
      link: '/farmer/commitments',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'RESOLVE_DISPUTE',
      details: `Dispute #${dispute.id} marked as ${action}. Resolution: ${resolution?.slice(0, 80) || 'none'}`,
    },
  });

  res.json(updated);
});

export default router;
