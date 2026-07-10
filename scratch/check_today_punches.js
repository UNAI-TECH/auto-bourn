const { createClient } = require('@supabase/supabase-js');

const url = 'https://njvgqybtgakgevnxmetf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(url, key);

async function run() {
  console.log('=== PUNCHES FOR TODAY (JULY 10) ===\n');

  const { data: punches, error } = await supabase
    .from('biometric_punches')
    .select('*')
    .gte('punch_time', '2026-07-10T00:00:00Z')
    .order('punch_time', { ascending: true });

  if (error) {
    console.error('Error fetching punches:', error);
  } else {
    punches.forEach(p => {
      console.log(`Punch ID: ${p.id}`);
      console.log(`  Device User ID: ${p.device_user_id}`);
      console.log(`  Punch Time (UTC): ${p.punch_time}`);
      console.log(`  Punch Time (IST): ${new Date(p.punch_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
      console.log(`  Punch Type: ${p.punch_type === 0 ? 'In' : 'Out'}`);
      console.log(`  Raw Payload: ${JSON.stringify(p.raw_payload)}`);
      console.log('------------------------------------------------');
    });
  }
}

run();
