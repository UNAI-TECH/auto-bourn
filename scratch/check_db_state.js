const { createClient } = require('@supabase/supabase-js');

const url = 'https://njvgqybtgakgevnxmetf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(url, key);

async function run() {
  console.log('=== DATABASE STATE CHECK ===\n');

  // 1. Check biometric_punches
  const { data: punches, error: punchErr } = await supabase
    .from('biometric_punches')
    .select('*')
    .order('punch_time', { ascending: false })
    .limit(10);
  
  console.log('biometric_punches table:');
  if (punchErr) console.error('  Error:', punchErr);
  else if (!punches.length) console.log('  (empty)');
  else punches.forEach(p => console.log(`  - ID: ${p.id}, user: ${p.device_user_id}, time: ${p.punch_time}, employee: ${p.employee_id}`));

  // 2. Check attendance_records
  const { data: records, error: recErr } = await supabase
    .from('attendance_records')
    .select('*')
    .order('attendance_date', { ascending: false })
    .limit(10);

  console.log('\nattendance_records table:');
  if (recErr) console.error('  Error:', recErr);
  else if (!records.length) console.log('  (empty)');
  else records.forEach(r => console.log(`  - employee: ${r.employee_id}, date: ${r.attendance_date}, status: ${r.status}, source: ${r.source}`));

  // 3. Check biometric_devices
  const { data: devices, error: devErr } = await supabase
    .from('biometric_devices')
    .select('*');

  console.log('\nbiometric_devices table:');
  if (devErr) console.error('  Error:', devErr);
  else if (!devices.length) console.log('  (empty)');
  else devices.forEach(d => console.log(`  - ID: ${d.device_id}, name: ${d.device_name}, status: ${d.status}, heartbeat: ${d.last_heartbeat}`));

  // 4. Check biometric_enrollments  
  const { data: enrollments, error: enrErr } = await supabase
    .from('biometric_enrollments')
    .select('*');

  console.log('\nbiometric_enrollments table:');
  if (enrErr) console.error('  Error:', enrErr.message);
  else if (!enrollments.length) console.log('  (empty)');
  else enrollments.forEach(e => console.log(`  - employee: ${e.employee_id}, device_user_id: ${e.device_user_id}`));

  // 5. Check employees with biometric_id
  const { data: employees, error: empErr } = await supabase
    .from('employees')
    .select('id, name, employee_id, biometric_id')
    .not('biometric_id', 'is', null)
    .limit(10);

  console.log('\nemployees with biometric_id:');
  if (empErr) console.error('  Error:', empErr.message);
  else if (!employees || !employees.length) console.log('  (none have biometric_id set)');
  else employees.forEach(e => console.log(`  - ${e.name} (ID: ${e.id}), biometric_id: ${e.biometric_id}`));
}

run();
