// src/types/crm.ts — Auto Bourn CRM TypeScript Interfaces

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'follow_up_pending'
  | 'test_drive_scheduled'
  | 'negotiation'
  | 'booking_done'
  | 'sold'
  | 'lost';

export type LeadSource =
  | 'website'
  | 'instagram'
  | 'facebook'
  | 'whatsapp'
  | 'walk_in'
  | 'referral'
  | 'olx'
  | 'cardekho'
  | 'manual';

export type FollowUpType = 'call' | 'whatsapp' | 'sms' | 'meeting' | 'test_drive' | 'email';
export type FollowUpPriority = 'low' | 'normal' | 'high';
export type FollowUpStatus = 'pending' | 'completed' | 'missed' | 'cancelled';

export interface Lead {
  id: string;
  customer_name: string;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  occupation: string | null;
  source: LeadSource;
  interested_car: string | null;
  preferred_brand: string | null;
  budget: number | null;
  purchase_timeline: string | null;
  lead_status: LeadStatus;
  assigned_to: string | null;
  created_by: string | null;
  lost_reason: string | null;
  created_at: string;
  updated_at: string;
  wa_greeting_sent?: boolean;
  // Joined
  assigned_employee?: { name: string; employee_id: string } | null;
  created_by_employee?: { name: string; employee_id: string } | null;
  follow_ups?: FollowUp[];
  customer_notes?: CustomerNote[];
}

export interface FollowUp {
  id: string;
  lead_id: string;
  employee_id: string;
  follow_up_type: FollowUpType;
  scheduled_at: string;
  notes: string | null;
  priority: FollowUpPriority;
  status: FollowUpStatus;
  completed_at: string | null;
  created_at: string;
  // Joined
  employee?: { name: string; employee_id: string } | null;
  lead?: { customer_name: string; phone: string } | null;
}

export interface CustomerNote {
  id: string;
  lead_id: string;
  employee_id: string;
  note: string;
  created_at: string;
  // Joined
  employee?: { name: string; employee_id: string } | null;
}

export interface TestDrive {
  id: string;
  lead_id: string;
  employee_id: string | null;
  car_id: string | null;
  car_name: string | null;
  scheduled_at: string;
  location: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  result: 'interested' | 'not_interested' | 'needs_follow_up' | null;
  customer_feedback: string | null;
  notes: string | null;
  created_at: string;
  employee?: { name: string } | null;
}

export interface Booking {
  id: string;
  lead_id: string;
  employee_id: string | null;
  car_id: string | null;
  car_name: string | null;
  booking_amount: number | null;
  total_amount: number | null;
  payment_status: 'pending' | 'partial' | 'completed';
  delivery_status: 'pending' | 'processing' | 'completed' | 'cancelled';
  finance_status: 'na' | 'pending' | 'approved' | 'rejected';
  insurance_status: 'pending' | 'processing' | 'completed';
  rto_status: 'pending' | 'processing' | 'completed';
  expected_delivery: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CRMActivityLog {
  id: string;
  employee_id: string | null;
  lead_id: string | null;
  action: string;
  details: string | null;
  created_at: string;
  employee?: { name: string; employee_id: string } | null;
}

// UI helpers
export const LEAD_STAGES: { key: LeadStatus; label: string; color: string; bg: string }[] = [
  { key: 'new',                    label: 'New Lead',              color: '#6366f1', bg: 'rgba(99,102,241,.12)' },
  { key: 'contacted',              label: 'Contacted',             color: '#3b82f6', bg: 'rgba(59,130,246,.12)' },
  { key: 'interested',             label: 'Interested',            color: '#06b6d4', bg: 'rgba(6,182,212,.12)'  },
  { key: 'follow_up_pending',      label: 'Follow-up Pending',     color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  { key: 'test_drive_scheduled',   label: 'Test Drive Scheduled',  color: '#8b5cf6', bg: 'rgba(139,92,246,.12)' },
  { key: 'negotiation',            label: 'Negotiation',           color: '#ec4899', bg: 'rgba(236,72,153,.12)' },
  { key: 'booking_done',           label: 'Booking Done',          color: '#22c55e', bg: 'rgba(34,197,94,.12)'  },
  { key: 'sold',                   label: 'Sold',                  color: '#E10613', bg: 'rgba(225,6,19,.12)'   },
  { key: 'lost',                   label: 'Lost',                  color: '#6b7280', bg: 'rgba(107,114,128,.12)' },
];

export const SOURCE_LABELS: Record<LeadSource, string> = {
  website: 'Website', instagram: 'Instagram', facebook: 'Facebook',
  whatsapp: 'WhatsApp', walk_in: 'Walk-in', referral: 'Referral',
  olx: 'OLX', cardekho: 'CarDekho', manual: 'Manual Entry',
};

export const FOLLOW_UP_TYPE_LABELS: Record<FollowUpType, string> = {
  call: 'Call', whatsapp: 'WhatsApp', sms: 'SMS',
  meeting: 'Meeting', test_drive: 'Test Drive', email: 'Email',
};

export const formatBudget = (n: number | null): string => {
  if (!n) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

export type WhatsAppMessageType =
  | 'sell_car_greeting'
  | 'contact_greeting'
  | 'crm_welcome'
  | 'follow_up_reminder'
  | 'booking_confirmation'
  | 'custom';

export interface WhatsAppMessageLog {
  id: string;
  lead_id: string;
  phone: string;
  message_type: WhatsAppMessageType;
  template_sid: string | null;
  message_body: string | null;
  twilio_message_sid: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'undelivered';
  error_message: string | null;
  created_at: string;
}

