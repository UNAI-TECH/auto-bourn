const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://njvgqybtgakgevnxmetf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdmdxeWJ0Z2FrZ2V2bnhtZXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMjczOTEsImV4cCI6MjA5NTYwMzM5MX0.s_0wNQ89cGbqFytmLspR8YFLuKRitY9ry1ToXMQ-WUc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEmployees() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@gmail.com',
    password: 'autobourn@123',
  });

  if (authError) {
    console.error('Auth error:', authError.message);
    return;
  }

  console.log('Login successful! User ID:', authData.user.id);
  console.log('Querying all employees visible to this user...');

  const { data, error } = await supabase
    .from('employees')
    .select('*');

  if (error) {
    console.error('Employees table query error:', error.message);
  } else {
    console.log('Visible employees count:', data.length);
    console.log('Rows:', data);
  }
}

checkEmployees();
