import { Router } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { requireAuth, requireGroupAccess } from '../middleware/auth.middleware';

const router = Router();

router.get('/summary', requireAuth, requireGroupAccess(), async (req, res) => {
  try {
    const yearId = req.query.yearId as string;
    if (!yearId) return res.status(400).json({ error: 'yearId is required' });
    const data = await DashboardService.getSummary(yearId, req.groupId!);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/transactions', requireAuth, requireGroupAccess(), async (req, res) => {
  try {
    const yearId = req.query.yearId as string;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    if (!yearId) return res.status(400).json({ error: 'yearId is required' });
    const data = await DashboardService.getTransactions(yearId, req.groupId!, startDate, endDate);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
