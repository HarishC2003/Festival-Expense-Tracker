import { supabase, supabaseAdmin } from '../config/supabase';
import { writeAuditLog } from '../utils/audit';
import crypto from 'crypto';

export class AuthService {
  static async register(email: string, password: string, name: string, phone?: string) {
    // Register with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        }
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      // Supabase Email Enumeration Protection: If the user already exists,
      // signUp returns a fake user object with an empty identities array.
      // We must catch this before inserting into public.users to prevent FK constraint errors.
      if (authData.user.identities && authData.user.identities.length === 0) {
        throw new Error('Email address is already registered');
      }

      // Create user record in our users table (role and status default to 'pending')
      const { data: userData, error: dbError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          name,
          email,
          phone,
        })
        .select()
        .single();

      if (dbError) {
          console.error("DB error during registration:", dbError);
          if (dbError.code === '23505') { // Postgres Unique Violation code
            throw new Error('An account with this email already exists.');
          }
          if (dbError.code === '23503') { // Postgres Foreign Key Violation code
            throw new Error('Registration failed due to a synchronization error. Please try again or use a different email.');
          }
          throw new Error('Failed to create user profile: ' + dbError.message);
      }

      // Log the registration
      await writeAuditLog({
        userId: userData.id,
        action: 'create',
        tableName: 'users',
        recordId: userData.id,
        newValue: userData
      });

      return userData;
    }
  }

  static async updateRole(userId: string, newRole: string, adminId: string) {
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId: adminId,
      action: 'update',
      tableName: 'users',
      recordId: userId,
      newValue: { role: newRole }
    });

    return userData;
  }
  static generateOTPCode(): string {
    // Cryptographically secure 6-digit OTP
    return crypto.randomInt(100000, 999999).toString();
  }

  static async createOTP(userId: string, email: string): Promise<string> {
    const otp = this.generateOTPCode();

    // Invalidate any previous unused OTPs for this user
    await supabaseAdmin
      .from('email_otps')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('used_at', null);

    // Insert new OTP (expires in 10 minutes)
    const { error } = await supabaseAdmin.from('email_otps').insert({
      user_id: userId,
      email,
      otp_code: otp,
    });

    if (error) throw error;
    return otp;
  }

  static async verifyOTP(userId: string, code: string): Promise<boolean> {
    const { data: record, error } = await supabaseAdmin
      .from('email_otps')
      .select('id, expires_at, used_at')
      .eq('user_id', userId)
      .eq('otp_code', code)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !record) return false;
    if (new Date(record.expires_at) < new Date()) return false;

    // Mark OTP as used
    await supabaseAdmin
      .from('email_otps')
      .update({ used_at: new Date().toISOString() })
      .eq('id', record.id);

    // Mark user as verified in the users table
    await supabaseAdmin
      .from('users')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', userId);

    // CRITICAL: Tell Supabase Auth that the email is confirmed so they can log in
    await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });

    return true;
  }
}
