-- 1. Alter the status check constraint to allow 'early_out'
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_status_check 
  CHECK (status IN ('present', 'absent', 'half_day', 'late', 'early_out'));

-- 2. Update update_daily_attendance_record trigger function
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
  
  -- Time thresholds in Asia/Kolkata
  v_first_in_time TIME;
  v_last_out_time TIME;
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

  -- Default late minutes
  v_late_minutes := 0;

  IF v_first_in IS NOT NULL THEN
    -- Extract time of day in India timezone
    v_first_in_time := (v_first_in AT TIME ZONE 'Asia/Kolkata')::TIME;
    
    -- Extract checkout time of day if available
    IF v_last_out IS NOT NULL THEN
      v_last_out_time := (v_last_out AT TIME ZONE 'Asia/Kolkata')::TIME;
    ELSE
      v_last_out_time := NULL;
    END IF;

    -- ====================================================
    -- ATTENDANCE RULE LOGIC (Asia/Kolkata)
    -- ====================================================
    
    -- Rule 1 & 2: Punch after 5:00 PM (17:00:00) as first punch -> Absent
    IF v_first_in_time > '17:00:00'::TIME THEN
      INSERT INTO attendance_records (
        employee_id, attendance_date, first_punch_in, last_punch_out, 
        total_hours, punch_count, source, status, late_by_minutes, updated_at
      )
      VALUES (
        v_employee_id, v_date, v_first_in, v_last_out, 
        v_total_hours, v_punch_count, 'biometric', 'absent', 0, NOW()
      )
      ON CONFLICT (employee_id, attendance_date) DO UPDATE
      SET 
        first_punch_in = EXCLUDED.first_punch_in,
        last_punch_out = EXCLUDED.last_punch_out,
        total_hours = EXCLUDED.total_hours,
        punch_count = EXCLUDED.punch_count,
        late_by_minutes = 0,
        source = 'biometric',
        status = 'absent',
        updated_at = NOW();
        
      RETURN NULL;
    END IF;

    -- Rule 3: Punch after 10:15 AM but before 5:00 PM -> Late
    IF v_first_in_time > '10:15:00'::TIME THEN
      v_late_minutes := EXTRACT(EPOCH FROM (v_first_in_time - '10:15:00'::TIME)) / 60;
      
      INSERT INTO attendance_records (
        employee_id, attendance_date, first_punch_in, last_punch_out, 
        total_hours, punch_count, source, status, late_by_minutes, updated_at
      )
      VALUES (
        v_employee_id, v_date, v_first_in, v_last_out, 
        v_total_hours, v_punch_count, 'biometric', 'late', v_late_minutes, NOW()
      )
      ON CONFLICT (employee_id, attendance_date) DO UPDATE
      SET 
        first_punch_in = EXCLUDED.first_punch_in,
        last_punch_out = EXCLUDED.last_punch_out,
        total_hours = EXCLUDED.total_hours,
        punch_count = EXCLUDED.punch_count,
        late_by_minutes = EXCLUDED.late_by_minutes,
        source = 'biometric',
        status = 'late',
        updated_at = NOW();
        
      RETURN NULL;
    END IF;

    -- Rule 4: Punch within 10:15 AM -> Present
    -- Check if they punched out early (before 6:55 PM / 18:55:00)
    IF v_last_out_time IS NOT NULL AND v_last_out_time < '18:55:00'::TIME THEN
      -- Early Out
      INSERT INTO attendance_records (
        employee_id, attendance_date, first_punch_in, last_punch_out, 
        total_hours, punch_count, source, status, late_by_minutes, updated_at
      )
      VALUES (
        v_employee_id, v_date, v_first_in, v_last_out, 
        v_total_hours, v_punch_count, 'biometric', 'early_out', 0, NOW()
      )
      ON CONFLICT (employee_id, attendance_date) DO UPDATE
      SET 
        first_punch_in = EXCLUDED.first_punch_in,
        last_punch_out = EXCLUDED.last_punch_out,
        total_hours = EXCLUDED.total_hours,
        punch_count = EXCLUDED.punch_count,
        late_by_minutes = 0,
        source = 'biometric',
        status = 'early_out',
        updated_at = NOW();
    ELSE
      -- Present (normal green output)
      INSERT INTO attendance_records (
        employee_id, attendance_date, first_punch_in, last_punch_out, 
        total_hours, punch_count, source, status, late_by_minutes, updated_at
      )
      VALUES (
        v_employee_id, v_date, v_first_in, v_last_out, 
        v_total_hours, v_punch_count, 'biometric', 'present', 0, NOW()
      )
      ON CONFLICT (employee_id, attendance_date) DO UPDATE
      SET 
        first_punch_in = EXCLUDED.first_punch_in,
        last_punch_out = EXCLUDED.last_punch_out,
        total_hours = EXCLUDED.total_hours,
        punch_count = EXCLUDED.punch_count,
        late_by_minutes = 0,
        source = 'biometric',
        status = 'present',
        updated_at = NOW();
    END IF;
  ELSE
    -- If first_in is null (shouldn't happen on trigger unless deleted)
    INSERT INTO attendance_records (
      employee_id, attendance_date, first_punch_in, last_punch_out, 
      total_hours, punch_count, source, status, late_by_minutes, updated_at
    )
    VALUES (
      v_employee_id, v_date, NULL, NULL, 
      0.00, 0, 'biometric', 'absent', 0, NOW()
    )
    ON CONFLICT (employee_id, attendance_date) DO UPDATE
    SET 
      first_punch_in = NULL,
      last_punch_out = NULL,
      total_hours = 0.00,
      punch_count = 0,
      late_by_minutes = 0,
      source = 'biometric',
      status = 'absent',
      updated_at = NOW();
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop and recreate the trigger
DROP TRIGGER IF EXISTS trg_update_daily_attendance_record ON biometric_punches;
CREATE TRIGGER trg_update_daily_attendance_record
  AFTER INSERT OR UPDATE OR DELETE ON biometric_punches
  FOR EACH ROW EXECUTE FUNCTION update_daily_attendance_record();

-- 4. Shift today's existing punches by -5.5 hours to fix the timezone offset mismatch
UPDATE biometric_punches
SET punch_time = punch_time - INTERVAL '5 hours 30 minutes'
WHERE (punch_time AT TIME ZONE 'UTC')::DATE = '2026-07-10';

-- 5. Force trigger execution on today's punches to recalculate attendance_records
UPDATE biometric_punches
SET punch_time = punch_time
WHERE (punch_time AT TIME ZONE 'Asia/Kolkata')::DATE = '2026-07-10';
