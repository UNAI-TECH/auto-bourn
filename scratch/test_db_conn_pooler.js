const { Client } = require('pg');

const passwords = [
  'autobourn@123',
  'Autobourn@123',
  'unai@123',
  'UNAI@123',
  'UNAI@2025',
  'UNAI@2026',
  'UNAI@2027',
  'unai@2025',
  'unai@2026',
  'unai@2027',
  'UNAI-TECH@2026',
  'UNAI-TECH',
  'autobourncars',
  'autobourn',
  'Autobourn',
  'Autobourn@2025',
  'Autobourn@2026',
  'Autobourn@2027'
];

async function tryPassword(pw) {
  const client = new Client({
    connectionString: `postgresql://postgres.njvgqybtgakgevnxmetf:${encodeURIComponent(pw)}@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log(`SUCCESS with password: ${pw}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed with password ${pw}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('Testing pooler with SSL...');
  for (const pw of passwords) {
    const ok = await tryPassword(pw);
    if (ok) break;
  }
  console.log('Done testing.');
}

main();
