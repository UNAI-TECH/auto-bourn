const { Client } = require('pg');
const dns = require('dns').promises;

const regions = ['ap-southeast-1', 'ap-south-1'];
const prefixes = ['aws-0', 'aws-1', 'aws-2', 'aws-3'];

async function check(prefix, region) {
  const host = `${prefix}-${region}.pooler.supabase.com`;
  try {
    await dns.resolve4(host);
  } catch (e) {
    return;
  }
  
  const client = new Client({
    connectionString: `postgresql://postgres.njvgqybtgakgevnxmetf:dummypw@${host}:6543/postgres`,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log(`SUCCESS connection directly on ${host}?!`);
    await client.end();
  } catch (err) {
    if (err.message.includes('tenant/user') && err.message.includes('not found')) {
      // tenant not found
    } else {
      console.log(`FOUND REGION: ${host}! Error: ${err.message}`);
    }
  }
}

async function main() {
  console.log('Scanning prefixes...');
  for (const prefix of prefixes) {
    for (const r of regions) {
      await check(prefix, r);
    }
  }
  console.log('Scan done.');
}

main();
