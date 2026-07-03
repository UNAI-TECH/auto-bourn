const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://njvgqybtgakgevnxmetf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDAyNzM5MSwiZXhwIjoyMDk1NjAzMzkxfQ.-8caovDXcU79s6rbiQ63XxhOb6h1Y-bTHRuyyzHFKlg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  console.log('Restoring admin account with details "Mr. S. Prasanna" / "admin@gmail.com"...');

  // 1. Find and delete existing auth user with email admin@gmail.com if any
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const existingAuthUser = users.find(u => u.email === 'admin@gmail.com');
  if (existingAuthUser) {
    console.log(`Found existing auth user with ID ${existingAuthUser.id}. Deleting...`);
    const { error: deleteError } = await supabase.auth.admin.deleteUser(existingAuthUser.id);
    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      return;
    }
  }

  // 2. Clean up employee table just in case
  const { error: empDeleteError } = await supabase
    .from('employees')
    .delete()
    .eq('email', 'admin@gmail.com');
  if (empDeleteError) {
    console.error('Error deleting employee record:', empDeleteError);
  }

  // 3. Create new auth user
  const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
    email: 'admin@gmail.com',
    password: 'autobourn@123',
    email_confirm: true
  });

  if (createError) {
    console.error('Error creating admin user:', createError);
    return;
  }

  console.log(`Created Auth User: ${user.id}`);

  // 4. Create public.employees record
  const { data: empData, error: empInsertError } = await supabase
    .from('employees')
    .insert({
      auth_user_id: user.id,
      employee_id: 'ADMIN001',
      name: 'Mr. S. Prasanna',
      email: 'admin@gmail.com',
      role: 'admin',
      status: 'active'
    })
    .select()
    .single();

  if (empInsertError) {
    console.error('Error inserting employee record:', empInsertError);
    return;
  }

  console.log('Admin employee record created successfully:', empData);
}

run();
