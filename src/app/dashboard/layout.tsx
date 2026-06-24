'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { Employee } from '@/types/database';
import {
  LayoutDashboard, Users, Car, ClipboardList, Activity,
  LogOut, Menu, X, ChevronRight, Moon, Sun, Bell, Search,
  Users2, CalendarClock, BarChart3, PhoneCall, Bookmark
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
  { href: '/dashboard/crm/analytics', label: 'CRM Analytics', icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const darkMode = false;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadReports, setUnreadReports] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

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
                  setNotifOpen(true);
                  markNotificationsRead();
                }} 
                className="db-icon-btn" 
                style={{ 
                  position: 'relative', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'var(--db-tx2)', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer' 
                }}
              >
                <Bell size={18} />
                {unreadNotifications > 0 && (
                  <span className="db-dot" style={{ position: 'absolute', top: 6, right: 6, minWidth: 14, height: 14, fontSize: '.55rem', fontWeight: 800, background: '#E10613', color: '#fff', borderRadius: '99px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                    {unreadNotifications}
                  </span>
                )}
              </button>
              <div className="db-avatar">{employee?.name?.charAt(0) || 'A'}</div>
            </div>
          </header>
          <main className="db-content">{children}</main>
        </div>
      </div>

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
.db-avatar{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#e10613,#c70511);display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:700;font-size:.875rem;font-family:'Outfit',sans-serif}
.db-content{flex:1;padding:1.5rem;overflow-y:auto;overflow-x:hidden;min-width:0;display:flex;flex-direction:column}
@media(max-width:768px){.db-sidebar{transform:translateX(-100%);width:280px}.db-sidebar.mobile-open{transform:translateX(0)}.db-mob-close{display:flex}.db-overlay{display:block}.db-main,.db-main.expanded{margin-left:0!important}.db-search{display:none}.db-topbar{padding:0 1rem}.db-content{padding:1rem}}
      `}</style>

      {/* NOTIFICATIONS MODAL */}
      <AnimatePresence>
        {notifOpen && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1.5rem',
            }}
            onClick={() => setNotifOpen(false)}
          >
            <motion.div 
              style={{
                background: 'var(--db-sf, #ffffff)',
                border: '1px solid var(--db-bd, rgba(0, 0, 0, 0.1))',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '450px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '80vh',
              }}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--db-bd)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--db-tx)' }}>Notifications</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--db-tx3)', margin: '2px 0 0' }}>Recent system updates and alerts</p>
                </div>
                <Bell size={20} style={{ color: '#E10613' }} />
              </div>
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '4px' }}>
                {notifications.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--db-tx3)', fontSize: '0.875rem', margin: 0 }}>No new notifications</p>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      style={{ 
                        padding: '1rem', 
                        border: '1.5px solid var(--db-bd)', 
                        borderRadius: '12px', 
                        background: n.read ? 'var(--db-sf2)' : 'rgba(225, 6, 19, 0.03)',
                        borderColor: n.read ? 'var(--db-bd)' : 'rgba(225, 6, 19, 0.15)',
                        position: 'relative'
                      }}
                    >
                      {!n.read && (
                        <div style={{ position: 'absolute', top: '12px', right: '12px', width: '6px', height: '6px', borderRadius: '50%', background: '#E10613' }} />
                      )}
                      <strong style={{ fontSize: '.875rem', color: 'var(--db-tx)', display: 'block', marginBottom: '4px', paddingRight: '12px' }}>{n.title}</strong>
                      <p style={{ fontSize: '.8125rem', color: 'var(--db-tx2)', margin: 0, lineHeight: 1.4 }}>{n.message}</p>
                      <span style={{ fontSize: '.6875rem', color: 'var(--db-tx3)', display: 'block', marginTop: '6px' }}>
                        {new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div style={{ display: 'flex', marginTop: '1.25rem', borderTop: '1px solid var(--db-bd)', paddingTop: '0.75rem' }}>
                <button 
                  onClick={() => setNotifOpen(false)} 
                  style={{ 
                    flex: 1, 
                    padding: '0.625rem', 
                    background: 'var(--db-sf2)', 
                    border: '1px solid var(--db-bd)', 
                    borderRadius: '10px', 
                    color: 'var(--db-tx)', 
                    fontSize: '0.875rem', 
                    fontWeight: 600, 
                    cursor: 'pointer' 
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardContext.Provider>
  );
}
