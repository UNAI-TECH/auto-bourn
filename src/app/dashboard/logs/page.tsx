'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { 
  Search, LogIn, LogOut, Upload, Edit, Trash2, RefreshCw, 
  UserPlus, UserMinus, Key, Activity, ShieldAlert, Award 
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import type { ActivityLog } from '@/types/database';

const actionMeta: Record<string, { title: string; badge: string; badgeClass: string; icon: typeof LogIn; bg: string; color: string }> = {
  login: { title: 'User Login', badge: 'Success', badgeClass: 'bg-green-100 text-green-700', icon: LogIn, bg: 'var(--db-gd)', color: 'var(--db-gold)' },
  logout: { title: 'User Logout', badge: 'Info', badgeClass: 'bg-gray-100 text-gray-700', icon: LogOut, bg: 'var(--db-sf2)', color: 'var(--db-tx2)' },
  upload: { title: 'File Uploaded', badge: 'Success', badgeClass: 'bg-green-100 text-green-700', icon: Upload, bg: 'var(--db-gd)', color: 'var(--db-gold)' },
  edit: { title: 'Project Updated', badge: 'Updated', badgeClass: 'bg-blue-100 text-blue-700', icon: Edit, bg: 'var(--db-gd)', color: 'var(--db-gold)' },
  delete: { title: 'File Deleted', badge: 'Warning', badgeClass: 'bg-red-100 text-red-700', icon: Trash2, bg: 'rgba(225,6,19,0.1)', color: 'var(--db-rd)' },
  sold_status_change: { title: 'Status Changed', badge: 'Updated', badgeClass: 'bg-yellow-100 text-yellow-700', icon: RefreshCw, bg: 'rgba(22,197,94,0.1)', color: 'var(--db-gn)' },
  employee_added: { title: 'User Created', badge: 'Created', badgeClass: 'bg-purple-100 text-purple-700', icon: UserPlus, bg: 'var(--db-gd)', color: 'var(--db-gold)' },
  employee_removed: { title: 'User Removed', badge: 'Warning', badgeClass: 'bg-red-100 text-red-700', icon: UserMinus, bg: 'rgba(225,6,19,0.1)', color: 'var(--db-rd)' },
  password_reset: { title: 'Password Reset', badge: 'Security', badgeClass: 'bg-indigo-100 text-indigo-700', icon: Key, bg: 'var(--db-gd)', color: 'var(--db-gold)' },
};

const getMeta = (action: string) => {
  return actionMeta[action] || {
    title: action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    badge: 'Info',
    badgeClass: 'bg-blue-100 text-blue-700',
    icon: Activity,
    bg: 'var(--db-gd)',
    color: 'var(--db-gold)'
  };
};

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'user' | 'system' | 'errors'>('all');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*, employee:employees(name, employee_id)')
        .order('created_at', { ascending: false })
        .limit(150);
      setLogs((data || []) as ActivityLog[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = logs.filter(log => {
    const matchSearch = (log.details || '').toLowerCase().includes(search.toLowerCase()) ||
      ((log.employee as unknown as { name: string })?.name || '').toLowerCase().includes(search.toLowerCase());
    
    let matchTab = true;
    if (filterTab === 'user') {
      matchTab = ['login', 'logout', 'password_reset'].includes(log.action);
    } else if (filterTab === 'system') {
      matchTab = ['upload', 'edit', 'sold_status_change', 'employee_added'].includes(log.action);
    } else if (filterTab === 'errors') {
      matchTab = ['delete', 'employee_removed'].includes(log.action);
    }
    
    return matchSearch && matchTab;
  });

  // Calculate statistics based on total logs
  const totalActions = logs.length;
  const securityEvents = logs.filter(l => 
    ['login', 'password_reset', 'employee_added', 'employee_removed'].includes(l.action)
  ).length;
  const inventoryActions = logs.filter(l => 
    ['upload', 'edit', 'delete', 'sold_status_change'].includes(l.action)
  ).length;

  return (
    <div className="db-page">
      {/* Page Header */}
      <div className="db-page-header">
        <div>
          <h1 className="db-page-title">Activity Logs</h1>
          <p className="db-page-sub">System-wide activity tracking and audit logs</p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="rp-stats-row">
        <div className="rp-stat-card">
          <div className="rp-stat-icon blue"><Activity size={20} /></div>
          <div>
            <span className="rp-stat-val">{totalActions}</span>
            <span className="rp-stat-lbl">Total Logs Audited</span>
          </div>
        </div>
        <div className="rp-stat-card">
          <div className="rp-stat-icon orange"><ShieldAlert size={20} /></div>
          <div>
            <span className="rp-stat-val">{securityEvents}</span>
            <span className="rp-stat-lbl">Security Events</span>
          </div>
        </div>
        <div className="rp-stat-card">
          <div className="rp-stat-icon green"><Award size={20} /></div>
          <div>
            <span className="rp-stat-val">{inventoryActions}</span>
            <span className="rp-stat-lbl">Inventory Actions</span>
          </div>
        </div>
      </div>

      {/* Search Logs */}
      <div className="search-container">
        <div className="search-wrap">
          <Search size={18} />
          <input
            placeholder="Search activity logs by employee name or details..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button className={filterTab === 'all' ? 'active' : ''} onClick={() => setFilterTab('all')}>All Logs</button>
        <button className={filterTab === 'user' ? 'active' : ''} onClick={() => setFilterTab('user')}>User Activity</button>
        <button className={filterTab === 'system' ? 'active' : ''} onClick={() => setFilterTab('system')}>System Logs</button>
        <button className={filterTab === 'errors' ? 'active' : ''} onClick={() => setFilterTab('errors')}>Errors</button>
      </div>

      {/* 3-Column Card Grid */}
      <div className="log-grid">
        {loading ? (
          Array(9).fill(0).map((_, i) => <div key={i} className="log-skel" />)
        ) : filtered.length === 0 ? (
          <p className="db-empty-full">No matching activity logs found</p>
        ) : (
          filtered.map((log, i) => {
            const meta = getMeta(log.action);
            const Icon = meta.icon;
            const emp = log.employee as unknown as { name: string } | null;
            return (
              <motion.div
                key={log.id}
                className="log-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.2), ease: 'easeOut' }}
              >
                <div className="log-card-header">
                  <div className="log-card-icon-wrap" style={{ backgroundColor: meta.bg, color: meta.color }}>
                    <Icon size={18} />
                  </div>
                  {log.action === 'login' || log.action === 'upload' ? (
                    <span className="log-card-badge-new">NEW</span>
                  ) : log.action === 'delete' || log.action === 'employee_removed' ? (
                    <span className="log-card-badge-warn">★</span>
                  ) : (
                    <span className="log-card-badge-dot">●</span>
                  )}
                </div>

                <div className="log-card-content">
                  <h3 className="log-card-title">{meta.title}</h3>
                  <p className="log-card-body-text">
                    "{log.details || `${meta.title} completed.`}"
                  </p>
                </div>

                <div className="log-card-meta">
                  <div className="log-card-meta-item">
                    <span>{emp?.name || 'System'}</span>
                  </div>
                  <div className="log-card-meta-sep">•</div>
                  <div className="log-card-meta-item">
                    <span>{timeAgo(log.created_at)}</span>
                  </div>
                  {log.ip_address && (
                    <>
                      <div className="log-card-meta-sep">•</div>
                      <div className="log-card-meta-item ip">
                        <span>{log.ip_address}</span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <style jsx global>{`
        .db-page {
          background: var(--db-bg) !important;
          min-height: 100vh;
          padding: 2rem;
          font-family: 'Outfit', sans-serif;
        }
        .rp-stats-row { 
          display: flex; 
          gap: 1.25rem; 
          margin-bottom: 2rem; 
        }
        .rp-stat-card {
          background: var(--db-sf) !important;
          border: 1px solid var(--db-bd) !important;
          border-radius: 16px !important;
          padding: 1.5rem !important;
          display: flex !important;
          align-items: center !important;
          gap: 1.25rem !important;
          flex: 1 !important;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02) !important;
          min-height: 110px;
        }
        .rp-stat-icon {
          width: 44px; 
          height: 44px;
          border-radius: 12px;
          display: flex; 
          align-items: center; 
          justify-content: center;
        }
        .rp-stat-icon.blue { background: var(--db-gd) !important; color: var(--db-gold) !important; }
        .rp-stat-icon.orange { background: rgba(245, 158, 11, 0.08) !important; color: #f59e0b !important; }
        .rp-stat-icon.green { background: rgba(34, 197, 94, 0.08) !important; color: #22c55e !important; }
        .rp-stat-val {
          display: block;
          font-size: 1.625rem;
          font-weight: 800;
          color: var(--db-tx);
          line-height: 1.1;
        }
        .rp-stat-lbl {
          display: block;
          font-size: .75rem;
          color: var(--db-tx3);
          font-weight: 600;
          margin-top: 2px;
        }
        .search-container {
          margin-bottom: 1rem;
        }
        .search-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }
        .search-wrap svg {
          color: var(--db-tx3);
        }
        .search-wrap input {
          background: none;
          border: none;
          outline: none;
          width: 100%;
          font-family: inherit;
          font-size: 0.9rem;
          color: var(--db-tx);
        }
        .filter-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .filter-tabs button {
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          padding: 8px 16px;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--db-tx2);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }
        .filter-tabs button:hover {
          background: var(--db-sf2);
          border-color: var(--db-gold);
        }
        .filter-tabs button.active {
          background: var(--db-gold);
          color: #ffffff;
          border-color: var(--db-gold);
          box-shadow: 0 4px 6px -1px rgba(225, 6, 19, 0.2);
        }

        .log-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 1.5rem;
        }
        .log-card {
          background: var(--db-sf) !important;
          border: 1px solid var(--db-bd) !important;
          border-radius: 20px !important;
          padding: 24px !important;
          min-height: 220px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.25s ease-in-out;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02) !important;
          position: relative;
        }
        .log-card:hover {
          border-color: var(--db-gold) !important;
          box-shadow: 0 12px 30px rgba(225, 6, 19, 0.06), 0 4px 12px rgba(225, 6, 19, 0.03) !important;
          transform: translateY(-2px);
        }
        .log-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .log-card-icon-wrap {
          height: 38px;
          width: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--db-bd);
        }
        .log-card-badge-new {
          background: var(--db-gold);
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }
        .log-card-badge-warn {
          color: var(--db-rd);
          font-size: 1rem;
          line-height: 1;
        }
        .log-card-badge-dot {
          color: var(--db-tx3);
          font-size: 0.8rem;
          opacity: 0.5;
        }
        .log-card-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .log-card-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: var(--db-tx);
          margin: 0;
        }
        .log-card-body-text {
          font-size: 0.85rem;
          color: var(--db-tx2);
          margin: 0;
          line-height: 1.5;
          font-style: italic;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .log-card-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 20px;
          font-size: 0.75rem;
          color: var(--db-tx3);
          flex-wrap: wrap;
        }
        .log-card-meta-item {
          display: flex;
          align-items: center;
        }
        .log-card-meta-item span {
          font-weight: 500;
        }
        .log-card-meta-item.ip span {
          font-family: monospace;
          background: var(--db-sf2);
          padding: 1px 6px;
          border-radius: 4px;
          color: var(--db-tx2);
        }
        .log-card-meta-sep {
          opacity: 0.5;
        }

        .log-skel {
          height: 220px;
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 20px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @media(max-width: 1024px) {
          .log-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media(max-width: 768px) {
          .rp-stats-row { flex-direction: column; gap: 0.75rem; }
          .log-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
