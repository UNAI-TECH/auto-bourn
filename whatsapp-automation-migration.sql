-- ============================================
-- AUTO BOURN CRM — WhatsApp Automation Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add wa_greeting_sent column to leads table if it doesn't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS wa_greeting_sent BOOLEAN DEFAULT FALSE;

-- 2. Create whatsapp_message_logs table
CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  message_type VARCHAR(30) NOT NULL
    CHECK (message_type IN ('sell_car_greeting', 'contact_greeting', 'crm_welcome', 'follow_up_reminder', 'booking_confirmation', 'custom')),
  template_sid VARCHAR(100),
  message_body TEXT,
  twilio_message_sid VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'undelivered')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Indexes for optimization
CREATE INDEX IF NOT EXISTS idx_wa_logs_lead ON whatsapp_message_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_wa_logs_phone ON whatsapp_message_logs(phone);
CREATE INDEX IF NOT EXISTS idx_wa_logs_status ON whatsapp_message_logs(status);
CREATE INDEX IF NOT EXISTS idx_wa_logs_created ON whatsapp_message_logs(created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE whatsapp_message_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for whatsapp_message_logs

-- Admin can view all logs
DROP POLICY IF EXISTS "Admin can view all whatsapp logs" ON whatsapp_message_logs;
CREATE POLICY "Admin can view all whatsapp logs" ON whatsapp_message_logs 
  FOR SELECT TO authenticated USING (public.is_admin());

-- Employees can view logs for leads they have access to
DROP POLICY IF EXISTS "Employees can view own assigned whatsapp logs" ON whatsapp_message_logs;
CREATE POLICY "Employees can view own assigned whatsapp logs" ON whatsapp_message_logs
  FOR SELECT TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM leads 
      WHERE assigned_to IN (
        SELECT id FROM employees WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Authenticated roles (employees/admin) can insert logs
DROP POLICY IF EXISTS "Authenticated can insert whatsapp logs" ON whatsapp_message_logs;
CREATE POLICY "Authenticated can insert whatsapp logs" ON whatsapp_message_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated roles can update whatsapp logs (e.g. to update status from Twilio callbacks)
DROP POLICY IF EXISTS "Authenticated can update whatsapp logs" ON whatsapp_message_logs;
CREATE POLICY "Authenticated can update whatsapp logs" ON whatsapp_message_logs
  FOR UPDATE TO authenticated USING (true);
