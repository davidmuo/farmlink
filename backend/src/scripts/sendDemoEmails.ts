import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'FarmLink <onboarding@resend.dev>';

const INBOX = 'millionairecookie1@gmail.com';

const send = async (to: string, subject: string, html: string) => {
  const r = await resend.emails.send({ from: FROM, to: INBOX, subject, html });
  console.log(`Sent "${subject}" → ${to} (routed to ${INBOX})`, r.error ?? 'ok');
};

const users = [
  { name: 'Emeka Adeyemi',  email: 'buyer@demo.com',   role: 'buyer'  },
  { name: 'Ngozi Okonkwo',  email: 'buyer2@demo.com',  role: 'buyer'  },
  { name: 'Dr. Segun Bello', email: 'buyer3@demo.com', role: 'buyer'  },
  { name: 'Folake Adesanya', email: 'buyer4@demo.com', role: 'buyer'  },
  { name: 'Emeka Okafor',   email: 'farmer@demo.com',  role: 'farmer' },
  { name: 'Amaka Nwosu',    email: 'farmer2@demo.com', role: 'farmer' },
  { name: 'Tunde Adeyemi',  email: 'farmer3@demo.com', role: 'farmer' },
];

async function main() {
  for (const u of users) {
    const isFarmer = u.role === 'farmer';
    await send(
      u.email,
      `Welcome to FarmLink, ${u.name}!`,
      `<p>Hi ${u.name},</p>
       <p>Welcome to <strong>FarmLink</strong> — Nigeria's fresh produce marketplace connecting farmers and buyers directly.</p>
       ${isFarmer
         ? `<p>As a farmer, you can browse open buyer demands, commit to supply, track your deliveries, and get paid fairly — no middlemen involved.</p>
            <p>Tip: Use the AI farming assistant to get advice on crops, pests, and soil health.</p>`
         : `<p>As a buyer, you can post purchase demands for any crop, review farmer commitments, and track deliveries from farm to door.</p>`
       }
       <p>Log in now: <a href="https://farmlink-nine-tau.vercel.app">farmlink-nine-tau.vercel.app</a></p>
       <p style="color:#999;font-size:12px;">FarmLink — Fresh Produce Marketplace · Lagos, Nigeria</p>`,
    );
  }

  await send(
    'buyer@demo.com',
    'New commitment from Emeka Okafor — FarmLink',
    `<p>Hi Emeka Adeyemi,</p>
     <p><strong>Emeka Okafor</strong> has committed to supply <strong>500 kg of Tomatoes</strong> for <strong>₦150,000</strong>.</p>
     <p>Log in to FarmLink to review and accept or reject this commitment.</p>
     <p style="color:#999;font-size:12px;">FarmLink — Fresh Produce Marketplace</p>`,
  );

  await send(
    'farmer@demo.com',
    'Your commitment was accepted — FarmLink',
    `<p>Hi Emeka Okafor,</p>
     <p><strong>Eko Hotels & Suites</strong> has <strong>accepted</strong> your commitment to supply <strong>500 kg of Tomatoes</strong> for <strong>₦150,000</strong>.</p>
     <p>Log in to FarmLink to view the details.</p>
     <p style="color:#999;font-size:12px;">FarmLink — Fresh Produce Marketplace</p>`,
  );

  await send(
    'buyer2@demo.com',
    'New commitment from Amaka Nwosu — FarmLink',
    `<p>Hi Ngozi Okonkwo,</p>
     <p><strong>Amaka Nwosu</strong> has committed to supply <strong>300 kg of Yam</strong> for <strong>₦105,000</strong>.</p>
     <p>Log in to FarmLink to review and accept or reject this commitment.</p>
     <p style="color:#999;font-size:12px;">FarmLink — Fresh Produce Marketplace</p>`,
  );

  await send(
    'farmer2@demo.com',
    'Your commitment was accepted — FarmLink',
    `<p>Hi Amaka Nwosu,</p>
     <p><strong>Chicken Republic Victoria Island</strong> has <strong>accepted</strong> your commitment to supply <strong>300 kg of Yam</strong> for <strong>₦105,000</strong>.</p>
     <p>Log in to FarmLink to view the details.</p>
     <p style="color:#999;font-size:12px;">FarmLink — Fresh Produce Marketplace</p>`,
  );

  console.log('All demo emails sent.');
}

main().catch(console.error);
