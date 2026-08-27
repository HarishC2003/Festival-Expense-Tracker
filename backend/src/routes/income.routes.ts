import { Router } from 'express';
import { IncomeService } from '../services/income.service';
import { requireAuth, requireGroupAccess } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();
const writeRoles = ['owner', 'editor'];

const donorSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional()
});

const cashDonationSchema = z.object({
  donor_name: z.string().min(1),
  donor_phone: z.string().optional(),
  donor_address: z.string().optional(),
  amount: z.number().positive(),
  category_name: z.string().min(1),
  payment_method_name: z.string().min(1),
  festival_year_id: z.string().uuid(),
  donation_date: z.string(),
  notes: z.string().optional()
});

const itemDonationSchema = z.object({
  donor_name: z.string().min(1),
  donor_phone: z.string().optional(),
  donor_address: z.string().optional(),
  item_name: z.string().min(1),
  quantity: z.number().positive(),
  unit_name: z.string().min(1),
  estimated_value: z.number().nonnegative().optional(),
  category_name: z.string().min(1),
  festival_year_id: z.string().uuid(),
  donation_date: z.string(),
  notes: z.string().optional()
});

// --- DONORS ---
router.get('/donors/search', requireAuth, requireGroupAccess(), async (req, res) => {
  try {
    const query = req.query.q as string || '';
    const data = await IncomeService.searchDonors(query, req.groupId!);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/donors/:id/history', requireAuth, requireGroupAccess(), async (req, res) => {
  try {
    const data = await IncomeService.getDonorHistory((req.params.id as string), req.groupId!);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/donors', requireAuth, requireGroupAccess(writeRoles), async (req, res) => {
  try {
    const parsed = donorSchema.parse(req.body);
    const data = await IncomeService.createDonor(parsed, req.user.id, req.groupId!);
    res.status(201).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- CASH DONATIONS ---
router.get('/cash_donations', requireAuth, requireGroupAccess(), async (req, res) => {
  try {
    const yearId = req.query.yearId as string;
    if (!yearId) return res.status(400).json({ error: 'yearId is required' });
    const data = await IncomeService.getCashDonations(yearId, req.groupId!);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cash_donations', requireAuth, requireGroupAccess(writeRoles), async (req, res) => {
  try {
    const parsed = cashDonationSchema.parse(req.body);
    const data = await IncomeService.createCashDonation(parsed, req.user.id, req.groupId!);
    res.status(201).json(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') });
    }
    res.status(400).json({ error: error.message });
  }
});

router.put('/cash_donations/:id', requireAuth, requireGroupAccess(['owner']), async (req, res) => {
  try {
    const parsed = cashDonationSchema.parse(req.body);
    const data = await IncomeService.updateCashDonation((req.params.id as string), parsed, req.user.id, req.groupId!);
    res.json(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') });
    }
    res.status(400).json({ error: error.message });
  }
});

router.delete('/cash_donations/:id', requireAuth, requireGroupAccess(['owner']), async (req, res) => {
  try {
    const data = await IncomeService.deleteCashDonation((req.params.id as string), req.user.id, req.groupId!);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- ITEM DONATIONS ---
router.get('/item_donations', requireAuth, requireGroupAccess(), async (req, res) => {
  try {
    const yearId = req.query.yearId as string;
    if (!yearId) return res.status(400).json({ error: 'yearId is required' });
    const data = await IncomeService.getItemDonations(yearId, req.groupId!);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/item_donations', requireAuth, requireGroupAccess(writeRoles), async (req, res) => {
  try {
    const parsed = itemDonationSchema.parse(req.body);
    const data = await IncomeService.createItemDonation(parsed, req.user.id, req.groupId!);
    res.status(201).json(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') });
    }
    res.status(400).json({ error: error.message });
  }
});

router.put('/item_donations/:id', requireAuth, requireGroupAccess(['owner']), async (req, res) => {
  try {
    const parsed = itemDonationSchema.parse(req.body);
    const data = await IncomeService.updateItemDonation((req.params.id as string), parsed, req.user.id, req.groupId!);
    res.json(data);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') });
    }
    res.status(400).json({ error: error.message });
  }
});

router.delete('/item_donations/:id', requireAuth, requireGroupAccess(['owner']), async (req, res) => {
  try {
    const data = await IncomeService.deleteItemDonation((req.params.id as string), req.user.id, req.groupId!);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
