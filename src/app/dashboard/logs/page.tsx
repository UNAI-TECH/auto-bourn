'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Search, LogIn, LogOut, Upload, Edit, Trash2, RefreshCw, UserPlus, UserMinus, Key, Filter } from 'lucide-react';
import { formatDateTime, timeAgo } from '@/lib/utils';
import type { ActivityLog } from '@/types/database';

const actionIcons: Record<string, typeof LogIn> = {
  login: LogIn, logout: LogOut, upload: Upload, edit: Edit, delete: Trash2,
  sold_status_change: RefreshCw, employee_added: UserPlus, employee_removed: UserMinus, password_reset: Key,
};

const actionColors: Record<string, string> = {
  login: '#22c55e', logout: '#6b7280', upload: '#3b82f6', edit: '#d4af37',
  delete: '#ef4444', sold_status_change: '#f59e0b', employee_added: '#06b6d4',
  employee_removed: '#ef4444', password_reset: '#a855f7',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*, employee:employees(name, employee_id)')
        .order('created_at', { ascending: false })
        .limit(200);
      setLogs((data || []) as ActivityLog[]);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = logs.filter(log => {
    const matchSearch = (log.details || '').toLowerCase().includes(search.toLowerCase()) ||
      ((log.employee as unknown as { name: string })?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === 'all' || log.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="db-page">
      <div className="db-page-header">
        <div><h1 className="db-page-title">Activity Logs</h1><p className="db-page-sub">System-wide activity tracking</p></div>
      </div>

      <div className="car-filters" style={{ marginBottom: '1.5rem' }}>
        <div className="db-search-inline"><Search size={16} /><input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="car-select-wrap"><Filter size={14} />
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="all">All Actions</option>
            {['login','logout','upload','edit','delete','sold_status_change','employee_added','employee_removed','password_reset'].map(a => (
              <option key={a} value={a}>{a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="log-list">
        {loading ? Array(8).fill(0).map((_, i) => <div key={i} className="log-skel" />) :
        filtered.length === 0 ? <p className="db-empty-full">No logs found</p> :
        filtered.map((log, i) => {
          const Icon = actionIcons[log.action] || Edit;
          const color = actionColors[log.action] || '#d4af37';
          const emp = log.employee as unknown as { name: string; employee_id: string } | null;
          return (
            <motion.div key={log.id} className="log-item" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
              <div className="log-icon" style={{ background: `${color}15`, color }}><Icon size={16} /></div>
              <div className="log-body">
                <p className="log-detail">
                  <strong>{emp?.name || 'System'}</strong> {log.details || log.action.replace(/_/g, ' ')}
                </p>
                <div className="log-time">
                  <span>{formatDateTime(log.created_at)}</span>
                  <span>{timeAgo(log.created_at)}</span>
                  {log.ip_address && <span>IP: {log.ip_address}</span>}
                </div>
              </div>
              <span className="log-action-badge" style={{ background: `${color}15`, color }}>{log.action.replace(/_/g, ' ')}</span>
            </motion.div>
          );
        })}
      </div>

      <style jsx>{`
.log-list{display:flex;flex-direction:column;gap:4px}
.log-item{display:flex;align-items:center;gap:1rem;padding:.875rem 1.25rem;background:var(--db-sf);border:1px solid var(--db-bd);border-radius:12px;transition:all .2s}
.log-item:hover{border-color:var(--db-gold)}
.log-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.log-body{flex:1;min-width:0}
.log-detail{font-size:.875rem;color:var(--db-tx2);margin:0;line-height:1.5}
.log-detail strong{color:var(--db-tx);font-weight:600}
.log-time{display:flex;gap:.75rem;font-size:.6875rem;color:var(--db-tx3);margin-top:.25rem}
.log-action-badge{padding:.25rem .625rem;border-radius:6px;font-size:.6875rem;font-weight:600;text-transform:capitalize;white-space:nowrap;flex-shrink:0}
.log-skel{height:56px;background:var(--db-sf);border:1px solid var(--db-bd);border-radius:12px;animation:pulse 1.5s infinite}
@media(max-width:640px){.log-action-badge{display:none}}
      `}</style>
    </div>
  );
}
