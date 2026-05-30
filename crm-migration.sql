-- ============================================
-- AUTO BOURN CRM — Database Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  whatsapp VARCHAR(20),
  email VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  occupation VARCHAR(100),
  source VARCHAR(30) DEFAULT 'manual'
    CHECK (source IN ('website','instagram','facebook','whatsapp','walk_in','referral','olx','cardekho','manual')),
  interested_car VARCHAR(255),
  preferred_brand VARCHAR(100),
  budget BIGINT,
  purchase_timeline VARCHAR(50),
  lead_status VARCHAR(30) DEFAULT 'new'
    CHECK (lead_status IN ('new','contacted','interested','follow_up_pending','test_drive_scheduled','negotiation','booking_done','sold','lost')),
  assigned_to UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  lost_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FOLLOW-UPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  follow_up_type VARCHAR(20) DEFAULT 'call'
    CHECK (follow_up_type IN ('call','whatsapp','sms','meeting','test_drive','email')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  priority VARCHAR(10) DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high')),
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','completed','missed','cancelled')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMER NOTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customer_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TEST DRIVES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS test_drives (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  car_name VARCHAR(255),
  scheduled_at TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),
  status VARCHAR(20) DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  result VARCHAR(20)
    CHECK (result IN ('interested','not_interested','needs_follow_up')),
  customer_feedback TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  car_name VARCHAR(255),
  booking_amount BIGINT,
  total_amount BIGINT,
  payment_status VARCHAR(20) DEFAULT 'pending'
    CHECK (payment_status IN ('pending','partial','completed')),
  delivery_status VARCHAR(20) DEFAULT 'pending'
    CHECK (delivery_status IN ('pending','processing','completed','cancelled')),
  finance_status VARCHAR(20) DEFAULT 'na'
    CHECK (finance_status IN ('na','pending','approved','rejected')),
  insurance_status VARCHAR(20) DEFAULT 'pending'
    CHECK (insurance_status IN ('pending','processing','completed')),
  rto_status VARCHAR(20) DEFAULT 'pending'
    CHECK (rto_status IN ('pending','processing','completed')),
  expected_delivery DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CRM ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS crm_activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  action VARCHAR(80) NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead ON follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_employee ON follow_ups(employee_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled ON follow_ups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_customer_notes_lead ON customer_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_test_drives_lead ON test_drives(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lead ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_logs_lead ON crm_activity_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_logs_employee ON crm_activity_logs(employee_id);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activity_logs ENABLE ROW LEVEL SECURITY;

-- LEADS POLICIES
DROP POLICY IF EXISTS "Admin can view all leads" ON leads;
CREATE POLICY "Admin can view all leads" ON leads FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can view assigned leads" ON leads;
CREATE POLICY "Employees can view assigned leads" ON leads FOR SELECT TO authenticated
  USING (assigned_to IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Employees can insert leads" ON leads;
CREATE POLICY "Employees can insert leads" ON leads FOR INSERT TO authenticated
  WITH CHECK (created_by IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Admin can update any lead" ON leads;
CREATE POLICY "Admin can update any lead" ON leads FOR UPDATE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can update assigned leads" ON leads;
CREATE POLICY "Employees can update assigned leads" ON leads FOR UPDATE TO authenticated
  USING (assigned_to IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Admin can delete leads" ON leads;
CREATE POLICY "Admin can delete leads" ON leads FOR DELETE TO authenticated USING (public.is_admin());

-- FOLLOW-UPS POLICIES
DROP POLICY IF EXISTS "Admin can view all follow_ups" ON follow_ups;
CREATE POLICY "Admin can view all follow_ups" ON follow_ups FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can view own follow_ups" ON follow_ups;
CREATE POLICY "Employees can view own follow_ups" ON follow_ups FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Employees can insert follow_ups" ON follow_ups;
CREATE POLICY "Employees can insert follow_ups" ON follow_ups FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Employees can update own follow_ups" ON follow_ups;
CREATE POLICY "Employees can update own follow_ups" ON follow_ups FOR UPDATE TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()) OR public.is_admin());

-- CUSTOMER NOTES POLICIES
DROP POLICY IF EXISTS "Admin can view all notes" ON customer_notes;
CREATE POLICY "Admin can view all notes" ON customer_notes FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can view notes on assigned leads" ON customer_notes;
CREATE POLICY "Employees can view notes on assigned leads" ON customer_notes FOR SELECT TO authenticated
  USING (lead_id IN (SELECT id FROM leads WHERE assigned_to IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())));

DROP POLICY IF EXISTS "Employees can insert notes" ON customer_notes;
CREATE POLICY "Employees can insert notes" ON customer_notes FOR INSERT TO authenticated WITH CHECK (true);

-- TEST DRIVES POLICIES
DROP POLICY IF EXISTS "Admin can manage all test_drives" ON test_drives;
CREATE POLICY "Admin can manage all test_drives" ON test_drives FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can manage own test_drives" ON test_drives;
CREATE POLICY "Employees can manage own test_drives" ON test_drives FOR ALL TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

-- BOOKINGS POLICIES
DROP POLICY IF EXISTS "Admin can manage all bookings" ON bookings;
CREATE POLICY "Admin can manage all bookings" ON bookings FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can manage own bookings" ON bookings;
CREATE POLICY "Employees can manage own bookings" ON bookings FOR ALL TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

-- CRM ACTIVITY LOGS POLICIES
DROP POLICY IF EXISTS "Admin can view all crm logs" ON crm_activity_logs;
CREATE POLICY "Admin can view all crm logs" ON crm_activity_logs FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Employees can view own crm logs" ON crm_activity_logs;
CREATE POLICY "Employees can view own crm logs" ON crm_activity_logs FOR SELECT TO authenticated
  USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated can insert crm logs" ON crm_activity_logs;
CREATE POLICY "Authenticated can insert crm logs" ON crm_activity_logs FOR INSERT TO authenticated WITH CHECK (true);
