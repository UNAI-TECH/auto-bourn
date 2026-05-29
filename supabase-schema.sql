-- ============================================
-- AUTO BOURN — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  phone VARCHAR(20),
  avatar_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CARS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cars (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  variant VARCHAR(200),
  year INTEGER NOT NULL,
  fuel_type VARCHAR(50) NOT NULL,
  transmission VARCHAR(50) NOT NULL,
  km_driven INTEGER NOT NULL DEFAULT 0,
  ownership VARCHAR(50),
  price BIGINT NOT NULL,
  original_price BIGINT,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  insurance_validity VARCHAR(100),
  registration_number VARCHAR(50),
  location VARCHAR(200),
  body_type VARCHAR(50),
  color VARCHAR(100),
  interior_color VARCHAR(100),
  engine VARCHAR(200),
  horsepower INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
  thumbnail TEXT,
  featured BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  sold_at TIMESTAMPTZ,
  sold_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CAR IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS car_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  details TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cars_employee ON cars(employee_id);
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_brand ON cars(brand);
CREATE INDEX IF NOT EXISTS idx_cars_created ON cars(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_car_images_car ON car_images(car_id);
CREATE INDEX IF NOT EXISTS idx_activity_employee ON activity_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employees_auth ON employees(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create helper function to check admin role (prevents RLS infinite recursion)
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

-- EMPLOYEES POLICIES
DROP POLICY IF EXISTS "Admin can view all employees" ON employees;
CREATE POLICY "Admin can view all employees"
  ON employees FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can view own record" ON employees;
CREATE POLICY "Employees can view own record"
  ON employees FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Admin can insert employees" ON employees;
CREATE POLICY "Admin can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update employees" ON employees;
CREATE POLICY "Admin can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete employees" ON employees;
CREATE POLICY "Admin can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- CARS POLICIES
DROP POLICY IF EXISTS "Authenticated users can view cars" ON cars;
CREATE POLICY "Authenticated users can view cars"
  ON cars FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can view available cars" ON cars;
CREATE POLICY "Public can view available cars"
  ON cars FOR SELECT
  TO anon
  USING (status = 'available');

DROP POLICY IF EXISTS "Employees can insert cars" ON cars;
CREATE POLICY "Employees can insert cars"
  ON cars FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin can update any car" ON cars;
CREATE POLICY "Admin can update any car"
  ON cars FOR UPDATE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can update own cars" ON cars;
CREATE POLICY "Employees can update own cars"
  ON cars FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin can delete any car" ON cars;
CREATE POLICY "Admin can delete any car"
  ON cars FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can delete own cars" ON cars;
CREATE POLICY "Employees can delete own cars"
  ON cars FOR DELETE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- CAR IMAGES POLICIES
DROP POLICY IF EXISTS "Anyone can view car images" ON car_images;
CREATE POLICY "Anyone can view car images"
  ON car_images FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can view car images" ON car_images;
CREATE POLICY "Public can view car images"
  ON car_images FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert car images" ON car_images;
CREATE POLICY "Authenticated users can insert car images"
  ON car_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can delete any car image" ON car_images;
CREATE POLICY "Admin can delete any car image"
  ON car_images FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can delete own car images" ON car_images;
CREATE POLICY "Employees can delete own car images"
  ON car_images FOR DELETE
  TO authenticated
  USING (
    car_id IN (
      SELECT c.id FROM cars c
      JOIN employees e ON c.employee_id = e.id
      WHERE e.auth_user_id = auth.uid()
    )
  );

-- ACTIVITY LOGS POLICIES
DROP POLICY IF EXISTS "Admin can view all logs" ON activity_logs;
CREATE POLICY "Admin can view all logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can view own logs" ON activity_logs;
CREATE POLICY "Employees can view own logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert logs" ON activity_logs;
CREATE POLICY "Authenticated users can insert logs"
  ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Run these in Supabase Storage settings or SQL:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('car-images', 'car-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public can view car images" ON storage.objects;
CREATE POLICY "Public can view car images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'car-images');

DROP POLICY IF EXISTS "Authenticated users can upload car images" ON storage.objects;
CREATE POLICY "Authenticated users can upload car images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'car-images');

DROP POLICY IF EXISTS "Authenticated users can update car images" ON storage.objects;
CREATE POLICY "Authenticated users can update car images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'car-images');

DROP POLICY IF EXISTS "Admin can delete car images" ON storage.objects;
CREATE POLICY "Admin can delete car images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'car-images' AND public.is_admin());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for cars
CREATE TRIGGER cars_updated_at
  BEFORE UPDATE ON cars
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger for employees
CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
