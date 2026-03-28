import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /notifications/count — unread notification count (sidebar badge)
router.get('/count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.id, read: false },
    });
    res.json({ count });
  } catch (err) {
    console.error('[Notifications] GET count error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /notifications — list most recent 50 for current user, include unread count
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId: req.user!.id, read: false },
      }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('[Notifications] GET error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /notifications/:id/read — mark one notification as read
router.post('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    if (notification.userId !== req.user!.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { read: true },
    });

    res.json(updated);
  } catch (err) {
    console.error('[Notifications] POST read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /notifications/read-all — mark all notifications as read for current user
router.post('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('[Notifications] POST read-all error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
