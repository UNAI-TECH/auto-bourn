const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

let connectionString = process.env.DATABASE_URL;

// Try to load from .env.local or .env
const envPaths = ['.env.local', '.env'];
for (const envFile of envPaths) {
  const fullPath = path.join(__dirname, '..', envFile);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const match = content.match(/DATABASE_URL=(.+)/);
    if (match && match[1]) {
      connectionString = match[1].trim();
      // Remove any wrapping quotes if present
      if (connectionString.startsWith('"') && connectionString.endsWith('"')) {
        connectionString = connectionString.slice(1, -1);
      }
      if (connectionString.startsWith("'") && connectionString.endsWith("'")) {
        connectionString = connectionString.slice(1, -1);
      }
      break;
    }
  }
}

if (!connectionString || connectionString.includes('[YOUR_DB_PASSWORD]')) {
  console.error('Error: DATABASE_URL is not set or contains placeholder password in .env or .env.local.');
  console.log('Please copy .env.example to .env and configure your DATABASE_URL with the correct database password.');
  process.exit(1);
}

const client = new Client({
  connectionString: connectionString
});

const sql = `
DROP TRIGGER IF EXISTS trg_sync_activity_log_to_attendance ON activity_logs;
DROP FUNCTION IF EXISTS sync_activity_log_to_attendance();
DELETE FROM attendance_records WHERE source = 'web_login';
`;

async function run() {
  console.log('Connecting to database...');
  try {
    await client.connect();
    console.log('Connected! Running SQL cleanup...');
    const res = await client.query(sql);
    console.log('Database cleanup completed successfully!');
  } catch (err) {
    console.error('Database migration/cleanup failed:', err.message);
  } finally {
    await client.end();
  }
}

run();
