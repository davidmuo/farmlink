import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /crops
router.get('/', async (_req: Request, res: Response) => {
  const crops = await prisma.crop.findMany({ orderBy: { cropName: 'asc' } });
  res.json(crops);
});

// GET /crops/:id/guidance
router.get('/:id/guidance', async (req: Request, res: Response) => {
  const crop = await prisma.crop.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { guidance: true },
  });
  if (!crop) { res.status(404).json({ error: 'Crop not found' }); return; }
  res.json(crop);
});

// POST /crops — admin only
router.post('/', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
  const { cropName, category, seasonality, storageRequirements } = req.body;
  const crop = await prisma.crop.create({ data: { cropName, category, seasonality, storageRequirements } });
  res.status(201).json(crop);
});

export default router;
