import { supabaseAdmin } from '../config/supabase';

export class AdminService {
  static async getSystemStats() {
    const [
      { count: usersCount },
      { count: groupsCount },
      { count: festivalsCount }
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('groups').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('festivals').select('*', { count: 'exact', head: true })
    ]);

    return {
      users: usersCount || 0,
      groups: groupsCount || 0,
      festivals: festivalsCount || 0,
      timestamp: new Date().toISOString()
    };
  }

  static async getAllGroups() {
    const { data, error } = await supabaseAdmin
      .from('groups')
      .select('*, group_members(count)');

    if (error) throw error;
    return data;
  }

  static async getAllUsers() {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, role, is_platform_admin, created_at');

    if (error) throw error;
    return data;
  }
}
