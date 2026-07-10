const { createClient } = require('@supabase/supabase-js');

const url = 'https://njvgqybtgakgevnxmetf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(url, key);

async function run() {
  console.log('=== DELETING STUCK JULY 6 PUNCH TO UNBLOCK QUEUE ===\n');

  // 1. Delete the stuck punch from biometric_punches
  const { data: deletedPunches, error: punchErr } = await supabase
    .from('biometric_punches')
    .delete()
    .eq('device_user_id', '121212')
    .eq('device_id', 'BT19TRF20101316')
    .select();

  if (punchErr) {
    console.error('Error deleting punch:', punchErr);
  } else {
    console.log('Deleted punches:', deletedPunches.length);
    deletedPunches.forEach(p => console.log(`  - ${p.device_user_id} at ${p.punch_time}`));
  }

  // 2. Delete the corresponding attendance record for July 6
  const { data: deletedRecords, error: recordErr } = await supabase
    .from('attendance_records')
    .delete()
    .eq('attendance_date', '2026-07-06')
    .eq('source', 'biometric')
    .select();

  if (recordErr) {
    console.error('Error deleting attendance record:', recordErr);
  } else {
    console.log('Deleted attendance records:', deletedRecords.length);
    deletedRecords.forEach(r => console.log(`  - ${r.employee_id} on ${r.attendance_date}`));
  }

  console.log('\n=== DONE. The next time the middleware retries the July 6 punch, it will be inserted as NEW ===');
  console.log('Watch the Edge Function logs for "New: 1" instead of "Skipped (Duplicate): 1"');
}

run();
