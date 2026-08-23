import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/email.service';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { supabase } from '../config/supabase';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(1),
  phone: z.string().optional(),
});

// Login Rate Limiter: max 5 failed attempts per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Invalid credentials' }, // Non-revealing error message for rate limit
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/login — Authenticates user with rate limiting
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const parsed = loginSchema.parse(req.body);
    
    // We proxy the login request to Supabase to enforce the backend rate limiter
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.email,
      password: parsed.password,
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ session: data.session });
  } catch (error: any) {
    res.status(400).json({ error: 'Invalid credentials' });
  }
});

// POST /api/auth/logout — Invalidates session server-side
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // We pass the JWT to supabase and sign out globally
      await supabase.auth.admin.signOut(token, 'global');
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// POST /api/auth/register — Creates user and sends OTP
router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.parse(req.body);
    const user = await AuthService.register(parsed.email, parsed.password, parsed.name, parsed.phone);

    if (!user) throw new Error('User creation failed');

    // Generate and send OTP
    const otp = await AuthService.createOTP(user.id, parsed.email);
    await EmailService.sendOTP(parsed.name, parsed.email, otp);

    res.status(201).json({
      message: 'Registration successful. Check your email for the 6-digit verification code.',
      userId: user.id,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues[0].message });
    }
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

// POST /api/auth/verify-otp — Verifies OTP code
const verifyOTPSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6),
});

router.post('/verify-otp', async (req, res) => {
  try {
    const parsed = verifyOTPSchema.parse(req.body);
    const verified = await AuthService.verifyOTP(parsed.userId, parsed.code);

    if (!verified) {
      return res.status(400).json({ error: 'Invalid or expired OTP code. Please try again.' });
    }

    res.json({ message: 'Email verified successfully! Your account is now active.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Verification failed' });
  }
});

// POST /api/auth/resend-otp — Resend OTP code
const resendOTPSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
});

router.post('/resend-otp', async (req, res) => {
  try {
    const parsed = resendOTPSchema.parse(req.body);
    const otp = await AuthService.createOTP(parsed.userId, parsed.email);
    await EmailService.sendOTP(parsed.name, parsed.email, otp);
    res.json({ message: 'A new verification code has been sent to your email.' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to resend OTP' });
  }
});

// PUT /api/auth/users/:id/role — Update user role (admin only)
const updateRoleSchema = z.object({
  role: z.enum(['super_admin', 'treasurer', 'committee_member', 'volunteer', 'viewer']),
});

router.put('/users/:id/role', requireAuth, requireRole(['super_admin']), async (req, res) => {
  try {
    const parsed = updateRoleSchema.parse(req.body);
    const user = await AuthService.updateRole((req.params.id as string), parsed.role, req.user.id);
    // Notify user of role change (non-blocking)
    EmailService.sendRoleUpdate(user.name, user.email, parsed.role).catch(err =>
      console.error('Role update email failed:', err.message)
    );
    res.json({ message: 'Role updated successfully', user });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Role update failed' });
  }
});

export default router;
