-- ============================================
-- AUTO BOURN CRM — Biometric Attendance Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create Biometric Devices Registry Table
CREATE TABLE IF NOT EXISTS biometric_devices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  device_id VARCHAR(50) UNIQUE NOT NULL,
  device_name VARCHAR(100) NOT NULL,
  device_type VARCHAR(30) DEFAULT 'fingerprint' CHECK (device_type IN ('fingerprint', 'face', 'card', 'mixed')),
  location VARCHAR(200),
  api_key VARCHAR(100) UNIQUE NOT NULL,      -- Secure API key for webhook auth
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Biometric Device Enrollments Table (mapping device user IDs to CRM employee UUIDs)
CREATE TABLE IF NOT EXISTS biometric_enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  device_user_id VARCHAR(50) NOT NULL,       -- The User ID on the biometric machine (e.g. 101, AB001)
  biometric_type VARCHAR(20) DEFAULT 'fingerprint' CHECK (biometric_type IN ('fingerprint', 'face', 'card')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, device_user_id)
);

-- 3. Create Biometric Punches Table (Raw immutable log of punches)
CREATE TABLE IF NOT EXISTS biometric_punches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL REFERENCES biometric_devices(device_id) ON DELETE CASCADE,
  device_user_id VARCHAR(50) NOT NULL,
  punch_time TIMESTAMPTZ NOT NULL,
  punch_type SMALLINT NOT NULL,              -- 0 = Check In, 1 = Check Out
  verify_type SMALLINT,                      -- 1 = Fingerprint, 2 = Face, 4 = Card, etc.
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  raw_payload JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, device_user_id, punch_time)
);

-- 4. Create Unified Daily Attendance Records Table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  first_punch_in TIMESTAMPTZ,
  last_punch_out TIMESTAMPTZ,
  total_hours DECIMAL(5,2) DEFAULT 0.00,
  punch_count INTEGER DEFAULT 0,
  source VARCHAR(20) DEFAULT 'biometric' CHECK (source IN ('biometric', 'web_login', 'manual')),
  status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'half_day', 'late')),
  late_by_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, attendance_date)
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_biometric_enroll_employee ON biometric_enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_biometric_enroll_device_user ON biometric_enrollments(device_user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_punches_employee ON biometric_punches(employee_id);
CREATE INDEX IF NOT EXISTS idx_biometric_punches_time ON biometric_punches(punch_time DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_rec_employee ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_rec_date ON attendance_records(attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_rec_status ON attendance_records(status);

-- Enable Row Level Security (RLS)
ALTER TABLE biometric_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometric_punches ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- 1. Biometric Devices Policies
DROP POLICY IF EXISTS "Admin can manage biometric devices" ON biometric_devices;
CREATE POLICY "Admin can manage biometric devices" ON biometric_devices
  FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can view active biometric devices" ON biometric_devices;
CREATE POLICY "Employees can view active biometric devices" ON biometric_devices
  FOR SELECT TO authenticated USING (status = 'active');

-- 2. Biometric Enrollments Policies
DROP POLICY IF EXISTS "Admin can manage biometric enrollments" ON biometric_enrollments;
CREATE POLICY "Admin can manage biometric enrollments" ON biometric_enrollments
  FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can view own enrollments" ON biometric_enrollments;
CREATE POLICY "Employees can view own enrollments" ON biometric_enrollments
  FOR SELECT TO authenticated USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

-- 3. Biometric Punches Policies
DROP POLICY IF EXISTS "Admin can manage biometric punches" ON biometric_punches;
CREATE POLICY "Admin can manage biometric punches" ON biometric_punches
  FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can view own punches" ON biometric_punches;
CREATE POLICY "Employees can view own punches" ON biometric_punches
  FOR SELECT TO authenticated USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

-- 4. Attendance Records Policies
DROP POLICY IF EXISTS "Admin can manage all attendance records" ON attendance_records;
CREATE POLICY "Admin can manage all attendance records" ON attendance_records
  FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can view own attendance records" ON attendance_records;
CREATE POLICY "Employees can view own attendance records" ON attendance_records
  FOR SELECT TO authenticated USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

-- ============================================
-- TRIGGERS & FUNCTIONS FOR AUTOMATIC SYNC
-- ============================================

-- A. Before Insert trigger on biometric_punches to automatically resolve employee_id from enrollment mapping
CREATE OR REPLACE FUNCTION resolve_punch_employee()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employee_id IS NULL THEN
    -- Try employees table directly (via biometric_id or employee_id)
    SELECT id INTO NEW.employee_id
    FROM employees
    WHERE biometric_id = NEW.device_user_id OR employee_id = NEW.device_user_id
    LIMIT 1;
    
    -- Fallback to biometric_enrollments mapping
    IF NEW.employee_id IS NULL THEN
      SELECT employee_id INTO NEW.employee_id
      FROM biometric_enrollments
      WHERE device_user_id = NEW.device_user_id
      LIMIT 1;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_resolve_punch_employee ON biometric_punches;
CREATE TRIGGER trg_resolve_punch_employee
  BEFORE INSERT ON biometric_punches
  FOR EACH ROW EXECUTE FUNCTION resolve_punch_employee();


-- B. After insert/update/delete trigger on biometric_punches to update daily attendance record
CREATE OR REPLACE FUNCTION update_daily_attendance_record()
RETURNS TRIGGER AS $$
DECLARE
  v_employee_id UUID;
  v_date DATE;
  v_first_in TIMESTAMPTZ;
  v_last_out TIMESTAMPTZ;
  v_total_hours DECIMAL(5,2);
  v_punch_count INTEGER;
  v_late_minutes INTEGER;
  v_office_start TIMESTAMPTZ;
BEGIN
  v_employee_id := COALESCE(NEW.employee_id, OLD.employee_id);
  IF v_employee_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Force date into Asia/Kolkata (IST) timezone
  v_date := (COALESCE(NEW.punch_time, OLD.punch_time) AT TIME ZONE 'Asia/Kolkata')::DATE;

  -- Fetch all punches on this date for this employee
  SELECT 
    MIN(punch_time), 
    MAX(punch_time),
    COUNT(*)
  INTO 
    v_first_in, 
    v_last_out, 
    v_punch_count
  FROM biometric_punches
  WHERE employee_id = v_employee_id 
    AND (punch_time AT TIME ZONE 'Asia/Kolkata')::DATE = v_date;

  -- Calculate total hours worked
  IF v_first_in IS NOT NULL AND v_last_out IS NOT NULL AND v_first_in < v_last_out THEN
    v_total_hours := ROUND(EXTRACT(EPOCH FROM (v_last_out - v_first_in)) / 3600.0, 2);
  ELSE
    v_total_hours := 0.00;
    v_last_out := NULL;
  END IF;

  -- Calculate late minutes (Office starts at 09:30 AM IST)
  v_office_start := (v_date || ' 09:30:00')::TIMESTAMP AT TIME ZONE 'Asia/Kolkata';
  IF v_first_in > v_office_start THEN
    v_late_minutes := EXTRACT(EPOCH FROM (v_first_in - v_office_start)) / 60;
  ELSE
    v_late_minutes := 0;
  END IF;

  -- Upsert daily record
  INSERT INTO attendance_records (
    employee_id,
    attendance_date,
    first_punch_in,
    last_punch_out,
    total_hours,
    punch_count,
    source,
    status,
    late_by_minutes,
    updated_at
  )
  VALUES (
    v_employee_id,
    v_date,
    v_first_in,
    v_last_out,
    v_total_hours,
    v_punch_count,
    'biometric',
    CASE 
      WHEN v_total_hours >= 8.00 THEN 'present'
      WHEN v_total_hours >= 4.00 THEN 'half_day'
      WHEN v_late_minutes > 0 THEN 'late'
      ELSE 'present'
    END,
    v_late_minutes,
    NOW()
  )
  ON CONFLICT (employee_id, attendance_date) DO UPDATE
  SET 
    first_punch_in = EXCLUDED.first_punch_in,
    last_punch_out = EXCLUDED.last_punch_out,
    total_hours = EXCLUDED.total_hours,
    punch_count = EXCLUDED.punch_count,
    late_by_minutes = EXCLUDED.late_by_minutes,
    source = 'biometric', -- Upgrade from web_login if device record arrives
    status = CASE 
      WHEN EXCLUDED.total_hours >= 8.00 THEN 'present'
      WHEN EXCLUDED.total_hours >= 4.00 THEN 'half_day'
      WHEN EXCLUDED.late_by_minutes > 0 THEN 'late'
      ELSE 'present'
    END,
    updated_at = NOW();

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_daily_attendance_record ON biometric_punches;
CREATE TRIGGER trg_update_daily_attendance_record
  AFTER INSERT OR UPDATE OR DELETE ON biometric_punches
  FOR EACH ROW EXECUTE FUNCTION update_daily_attendance_record();



