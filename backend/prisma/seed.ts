import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ago   = (n: number) => new Date(Date.now() - n * 864e5);
const later = (n: number) => new Date(Date.now() + n * 864e5);

async function main() {
  // ── 1. Wipe existing data ──────────────────────────────────
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.review.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.smsLog.deleteMany();
  await prisma.marketPrice.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.farmRecord.deleteMany();
  await prisma.commitment.deleteMany();
  await prisma.demand.deleteMany();
  await prisma.guidance.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.farmer.deleteMany();
  await prisma.buyer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.crop.deleteMany();

  // ── 2. Crops ───────────────────────────────────────────────
  const cropDefs = [
    { cropName: 'Tomatoes',   category: 'Vegetables',      seasonality: 'Year-round',   storageRequirements: 'Cool, dry place. 2–3 weeks.' },
    { cropName: 'Maize',      category: 'Grains',          seasonality: 'Year-round',   storageRequirements: 'Dry storage. 6–12 months.' },
    { cropName: 'Peppers',    category: 'Vegetables',      seasonality: 'Year-round',   storageRequirements: 'Refrigerated. 1–2 weeks.' },
    { cropName: 'Onions',     category: 'Vegetables',      seasonality: 'Year-round',   storageRequirements: 'Dry, ventilated area. 4–6 months.' },
    { cropName: 'Cabbage',    category: 'Vegetables',      seasonality: 'Cool seasons', storageRequirements: 'Refrigerated. 3–4 weeks.' },
    { cropName: 'Yam',        category: 'Root Vegetables', seasonality: 'Year-round',   storageRequirements: 'Dry, airy barn. 3–6 months.' },
    { cropName: 'Cassava',    category: 'Root Vegetables', seasonality: 'Year-round',   storageRequirements: 'Process within 2 days of harvest.' },
    { cropName: 'Plantain',   category: 'Fruits',          seasonality: 'Year-round',   storageRequirements: 'Room temperature. 1–2 weeks.' },
    { cropName: 'Okra',       category: 'Vegetables',      seasonality: 'Year-round',   storageRequirements: 'Refrigerated. 3–5 days.' },
    { cropName: 'Watermelon', category: 'Fruits',          seasonality: 'Dry season',   storageRequirements: 'Cool area. 2–3 weeks whole.' },
    { cropName: 'Cucumber',   category: 'Vegetables',      seasonality: 'Year-round',   storageRequirements: 'Refrigerated. 1 week.' },
    { cropName: 'Cowpea',     category: 'Legumes',         seasonality: 'Year-round',   storageRequirements: 'Dry, sealed container. 6–12 months.' },
  ];

  const crops: Record<string, number> = {};
  for (const c of cropDefs) {
    const r = await prisma.crop.create({ data: c });
    crops[c.cropName] = r.id;
  }

  // ── 3. Guidance ────────────────────────────────────────────
  const guidanceDefs = [
    { crop: 'Tomatoes', guidanceType: 'planting',     growthStage: 'seedling', content: 'Plant in well-drained soil with full sun. Space 45–60 cm apart. Incorporate compost before planting for best results.' },
    { crop: 'Tomatoes', guidanceType: 'harvesting',   growthStage: 'mature',   content: 'Harvest when fruits are fully coloured and slightly soft to touch. Avoid harvesting in wet conditions to prevent bruising.' },
    { crop: 'Tomatoes', guidanceType: 'pest_control', growthStage: 'growing',  content: 'Watch for aphids, whiteflies, and tomato hornworms. Apply neem oil spray every 7 days as organic control.' },
    { crop: 'Yam',      guidanceType: 'planting',     growthStage: 'seedling', content: 'Plant yam setts in mounds 1 m apart at start of rains. Mulch heavily to retain soil moisture.' },
    { crop: 'Yam',      guidanceType: 'harvesting',   growthStage: 'mature',   content: 'Harvest 7–9 months after planting when leaves turn yellow-brown. Cure tubers in shade for 2 weeks before storage.' },
    { crop: 'Maize',    guidanceType: 'planting',     growthStage: 'seedling', content: 'Plant at start of rains, 75 × 25 cm spacing. Apply NPK fertilizer at planting and top-dress at 6 weeks.' },
    { crop: 'Maize',    guidanceType: 'pest_control', growthStage: 'growing',  content: 'Scout for fall armyworm weekly. Apply recommended insecticide at first sign of damage to growing point.' },
    { crop: 'Cassava',  guidanceType: 'planting',     growthStage: 'seedling', content: 'Plant stem cuttings 25 cm long in mounds or ridges. Mounded soil improves tuber size.' },
    { crop: 'Okra',     guidanceType: 'harvesting',   growthStage: 'mature',   content: 'Harvest pods every 2–3 days when 7–10 cm long. Over-mature pods become fibrous and reduce plant productivity.' },
  ];

  for (const g of guidanceDefs) {
    if (crops[g.crop]) {
      await prisma.guidance.create({ data: { cropId: crops[g.crop], guidanceType: g.guidanceType, content: g.content, growthStage: g.growthStage } });
    }
  }

  // ── 4. Users ───────────────────────────────────────────────
  const hash = await bcrypt.hash('password123', 10);

  const bu1 = await prisma.user.create({ data: { name: 'Emeka Adeyemi',   email: 'buyer@demo.com',  passwordHash: hash, phone: '+2348030001001', role: 'buyer',  buyer:  { create: { businessName: 'Eko Hotels & Suites',              businessType: 'Hotel'      } } }, include: { buyer: true } });
  const bu2 = await prisma.user.create({ data: { name: 'Ngozi Okonkwo',   email: 'buyer2@demo.com', passwordHash: hash, phone: '+2348030001002', role: 'buyer',  buyer:  { create: { businessName: 'Chicken Republic Victoria Island', businessType: 'Restaurant' } } }, include: { buyer: true } });
  const bu3 = await prisma.user.create({ data: { name: 'Dr. Segun Bello', email: 'buyer3@demo.com', passwordHash: hash, phone: '+2348030001003', role: 'buyer',  buyer:  { create: { businessName: 'Lagos Food Bank Initiative',       businessType: 'NGO'        } } }, include: { buyer: true } });
  const bu4 = await prisma.user.create({ data: { name: 'Folake Adesanya', email: 'buyer4@demo.com', passwordHash: hash, phone: '+2348030001004', role: 'buyer',  buyer:  { create: { businessName: 'Chrisland Schools Group',          businessType: 'School'     } } }, include: { buyer: true } });

  const fu1 = await prisma.user.create({ data: { name: 'Emeka Okafor',  email: 'farmer@demo.com',  passwordHash: hash, phone: '+2348030002001', role: 'farmer', farmer: { create: { farmLocation: 'Ifo, Ogun State',    farmSize: 8.5,  cropsGrown: JSON.stringify(['Tomatoes', 'Maize', 'Peppers']) } } }, include: { farmer: true } });
  const fu2 = await prisma.user.create({ data: { name: 'Amaka Nwosu',   email: 'farmer2@demo.com', passwordHash: hash, phone: '+2348030002002', role: 'farmer', farmer: { create: { farmLocation: 'Ibadan, Oyo State',  farmSize: 12.0, cropsGrown: JSON.stringify(['Yam', 'Cassava', 'Plantain', 'Okra']) } } }, include: { farmer: true } });
  const fu3 = await prisma.user.create({ data: { name: 'Tunde Adeyemi', email: 'farmer3@demo.com', passwordHash: hash, phone: '+2348030002003', role: 'farmer', farmer: { create: { farmLocation: 'Sagamu, Ogun State', farmSize: 6.0,  cropsGrown: JSON.stringify(['Cabbage', 'Watermelon', 'Cucumber', 'Cowpea']) } } }, include: { farmer: true } });

  const adm = await prisma.user.create({ data: { name: 'FarmLink Admin', email: 'admin@demo.com', passwordHash: hash, phone: '+2348030003001', role: 'admin', admin: { create: { accessLevel: 'super' } } } });

  const b1 = bu1.buyer!.id, b2 = bu2.buyer!.id, b3 = bu3.buyer!.id, b4 = bu4.buyer!.id;
  const f1 = fu1.farmer!.id, f2 = fu2.farmer!.id, f3 = fu3.farmer!.id;

  // ── 5. Demands ─────────────────────────────────────────────
  const d1  = await prisma.demand.create({ data: { buyerId: b1, cropId: crops['Tomatoes'],   quantity: 500,  pricePerUnit: 280, qualityStandard: 'Grade A', deliveryStart: ago(5),  deliveryEnd: later(10), status: 'partially_filled', notes: 'Fresh, firm tomatoes for hotel kitchen. Daily use. Delivery to Victoria Island.' } });
  const d2  = await prisma.demand.create({ data: { buyerId: b1, cropId: crops['Peppers'],    quantity: 200,  pricePerUnit: 600, qualityStandard: 'Grade A', deliveryStart: later(2), deliveryEnd: later(20), status: 'open',             notes: 'Mixed peppers (tatashe & shombo). No blemishes. Restaurant kitchen use.' } });
  const d3  = await prisma.demand.create({ data: { buyerId: b1, cropId: crops['Onions'],     quantity: 300,  pricePerUnit: 350, qualityStandard: 'Grade A', deliveryStart: ago(30), deliveryEnd: ago(5),    status: 'closed',           notes: 'Completed. Recurring monthly order fulfilled.' } });
  await           prisma.demand.create({ data: { buyerId: b1, cropId: crops['Plantain'],   quantity: 250,  pricePerUnit: 420, qualityStandard: 'Grade A', deliveryStart: later(3), deliveryEnd: later(18), status: 'open',             notes: 'Ripe plantain for breakfast buffet. Full bunches preferred.' } });

  const d5  = await prisma.demand.create({ data: { buyerId: b2, cropId: crops['Tomatoes'],   quantity: 800,  pricePerUnit: 260, qualityStandard: 'Grade A', deliveryStart: ago(3),  deliveryEnd: later(14), status: 'partially_filled', notes: 'Bulk for sauce production. Weekly deliveries to Surulere store.' } });
  await           prisma.demand.create({ data: { buyerId: b2, cropId: crops['Cucumber'],   quantity: 150,  pricePerUnit: 450, qualityStandard: 'Grade A', deliveryStart: later(5), deliveryEnd: later(25), status: 'open' } });
  const d7  = await prisma.demand.create({ data: { buyerId: b2, cropId: crops['Cabbage'],    quantity: 250,  pricePerUnit: 220, qualityStandard: 'Grade B', deliveryStart: ago(15), deliveryEnd: ago(2),    status: 'closed' } });
  await           prisma.demand.create({ data: { buyerId: b2, cropId: crops['Onions'],     quantity: 180,  pricePerUnit: 340, qualityStandard: 'Grade A', deliveryStart: later(1), deliveryEnd: later(15), status: 'open',             notes: 'Medium-sized onions for burger station.' } });

  const d9  = await prisma.demand.create({ data: { buyerId: b3, cropId: crops['Maize'],      quantity: 2000, pricePerUnit: 280, qualityStandard: 'Grade B', deliveryStart: later(7), deliveryEnd: later(30), status: 'open',             notes: 'Community distribution. Large quantities accepted. Deliver to Ikeja warehouse.' } });
  await           prisma.demand.create({ data: { buyerId: b3, cropId: crops['Cassava'],    quantity: 1500, pricePerUnit: 120, qualityStandard: 'Grade B', deliveryStart: later(10), deliveryEnd: later(35), status: 'open' } });
  const d11 = await prisma.demand.create({ data: { buyerId: b3, cropId: crops['Cowpea'],     quantity: 500,  pricePerUnit: 650, qualityStandard: 'Grade A', deliveryStart: ago(40), deliveryEnd: ago(15),   status: 'closed',           notes: 'Food relief program — order completed.' } });
  const d12 = await prisma.demand.create({ data: { buyerId: b3, cropId: crops['Maize'],      quantity: 1200, pricePerUnit: 290, qualityStandard: 'Grade B', deliveryStart: ago(60), deliveryEnd: ago(35),   status: 'closed',           notes: 'Previous quarter program — fulfilled.' } });

  const d13 = await prisma.demand.create({ data: { buyerId: b4, cropId: crops['Yam'],        quantity: 600,  pricePerUnit: 680, qualityStandard: 'Grade A', deliveryStart: ago(2),  deliveryEnd: later(12), status: 'partially_filled', notes: 'School canteen supply. Weekly schedule across 5 campuses.' } });
  await           prisma.demand.create({ data: { buyerId: b4, cropId: crops['Plantain'],   quantity: 400,  pricePerUnit: 400, qualityStandard: 'Grade A', deliveryStart: later(3), deliveryEnd: later(18), status: 'open' } });
  const d15 = await prisma.demand.create({ data: { buyerId: b4, cropId: crops['Okra'],       quantity: 100,  pricePerUnit: 750, qualityStandard: 'Grade A', deliveryStart: ago(35), deliveryEnd: ago(10),   status: 'closed' } });
  const d16 = await prisma.demand.create({ data: { buyerId: b4, cropId: crops['Tomatoes'],   quantity: 200,  pricePerUnit: 270, qualityStandard: 'Grade A', deliveryStart: ago(20), deliveryEnd: ago(6),    status: 'closed',           notes: 'End-of-term kitchen stock-up. Completed.' } });

  // ── 6. Commitments ─────────────────────────────────────────
  const c1  = await prisma.commitment.create({ data: { farmerId: f1, demandId: d1.id,  committedQuantity: 200, commitmentType: 'partial', status: 'accepted', committedAt: ago(3) } });
  await            prisma.commitment.create({ data: { farmerId: f3, demandId: d1.id,  committedQuantity: 150, commitmentType: 'partial', status: 'pending',  committedAt: ago(1) } });
  await            prisma.commitment.create({ data: { farmerId: f1, demandId: d2.id,  committedQuantity: 200, commitmentType: 'full',    status: 'pending',  committedAt: ago(0) } });
  const c4  = await prisma.commitment.create({ data: { farmerId: f1, demandId: d3.id,  committedQuantity: 300, commitmentType: 'full',    status: 'accepted', committedAt: ago(25) } });
  const c5  = await prisma.commitment.create({ data: { farmerId: f1, demandId: d5.id,  committedQuantity: 400, commitmentType: 'partial', status: 'accepted', committedAt: ago(2) } });
  await            prisma.commitment.create({ data: { farmerId: f3, demandId: d5.id,  committedQuantity: 200, commitmentType: 'partial', status: 'pending',  committedAt: ago(1) } });
  const c7  = await prisma.commitment.create({ data: { farmerId: f3, demandId: d7.id,  committedQuantity: 250, commitmentType: 'full',    status: 'accepted', committedAt: ago(18) } });
  await            prisma.commitment.create({ data: { farmerId: f1, demandId: d7.id,  committedQuantity: 100, commitmentType: 'partial', status: 'rejected', committedAt: ago(16) } });
  await            prisma.commitment.create({ data: { farmerId: f1, demandId: d9.id,  committedQuantity: 1000, commitmentType: 'partial', status: 'pending', committedAt: ago(1) } });
  const c10 = await prisma.commitment.create({ data: { farmerId: f2, demandId: d11.id, committedQuantity: 500, commitmentType: 'full',    status: 'accepted', committedAt: ago(38) } });
  const c11 = await prisma.commitment.create({ data: { farmerId: f1, demandId: d12.id, committedQuantity: 800, commitmentType: 'partial', status: 'accepted', committedAt: ago(58) } });
  const c12 = await prisma.commitment.create({ data: { farmerId: f2, demandId: d12.id, committedQuantity: 400, commitmentType: 'partial', status: 'accepted', committedAt: ago(56) } });
  const c13 = await prisma.commitment.create({ data: { farmerId: f2, demandId: d13.id, committedQuantity: 300, commitmentType: 'partial', status: 'accepted', committedAt: ago(2) } });
  await            prisma.commitment.create({ data: { farmerId: f2, demandId: d13.id, committedQuantity: 150, commitmentType: 'partial', status: 'pending',  committedAt: ago(1) } });
  const c15 = await prisma.commitment.create({ data: { farmerId: f2, demandId: d15.id, committedQuantity: 100, commitmentType: 'full',    status: 'accepted', committedAt: ago(33) } });
  const c16 = await prisma.commitment.create({ data: { farmerId: f3, demandId: d16.id, committedQuantity: 200, commitmentType: 'full',    status: 'accepted', committedAt: ago(19) } });

  // ── 7. Messages ────────────────────────────────────────────
  // c1: Emeka ↔ Eko Hotels
  await prisma.message.create({ data: { commitmentId: c1.id, senderId: fu1.id, content: 'When should I deliver the 200kg?', createdAt: ago(2.9) } });
  await prisma.message.create({ data: { commitmentId: c1.id, senderId: bu1.id, content: 'Every Tuesday before 8am. Use wooden crates please.', createdAt: ago(2.8) } });

  // c5: Emeka ↔ Chicken Republic
  await prisma.message.create({ data: { commitmentId: c5.id, senderId: bu2.id, content: 'Offer accepted. Deliver to Surulere loading dock.', createdAt: ago(1.9) } });
  await prisma.message.create({ data: { commitmentId: c5.id, senderId: fu1.id, content: 'Got it, will be there Wednesday morning.', createdAt: ago(1.8) } });

  // c13: Amaka ↔ Chrisland Schools
  await prisma.message.create({ data: { commitmentId: c13.id, senderId: fu2.id, content: 'Yams are ready. How should I package them?', createdAt: ago(1.8) } });
  await prisma.message.create({ data: { commitmentId: c13.id, senderId: bu4.id, content: 'Jute sacks, 50kg each. Split across 3 campuses.', createdAt: ago(1.7) } });

  // c10: Amaka ↔ Lagos Food Bank
  await prisma.message.create({ data: { commitmentId: c10.id, senderId: fu2.id, content: '500kg cowpea ready. Sun-dried, clean, bagged 25kg each.', createdAt: ago(37) } });
  await prisma.message.create({ data: { commitmentId: c10.id, senderId: bu3.id, content: 'Good. Our truck will collect Thursday morning.', createdAt: ago(36.5) } });

  // c7: Tunde ↔ Chicken Republic
  await prisma.message.create({ data: { commitmentId: c7.id, senderId: fu3.id, content: '250kg cabbage is ready. When should I come?', createdAt: ago(17.5) } });
  await prisma.message.create({ data: { commitmentId: c7.id, senderId: bu2.id, content: 'Friday before 9am. Invoice on delivery is fine.', createdAt: ago(17.2) } });

  // c16: Tunde ↔ Chrisland
  await prisma.message.create({ data: { commitmentId: c16.id, senderId: fu3.id, content: 'Delivering 200kg tomatoes today. Someone available?', createdAt: ago(18.8) } });
  await prisma.message.create({ data: { commitmentId: c16.id, senderId: bu4.id, content: 'Yes, come between 8–10am. Kitchen supervisor will receive.', createdAt: ago(18.6) } });

  // ── 8. Farm Records ────────────────────────────────────────
  const records = [
    { farmerId: f1, crop: 'Tomatoes',   plantingDate: ago(60),  areaPlanted: 2.5, notes: 'Drip irrigation installed. Strong growth — high yield expected this season.' },
    { farmerId: f1, crop: 'Maize',      plantingDate: ago(45),  areaPlanted: 3.0, notes: 'Hybrid seed variety (OBA SUPER 2). NPK applied at planting and week 6.' },
    { farmerId: f1, crop: 'Peppers',    plantingDate: ago(30),  areaPlanted: 2.0, notes: 'Good canopy coverage. Pest control applied. First harvest in ~3 weeks.' },
    { farmerId: f2, crop: 'Yam',        plantingDate: ago(90),  areaPlanted: 5.0, notes: 'Traditional yam barn prepared for curing. Tubers sizing well.' },
    { farmerId: f2, crop: 'Cassava',    plantingDate: ago(120), areaPlanted: 4.5, notes: 'Ready for harvest this week. Arranged with local processor in Ibadan.' },
    { farmerId: f2, crop: 'Plantain',   plantingDate: ago(75),  areaPlanted: 2.5, notes: 'First bunches visible on 70% of plants. On track for supply commitments.' },
    { farmerId: f2, crop: 'Okra',       plantingDate: ago(20),  areaPlanted: 1.0, notes: 'Fast-growing batch specifically for Q2 hotel supply commitment.' },
    { farmerId: f3, crop: 'Watermelon', plantingDate: ago(55),  areaPlanted: 3.0, notes: 'Fruits developing well. Estimated harvest in 3 weeks. Drip lines working.' },
    { farmerId: f3, crop: 'Cabbage',    plantingDate: ago(40),  areaPlanted: 2.0, notes: 'Dense, compact heads forming. Ready for market in approximately 2 weeks.' },
    { farmerId: f3, crop: 'Cucumber',   plantingDate: ago(25),  areaPlanted: 1.5, notes: 'First fruits visible on main vines. Good coverage.' },
    { farmerId: f3, crop: 'Cowpea',     plantingDate: ago(50),  areaPlanted: 1.0, notes: 'Pods forming well. Will be ready for Chicken Republic order if needed.' },
  ];
  for (const r of records) {
    await prisma.farmRecord.create({ data: { farmerId: r.farmerId, cropId: crops[r.crop], plantingDate: r.plantingDate, areaPlanted: r.areaPlanted, notes: r.notes } });
  }

  // ── 9. Audit Logs ──────────────────────────────────────────
  const logs = [
    { userId: bu1.id,  action: 'CREATE_DEMAND',      details: 'Posted demand: 500 kg Tomatoes at ₦280/kg — Eko Hotels',       timestamp: ago(5)  },
    { userId: fu1.id,  action: 'CREATE_COMMITMENT',  details: 'Committed 200 kg Tomatoes to Eko Hotels demand',                timestamp: ago(3)  },
    { userId: bu1.id,  action: 'UPDATE_COMMITMENT',  details: 'Accepted commitment from Emeka Okafor — 200 kg Tomatoes',       timestamp: ago(3)  },
    { userId: bu2.id,  action: 'CREATE_DEMAND',      details: 'Posted demand: 800 kg Tomatoes at ₦260/kg — Chicken Republic',  timestamp: ago(3)  },
    { userId: fu1.id,  action: 'CREATE_COMMITMENT',  details: 'Committed 400 kg Tomatoes to Chicken Republic demand',          timestamp: ago(2)  },
    { userId: bu2.id,  action: 'UPDATE_COMMITMENT',  details: 'Accepted commitment from Emeka Okafor — 400 kg Tomatoes',       timestamp: ago(2)  },
    { userId: fu2.id,  action: 'CREATE_FARM_RECORD', details: 'Farm record: Yam (5 ha) — Ibadan, Oyo State',                  timestamp: ago(2)  },
    { userId: bu4.id,  action: 'CREATE_DEMAND',      details: 'Posted demand: 600 kg Yam at ₦680/kg — Chrisland Schools',     timestamp: ago(2)  },
    { userId: fu2.id,  action: 'CREATE_COMMITMENT',  details: 'Committed 300 kg Yam to Chrisland Schools demand',             timestamp: ago(2)  },
    { userId: bu4.id,  action: 'UPDATE_COMMITMENT',  details: 'Accepted commitment from Amaka Nwosu — 300 kg Yam',            timestamp: ago(1)  },
    { userId: bu3.id,  action: 'CREATE_DEMAND',      details: 'Posted demand: 2,000 kg Maize at ₦280/kg — Lagos Food Bank',   timestamp: ago(1)  },
    { userId: fu3.id,  action: 'CREATE_COMMITMENT',  details: 'Committed 150 kg Tomatoes to Eko Hotels demand',               timestamp: ago(1)  },
    { userId: fu1.id,  action: 'CREATE_COMMITMENT',  details: 'Committed 1,000 kg Maize to Lagos Food Bank demand',           timestamp: ago(1)  },
    { userId: adm.id,  action: 'ADMIN_REVIEW',        details: 'Admin reviewed platform activity — all systems normal',        timestamp: ago(0)  },
  ];
  for (const log of logs) {
    await prisma.auditLog.create({ data: log });
  }

  // ── 10. Notifications ──────────────────────────────────────
  await prisma.notification.create({ data: { userId: fu1.id,  type: 'commitment_accepted', title: 'Offer accepted!',        body: 'Eko Hotels & Suites accepted your 200kg Tomatoes commitment.',      link: `/farmer/commitments`, read: false, createdAt: ago(3) } });
  await prisma.notification.create({ data: { userId: fu1.id,  type: 'commitment_accepted', title: 'Offer accepted!',        body: 'Chicken Republic accepted your 400kg Tomatoes commitment.',         link: `/farmer/commitments`, read: false, createdAt: ago(2) } });
  await prisma.notification.create({ data: { userId: bu1.id,  type: 'new_offer',           title: 'New farmer offer',       body: 'Emeka Okafor committed 200kg of Tomatoes to your demand.',          link: `/buyer/commitments`,  read: true,  createdAt: ago(3) } });
  await prisma.notification.create({ data: { userId: bu2.id,  type: 'new_offer',           title: 'New farmer offer',       body: 'Emeka Okafor committed 400kg of Tomatoes to your demand.',          link: `/buyer/commitments`,  read: true,  createdAt: ago(2) } });
  await prisma.notification.create({ data: { userId: fu2.id,  type: 'commitment_accepted', title: 'Offer accepted!',        body: 'Chrisland Schools accepted your 300kg Yam commitment.',             link: `/farmer/commitments`, read: false, createdAt: ago(1) } });
  await prisma.notification.create({ data: { userId: bu4.id,  type: 'new_offer',           title: 'New farmer offer',       body: 'Amaka Nwosu committed 150kg of Yam — awaiting your review.',       link: `/buyer/commitments`,  read: false, createdAt: ago(1) } });
  await prisma.notification.create({ data: { userId: bu1.id,  type: 'new_offer',           title: 'New farmer offer',       body: 'Tunde Adeyemi committed 150kg of Tomatoes — awaiting review.',     link: `/buyer/commitments`,  read: false, createdAt: ago(1) } });
  await prisma.notification.create({ data: { userId: fu1.id,  type: 'new_message',         title: 'New message',            body: 'Eko Hotels & Suites: Please use wooden crates, max 20kg each.',    link: `/farmer/messages`,    read: false, createdAt: ago(2.5) } });
  await prisma.notification.create({ data: { userId: bu1.id,  type: 'new_message',         title: 'New message from Emeka', body: 'Will send a message each Monday once the truck is loaded.',        link: `/buyer/messages`,     read: true,  createdAt: ago(2.3) } });

  console.log('\n✅  Seed complete — Lagos, Nigeria\n');
  console.log('  BUYERS (password: password123)');
  console.log('  buyer@demo.com   →  Emeka Adeyemi   / Eko Hotels & Suites');
  console.log('  buyer2@demo.com  →  Ngozi Okonkwo   / Chicken Republic Victoria Island');
  console.log('  buyer3@demo.com  →  Dr. Segun Bello / Lagos Food Bank Initiative');
  console.log('  buyer4@demo.com  →  Folake Adesanya / Chrisland Schools Group');
  console.log('\n  FARMERS (password: password123)');
  console.log('  farmer@demo.com  →  Emeka Okafor  / Ifo, Ogun State    (8.5 ha)');
  console.log('  farmer2@demo.com →  Amaka Nwosu   / Ibadan, Oyo State  (12 ha)');
  console.log('  farmer3@demo.com →  Tunde Adeyemi / Sagamu, Ogun State (6 ha)');
  console.log('\n  ADMIN');
  console.log('  admin@demo.com   →  FarmLink Admin\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
