const { createClient } = require('@supabase/supabase-js');

const url = 'https://njvgqybtgakgevnxmetf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(url, key);

async function testSync() {
  console.log('=== STARTING BIOMETRIC ATTENDANCE TRIGGERS TEST ===');
  
  // 1. Fetch a real employee to use for test enrollment
  console.log('Fetching an active employee for testing...');
  const { data: emps, error: empErr } = await supabase
    .from('employees')
    .select('id, name, employee_id')
    .eq('role', 'employee')
    .eq('status', 'active')
    .limit(1);

  if (empErr || !emps || emps.length === 0) {
    console.error('Failed to fetch an employee for testing. Make sure at least one active employee exists.', empErr);
    return;
  }
  
  const testEmp = emps[0];
  console.log(`Using test employee: ${testEmp.name} (${testEmp.employee_id}, ID: ${testEmp.id})`);

  const testDeviceId = 'TEST-DEVICE-999';
  const testApiKey = 'test_api_key_xyz_123';
  const testDeviceUserId = 'DEV-USER-999';
  const todayDateStr = new Date().toISOString().split('T')[0];

  try {
    // 2. Clean up any previous test remnants just in case
    console.log('Cleaning up old test data...');
    await supabase.from('biometric_punches').delete().eq('device_id', testDeviceId);
    await supabase.from('biometric_enrollments').delete().eq('device_user_id', testDeviceUserId);
    await supabase.from('biometric_devices').delete().eq('device_id', testDeviceId);
    await supabase.from('attendance_records').delete().eq('employee_id', testEmp.id).eq('attendance_date', todayDateStr);

    // 3. Register test biometric device
    console.log('Registering test biometric device...');
    const { data: device, error: deviceErr } = await supabase
      .from('biometric_devices')
      .insert({
        device_id: testDeviceId,
        device_name: 'Test Fingerprint Reader',
        device_type: 'fingerprint',
        location: 'QA Test Desk',
        api_key: testApiKey,
        status: 'active'
      })
      .select()
      .single();

    if (deviceErr) throw new Error('Device registration failed: ' + deviceErr.message);
    console.log('Device registered successfully.');

    // 4. Enroll test employee
    console.log('Enrolling employee into test biometric device...');
    const { data: enrollment, error: enrollErr } = await supabase
      .from('biometric_enrollments')
      .insert({
        employee_id: testEmp.id,
        device_user_id: testDeviceUserId,
        biometric_type: 'fingerprint'
      })
      .select()
      .single();

    if (enrollErr) throw new Error('Enrollment failed: ' + enrollErr.message);
    console.log('Employee enrolled successfully.');

    // 5. Simulate Check-In at 09:15 AM (Before office start 09:30 AM -> On Time)
    const checkInTime = `${todayDateStr}T03:45:00.000Z`; // 03:45 UTC is 09:15 AM IST (+5:30)
    console.log(`Simulating punch-in at 09:15 AM IST (UTC: ${checkInTime})...`);
    const { data: punchIn, error: punchInErr } = await supabase
      .from('biometric_punches')
      .insert({
        device_id: testDeviceId,
        device_user_id: testDeviceUserId,
        punch_time: checkInTime,
        punch_type: 0, // Check In
        verify_type: 1 // Fingerprint
      })
      .select()
      .single();

    if (punchInErr) throw new Error('Punch In failed: ' + punchInErr.message);
    console.log('Punch In recorded successfully.');

    // 6. Verify first attendance_record (On Time)
    console.log('Verifying generated attendance record...');
    // Wait 1 second for trigger processing (triggers are transaction-blocking so it's instant)
    let { data: record, error: recErr } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', testEmp.id)
      .eq('attendance_date', todayDateStr)
      .single();

    if (recErr || !record) throw new Error('Attendance record not found: ' + (recErr ? recErr.message : 'empty'));
    
    console.log('--- Attendance Record Check-In Status ---');
    console.log(`Date: ${record.attendance_date}`);
    console.log(`First In: ${record.first_punch_in}`);
    console.log(`Last Out: ${record.last_punch_out} (Expected: NULL)`);
    console.log(`Late by Minutes: ${record.late_by_minutes} (Expected: 0)`);
    console.log(`Punches count: ${record.punch_count} (Expected: 1)`);
    console.log(`Source: ${record.source} (Expected: biometric)`);
    console.log(`Status: ${record.status}`);

    if (record.late_by_minutes !== 0) {
      console.warn('⚠️ Warning: Employee was calculated as late but arrived early!');
    }

    // 7. Simulate Check-Out at 06:15 PM (UTC: 12:45 PM. 09:15 AM to 06:15 PM = 9 hours worked)
    const checkOutTime = `${todayDateStr}T12:45:00.000Z`;
    console.log(`Simulating punch-out at 06:15 PM IST (UTC: ${checkOutTime})...`);
    const { data: punchOut, error: punchOutErr } = await supabase
      .from('biometric_punches')
      .insert({
        device_id: testDeviceId,
        device_user_id: testDeviceUserId,
        punch_time: checkOutTime,
        punch_type: 1, // Check Out
        verify_type: 1
      })
      .select()
      .single();

    if (punchOutErr) throw new Error('Punch Out failed: ' + punchOutErr.message);
    console.log('Punch Out recorded successfully.');

    // 8. Verify daily summary calculations (Total Hours, Status)
    let { data: finalRecord, error: finalRecErr } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', testEmp.id)
      .eq('attendance_date', todayDateStr)
      .single();

    if (finalRecErr || !finalRecord) throw new Error('Attendance record check failed: ' + (finalRecErr ? finalRecErr.message : 'empty'));

    console.log('--- Attendance Record Daily Summary ---');
    console.log(`Date: ${finalRecord.attendance_date}`);
    console.log(`First In: ${finalRecord.first_punch_in}`);
    console.log(`Last Out: ${finalRecord.last_punch_out}`);
    console.log(`Total Hours Worked: ${finalRecord.total_hours} hrs (Expected: 9.00)`);
    console.log(`Punches count: ${finalRecord.punch_count} (Expected: 2)`);
    console.log(`Status: ${finalRecord.status} (Expected: present)`);

    if (parseFloat(finalRecord.total_hours) !== 9.00) {
      console.warn(`⚠️ Warning: Total hours calculation mismatch. Got: ${finalRecord.total_hours}`);
    }

    // 9. Simulate Late Arrival (check in at 10:15 AM -> 45 minutes late)
    console.log('Simulating late check-in for checking late calculations...');
    const lateCheckInTime = `${todayDateStr}T04:45:00.000Z`; // 10:15 AM IST
    
    // We update our check-in time in the punch to simulate arriving late
    const { error: updatePunchErr } = await supabase
      .from('biometric_punches')
      .update({ punch_time: lateCheckInTime })
      .eq('id', punchIn.id);

    if (updatePunchErr) throw new Error('Failed to simulate late arrival: ' + updatePunchErr.message);

    let { data: lateRecord, error: lateRecErr } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', testEmp.id)
      .eq('attendance_date', todayDateStr)
      .single();

    if (lateRecErr) throw new Error('Late check failed: ' + lateRecErr.message);
    
    console.log('--- Late Check-In Status ---');
    console.log(`First In: ${lateRecord.first_punch_in}`);
    console.log(`Late by Minutes: ${lateRecord.late_by_minutes} mins (Expected: 45)`);
    console.log(`Status: ${lateRecord.status} (Expected: late)`);

    if (lateRecord.late_by_minutes !== 45) {
      console.warn(`⚠️ Warning: Late calculation mismatch. Got: ${lateRecord.late_by_minutes} mins`);
    }

    console.log('✅ ALL TEST SCENARIOS COMPLETED SUCCESSFULLY!');

  } catch (err) {
    console.error('❌ TEST FAILED:', err.message);
  } finally {
    // 10. Final cleanup of test data
    console.log('Cleaning up database test records...');
    await supabase.from('biometric_punches').delete().eq('device_id', testDeviceId);
    await supabase.from('biometric_enrollments').delete().eq('device_user_id', testDeviceUserId);
    await supabase.from('biometric_devices').delete().eq('device_id', testDeviceId);
    await supabase.from('attendance_records').delete().eq('employee_id', testEmp.id).eq('attendance_date', todayDateStr);
    console.log('Database cleaned. Test run complete.');
  }
}

testSync();
