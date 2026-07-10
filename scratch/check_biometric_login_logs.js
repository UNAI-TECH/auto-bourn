const { createClient } = require('@supabase/supabase-js');

const url = 'https://njvgqybtgakgevnxmetf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(url, key);

async function run() {
  console.log('=== BIOMETRIC LOGIN/LOGOUT LOGS FOR TODAY (JULY 10) ===\n');

  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('action', 'login')
    .gte('created_at', '2026-07-10T00:00:00Z')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error);
  } else {
    logs.forEach(l => {
      if (l.metadata && l.metadata.biometric) {
        console.log(`Log ID: ${l.id}`);
        console.log(`  Details: ${l.details}`);
        console.log(`  Created At (UTC): ${l.created_at}`);
        console.log(`  Created At (IST): ${new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        console.log('------------------------------------------------');
      }
    });
  }
}

run();
