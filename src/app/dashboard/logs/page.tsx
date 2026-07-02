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

      {/* Tabular List Format for Active Audit Logs */}
      <div className="log-list-wrap">
        <table className="log-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Performer</th>
              <th>Details</th>
              <th>IP Address</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5}><div className="log-skel-line" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--db-tx3)' }}>
                  No matching activity logs found
                </td>
              </tr>
            ) : (
              filtered.map((log) => {
                const meta = getMeta(log.action);
                const Icon = meta.icon;
                const emp = log.employee as unknown as { name: string } | null;
                return (
                  <tr key={log.id}>
                    <td>
                      <div className="log-action-cell">
                        <div className="log-action-icon" style={{ backgroundColor: meta.bg, color: meta.color }}>
                          <Icon size={14} />
                        </div>
                        <span className="log-action-title">{meta.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className="log-performer">{emp?.name || 'System'}</span>
                    </td>
                    <td>
                      <span className="log-details" title={log.details || `${meta.title} completed.`}>
                        "{log.details || `${meta.title} completed.`}"
                      </span>
                    </td>
                    <td>
                      <span className="log-ip">{log.ip_address || '—'}</span>
                    </td>
                    <td>
                      <span className="log-time" title={new Date(log.created_at).toLocaleString()}>{timeAgo(log.created_at)}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
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

        .log-list-wrap {
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 14px;
          overflow-x: auto;
          margin-top: 1.5rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }
        .log-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
          text-align: left;
        }
        .log-table th {
          padding: 1rem;
          color: var(--db-tx3);
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--db-bd);
        }
        .log-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--db-bd);
          vertical-align: middle;
          color: var(--db-tx2);
        }
        .log-table tr:last-child td {
          border-bottom: 0;
        }
        .log-table tr:hover {
          background: var(--db-sf2);
        }
        .log-action-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .log-action-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .log-action-title {
          font-weight: 600;
          color: var(--db-tx);
        }
        .log-performer {
          font-weight: 500;
          color: var(--db-tx);
        }
        .log-details {
          font-size: 0.8125rem;
          color: var(--db-tx2);
          max-width: 380px;
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .log-ip {
          font-family: monospace;
          background: var(--db-sf2);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          color: var(--db-tx3);
        }
        .log-time {
          font-size: 0.8125rem;
          color: var(--db-tx3);
        }
        .log-skel-line {
          height: 20px;
          background: var(--db-sf2);
          border-radius: 4px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @media(max-width: 768px) {
          .db-page { padding: 0 !important; }
          .rp-stats-row { flex-direction: column; gap: 0.75rem; }
          .filter-tabs { gap: 6px; margin-bottom: 16px; }
          .filter-tabs button { padding: 6px 12px; font-size: 0.8rem; }
        }
      `}</style>
    </div>
  );
}
