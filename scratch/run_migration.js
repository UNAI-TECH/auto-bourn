const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const url = 'https://njvgqybtgakgevnxmetf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

console.log('Connecting to Supabase at:', url);
const supabase = createClient(url, key);

const migrationPath = path.join(__dirname, '..', 'biometric-attendance-migration.sql');
if (!fs.existsSync(migrationPath)) {
  console.error('Error: biometric-attendance-migration.sql not found at', migrationPath);
  process.exit(1);
}

const sql = fs.readFileSync(migrationPath, 'utf-8');
console.log('Reading migration script... Length:', sql.length, 'characters');

async function run() {
  console.log('Executing SQL migration via exec_sql RPC...');
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.error('Migration failed:', error);
  } else {
    console.log('Migration completed successfully!', data);
  }
}

run();
