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
  console.log('--- FETCHING ALL CARS FROM DB ---');
  const { data: cars, error } = await supabase.from('cars').select('id, brand, model, status');
  if (error) {
    console.error('Error fetching cars:', error);
  } else {
    console.log(`Total cars count: ${cars.length}`);
    cars.forEach((c, idx) => {
      console.log(`${idx + 1}. Brand: "${c.brand}", Model: "${c.model}", Status: "${c.status}" (ID: ${c.id})`);
    });
  }
}

run();
