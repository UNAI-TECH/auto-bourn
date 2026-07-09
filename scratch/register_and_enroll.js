const { createClient } = require('@supabase/supabase-js');

const url = 'https://njvgqybtgakgevnxmetf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(url, key);

async function run() {
  console.log('--- REGISTERING DEVICE BT19TRF20101316 ---');
  
  // 1. Insert device
  const { data: device, error: deviceErr } = await supabase
    .from('biometric_devices')
    .upsert({
      device_id: 'BT19TRF20101316',
      device_name: 'Showroom Entrance Reader',
      device_type: 'fingerprint',
      location: 'Velachery Showroom',
      api_key: 'boxtel_velachery_2026',
      status: 'active'
    }, { onConflict: 'device_id' })
    .select();

  if (deviceErr) {
    console.error('Failed to register device:', deviceErr.message);
    return;
  }
  console.log('SUCCESS: Registered Biometric Device:', device[0]);

  // 2. Fetch first active employee to map to User ID 121212
  console.log('\n--- MAPPING USER ID 121212 TO AN EMPLOYEE ---');
  const { data: emps, error: empErr } = await supabase
    .from('employees')
    .select('id, name, employee_id')
    .eq('role', 'employee')
    .eq('status', 'active')
    .limit(1);

  if (empErr || !emps || emps.length === 0) {
    console.error('Failed to find an active employee to enroll.', empErr);
    return;
  }

  const employee = emps[0];
  console.log(`Mapping Biometric ID "121212" to employee: ${employee.name} (${employee.employee_id})`);

  // 3. Insert enrollment
  const { data: enroll, error: enrollErr } = await supabase
    .from('biometric_enrollments')
    .upsert({
      employee_id: employee.id,
      device_user_id: '121212',
      biometric_type: 'fingerprint'
    }, { onConflict: 'employee_id,device_user_id' })
    .select();

  if (enrollErr) {
    console.error('Failed to map employee:', enrollErr.message);
  } else {
    console.log('SUCCESS: Enrolled and mapped user successfully:', enroll[0]);
  }
}

run();
