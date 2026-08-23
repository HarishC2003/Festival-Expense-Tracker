import { Request, Response, NextFunction } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';

// Extend Express Request object to include user and role
declare global {
  namespace Express {
    interface Request {
      user?: any;
      role?: string;
      isPlatformAdmin?: boolean;
      groupId?: string;
      groupRole?: string;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(JSON.stringify({ event: 'unauthorized_access', reason: 'Missing authorization header', path: req.path, ip: req.ip, timestamp: new Date().toISOString() }));
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];

  // Verify the JWT token
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.warn(JSON.stringify({ event: 'unauthorized_access', reason: 'Invalid token', details: error?.message, path: req.path, ip: req.ip, timestamp: new Date().toISOString() }));
    return res.status(401).json({ error: 'Unauthorized', details: error?.message });
  }

  req.user = user;
  
  // Custom claim 'role' should be set in JWT. If not, fallback to fetching from DB.
  // Assuming we store it in app_metadata or fetch it. For now, fetch from users table.
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    console.warn(JSON.stringify({ event: 'forbidden_access', reason: 'Role not found', userId: user.id, error: userError, path: req.path, ip: req.ip, timestamp: new Date().toISOString() }));
    return res.status(403).json({ error: 'Role not found', details: userError });
  }

  req.role = userData.role;
  req.isPlatformAdmin = userData.is_platform_admin;

  next();
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role || !allowedRoles.includes(req.role)) {
      console.warn(JSON.stringify({ event: 'forbidden_access', reason: 'Insufficient platform role', userId: req.user?.id, path: req.path, ip: req.ip, timestamp: new Date().toISOString() }));
      return res.status(403).json({ error: 'Forbidden: Insufficient platform permissions' });
    }
    next();
  };
};

export const requirePlatformAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isPlatformAdmin) {
    console.warn(JSON.stringify({ event: 'forbidden_access', reason: 'Not platform admin', userId: req.user?.id, path: req.path, ip: req.ip, timestamp: new Date().toISOString() }));
    return res.status(403).json({ error: 'Forbidden: Platform Admin access required' });
  }
  next();
};

export const requireGroupAccess = (allowedRoles?: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const groupId = req.headers['x-group-id'] as string;
    
    if (!groupId) {
      console.warn("requireGroupAccess: Missing X-Group-Id header", req.path);
      return res.status(400).json({ error: 'Missing X-Group-Id header' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check membership in the specified group
    const { data: member, error } = await supabaseAdmin
      .from('group_members')
      .select('role, status')
      .eq('group_id', groupId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !member || member.status !== 'approved') {
      console.warn(JSON.stringify({ event: 'forbidden_access', reason: 'Not an approved member', userId: req.user.id, groupId, path: req.path, ip: req.ip, timestamp: new Date().toISOString() }));
      return res.status(403).json({ error: 'Forbidden: You do not have active access to this group' });
    }

    // Check role if specified
    if (allowedRoles && !allowedRoles.includes(member.role)) {
      console.warn(JSON.stringify({ event: 'forbidden_access', reason: 'Insufficient group role', userId: req.user.id, groupId, role: member.role, path: req.path, ip: req.ip, timestamp: new Date().toISOString() }));
      return res.status(403).json({ error: 'Forbidden: Insufficient group permissions' });
    }

    req.groupId = groupId;
    req.groupRole = member.role;
    next();
  };
};
