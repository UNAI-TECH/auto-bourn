const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://njvgqybtgakgevnxmetf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const names = ['exec_sql', 'execute_sql', 'run_sql', 'exec', 'sql', 'query_sql', 'execute_query'];

async function test(name) {
  const { data, error } = await supabase.rpc(name, { sql: 'SELECT 1;', query: 'SELECT 1;' });
  console.log(`RPC ${name}:`, data, error ? error.message : 'SUCCESS');
}

async function main() {
  for (const name of names) {
    await test(name);
  }
}
main();
