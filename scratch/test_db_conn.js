const { Client } = require('pg');

const passwords = [
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
    connectionString: `postgresql://postgres:${encodeURIComponent(pw)}@db.njvgqybtgakgevnxmetf.supabase.co:5432/postgres`
  });
  try {
    await client.connect();
    console.log(`SUCCESS with password: ${pw}`);
    await client.end();
    return true;
  } catch (err) {
    // console.log(`Failed with password ${pw}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('Testing passwords...');
  for (const pw of passwords) {
    const ok = await tryPassword(pw);
    if (ok) break;
  }
  console.log('Done testing.');
}

main();
