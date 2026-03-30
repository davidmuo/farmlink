import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { sendSms } from '../services/sms';

const router = Router();
const prisma = new PrismaClient();

async function processIncomingSms(from: string, text: string): Promise<string> {
  const raw = text.trim().toUpperCase().replace(/\s+/g, ' ');

  const user = await prisma.user.findFirst({
    where: { phone: from, role: 'farmer' },
    include: { farmer: true },
  });

  if (!user?.farmer) {
    return 'You are not registered as a FarmLink farmer. Visit farmlink.ng to sign up.';
  }

  if (raw === 'STATUS' || raw === 'MYORDERS') {
    const commitments = await prisma.commitment.findMany({
      where: { farmerId: user.farmer.id, status: { notIn: ['cancelled'] } },
      include: { demand: { include: { crop: true, buyer: true } } },
      orderBy: { committedAt: 'desc' },
      take: 5,
    });
    if (!commitments.length) {
      return `FarmLink: You have no active commitments. Dial *384*1# to browse demands. - FarmLink`;
    }
    const lines = commitments.map(c =>
      `FL${c.demandId}: ${c.demand?.crop?.cropName} ${c.committedQuantity}kg [${c.status.toUpperCase()}]`
    ).join(', ');
    return `FarmLink: Your commitments: ${lines}. Dial *384*1# for details.`;
  }

  const acceptMatch = raw.match(/^ACCEPT\s+FL(\d+)(?:\s+(\d+(?:\.\d+)?))?$/);
  if (acceptMatch) {
    const demandId = parseInt(acceptMatch[1]);
    const customQty = acceptMatch[2] ? parseFloat(acceptMatch[2]) : null;

    const demand = await prisma.demand.findUnique({
      where: { id: demandId },
      include: {
        crop: true,
        buyer: true,
        commitments: { select: { committedQuantity: true, status: true } },
      },
    });

    if (!demand) return `FarmLink: Demand FL${demandId} not found. Check the code and try again.`;
    if (!['open', 'partially_filled'].includes(demand.status)) {
      return `FarmLink: Demand FL${demandId} is no longer accepting offers.`;
    }

    const existing = await prisma.commitment.findFirst({
      where: { farmerId: user.farmer.id, demandId, status: { notIn: ['cancelled', 'rejected'] } },
    });
    if (existing) {
      return `FarmLink: You already committed to FL${demandId}. Reply STATUS to see your orders.`;
    }

    const alreadyCommitted = demand.commitments
      .filter(c => !['cancelled', 'rejected'].includes(c.status))
      .reduce((s, c) => s + c.committedQuantity, 0);
    const remaining = demand.quantity - alreadyCommitted;

    if (remaining <= 0) return `FarmLink: FL${demandId} is fully committed. Try another demand.`;

    const qty = customQty ? Math.min(customQty, remaining) : remaining;
    if (qty <= 0) return `FarmLink: Invalid quantity. Only ${remaining}kg available on FL${demandId}.`;

    const commitment = await prisma.commitment.create({
      data: {
        farmerId:         user.farmer.id,
        demandId,
        committedQuantity: qty,
        commitmentType:   qty >= remaining ? 'full' : 'partial',
        status:           'pending',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId:  user.id,
        action:  'CREATE_COMMITMENT',
        details: `SMS: ${user.name} committed ${qty}kg ${demand.crop.cropName} to ${demand.buyer.businessName}`,
      },
    });

    await prisma.smsLog.create({
      data: {
        direction:   'inbound',
        phoneNumber: from,
        farmerName:  user.name,
        message:     text,
        demandId,
        status:      'processed',
      },
    });

    const value = qty * demand.pricePerUnit;
    return (
      `FarmLink: Committed! ${qty}kg ${demand.crop.cropName} to ${demand.buyer.businessName}. ` +
      `Value: N${value.toLocaleString()}. ` +
      `Buyer will review and respond. Reply CANCEL FL${demandId} to withdraw. - FarmLink`
    );
  }

  const cancelMatch = raw.match(/^CANCEL\s+FL(\d+)$/);
  if (cancelMatch) {
    const demandId = parseInt(cancelMatch[1]);
    const commitment = await prisma.commitment.findFirst({
      where: { farmerId: user.farmer.id, demandId, status: { notIn: ['cancelled', 'rejected', 'accepted'] } },
      include: { demand: { include: { crop: true } } },
    });
    if (!commitment) {
      return `FarmLink: No cancellable commitment found for FL${demandId}.`;
    }
    await prisma.commitment.update({ where: { id: commitment.id }, data: { status: 'cancelled' } });
    await prisma.smsLog.create({
      data: { direction: 'inbound', phoneNumber: from, farmerName: user.name, message: text, demandId, status: 'processed' },
    });
    return `FarmLink: Commitment for FL${demandId} (${commitment.demand?.crop?.cropName}) cancelled. - FarmLink`;
  }

  return (
    `FarmLink SMS Help:\n` +
    `ACCEPT FL{id} - commit full amount\n` +
    `ACCEPT FL{id} 200 - commit 200kg\n` +
    `CANCEL FL{id} - cancel commitment\n` +
    `STATUS - view your commitments\n` +
    `Dial *384*1# for full menu`
  );
}

router.post('/incoming', async (req: Request, res: Response) => {
  const { from, text } = req.body as { from: string; to?: string; text: string };
  if (!from || !text) { res.sendStatus(400); return; }

  const reply = await processIncomingSms(from, text);

  res.set('Content-Type', 'text/plain');
  res.send(reply);

  await sendSms({ to: from, message: reply }).catch(() => {});
});

router.post('/simulate', authenticate, async (req: AuthRequest, res: Response) => {
  const { text } = req.body as { text: string };
  if (!text) { res.status(400).json({ error: 'text required' }); return; }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user?.phone) { res.status(400).json({ error: 'No phone number on account' }); return; }

  const reply = await processIncomingSms(user.phone, text);

  await prisma.smsLog.create({
    data: { direction: 'inbound', phoneNumber: user.phone, farmerName: user.name, message: text, status: 'processed' },
  }).catch(() => {});

  res.json({ reply });
});

router.get('/logs', authenticate, requireRole('admin'), async (_req: Request, res: Response) => {
  const logs = await prisma.smsLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(logs);
});

router.get('/inbox', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user?.phone) { res.json([]); return; }

  const logs = await prisma.smsLog.findMany({
    where: { phoneNumber: user.phone },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(logs);
});

export default router;
