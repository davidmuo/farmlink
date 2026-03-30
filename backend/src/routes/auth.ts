import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, phone, role, businessName, businessType, farmLocation, farmSize, cropsGrown } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400).json({ error: 'name, email, password, and role are required' });
    return;
  }
  if (!['buyer', 'farmer'].includes(role)) {
    res.status(400).json({ error: 'role must be buyer or farmer' });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Email already in use' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      phone,
      role,
      ...(role === 'buyer' && {
        buyer: { create: { businessName: businessName || name, businessType: businessType || 'Other' } },
      }),
      ...(role === 'farmer' && {
        farmer: {
          create: {
            farmLocation: farmLocation || '',
            farmSize: farmSize ? parseFloat(farmSize) : 0,
            cropsGrown: JSON.stringify(cropsGrown || []),
          },
        },
      }),
    },
    include: { buyer: true, farmer: true },
  });

  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' });

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, buyer: user.buyer, farmer: user.farmer },
  });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { buyer: true, farmer: true, admin: true },
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, buyer: user.buyer, farmer: user.farmer, admin: user.admin },
  });
});

router.patch('/profile', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ error: 'No token' }); return; }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: payload.id },
      data: { ...(name && { name }), ...(phone !== undefined && { phone }) },
      include: { buyer: true, farmer: true, admin: true },
    });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, buyer: user.buyer, farmer: user.farmer, admin: user.admin });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) { res.status(401).json({ error: 'No token' }); return; }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { buyer: true, farmer: true, admin: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, buyer: user.buyer, farmer: user.farmer, admin: user.admin });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
