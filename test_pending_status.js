const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://njvgqybtgakgevnxmetf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data, error } = await supabase.from('cars').insert({
    brand: 'TEST_PENDING',
    model: 'TEST_MODEL',
    year: 2024,
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    price: 100000,
    status: 'pending'
  }).select();
  
  if (error) {
    console.log('INSERT FAILED AS EXPECTED:', error.message);
  } else {
    console.log('INSERT SUCCESSFUL! Data:', data);
    // Cleanup
    await supabase.from('cars').delete().eq('id', data[0].id);
    console.log('CLEANED UP TEST VEHICLE');
  }
}

run();
