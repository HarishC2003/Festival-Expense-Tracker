import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('Missing Supabase Environment Variables. Some features may not work.');
}

// Client for regular auth/public data operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client using service role key (bypasses RLS)
// STRICTLY for admin tasks and audit logging
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
