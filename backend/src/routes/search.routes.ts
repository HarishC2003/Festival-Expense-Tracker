import { Router } from 'express';
import { SearchService } from '../services/search.service';
import { requireAuth, requireGroupAccess } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, requireGroupAccess(), async (req, res) => {
  try {
    const q = req.query.q as string;
    const yearId = req.query.yearId as string;
    if (!q || !yearId) return res.json({ donors: [], vendors: [], committee: [], cash: [], items: [], expenses: [] });
    
    const data = await SearchService.globalSearch(q, yearId, req.groupId!);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
