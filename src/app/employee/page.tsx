'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useEmpContext } from './layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, ShoppingCart, Clock, Upload, TrendingUp, Check, 
  ChevronRight, Calendar, User, FileText, ArrowRight, Eye, ClipboardList,
  PhoneCall, Bookmark, Camera, AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice, timeAgo, getProxiedImageUrl } from '@/lib/utils';
import type { Car as CarType, ActivityLog } from '@/types/database';
import type { Lead } from '@/types/crm';

interface DayObject {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
}

const getDaysInMonth = (year: number, month: number): DayObject[] => {
  const days: DayObject[] = [];
  const firstDay = new Date(year, month, 1);
  const firstDayIndex = firstDay.getDay(); // 0 = Sun, 1 = Mon, ...

  // 1. Previous month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({
      day: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      isCurrentMonth: false,
    });
  }

  // 2. Current month days
  const totalDays = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= totalDays; i++) {
    days.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true,
    });
  }

  // 3. Next month padding
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      day: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      isCurrentMonth: false,
    });
  }

  return days;
};

interface CustomDatePickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

const CustomDatePicker = ({ label, value, onChange }: CustomDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const getInitialYM = () => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        return { year: Number(parts[0]), month: Number(parts[1]) - 1 };
      }
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  };

  const initialYM = getInitialYM();
  const [currentYear, setCurrentYear] = useState(initialYM.year);
  const [currentMonth, setCurrentMonth] = useState(initialYM.month);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getDisplayDate = () => {
    if (!value) return 'Select Date';
    // Format to local date string to avoid timezone shifts
    const parts = value.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (dayObj: { day: number; month: number; year: number }) => {
    const y = dayObj.year;
    const m = String(dayObj.month + 1).padStart(2, '0');
    const d = String(dayObj.day).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const calendarDays = getDaysInMonth(currentYear, currentMonth);

  return (
    <div className="custom-date-picker-container" ref={containerRef}>
      <label className="datepicker-label">{label}</label>
      <div 
        className={`datepicker-trigger-btn ${isOpen ? 'active' : ''}`}
        onClick={() => {
          if (value) {
            const parts = value.split('-');
            if (parts.length === 3) {
              setCurrentYear(Number(parts[0]));
              setCurrentMonth(Number(parts[1]) - 1);
            }
          }
          setIsOpen(!isOpen);
        }}
      >
        <span>{getDisplayDate()}</span>
        <Calendar size={14} style={{ color: 'var(--db-tx3)' }} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="calendar-dropdown-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
          >
            <div className="calendar-dropdown-header">
              <button type="button" className="cal-nav-btn" onClick={handlePrevMonth}>
                &larr;
              </button>
              <div className="cal-current-month-year">
                {months[currentMonth]} {currentYear}
              </div>
              <button type="button" className="cal-nav-btn" onClick={handleNextMonth}>
                &rarr;
              </button>
            </div>

            <div className="calendar-weekdays-grid">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <div key={d} className="calendar-weekday-lbl">{d}</div>
              ))}
            </div>

            <div className="calendar-days-grid">
              {calendarDays.map((dObj, idx) => {
                let isSelected = false;
                if (value) {
                  const parts = value.split('-');
                  if (parts.length === 3) {
                    isSelected = 
                      Number(parts[2]) === dObj.day &&
                      (Number(parts[1]) - 1) === dObj.month &&
                      Number(parts[0]) === dObj.year;
                  }
                }

                const dayDate = new Date(dObj.year, dObj.month, dObj.day);
                const isToday = dayDate.toDateString() === new Date().toDateString();

                return (
                  <div 
                    key={idx}
                    className={`calendar-day-btn ${dObj.isCurrentMonth ? 'current' : 'outside'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                    onClick={() => handleSelectDay(dObj)}
                  >
                    {dObj.day}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function EmployeeDashboard() {
  const { employee, refreshEmployee } = useEmpContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${employee.employee_id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Avatar upload failed: ${uploadError.message}`);
      }

      const { data } = supabase.storage
        .from('car-images')
        .getPublicUrl(filePath);

      const uploadedAvatarUrl = data.publicUrl;

      const res = await fetch('/api/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: uploadedAvatarUrl })
      });
      const resData = await res.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Failed to update profile photo database record');
      }

      if (refreshEmployee) {
        await refreshEmployee();
      }

      showToast('Profile photo updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile photo', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const [stats, setStats] = useState({ total: 0, sold: 0, available: 0, reserved: 0 });
  const [recentCars, setRecentCars] = useState<CarType[]>([]);
  const [allCars, setAllCars] = useState<CarType[]>([]);
  const [allLogs, setAllLogs] = useState<ActivityLog[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);

  // Customized calendar date states
  const getInitialDates = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Default starting date: 7 days ago
    const start = new Date();
    start.setDate(today.getDate() - 6);
    const startStr = start.toISOString().split('T')[0];
    
    return { startStr, todayStr };
  };

  const { startStr: defaultStart, todayStr: defaultEnd } = getInitialDates();
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!employee) return;
    const fetchData = async () => {
      // 1. Fetch Stats & Cars
      const { data: carsData } = await supabase
        .from('cars')
        .select('*')
        .eq('employee_id', employee.id);

      if (carsData) {
        setAllCars(carsData);
        setStats({
          total: carsData.length,
          sold: carsData.filter(c => c.status === 'sold').length,
          available: carsData.filter(c => c.status === 'available').length,
          reserved: carsData.filter(c => c.status === 'reserved').length,
        });
        
        // Sort and select recent cars
        const sortedCars = [...carsData]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4);
        setRecentCars(sortedCars);
      }

      // 2. Fetch Logs
      const { data: logsData } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });

      if (logsData) {
        setAllLogs(logsData);
      }

      // 3. Fetch Leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', employee.id);

      if (leadsData) {
        setAllLeads(leadsData);
      }

      setLoading(false);
    };

    fetchData();
  }, [employee]);

  // Generate customized calendar report dynamically
  const generateCustomReport = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endStr);
    end.setHours(23, 59, 59, 999);

    // Filter leads assigned in the date range
    const assignedLeadsList = allLeads.filter(lead => {
      const leadDate = new Date(lead.created_at);
      return leadDate >= start && leadDate <= end;
    });
    const assignedLeadsCount = assignedLeadsList.length;

    // Filter completed leads in the date range (status: booking_done, sold, lost)
    const completedLeadsList = allLeads.filter(lead => {
      const isCompleted = ['booking_done', 'sold', 'lost'].includes(lead.lead_status);
      if (!isCompleted) return false;
      const date = new Date(lead.updated_at || lead.created_at);
      return date >= start && date <= end;
    });
    const completedLeadsCount = completedLeadsList.length;

    // Filter logs in the date range
    const filteredLogs = allLogs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= start && logDate <= end;
    });

    // Counts
    const soldCount = filteredLogs.filter(l => l.action === 'sold_status_change').length;
    const logins = filteredLogs.filter(l => l.action === 'login').length;

    // Range string
    const dateStr = `${new Date(startStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${new Date(endStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    // Narrative details text in the exact order requested
    const parts: string[] = [];
    if (assignedLeadsCount > 0) parts.push(`been assigned ${assignedLeadsCount} lead${assignedLeadsCount > 1 ? 's' : ''}`);
    if (completedLeadsCount > 0) parts.push(`completed ${completedLeadsCount} lead${completedLeadsCount > 1 ? 's' : ''}`);
    if (soldCount > 0) parts.push(`marked ${soldCount} car${soldCount > 1 ? 's' : ''} as sold`);
    if (logins > 0) parts.push(`completed ${logins} console session login${logins > 1 ? 's' : ''}`);

    let detailsText = '';
    if (parts.length === 0) {
      detailsText = `Active console monitoring session. No lead assignments, completions, sales, or session logins recorded for this period.`;
    } else {
      const combined = parts.join(', ');
      detailsText = `Employee ${employee?.name || 'Agent'} has successfully ${combined} during this period.`;
    }

    return {
      dateStr,
      assignedLeads: assignedLeadsCount,
      completedLeads: completedLeadsCount,
      soldCount,
      logins,
      details: detailsText
    };
  };

  const currentReport = generateCustomReport(startDate, endDate);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(currentReport.details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate real Weekly activity chart data
  const getWeeklyData = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    
    const today = new Date();
    // Get starting point (last Sunday)
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    sunday.setHours(0, 0, 0, 0);

    recentCars.forEach(car => {
      const d = new Date(car.created_at);
      if (d >= sunday) {
        counts[d.getDay()] += 1;
      }
    });

    const max = Math.max(...counts, 1);
    const todayDay = new Date().getDay();

    return days.map((day, idx) => ({
      day,
      count: counts[idx],
      val: `${(counts[idx] / max) * 100}%`,
      active: todayDay === idx
    }));
  };

  const weeklyData = getWeeklyData();
  const uploadsThisWeek = weeklyData.reduce((acc, curr) => acc + curr.count, 0);

  if (loading) {
    return (
      <div className="crextio-page-loading">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="crextio-spinner" />
      </div>
    );
  }

  return (
    <div className="crextio-dashboard">
      
      {/* Top Welcome Panel */}
      <div className="crextio-welcome-row">
        <div className="crextio-welcome-l">
          <h1 className="crextio-welcome-title">Welcome back, {employee?.name?.split(' ')[0] || 'Agent'}</h1>
          <p className="crextio-welcome-sub">Here is your Autobourn dashboard overview.</p>
        </div>

        <div className="crextio-welcome-r">
          <div className="crextio-counter-item">
            <div className="counter-icon-wrap">
              <Car size={16} />
            </div>
            <div className="counter-text">
              <span className="counter-val">{stats.total}</span>
              <span className="counter-lbl">Total Uploads</span>
            </div>
          </div>
          <div className="crextio-counter-item">
            <div className="counter-icon-wrap">
              <TrendingUp size={16} />
            </div>
            <div className="counter-text">
              <span className="counter-val">{stats.available}</span>
              <span className="counter-lbl">Available</span>
            </div>
          </div>
          <div className="crextio-counter-item">
            <div className="counter-icon-wrap">
              <ShoppingCart size={16} />
            </div>
            <div className="counter-text">
              <span className="counter-val">{stats.sold}</span>
              <span className="counter-lbl">Sold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="crextio-grid">
        
        {/* Left Column: Profile & Navigation Shortcuts */}
        <div className="crextio-col-left">
          
          {/* Real Employee Portrait Card */}
          <div className="crextio-profile-card" style={{ border: '1px solid var(--db-bd)' }}>
            <div className="profile-img-container">
              <Image src={getProxiedImageUrl(employee?.avatar_url || '/DEFAULT IMAGE.PNG')} alt="Employee Photo" fill className="profile-avatar-img" priority />
              <div className="profile-overlay-gradient" />
              <div className="profile-avatar-upload-overlay" onClick={() => fileInputRef.current?.click()}>
                {uploadingAvatar ? (
                  <div className="avatar-spinner" />
                ) : (
                  <>
                    <Camera size={18} />
                    <span>Change Photo</span>
                  </>
                )}
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <div className="profile-details">
              <div>
                <h2>{employee?.name || 'Inventory Agent'}</h2>
                <p>Employee ID: {employee?.employee_id || 'N/A'}</p>
              </div>
              <div className="profile-commission">
                <span>Console Status</span>
                <strong className="badge-status-active">ACTIVE</strong>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="crextio-card shortcut-card">
            <h3>Quick Actions</h3>
            <div className="shortcut-buttons">
              <Link href="/employee/customer-details" className="shortcut-btn primary">
                <FileText size={16} />
                <span>Customer Details Form</span>
                <ArrowRight size={14} className="arrow" />
              </Link>
              <Link href="/employee/crm" className="shortcut-btn secondary">
                <PhoneCall size={16} />
                <span>My Leads (CRM)</span>
                <ArrowRight size={14} className="arrow" />
              </Link>
              <Link href="/employee/test-drives" className="shortcut-btn secondary">
                <Clock size={16} />
                <span>Test Drives</span>
                <ArrowRight size={14} className="arrow" />
              </Link>
              <Link href="/employee/bookings" className="shortcut-btn secondary">
                <Bookmark size={16} />
                <span>Reservations</span>
                <ArrowRight size={14} className="arrow" />
              </Link>
            </div>
          </div>

        </div>

        {/* Middle Column: Activity Chart & Recent Uploads list */}
        <div className="crextio-col-middle">
          
          {/* Upload Activity Chart */}
          <div className="crextio-card progress-chart-card">
            <div className="card-header-simple">
              <div>
                <span className="card-subtitle">Upload Activity</span>
                <h2>{uploadsThisWeek} Uploads <span style={{ fontSize: '.8rem', fontWeight: 400, color: 'var(--db-tx3)' }}>This Week</span></h2>
              </div>
              <div className="chart-badge">Active Week</div>
            </div>

            {/* Bar Chart S M T W T F S */}
            <div className="bar-chart-container">
              {weeklyData.map((bar, idx) => (
                <div className="bar-column" key={idx}>
                  <div className="bar-track">
                    <div className={`bar-fill ${bar.active ? 'active' : ''}`} style={{ height: bar.val }} />
                  </div>
                  <span className="bar-label">{bar.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Uploads List */}
          <div className="crextio-card recent-uploads-card">
            <div className="recent-header">
              <h3>Recent Uploads</h3>
              <Link href="/employee/cars" className="see-all-link">See All <ChevronRight size={14} /></Link>
            </div>

            <div className="recent-list">
              {recentCars.length === 0 ? (
                <p className="no-cars-msg">You haven&apos;t uploaded any cars yet.</p>
              ) : (
                recentCars.map(car => (
                  <div className="recent-car-item" key={car.id}>
                    <div className="recent-car-thumb">
                      {car.thumbnail ? (
                        <img src={getProxiedImageUrl(car.thumbnail)} alt={`${car.brand} ${car.model}`} />
                      ) : (
                        <div className="no-img">No Image</div>
                      )}
                    </div>
                    <div className="recent-car-info">
                      <strong>{car.brand} {car.model}</strong>
                      <span>{car.variant} · {car.year} · {car.transmission}</span>
                      <strong className="recent-price">{formatPrice(car.price)}</strong>
                    </div>
                    <div className="recent-car-status">
                      <span className={`status-badge ${car.status}`}>{car.status}</span>
                      <span className="recent-time">{timeAgo(car.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Console Session Daily Reports */}
        <div className="crextio-col-right">
          
          <div className="crextio-checklist-card">
            <div className="checklist-header">
              <h3>Console Report</h3>
              <ClipboardList size={18} style={{ color: '#E10613' }} />
            </div>

            {/* Custom Date Picker Fields */}
            <div className="report-date-picker">
              <CustomDatePicker 
                label="Start Date" 
                value={startDate} 
                onChange={setStartDate} 
              />
              <CustomDatePicker 
                label="End Date" 
                value={endDate} 
                onChange={setEndDate} 
              />
            </div>

            <div className="report-body">
              <div className="report-meta-info">
                <span className="report-period-badge">Selected Range</span>
                <span className="report-date-range">{currentReport.dateStr}</span>
              </div>

              {/* Metrics Breakdown Grid */}
              <div className="report-metrics-grid">
                <div className="metric-box">
                  <span className="metric-val">{currentReport.assignedLeads}</span>
                  <span className="metric-lbl">Assigned Leads</span>
                </div>
                <div className="metric-box">
                  <span className="metric-val">{currentReport.completedLeads}</span>
                  <span className="metric-lbl">Completed Leads</span>
                </div>
                <div className="metric-box">
                  <span className="metric-val">{currentReport.soldCount}</span>
                  <span className="metric-lbl">Sold</span>
                </div>
                <div className="metric-box">
                  <span className="metric-val">{currentReport.logins}</span>
                  <span className="metric-lbl">Logins</span>
                </div>
              </div>

              {/* Narrative details text & Copy button */}
              <div className="report-narrative">
                <p>{currentReport.details}</p>
              </div>
              
              <button 
                type="button"
                className="copy-report-btn" 
                onClick={handleCopyReport}
              >
                {copied ? 'Copied!' : 'Copy Report'}
              </button>
            </div>
          </div>

        </div>

      </div>

      <AnimatePresence>
        {toast && (
          <motion.div className={`db-toast ${toast.type}`} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}>
            {toast.type === 'success' ? <Check size={16} style={{ color: '#22c55e' }} /> : <AlertCircle size={16} style={{ color: '#ef4444' }} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
.crextio-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}
@media (max-width: 768px) {
  .crextio-dashboard {
    padding: 0 0.5rem 1.5rem 0.5rem;
  }
}

.crextio-page-loading {
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.crextio-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(225,6,19,.1);
  border-top-color: var(--db-rd);
  border-radius: 50%;
}

/* Welcome Area */
.crextio-welcome-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.crextio-welcome-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--db-tx);
  letter-spacing: -0.03em;
  margin-bottom: 0.25rem;
}
.crextio-welcome-sub {
  font-size: .95rem;
  color: var(--db-tx2);
  margin: 0;
}

.crextio-welcome-r {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.crextio-counter-item {
  display: flex;
  align-items: center;
  gap: .75rem;
}
.counter-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--db-sf);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0,0,0,0.02);
  border: 1px solid var(--db-bd);
  color: var(--db-tx2);
}
.counter-text {
  display: flex;
  flex-direction: column;
}
.counter-val {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--db-tx);
  line-height: 1.1;
}
.counter-lbl {
  font-size: .75rem;
  color: var(--db-tx3);
  font-weight: 600;
}

/* Grid Layout */
.crextio-grid {
  display: grid;
  grid-template-columns: 310px 1fr 310px;
  gap: 1.5rem;
  width: 100%;
}

/* Cards Base */
.crextio-card {
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.card-subtitle {
  font-size: .75rem;
  font-weight: 700;
  color: var(--db-tx3);
  text-transform: uppercase;
  letter-spacing: .05em;
  margin-bottom: 0.25rem;
}

/* Left Column */
.crextio-col-left {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Profile Card */
.crextio-profile-card {
  height: 340px;
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--card-shadow);
}
.profile-avatar-upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 500;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
  z-index: 3;
}
.profile-img-container:hover .profile-avatar-upload-overlay {
  opacity: 1;
}
.avatar-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: pulse 1s infinite linear;
}
.db-toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 200;
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  color: var(--db-tx);
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.db-toast.success {
  border-color: #22c55e;
}
.db-toast.error {
  border-color: #ef4444;
}
@keyframes pulse {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.profile-img-container {
  position: absolute;
  inset: 0;
  z-index: 1;
}
.profile-avatar-img {
  object-fit: cover;
}
.profile-overlay-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 90%);
  z-index: 2;
}
.profile-details {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem;
  z-index: 3;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.profile-details h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}
.profile-details p {
  font-size: .8rem;
  opacity: 0.75;
  margin: 0;
}
.profile-commission {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: .75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.profile-commission span {
  font-size: .75rem;
  font-weight: 500;
}
.badge-status-active {
  background: #22c55e;
  color: #fff;
  font-size: .7rem;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
}

/* Shortcuts */
.shortcut-card h3 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--db-tx);
  margin: 0 0 1rem;
}
.shortcut-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.shortcut-btn {
  display: flex !important;
  align-items: center !important;
  flex-direction: row !important;
  gap: 12px !important;
  padding: 0.9rem 1.25rem !important;
  border-radius: 16px !important;
  text-decoration: none !important;
  font-size: 0.875rem !important;
  font-weight: 600 !important;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
  width: 100% !important;
  box-sizing: border-box !important;
}
.shortcut-btn svg {
  flex-shrink: 0 !important;
}
.shortcut-btn span {
  flex: 1 !important;
  text-align: left !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}
.shortcut-btn .arrow {
  margin-left: auto !important;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.shortcut-btn:hover .arrow {
  transform: translateX(4px) !important;
}
.shortcut-btn.primary {
  background: var(--db-gold) !important;
  color: #fff !important;
}
.db-dark .shortcut-btn.primary {
  color: #121212 !important;
}
.shortcut-btn.secondary {
  background: var(--db-sf2) !important;
  color: var(--db-tx) !important;
  border: 1px solid var(--db-bd) !important;
}
.shortcut-btn.secondary:hover {
  background: var(--db-gd) !important;
}

/* Middle Column */
.crextio-col-middle {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Progress Chart Card */
.progress-chart-card {
  height: 240px;
}
.card-header-simple {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: auto;
}
.card-header-simple h2 {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.1;
}
.chart-badge {
  background: rgba(225, 6, 19, 0.08);
  border: 1px solid rgba(225, 6, 19, 0.15);
  color: #E10613;
  padding: .35rem .75rem;
  border-radius: 999px;
  font-size: .7rem;
  font-weight: 700;
}
.bar-chart-container {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 110px;
  padding-top: 10px;
}
.bar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}
.bar-track {
  width: 12px;
  height: 75px;
  background: rgba(0,0,0,0.03);
  border-radius: 999px;
  position: relative;
  overflow: hidden;
}
.db-dark .bar-track {
  background: rgba(255,255,255,0.05);
}
.bar-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--db-tx3);
  border-radius: 999px;
  transition: height 0.6s ease;
}
.bar-fill.active {
  background: #E10613; /* Accent red */
}
.bar-label {
  font-size: .7rem;
  font-weight: 600;
  color: var(--db-tx2);
}

/* Recent Uploads Card */
.recent-uploads-card {
  flex: 1;
}
.recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}
.recent-header h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--db-tx);
  margin: 0;
}
.see-all-link {
  font-size: .8125rem;
  font-weight: 600;
  color: var(--db-gold);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 2px;
}
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.no-cars-msg {
  text-align: center;
  padding: 3rem 0;
  color: var(--db-tx3);
  font-size: .875rem;
}
.recent-car-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: .75rem;
  background: var(--db-sf2);
  border: 1px solid var(--db-bd);
  border-radius: 16px;
  transition: all .2s;
}
.recent-car-item:hover {
  border-color: var(--db-gold);
}
.recent-car-thumb {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  overflow: hidden;
  background: #eee;
  flex-shrink: 0;
  position: relative;
}
.recent-car-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.no-img {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: .55rem;
  color: var(--db-tx3);
  font-weight: 700;
}
.recent-car-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.recent-car-info strong {
  font-size: .875rem;
  color: var(--db-tx);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.recent-car-info span {
  font-size: .75rem;
  color: var(--db-tx2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 1px 0;
}
.recent-price {
  font-size: .8125rem !important;
  color: var(--db-gold) !important;
  font-weight: 700;
}
.recent-car-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.status-badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: .65rem;
  font-weight: 700;
  text-transform: uppercase;
}
.status-badge.available { background: rgba(34,197,94,.1); color: #22c55e; }
.status-badge.sold { background: rgba(239,68,68,.1); color: #ef4444; }
.status-badge.reserved { background: rgba(245,158,11,.1); color: #f59e0b; }
.recent-time {
  font-size: .65rem;
  color: var(--db-tx3);
}

/* Right Column Logs */
.crextio-checklist-card {
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-height: 380px;
}
.checklist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--db-tx);
  border-bottom: 1px solid var(--db-bd);
  padding-bottom: 0.75rem;
}
.checklist-header h3 { font-size: 1.05rem; font-weight: 700; margin: 0; }
.report-date-picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--db-sf2);
  padding: 12px;
  border-radius: 16px;
  border: 1px solid var(--db-bd);
}
.custom-date-picker-container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}
.datepicker-label {
  font-size: 0.65rem;
  font-weight: 750;
  text-transform: uppercase;
  color: var(--db-tx3);
  letter-spacing: 0.05em;
}
.datepicker-trigger-btn {
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  color: var(--db-tx);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}
.datepicker-trigger-btn:hover, .datepicker-trigger-btn.active {
  border-color: #E10613;
  box-shadow: 0 0 0 2px rgba(225, 6, 19, 0.05);
}
.calendar-dropdown-card {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 99;
  margin-top: 6px;
  width: 250px;
  background: #ffffff;
  border: 1px solid var(--db-bd);
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  padding: 12px;
  box-sizing: border-box;
}
.calendar-dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.cal-current-month-year {
  font-size: 0.875rem;
  font-weight: 700;
  color: #121212;
}
.cal-nav-btn {
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  color: var(--db-tx2);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
}
.cal-nav-btn:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #E10613;
}
.calendar-weekdays-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 6px;
}
.calendar-weekday-lbl {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--db-tx3);
  text-transform: uppercase;
}
.calendar-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.calendar-day-btn {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}
.calendar-day-btn.current {
  color: #121212;
}
.calendar-day-btn.outside {
  color: #c0c0c0;
  font-weight: 500;
}
.calendar-day-btn:hover {
  background: rgba(225, 6, 19, 0.06);
  color: #E10613;
}
.calendar-day-btn.selected {
  background: #E10613 !important;
  color: #ffffff !important;
}
.calendar-day-btn.today {
  border: 1px solid #E10613;
}
.report-body {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 1.25rem;
}
.report-meta-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.report-period-badge {
  font-size: .75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: #E10613;
  letter-spacing: .05em;
}
.report-date-range {
  font-size: .8125rem;
  color: var(--db-tx3);
  font-weight: 500;
}
.report-metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.metric-box {
  background: var(--db-sf2);
  border: 1px solid var(--db-bd);
  border-radius: 14px;
  padding: .85rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.metric-val {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--db-tx);
}
.metric-lbl {
  font-size: .7rem;
  color: var(--db-tx3);
  font-weight: 600;
}
.report-narrative {
  background: var(--db-sf2);
  border: 1px solid var(--db-bd);
  border-radius: 14px;
  padding: 1rem;
}
.report-narrative p {
  font-size: .8125rem;
  color: var(--db-tx2);
  line-height: 1.5;
  margin: 0;
}
.copy-report-btn {
  width: 100%;
  padding: .85rem;
  background: var(--db-tx);
  color: var(--db-sf);
  border: none;
  border-radius: 14px;
  font-size: .875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;
  font-family: inherit;
}
.copy-report-btn:hover {
  background: #E10613;
  color: #ffffff;
}

@media(max-width: 1200px) {
  .crextio-grid {
    grid-template-columns: 1fr;
  }
}
@media(max-width: 768px) {
  .crextio-dashboard {
    padding: 0.75rem 0 !important;
  }
  .crextio-welcome-title {
    font-size: 1.5rem !important;
  }
  .crextio-welcome-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .crextio-welcome-r {
    width: 100%;
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 0.5rem !important;
  }
  .crextio-counter-item {
    flex-direction: column !important;
    align-items: center !important;
    text-align: center !important;
    gap: 0.25rem !important;
  }
  .counter-text {
    align-items: center !important;
  }
  .crextio-grid {
    gap: 1rem !important;
  }

  /* Profile card: flow naturally in single scrollable page on mobile */
  .crextio-profile-card {
    height: auto !important;
    position: relative !important;
    display: flex !important;
    flex-direction: column !important;
  }
  .profile-img-container {
    position: relative !important;
    width: 100% !important;
    height: 280px !important;
    flex-shrink: 0 !important;
  }
  .profile-overlay-gradient {
    display: none !important;
  }
  .profile-details {
    position: relative !important;
    background: var(--db-sf, #fff) !important;
    color: var(--db-tx, #000) !important;
    padding: 1.25rem !important;
    border-top: 1px solid var(--db-bd, #e2e8f0) !important;
  }
  .profile-details h2 {
    color: var(--db-tx, #000) !important;
    font-size: 1.25rem !important;
  }
  .profile-details p {
    color: var(--db-tx2, #555) !important;
    opacity: 1 !important;
  }
  .profile-commission {
    background: var(--db-sf2, #f5f5f5) !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border: 1px solid var(--db-bd, #e2e8f0) !important;
    color: var(--db-tx, #000) !important;
  }
  .profile-commission span {
    color: var(--db-tx2, #555) !important;
  }

  /* Chart card: auto height on mobile */
  .progress-chart-card {
    height: auto !important;
  }
}
      `}</style>
    </div>
  );
}
