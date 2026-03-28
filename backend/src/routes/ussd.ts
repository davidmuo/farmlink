import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /ussd — Africa's Talking / standard USSD gateway format
// Body: sessionId, serviceCode, phoneNumber, text (cumulative, *-separated)
router.post('/', async (req: Request, res: Response) => {
  res.set('Content-Type', 'text/plain');

  const { phoneNumber, text = '' } = req.body as {
    sessionId?: string;
    serviceCode?: string;
    phoneNumber: string;
    text?: string;
  };

  const user = await prisma.user.findFirst({
    where: { phone: phoneNumber, role: 'farmer' },
    include: { farmer: true },
  });

  if (!user?.farmer) {
    return res.send('END You are not registered as a FarmLink farmer.\nVisit farmlink.ng to sign up.');
  }

  const crops: string[] = user.farmer.cropsGrown ? JSON.parse(user.farmer.cropsGrown) : [];
  const parts = text === '' ? [] : text.split('*');

  const MAIN = `CON Welcome to FarmLink
${user.name}
${user.farmer.farmLocation}

1. Matching Demands
2. My Commitments
3. My Profile
0. Exit`;

  if (parts.length === 0) return res.send(MAIN);

  const L0 = parts[0];

  if (L0 === '0') return res.send('END Thank you for using FarmLink!\nDial *384*1# anytime.');

  // ── 1: Matching demands ──────────────────────────────────
  if (L0 === '1') {
    const demands = await prisma.demand.findMany({
      where: { status: { in: ['open', 'partially_filled'] }, crop: { cropName: { in: crops } } },
      include: {
        crop: true,
        buyer: true,
        commitments: { select: { committedQuantity: true, status: true } },
      },
      take: 6,
    });

    const remaining = (d: typeof demands[0]) =>
      d.quantity -
      d.commitments
        .filter(c => !['cancelled', 'rejected'].includes(c.status))
        .reduce((s, c) => s + c.committedQuantity, 0);

    if (parts.length === 1) {
      if (!demands.length) {
        return res.send(`CON No matching demands found.
Your crops: ${crops.join(', ')}
0. Back`);
      }
      const list = demands
        .map((d, i) => `${i + 1}. ${d.crop.cropName} ${remaining(d).toFixed(0)}kg @N${d.pricePerUnit}/kg`)
        .join('\n');
      return res.send(`CON MATCHING DEMANDS (${demands.length})\n${list}\n0. Back`);
    }

    if (parts[1] === '0') return res.send(MAIN);

    const dIdx = parseInt(parts[1]) - 1;
    const d = demands[dIdx];
    if (!d) return res.send('END Invalid selection. Dial *384*1# to retry.');

    const rem = remaining(d);
    const deliverBy = new Date(d.deliveryEnd).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

    if (parts.length === 2) {
      return res.send(`CON ${d.crop.cropName}
Buyer: ${d.buyer.businessName}
Price: N${d.pricePerUnit}/kg
Available: ${rem.toFixed(0)}kg
Quality: ${d.qualityStandard}
Deliver by: ${deliverBy}

1. Commit full ${rem.toFixed(0)}kg
2. Commit custom amount
0. Back`);
    }

    if (parts[2] === '0') {
      const list = demands.map((dd, i) => `${i + 1}. ${dd.crop.cropName} ${remaining(dd).toFixed(0)}kg @N${dd.pricePerUnit}/kg`).join('\n');
      return res.send(`CON MATCHING DEMANDS (${demands.length})\n${list}\n0. Back`);
    }

    const alreadyCommitted = async () =>
      !!(await prisma.commitment.findFirst({
        where: { farmerId: user.farmer!.id, demandId: d.id, status: { notIn: ['cancelled', 'rejected'] } },
      }));

    const createCommitment = async (qty: number, type: 'full' | 'partial') => {
      await prisma.commitment.create({
        data: { farmerId: user.farmer!.id, demandId: d.id, committedQuantity: qty, commitmentType: type, status: 'pending' },
      });
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE_COMMITMENT',
          details: `USSD: Committed ${qty}kg ${d.crop.cropName} to ${d.buyer.businessName}`,
        },
      });
    };

    if (parts[2] === '1') {
      if (parts.length === 3) {
        return res.send(`CON Confirm full commitment:
${d.crop.cropName} ${rem.toFixed(0)}kg
Buyer: ${d.buyer.businessName}
Value: N${(rem * d.pricePerUnit).toLocaleString()}

1. Confirm & Submit
0. Cancel`);
      }
      if (parts[3] === '1') {
        if (await alreadyCommitted()) return res.send('END You already have an active commitment for this demand.\nFarmLink');
        await createCommitment(rem, rem >= d.quantity ? 'full' : 'partial');
        return res.send(`END Commitment submitted!
${d.crop.cropName} ${rem.toFixed(0)}kg
Buyer: ${d.buyer.businessName}
Value: N${(rem * d.pricePerUnit).toLocaleString()}

Buyer will be notified.
FarmLink - Connecting Farmers`);
      }
      return res.send('END Cancelled.\nFarmLink');
    }

    if (parts[2] === '2') {
      if (parts.length === 3) {
        return res.send(`CON Enter quantity to commit (kg):
Available: ${rem.toFixed(0)}kg
Type number, then press Send`);
      }
      const qty = parseFloat(parts[3]);
      if (isNaN(qty) || qty <= 0) return res.send('END Invalid quantity.\nDial *384*1# to retry.\nFarmLink');
      if (qty > rem) return res.send(`END Exceeds available ${rem.toFixed(0)}kg.\nFarmLink`);

      if (parts.length === 4) {
        return res.send(`CON Confirm commitment:
${d.crop.cropName} ${qty}kg
Buyer: ${d.buyer.businessName}
Value: N${(qty * d.pricePerUnit).toLocaleString()}

1. Confirm & Submit
0. Cancel`);
      }
      if (parts[4] === '1') {
        if (await alreadyCommitted()) return res.send('END Already committed to this demand.\nFarmLink');
        await createCommitment(qty, 'partial');
        return res.send(`END Commitment submitted!
${d.crop.cropName} ${qty}kg
Buyer: ${d.buyer.businessName}
Value: N${(qty * d.pricePerUnit).toLocaleString()}

FarmLink - Connecting Farmers`);
      }
      return res.send('END Cancelled.\nFarmLink');
    }
  }

  // ── 2: My commitments ────────────────────────────────────
  if (L0 === '2') {
    const commitments = await prisma.commitment.findMany({
      where: { farmerId: user.farmer.id },
      include: { demand: { include: { crop: true, buyer: true } } },
      orderBy: { committedAt: 'desc' },
      take: 5,
    });

    if (parts.length === 1) {
      if (!commitments.length) {
        return res.send(`CON No commitments yet.
Select 1 to browse matching demands.
0. Back`);
      }
      const icon: Record<string, string> = { pending: 'WAIT', accepted: 'OK', rejected: 'X', cancelled: '-' };
      const list = commitments
        .map((c, i) => `${i + 1}. ${c.demand?.crop?.cropName} ${c.committedQuantity}kg [${icon[c.status] || c.status}]`)
        .join('\n');
      return res.send(`CON MY COMMITMENTS (${commitments.length})\n${list}\n0. Back`);
    }

    if (parts[1] === '0') return res.send(MAIN);

    const cIdx = parseInt(parts[1]) - 1;
    const c = commitments[cIdx];
    if (!c) return res.send('END Invalid selection.\nFarmLink');

    const val = c.committedQuantity * (c.demand?.pricePerUnit || 0);
    const dt = new Date(c.committedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
    return res.send(`END COMMITMENT DETAIL
Crop: ${c.demand?.crop?.cropName}
Qty: ${c.committedQuantity}kg
Buyer: ${c.demand?.buyer?.businessName}
Value: N${val.toLocaleString()}
Status: ${c.status.toUpperCase()}
Date: ${dt}

FarmLink - Lagos, Nigeria`);
  }

  // ── 3: Profile ───────────────────────────────────────────
  if (L0 === '3') {
    return res.send(`END MY PROFILE
Name: ${user.name}
Phone: ${user.phone}
Location: ${user.farmer.farmLocation}
Farm: ${user.farmer.farmSize} ha
Crops: ${crops.join(', ')}

FarmLink - Lagos, Nigeria`);
  }

  return res.send('END Invalid option.\nDial *384*1# to start again.');
});

export default router;
