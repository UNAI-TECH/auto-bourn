'use client';

import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { Employee } from '@/types/database';
import AlertModal from '@/components/AlertModal';
import { getProxiedImageUrl } from '@/lib/utils';
import {
  LayoutDashboard, Users, Car, ClipboardList, Activity,
  LogOut, Menu, X, ChevronRight, Moon, Sun, Bell, Search,
  Users2, CalendarClock, BarChart3, PhoneCall, Bookmark, Mail, FileText, ClipboardCheck
} from 'lucide-react';

interface DashboardContextType {
  employee: Employee | null;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const DashboardContext = createContext<DashboardContextType>({
  employee: null, darkMode: false, toggleDarkMode: () => {},
});

export const useDashboard = () => useContext(DashboardContext);

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/employees', label: 'Employees', icon: Users },
  { href: '/dashboard/attendance', label: 'Attendance', icon: ClipboardCheck },
  { href: '/dashboard/cars', label: 'Cars', icon: Car },
  { href: '/dashboard/uploads', label: 'Upload Tracking', icon: ClipboardList },
  { href: '/dashboard/bookings', label: 'Reservations', icon: Bookmark },
  { href: '/dashboard/reports', label: 'Daily Reports', icon: Bell },
  { href: '/dashboard/test-drives', label: 'Test Drives', icon: CalendarClock },
  { href: '/dashboard/logs', label: 'Activity Logs', icon: Activity },
];

const crmNavItems = [
  { href: '/dashboard/crm', label: 'CRM Overview', icon: Users2 },
  { href: '/dashboard/crm/leads', label: 'Leads', icon: PhoneCall },
  { href: '/dashboard/crm/follow-ups', label: 'Follow-ups', icon: CalendarClock },
  { href: '/dashboard/crm/customer-details', label: 'Customer Details', icon: FileText },
  { href: '/dashboard/crm/analytics', label: 'CRM Analytics', icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const darkMode = false;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadReports, setUnreadReports] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [contactMessagesOpen, setContactMessagesOpen] = useState(false);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [unreadContactsCount, setUnreadContactsCount] = useState(0);
  const [loadingContacts, setLoadingContacts] = useState(false);
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employee) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert('Error', 'Image size must be less than 5MB', 'error');
      return;
    }

    setUpdatingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${employee.employee_id || 'temp'}-${Math.random().toString(36).substring(2)}.${fileExt}`;
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

      const { error: updateError } = await supabase
        .from('employees')
        .update({ avatar_url: uploadedAvatarUrl })
        .eq('id', employee.id);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      setEmployee({ ...employee, avatar_url: uploadedAvatarUrl });
      showAlert('Success', 'Profile photo updated successfully!', 'success');
    } catch (err: any) {
      showAlert('Error', err.message || 'Failed to update profile photo', 'error');
    } finally {
      setUpdatingAvatar(false);
    }
  };

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

  const fetchUnreadCount = async () => {
    // 1. Fetch daily reports count
    const { count: reportCount } = await supabase
      .from('daily_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted');
    setUnreadReports(reportCount || 0);

    // 2. Fetch notifications count
    const { count: notifCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('read', false);
    setUnreadNotifications(notifCount || 0);

    // 3. Fetch unread contact messages count
    const { data: contactsData } = await supabase
      .from('leads')
      .select('lead_status')
      .ilike('interested_car', 'Get In Touch%');
    const unreadContacts = contactsData?.filter((m: any) => m.lead_status === 'new').length || 0;
    setUnreadContactsCount(unreadContacts);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);
    setNotifications(data || []);
  };

  const markNotificationsRead = async () => {
    if (notifications.length === 0) return;
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length > 0) {
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
      setUnreadNotifications(0);
      setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, read: true } : n));
    }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/console'); return; }
      const { data } = await supabase.from('employees').select('*').eq('auth_user_id', user.id).single();
      if (!data || data.role !== 'admin') { router.replace('/console'); return; }
      setEmployee(data);
      setLoading(false);
      fetchUnreadCount();
      fetchNotifications();
    };
    getUser();
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    if (employee) {
      await supabase.from('activity_logs').insert({ employee_id: employee.id, action: 'logout', details: 'Admin logged out' });
    }
    await supabase.auth.signOut();
    router.replace('/console');
  };


  if (loading) {
    return (
      <div className="db-loader"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="db-spinner" /></div>
    );
  }



  return (
    <DashboardContext.Provider value={{ employee, darkMode, toggleDarkMode: () => {} }}>
      <div className={`db-root ${darkMode ? 'db-dark' : 'db-light'}`}>
        <aside className={`db-sidebar ${sidebarOpen ? '' : 'collapsed'} ${mobileOpen ? 'mobile-open' : ''}`}>
          <div className="db-sidebar-head">
            <Link href="/dashboard" className="db-brand">
              <div className="logo-container">
                <Image src="/logo.jpg" alt="Auto Bourn Logo" width={32} height={32} className="logo-img" />
              </div>
              {sidebarOpen && <span>AUTO BOURN</span>}
            </Link>
            <button className="db-mob-close" onClick={() => setMobileOpen(false)}><X size={20} /></button>
          </div>
          <nav className="db-nav">
            {navItems.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              const isReports = item.href === '/dashboard/reports';
              return (
                <Link key={item.href} href={item.href} className={`db-nav-item ${active ? 'active' : ''}`} onClick={() => setMobileOpen(false)} style={{ position: 'relative' }}>
                  <item.icon size={20} />{sidebarOpen && <span>{item.label}</span>}{active && sidebarOpen && <ChevronRight size={16} className="db-arrow" />}
                  {isReports && unreadReports > 0 && (
                    <span style={{ marginLeft: 'auto', background: '#E10613', color: '#fff', fontSize: '.6rem', fontWeight: 800, padding: '1px 6px', borderRadius: '99px', minWidth: 18, textAlign: 'center', flexShrink: 0 }}>
                      {unreadReports}
                    </span>
                  )}
                </Link>
              );
            })}
            {sidebarOpen && <div style={{ fontSize: '.625rem', fontWeight: 700, color: 'var(--db-tx3)', textTransform: 'uppercase', letterSpacing: '.1em', padding: '.75rem 1rem .25rem', marginTop: '.25rem', borderTop: '1px solid var(--db-bd)' }}>CRM</div>}
            {!sidebarOpen && <div style={{ height: 1, background: 'var(--db-bd)', margin: '.5rem .75rem' }} />}
            {crmNavItems.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard/crm' && pathname?.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={`db-nav-item ${active ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                  <item.icon size={20} />{sidebarOpen && <span>{item.label}</span>}{active && sidebarOpen && <ChevronRight size={16} className="db-arrow" />}
                </Link>
              );
            })}
          </nav>
          <div className="db-sidebar-foot">
            <button onClick={handleLogout} className="db-nav-item db-logout"><LogOut size={20} />{sidebarOpen && <span>Sign Out</span>}</button>
          </div>
        </aside>

        <AnimatePresence>{mobileOpen && <motion.div className="db-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />}</AnimatePresence>

        <div className={`db-main ${sidebarOpen ? '' : 'expanded'}`}>
          <header className="db-topbar">
            <div className="db-topbar-l">
              <button className="db-menu" onClick={() => window.innerWidth < 768 ? setMobileOpen(true) : setSidebarOpen(!sidebarOpen)}><Menu size={20} /></button>
              <div className="db-search"><Search size={16} /><input placeholder="Search..." /></div>
            </div>
             <div className="db-topbar-r">
              <button 
                onClick={() => {
                  setContactMessagesOpen(true);
                  fetchNotifications();
                }} 
                className="db-icon-btn" 
                title="Notifications & Messages"
                style={{ 
                  position: 'relative', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'var(--db-tx2)', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  marginRight: '0.75rem'
                }}
              >
                <Mail size={18} />
                {unreadNotifications > 0 && (
                  <span className="db-dot" style={{ position: 'absolute', top: 6, right: 6, minWidth: 14, height: 14, fontSize: '.55rem', fontWeight: 800, background: '#E10613', color: '#fff', borderRadius: '99px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                    {unreadNotifications}
                  </span>
                )}
              </button>
              <div 
                onClick={() => fileInputRef.current?.click()} 
                title="Change Photo"
                style={{ 
                  position: 'relative', 
                  width: 36, 
                  height: 36, 
                  cursor: 'pointer',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '2px solid var(--db-bd)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.2s',
                  flexShrink: 0
                }}
                className="admin-avatar-btn"
              >
                {updatingAvatar ? (
                  <div className="avatar-spinner-small" style={{ width: 16, height: 16, border: '2px solid var(--db-gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Image src={getProxiedImageUrl(employee?.avatar_url || '/DEFAULT IMAGE.PNG')} alt={employee?.name || 'Avatar'} fill style={{ objectFit: 'cover', borderRadius: '50%' }} />
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>
          </header>
          <main className="db-content">{children}</main>
        </div>
      </div>

      <AlertModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <style jsx global>{`
.db-loader{min-height:100vh;background:#fafafa;display:flex;align-items:center;justify-content:center}
.db-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem !important;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--db-bd, rgba(0, 0, 0, 0.1));
}
.db-page-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--db-tx);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}
.db-page-sub {
  font-size: 0.875rem;
  color: var(--db-tx3);
  margin: 0;
  line-height: 1.5;
}
.db-spinner{width:40px;height:40px;border:3px solid rgba(225,6,19,.15);border-top-color:#e10613;border-radius:50%}
.db-root{display:flex;min-height:100vh;font-family:'Outfit',sans-serif}
.db-dark{--db-bg:#0a0a0a;--db-sf:#121212;--db-sf2:#1a1a1a;--db-bd:rgba(255,255,255,.08);--db-tx:#fff;--db-tx2:rgba(255,255,255,.6);--db-tx3:rgba(255,255,255,.35);--db-gold:#e10613;--db-gd:rgba(225,6,19,.12);--db-gg:rgba(225,6,19,.25);--db-gn:#22c55e;--db-rd:#ef4444;--db-bl:#3b82f6}
.db-light{--db-bg:#fafafa;--db-sf:#ffffff;--db-sf2:#f5f5f5;--db-bd:rgba(0,0,0,.1);--db-tx:#000000;--db-tx2:#1a1a1a;--db-tx3:#555555;--db-gold:#e10613;--db-gd:rgba(225,6,19,.08);--db-gg:rgba(225,6,19,.15);--db-gn:#16a34a;--db-rd:#e10613;--db-bl:#2563eb}
.db-root{background:var(--db-bg);color:var(--db-tx)}
.db-sidebar{width:260px;background:var(--db-sf);border-right:1px solid var(--db-bd);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:50;transition:width .3s ease}
.db-sidebar.collapsed{width:72px}
.db-sidebar-head{padding:1.25rem;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--db-bd)}
.db-brand{display:flex;align-items:center;gap:.75rem;color:var(--db-gold);text-decoration:none;font-family:'Outfit',sans-serif;font-weight:800;font-size:.9375rem;letter-spacing:.1em}
.logo-container{width:32px;height:32px;border-radius:8px;overflow:hidden;position:relative;flex-shrink:0;border:1px solid rgba(225,6,19,.2)}
.logo-img{object-fit:cover}
.db-mob-close{display:none;background:0;border:0;color:var(--db-tx2);cursor:pointer}
.db-nav{flex:1;padding:1rem .75rem;display:flex;flex-direction:column;gap:4px;overflow-y:auto}
.db-nav-item{display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;border-radius:10px;color:var(--db-tx2);text-decoration:none;font-size:.875rem;font-weight:500;transition:all .2s;cursor:pointer;background:0;border:0;width:100%;text-align:left}
.db-nav-item:hover{background:var(--db-gd);color:var(--db-gold)}
.db-nav-item.active{background:var(--db-gd);color:var(--db-gold);font-weight:600}
.db-arrow{margin-left:auto;opacity:.5}
.db-sidebar-foot{padding:.75rem;border-top:1px solid var(--db-bd)}
.db-logout:hover{color:var(--db-rd)!important;background:rgba(225,6,19,.1)!important}
.db-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:40}
.db-main{flex:1;margin-left:260px;transition:margin-left .3s;display:flex;flex-direction:column;min-height:100vh;min-width:0;overflow-x:hidden}
.db-main.expanded{margin-left:72px}
.db-topbar{height:64px;background:var(--db-sf);border-bottom:1px solid var(--db-bd);display:flex;align-items:center;justify-content:space-between;padding:0 1.5rem;position:sticky;top:0;z-index:30}
.db-topbar-l,.db-topbar-r{display:flex;align-items:center;gap:.75rem}
.db-menu{background:0;border:0;color:var(--db-tx2);cursor:pointer;padding:6px;border-radius:8px;display:flex}
.db-menu:hover{background:var(--db-gd);color:var(--db-gold)}
.db-search{display:flex;align-items:center;gap:.5rem;background:var(--db-sf2);border:1px solid var(--db-bd);border-radius:10px;padding:.5rem 1rem;min-width:240px}
.db-search svg{color:var(--db-tx3);flex-shrink:0}
.db-search input{background:0;border:0;outline:0;color:var(--db-tx);font-size:.875rem;width:100%;font-family:inherit}
.db-search input::placeholder{color:var(--db-tx3)}
.db-search-inline{display:flex;align-items:center;gap:.5rem;background:var(--db-sf);border:1px solid var(--db-bd);border-radius:10px;padding:.5rem 1rem;flex:1;min-width:200px}
.db-search-inline svg{color:var(--db-tx3);flex-shrink:0}
.db-search-inline input{background:0;border:0;outline:0;color:var(--db-tx);font-size:.875rem;width:100%;font-family:inherit}
.db-search-inline input::placeholder{color:var(--db-tx3)}
.db-icon-btn{background:0;border:0;color:var(--db-tx2);cursor:pointer;padding:8px;border-radius:10px;display:flex;position:relative;transition:all .2s}
.db-icon-btn:hover{background:var(--db-gd);color:var(--db-gold)}
.db-dot{position:absolute;top:6px;right:6px;width:7px;height:7px;background:var(--db-rd);border-radius:50%}
.db-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#e10613,#c70511);display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:700;font-size:.875rem;font-family:'Outfit',sans-serif}
.db-content{flex:1;padding:1.5rem;overflow-y:auto;overflow-x:hidden;min-width:0;display:flex;flex-direction:column}
@media(max-width:768px){.db-sidebar{transform:translateX(-100%);width:280px}.db-sidebar.mobile-open{transform:translateX(0)}.db-mob-close{display:flex}.db-overlay{display:block}.db-main,.db-main.expanded{margin-left:0!important}.db-search{display:none}.db-topbar{padding:0 1rem}.db-content{padding:1rem}}
      `}</style>

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
                    {unreadNotifications} unread notification{unreadNotifications !== 1 && 's'}
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
                      n.metadata?.report_date ||
                      n.type === 'daily_report_submitted'
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
                    } else if (t.includes('car_upload_request')) {
                      config = {
                        label: 'CAR LISTING',
                        color: '#E10613',
                        bgLight: 'rgba(225, 6, 19, 0.03)',
                        borderLight: 'rgba(225, 6, 19, 0.15)',
                        glow: '0 4px 20px rgba(225, 6, 19, 0.04)',
                        icon: (
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px', 
                            background: 'rgba(225, 6, 19, 0.1)', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center', color: '#E10613',
                            flexShrink: 0
                          }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>
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
                            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
                            setUnreadNotifications(prev => Math.max(0, prev - 1));
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
                          } else if (n.type === 'daily_report_submitted' || n.metadata?.report_date) {
                            setContactMessagesOpen(false);
                            router.push('/dashboard/reports');
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
    </DashboardContext.Provider>
  );
}
