const { createClient } = require('@supabase/supabase-js');

const url = 'https://njvgqybtgakgevnxmetf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(url, key);

async function run() {
  console.log('=== ATTENDANCE RECORDS FOR TODAY (JULY 10) ===\n');

  const { data: records, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('attendance_date', '2026-07-10');

  if (error) {
    console.error('Error fetching records:', error);
  } else {
    records.forEach(r => {
      console.log(`Record ID: ${r.id}`);
      console.log(`  Employee ID: ${r.employee_id}`);
      console.log(`  First Punch In: ${r.first_punch_in}`);
      console.log(`  Last Punch Out: ${r.last_punch_out}`);
      console.log(`  Total Hours: ${r.total_hours}`);
      console.log(`  Status: ${r.status}`);
      console.log(`  Late by Minutes: ${r.late_by_minutes}`);
      console.log('------------------------------------------------');
    });
  }
}

run();
