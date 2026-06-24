'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useEmpContext } from './layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, ShoppingCart, Clock, Upload, TrendingUp, Check, 
  ChevronRight, Calendar, User, FileText, ArrowRight, Eye, ClipboardList,
  PhoneCall, Bookmark
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice, timeAgo } from '@/lib/utils';
import type { Car as CarType, ActivityLog } from '@/types/database';

export default function EmployeeDashboard() {
  const { employee } = useEmpContext();
  const [stats, setStats] = useState({ total: 0, sold: 0, available: 0, reserved: 0 });
  const [recentCars, setRecentCars] = useState<CarType[]>([]);
  const [allCars, setAllCars] = useState<CarType[]>([]);
  const [allLogs, setAllLogs] = useState<ActivityLog[]>([]);
  const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'month'>('day');
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

      setLoading(false);
    };

    fetchData();
  }, [employee]);

  // Generate Report for selected period dynamically (100% real, no mock)
  const generatePeriodReport = (period: 'day' | 'week' | 'month') => {
    const now = new Date();
    
    // Filter data based on period
    const filteredCars = allCars.filter(car => {
      const carDate = new Date(car.created_at);
      if (period === 'day') {
        return carDate.toDateString() === now.toDateString();
      } else if (period === 'week') {
        const sunday = new Date(now);
        sunday.setDate(now.getDate() - now.getDay());
        sunday.setHours(0, 0, 0, 0);
        return carDate >= sunday;
      } else {
        return carDate.getMonth() === now.getMonth() && carDate.getFullYear() === now.getFullYear();
      }
    });

    const filteredLogs = allLogs.filter(log => {
      const logDate = new Date(log.created_at);
      if (period === 'day') {
        return logDate.toDateString() === now.toDateString();
      } else if (period === 'week') {
        const sunday = new Date(now);
        sunday.setDate(now.getDate() - now.getDay());
        sunday.setHours(0, 0, 0, 0);
        return logDate >= sunday;
      } else {
        return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
      }
    });

    // Counts
    const uploads = filteredCars.length;
    const logins = filteredLogs.filter(l => l.action === 'login').length;
    const edits = filteredLogs.filter(l => l.action === 'edit').length;
    const soldCount = filteredLogs.filter(l => l.action === 'sold_status_change').length;
    const deletes = filteredLogs.filter(l => l.action === 'delete').length;

    // Period label
    let periodLabel = '';
    let dateStr = '';
    if (period === 'day') {
      periodLabel = 'Today';
      dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } else if (period === 'week') {
      periodLabel = 'This Week';
      const sunday = new Date(now);
      sunday.setDate(now.getDate() - now.getDay());
      dateStr = `${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      periodLabel = 'This Month';
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      dateStr = `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    // Summary text
    const parts: string[] = [];
    if (uploads > 0) parts.push(`uploaded ${uploads} vehicle${uploads > 1 ? 's' : ''}`);
    if (soldCount > 0) parts.push(`marked ${soldCount} car${soldCount > 1 ? 's' : ''} as sold`);
    if (logins > 0) parts.push(`completed ${logins} console session login${logins > 1 ? 's' : ''}`);
    if (edits > 0 && soldCount === 0) parts.push(`updated ${edits} listing detail${edits > 1 ? 's' : ''}`);
    if (deletes > 0) parts.push(`removed ${deletes} vehicle listing${deletes > 1 ? 's' : ''}`);

    let detailsText = '';
    if (parts.length === 0) {
      detailsText = `Active console monitoring session. No inventory additions or session logins recorded for this period.`;
    } else {
      const combined = parts.join(', ');
      detailsText = `Employee ${employee?.name || 'Agent'} has successfully ${combined} during this period.`;
    }

    return {
      periodLabel,
      dateStr,
      uploads,
      logins,
      edits,
      soldCount,
      deletes,
      details: detailsText
    };
  };

  const currentReport = generatePeriodReport(reportPeriod);

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
          <div className="crextio-profile-card" style={{ background: employee?.avatar_url ? 'none' : 'linear-gradient(135deg, #2A2A2A 0%, #121212 100%)', border: '1px solid var(--db-bd)' }}>
            <div className="profile-img-container">
              {employee?.avatar_url && (
                <Image src={employee.avatar_url} alt="Employee Photo" fill className="profile-avatar-img" priority />
              )}
              <div className="profile-overlay-gradient" />
            </div>
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
                        <img src={car.thumbnail} alt={`${car.brand} ${car.model}`} />
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

            {/* Day Week Month Button Toggles */}
            <div className="report-period-tabs">
              <button 
                className={reportPeriod === 'day' ? 'active' : ''} 
                onClick={() => setReportPeriod('day')}
              >
                Day
              </button>
              <button 
                className={reportPeriod === 'week' ? 'active' : ''} 
                onClick={() => setReportPeriod('week')}
              >
                Week
              </button>
              <button 
                className={reportPeriod === 'month' ? 'active' : ''} 
                onClick={() => setReportPeriod('month')}
              >
                Month
              </button>
            </div>

            <div className="report-body">
              <div className="report-meta-info">
                <span className="report-period-badge">{currentReport.periodLabel}</span>
                <span className="report-date-range">{currentReport.dateStr}</span>
              </div>

              {/* Metrics Breakdown Grid */}
              <div className="report-metrics-grid">
                <div className="metric-box">
                  <span className="metric-val">{currentReport.uploads}</span>
                  <span className="metric-lbl">Uploads</span>
                </div>
                <div className="metric-box">
                  <span className="metric-val">{currentReport.logins}</span>
                  <span className="metric-lbl">Logins</span>
                </div>
                <div className="metric-box">
                  <span className="metric-val">{currentReport.soldCount}</span>
                  <span className="metric-lbl">Sold</span>
                </div>
                <div className="metric-box">
                  <span className="metric-val">{currentReport.deletes}</span>
                  <span className="metric-lbl">Deletes</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      <style jsx global>{`
.crextio-dashboard {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
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
.report-period-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.03);
  padding: 4px;
  border-radius: 12px;
  border: 1px solid var(--db-bd);
  gap: 2px;
}
.db-dark .report-period-tabs {
  background: rgba(255, 255, 255, 0.05);
}
.report-period-tabs button {
  flex: 1;
  background: transparent;
  border: 0;
  padding: .45rem;
  border-radius: 8px;
  font-size: .8125rem;
  font-weight: 600;
  color: var(--db-tx2);
  cursor: pointer;
  transition: all .2s;
}
.report-period-tabs button.active {
  background: #E10613;
  color: #ffffff;
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
  .crextio-welcome-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .crextio-welcome-r {
    width: 100%;
    justify-content: space-between;
  }
}
      `}</style>
    </div>
  );
}
