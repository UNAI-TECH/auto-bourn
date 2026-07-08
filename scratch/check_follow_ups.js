const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://njvgqybtgakgevnxmetf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  console.log('--- TESTING SUPABASE OR QUERY ---');
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  
  let q = supabase.from('follow_ups')
    .select('*, lead:leads!lead_id(customer_name,phone), employee:employees!employee_id(name)')
    .or(`status.eq.missed,and(status.eq.pending,scheduled_at.lt.${todayStart.toISOString()})`);
  
  const { data, error } = await q;
  if (error) {
    console.error('Query error:', error);
  } else {
    console.log('Data length:', data.length);
    data.forEach(fu => console.log(`- ID: ${fu.id}, scheduled_at: ${fu.scheduled_at}, status: ${fu.status}, customer: ${fu.lead?.customer_name}`));
  }
}

run();
