const { createClient } = require('@supabase/supabase-js');

const url = 'https://njvgqybtgakgevnxmetf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(url, key);

async function run() {
  console.log('=== FETCHING RECENT BIOMETRIC DEBUG LOGS ===');
  
  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('action', 'upload')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching logs:', error);
    return;
  }

  console.log(`Found ${logs.length} recent debug logs in activity_logs:`);
  logs.forEach((log, index) => {
    console.log(`\n[Log #${index + 1}] Created At: ${log.created_at}`);
    console.log(`Details: ${log.details}`);
    console.log('Metadata:', JSON.stringify(log.metadata, null, 2));
  });
}

run();
