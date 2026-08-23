import { supabaseAdmin } from '../config/supabase';
import { writeAuditLog } from '../utils/audit';

export class ExpenseService {
  static async getExpenses(yearId: string, groupId: string) {
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .select('*, committee_members(name), vendors(name), expense_categories(name), payment_methods(name), users!expenses_created_by_fkey(email)')
      .eq('festival_year_id', yearId)
      .eq('group_id', groupId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getExpenseHistory(expenseId: string, groupId: string) {
    // Verify expense belongs to group first
    const { data: exp } = await supabaseAdmin.from('expenses').select('id').eq('id', expenseId).eq('group_id', groupId).single();
    if (!exp) throw new Error('Expense not found');

    const { data, error } = await supabaseAdmin
      .from('expense_status_history')
      .select('*, users(name, email)')
      .eq('expense_id', expenseId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }

  static async createExpense(data: any, userId: string, groupId: string) {
    let expense_category_id = data.expense_category_id;
    if (!expense_category_id && data.category_name) {
      const { data: existingCat } = await supabaseAdmin.from('expense_categories').select('id').eq('festival_year_id', data.festival_year_id).eq('group_id', groupId).ilike('name', data.category_name).limit(1).single();
      if (existingCat) expense_category_id = existingCat.id;
      else {
        const { data: newCat, error: insertError } = await supabaseAdmin.from('expense_categories').insert({ name: data.category_name, festival_year_id: data.festival_year_id, group_id: groupId, created_by: userId }).select('id').single();
        if (insertError) throw new Error(`Failed to create category: ${insertError.message}`);
        if (newCat) expense_category_id = newCat.id;
      }
    }

    // 2. Auto-create Vendor
    let vendor_id = data.vendor_id;
    if (!vendor_id && data.vendor_name) {
      const { data: existingVendor, error: findError } = await supabaseAdmin.from('vendors').select('id').eq('group_id', groupId).ilike('name', data.vendor_name).limit(1).single();
      if (existingVendor) vendor_id = existingVendor.id;
      else {
        const { data: newVendor, error: insertError } = await supabaseAdmin.from('vendors').insert({ 
          name: data.vendor_name, 
          group_id: groupId, 
          festival_year_id: data.festival_year_id,
          created_by: userId 
        }).select('id').single();
        if (insertError) throw new Error(`Failed to create vendor: ${insertError.message}`);
        if (newVendor) vendor_id = newVendor.id;
      }
    }

    // 3. Auto-create Payment Method
    let payment_method_id = data.payment_method_id;
    if (!payment_method_id && data.payment_method_name) {
      const { data: existingPM } = await supabaseAdmin.from('payment_methods').select('id').eq('festival_year_id', data.festival_year_id).eq('group_id', groupId).ilike('name', data.payment_method_name).limit(1).single();
      if (existingPM) payment_method_id = existingPM.id;
      else {
        const { data: newPM, error: insertError } = await supabaseAdmin.from('payment_methods').insert({ name: data.payment_method_name, festival_year_id: data.festival_year_id, group_id: groupId, created_by: userId }).select('id').single();
        if (insertError) throw new Error(`Failed to create payment method: ${insertError.message}`);
        if (newPM) payment_method_id = newPM.id;
      }
    }

    const payload = { ...data };
    delete payload.category_name;
    delete payload.vendor_name;
    delete payload.payment_method_name;

    // Validate Vendor
    if (!vendor_id) {
      throw new Error('Vendor is required for all expenses');
    }

    const { data: record, error } = await supabaseAdmin.from('expenses')
      .insert({ 
        ...payload, 
        expense_category_id, 
        vendor_id, 
        payment_method_id, 
        created_by: userId, 
        group_id: groupId,
        fund_source: data.fund_source || 'committee'
      })
      .select().single();
    if (error) throw error;
    
    await this.logTransition(record.id, null, 'pending', userId, 'Expense submitted');
    await writeAuditLog({ userId, action: 'create', tableName: 'expenses', recordId: record.id, newValue: record });
    return record;
  }

  static async updateExpense(id: string, data: any, userId: string, groupId: string) {
    const { data: oldRecord } = await supabaseAdmin.from('expenses').select('*').eq('id', id).eq('group_id', groupId).single();
    if (!oldRecord) throw new Error('Expense not found');

    // 1. Auto-create Category
    let expense_category_id = data.expense_category_id || oldRecord.expense_category_id;
    if (data.category_name) {
      const { data: existingCat } = await supabaseAdmin.from('expense_categories').select('id').eq('festival_year_id', data.festival_year_id || oldRecord.festival_year_id).eq('group_id', groupId).ilike('name', data.category_name).limit(1).single();
      if (existingCat) expense_category_id = existingCat.id;
      else {
        const { data: newCat } = await supabaseAdmin.from('expense_categories').insert({ name: data.category_name, festival_year_id: data.festival_year_id || oldRecord.festival_year_id, group_id: groupId, created_by: userId }).select('id').single();
        if (newCat) expense_category_id = newCat.id;
      }
    }

    // 2. Auto-create Vendor
    let vendor_id = data.vendor_id || oldRecord.vendor_id;
    if (data.vendor_name) {
      const { data: existingVendor } = await supabaseAdmin.from('vendors').select('id').eq('group_id', groupId).ilike('name', data.vendor_name).limit(1).single();
      if (existingVendor) vendor_id = existingVendor.id;
      else {
        const { data: newVendor } = await supabaseAdmin.from('vendors').insert({ 
          name: data.vendor_name, 
          group_id: groupId, 
          festival_year_id: data.festival_year_id || oldRecord.festival_year_id,
          created_by: userId 
        }).select('id').single();
        if (newVendor) vendor_id = newVendor.id;
      }
    }

    // 3. Auto-create Payment Method
    let payment_method_id = data.payment_method_id || oldRecord.payment_method_id;
    if (data.payment_method_name) {
      const { data: existingPM } = await supabaseAdmin.from('payment_methods').select('id').eq('festival_year_id', data.festival_year_id || oldRecord.festival_year_id).eq('group_id', groupId).ilike('name', data.payment_method_name).limit(1).single();
      if (existingPM) payment_method_id = existingPM.id;
      else {
        const { data: newPM } = await supabaseAdmin.from('payment_methods').insert({ name: data.payment_method_name, festival_year_id: data.festival_year_id || oldRecord.festival_year_id, group_id: groupId, created_by: userId }).select('id').single();
        if (newPM) payment_method_id = newPM.id;
      }
    }

    const payload: any = {};
    if (data.amount !== undefined) payload.amount = data.amount;
    if (data.expense_date !== undefined) payload.expense_date = data.expense_date;
    if (data.description !== undefined) payload.description = data.description;
    if (data.paid_by !== undefined) payload.paid_by = data.paid_by;
    if (data.receipt_image_url !== undefined) payload.receipt_image_url = data.receipt_image_url;
    if (data.fund_source !== undefined) payload.fund_source = data.fund_source;
    if (data.bill_available !== undefined) payload.bill_available = data.bill_available;

    const { data: record, error } = await supabaseAdmin.from('expenses')
      .update({ 
        ...payload,
        expense_category_id,
        vendor_id,
        payment_method_id,
        updated_by: userId 
      })
      .eq('id', id)
      .eq('group_id', groupId)
      .select().single();
    if (error) throw error;

    await writeAuditLog({ userId, action: 'update', tableName: 'expenses', recordId: record.id, oldValue: oldRecord, newValue: record });
    return record;
  }

  static async deleteExpense(id: string, userId: string, groupId: string) {
    const { data: oldRecord } = await supabaseAdmin.from('expenses').select('*').eq('id', id).eq('group_id', groupId).single();
    if (!oldRecord) throw new Error('Expense not found');

    const { data: record, error } = await supabaseAdmin.from('expenses')
      .update({ deleted_at: new Date().toISOString(), updated_by: userId })
      .eq('id', id)
      .eq('group_id', groupId)
      .select().single();
    if (error) throw error;

    await writeAuditLog({ userId, action: 'delete', tableName: 'expenses', recordId: record.id, oldValue: oldRecord, newValue: record });
    return record;
  }

  // State Machine Transitions
  static async approveExpense(id: string, userId: string, groupId: string) {
    return this.transitionStatus(id, groupId, 'pending', 'approved', userId, {
      approved_by: userId,
      approved_at: new Date().toISOString()
    }, 'Expense approved');
  }

  static async rejectExpense(id: string, reason: string, userId: string, groupId: string) {
    return this.transitionStatus(id, groupId, 'pending', 'rejected', userId, {
      rejected_reason: reason
    }, reason);
  }

  static async reimburseExpense(id: string, userId: string, groupRole: string, groupId: string) {
    const { data: oldRecord } = await supabaseAdmin.from('expenses').select('created_by').eq('id', id).eq('group_id', groupId).single();
    if (!oldRecord) throw new Error('Expense not found');
    if (!['owner', 'editor'].includes(groupRole) && oldRecord.created_by !== userId) {
      throw new Error('Only owners/editors or the original submitter can mark as reimbursed');
    }

    return this.transitionStatus(id, groupId, 'approved', 'reimbursed', userId, {
      reimbursed_at: new Date().toISOString()
    }, 'Expense reimbursed');
  }

  private static async transitionStatus(id: string, groupId: string, expectedFrom: string, toStatus: string, userId: string, extraUpdates: any, comment: string) {
    const { data: oldRecord } = await supabaseAdmin.from('expenses').select('*').eq('id', id).eq('group_id', groupId).single();
    if (!oldRecord) throw new Error('Expense not found');
    if (oldRecord.status !== expectedFrom) throw new Error(`Cannot transition from ${oldRecord.status} to ${toStatus}`);

    const { data: record, error } = await supabaseAdmin.from('expenses')
      .update({ status: toStatus, updated_by: userId, ...extraUpdates })
      .eq('id', id)
      .eq('group_id', groupId)
      .select().single();
    if (error) throw error;

    await this.logTransition(id, oldRecord.status, toStatus, userId, comment);
    await writeAuditLog({ userId, action: 'update', tableName: 'expenses', recordId: record.id, oldValue: oldRecord, newValue: record });
    
    return record;
  }

  private static async logTransition(expenseId: string, fromStatus: string | null, toStatus: string, userId: string, comment: string) {
    await supabaseAdmin.from('expense_status_history').insert({
      expense_id: expenseId,
      from_status: fromStatus,
      to_status: toStatus,
      changed_by: userId,
      comment
    });
  }
}
