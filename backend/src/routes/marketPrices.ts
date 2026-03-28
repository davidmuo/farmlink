import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /market-prices — get all market prices with crop info
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const prices = await prisma.marketPrice.findMany({
      include: {
        crop: { select: { id: true, cropName: true, category: true, seasonality: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(prices);
  } catch (err) {
    console.error('[MarketPrices] GET error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /market-prices/:cropId — admin only, set or update market price
router.put('/:cropId', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { priceMin, priceMax, unit } = req.body;

  if (priceMin === undefined || priceMax === undefined) {
    res.status(400).json({ error: 'priceMin and priceMax are required' });
    return;
  }

  const cropId = parseInt(req.params.cropId);

  try {
    const crop = await prisma.crop.findUnique({ where: { id: cropId } });
    if (!crop) {
      res.status(404).json({ error: 'Crop not found' });
      return;
    }

    const price = await prisma.marketPrice.upsert({
      where: { cropId },
      update: {
        priceMin: parseFloat(priceMin),
        priceMax: parseFloat(priceMax),
        ...(unit !== undefined && { unit }),
        updatedBy: req.user!.id,
      },
      create: {
        cropId,
        priceMin: parseFloat(priceMin),
        priceMax: parseFloat(priceMax),
        unit: unit || 'kg',
        updatedBy: req.user!.id,
      },
      include: {
        crop: { select: { id: true, cropName: true, category: true } },
      },
    });

    res.json(price);
  } catch (err) {
    console.error('[MarketPrices] PUT error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
