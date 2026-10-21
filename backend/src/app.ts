import './middleware/asyncErrors';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Prisma } from '@prisma/client';

import authRoutes        from './routes/auth';
import demandRoutes      from './routes/demands';
import commitmentRoutes  from './routes/commitments';
import cropRoutes        from './routes/crops';
import farmRecordRoutes  from './routes/farmRecords';
import adminRoutes       from './routes/admin';
import notificationRoutes from './routes/notifications';
import ussdRoutes        from './routes/ussd';
import smsRoutes         from './routes/sms';
import reviewsRouter     from './routes/reviews';
import messagesRouter    from './routes/messages';
import marketPricesRouter from './routes/marketPrices';
import disputesRouter    from './routes/disputes';
import aiRouter          from './routes/ai';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth',          authRoutes);
app.use('/demands',       demandRoutes);
app.use('/commitments',   commitmentRoutes);
app.use('/crops',         cropRoutes);
app.use('/farm-records',  farmRecordRoutes);
app.use('/admin',         adminRoutes);
app.use('/notifications', notificationRoutes);
app.use('/ussd',          ussdRoutes);
app.use('/sms',           smsRoutes);
app.use('/reviews',       reviewsRouter);
app.use('/messages',      messagesRouter);
app.use('/market-prices', marketPricesRouter);
app.use('/disputes',     disputesRouter);
app.use('/ai',           aiRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok', app: 'FarmLink API', version: '1.0.0' }));

const isDatabaseDown = (err: unknown) =>
  err instanceof Prisma.PrismaClientInitializationError ||
  (err instanceof Prisma.PrismaClientKnownRequestError && ['P1001', 'P1002', 'P1008', 'P1017'].includes(err.code));

// Anything a route throws or rejects with ends up here, so one failed request can't take the server down
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(err);

  // Malformed or oversized request bodies, rejected by the body parsers
  const status = err?.status || err?.statusCode;
  if (status >= 400 && status < 500) {
    res.status(status).json({ error: status === 413 ? 'Request body too large' : 'Invalid request body' });
    return;
  }

  console.error(`${req.method} ${req.originalUrl} failed:`, err);

  // USSD sessions show the reply text on the handset, so end the session with a readable message
  if (req.originalUrl.startsWith('/ussd')) {
    res.type('text/plain').send('END FarmLink is unavailable right now. Please try again later.');
    return;
  }

  if (isDatabaseDown(err)) {
    res.status(503).json({ error: 'Database unavailable. Please try again shortly.' });
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
});

// Promises nobody awaits (background emails and SMS, for example) are logged instead of stopping the server
process.on('unhandledRejection', reason => {
  console.error('Unhandled promise rejection:', reason);
});

app.listen(PORT, () => {
  console.log(`FarmLink API running on http://localhost:${PORT}`);
});

export default app;
