-- ============================================
-- RUN THIS SQL IN THE SUPABASE SQL EDITOR
-- TO CREATE THE ADMIN USER AND EMPLOYEE PROFILE
-- ============================================

-- 1. Clean up any existing bad record first
DELETE FROM public.employees WHERE email = 'admin@gmail.com';
DELETE FROM auth.users WHERE email = 'admin@gmail.com';

-- 2. Create the admin user and employee record
DO $$
DECLARE
  new_user_id UUID := 'd7b1b369-0268-45e0-a7d5-dbca44fd71eb'; -- Hardcoded unique UUID
  hashed_password VARCHAR := '$2b$12$5X5X62/.aE6TxUwvP/mhP.3D99ySY6CC.MeOftMZz5Aa1p4UZWY6O'; -- Bcrypt hash of 'autobourn@123'
BEGIN
  -- Insert into auth.users with required empty string columns to avoid GoTrue 500 crashes
  INSERT INTO auth.users (
    id,
    instance_id,
    role,
    aud,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@gmail.com',
    hashed_password,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

  -- Insert into public.employees
  INSERT INTO public.employees (
    employee_id,
    name,
    email,
    role,
    status,
    auth_user_id
  )
  VALUES (
    'ADMIN001',
    'Admin User',
    'admin@gmail.com',
    'admin',
    'active',
    new_user_id
  );

END $$;
