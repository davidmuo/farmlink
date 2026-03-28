/**
 * FarmLink SMS Service — Africa's Talking integration
 *
 * In MOCK MODE (no AT credentials): messages are saved to SmsLog table only.
 * In LIVE MODE (AT_API_KEY + AT_USERNAME set): messages sent via Africa's Talking
 * and also saved to SmsLog.
 *
 * To go live:
 *   1. Sign up at africastalking.com
 *   2. Add AT_USERNAME and AT_API_KEY to backend/.env
 *   3. Register a sender ID "FarmLink" or use your short code
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MOCK_MODE = !process.env.AT_API_KEY || !process.env.AT_USERNAME;

// Lazy-init Africa's Talking SDK only when credentials exist
let atSms: any = null;
if (!MOCK_MODE) {
  const AT = require('africastalking')({
    apiKey:   process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
  });
  atSms = AT.SMS;
}

if (MOCK_MODE) {
  console.log('[SMS] Running in MOCK mode — set AT_API_KEY + AT_USERNAME in .env to enable real SMS');
}

interface SendOptions {
  to: string;              // phone number e.g. "+2348030002001"
  farmerName?: string;
  message: string;
  demandId?: number;
}

/**
 * Send an SMS (or mock it). Always returns a SmsLog id.
 */
export async function sendSms(opts: SendOptions): Promise<void> {
  const log = await prisma.smsLog.create({
    data: {
      direction:   'outbound',
      phoneNumber: opts.to,
      farmerName:  opts.farmerName,
      message:     opts.message,
      demandId:    opts.demandId,
      status:      MOCK_MODE ? 'sent' : 'queued',
    },
  });

  if (MOCK_MODE) return; // done — stored in DB

  try {
    await atSms.send({
      to:      [opts.to],
      message: opts.message,
      from:    process.env.AT_SENDER_ID || 'FarmLink',
    });
    await prisma.smsLog.update({ where: { id: log.id }, data: { status: 'sent' } });
  } catch (err: any) {
    await prisma.smsLog.update({ where: { id: log.id }, data: { status: 'failed' } });
    console.error('[SMS] Send failed:', err?.message);
  }
}

/**
 * Build and send demand alert to all matching farmers.
 */
export async function notifyMatchingFarmers(demandId: number): Promise<void> {
  const demand = await prisma.demand.findUnique({
    where: { id: demandId },
    include: { crop: true, buyer: true },
  });
  if (!demand) return;

  // Find farmers who grow this crop
  const farmers = await prisma.farmer.findMany({
    include: { user: true },
  });

  const matching = farmers.filter(f => {
    try {
      const crops: string[] = JSON.parse(f.cropsGrown);
      return crops.includes(demand.crop.cropName);
    } catch { return false; }
  });

  if (!matching.length) return;

  const deliverBy = new Date(demand.deliveryEnd).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  for (const farmer of matching) {
    if (!farmer.user.phone) continue;

    const msg =
      `FarmLink Alert: ${demand.buyer.businessName} needs ` +
      `${demand.quantity.toLocaleString()}kg ${demand.crop.cropName} ` +
      `@N${demand.pricePerUnit}/kg. ` +
      `Deliver by ${deliverBy}. ` +
      `Reply ACCEPT FL${demand.id} (full) or ACCEPT FL${demand.id} 200 (custom kg). ` +
      `Dial *384*1# for details.`;

    await sendSms({
      to:         farmer.user.phone,
      farmerName: farmer.user.name,
      message:    msg,
      demandId:   demand.id,
    });
  }

  console.log(`[SMS] Notified ${matching.length} farmer(s) about demand #${demandId} (${demand.crop.cropName})`);
}
