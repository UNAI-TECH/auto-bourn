const { Client } = require('pg');
const dns = require('dns').promises;

const regions = [
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'sa-east-1',
  'ca-central-1'
];

async function checkRegion(region) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  try {
    await dns.resolve4(host);
  } catch (e) {
    // console.log(`Region ${region} dns failed`);
    return;
  }
  
  // Try to connect with a dummy password to see if it finds the tenant
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
      // console.log(`Region ${region}: tenant not found`);
    } else {
      console.log(`FOUND REGION: ${region}! Error: ${err.message}`);
    }
  }
}

async function main() {
  console.log('Scanning regions...');
  for (const r of regions) {
    await checkRegion(r);
  }
  console.log('Scan done.');
}

main();
