const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://njvgqybtgakgevnxmetf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  console.log('=== EMPLOYEES ===');
  const { data: emps } = await supabase.from('employees').select('*');
  console.log(emps);

  console.log('=== LEADS ===');
  const { data: leads } = await supabase.from('leads').select('*');
  console.log(leads.map(l => ({ id: l.id, name: l.customer_name, assigned_to: l.assigned_to, status: l.lead_status })));

  console.log('=== FOLLOW UPS ===');
  const { data: fus } = await supabase.from('follow_ups').select('*');
  console.log(fus);
}

run();
