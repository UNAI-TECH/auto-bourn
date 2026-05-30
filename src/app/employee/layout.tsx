'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { Employee } from '@/types/database';
import { LayoutDashboard, Car, Upload, LogOut, Menu, X, Bell, FileText, AlertCircle, Clock, CheckCircle, PhoneCall } from 'lucide-react';

const EmpContext = createContext<{ employee: Employee | null; darkMode: boolean; onReportSubmitted: () => void }>({ employee: null, darkMode: false, onReportSubmitted: () => {} });
export const useEmpContext = () => useContext(EmpContext);

const navItems = [
  { href: '/employee', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employee/upload', label: 'Upload Car', icon: Upload },
  { href: '/employee/cars', label: 'My Cars', icon: Car },
  { href: '/employee/customer-details', label: 'Customer Details', icon: FileText },
  { href: '/employee/crm', label: 'My Leads (CRM)', icon: PhoneCall },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Daily report state
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [logoutWarning, setLogoutWarning] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Check if report submitted today
  const checkTodayReport = async (empId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_reports')
      .select('id')
      .eq('employee_id', empId)
      .eq('report_date', today)
      .single();
    setHasSubmittedToday(!!data);
    return !!data;
  };

  // Fetch notifications for the employee
  const fetchNotifications = async (empId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_employee_id', empId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(10);
    setNotifications(data || []);
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/console'); return; }
      const { data } = await supabase.from('employees').select('*').eq('auth_user_id', user.id).single();
      if (!data) { router.push('/console'); return; }
      setEmployee(data);
      await checkTodayReport(data.id);
      await fetchNotifications(data.id);
      setLoading(false);
    };
    getUser();
  }, []);

  // 1-hour reminder notification check (runs every minute)
  useEffect(() => {
    if (!employee) return;
    const checkReminder = () => {
      const now = new Date();
      const hour = now.getHours();
      const minutes = now.getMinutes();
      // Trigger reminder at 5PM (17:00) if not submitted
      if (hour === 17 && minutes === 0 && !hasSubmittedToday) {
        supabase.from('notifications').insert({
          recipient_role: 'employee',
          recipient_employee_id: employee.id,
          type: 'report_reminder',
          title: '⏰ Daily Report Due in 1 Hour',
          message: 'Your daily report is due by 6:00 PM today. Please submit before logging out.',
        }).then(() => fetchNotifications(employee.id));
      }
    };
    const interval = setInterval(checkReminder, 60000);
    return () => clearInterval(interval);
  }, [employee, hasSubmittedToday]);

  // Handle logout — block if no report submitted
  const handleLogout = async () => {
    if (!hasSubmittedToday) {
      setLogoutWarning(true);
      return;
    }
    if (employee) {
      await supabase.from('activity_logs').insert({ employee_id: employee.id, action: 'logout', details: 'Employee logged out' });
    }
    await supabase.auth.signOut();
    router.push('/console');
  };

  // Submit daily report
  const handleSubmitReport = async () => {
    if (!employee || !reportText.trim()) {
      setReportError('Please write your report before submitting.');
      return;
    }
    setReportSubmitting(true);
    setReportError('');

    const today = new Date().toISOString().split('T')[0];

    // Count today's uploads and sold
    const { data: todayCars } = await supabase
      .from('cars')
      .select('id, status')
      .eq('employee_id', employee.id)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    const uploadsCount = todayCars?.length || 0;
    const soldCount = todayCars?.filter(c => c.status === 'sold').length || 0;

    // Check if report already exists for today
    const { data: existing } = await supabase
      .from('daily_reports')
      .select('id')
      .eq('employee_id', employee.id)
      .eq('report_date', today)
      .single();

    let error = null;

    if (existing) {
      // Update existing report
      const { error: updateError } = await supabase
        .from('daily_reports')
        .update({
          summary: reportText.trim(),
          uploads_count: uploadsCount,
          sold_count: soldCount,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      error = updateError;
    } else {
      // Insert new report
      const { error: insertError } = await supabase
        .from('daily_reports')
        .insert({
          employee_id: employee.id,
          report_date: today,
          summary: reportText.trim(),
          uploads_count: uploadsCount,
          sold_count: soldCount,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        });
      error = insertError;
    }

    if (error) {
      console.error('Report submission error:', error);
      setReportError(`Failed to submit report: ${error.message}`);
      setReportSubmitting(false);
      return;
    }

    // Notify admin
    await supabase.from('notifications').insert({
      recipient_role: 'admin',
      type: 'daily_report_submitted',
      title: `📋 Report from ${employee.name}`,
      message: `${employee.name} (${employee.employee_id}) submitted their daily report for ${today}. Uploads: ${uploadsCount}, Sold: ${soldCount}.`,
      metadata: { employee_id: employee.id, report_date: today },
    });

    // Log activity
    await supabase.from('activity_logs').insert({
      employee_id: employee.id,
      action: 'daily_report_submitted',
      details: `Daily report submitted for ${today}`,
    });

    setHasSubmittedToday(true);
    setReportModalOpen(false);
    setReportText('');
    setLogoutWarning(false);
    setReportSubmitting(false);
  };

  const markNotificationsRead = async () => {
    if (!employee || notifications.length === 0) return;
    const ids = notifications.map(n => n.id);
    await supabase.from('notifications').update({ read: true }).in('id', ids);
    setNotifications([]);
  };

  if (loading) {
    return <div className="db-loader"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="db-spinner" /></div>;
  }

  return (
    <EmpContext.Provider value={{ employee, darkMode, onReportSubmitted: () => checkTodayReport(employee?.id || '') }}>
      <div className={`db-root ${darkMode ? 'db-dark' : 'db-light'}`}>
        
        {/* PREMIUM TOPBAR NAVIGATION (desktop only) */}
        <header className="saas-topbar">
          <div className="saas-topbar-inner">
            <Link href="/employee" className="saas-brand">
              <div className="logo-container">
                <Image src="/logo.jpg" alt="Auto Bourn Logo" width={36} height={36} className="logo-img" />
              </div>
              <span className="saas-brand-text">AUTO BOURN <span style={{ fontWeight: 400, opacity: 0.65 }}>Console</span></span>
            </Link>

            <nav className="saas-nav-pills">
              {navItems.map(item => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} className={`saas-nav-pill ${active ? 'active' : ''}`}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="saas-topbar-actions">

              <button className="saas-action-btn notif-wrap" title="Notifications" onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) markNotificationsRead(); }}>
                <Bell size={18} />
                {notifications.length > 0 && <span className="saas-dot notif-count">{notifications.length}</span>}
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div className="notif-dropdown" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                      <div className="notif-header">
                        <span>Notifications</span>
                        <Bell size={14} />
                      </div>
                      {notifications.length === 0 ? (
                        <p className="notif-empty">No new notifications</p>
                      ) : (
                        notifications.map(n => (
                          <div className="notif-item" key={n.id}>
                            <strong>{n.title}</strong>
                            <p>{n.message}</p>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* Submit Report Button */}
              <button onClick={() => setReportModalOpen(true)} className={`saas-report-btn ${hasSubmittedToday ? 'submitted' : ''}`} title="Submit Daily Report">
                {hasSubmittedToday ? <CheckCircle size={15} /> : <FileText size={15} />}
                <span>{hasSubmittedToday ? 'Report Submitted' : 'Submit Report'}</span>
              </button>

              <button onClick={handleLogout} className="saas-logout-btn" title="Sign Out">
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
              <div className="saas-avatar-wrap">
                <div className="saas-avatar">{employee?.name?.charAt(0) || 'E'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* MOBILE SIDEBAR DRAWYER */}
        <aside className={`db-sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
          <div className="db-sidebar-head">
            <Link href="/employee" className="db-brand">
              <div className="logo-container">
                <Image src="/logo.jpg" alt="Auto Bourn Logo" width={32} height={32} className="logo-img" />
              </div>
              <span>AUTO BOURN</span>
            </Link>
            <button className="db-mob-close" onClick={() => setMobileOpen(false)}><X size={20} /></button>
          </div>
          <nav className="db-nav">
            {navItems.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`db-nav-item ${active ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                  <item.icon size={20} /><span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="db-sidebar-foot">
            <button onClick={() => setReportModalOpen(true)} className="db-nav-item" style={{ color: hasSubmittedToday ? '#22c55e' : '#E10613' }}>
              {hasSubmittedToday ? <CheckCircle size={20} /> : <FileText size={20} />}
              <span>{hasSubmittedToday ? 'Report Submitted' : 'Submit Report'}</span>
            </button>
            <button onClick={handleLogout} className="db-nav-item db-logout"><LogOut size={20} /><span>Sign Out</span></button>
          </div>
        </aside>

        <AnimatePresence>{mobileOpen && <motion.div className="db-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />}</AnimatePresence>

        {/* MAIN CONTENT AREA */}
        <div className="saas-main">
          {/* Mobile Topbar */}
          <header className="saas-mob-topbar">
            <button className="db-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
            <span className="saas-mob-title">AUTO BOURN Console</span>
            <div className="saas-avatar">{employee?.name?.charAt(0) || 'E'}</div>
          </header>
          <main className="saas-content">{children}</main>
        </div>

        {/* REPORT SUBMISSION MODAL */}
        <AnimatePresence>
          {reportModalOpen && (
            <motion.div className="rp-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !reportSubmitting && setReportModalOpen(false)}>
              <motion.div className="rp-modal" initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }} onClick={e => e.stopPropagation()}>
                <div className="rp-modal-head">
                  <div>
                    <h2>Daily Report</h2>
                    <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  {hasSubmittedToday ? <CheckCircle size={24} color="#22c55e" /> : <FileText size={24} color="#E10613" />}
                </div>
                {hasSubmittedToday ? (
                  <div className="rp-submitted-state">
                    <CheckCircle size={48} color="#22c55e" />
                    <h3>Report Submitted!</h3>
                    <p>Your daily report for today has been submitted and is visible to the admin.</p>
                    <button className="rp-close-btn" onClick={() => setReportModalOpen(false)}>Close</button>
                  </div>
                ) : (
                  <>
                    <div className="rp-body">
                      <label>What did you work on today? *</label>
                      <textarea
                        value={reportText}
                        onChange={e => setReportText(e.target.value)}
                        placeholder="Describe your work today — vehicles uploaded, customer interactions, issues encountered, next steps..."
                        rows={6}
                        disabled={reportSubmitting}
                      />
                      {reportError && (
                        <div className="rp-error">
                          <AlertCircle size={14} />
                          <span>{reportError}</span>
                        </div>
                      )}
                      <p className="rp-note">
                        <Clock size={12} /> Your uploads and sold statistics for today will be automatically included.
                      </p>
                    </div>
                    <div className="rp-actions">
                      <button className="rp-cancel" onClick={() => setReportModalOpen(false)} disabled={reportSubmitting}>Cancel</button>
                      <button className="rp-submit" onClick={handleSubmitReport} disabled={reportSubmitting || !reportText.trim()}>
                        {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LOGOUT BLOCKED WARNING MODAL */}
        <AnimatePresence>
          {logoutWarning && (
            <motion.div className="rp-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="rp-modal rp-warning-modal" initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.93, opacity: 0 }}>
                <div className="rp-warning-icon">
                  <AlertCircle size={40} color="#E10613" />
                </div>
                <h2>Report Required to Sign Out</h2>
                <p>You must submit your daily report before signing out. This ensures the admin stays informed of your daily activity.</p>
                <div className="rp-warning-actions">
                  <button className="rp-cancel" onClick={() => setLogoutWarning(false)}>Go Back</button>
                  <button className="rp-submit" onClick={() => { setLogoutWarning(false); setReportModalOpen(true); }}>
                    Submit Report Now
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx global>{`
.db-loader{min-height:100vh;background:#ffffff;display:flex;align-items:center;justify-content:center}
.db-spinner{width:40px;height:40px;border:3px solid rgba(225,6,19,.15);border-top-color:#e10613;border-radius:50%}
.db-root{display:flex;flex-direction:column;min-height:100vh;font-family:'Outfit',sans-serif}

.db-dark{
  --db-bg:#121212;
  --db-sf:#1c1c1c;
  --db-sf2:#2a2a2a;
  --db-bd:rgba(255,255,255,.08);
  --db-tx:#fff;
  --db-tx2:rgba(255,255,255,.7);
  --db-tx3:rgba(255,255,255,.4);
  --db-gold:#f5ebd0;
  --db-gd:rgba(255,255,255,.05);
  --db-gg:rgba(255,255,255,.1);
  --db-gn:#22c55e;
  --db-rd:#ef4444;
  --db-bl:#3b82f6;
  --card-shadow: 0 10px 40px rgba(0,0,0,0.25);
  --body-bg: radial-gradient(circle at top, #1e1e1e 0%, #121212 100%);
}

.db-light{
  --db-bg: #ffffff;
  --db-sf: #ffffff;
  --db-sf2: #f8f8f8;
  --db-bd: rgba(0, 0, 0, 0.08);
  --db-tx: #000000;
  --db-tx2: #333333;
  --db-tx3: #666666;
  --db-gold: #E10613;
  --db-gd: rgba(225, 6, 19, 0.06);
  --db-gg: rgba(225, 6, 19, 0.15);
  --db-gn: #16a34a;
  --db-rd: #E10613;
  --db-bl: #2563eb;
  --card-shadow: 0 10px 30px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02);
  --body-bg: #ffffff;
}

.db-root{background:var(--body-bg);color:var(--db-tx)}

/* TOPBAR */
.saas-topbar {
  position: fixed;
  top: 1.25rem;
  left: 2rem;
  right: 2rem;
  height: 68px;
  background: var(--db-sf);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  border: 1px solid var(--db-bd);
  border-radius: 999px;
  z-index: 100;
  box-shadow: var(--card-shadow), inset 0 1px 0 rgba(255,255,255,0.4);
}
.saas-topbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 1.5rem 0 1.25rem;
}
.saas-brand {
  display: flex;
  align-items: center;
  gap: .75rem;
  text-decoration: none;
}
.saas-brand-text {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 1.2rem;
  color: var(--db-tx);
  letter-spacing: -0.03em;
}
.saas-nav-pills {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.03);
  padding: 4px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.02);
}
.db-dark .saas-nav-pills {
  background: rgba(255, 255, 255, 0.05);
}
.saas-nav-pill {
  padding: .5rem 1.35rem;
  border-radius: 999px;
  color: var(--db-tx2);
  font-size: .875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all .25s cubic-bezier(0.16, 1, 0.3, 1);
}
.saas-nav-pill:hover {
  color: var(--db-tx);
  background: rgba(0,0,0,0.03);
}
.db-dark .saas-nav-pill:hover {
  background: rgba(255,255,255,0.03);
}
.saas-nav-pill.active {
  background: var(--db-gold);
  color: #ffffff;
  font-weight: 600;
}
.db-dark .saas-nav-pill.active {
  color: #121212;
}
.saas-topbar-actions {
  display: flex;
  align-items: center;
  gap: .35rem;
}
.saas-action-btn {
  background: transparent;
  border: 0;
  color: var(--db-tx2);
  cursor: pointer;
  padding: 9px;
  border-radius: 50%;
  display: flex;
  position: relative;
  transition: all .2s;
}
.saas-action-btn:hover {
  background: var(--db-gd);
  color: var(--db-tx);
}
.saas-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  background: var(--db-rd);
  border-radius: 50%;
}
.saas-logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(225,6,19,0.08);
  border: 0;
  color: #e10613;
  padding: .55rem 1.1rem;
  border-radius: 999px;
  font-size: .8125rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all .2s;
  margin: 0 .25rem 0 .5rem;
}
.saas-logout-btn:hover {
  background: rgba(225,6,19,0.14);
}
.saas-avatar-wrap {
  border: 2px solid rgba(255,255,255,0.5);
  border-radius: 50%;
  padding: 2px;
}
.saas-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #e10613, #c70511);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-weight: 700;
  font-size: .875rem;
  font-family: 'Outfit', sans-serif;
}
.saas-mob-topbar {
  display: none;
}

/* NOTIFICATION DROPDOWN */
.notif-wrap { position: relative; }
.notif-count {
  position: absolute;
  top: 5px; right: 5px;
  width: auto;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  font-size: .6rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 99px;
}
.notif-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 320px;
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.12);
  z-index: 300;
  overflow: hidden;
}
.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--db-bd);
  font-size: .875rem;
  font-weight: 700;
  color: var(--db-tx);
}
.notif-empty {
  padding: 1.5rem;
  text-align: center;
  font-size: .8125rem;
  color: var(--db-tx3);
}
.notif-item {
  padding: .875rem 1.25rem;
  border-bottom: 1px solid var(--db-bd);
}
.notif-item:last-child { border-bottom: 0; }
.notif-item strong {
  font-size: .8125rem;
  color: var(--db-tx);
  display: block;
  margin-bottom: 2px;
}
.notif-item p {
  font-size: .75rem;
  color: var(--db-tx2);
  margin: 0;
  line-height: 1.4;
}

/* SUBMIT REPORT BUTTON in topbar */
.saas-report-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(225,6,19,0.08);
  border: 1px solid rgba(225,6,19,0.2);
  color: #E10613;
  padding: .5rem 1rem;
  border-radius: 999px;
  font-size: .8125rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all .2s;
}
.saas-report-btn:hover { background: rgba(225,6,19,0.14); }
.saas-report-btn.submitted {
  background: rgba(34,197,94,0.08);
  border-color: rgba(34,197,94,0.2);
  color: #22c55e;
}
.saas-report-btn.submitted:hover { background: rgba(34,197,94,0.14); }

/* REPORT & WARNING MODALS */
.rp-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  backdrop-filter: blur(6px);
}
.rp-modal {
  background: #ffffff;
  border-radius: 24px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 30px 80px rgba(0,0,0,0.2);
  overflow: hidden;
}
.rp-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #f0f0f0;
}
.rp-modal-head h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  color: #000;
  margin: 0 0 3px;
}
.rp-modal-head p {
  font-size: .8125rem;
  color: #666;
  margin: 0;
}
.rp-submitted-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem 1.5rem;
  text-align: center;
  gap: 1rem;
}
.rp-submitted-state h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #000;
  margin: 0;
}
.rp-submitted-state p {
  font-size: .875rem;
  color: #666;
  margin: 0;
}
.rp-close-btn {
  background: #000;
  color: #fff;
  border: none;
  padding: .75rem 2rem;
  border-radius: 12px;
  font-size: .875rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  margin-top: .5rem;
}
.rp-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: .75rem;
}
.rp-body label {
  font-size: .8125rem;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  letter-spacing: .04em;
}
.rp-body textarea {
  width: 100%;
  padding: .875rem 1rem;
  background: #f8f8f8;
  border: 1.5px solid #e8e8e8;
  border-radius: 14px;
  color: #000;
  font-size: .9rem;
  font-family: 'Outfit', sans-serif;
  outline: none;
  resize: vertical;
  transition: border-color .2s;
  box-sizing: border-box;
}
.rp-body textarea:focus { border-color: #E10613; background: #fff; }
.rp-body textarea:disabled { opacity: .6; }
.rp-error {
  display: flex;
  align-items: center;
  gap: .4rem;
  background: #fff1f2;
  border: 1px solid rgba(225,6,19,.2);
  color: #E10613;
  padding: .65rem .875rem;
  border-radius: 10px;
  font-size: .8125rem;
}
.rp-note {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: .75rem;
  color: #888;
  margin: 0;
}
.rp-actions {
  display: flex;
  gap: .75rem;
  padding: 1rem 1.5rem 1.5rem;
  border-top: 1px solid #f0f0f0;
}
.rp-cancel {
  flex: 1;
  padding: .875rem;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  font-size: .875rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  font-family: inherit;
  transition: all .2s;
}
.rp-cancel:hover { background: #ebebeb; }
.rp-submit {
  flex: 2;
  padding: .875rem;
  background: #E10613;
  border: none;
  border-radius: 12px;
  font-size: .875rem;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  transition: all .2s;
}
.rp-submit:hover:not(:disabled) { background: #c70511; }
.rp-submit:disabled { opacity: .5; cursor: not-allowed; }

/* WARNING MODAL */
.rp-warning-modal {
  text-align: center;
  padding: 2.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.rp-warning-modal h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #000;
  margin: 0;
}
.rp-warning-modal p {
  font-size: .9rem;
  color: #555;
  margin: 0;
  line-height: 1.5;
  max-width: 380px;
}
.rp-warning-actions {
  display: flex;
  gap: .75rem;
  width: 100%;
  margin-top: .5rem;
}

/* MAIN PANEL */
.saas-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-top: 105px;
}
.saas-content {
  flex: 1;
  padding: 1.5rem 2rem 3rem;
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
}

/* RESPONSIVE MOBILE ASIDE */
.db-sidebar {
  display: none;
  width: 280px;
  background: var(--db-sf);
  border-right: 1px solid var(--db-bd);
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 200;
  transform: translateX(-100%);
  transition: transform .3s ease;
}
.db-sidebar.mobile-open {
  display: flex;
  transform: translateX(0);
}
.db-sidebar-head {
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--db-bd);
}
.db-brand {
  display: flex;
  align-items: center;
  gap: .75rem;
  color: var(--db-tx);
  text-decoration: none;
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 1.1rem;
}
.logo-container {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  border: 1.5px solid rgba(225,6,19,.15);
}
.logo-img {
  object-fit: cover;
}
.db-mob-close {
  background: 0;
  border: 0;
  color: var(--db-tx2);
  cursor: pointer;
}
.db-nav {
  flex: 1;
  padding: 1rem .75rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.db-nav-item {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .75rem 1rem;
  border-radius: 10px;
  color: var(--db-tx2);
  text-decoration: none;
  font-size: .875rem;
  font-weight: 500;
  transition: all .2s;
}
.db-nav-item:hover, .db-nav-item.active {
  background: var(--db-gd);
  color: var(--db-tx);
}
.db-sidebar-foot {
  padding: 1rem;
  border-top: 1px solid var(--db-bd);
}
.db-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.4);
  z-index: 150;
  backdrop-filter: blur(4px);
}

@media(max-width: 1024px) {
  .saas-topbar {
    display: none;
  }
  .saas-main {
    padding-top: 60px;
  }
  .saas-mob-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    background: var(--db-sf);
    border-bottom: 1px solid var(--db-bd);
    padding: 0 1rem;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    backdrop-filter: blur(15px);
  }
  .db-menu {
    background: 0;
    border: 0;
    color: var(--db-tx);
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
  }
  .saas-mob-title {
    font-weight: 700;
    font-size: 1rem;
    color: var(--db-tx);
  }
  .saas-content {
    padding: 1.5rem 1rem;
  }
}
      `}</style>
    </EmpContext.Provider>
  );
}
