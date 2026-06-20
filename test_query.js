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
  console.log('--- TESTING SUPABASE CARS FILTER QUERY ---');
  let query = supabase.from('cars').select('*, employee:employees!employee_id(name, employee_id)', { count: 'exact' });
  
  const brandFilter = 'BMW';
  if (brandFilter) query = query.eq('brand', brandFilter);

  const { data, count, error } = await query;
  if (error) {
    console.error('Query error:', error);
  } else {
    console.log('Count returned by query:', count);
    console.log('Data length:', data.length);
    data.forEach(c => console.log(`- ${c.brand} ${c.model}`));
  }
}

run();
