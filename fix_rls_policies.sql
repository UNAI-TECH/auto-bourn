-- ========================================================
-- RUN THIS SQL IN THE SUPABASE SQL EDITOR TO FIX THE LOGIN
-- AND AVOID RLS INFINITE RECURSION ERROR
-- ========================================================

-- 1. Create the SECURITY DEFINER function to check if user is admin
-- Running as SECURITY DEFINER bypasses RLS on the employees table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.employees
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing problematic self-referential policies on employees
DROP POLICY IF EXISTS "Admin can view all employees" ON employees;
DROP POLICY IF EXISTS "Admin can insert employees" ON employees;
DROP POLICY IF EXISTS "Admin can update employees" ON employees;
DROP POLICY IF EXISTS "Admin can delete employees" ON employees;

-- 3. Re-create employees policies using the is_admin() function
CREATE POLICY "Admin can view all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 4. Drop and re-create cars policies using the is_admin() function
DROP POLICY IF EXISTS "Admin can update any car" ON cars;
DROP POLICY IF EXISTS "Admin can delete any car" ON cars;

CREATE POLICY "Admin can update any car"
  ON cars FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin can delete any car"
  ON cars FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 5. Drop and re-create car_images policies using the is_admin() function
DROP POLICY IF EXISTS "Admin can delete any car image" ON car_images;

CREATE POLICY "Admin can delete any car image"
  ON car_images FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 6. Drop and re-create activity_logs policies using the is_admin() function
DROP POLICY IF EXISTS "Admin can view all logs" ON activity_logs;

CREATE POLICY "Admin can view all logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 7. Drop and re-create storage policies using the is_admin() function
DROP POLICY IF EXISTS "Admin can delete car images" ON storage.objects;

CREATE POLICY "Admin can delete car images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'car-images' AND public.is_admin());
