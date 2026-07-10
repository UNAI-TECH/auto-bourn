const { Client } = require('pg');
const dns = require('dns').promises;

const regions = [
  'eu-central-2',
  'eu-north-1'
];

async function checkRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  try {
    await dns.resolve4(host);
  } catch (e) {
    console.log(`Region ${region} dns failed`);
    return;
  }
  
  const client = new Client({
    connectionString: `postgresql://postgres.njvgqybtgakgevnxmetf:dummypw@${host}:6543/postgres`,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log(`SUCCESS connection directly on region ${region}?!`);
    await client.end();
  } catch (err) {
    if (err.message.includes('tenant/user') && err.message.includes('not found')) {
      console.log(`Region ${region}: tenant not found`);
    } else {
      console.log(`FOUND REGION: ${region}! Error: ${err.message}`);
    }
  }
}

async function main() {
  console.log('Scanning remaining regions...');
  for (const r of regions) {
    await checkRegion(r);
  }
  console.log('Scan done.');
}

main();
