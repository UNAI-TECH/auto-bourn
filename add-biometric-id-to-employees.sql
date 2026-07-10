-- =======================================================
-- ADD BIOMETRIC ID (ROLL NUMBER) TO EMPLOYEES
-- Run this in Supabase SQL Editor
-- =======================================================

-- 1. Add biometric_id column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS biometric_id VARCHAR(50) UNIQUE;

-- 2. Update resolve_punch_employee trigger function to look up from employees table directly with fallback to enrollments
CREATE OR REPLACE FUNCTION resolve_punch_employee()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.employee_id IS NULL THEN
    -- Try employees table directly
    SELECT id INTO NEW.employee_id
    FROM employees
    WHERE biometric_id = NEW.device_user_id OR employee_id = NEW.device_user_id
    LIMIT 1;
    
    -- Fallback to biometric_enrollments
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
