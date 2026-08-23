import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient('http://127.0.0.1:54321', process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmF1bHQiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjIwMTk2MDMyMDB9.s1');

async function test() {
  const { data, error } = await supabaseAdmin.from('group_members').select('*, users!user_id(name, email)').limit(1);
  console.log("users!user_id test:", data, error);
}

test();
