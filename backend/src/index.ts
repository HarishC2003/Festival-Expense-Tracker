import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import festivalRoutes from './routes/festival.routes';
import masterDataRoutes from './routes/masterData.routes';
import incomeRoutes from './routes/income.routes';
import expenseRoutes from './routes/expense.routes';
import dashboardRoutes from './routes/dashboard.routes';
import searchRoutes from './routes/search.routes';
import reportsRoutes from './routes/reports.routes';
import mediaRoutes from './routes/media.routes';
import groupsRoutes from './routes/groups.routes';
import adminRoutes from './routes/admin.routes';

import { rateLimit } from 'express-rate-limit';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Global Rate Limiter: 100 requests per minute
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.warn(JSON.stringify({
      event: 'rate_limit_exceeded',
      ip: req.ip,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    }));
    res.status(options.statusCode).send(options.message);
  }
});
app.use('/api', globalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/festivals', festivalRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => {
  res.send('OK');
});

// Basic error handler with structured logging
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(JSON.stringify({
    event: 'unhandled_server_error',
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  }));
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
