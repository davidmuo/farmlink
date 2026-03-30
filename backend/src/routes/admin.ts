import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /admin/users
router.get('/users', authenticate, requireRole('admin'), async (_req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    include: { buyer: true, farmer: true, admin: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users.map(u => ({ ...u, passwordHash: undefined })));
});

// PATCH /admin/users/:id — update role or status
router.patch('/users/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const { name, phone } = req.body;
  const user = await prisma.user.update({
    where: { id: parseInt(req.params.id) },
    data: { ...(name && { name }), ...(phone && { phone }) },
    include: { buyer: true, farmer: true },
  });
  res.json({ ...user, passwordHash: undefined });
});

// GET /admin/audit-logs
router.get('/audit-logs', authenticate, requireRole('admin'), async (_req: AuthRequest, res: Response) => {
  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { name: true, email: true, role: true } } },
    orderBy: { timestamp: 'desc' },
    take: 200,
  });
  res.json(logs);
});

// GET /admin/stats
router.get('/stats', authenticate, requireRole('admin'), async (_req: AuthRequest, res: Response) => {
  const [totalUsers, totalDemands, totalCommitments, openDemands] = await Promise.all([
    prisma.user.count(),
    prisma.demand.count(),
    prisma.commitment.count(),
    prisma.demand.count({ where: { status: 'open' } }),
  ]);
  res.json({ totalUsers, totalDemands, totalCommitments, openDemands });
});

// PATCH /admin/users/:id/ban — toggle ban status
router.patch('/users/:id/ban', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params.id);
  if (userId === req.user!.id) { res.status(400).json({ error: 'Cannot ban yourself' }); return; }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isBanned: !user.isBanned },
  });
  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: 'TOGGLE_BAN', details: `User #${userId} (${user.name}) isBanned set to ${updated.isBanned}` },
  });
  res.json({ ...updated, passwordHash: undefined });
});

// DELETE /admin/users/:id
router.delete('/users/:id', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const userId = parseInt(req.params.id);
  if (userId === req.user!.id) { res.status(400).json({ error: 'Cannot delete yourself' }); return; }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  await prisma.user.delete({ where: { id: userId } });
  await prisma.auditLog.create({
    data: { userId: req.user!.id, action: 'DELETE_USER', details: `Deleted user #${userId} (${user.name}, ${user.role})` },
  });
  res.json({ ok: true });
});

// PATCH /admin/farmers/:id/verify — toggle farmer isVerified
router.patch('/farmers/:id/verify', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const farmerId = parseInt(req.params.id);

    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
      include: { user: true },
    });

    if (!farmer) {
      res.status(404).json({ error: 'Farmer not found' });
      return;
    }

    const updated = await prisma.farmer.update({
      where: { id: farmerId },
      data: { isVerified: !farmer.isVerified },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Notify the farmer
    const statusText = updated.isVerified ? 'verified' : 'unverified';
    await prisma.notification.create({
      data: {
        userId: farmer.user.id,
        type: 'delivery_update',
        title: `Your account has been ${statusText}`,
        body: updated.isVerified
          ? 'Congratulations! Your farmer account has been verified by an administrator.'
          : 'Your farmer account verification status has been removed by an administrator.',
        link: '/farmer/profile',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'TOGGLE_FARMER_VERIFICATION',
        details: `Farmer #${farmerId} (${farmer.user.name}) isVerified set to ${updated.isVerified}`,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('[Admin] PATCH farmers verify error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
