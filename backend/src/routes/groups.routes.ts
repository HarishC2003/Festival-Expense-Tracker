import { Router } from 'express';
import { requireAuth, requireGroupAccess } from '../middleware/auth.middleware';
import { GroupService } from '../services/group.service';
import { z } from 'zod';

const router = Router();

const createGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

const joinGroupSchema = z.object({
  code: z.string().length(6)
});

const roleSchema = z.object({
  role: z.enum(['owner', 'editor', 'viewer'])
});

// Create a group
router.post('/', requireAuth, async (req, res) => {
  try {
    const parsed = createGroupSchema.parse(req.body);
    const group = await GroupService.createGroup(parsed.name, parsed.description, req.user.id);
    res.status(201).json(group);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// List my groups
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const groups = await GroupService.getMyGroups(req.user.id);
    res.json(groups);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Join group via code
router.post('/join', requireAuth, async (req, res) => {
  try {
    const parsed = joinGroupSchema.parse(req.body);
    const member = await GroupService.joinGroup(parsed.code, req.user.id);
    res.status(201).json({ message: 'Join request sent successfully', member });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET group members (Requires active group in X-Group-Id header)
router.get('/members', requireAuth, requireGroupAccess(['owner', 'editor', 'viewer']), async (req, res) => {
  try {
    const members = await GroupService.getGroupMembers(req.groupId!);
    res.json(members);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Approve member
router.post('/members/:userId/approve', requireAuth, requireGroupAccess(['owner']), async (req, res) => {
  try {
    const member = await GroupService.updateMemberStatus(req.groupId!, (req.params.userId as string), 'approved', req.user.id);
    res.json(member);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Reject member
router.post('/members/:userId/reject', requireAuth, requireGroupAccess(['owner']), async (req, res) => {
  try {
    const member = await GroupService.updateMemberStatus(req.groupId!, (req.params.userId as string), 'rejected', req.user.id);
    res.json(member);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Remove member
router.post('/members/:userId/remove', requireAuth, requireGroupAccess(['owner']), async (req, res) => {
  try {
    const member = await GroupService.updateMemberStatus(req.groupId!, (req.params.userId as string), 'removed', req.user.id);
    res.json(member);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update member role
router.patch('/members/:userId/role', requireAuth, requireGroupAccess(['owner']), async (req, res) => {
  try {
    const parsed = roleSchema.parse(req.body);
    const member = await GroupService.updateMemberRole(req.groupId!, (req.params.userId as string), parsed.role, req.user.id);
    res.json(member);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
