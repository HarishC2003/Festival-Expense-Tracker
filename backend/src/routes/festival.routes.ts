import { Router } from 'express';
import { FestivalService } from '../services/festival.service';
import { requireAuth, requireGroupAccess } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../config/supabase';
import { z } from 'zod';

const router = Router();

const createYearSchema = z.object({
  festival_id: z.string().uuid(),
  year: z.number().int().min(1900).max(2100),
  start_date: z.string(), // Ideally validate YYYY-MM-DD
  end_date: z.string(),
  name: z.string().optional(),
  base_year_id: z.string().uuid().nullable().optional(),
});

router.post('/auto-init', requireAuth, requireGroupAccess(['owner', 'editor']), async (req, res) => {
  try {
    const groupId = req.groupId!;
    
    // Check if festival exists
    let { data: festival } = await supabaseAdmin
      .from('festivals')
      .select('id')
      .eq('group_id', groupId)
      .single();

    if (!festival) {
      const { data: newFest, error } = await supabaseAdmin
        .from('festivals')
        .insert({
          group_id: groupId,
          name: `Default Festival`,
          created_by: req.user.id,
          updated_by: req.user.id
        })
        .select()
        .single();
        
      if (error) throw error;
      festival = newFest;
    }

    // Check if open year exists
    let { data: year } = await supabaseAdmin
      .from('festival_years')
      .select('id, festival_id, year, locked, description')
      .eq('group_id', groupId)
      .eq('locked', false)
      .order('year', { ascending: false })
      .limit(1)
      .single();

    if (!year) {
      const currentYear = new Date().getFullYear().toString();
      const { data: newYear, error } = await supabaseAdmin
        .from('festival_years')
        .insert({
          group_id: groupId,
          festival_id: festival!.id,
          year: currentYear,
          description: `Initial Festival Year ${currentYear}`,
          start_date: `${currentYear}-01-01`,
          end_date: `${currentYear}-12-31`,
          locked: false,
          created_by: req.user.id,
          updated_by: req.user.id
        })
        .select('id, festival_id, year, locked, description')
        .single();
        
      if (error) throw error;
      year = newYear;
    }

    res.json({ message: 'Auto-init complete', year });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Auto-init failed' });
  }
});

router.post('/years', requireAuth, requireGroupAccess(['owner', 'editor']), async (req, res) => {
  try {
    const parsed = createYearSchema.parse(req.body);
    const newYear = await FestivalService.createYear(
      parsed.base_year_id || null, 
      {
        festival_id: parsed.festival_id,
        year: parsed.year,
        start_date: parsed.start_date,
        end_date: parsed.end_date,
        name: parsed.name,
      },
      req.user.id,
      req.groupId!
    );
    res.status(201).json({ message: 'Festival year created successfully', year: newYear });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Creation failed' });
  }
});

router.post('/years/:id/lock', requireAuth, requireGroupAccess(['owner']), async (req, res) => {
  try {
    const lockedYear = await FestivalService.lockYear((req.params.id as string), req.user.id, req.groupId!);
    res.json({ message: 'Festival year locked successfully', year: lockedYear });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Locking failed' });
  }
});

export default router;
