import { supabaseAdmin } from '../config/supabase';

export class SearchService {
  static async globalSearch(query: string, yearId: string, groupId: string) {
    const numQuery = !isNaN(Number(query)) ? Number(query) : null;
    const likeQuery = `%${query}%`;

    const [donors, vendors, committee, cash, items, expenses] = await Promise.all([
      // Cross-year donors, but group scoped
      supabaseAdmin.from('donors').select('id, name, phone').eq('group_id', groupId).or(`name.ilike.${likeQuery},phone.ilike.${likeQuery}`).is('deleted_at', null).limit(5),
      
      // Year scoped
      supabaseAdmin.from('vendors').select('id, name').eq('festival_year_id', yearId).eq('group_id', groupId).ilike('name', likeQuery).is('deleted_at', null).limit(5),
      supabaseAdmin.from('committee_members').select('id, name, phone').eq('festival_year_id', yearId).eq('group_id', groupId).or(`name.ilike.${likeQuery},phone.ilike.${likeQuery}`).is('deleted_at', null).limit(5),
      
      supabaseAdmin.from('cash_donations').select('id, receipt_number, amount').eq('festival_year_id', yearId).eq('group_id', groupId).ilike('receipt_number', likeQuery).is('deleted_at', null).limit(5),
      supabaseAdmin.from('item_donations').select('id, receipt_number, item_name').eq('festival_year_id', yearId).eq('group_id', groupId).ilike('receipt_number', likeQuery).is('deleted_at', null).limit(5),
      
      supabaseAdmin.from('expenses').select('id, description, amount')
        .eq('festival_year_id', yearId)
        .eq('group_id', groupId)
        .or(`description.ilike.${likeQuery}${numQuery ? `,amount.eq.${numQuery}` : ''}`)
        .is('deleted_at', null).limit(5)
    ]);

    return {
      donors: donors.data || [],
      vendors: vendors.data || [],
      committee: committee.data || [],
      cash: cash.data || [],
      items: items.data || [],
      expenses: expenses.data || []
    };
  }
}
