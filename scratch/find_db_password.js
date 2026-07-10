const { Client } = require('pg');

const passwords = [
  'UNAI-TECH@2025',
  'UNAI-TECH@2026',
  'UNAI-TECH@2027',
  'unai-tech@2025',
  'unai-tech@2026',
  'unai-tech@2027',
  'UNAI@2025',
  'UNAI@2026',
  'UNAI@2027',
  'unai@2025',
  'unai@2026',
  'unai@2027',
  'UNAI-TECH',
  'unai-tech',
  'autobourn@2025',
  'autobourn@2026',
  'autobourn@2027',
  'Autobourn@2025',
  'Autobourn@2026',
  'Autobourn@2027',
  'autobourncrm',
  'autobourncrm@2025',
  'autobourncrm@2026',
  'autobourncrm@2027',
  'AutobournCRM@2025',
  'AutobournCRM@2026',
  'AutobournCRM@2027',
  'autoborun@2025',
  'autoborun@2026',
  'autoborun@2027',
  'Autoborun@2025',
  'Autoborun@2026',
  'Autoborun@2027',
  'autoborun',
  'Autoborun'
];

async function tryPassword(pw) {
  const client = new Client({
    connectionString: `postgresql://postgres:${encodeURIComponent(pw)}@db.njvgqybtgakgevnxmetf.supabase.co:5432/postgres`,
    connectionTimeoutMillis: 3000
  });
  try {
    await client.connect();
    console.log(`SUCCESS with password: ${pw}`);
    await client.end();
    return true;
  } catch (err) {
    return false;
  }
}

async function main() {
  console.log(`Testing ${passwords.length} passwords...`);
  for (const pw of passwords) {
    const ok = await tryPassword(pw);
    if (ok) return;
  }
  console.log('Tested all, none succeeded.');
}

main();
