import { Router } from 'express';
import { MasterDataService } from '../services/masterData.service';
import { requireAuth, requireGroupAccess } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();
// Allowed roles for writing master data in a group
const writeRoles = ['owner', 'editor'];

const schemas: Record<string, z.ZodTypeAny> = {
  committee_members: z.object({ name: z.string().min(1), email: z.string().email().optional().nullable(), phone: z.string().optional().nullable(), role_title: z.string().optional().nullable(), active: z.boolean().optional(), festival_year_id: z.string().uuid() }),
  vendor_categories: z.object({ name: z.string().min(1), description: z.string().optional(), festival_year_id: z.string().uuid() }),
  vendors: z.object({ name: z.string().min(1), contact_person: z.string().optional(), phone: z.string().optional(), category_id: z.string().uuid().optional().nullable(), festival_year_id: z.string().uuid() }),
  income_categories: z.object({ name: z.string().min(1), type: z.string().min(1), festival_year_id: z.string().uuid() }),
  expense_categories: z.object({ name: z.string().min(1), type: z.string().min(1), festival_year_id: z.string().uuid() }),
  payment_methods: z.object({ name: z.string().min(1), festival_year_id: z.string().uuid() }),
  units: z.object({ name: z.string().min(1), abbreviation: z.string().min(1), festival_year_id: z.string().uuid() })
};

const tables = Object.keys(schemas);

tables.forEach(tableName => {
  // GET all
  router.get(`/${tableName}`, requireAuth, requireGroupAccess(), async (req, res) => {
    try {
      const yearId = req.query.yearId as string;
      if (!yearId) return res.status(400).json({ error: 'yearId is required' });
      
      let extraSelect = '*';
      if (tableName === 'vendors') extraSelect = '*, vendor_categories(name)';
      
      const data = await MasterDataService.getAll(tableName, yearId, req.groupId!, extraSelect);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // CREATE
  router.post(`/${tableName}`, requireAuth, requireGroupAccess(writeRoles), async (req, res) => {
    try {
      const parsed = schemas[tableName].parse(req.body);
      const data = await MasterDataService.create(tableName, parsed, req.user.id, req.groupId!);
      res.status(201).json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // UPDATE
  router.put(`/${tableName}/:id`, requireAuth, requireGroupAccess(writeRoles), async (req, res) => {
    try {
      const parsed = schemas[tableName].parse(req.body);
      const data = await MasterDataService.update(tableName, (req.params.id as string), parsed, req.user.id, req.groupId!);
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // DELETE (Soft)
  router.delete(`/${tableName}/:id`, requireAuth, requireGroupAccess(writeRoles), async (req, res) => {
    try {
      const data = await MasterDataService.softDelete(tableName, (req.params.id as string), req.user.id, req.groupId!);
      res.json({ message: 'Deleted successfully', data });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });
});

export default router;
