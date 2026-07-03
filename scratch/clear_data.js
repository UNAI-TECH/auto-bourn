const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://njvgqybtgakgevnxmetf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function clearData() {
  console.log('Starting data cleanup...');

  try {
    // 1. Reset sold_by field on cars to prevent foreign key violations
    console.log('Resetting sold_by field on cars...');
    const { error: carResetError } = await supabase
      .from('cars')
      .update({ sold_by: null })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // updates all cars
    if (carResetError) {
      console.warn('Warning updating cars sold_by:', carResetError.message);
    }

    // 2. Clear Bookings
    console.log('Clearing bookings...');
    const { error: err1 } = await supabase.from('bookings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err1) console.error('Error clearing bookings:', err1.message);

    // 3. Clear Test Drives
    console.log('Clearing test drives...');
    const { error: err2 } = await supabase.from('test_drives').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err2) console.error('Error clearing test_drives:', err2.message);

    // 4. Clear Follow Ups
    console.log('Clearing follow ups...');
    const { error: err3 } = await supabase.from('follow_ups').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err3) console.error('Error clearing follow_ups:', err3.message);

    // 5. Clear Customer Notes
    console.log('Clearing customer notes...');
    const { error: err4 } = await supabase.from('customer_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err4) console.error('Error clearing customer_notes:', err4.message);

    // 6. Clear CRM Activity Logs
    console.log('Clearing CRM activity logs...');
    const { error: err5 } = await supabase.from('crm_activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err5) console.error('Error clearing crm_activity_logs:', err5.message);

    // 7. Clear Notifications
    console.log('Clearing notifications...');
    const { error: err6 } = await supabase.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err6) console.error('Error clearing notifications:', err6.message);

    // 8. Clear Daily Reports
    console.log('Clearing daily reports...');
    const { error: err7 } = await supabase.from('daily_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err7) console.error('Error clearing daily_reports:', err7.message);

    // 9. Clear Activity Logs
    console.log('Clearing activity logs...');
    const { error: err8 } = await supabase.from('activity_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err8) console.error('Error clearing activity_logs:', err8.message);

    // 10. Clear Leads
    console.log('Clearing leads...');
    const { error: err9 } = await supabase.from('leads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err9) console.error('Error clearing leads:', err9.message);

    // 11. Clear Employees (except Admin User)
    console.log('Fetching employees to delete...');
    const { data: employees, error: fetchErr } = await supabase
      .from('employees')
      .select('*')
      .neq('email', 'admin@gmail.com');

    if (fetchErr) {
      console.error('Error fetching employees:', fetchErr.message);
    } else if (employees && employees.length > 0) {
      for (const emp of employees) {
        console.log(`Deleting employee: ${emp.name} (${emp.email})...`);
        if (emp.auth_user_id) {
          const { error: authDelErr } = await supabase.auth.admin.deleteUser(emp.auth_user_id);
          if (authDelErr) {
            console.error(`Error deleting auth user for ${emp.email}:`, authDelErr.message);
          } else {
            console.log(`Deleted auth user for ${emp.email}`);
          }
        }
        
        // Cascade might have already deleted it, but just in case:
        const { error: empDelErr } = await supabase
          .from('employees')
          .delete()
          .eq('id', emp.id);
        
        if (empDelErr) {
          console.error(`Error deleting employee record for ${emp.email}:`, empDelErr.message);
        } else {
          console.log(`Deleted employee record for ${emp.email}`);
        }
      }
    } else {
      console.log('No employees to delete (except admin).');
    }

    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Unexpected error during cleanup:', error);
  }
}

clearData();
