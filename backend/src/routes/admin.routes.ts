import { Router } from 'express';
import { requireAuth, requirePlatformAdmin } from '../middleware/auth.middleware';
import { AdminService } from '../services/admin.service';

const router = Router();

router.use(requireAuth);
router.use(requirePlatformAdmin);

router.get('/stats', async (req, res) => {
  try {
    const stats = await AdminService.getSystemStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/groups', async (req, res) => {
  try {
    const groups = await AdminService.getAllGroups();
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await AdminService.getAllUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
