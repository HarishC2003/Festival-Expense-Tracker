import { supabase, supabaseAdmin } from '../config/supabase';
import { writeAuditLog } from '../utils/audit';

export class FestivalService {
  static async createYear(baseYearId: string | null, data: { festival_id: string, year: number, start_date: string, end_date: string, name?: string }, userId: string, groupId: string) {
    // 1. Create the new year
    const { data: newYear, error: yearError } = await supabaseAdmin
      .from('festival_years')
      .insert({
        festival_id: data.festival_id,
        year: data.year,
        start_date: data.start_date,
        end_date: data.end_date,
        description: data.name,
        created_by: userId,
        group_id: groupId
      })
      .select()
      .single();

    if (yearError) throw yearError;

    await writeAuditLog({
      userId,
      action: 'create',
      tableName: 'festival_years',
      recordId: newYear.id,
      newValue: newYear
    });

    // 2. If baseYearId provided, deep copy master data (Settings, Categories, Vendors, etc.)
    if (baseYearId) {
      // 2a. Copy Settings
      const { data: settings } = await supabaseAdmin.from('settings').select('*').eq('festival_year_id', baseYearId).eq('group_id', groupId);
      if (settings && settings.length > 0) {
        await supabaseAdmin.from('settings').insert(settings.map(s => ({ ...s, id: undefined, festival_year_id: newYear.id, created_by: userId, group_id: groupId, updated_at: undefined, created_at: undefined })));
      }

      // 2b. Copy Income Categories
      const { data: incomeCat } = await supabaseAdmin.from('income_categories').select('*').eq('festival_year_id', baseYearId).eq('group_id', groupId);
      if (incomeCat && incomeCat.length > 0) {
        await supabaseAdmin.from('income_categories').insert(incomeCat.map(s => ({ name: s.name, type: s.type, festival_year_id: newYear.id, created_by: userId, group_id: groupId })));
      }

      // 2c. Copy Expense Categories
      const { data: expenseCat } = await supabaseAdmin.from('expense_categories').select('*').eq('festival_year_id', baseYearId).eq('group_id', groupId);
      if (expenseCat && expenseCat.length > 0) {
        await supabaseAdmin.from('expense_categories').insert(expenseCat.map(s => ({ name: s.name, festival_year_id: newYear.id, created_by: userId, group_id: groupId })));
      }

      // 2d. Copy Payment Methods
      const { data: paymentMethods } = await supabaseAdmin.from('payment_methods').select('*').eq('festival_year_id', baseYearId).eq('group_id', groupId);
      if (paymentMethods && paymentMethods.length > 0) {
        await supabaseAdmin.from('payment_methods').insert(paymentMethods.map(s => ({ name: s.name, festival_year_id: newYear.id, created_by: userId, group_id: groupId })));
      }

      // 2e. Copy Units
      const { data: units } = await supabaseAdmin.from('units').select('*').eq('festival_year_id', baseYearId).eq('group_id', groupId);
      if (units && units.length > 0) {
        await supabaseAdmin.from('units').insert(units.map(s => ({ name: s.name, abbreviation: s.abbreviation, festival_year_id: newYear.id, created_by: userId, group_id: groupId })));
      }

      // 2f. Copy Vendor Categories and Vendors (requires mapping old IDs to new IDs)
      const { data: vendorCat } = await supabaseAdmin.from('vendor_categories').select('*').eq('festival_year_id', baseYearId).eq('group_id', groupId);
      if (vendorCat && vendorCat.length > 0) {
        const vendorCatMap: Record<string, string> = {}; // oldId -> newId
        for (const cat of vendorCat) {
          const { data: newCat } = await supabaseAdmin.from('vendor_categories')
            .insert({ name: cat.name, festival_year_id: newYear.id, created_by: userId, group_id: groupId })
            .select().single();
          if (newCat) vendorCatMap[cat.id] = newCat.id;
        }

        const { data: vendors } = await supabaseAdmin.from('vendors').select('*').eq('festival_year_id', baseYearId).eq('group_id', groupId);
        if (vendors && vendors.length > 0) {
          await supabaseAdmin.from('vendors').insert(vendors.map(v => ({
            name: v.name,
            phone: v.phone,
            address: v.address,
            notes: v.notes,
            vendor_category_id: v.vendor_category_id ? vendorCatMap[v.vendor_category_id] : null,
            festival_year_id: newYear.id,
            created_by: userId,
            group_id: groupId
          })));
        }
      }
    } else {
      // If no base year is provided, add default vendors to get them started
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
          group_id: groupId,
          festival_year_id: newYear.id,
          created_by: userId
        }))
      );
    }

    return newYear;
  }

  static async lockYear(yearId: string, userId: string, groupId: string) {
    const { data: lockedYear, error } = await supabaseAdmin
      .from('festival_years')
      .update({
        locked: true,
        locked_at: new Date().toISOString(),
        locked_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', yearId)
      .eq('group_id', groupId)
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      userId,
      action: 'update',
      tableName: 'festival_years',
      recordId: yearId,
      newValue: { locked: true, locked_at: lockedYear.locked_at, locked_by: userId }
    });

    return lockedYear;
  }
}
