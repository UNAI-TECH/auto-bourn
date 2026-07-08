const { Client } = require('pg');

const passwords = [
  'autobourn@123',
  'autobourn@2026',
  'AB@2026',
  'ABC@2026',
  'UNAI@2026',
  'unai@2026',
  'Autobourn@123',
  'Autobourn@2026'
];

async function tryPassword(pw) {
  const client = new Client({
    connectionString: `postgresql://postgres:${encodeURIComponent(pw)}@db.njvgqybtgakgevnxmetf.supabase.co:5432/postgres`
  });
  try {
    await client.connect();
    console.log(`SUCCESS with password: ${pw}`);
    const res = await client.query('SELECT version();');
    console.log('PostgreSQL version:', res.rows[0].version);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed with password ${pw}: ${err.message}`);
    return false;
  }
}

async function main() {
  for (const pw of passwords) {
    const ok = await tryPassword(pw);
    if (ok) break;
  }
}

main();
