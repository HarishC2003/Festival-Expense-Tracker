import { supabaseAdmin } from './src/config/supabase';

async function test() {
  const yearId = 'placeholder';
  const groupId = 'placeholder';
  
  const incRes = await supabaseAdmin.from('cash_donations').select('donation_date, receipt_number, amount, donors(name), income_categories(name)').limit(1);
  console.log('incRes:', JSON.stringify(incRes, null, 2));
  
  const expRes = await supabaseAdmin.from('expenses').select('expense_date, description, amount, expense_categories(name)').limit(1);
  console.log('expRes:', JSON.stringify(expRes, null, 2));
}

test();
