const { createClient } = require('@supabase/supabase-js');

const url = 'https://njvgqybtgakgevnxmetf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(url, key);

async function run() {
  console.log('=== DIAGNOSING DATABASE RECORDS FOR TODAY ===');
  
  // 1. Check biometric_punches
  console.log('\n--- 1. biometric_punches (Today) ---');
  const { data: punches, error: punchErr } = await supabase
    .from('biometric_punches')
    .select('*, employee:employees(name, employee_id, biometric_id)')
    .order('punch_time', { ascending: false });

  if (punchErr) {
    console.error('Error fetching punches:', punchErr.message);
  } else {
    console.log(`Found ${punches.length} total biometric punches in database:`);
    punches.forEach((p, i) => {
      console.log(`[Punch #${i + 1}] ID: ${p.id}, User ID: ${p.device_user_id}, Time: ${p.punch_time}, Type: ${p.punch_type}, Employee: ${p.employee ? p.employee.name : 'Unmapped'}`);
    });
  }

  // 2. Check attendance_records
  console.log('\n--- 2. attendance_records (Today) ---');
  const { data: records, error: recErr } = await supabase
    .from('attendance_records')
    .select('*, employee:employees(name, employee_id, biometric_id)');

  if (recErr) {
    console.error('Error fetching attendance records:', recErr.message);
  } else {
    console.log(`Found ${records.length} attendance records in database:`);
    records.forEach((r, i) => {
      console.log(`[Record #${i + 1}] Date: ${r.attendance_date}, Emp: ${r.employee?.name}, First In: ${r.first_punch_in}, Last Out: ${r.last_punch_out}, Source: ${r.source}, Status: ${r.status}, Late Mins: ${r.late_by_minutes}`);
    });
  }

  // 3. Check employees biometric_id mapping
  console.log('\n--- 3. active employees biometric_id ---');
  const { data: emps, error: empErr } = await supabase
    .from('employees')
    .select('id, name, employee_id, biometric_id')
    .eq('role', 'employee');

  if (empErr) {
    console.error('Error fetching employees:', empErr.message);
  } else {
    console.log('Active employees in DB:');
    console.log(emps);
  }
}

run();
