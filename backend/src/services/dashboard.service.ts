import { supabaseAdmin } from '../config/supabase';

export class DashboardService {
  static async getSummary(yearId: string, groupId: string) {
    const [
      cashRes, itemRes, expenseRes, 
      pendingExpRes, membersRes, donorsRes, galleryRes,
      recentIncomeRes, recentExpRes
    ] = await Promise.all([
      supabaseAdmin.from('cash_donations').select('amount').eq('festival_year_id', yearId).eq('group_id', groupId).is('deleted_at', null),
      supabaseAdmin.from('item_donations').select('estimated_value').eq('festival_year_id', yearId).eq('group_id', groupId).is('deleted_at', null),
      supabaseAdmin.from('expenses').select('amount, status, expense_date').eq('festival_year_id', yearId).eq('group_id', groupId).is('deleted_at', null),
      supabaseAdmin.from('expenses').select('amount').eq('festival_year_id', yearId).eq('group_id', groupId).eq('status', 'pending').is('deleted_at', null),
      supabaseAdmin.from('committee_members').select('id', { count: 'exact' }).eq('festival_year_id', yearId).eq('group_id', groupId).is('deleted_at', null),
      supabaseAdmin.from('donors').select('id', { count: 'exact' }).eq('group_id', groupId).is('deleted_at', null),
      supabaseAdmin.from('gallery_items').select('id', { count: 'exact' }).eq('festival_year_id', yearId).eq('group_id', groupId).is('deleted_at', null),
      supabaseAdmin.from('cash_donations').select('id, amount, donation_date, created_at, donors(name)').eq('festival_year_id', yearId).eq('group_id', groupId).is('deleted_at', null).order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.from('expenses').select('id, amount, expense_date, created_at, description, status, committee_members!paid_by(name)').eq('festival_year_id', yearId).eq('group_id', groupId).in('status', ['approved', 'reimbursed']).is('deleted_at', null).order('created_at', { ascending: false }).limit(10)
    ]);

    const totalCash = cashRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
    const totalItemValue = itemRes.data?.reduce((sum, r) => sum + Number(r.estimated_value || 0), 0) || 0;
    
    // Approved + Reimbursed
    const validExpenses = expenseRes.data?.filter(e => e.status === 'approved' || e.status === 'reimbursed') || [];
    const totalExpense = validExpenses.reduce((sum, r) => sum + Number(r.amount), 0);
    const pendingExpense = pendingExpRes.data?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
    
    const balance = totalCash - totalExpense;

    // Daily Collection Trend (Income vs Expense)
    const { data: dailyCash } = await supabaseAdmin.from('cash_donations')
      .select('donation_date, amount')
      .eq('festival_year_id', yearId).eq('group_id', groupId).is('deleted_at', null);
      
    const { data: dailyExpense } = await supabaseAdmin.from('expenses')
      .select('expense_date, amount')
      .eq('festival_year_id', yearId).eq('group_id', groupId).in('status', ['approved', 'reimbursed']).is('deleted_at', null);

    const trendMap: Record<string, { income: number, expense: number }> = {};
    
    dailyCash?.forEach(d => {
      if (!trendMap[d.donation_date]) trendMap[d.donation_date] = { income: 0, expense: 0 };
      trendMap[d.donation_date].income += Number(d.amount);
    });

    dailyExpense?.forEach(d => {
      if (!trendMap[d.expense_date]) trendMap[d.expense_date] = { income: 0, expense: 0 };
      trendMap[d.expense_date].expense += Number(d.amount);
    });

    const collectionTrend = Object.entries(trendMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({ date, income: data.income, expense: data.expense }));

    // Format recent transactions
    const recentIncome = (recentIncomeRes?.data || []).map((d: any) => ({
      id: d.id,
      type: 'income',
      amount: d.amount,
      date: d.donation_date,
      created_at: d.created_at,
      description: `Donation from ${d.donors?.name || 'Unknown'}`,
      person: d.donors?.name || 'Unknown'
    }));
    
    const recentExp = (recentExpRes?.data || []).map((d: any) => ({
      id: d.id,
      type: 'expense',
      amount: d.amount,
      date: d.expense_date,
      created_at: d.created_at,
      description: d.description || 'Expense',
      person: d.committee_members?.name || 'Unknown'
    }));

    const recentTransactions = [...recentIncome, ...recentExp]
      .sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
      .slice(0, 10);

    return {
      summary: {
        totalCash,
        totalItemValue,
        totalExpense,
        pendingExpense,
        balance,
        committeeCount: membersRes.count || 0,
        donorCount: donorsRes.count || 0,
        photoCount: galleryRes.count || 0
      },
      charts: {
        collectionTrend,
        // (Other charts would require heavy joins, keeping this light for now, or front-end can aggregate)
      },
      recentTransactions
    };
  }

  static async getTransactions(yearId: string, groupId: string, startDate?: string, endDate?: string) {
    let incomeQuery = supabaseAdmin.from('cash_donations')
      .select('id, amount, donation_date, created_at, donors(name)')
      .eq('festival_year_id', yearId)
      .eq('group_id', groupId)
      .is('deleted_at', null);

    let expenseQuery = supabaseAdmin.from('expenses')
      .select('id, amount, expense_date, created_at, description, status, committee_members!paid_by(name)')
      .eq('festival_year_id', yearId)
      .eq('group_id', groupId)
      .in('status', ['approved', 'reimbursed'])
      .is('deleted_at', null);

    if (startDate) {
      incomeQuery = incomeQuery.gte('donation_date', startDate);
      expenseQuery = expenseQuery.gte('expense_date', startDate);
    }
    if (endDate) {
      incomeQuery = incomeQuery.lte('donation_date', endDate);
      expenseQuery = expenseQuery.lte('expense_date', endDate);
    }

    const [incomeRes, expRes] = await Promise.all([incomeQuery, expenseQuery]);

    const income = (incomeRes.data || []).map((d: any) => ({
      id: d.id,
      type: 'income',
      amount: d.amount,
      date: d.donation_date,
      created_at: d.created_at,
      description: `Donation from ${d.donors?.name || 'Unknown'}`,
      person: d.donors?.name || 'Unknown'
    }));

    const expenses = (expRes.data || []).map((d: any) => ({
      id: d.id,
      type: 'expense',
      amount: d.amount,
      date: d.expense_date,
      created_at: d.created_at,
      description: d.description || 'Expense',
      person: d.committee_members?.name || 'Unknown'
    }));

    return [...income, ...expenses].sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());
  }
}
