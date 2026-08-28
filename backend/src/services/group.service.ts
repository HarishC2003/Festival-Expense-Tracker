import { supabaseAdmin } from '../config/supabase';
import { writeAuditLog } from '../utils/audit';

const generateCode = (): string => {
  const chars = 'ACDEFGHJKMNPQRSTUVWXYZ2345679';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export class GroupService {
  static async createGroup(name: string, description: string | undefined, ownerId: string) {
    if (name.trim().length < 3) {
      throw new Error('Group name must be at least 3 characters long.');
    }

    // Check if group name already exists globally
    const { data: existingGroup } = await supabaseAdmin
      .from('groups')
      .select('id')
      .ilike('name', name.trim())
      .is('deleted_at', null)
      .maybeSingle();

    if (existingGroup) {
      throw new Error(`A group with the name "${name.trim()}" already exists. Please choose a unique name.`);
    }

    let code = '';
    let group = null;
    let attempts = 0;

    // Retry loop for unique code generation
    while (attempts < 5) {
      code = generateCode();
      const { data, error } = await supabaseAdmin
        .from('groups')
        .insert({
          name: name.trim(),
          description,
          code,
          owner_id: ownerId,
          created_by: ownerId,
          updated_by: ownerId
        })
        .select()
        .single();
      
      if (!error && data) {
        group = data;
        break;
      }
      
      // If error is unique constraint on 'code', retry
      if (error && error.code !== '23505') {
        throw new Error(`Failed to create group: ${error.message}`);
      }
      attempts++;
    }

    if (!group) {
      throw new Error('Could not generate a unique group code after 5 attempts.');
    }

    // Add creator as approved owner
    const { error: memberError } = await supabaseAdmin
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: ownerId,
        role: 'owner',
        status: 'approved',
        decided_at: new Date().toISOString(),
        decided_by: ownerId
      });

    if (memberError) {
      // Rollback group creation if membership fails
      await supabaseAdmin.from('groups').delete().eq('id', group.id);
      throw new Error(`Failed to add owner to group: ${memberError.message}`);
    }

    // Auto-create a default Festival and Festival Year for this group to remove friction
    const currentYear = new Date().getFullYear().toString();
    const { data: festival } = await supabaseAdmin
      .from('festivals')
      .insert({
        group_id: group.id,
        name: `${name} Festival`,
        created_by: ownerId,
        updated_by: ownerId
      })
      .select()
      .single();

    if (festival) {
      const { data: newYear } = await supabaseAdmin
        .from('festival_years')
        .insert({
          group_id: group.id,
          festival_id: festival.id,
          year: currentYear,
          description: `Initial Festival Year ${currentYear}`,
          start_date: `${currentYear}-01-01`,
          end_date: `${currentYear}-12-31`,
          locked: false,
          created_by: ownerId,
          updated_by: ownerId
        })
        .select()
        .single();

      if (newYear) {
        // Add default vendors
        const defaultVendors = [
          'Flower Decorator',
          'Audio & Lighting',
          'Pooja Items Shop',
          'Annadhanam Caterer',
          'Tent & Pandhal',
          'Printer & Banners',
          'Idol Maker'
        ];
        
        await supabaseAdmin.from('vendors').insert(
          defaultVendors.map(name => ({
            name,
            group_id: group.id,
            festival_year_id: newYear.id,
            created_by: ownerId
          }))
        );
      }
    }

    await writeAuditLog({
      userId: ownerId,
      action: 'create',
      tableName: 'groups',
      recordId: group.id,
      newValue: group
    });

    return group;
  }

  static async getMyGroups(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('group_members')
      .select('role, status, groups(id, name, code, description, owner_id)')
      .eq('user_id', userId)
      .in('status', ['approved', 'pending'])
      .is('groups.deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async joinGroup(code: string, userId: string) {
    // Lookup group
    const { data: group, error: groupError } = await supabaseAdmin
      .from('groups')
      .select('id')
      .eq('code', code.toUpperCase())
      .is('deleted_at', null)
      .single();

    if (groupError || !group) {
      throw new Error('Invalid group code. Group not found.');
    }

    // Check if membership already exists
    const { data: existing } = await supabaseAdmin
      .from('group_members')
      .select('id, status')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (existing) {
       if (existing.status === 'removed' || existing.status === 'rejected') {
          // Update status to pending
          const { data, error } = await supabaseAdmin
            .from('group_members')
            .update({ status: 'pending', updated_at: new Date().toISOString() })
            .eq('id', existing.id)
            .select()
            .single();
          if (error) throw error;
          return data;
       } else {
          throw new Error('You have already requested to join this group or are already a member.');
       }
    }

    // Create pending membership
    const { data, error } = await supabaseAdmin
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        role: 'editor',
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('You have already requested to join this group or are already a member.');
      }
      throw error;
    }

    return data;
  }

  static async getGroupMembers(groupId: string) {
    const { data, error } = await supabaseAdmin
      .from('group_members')
      .select('*, users!user_id(name, email, phone)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async updateMemberStatus(groupId: string, targetUserId: string, newStatus: string, actionByUserId: string) {
    if (!['approved', 'rejected', 'removed'].includes(newStatus)) {
      throw new Error('Invalid status');
    }

    // Owner cannot remove themselves (ownership transfer is separate)
    if (newStatus === 'removed' && targetUserId === actionByUserId) {
        throw new Error('Owner cannot remove themselves from the group');
    }

    const { data, error } = await supabaseAdmin
      .from('group_members')
      .update({
        status: newStatus,
        decided_at: new Date().toISOString(),
        decided_by: actionByUserId,
        updated_at: new Date().toISOString()
      })
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId: actionByUserId,
      action: 'update',
      tableName: 'group_members',
      recordId: data.id,
      newValue: { status: newStatus }
    });

    return data;
  }

  static async updateMemberRole(groupId: string, targetUserId: string, newRole: string, actionByUserId: string) {
    if (!['owner', 'editor', 'viewer'].includes(newRole)) {
      throw new Error('Invalid role');
    }

    if (targetUserId === actionByUserId) {
      throw new Error('Owner cannot change their own role');
    }

    const { data, error } = await supabaseAdmin
      .from('group_members')
      .update({
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('group_id', groupId)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId: actionByUserId,
      action: 'update',
      tableName: 'group_members',
      recordId: data.id,
      newValue: { role: newRole }
    });

    return data;
  }
}
