// Auto Bourn Database Types

export type UserRole = 'admin' | 'employee';
export type CarStatus = 'available' | 'sold' | 'reserved' | 'pending' | 'rejected';
export type EmployeeStatus = 'active' | 'inactive' | 'suspended';
export type ActivityAction = 'login' | 'logout' | 'upload' | 'edit' | 'delete' | 'sold_status_change' | 'employee_added' | 'employee_removed' | 'password_reset' | 'biometric_checkin' | 'biometric_checkout';

export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar_url?: string;
  created_at: string;
  status: EmployeeStatus;
  auth_user_id: string;
}

export interface BiometricDevice {
  id: string;
  device_id: string;
  device_name: string;
  device_type: 'fingerprint' | 'face' | 'card' | 'mixed';
  location?: string;
  api_key: string;
  status: 'active' | 'inactive';
  last_heartbeat?: string;
  created_at: string;
}

export interface BiometricEnrollment {
  id: string;
  employee_id: string;
  device_user_id: string;
  biometric_type: 'fingerprint' | 'face' | 'card';
  enrolled_at: string;
  employee?: Employee;
}

export interface BiometricPunch {
  id: string;
  device_id: string;
  device_user_id: string;
  punch_time: string;
  punch_type: number;
  verify_type?: number;
  employee_id?: string;
  raw_payload?: Record<string, unknown>;
  synced_at: string;
  employee?: Employee;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  first_punch_in?: string;
  last_punch_out?: string;
  total_hours: number;
  punch_count: number;
  source: 'biometric' | 'web_login' | 'manual';
  status: 'present' | 'absent' | 'half_day' | 'late';
  late_by_minutes: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface Car {
  id: string;
  employee_id: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  fuel_type: string;
  transmission: string;
  km_driven: number;
  ownership: string;
  price: number;
  original_price?: number;
  description: string;
  features: string[];
  insurance_validity?: string;
  registration_number?: string;
  location?: string;
  body_type?: string;
  color?: string;
  interior_color?: string;
  engine?: string;
  horsepower?: number;
  status: CarStatus;
  rejection_reason?: string | null;
  thumbnail: string;
  featured: boolean;
  views: number;
  created_at: string;
  updated_at: string;
  sold_at?: string;
  sold_by?: string;
  // Joined fields
  employee?: Employee;
}

export interface CarImage {
  id: string;
  car_id: string;
  image_url: string;
  display_order: number;
  uploaded_at: string;
}

export interface ActivityLog {
  id: string;
  employee_id: string;
  action: ActivityAction;
  details: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  // Joined fields
  employee?: Employee;
}

export interface DashboardStats {
  total_cars: number;
  total_sold: number;
  total_available: number;
  total_reserved: number;
  enquiries: number;
  present: number;
  absent: number;
  test_drives: number;
}

export interface EmployeePerformance {
  employee_id: string;
  name: string;
  total_uploads: number;
  total_sold: number;
  last_upload: string | null;
}

export interface UploadActivity {
  date: string;
  count: number;
}

export interface BrandAnalytics {
  brand: string;
  total: number;
  sold: number;
  available: number;
}
