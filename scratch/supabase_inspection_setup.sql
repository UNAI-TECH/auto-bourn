-- =========================================================================
-- CAR INSPECTIONS SCHEMA & STORAGE CONFIGURATION FOR SUPABASE
-- Run this script in the Supabase SQL Editor.
-- =========================================================================

-- 1. CREATE CAR INSPECTIONS TABLE
CREATE TABLE IF NOT EXISTS car_inspections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  
  -- General / Header Info
  overall_condition VARCHAR(50) NOT NULL CHECK (overall_condition IN ('good', 'fair', 'poor')),
  recommended_action VARCHAR(50) NOT NULL CHECK (recommended_action IN ('approve', 'reject', 'hold')),
  estimated_value NUMERIC(12, 2),
  inspector_name VARCHAR(255) NOT NULL,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Vehicle Information
  reg_no VARCHAR(50),
  vin VARCHAR(50),
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  variant VARCHAR(150),
  year INTEGER NOT NULL,
  fuel_type VARCHAR(50),
  transmission_type VARCHAR(50),
  odometer INTEGER,
  owners INTEGER,

  -- Exterior Condition
  paint_condition VARCHAR(100),
  rust_inspection VARCHAR(100),
  body_condition TEXT[] DEFAULT '{}', -- Array of body defects
  windshield_condition VARCHAR(100),
  lights_working TEXT[] DEFAULT '{}', -- Array of functional lights
  tread_fl INTEGER,
  tread_fr INTEGER,
  tread_rl INTEGER,
  tread_rr INTEGER,
  spare_tyre VARCHAR(50),
  exterior_notes TEXT,

  -- Interior Condition
  odour VARCHAR(100),
  seat_condition VARCHAR(100),
  seatbelt_check VARCHAR(100),
  ac_working VARCHAR(100),
  info_working VARCHAR(100),
  win_working VARCHAR(100),
  lock_working VARCHAR(100),
  horn_working VARCHAR(100),
  warning_lights TEXT[] DEFAULT '{}', -- Array of active warning lights
  interior_remarks TEXT,

  -- Mechanical & Suspension
  engine_oil VARCHAR(100),
  coolant VARCHAR(100),
  brake_fluid VARCHAR(100),
  steering_fluid VARCHAR(100),
  leakages TEXT[] DEFAULT '{}',
  battery_age INTEGER, -- in months
  battery_terminal VARCHAR(100),
  transmission_response VARCHAR(100),
  bounce_test VARCHAR(100),
  frame_condition VARCHAR(100),
  alignment VARCHAR(100),
  suspension_noise VARCHAR(100),
  mechanical_comments TEXT,

  -- Test Drive & Docs
  cold_start VARCHAR(100),
  steering_performance VARCHAR(100),
  brake_performance VARCHAR(100),
  acceleration VARCHAR(100),
  test_drive_noises TEXT[] DEFAULT '{}',
  test_drive_notes TEXT,
  docs_verified TEXT[] DEFAULT '{}',
  vehicle_type VARCHAR(100),
  warranty_available VARCHAR(100),

  -- Media & Document URLs Map
  uploads JSONB DEFAULT '{}'::jsonb, -- e.g. {"Exterior_Front": "url", "Documents": "url"}

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_inspections_lead ON car_inspections(lead_id);
CREATE INDEX IF NOT EXISTS idx_inspections_employee ON car_inspections(employee_id);
CREATE INDEX IF NOT EXISTS idx_inspections_brand_model ON car_inspections(brand, model);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE car_inspections ENABLE ROW LEVEL SECURITY;

-- Select Policy: Authenticated employees & admins can view all inspections
DROP POLICY IF EXISTS "Authenticated users can view inspections" ON car_inspections;
CREATE POLICY "Authenticated users can view inspections"
  ON car_inspections FOR SELECT
  TO authenticated
  USING (true);

-- Insert Policy: Employees can log new inspections
DROP POLICY IF EXISTS "Employees can log inspections" ON car_inspections;
CREATE POLICY "Employees can log inspections"
  ON car_inspections FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    ) OR public.is_admin()
  );

-- Update Policy: Admins can update any inspection, employees can update their own
DROP POLICY IF EXISTS "Modify inspections permission" ON car_inspections;
CREATE POLICY "Modify inspections permission"
  ON car_inspections FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    ) OR public.is_admin()
  );

-- Delete Policy: Only admins can delete inspections
DROP POLICY IF EXISTS "Admins can delete inspections" ON car_inspections;
CREATE POLICY "Admins can delete inspections"
  ON car_inspections FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 4. TIMESTAMPTZ AUTOMATIC TRIGGER
CREATE TRIGGER car_inspections_updated_at
  BEFORE UPDATE ON car_inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 5. CREATE STORAGE BUCKET FOR LEAD DOCUMENTS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lead-documents', 'lead-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for 'lead-documents' bucket
DROP POLICY IF EXISTS "Public read lead documents" ON storage.objects;
CREATE POLICY "Public read lead documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'lead-documents');

DROP POLICY IF EXISTS "Authenticated users upload lead documents" ON storage.objects;
CREATE POLICY "Authenticated users upload lead documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'lead-documents');

DROP POLICY IF EXISTS "Authenticated users update lead documents" ON storage.objects;
CREATE POLICY "Authenticated users update lead documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'lead-documents');

DROP POLICY IF EXISTS "Admins delete lead documents" ON storage.objects;
CREATE POLICY "Admins delete lead documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'lead-documents' AND public.is_admin());
