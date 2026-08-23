import { supabaseAdmin } from '../config/supabase';
import { writeAuditLog } from '../utils/audit';

export class IncomeService {
  // --- DONORS ---
  static async searchDonors(query: string, groupId: string) {
    const { data, error } = await supabaseAdmin
      .from('donors')
      .select('*')
      .eq('group_id', groupId)
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .is('deleted_at', null)
      .limit(20);
    if (error) throw error;
    return data;
  }

  static async getDonorHistory(donorId: string, groupId: string) {
    const [cashRes, itemRes, donorRes] = await Promise.all([
      supabaseAdmin.from('cash_donations').select('*, festival_years(year), income_categories(name), payment_methods(name)').eq('donor_id', donorId).eq('group_id', groupId).is('deleted_at', null).order('donation_date', { ascending: false }),
      supabaseAdmin.from('item_donations').select('*, festival_years(year), income_categories(name), units(abbreviation)').eq('donor_id', donorId).eq('group_id', groupId).is('deleted_at', null).order('donation_date', { ascending: false }),
      supabaseAdmin.from('donors').select('*').eq('id', donorId).eq('group_id', groupId).single()
    ]);
    if (cashRes.error) throw cashRes.error;
    if (itemRes.error) throw itemRes.error;
    if (donorRes.error) throw donorRes.error;

    return {
      donor: donorRes.data,
      cash: cashRes.data,
      items: itemRes.data
    };
  }

  static async createDonor(data: any, userId: string, groupId: string) {
    const { data: record, error } = await supabaseAdmin.from('donors').insert({ ...data, created_by: userId, group_id: groupId }).select().single();
    if (error) throw error;
    await writeAuditLog({ userId, action: 'create', tableName: 'donors', recordId: record.id, newValue: record });
    return record;
  }

  // --- RECEIPT HELPER ---
  static async generateReceiptNumber(prefix: string, yearId: string, yearText: string) {
    const { data, error } = await supabaseAdmin.rpc('generate_receipt_number', {
      p_prefix: prefix,
      p_year_id: yearId,
      p_year_text: yearText
    });
    if (error) throw error;
    return data; // e.g. 'CD-2026-0001'
  }

  // --- CASH DONATIONS ---
  static async getCashDonations(yearId: string, groupId: string) {
    const { data, error } = await supabaseAdmin
      .from('cash_donations')
      .select('*, donors(name, phone), income_categories(name), payment_methods(name), users!cash_donations_created_by_fkey(email)')
      .eq('festival_year_id', yearId)
      .eq('group_id', groupId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async createCashDonation(data: any, userId: string, groupId: string) {
    const { data: year } = await supabaseAdmin.from('festival_years').select('year').eq('id', data.festival_year_id).eq('group_id', groupId).single();
    if (!year) throw new Error('Invalid year');

    const receipt_number = await this.generateReceiptNumber('CD', data.festival_year_id, year.year.toString());

    // 1. Auto-lookup or create Donor
    let donor_id = data.donor_id;
    if (!donor_id && data.donor_name) {
      const { data: existingDonor } = await supabaseAdmin.from('donors').select('id').eq('group_id', groupId).ilike('name', data.donor_name).is('deleted_at', null).limit(1).single();
      if (existingDonor) donor_id = existingDonor.id;
      else {
        const { data: newDonor } = await supabaseAdmin.from('donors').insert({ name: data.donor_name, group_id: groupId, created_by: userId }).select('id').single();
        if (newDonor) donor_id = newDonor.id;
      }
    }

    // 2. Auto-lookup or create Category
    let category_id = data.income_category_id;
    if (!category_id && data.category_name) {
      const { data: existingCat } = await supabaseAdmin.from('income_categories').select('id').eq('festival_year_id', data.festival_year_id).eq('group_id', groupId).ilike('name', data.category_name).limit(1).single();
      if (existingCat) category_id = existingCat.id;
      else {
        const { data: newCat } = await supabaseAdmin.from('income_categories').insert({ name: data.category_name, type: 'cash', festival_year_id: data.festival_year_id, group_id: groupId, created_by: userId }).select('id').single();
        if (newCat) category_id = newCat.id;
      }
    }

    // 3. Auto-lookup or create Payment Method
    let payment_method_id = data.payment_method_id;
    if (!payment_method_id && data.payment_method_name) {
      const { data: existingPM } = await supabaseAdmin.from('payment_methods').select('id').eq('festival_year_id', data.festival_year_id).eq('group_id', groupId).ilike('name', data.payment_method_name).limit(1).single();
      if (existingPM) payment_method_id = existingPM.id;
      else {
        const { data: newPM } = await supabaseAdmin.from('payment_methods').insert({ name: data.payment_method_name, festival_year_id: data.festival_year_id, group_id: groupId, created_by: userId }).select('id').single();
        if (newPM) payment_method_id = newPM.id;
      }
    }

    if (!donor_id) throw new Error('Donor is required');

    const { data: record, error } = await supabaseAdmin.from('cash_donations')
      .insert({ 
        festival_year_id: data.festival_year_id,
        amount: data.amount,
        donation_date: data.donation_date,
        notes: data.notes,
        donor_id,
        income_category_id: category_id,
        payment_method_id: payment_method_id,
        collected_by: null, // explicitly null, we rely on created_by for audit
        receipt_number, 
        created_by: userId, 
        group_id: groupId 
      })
      .select().single();
      
    if (error) throw error;
    if (error) throw error;
    await writeAuditLog({ userId, action: 'create', tableName: 'cash_donations', recordId: record.id, newValue: record });
    return record;
  }

  static async updateCashDonation(id: string, data: any, userId: string, groupId: string) {
    const { data: oldRecord } = await supabaseAdmin.from('cash_donations').select('*').eq('id', id).eq('group_id', groupId).single();
    if (!oldRecord) throw new Error('Cash donation not found');

    // 1. Auto-lookup or create Donor
    let donor_id = data.donor_id || oldRecord.donor_id;
    if (data.donor_name) {
      const { data: existingDonor } = await supabaseAdmin.from('donors').select('id').eq('group_id', groupId).ilike('name', data.donor_name).is('deleted_at', null).limit(1).single();
      if (existingDonor) donor_id = existingDonor.id;
      else {
        const { data: newDonor } = await supabaseAdmin.from('donors').insert({ name: data.donor_name, group_id: groupId, created_by: userId }).select('id').single();
        if (newDonor) donor_id = newDonor.id;
      }
    }

    // 2. Auto-lookup or create Category
    let category_id = data.income_category_id || oldRecord.income_category_id;
    if (data.category_name) {
      const { data: existingCat } = await supabaseAdmin.from('income_categories').select('id').eq('festival_year_id', data.festival_year_id || oldRecord.festival_year_id).eq('group_id', groupId).ilike('name', data.category_name).limit(1).single();
      if (existingCat) category_id = existingCat.id;
      else {
        const { data: newCat } = await supabaseAdmin.from('income_categories').insert({ name: data.category_name, type: 'cash', festival_year_id: data.festival_year_id || oldRecord.festival_year_id, group_id: groupId, created_by: userId }).select('id').single();
        if (newCat) category_id = newCat.id;
      }
    }

    // 3. Auto-lookup or create Payment Method
    let payment_method_id = data.payment_method_id || oldRecord.payment_method_id;
    if (data.payment_method_name) {
      const { data: existingPM } = await supabaseAdmin.from('payment_methods').select('id').eq('festival_year_id', data.festival_year_id || oldRecord.festival_year_id).eq('group_id', groupId).ilike('name', data.payment_method_name).limit(1).single();
      if (existingPM) payment_method_id = existingPM.id;
      else {
        const { data: newPM } = await supabaseAdmin.from('payment_methods').insert({ name: data.payment_method_name, festival_year_id: data.festival_year_id || oldRecord.festival_year_id, group_id: groupId, created_by: userId }).select('id').single();
        if (newPM) payment_method_id = newPM.id;
      }
    }

    const { data: record, error } = await supabaseAdmin.from('cash_donations')
      .update({
        amount: data.amount !== undefined ? data.amount : oldRecord.amount,
        donation_date: data.donation_date !== undefined ? data.donation_date : oldRecord.donation_date,
        notes: data.notes !== undefined ? data.notes : oldRecord.notes,
        donor_id,
        income_category_id: category_id,
        payment_method_id,
        updated_by: userId
      })
      .eq('id', id)
      .eq('group_id', groupId)
      .select().single();
    if (error) throw error;

    await writeAuditLog({ userId, action: 'update', tableName: 'cash_donations', recordId: record.id, oldValue: oldRecord, newValue: record });
    return record;
  }

  static async deleteCashDonation(id: string, userId: string, groupId: string) {
    const { data: oldRecord } = await supabaseAdmin.from('cash_donations').select('*').eq('id', id).eq('group_id', groupId).single();
    if (!oldRecord) throw new Error('Cash donation not found');

    const { data: record, error } = await supabaseAdmin.from('cash_donations')
      .update({ deleted_at: new Date().toISOString(), updated_by: userId })
      .eq('id', id)
      .eq('group_id', groupId)
      .select().single();
    if (error) throw error;

    await writeAuditLog({ userId, action: 'delete', tableName: 'cash_donations', recordId: record.id, oldValue: oldRecord, newValue: record });
    return record;
  }

  // --- ITEM DONATIONS ---
  static async getItemDonations(yearId: string, groupId: string) {
    const { data, error } = await supabaseAdmin
      .from('item_donations')
      .select('*, donors(name, phone), income_categories(name), units(abbreviation), users!item_donations_created_by_fkey(email)')
      .eq('festival_year_id', yearId)
      .eq('group_id', groupId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async createItemDonation(data: any, userId: string, groupId: string) {
    const { data: year } = await supabaseAdmin.from('festival_years').select('year').eq('id', data.festival_year_id).eq('group_id', groupId).single();
    if (!year) throw new Error('Invalid year');

    const receipt_number = await this.generateReceiptNumber('ID', data.festival_year_id, year.year.toString());

    // 1. Auto-lookup or create Donor
    let donor_id = data.donor_id;
    if (!donor_id && data.donor_name) {
      const { data: existingDonor } = await supabaseAdmin.from('donors').select('id').eq('group_id', groupId).ilike('name', data.donor_name).is('deleted_at', null).limit(1).single();
      if (existingDonor) donor_id = existingDonor.id;
      else {
        const { data: newDonor } = await supabaseAdmin.from('donors').insert({ name: data.donor_name, group_id: groupId, created_by: userId }).select('id').single();
        if (newDonor) donor_id = newDonor.id;
      }
    }

    // 2. Auto-lookup or create Category
    let category_id = data.income_category_id;
    if (!category_id && data.category_name) {
      const { data: existingCat } = await supabaseAdmin.from('income_categories').select('id').eq('festival_year_id', data.festival_year_id).eq('group_id', groupId).ilike('name', data.category_name).limit(1).single();
      if (existingCat) category_id = existingCat.id;
      else {
        const { data: newCat } = await supabaseAdmin.from('income_categories').insert({ name: data.category_name, type: 'item', festival_year_id: data.festival_year_id, group_id: groupId, created_by: userId }).select('id').single();
        if (newCat) category_id = newCat.id;
      }
    }

    // 3. Auto-lookup or create Unit
    let unit_id = data.unit_id;
    if (!unit_id && data.unit_name) {
      const { data: existingUnit } = await supabaseAdmin.from('units').select('id').eq('festival_year_id', data.festival_year_id).eq('group_id', groupId).ilike('name', data.unit_name).limit(1).single();
      if (existingUnit) unit_id = existingUnit.id;
      else {
        // use the input as both name and abbreviation for simplicity
        const { data: newUnit } = await supabaseAdmin.from('units').insert({ name: data.unit_name, abbreviation: data.unit_name, festival_year_id: data.festival_year_id, group_id: groupId, created_by: userId }).select('id').single();
        if (newUnit) unit_id = newUnit.id;
      }
    }

    if (!donor_id) throw new Error('Donor is required');

    const { data: record, error } = await supabaseAdmin.from('item_donations')
      .insert({ 
        festival_year_id: data.festival_year_id,
        item_name: data.item_name,
        quantity: data.quantity,
        unit_id: unit_id,
        estimated_value: data.estimated_value,
        donation_date: data.donation_date,
        notes: data.notes,
        donor_id,
        income_category_id: category_id,
        collected_by: null,
        receipt_number, 
        created_by: userId, 
        group_id: groupId 
      })
      .select().single();
      
    if (error) throw error;
    await writeAuditLog({ userId, action: 'create', tableName: 'item_donations', recordId: record.id, newValue: record });
    return record;
  }

  static async updateItemDonation(id: string, data: any, userId: string, groupId: string) {
    const { data: oldRecord } = await supabaseAdmin.from('item_donations').select('*').eq('id', id).eq('group_id', groupId).single();
    if (!oldRecord) throw new Error('Item donation not found');

    // 1. Auto-lookup or create Donor
    let donor_id = data.donor_id || oldRecord.donor_id;
    if (data.donor_name) {
      const { data: existingDonor } = await supabaseAdmin.from('donors').select('id').eq('group_id', groupId).ilike('name', data.donor_name).is('deleted_at', null).limit(1).single();
      if (existingDonor) donor_id = existingDonor.id;
      else {
        const { data: newDonor } = await supabaseAdmin.from('donors').insert({ name: data.donor_name, group_id: groupId, created_by: userId }).select('id').single();
        if (newDonor) donor_id = newDonor.id;
      }
    }

    // 2. Auto-lookup or create Category
    let category_id = data.income_category_id || oldRecord.income_category_id;
    if (data.category_name) {
      const { data: existingCat } = await supabaseAdmin.from('income_categories').select('id').eq('festival_year_id', data.festival_year_id || oldRecord.festival_year_id).eq('group_id', groupId).ilike('name', data.category_name).limit(1).single();
      if (existingCat) category_id = existingCat.id;
      else {
        const { data: newCat } = await supabaseAdmin.from('income_categories').insert({ name: data.category_name, type: 'item', festival_year_id: data.festival_year_id || oldRecord.festival_year_id, group_id: groupId, created_by: userId }).select('id').single();
        if (newCat) category_id = newCat.id;
      }
    }

    // 3. Auto-lookup or create Unit
    let unit_id = data.unit_id || oldRecord.unit_id;
    if (data.unit_name) {
      const { data: existingUnit } = await supabaseAdmin.from('units').select('id').eq('festival_year_id', data.festival_year_id || oldRecord.festival_year_id).eq('group_id', groupId).ilike('name', data.unit_name).limit(1).single();
      if (existingUnit) unit_id = existingUnit.id;
      else {
        const { data: newUnit } = await supabaseAdmin.from('units').insert({ name: data.unit_name, abbreviation: data.unit_name, festival_year_id: data.festival_year_id || oldRecord.festival_year_id, group_id: groupId, created_by: userId }).select('id').single();
        if (newUnit) unit_id = newUnit.id;
      }
    }

    const { data: record, error } = await supabaseAdmin.from('item_donations')
      .update({
        item_name: data.item_name !== undefined ? data.item_name : oldRecord.item_name,
        quantity: data.quantity !== undefined ? data.quantity : oldRecord.quantity,
        estimated_value: data.estimated_value !== undefined ? data.estimated_value : oldRecord.estimated_value,
        donation_date: data.donation_date !== undefined ? data.donation_date : oldRecord.donation_date,
        notes: data.notes !== undefined ? data.notes : oldRecord.notes,
        donor_id,
        income_category_id: category_id,
        unit_id,
        updated_by: userId
      })
      .eq('id', id)
      .eq('group_id', groupId)
      .select().single();
    if (error) throw error;

    await writeAuditLog({ userId, action: 'update', tableName: 'item_donations', recordId: record.id, oldValue: oldRecord, newValue: record });
    return record;
  }

  static async deleteItemDonation(id: string, userId: string, groupId: string) {
    const { data: oldRecord } = await supabaseAdmin.from('item_donations').select('*').eq('id', id).eq('group_id', groupId).single();
    if (!oldRecord) throw new Error('Item donation not found');

    const { data: record, error } = await supabaseAdmin.from('item_donations')
      .update({ deleted_at: new Date().toISOString(), updated_by: userId })
      .eq('id', id)
      .eq('group_id', groupId)
      .select().single();
    if (error) throw error;

    await writeAuditLog({ userId, action: 'delete', tableName: 'item_donations', recordId: record.id, oldValue: oldRecord, newValue: record });
    return record;
  }
}
