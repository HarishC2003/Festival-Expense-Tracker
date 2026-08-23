import { supabaseAdmin } from '../config/supabase';
import { writeAuditLog } from '../utils/audit';

export class MasterDataService {
  static async getAll(tableName: string, yearId: string, groupId: string, extraSelect = '*') {
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select(extraSelect)
      .eq('festival_year_id', yearId)
      .eq('group_id', groupId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async create(tableName: string, data: any, userId: string, groupId: string) {
    const { data: record, error } = await supabaseAdmin
      .from(tableName)
      .insert({ ...data, created_by: userId, group_id: groupId })
      .select()
      .single();
    
    if (error) throw error;

    await writeAuditLog({
      userId,
      action: 'create',
      tableName,
      recordId: record.id,
      newValue: record
    });
    return record;
  }

  static async update(tableName: string, id: string, data: any, userId: string, groupId: string) {
    const { data: oldRecord } = await supabaseAdmin.from(tableName).select('*').eq('id', id).eq('group_id', groupId).single();
    
    if (!oldRecord) throw new Error('Record not found or access denied');

    const { data: record, error } = await supabaseAdmin
      .from(tableName)
      .update({ ...data, updated_by: userId })
      .eq('id', id)
      .eq('group_id', groupId)
      .select()
      .single();
    
    if (error) throw error;

    await writeAuditLog({
      userId,
      action: 'update',
      tableName,
      recordId: record.id,
      oldValue: oldRecord,
      newValue: record
    });
    return record;
  }

  static async softDelete(tableName: string, id: string, userId: string, groupId: string) {
    const { data: oldRecord } = await supabaseAdmin.from(tableName).select('*').eq('id', id).eq('group_id', groupId).single();
    
    if (!oldRecord) throw new Error('Record not found or access denied');

    const { data: record, error } = await supabaseAdmin
      .from(tableName)
      .update({ deleted_at: new Date().toISOString(), updated_by: userId })
      .eq('id', id)
      .eq('group_id', groupId)
      .select()
      .single();
    
    if (error) throw error;

    await writeAuditLog({
      userId,
      action: 'delete',
      tableName,
      recordId: id,
      oldValue: oldRecord,
      newValue: record
    });
    return record;
  }
}
