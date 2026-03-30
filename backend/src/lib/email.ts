import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'FarmLink <onboarding@resend.dev>';

async function send(to: string, subject: string, html: string) {
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err: any) {
    console.error('[Email] Failed to send:', err?.message);
  }
}

export async function emailCommitmentReceived(opts: {
  buyerEmail: string; buyerName: string;
  farmerName: string; cropName: string;
  quantity: number; totalPrice: number;
}) {
  await send(
    opts.buyerEmail,
    `New commitment from ${opts.farmerName} — FarmLink`,
    `<p>Hi ${opts.buyerName},</p>
     <p><strong>${opts.farmerName}</strong> has committed to supply <strong>${opts.quantity} kg of ${opts.cropName}</strong> for <strong>₦${opts.totalPrice.toLocaleString()}</strong>.</p>
     <p>Log in to FarmLink to review and accept or reject this commitment.</p>
     <p style="color:#999;font-size:12px;">FarmLink — Fresh Produce Marketplace</p>`,
  );
}

export async function emailCommitmentAccepted(opts: {
  farmerEmail: string; farmerName: string;
  buyerName: string; cropName: string;
  quantity: number; totalPrice: number;
}) {
  await send(
    opts.farmerEmail,
    `Your commitment was accepted — FarmLink`,
    `<p>Hi ${opts.farmerName},</p>
     <p><strong>${opts.buyerName}</strong> has <strong>accepted</strong> your commitment to supply <strong>${opts.quantity} kg of ${opts.cropName}</strong> for <strong>₦${opts.totalPrice.toLocaleString()}</strong>.</p>
     <p>Log in to FarmLink to view the details.</p>
     <p style="color:#999;font-size:12px;">FarmLink — Fresh Produce Marketplace</p>`,
  );
}

export async function emailCommitmentRejected(opts: {
  farmerEmail: string; farmerName: string;
  buyerName: string; cropName: string;
}) {
  await send(
    opts.farmerEmail,
    `Your commitment was declined — FarmLink`,
    `<p>Hi ${opts.farmerName},</p>
     <p><strong>${opts.buyerName}</strong> has declined your commitment to supply <strong>${opts.cropName}</strong>.</p>
     <p>Browse other open demands on FarmLink to find new opportunities.</p>
     <p style="color:#999;font-size:12px;">FarmLink — Fresh Produce Marketplace</p>`,
  );
}

export async function emailDisputeRaised(opts: {
  adminEmail: string;
  raisedByName: string; cropName: string; reason: string;
}) {
  await send(
    opts.adminEmail,
    `Dispute raised — FarmLink`,
    `<p>A dispute has been raised by <strong>${opts.raisedByName}</strong> on a <strong>${opts.cropName}</strong> commitment.</p>
     <p><strong>Reason:</strong> ${opts.reason}</p>
     <p>Log in to the admin panel to review and resolve this dispute.</p>
     <p style="color:#999;font-size:12px;">FarmLink — Fresh Produce Marketplace</p>`,
  );
}

export async function emailDisputeResolved(opts: {
  raisedByEmail: string; raisedByName: string;
  status: string; resolution?: string;
}) {
  await send(
    opts.raisedByEmail,
    `Your dispute has been ${opts.status} — FarmLink`,
    `<p>Hi ${opts.raisedByName},</p>
     <p>Your dispute has been <strong>${opts.status}</strong> by the FarmLink team.</p>
     ${opts.resolution ? `<p><strong>Resolution note:</strong> ${opts.resolution}</p>` : ''}
     <p>Log in to FarmLink for more details.</p>
     <p style="color:#999;font-size:12px;">FarmLink — Fresh Produce Marketplace</p>`,
  );
}
