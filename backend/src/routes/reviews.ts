import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { commitmentId, rating, revieweeId, comment } = req.body;

  if (!commitmentId || !rating || !revieweeId) {
    res.status(400).json({ error: 'commitmentId, rating, and revieweeId are required' });
    return;
  }

  const ratingNum = parseInt(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
    return;
  }

  try {
    const commitment = await prisma.commitment.findUnique({
      where: { id: parseInt(commitmentId) },
      include: {
        farmer: { include: { user: true } },
        demand: { include: { buyer: { include: { user: true } } } },
      },
    });

    if (!commitment) {
      res.status(404).json({ error: 'Commitment not found' });
      return;
    }

    if (commitment.deliveryStatus !== 'completed') {
      res.status(400).json({ error: 'Can only review completed commitments' });
      return;
    }

    const userId = req.user!.id;
    const farmerUserId = commitment.farmer.user.id;
    const buyerUserId = commitment.demand.buyer.user.id;

    if (userId !== farmerUserId && userId !== buyerUserId) {
      res.status(403).json({ error: 'Only the farmer or buyer of this commitment can leave a review' });
      return;
    }

    const revieweeIdNum = parseInt(revieweeId);
    if (revieweeIdNum !== farmerUserId && revieweeIdNum !== buyerUserId) {
      res.status(400).json({ error: 'revieweeId must be the farmer or buyer of this commitment' });
      return;
    }

    if (revieweeIdNum === userId) {
      res.status(400).json({ error: 'Cannot review yourself' });
      return;
    }

    const existing = await prisma.review.findUnique({ where: { commitmentId: commitment.id } });
    if (existing) {
      res.status(409).json({ error: 'A review already exists for this commitment' });
      return;
    }

    const review = await prisma.review.create({
      data: {
        reviewerId: userId,
        revieweeId: revieweeIdNum,
        commitmentId: commitment.id,
        rating: ratingNum,
        comment: comment || null,
      },
      include: {
        reviewer: { select: { id: true, name: true } },
        reviewee: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/commitment/:commitmentId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const review = await prisma.review.findUnique({
      where: { commitmentId: parseInt(req.params.commitmentId) },
      include: {
        reviewer: { select: { id: true, name: true } },
        reviewee: { select: { id: true, name: true } },
      },
    });

    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    res.json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        reviewer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;

    res.json({ reviews, avgRating, count: reviews.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
