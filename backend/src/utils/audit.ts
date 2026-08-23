import { supabaseAdmin } from '../config/supabase';

export type AuditAction = 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'login' | 'logout';

interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  tableName: string;
  recordId: string;
  oldValue?: any;
  newValue?: any;
}

/**
 * Writes an entry to the audit_log table.
 * Uses the service role key to bypass RLS, as clients cannot insert directly.
 */
export const writeAuditLog = async (entry: AuditLogEntry) => {
  const { error } = await supabaseAdmin.from('audit_log').insert({
    user_id: entry.userId,
    action: entry.action,
    table_name: entry.tableName,
    record_id: entry.recordId,
    old_value: entry.oldValue || null,
    new_value: entry.newValue || null,
  });

  if (error) {
    console.error('Failed to write audit log:', error);
    // Depending on strictness, we might want to throw here to fail the transaction,
    // but typically we don't want audit log failures to break user flows completely, 
    // or maybe we DO for a strict ERP. Let's log error for now.
  }
};
