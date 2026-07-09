-- =====================================================
-- AUTO BOURN CRM — Call Sessions Migration
-- Run this in Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_calls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  call_status VARCHAR(20) NOT NULL DEFAULT 'called' CHECK (call_status IN ('called', 'missed', 'no_answer')),
  talking_time INTEGER DEFAULT 0, -- in seconds
  review VARCHAR(50) CHECK (review IN ('highly not interested', 'not interested', 'neutral', 'interested', 'very much interested')),
  notes TEXT,
  recording_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_employee_calls_lead ON employee_calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_employee_calls_employee ON employee_calls(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_calls_created ON employee_calls(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE employee_calls ENABLE ROW LEVEL SECURITY;

-- Policies for security compliance
DROP POLICY IF EXISTS "Admin can manage all employee_calls" ON employee_calls;
CREATE POLICY "Admin can manage all employee_calls" ON employee_calls FOR ALL TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can view own calls" ON employee_calls;
CREATE POLICY "Employees can view own calls" ON employee_calls FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Employees can insert calls" ON employee_calls;
CREATE POLICY "Employees can insert calls" ON employee_calls FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Employees can update own calls" ON employee_calls;
CREATE POLICY "Employees can update own calls" ON employee_calls FOR UPDATE TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

-- Add column if table already exists
ALTER TABLE employee_calls ADD COLUMN IF NOT EXISTS recording_url TEXT;
