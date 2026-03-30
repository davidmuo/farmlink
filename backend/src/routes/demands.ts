import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { notifyMatchingFarmers } from '../services/sms';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: AuthRequest, res: Response) => {
  const { crop, minPrice, maxPrice, status, mine, deliveryFrom, deliveryTo } = req.query;

  let buyerId: number | undefined;
  if (mine === 'true') {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const payload = jwt.default.verify(authHeader.split(' ')[1], process.env.JWT_SECRET!) as { id: number; role: string };
        if (payload.role === 'buyer') {
          const buyer = await prisma.buyer.findUnique({ where: { userId: payload.id } });
          buyerId = buyer?.id;
        }
      } catch {}
    }
  }

  const statusFilter = status && status !== 'all' ? String(status) : mine === 'true' ? undefined : 'open';

  const demands = await prisma.demand.findMany({
    where: {
      ...(buyerId !== undefined ? { buyerId } : {}),
      ...(crop ? { crop: { cropName: { contains: String(crop) } } } : {}),
      ...(minPrice ? { pricePerUnit: { gte: parseFloat(String(minPrice)) } } : {}),
      ...(maxPrice ? { pricePerUnit: { lte: parseFloat(String(maxPrice)) } } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(deliveryFrom ? { deliveryEnd: { gte: new Date(String(deliveryFrom)) } } : {}),
      ...(deliveryTo   ? { deliveryStart: { lte: new Date(String(deliveryTo)) } } : {}),
    },
    include: {
      crop: true,
      buyer: { include: { user: { select: { name: true } } } },
      commitments: { select: { id: true, committedQuantity: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(demands);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const demand = await prisma.demand.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      crop: { include: { guidance: true } },
      buyer: { include: { user: { select: { name: true } } } },
      commitments: {
        include: { farmer: { include: { user: { select: { id: true, name: true } } } } },
        orderBy: { committedAt: 'desc' },
      },
    },
  });
  if (!demand) { res.status(404).json({ error: 'Demand not found' }); return; }
  res.json(demand);
});

router.post('/', authenticate, requireRole('buyer'), async (req: AuthRequest, res: Response) => {
  const { cropId, quantity, pricePerUnit, qualityStandard, deliveryStart, deliveryEnd, notes, isRecurring, recurrenceNote } = req.body;

  if (!cropId || !quantity || !pricePerUnit || !deliveryStart || !deliveryEnd) {
    res.status(400).json({ error: 'cropId, quantity, pricePerUnit, deliveryStart, deliveryEnd are required' });
    return;
  }

  const buyer = await prisma.buyer.findUnique({ where: { userId: req.user!.id } });
  if (!buyer) { res.status(404).json({ error: 'Buyer profile not found' }); return; }

  const demand = await prisma.demand.create({
    data: {
      buyerId: buyer.id,
      cropId: parseInt(cropId),
      quantity: parseFloat(quantity),
      pricePerUnit: parseFloat(pricePerUnit),
      qualityStandard: qualityStandard || 'Standard',
      deliveryStart: new Date(deliveryStart),
      deliveryEnd: new Date(deliveryEnd),
      notes,
      isRecurring: isRecurring === true || isRecurring === 'true',
      recurrenceNote: recurrenceNote || null,
    },
    include: { crop: true, buyer: { include: { user: { select: { name: true } } } } },
  });

  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: 'CREATE_DEMAND', details: `Posted demand for ${demand.crop.cropName} (${demand.quantity}kg @ ₦${demand.pricePerUnit}/kg)` },
  });

  notifyMatchingFarmers(demand.id).catch(err => console.error(err));

  (async () => {
    try {
      const cropName = demand.crop.cropName;
      const buyerBusinessName = demand.buyer.user.name;
      const deliveryEndStr = demand.deliveryEnd.toISOString().slice(0, 10);

      const farmers = await prisma.farmer.findMany({
        include: { user: true },
      });

      const matchingFarmers = farmers.filter(f => {
        try {
          const crops: string[] = JSON.parse(f.cropsGrown);
          return crops.some(c => c.toLowerCase() === cropName.toLowerCase());
        } catch {
          return false;
        }
      });

      if (matchingFarmers.length > 0) {
        await prisma.notification.createMany({
          data: matchingFarmers.map(f => ({
            userId: f.user.id,
            type: 'crop_match',
            title: `New demand for ${cropName}`,
            body: `${buyerBusinessName} needs ${demand.quantity}kg at ₦${demand.pricePerUnit}/kg. Deadline: ${deliveryEndStr}`,
            link: `/farmer/demands/${demand.id}`,
          })),
        });
      }
    } catch (err) {
      console.error(err);
    }
  })();

  res.status(201).json(demand);
});

router.patch('/:id', authenticate, requireRole('buyer', 'admin'), async (req: AuthRequest, res: Response) => {
  const buyer = await prisma.buyer.findUnique({ where: { userId: req.user!.id } });
  const demand = await prisma.demand.findUnique({ where: { id: parseInt(req.params.id) } });

  if (!demand) { res.status(404).json({ error: 'Demand not found' }); return; }
  if (req.user!.role !== 'admin' && demand.buyerId !== buyer?.id) {
    res.status(403).json({ error: 'Not your demand' }); return;
  }

  const { quantity, pricePerUnit, qualityStandard, deliveryStart, deliveryEnd, status, notes } = req.body;

  const updated = await prisma.demand.update({
    where: { id: demand.id },
    data: {
      ...(quantity !== undefined && { quantity: parseFloat(quantity) }),
      ...(pricePerUnit !== undefined && { pricePerUnit: parseFloat(pricePerUnit) }),
      ...(qualityStandard !== undefined && { qualityStandard }),
      ...(deliveryStart !== undefined && { deliveryStart: new Date(deliveryStart) }),
      ...(deliveryEnd !== undefined && { deliveryEnd: new Date(deliveryEnd) }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
    },
    include: { crop: true },
  });

  res.json(updated);
});

router.delete('/:id', authenticate, requireRole('buyer', 'admin'), async (req: AuthRequest, res: Response) => {
  const buyer = await prisma.buyer.findUnique({ where: { userId: req.user!.id } });
  const demand = await prisma.demand.findUnique({ where: { id: parseInt(req.params.id) } });

  if (!demand) { res.status(404).json({ error: 'Demand not found' }); return; }
  if (req.user!.role !== 'admin' && demand.buyerId !== buyer?.id) {
    res.status(403).json({ error: 'Not your demand' }); return;
  }

  await prisma.demand.delete({ where: { id: demand.id } });
  res.json({ message: 'Demand deleted' });
});

export default router;
