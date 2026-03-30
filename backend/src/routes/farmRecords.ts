import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', authenticate, requireRole('farmer'), async (req: AuthRequest, res: Response) => {
  const farmer = await prisma.farmer.findUnique({ where: { userId: req.user!.id } });
  if (!farmer) { res.status(404).json({ error: 'Farmer not found' }); return; }

  const records = await prisma.farmRecord.findMany({
    where: { farmerId: farmer.id },
    include: { crop: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(records);
});

router.post('/', authenticate, requireRole('farmer'), async (req: AuthRequest, res: Response) => {
  const { cropId, plantingDate, areaPlanted, notes } = req.body;
  if (!cropId || !plantingDate || !areaPlanted) {
    res.status(400).json({ error: 'cropId, plantingDate, areaPlanted are required' });
    return;
  }

  const farmer = await prisma.farmer.findUnique({ where: { userId: req.user!.id } });
  if (!farmer) { res.status(404).json({ error: 'Farmer not found' }); return; }

  const record = await prisma.farmRecord.create({
    data: {
      farmerId: farmer.id,
      cropId: parseInt(cropId),
      plantingDate: new Date(plantingDate),
      areaPlanted: parseFloat(areaPlanted),
      notes,
    },
    include: { crop: true },
  });

  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: 'CREATE_FARM_RECORD', details: `Farm record created for crop #${cropId}` },
  });

  res.status(201).json(record);
});

router.delete('/:id', authenticate, requireRole('farmer'), async (req: AuthRequest, res: Response) => {
  const farmer = await prisma.farmer.findUnique({ where: { userId: req.user!.id } });
  const record = await prisma.farmRecord.findUnique({ where: { id: parseInt(req.params.id) } });

  if (!record) { res.status(404).json({ error: 'Record not found' }); return; }
  if (record.farmerId !== farmer?.id) { res.status(403).json({ error: 'Not your record' }); return; }

  await prisma.farmRecord.delete({ where: { id: record.id } });
  res.json({ message: 'Record deleted' });
});

export default router;
