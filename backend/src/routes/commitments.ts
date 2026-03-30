import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { emailCommitmentReceived, emailCommitmentAccepted, emailCommitmentRejected } from '../lib/email';

const router = Router();
const prisma = new PrismaClient();

// POST /commitments — farmer commits to a demand
router.post('/', authenticate, requireRole('farmer'), async (req: AuthRequest, res: Response) => {
  const { demandId, committedQuantity, commitmentType } = req.body;

  if (!demandId || !committedQuantity) {
    res.status(400).json({ error: 'demandId and committedQuantity are required' });
    return;
  }

  const farmer = await prisma.farmer.findUnique({ where: { userId: req.user!.id } });
  if (!farmer) { res.status(404).json({ error: 'Farmer profile not found' }); return; }

  const demand = await prisma.demand.findUnique({
    where: { id: parseInt(demandId) },
    include: { crop: { include: { guidance: true } } },
  });
  if (!demand) { res.status(404).json({ error: 'Demand not found' }); return; }
  if (demand.status === 'closed') { res.status(400).json({ error: 'Demand is closed' }); return; }

  // Check farmer hasn't already committed to this demand
  const existing = await prisma.commitment.findFirst({
    where: { farmerId: farmer.id, demandId: demand.id, status: { not: 'cancelled' } },
  });
  if (existing) { res.status(409).json({ error: 'You already have an active commitment for this demand' }); return; }

  const commitment = await prisma.commitment.create({
    data: {
      farmerId: farmer.id,
      demandId: demand.id,
      committedQuantity: parseFloat(committedQuantity),
      commitmentType: commitmentType || (parseFloat(committedQuantity) >= demand.quantity ? 'full' : 'partial'),
    },
    include: {
      demand: { include: { crop: { include: { guidance: true } }, buyer: { include: { user: { select: { name: true, email: true } } } } } },
    },
  });

  // Log to audit trail
  await prisma.auditLog.create({
    data: {
      userId: req.user!.id,
      action: 'CREATE_COMMITMENT',
      details: `Farmer committed ${committedQuantity}kg to demand #${demandId}`,
    },
  });

  // Email buyer
  const buyer = commitment.demand.buyer;
  emailCommitmentReceived({
    buyerEmail: buyer.user.email,
    buyerName:  buyer.user.name,
    farmerName: req.user!.name,
    cropName:   commitment.demand.crop.cropName,
    quantity:   commitment.committedQuantity,
    totalPrice: commitment.committedQuantity * commitment.demand.pricePerUnit,
  });

  res.status(201).json({
    commitment,
    guidance: demand.crop.guidance,
  });
});

// GET /commitments — farmer sees their own, buyer sees commitments on their demands
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { role, id: userId } = req.user!;

  if (role === 'farmer') {
    const farmer = await prisma.farmer.findUnique({ where: { userId } });
    if (!farmer) { res.status(404).json({ error: 'Farmer not found' }); return; }
    const commitments = await prisma.commitment.findMany({
      where: { farmerId: farmer.id },
      include: { demand: { include: { crop: true, buyer: { include: { user: { select: { name: true } } } } } } },
      orderBy: { committedAt: 'desc' },
    });
    res.json(commitments);
    return;
  }

  if (role === 'buyer') {
    const buyer = await prisma.buyer.findUnique({ where: { userId } });
    if (!buyer) { res.status(404).json({ error: 'Buyer not found' }); return; }
    const commitments = await prisma.commitment.findMany({
      where: { demand: { buyerId: buyer.id } },
      include: {
        farmer: { include: { user: { select: { name: true } } } },
        demand: { include: { crop: true } },
      },
      orderBy: { committedAt: 'desc' },
    });
    res.json(commitments);
    return;
  }

  if (role === 'admin') {
    const commitments = await prisma.commitment.findMany({
      include: {
        farmer: { include: { user: { select: { name: true } } } },
        demand: { include: { crop: true, buyer: { include: { user: { select: { name: true } } } } } },
      },
      orderBy: { committedAt: 'desc' },
    });
    res.json(commitments);
    return;
  }

  res.status(403).json({ error: 'Access denied' });
});

// PATCH /commitments/:id/status — buyer accepts/rejects
router.patch('/:id/status', authenticate, requireRole('buyer', 'admin'), async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  if (!['accepted', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'status must be accepted or rejected' });
    return;
  }

  const commitment = await prisma.commitment.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      demand: { include: { crop: true, buyer: { include: { user: true } } } },
      farmer: { include: { user: true } },
    },
  });
  if (!commitment) { res.status(404).json({ error: 'Commitment not found' }); return; }

  if (req.user!.role === 'buyer') {
    const buyer = await prisma.buyer.findUnique({ where: { userId: req.user!.id } });
    if (!buyer) { res.status(401).json({ error: 'Session expired. Please log in again.' }); return; }
    if (commitment.demand.buyerId !== buyer.id) {
      res.status(403).json({ error: 'Not your demand' }); return;
    }
  }

  const updated = await prisma.commitment.update({
    where: { id: commitment.id },
    data: { status },
  });

  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: 'UPDATE_COMMITMENT', details: `Commitment #${commitment.id} set to ${status}` },
  });

  // Email farmer
  const farmerUser = commitment.farmer.user;
  if (status === 'accepted') {
    emailCommitmentAccepted({
      farmerEmail: farmerUser.email,
      farmerName:  farmerUser.name,
      buyerName:   commitment.demand.buyer.user.name,
      cropName:    commitment.demand.crop.cropName,
      quantity:    commitment.committedQuantity,
      totalPrice:  commitment.committedQuantity * commitment.demand.pricePerUnit,
    });
  } else if (status === 'rejected') {
    emailCommitmentRejected({
      farmerEmail: farmerUser.email,
      farmerName:  farmerUser.name,
      buyerName:   commitment.demand.buyer.user.name,
      cropName:    commitment.demand.crop.cropName,
    });
  }

  res.json(updated);
});

// PATCH /commitments/:id/cancel — farmer cancels their own commitment
router.patch('/:id/cancel', authenticate, requireRole('farmer'), async (req: AuthRequest, res: Response) => {
  const farmer = await prisma.farmer.findUnique({ where: { userId: req.user!.id } });
  const commitment = await prisma.commitment.findUnique({ where: { id: parseInt(req.params.id) } });

  if (!commitment) { res.status(404).json({ error: 'Commitment not found' }); return; }
  if (commitment.farmerId !== farmer?.id) { res.status(403).json({ error: 'Not your commitment' }); return; }
  if (commitment.status === 'accepted') { res.status(400).json({ error: 'Cannot cancel an accepted commitment' }); return; }

  const updated = await prisma.commitment.update({
    where: { id: commitment.id },
    data: { status: 'cancelled' },
  });

  res.json(updated);
});

// PATCH /commitments/:id/delivery — update delivery status
// Transitions: pending → in_transit (farmer only), in_transit → delivered (either party), delivered → completed (buyer confirms)
router.patch('/:id/delivery', authenticate, async (req: AuthRequest, res: Response) => {
  const { deliveryStatus } = req.body;
  const validStatuses = ['in_transit', 'delivered', 'completed'];

  if (!deliveryStatus || !validStatuses.includes(deliveryStatus)) {
    res.status(400).json({ error: 'deliveryStatus must be one of: in_transit, delivered, completed' });
    return;
  }

  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    const commitment = await prisma.commitment.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        farmer: { include: { user: true } },
        demand: { include: { buyer: { include: { user: true } } } },
      },
    });

    if (!commitment) { res.status(404).json({ error: 'Commitment not found' }); return; }

    const farmerUserId = commitment.farmer.user.id;
    const buyerUserId = commitment.demand.buyer.user.id;

    if (userId !== farmerUserId && userId !== buyerUserId) {
      res.status(403).json({ error: 'Not a party to this commitment' }); return;
    }

    const current = commitment.deliveryStatus;

    // Validate transitions
    if (deliveryStatus === 'in_transit') {
      if (current !== 'pending') {
        res.status(400).json({ error: `Cannot transition from '${current}' to 'in_transit'` }); return;
      }
      if (role !== 'farmer') {
        res.status(403).json({ error: 'Only the farmer can mark a commitment as in_transit' }); return;
      }
    } else if (deliveryStatus === 'delivered') {
      if (current !== 'in_transit') {
        res.status(400).json({ error: `Cannot transition from '${current}' to 'delivered'` }); return;
      }
    } else if (deliveryStatus === 'completed') {
      if (current !== 'delivered') {
        res.status(400).json({ error: `Cannot transition from '${current}' to 'completed'` }); return;
      }
      if (role !== 'buyer') {
        res.status(403).json({ error: 'Only the buyer can confirm completion' }); return;
      }
    }

    const updated = await prisma.commitment.update({
      where: { id: commitment.id },
      data: { deliveryStatus },
    });

    // Notify the other party
    const recipientUserId = userId === farmerUserId ? buyerUserId : farmerUserId;
    const statusLabels: Record<string, string> = {
      in_transit: 'In Transit',
      delivered: 'Delivered',
      completed: 'Completed',
    };

    await prisma.notification.create({
      data: {
        userId: recipientUserId,
        type: 'delivery_update',
        title: `Delivery status updated: ${statusLabels[deliveryStatus]}`,
        body: `Commitment #${commitment.id} delivery status changed to ${statusLabels[deliveryStatus]}.`,
        link: `/commitments/${commitment.id}`,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_DELIVERY_STATUS',
        details: `Commitment #${commitment.id} delivery status: ${current} → ${deliveryStatus}`,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('[Commitments] PATCH delivery error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
