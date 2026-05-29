-- =====================================================
-- AUTO BOURN — Daily Reports Table Migration
-- Run this in Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT NOT NULL,
  uploads_count INTEGER DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed')),
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(employee_id, report_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_employee ON daily_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_reports_status ON daily_reports(status);

-- Enable RLS
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- Admin can view all reports
DROP POLICY IF EXISTS "Admin can view all daily reports" ON daily_reports;
CREATE POLICY "Admin can view all daily reports"
  ON daily_reports FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Employees can view their own reports
DROP POLICY IF EXISTS "Employees can view own daily reports" ON daily_reports;
CREATE POLICY "Employees can view own daily reports"
  ON daily_reports FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Employees can insert their own reports
DROP POLICY IF EXISTS "Employees can insert own daily reports" ON daily_reports;
CREATE POLICY "Employees can insert own daily reports"
  ON daily_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
  );

-- Employees can update own unreviewed reports (same day edit)
DROP POLICY IF EXISTS "Employees can update own daily reports" ON daily_reports;
CREATE POLICY "Employees can update own daily reports"
  ON daily_reports FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE auth_user_id = auth.uid()
    )
    AND status = 'submitted'
  );

-- Admin can update reports (to mark as reviewed, add notes)
DROP POLICY IF EXISTS "Admin can update daily reports" ON daily_reports;
CREATE POLICY "Admin can update daily reports"
  ON daily_reports FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipient_role VARCHAR(20) NOT NULL CHECK (recipient_role IN ('admin', 'employee')),
  recipient_employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Admin sees all admin notifications
DROP POLICY IF EXISTS "Admin can view admin notifications" ON notifications;
CREATE POLICY "Admin can view admin notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    (recipient_role = 'admin' AND public.is_admin())
    OR (
      recipient_role = 'employee'
      AND recipient_employee_id IN (
        SELECT id FROM employees WHERE auth_user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Authenticated can insert notifications" ON notifications;
CREATE POLICY "Authenticated can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    (recipient_role = 'admin' AND public.is_admin())
    OR (
      recipient_role = 'employee'
      AND recipient_employee_id IN (
        SELECT id FROM employees WHERE auth_user_id = auth.uid()
      )
    )
  );
