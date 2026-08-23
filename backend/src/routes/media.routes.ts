import { Router } from 'express';
import { MediaService } from '../services/media.service';
import { requireAuth, requireGroupAccess } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();

const albumSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  festival_year_id: z.string().uuid()
});

const galleryItemSchema = z.object({
  caption: z.string().optional().nullable(),
  file_url: z.string().min(1),
  type: z.enum(['photo', 'video']),
  album_id: z.string().uuid(),
  festival_year_id: z.string().uuid()
});

const documentSchema = z.object({
  title: z.string().min(1),
  notes: z.string().optional().nullable(),
  file_url: z.string().min(1),
  category: z.enum(['bill', 'invoice', 'receipt', 'permission_letter', 'certificate', 'poster', 'other']),
  festival_year_id: z.string().uuid()
});

// ALBUMS
router.get('/albums', requireAuth, requireGroupAccess(), async (req, res) => {
  try {
    const yearId = req.query.yearId as string;
    const data = await MediaService.getAlbums(yearId, req.groupId!);
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post('/albums', requireAuth, requireGroupAccess(['owner', 'editor']), async (req, res) => {
  try {
    const parsed = albumSchema.parse(req.body);
    const data = await MediaService.createAlbum(parsed, req.user.id, req.groupId!);
    res.status(201).json(data);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.put('/albums/:id', requireAuth, requireGroupAccess(['owner']), async (req, res) => {
  try {
    const parsed = albumSchema.parse(req.body);
    const data = await MediaService.updateAlbum((req.params.id as string), parsed, req.groupId!);
    res.json(data);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.delete('/albums/:id', requireAuth, requireGroupAccess(['owner']), async (req, res) => {
  try {
    await MediaService.deleteAlbum((req.params.id as string), req.groupId!);
    res.status(204).send();
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// GALLERY ITEMS
router.get('/gallery', requireAuth, requireGroupAccess(), async (req, res) => {
  try {
    const albumId = req.query.albumId as string;
    const data = await MediaService.getGalleryItems(albumId, req.groupId!);
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post('/gallery', requireAuth, requireGroupAccess(['owner', 'editor']), async (req, res) => {
  try {
    const parsed = galleryItemSchema.parse(req.body);
    const data = await MediaService.createGalleryItem(parsed, req.user.id, req.groupId!);
    res.status(201).json(data);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.delete('/gallery/:id', requireAuth, requireGroupAccess(['owner', 'editor']), async (req, res) => {
  try {
    await MediaService.deleteGalleryItem((req.params.id as string), req.groupId!);
    res.status(204).send();
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// DOCUMENTS
router.get('/documents', requireAuth, requireGroupAccess(), async (req, res) => {
  try {
    const yearId = req.query.yearId as string;
    const data = await MediaService.getDocuments(yearId, req.groupId!);
    res.json(data);
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

router.post('/documents', requireAuth, requireGroupAccess(['owner', 'editor']), async (req, res) => {
  try {
    const parsed = documentSchema.parse(req.body);
    const data = await MediaService.createDocument(parsed, req.user.id, req.groupId!);
    res.status(201).json(data);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.put('/documents/:id', requireAuth, requireGroupAccess(['owner']), async (req, res) => {
  try {
    const parsed = documentSchema.partial().parse(req.body);
    const data = await MediaService.updateDocument((req.params.id as string), parsed, req.groupId!);
    res.json(data);
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

router.delete('/documents/:id', requireAuth, requireGroupAccess(['owner']), async (req, res) => {
  try {
    await MediaService.deleteDocument((req.params.id as string), req.groupId!);
    res.status(204).send();
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

export default router;
