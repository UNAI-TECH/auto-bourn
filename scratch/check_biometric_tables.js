const { createClient } = require('@supabase/supabase-js');

const url = 'https://njvgqybtgakgevnxmetf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(url, key);

async function run() {
  console.log('=== BIOMETRIC DIAGNOSTICS ===');

  // 1. Check biometric devices
  const { data: devices, error: devErr } = await supabase
    .from('biometric_devices')
    .select('*');
  console.log('\n--- Biometric Devices ---');
  if (devErr) console.error(devErr);
  else console.log(devices);

  // 2. Check biometric enrollments
  const { data: enrollments, error: enrollErr } = await supabase
    .from('biometric_enrollments')
    .select('*, employee:employees(name, employee_id)');
  console.log('\n--- Biometric Enrollments ---');
  if (enrollErr) console.error(enrollErr);
  else console.log(enrollments);

  // 3. Check biometric punches where employee_id is null
  const { data: unmappedPunches, error: punchErr } = await supabase
    .from('biometric_punches')
    .select('*')
    .is('employee_id', null)
    .limit(10);
  console.log('\n--- Unmapped Biometric Punches (First 10) ---');
  if (punchErr) console.error(punchErr);
  else console.log(unmappedPunches);
}

run();
