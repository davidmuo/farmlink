import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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

app.listen(PORT, () => {
  console.log(`FarmLink API running on http://localhost:${PORT}`);
});

export default app;
