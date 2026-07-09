const { createClient } = require('@supabase/supabase-js');

const url = 'https://njvgqybtgakgevnxmetf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(url, key);

async function run() {
  console.log('Fetching recent BIOMETRIC DEBUG logs from database...');
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('action', 'upload')
    .like('details', 'BIOMETRIC DEBUG%')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Failed to fetch logs:', error.message);
  } else if (data.length === 0) {
    console.log('No debug logs found yet. Make sure you deployed the updated function and sent a request.');
  } else {
    data.forEach((log, index) => {
      console.log(`\n=== DEBUG LOG #${index + 1} (${log.created_at}) ===`);
      console.log('Details:', log.details);
      console.log('Headers:', JSON.stringify(log.metadata.headers, null, 2));
      console.log('Body Payload:', JSON.stringify(log.metadata.raw_body, null, 2));
    });
  }
}

run();
