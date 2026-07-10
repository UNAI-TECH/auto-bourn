const { Client } = require('pg');

async function test() {
  const host = 'aws-0-ap-southeast-1.pooler.supabase.com';
  // Try with some dummy password
  const client = new Client({
    connectionString: `postgresql://postgres.njvgqybtgakgevnxmetf:dummypw@${host}:6543/postgres`,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('CONNECTED?!');
    await client.end();
  } catch (err) {
    console.log('Error:', err.message);
  }
}

test();
