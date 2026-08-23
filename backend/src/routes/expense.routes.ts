import { Router } from 'express';
import { ExpenseService } from '../services/expense.service';
import { requireAuth, requireGroupAccess } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();
const adminRoles = ['owner'];

const expenseSchema = z.object({
  description: z.string().optional().nullable(),
  amount: z.number().min(0),
  expense_date: z.string().min(1),
  category_name: z.string().min(1),
  vendor_name: z.string().optional().nullable(),
  paid_by: z.string().min(1),
  festival_year_id: z.string().min(1),
  notes: z.string().optional().nullable(),
  receipt_image_url: z.string().optional().nullable(),
  payment_method_name: z.string().optional().nullable(),
  fund_source: z.string().optional().nullable(),
  bill_available: z.boolean().optional().nullable()
});

router.get('/', requireAuth, requireGroupAccess(), async (req, res) => {
  try {
    const yearId = req.query.yearId as string;
    if (!yearId) return res.status(400).json({ error: 'yearId is required' });
    const data = await ExpenseService.getExpenses(yearId, req.groupId!);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireAuth, requireGroupAccess(['owner', 'editor']), async (req, res) => {
  try {
    const parsed = expenseSchema.parse(req.body);
    const data = await ExpenseService.createExpense(parsed, req.user.id, req.groupId!);
    res.status(201).json(data);
  } catch (error: any) {
    console.error("EXPENSE POST ERROR:", error, error.message, error.stack);
    require('fs').writeFileSync('error.log', (error.message || '') + '\n' + (error.stack || '') + '\n' + JSON.stringify(error));
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', requireAuth, requireGroupAccess(['owner']), async (req, res) => {
  try {
    const parsed = expenseSchema.parse(req.body);
    const data = await ExpenseService.updateExpense((req.params.id as string), parsed, req.user.id, req.groupId!);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', requireAuth, requireGroupAccess(['owner']), async (req, res) => {
  try {
    const data = await ExpenseService.deleteExpense((req.params.id as string), req.user.id, req.groupId!);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/history', requireAuth, requireGroupAccess(), async (req, res) => {
  try {
    const data = await ExpenseService.getExpenseHistory((req.params.id as string), req.groupId!);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// State Machine Routes
router.post('/:id/approve', requireAuth, requireGroupAccess(adminRoles), async (req, res) => {
  try {
    const data = await ExpenseService.approveExpense((req.params.id as string), req.user.id, req.groupId!);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/reject', requireAuth, requireGroupAccess(adminRoles), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Rejection reason is required' });
    const data = await ExpenseService.rejectExpense((req.params.id as string), reason, req.user.id, req.groupId!);
    res.json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/reimburse', requireAuth, requireGroupAccess(adminRoles), async (req, res) => {
  try {
    const data = await ExpenseService.reimburseExpense((req.params.id as string), req.user.id, req.groupRole!, req.groupId!);
    res.json(data);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

export default router;
