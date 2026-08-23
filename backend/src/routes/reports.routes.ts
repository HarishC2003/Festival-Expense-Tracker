import { Router } from 'express';
import { ReportsService } from '../services/reports.service';
import { requireAuth, requireGroupAccess } from '../middleware/auth.middleware';

const router = Router();

router.get('/:type', requireAuth, requireGroupAccess(), async (req, res) => {
  console.log('HIT REPORTS ROUTE:', (req.params.type as string), (req.query.yearId as string), req.headers['x-group-id']);
  try {
    const yearId = req.query.yearId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    if (!yearId) return res.status(400).json({ error: 'yearId is required' });
    const data = await ReportsService.getReportData((req.params.type as string), yearId, req.groupId!, startDate, endDate);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:type/export', requireAuth, requireGroupAccess(), async (req, res) => {
  try {
    const format = req.query.format as string;
    const yearId = req.query.yearId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    if (!yearId || !format) return res.status(400).json({ error: 'yearId and format required' });
    
    const data = await ReportsService.getReportData((req.params.type as string), yearId, req.groupId!, startDate, endDate);
    
    if (format === 'pdf') await ReportsService.exportPDF(res, data, (req.params.type as string));
    else if (format === 'excel') await ReportsService.exportExcel(res, data, (req.params.type as string));
    else if (format === 'csv') await ReportsService.exportCSV(res, data, (req.params.type as string));
    else res.status(400).json({ error: 'Invalid format' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
