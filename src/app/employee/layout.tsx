'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { Employee } from '@/types/database';
import AlertModal from '@/components/AlertModal';
import { LayoutDashboard, Car, Upload, LogOut, Menu, X, Bell, FileText, AlertCircle, Clock, CheckCircle, PhoneCall, Bookmark, Mail } from 'lucide-react';
import { getProxiedImageUrl } from '@/lib/utils';

const EmpContext = createContext<{ employee: Employee | null; refreshEmployee?: () => Promise<void>; darkMode: boolean; onReportSubmitted: () => void }>({ employee: null, darkMode: false, onReportSubmitted: () => {} });
export const useEmpContext = () => useContext(EmpContext);

const navItems = [
  { href: '/employee', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employee/upload', label: 'Upload Car', icon: Upload },
  { href: '/employee/cars', label: 'My Cars', icon: Car },
  { href: '/employee/customer-details', label: 'Customer Details', icon: FileText },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const darkMode = false;
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
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };
  const [logoutWarning, setLogoutWarning] = useState(false);

  // Contact Messages states
  const [contactMessagesOpen, setContactMessagesOpen] = useState(false);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [unreadContactsCount, setUnreadContactsCount] = useState(0);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const fetchContactMessages = async () => {
    setLoadingContacts(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*, customer_notes(note)')
      .ilike('interested_car', 'Get In Touch%')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      const mapped = data.map((m: any) => ({
        ...m,
        notes: m.customer_notes?.[0]?.note || 'No message provided.'
      }));
      setContactMessages(mapped);
      const unread = mapped.filter((m: any) => m.lead_status === 'new').length;
      setUnreadContactsCount(unread);
    }
    setLoadingContacts(false);
  };

  const markContactStatus = async (leadId: string, newStatus: string) => {
    const { error } = await supabase
      .from('leads')
      .update({ lead_status: newStatus })
      .eq('id', leadId);
    
    if (error) {
      showAlert('Status Update Failed', 'Failed to update status: ' + error.message, 'error');
    } else {
      setContactMessages(prev => prev.map(m => m.id === leadId ? { ...m, lead_status: newStatus } : m));
      const updatedMessages = contactMessages.map(m => m.id === leadId ? { ...m, lead_status: newStatus } : m);
      setUnreadContactsCount(updatedMessages.filter(m => m.lead_status === 'new').length);
    }
  };

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
      .in('type', ['new_booking_request', 'new_test_drive_request', 'lead_assigned', 'report_reviewed', 'new_lead', 'new_contact_message'])
      .order('created_at', { ascending: false })
      .limit(15);
    setNotifications(data || []);
  };

  const fetchUnreadContactsCountOnly = async () => {
    const { data: contactsData } = await supabase
      .from('leads')
      .select('lead_status')
      .ilike('interested_car', 'Get In Touch%');
    const unreadContacts = contactsData?.filter((m: any) => m.lead_status === 'new').length || 0;
    setUnreadContactsCount(unreadContacts);
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
      await fetchUnreadContactsCountOnly();
      setLoading(false);
    };
    getUser();
    const interval = setInterval(() => {
      fetchUnreadContactsCountOnly();
    }, 60000);
    return () => clearInterval(interval);
  }, []);



  const refreshEmployee = async () => {
    if (!employee) return;
    const { data } = await supabase.from('employees').select('*').eq('id', employee.id).single();
    if (data) {
      setEmployee(data);
    }
  };

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
      metadata: { employee_id: employee.id, report_date: today, notes: reportText.trim() },
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
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
      setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, read: true } : n));
    }
  };

  if (loading) {
    return <div className="db-loader"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="db-spinner" /></div>;
  }

  return (
    <EmpContext.Provider value={{ employee, refreshEmployee, darkMode, onReportSubmitted: () => checkTodayReport(employee?.id || '') }}>
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

              <button 
                className="saas-action-btn notif-wrap" 
                title="Notifications & Messages" 
                onClick={() => { setContactMessagesOpen(true); if (employee) fetchNotifications(employee.id); }}
                style={{ marginRight: '0.75rem' }}
              >
                <Mail size={18} />
                {notifications.filter(n => !n.read).length > 0 && <span className="saas-dot notif-count" style={{ background: '#E10613', color: '#fff' }}>{notifications.filter(n => !n.read).length}</span>}
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
                <div style={{ position: 'relative', width: 36, height: 36 }}>
                  <Image src={getProxiedImageUrl(employee?.avatar_url || '/DEFAULT IMAGE.PNG')} alt={employee?.name || 'Avatar'} fill style={{ objectFit: 'cover', borderRadius: '50%' }} />
                </div>
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
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <button 
                className="saas-action-btn notif-wrap mobile-notif-btn" 
                title="Notifications & Messages" 
                onClick={() => { setContactMessagesOpen(true); if (employee) fetchNotifications(employee.id); }}
                style={{ 
                  background: 'var(--db-sf2, #f5f5f5)', 
                  border: '1px solid var(--db-bd, rgba(0,0,0,0.08))', 
                  borderRadius: '50%', 
                  padding: '8px', 
                  cursor: 'pointer', 
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--db-tx2, #555)'
                }}
              >
                <Mail size={16} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="saas-dot notif-count" style={{ background: '#E10613', color: '#fff', top: '-2px', right: '-2px', minWidth: '14px', height: '14px', fontSize: '0.55rem' }}>
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

                <div style={{ position: 'relative', width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--db-bd)' }}>
                  <Image src={getProxiedImageUrl(employee?.avatar_url || '/DEFAULT IMAGE.PNG')} alt={employee?.name || 'Avatar'} fill style={{ objectFit: 'cover', borderRadius: '50%' }} />
                </div>
            </div>
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

        {/* UNIFIED INBOX/NOTIFICATIONS DRAWER */}
        <AnimatePresence>
          {contactMessagesOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setContactMessagesOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 1000,
                }}
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{
                  position: 'fixed',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                  maxWidth: '420px',
                  background: 'var(--db-sf, #ffffff)',
                  borderLeft: '1px solid var(--db-bd)',
                  boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.12)',
                  zIndex: 1001,
                  display: 'flex',
                  flexDirection: 'column',
                  boxSizing: 'border-box',
                  fontFamily: "'Outfit', sans-serif"
                }}
              >
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--db-bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--db-tx)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={20} style={{ color: '#E10613' }} /> Inbox & Alerts
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--db-tx3)', margin: '4px 0 0' }}>All system notifications and client messages</p>
                  </div>
                  <button 
                    onClick={() => setContactMessagesOpen(false)} 
                    style={{ background: 'none', border: 'none', color: 'var(--db-tx2)', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '50%' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Toolbar */}
                {notifications.length > 0 && (
                  <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--db-bd)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--db-sf2)' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--db-tx2)' }}>
                      {notifications.filter(n => !n.read).length} unread notification{notifications.filter(n => !n.read).length !== 1 && 's'}
                    </span>
                    <button 
                      onClick={markNotificationsRead} 
                      style={{ background: 'none', border: 'none', color: 'var(--db-gold, #c5a880)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      Mark all as read
                    </button>
                  </div>
                )}

                {/* Notifications List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {notifications.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.7, padding: '2rem' }}>
                      <Mail size={40} style={{ color: 'var(--db-tx3)', marginBottom: '1rem' }} />
                      <p style={{ fontSize: '0.875rem', color: 'var(--db-tx3)', margin: 0, textAlign: 'center' }}>No notifications or messages yet</p>
                    </div>
                  ) : (
                    notifications.map((n: any) => {
                      const isNew = !n.read;
                      const hasLink = !!(
                        n.metadata?.lead_id || 
                        n.metadata?.booking_id || 
                        n.metadata?.test_drive_id ||
                        n.metadata?.report_id ||
                        n.type === 'report_reviewed'
                      );
                      
                      // Categorize notification
                      const t = n.type.toLowerCase();
                      const mType = (n.metadata?.type || '').toLowerCase();
                      let config = {
                        label: 'CRM',
                        color: '#10B981',
                        bgLight: 'rgba(16, 185, 129, 0.03)',
                        borderLight: 'rgba(16, 185, 129, 0.15)',
                        glow: '0 4px 20px rgba(16, 185, 129, 0.04)',
                        icon: (
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px', 
                            background: 'rgba(16, 185, 129, 0.1)', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', color: '#10B981',
                            flexShrink: 0
                          }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          </div>
                        )
                      };

                      if (t === 'new_lead' || mType === 'sell_car' || t.includes('sell')) {
                        config = {
                          label: 'SELL',
                          color: '#FF7A00',
                          bgLight: 'rgba(255, 122, 0, 0.03)',
                          borderLight: 'rgba(255, 122, 0, 0.15)',
                          glow: '0 4px 20px rgba(255, 122, 0, 0.04)',
                          icon: (
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '8px', 
                              background: 'rgba(255, 122, 0, 0.1)', display: 'flex', 
                              alignItems: 'center', justifyContent: 'center', color: '#FF7A00',
                              flexShrink: 0
                            }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            </div>
                          )
                        };
                      } else if (t.includes('booking') || t.includes('drive') || t.includes('reserve') || t.includes('test_drive')) {
                        config = {
                          label: 'BUY / BOOKING',
                          color: '#C5A880',
                          bgLight: 'rgba(197, 168, 128, 0.05)',
                          borderLight: 'rgba(197, 168, 128, 0.2)',
                          glow: '0 4px 20px rgba(197, 168, 128, 0.05)',
                          icon: (
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '8px', 
                              background: 'rgba(197, 168, 128, 0.12)', display: 'flex', 
                              alignItems: 'center', justifyContent: 'center', color: '#C5A880',
                              flexShrink: 0
                            }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            </div>
                          )
                        };
                      } else if (t.includes('report') || t.includes('reminder') || t.includes('employee')) {
                        config = {
                          label: 'EMPLOYEE',
                          color: '#2F80ED',
                          bgLight: 'rgba(47, 128, 237, 0.03)',
                          borderLight: 'rgba(47, 128, 237, 0.15)',
                          glow: '0 4px 20px rgba(47, 128, 237, 0.04)',
                          icon: (
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '8px', 
                              background: 'rgba(47, 128, 237, 0.1)', display: 'flex', 
                              alignItems: 'center', justifyContent: 'center', color: '#2F80ED',
                              flexShrink: 0
                            }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            </div>
                          )
                        };
                      }

                      return (
                        <div 
                          key={n.id}
                          onClick={async () => {
                            if (!n.read) {
                              await supabase.from('notifications').update({ read: true }).eq('id', n.id);
                              setNotifications(prev => prev.map((item: any) => item.id === n.id ? { ...item, read: true } : item));
                            }
                            
                            if (n.metadata?.lead_id) {
                              setContactMessagesOpen(false);
                              const isEmployee = pathname.startsWith('/employee');
                              router.push(isEmployee ? `/employee/crm/leads/${n.metadata.lead_id}` : `/dashboard/crm/leads/${n.metadata.lead_id}`);
                            } else if (n.metadata?.booking_id) {
                              setContactMessagesOpen(false);
                              const isEmployee = pathname.startsWith('/employee');
                              router.push(isEmployee ? `/employee/bookings` : `/dashboard/bookings`);
                            } else if (n.metadata?.test_drive_id) {
                              setContactMessagesOpen(false);
                              const isEmployee = pathname.startsWith('/employee');
                              router.push(isEmployee ? `/employee/test-drives` : `/dashboard/test-drives`);
                            } else if (n.type === 'report_reviewed' || n.metadata?.report_id) {
                              setContactMessagesOpen(false);
                              router.push('/employee');
                            }
                          }}
                          style={{
                            padding: '1.25rem 1.25rem 1.25rem 1.125rem',
                            background: isNew ? config.bgLight : 'var(--db-sf2)',
                            border: isNew ? `1px solid ${config.borderLight}` : '1px solid var(--db-bd)',
                            borderLeft: `4px solid ${config.color}`,
                            borderRadius: '16px',
                            cursor: hasLink ? 'pointer' : 'default',
                            position: 'relative',
                            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: isNew ? config.glow : 'none',
                          }}
                          onMouseEnter={e => {
                            if (hasLink) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.borderColor = config.color;
                              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.06)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (hasLink) {
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.borderColor = isNew ? config.borderLight : 'var(--db-bd)';
                              e.currentTarget.style.borderLeftColor = config.color;
                              e.currentTarget.style.boxShadow = isNew ? config.glow : 'none';
                            }
                          }}
                        >
                          {isNew && (
                            <span style={{ position: 'absolute', top: '16px', right: '16px', width: '8px', height: '8px', borderRadius: '50%', background: config.color, boxShadow: `0 0 10px ${config.color}` }} />
                          )}

                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <div style={{ flexShrink: 0 }}>
                              {config.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                <span style={{ 
                                  fontSize: '0.625rem', 
                                  fontWeight: 800, 
                                  color: config.color, 
                                  background: `${config.color}15`, 
                                  padding: '2px 6px', 
                                  borderRadius: '4px',
                                  letterSpacing: '0.05em'
                                }}>
                                  {config.label}
                                </span>
                                {isNew && (
                                  <span style={{ 
                                    fontSize: '0.625rem', 
                                    fontWeight: 800, 
                                    color: '#E10613', 
                                    background: 'rgba(225, 6, 19, 0.1)', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px',
                                    letterSpacing: '0.05em'
                                  }}>
                                    NEW
                                  </span>
                                )}
                              </div>
                              <strong style={{ fontSize: '0.875rem', color: 'var(--db-tx)', display: 'block', marginBottom: '4px', fontWeight: 700, paddingRight: '12px' }}>
                                {n.title.replace(/^[^\w\s\(\)]+\s*/, '')}
                              </strong>
                              <p style={{ fontSize: '0.8125rem', color: 'var(--db-tx2)', margin: 0, lineHeight: 1.4, fontWeight: 500 }}>
                                {n.message}
                              </p>
                              
                              {n.metadata?.notes && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--db-tx2)', background: 'rgba(0,0,0,0.03)', padding: '0.5rem 0.75rem', borderRadius: '8px', marginTop: '0.5rem', whiteSpace: 'pre-line', border: '1px solid var(--db-bd)' }}>
                                  "{n.metadata.notes}"
                                </div>
                              )}

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                                <span style={{ fontSize: '0.6875rem', color: 'var(--db-tx3)', fontWeight: 600 }}>
                                  {new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                                {hasLink && (
                                  <span style={{ fontSize: '0.6875rem', color: 'var(--db-gold, #c5a880)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    View Details →
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <AlertModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />

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
    padding-top: 80px; /* Increased from 60px to prevent header overlap on mobile */
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
  .db-page-header {
    position: relative;
    padding-right: 90px !important;
  }
  .refresh-btn {
    position: absolute !important;
    top: 4px;
    right: 0;
  }
}

/* Page Header Standard Styling */
.db-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem !important;
  padding-bottom: 1.25rem;
  border-bottom: 1.5px solid var(--db-bd);
  flex-wrap: wrap;
  gap: 1.25rem;
}
.db-page-title-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.db-page-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--db-tx);
  margin: 0 0 0.35rem 0 !important;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.db-page-sub {
  font-size: 0.9rem;
  color: var(--db-tx2);
  margin: 0;
  line-height: 1.5;
  font-weight: 500;
}

@media(max-width: 768px) {
  .db-page-header {
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 1.5rem !important;
    padding-bottom: 1rem;
  }
  .db-page-title {
    font-size: 1.4rem;
    line-height: 1.25;
  }
  .db-page-sub {
    font-size: 0.8125rem;
    line-height: 1.4;
  }
}
      `}</style>
    </EmpContext.Provider>
  );
}
