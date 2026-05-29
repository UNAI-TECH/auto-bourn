'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Check, X, ChevronDown, ChevronUp, FileText, Search, Calendar, BarChart3, CheckCircle, Clock } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

interface DailyReport {
  id: string;
  employee_id: string;
  report_date: string;
  summary: string;
  uploads_count: number;
  sold_count: number;
  status: 'submitted' | 'reviewed';
  admin_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  employees: { name: string; employee_id: string };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [marking, setMarking] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'reviewed'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const supabase = createClient();

  const fetchReports = useCallback(async () => {
    let query = supabase
      .from('daily_reports')
      .select('*, employees(name, employee_id)')
      .order('report_date', { ascending: false })
      .order('submitted_at', { ascending: false });

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }
    if (dateFilter) {
      query = query.eq('report_date', dateFilter);
    }

    const { data } = await query;
    setReports((data as DailyReport[]) || []);
    setLoading(false);
  }, [filterStatus, dateFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const markAsReviewed = async (report: DailyReport) => {
    setMarking(true);
    const { error } = await supabase
      .from('daily_reports')
      .update({
        status: 'reviewed',
        admin_notes: adminNotes.trim() || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', report.id);

    if (!error) {
      setToast('Report marked as reviewed');
      setSelectedReport(null);
      setAdminNotes('');
      fetchReports();
      setTimeout(() => setToast(''), 3000);
    }
    setMarking(false);
  };

  const filteredReports = reports.filter(r => {
    if (!search) return true;
    return (
      r.employees?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.employees?.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
      r.summary?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayReports = reports.filter(r => r.report_date === todayStr);
  const pendingCount = reports.filter(r => r.status === 'submitted').length;

  return (
    <div className="rp-admin-page">
      {/* Page Header */}
      <div className="db-page-header">
        <div>
          <h1 className="db-page-title">Employee Daily Reports</h1>
          <p className="db-page-sub">View, review and add notes to employee-submitted reports</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="rp-stats-row">
        <div className="rp-stat-card">
          <div className="rp-stat-icon"><FileText size={20} /></div>
          <div>
            <span className="rp-stat-val">{reports.length}</span>
            <span className="rp-stat-lbl">Total Reports</span>
          </div>
        </div>
        <div className="rp-stat-card">
          <div className="rp-stat-icon orange"><Clock size={20} /></div>
          <div>
            <span className="rp-stat-val">{pendingCount}</span>
            <span className="rp-stat-lbl">Pending Review</span>
          </div>
        </div>
        <div className="rp-stat-card">
          <div className="rp-stat-icon green"><CheckCircle size={20} /></div>
          <div>
            <span className="rp-stat-val">{todayReports.length}</span>
            <span className="rp-stat-lbl">Submitted Today</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rp-filters">
        <div className="db-search-wrap" style={{ flex: 1 }}>
          <Search size={16} />
          <input
            placeholder="Search by employee name or report content..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="rp-filter-tabs">
          {(['all', 'submitted', 'reviewed'] as const).map(s => (
            <button
              key={s}
              className={filterStatus === s ? 'active' : ''}
              onClick={() => setFilterStatus(s)}
            >
              {s === 'all' ? 'All' : s === 'submitted' ? 'Pending' : 'Reviewed'}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="rp-date-input"
          max={todayStr}
        />
        {dateFilter && (
          <button className="rp-clear-date" onClick={() => setDateFilter('')}>
            <X size={14} /> Clear Date
          </button>
        )}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="rp-loading">Loading reports...</div>
      ) : filteredReports.length === 0 ? (
        <div className="rp-empty">
          <ClipboardList size={40} />
          <p>No reports found matching your filters.</p>
        </div>
      ) : (
        <div className="rp-list">
          {filteredReports.map(report => (
            <motion.div
              key={report.id}
              className={`rp-report-card ${report.status === 'reviewed' ? 'reviewed' : ''}`}
              layout
            >
              <div className="rp-report-top" onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}>
                <div className="rp-report-left">
                  <div className={`rp-status-dot ${report.status}`} />
                  <div>
                    <strong className="rp-emp-name">{report.employees?.name}</strong>
                    <span className="rp-emp-id">{report.employees?.employee_id}</span>
                  </div>
                </div>
                <div className="rp-report-meta">
                  <span className="rp-date-pill">
                    <Calendar size={12} />
                    {new Date(report.report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <div className="rp-metrics">
                    <span className="rp-metric-badge upload">{report.uploads_count} uploads</span>
                    <span className="rp-metric-badge sold">{report.sold_count} sold</span>
                  </div>
                  <span className={`rp-status-badge ${report.status}`}>
                    {report.status === 'reviewed' ? <><CheckCircle size={12} /> Reviewed</> : <><Clock size={12} /> Pending</>}
                  </span>
                  <span className="rp-submitted-ago">{timeAgo(report.submitted_at)}</span>
                  {expandedId === report.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              <AnimatePresence>
                {expandedId === report.id && (
                  <motion.div
                    className="rp-report-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="rp-summary-box">
                      <label>Employee Report</label>
                      <p>{report.summary}</p>
                    </div>

                    {report.admin_notes && (
                      <div className="rp-admin-notes-view">
                        <label>Admin Notes</label>
                        <p>{report.admin_notes}</p>
                      </div>
                    )}

                    {report.status === 'submitted' && (
                      <div className="rp-review-section">
                        <label>Add Review Note (optional)</label>
                        <textarea
                          placeholder="Add feedback or notes for this employee..."
                          value={selectedReport?.id === report.id ? adminNotes : ''}
                          onFocus={() => setSelectedReport(report)}
                          onChange={e => { setSelectedReport(report); setAdminNotes(e.target.value); }}
                          rows={3}
                        />
                        <button
                          className="rp-mark-btn"
                          onClick={() => markAsReviewed(report)}
                          disabled={marking && selectedReport?.id === report.id}
                        >
                          <Check size={16} />
                          {marking && selectedReport?.id === report.id ? 'Marking...' : 'Mark as Reviewed'}
                        </button>
                      </div>
                    )}

                    {report.status === 'reviewed' && report.reviewed_at && (
                      <p className="rp-reviewed-at">
                        ✓ Reviewed {timeAgo(report.reviewed_at)}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className="db-toast success" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}>
            <Check size={16} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
.rp-admin-page { width: 100%; }
.rp-stats-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.rp-stat-card {
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  box-shadow: var(--card-shadow);
}
.rp-stat-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: rgba(225,6,19,0.08);
  display: flex; align-items: center; justify-content: center;
  color: #E10613;
}
.rp-stat-icon.orange { background: rgba(245,158,11,0.1); color: #f59e0b; }
.rp-stat-icon.green { background: rgba(34,197,94,0.1); color: #22c55e; }
.rp-stat-val {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--db-tx);
  line-height: 1.1;
}
.rp-stat-lbl {
  display: block;
  font-size: .75rem;
  color: var(--db-tx3);
  font-weight: 600;
}
.rp-filters {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}
.db-search-wrap {
  display: flex;
  align-items: center;
  gap: .5rem;
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  border-radius: 12px;
  padding: .6rem 1rem;
  min-width: 280px;
}
.db-search-wrap svg { color: var(--db-tx3); flex-shrink: 0; }
.db-search-wrap input {
  background: none;
  border: none;
  outline: none;
  color: var(--db-tx);
  font-size: .875rem;
  font-family: inherit;
  width: 100%;
}
.rp-filter-tabs {
  display: flex;
  gap: 3px;
  background: var(--db-sf2);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--db-bd);
}
.rp-filter-tabs button {
  background: none;
  border: none;
  padding: .4rem .875rem;
  border-radius: 7px;
  font-size: .8125rem;
  font-weight: 600;
  color: var(--db-tx2);
  cursor: pointer;
  font-family: inherit;
  transition: all .2s;
}
.rp-filter-tabs button.active { background: var(--db-sf); color: var(--db-tx); }
.rp-date-input {
  padding: .6rem 1rem;
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  border-radius: 12px;
  color: var(--db-tx);
  font-size: .875rem;
  font-family: inherit;
  outline: none;
}
.rp-clear-date {
  display: flex; align-items: center; gap: 4px;
  background: none;
  border: 1px solid var(--db-bd);
  border-radius: 10px;
  padding: .5rem .875rem;
  font-size: .8rem;
  color: var(--db-tx2);
  cursor: pointer;
  font-family: inherit;
  transition: all .2s;
}
.rp-clear-date:hover { border-color: #E10613; color: #E10613; }
.rp-loading { text-align: center; padding: 4rem 0; color: var(--db-tx3); }
.rp-empty {
  text-align: center;
  padding: 5rem 0;
  color: var(--db-tx3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.rp-list { display: flex; flex-direction: column; gap: .75rem; }
.rp-report-card {
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition: border-color .2s;
}
.rp-report-card.reviewed { opacity: .8; }
.rp-report-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.5rem;
  cursor: pointer;
  gap: 1rem;
}
.rp-report-top:hover { background: var(--db-gd); }
.rp-report-left { display: flex; align-items: center; gap: .875rem; }
.rp-status-dot {
  width: 9px; height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.rp-status-dot.submitted { background: #f59e0b; }
.rp-status-dot.reviewed { background: #22c55e; }
.rp-emp-name { display: block; font-size: .9375rem; font-weight: 700; color: var(--db-tx); }
.rp-emp-id { display: block; font-size: .75rem; color: var(--db-tx3); margin-top: 1px; }
.rp-report-meta {
  display: flex;
  align-items: center;
  gap: .75rem;
  flex-wrap: wrap;
}
.rp-date-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: .75rem;
  color: var(--db-tx2);
  font-weight: 600;
}
.rp-metrics { display: flex; gap: .4rem; }
.rp-metric-badge {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: .7rem;
  font-weight: 700;
}
.rp-metric-badge.upload { background: rgba(59,130,246,0.1); color: #3b82f6; }
.rp-metric-badge.sold { background: rgba(34,197,94,0.1); color: #22c55e; }
.rp-status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: .7rem;
  font-weight: 700;
}
.rp-status-badge.submitted { background: rgba(245,158,11,0.1); color: #f59e0b; }
.rp-status-badge.reviewed { background: rgba(34,197,94,0.1); color: #22c55e; }
.rp-submitted-ago { font-size: .7rem; color: var(--db-tx3); white-space: nowrap; }
.rp-report-body {
  padding: 1.25rem 1.5rem 1.5rem;
  border-top: 1px solid var(--db-bd);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.rp-summary-box, .rp-admin-notes-view {
  background: var(--db-sf2);
  border: 1px solid var(--db-bd);
  border-radius: 14px;
  padding: 1rem 1.25rem;
}
.rp-summary-box label, .rp-admin-notes-view label, .rp-review-section label {
  font-size: .7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--db-tx3);
  display: block;
  margin-bottom: .5rem;
}
.rp-admin-notes-view label { color: #E10613; }
.rp-summary-box p, .rp-admin-notes-view p {
  font-size: .875rem;
  color: var(--db-tx);
  margin: 0;
  line-height: 1.6;
}
.rp-review-section {
  display: flex;
  flex-direction: column;
  gap: .75rem;
}
.rp-review-section textarea {
  width: 100%;
  padding: .875rem 1rem;
  background: var(--db-sf2);
  border: 1.5px solid var(--db-bd);
  border-radius: 12px;
  color: var(--db-tx);
  font-size: .875rem;
  font-family: inherit;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color .2s;
}
.rp-review-section textarea:focus { border-color: #E10613; }
.rp-mark-btn {
  align-self: flex-end;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #E10613;
  color: #fff;
  border: none;
  padding: .7rem 1.5rem;
  border-radius: 10px;
  font-size: .875rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all .2s;
}
.rp-mark-btn:hover:not(:disabled) { background: #c70511; }
.rp-mark-btn:disabled { opacity: .5; cursor: not-allowed; }
.rp-reviewed-at {
  font-size: .8rem;
  color: #22c55e;
  font-weight: 600;
  text-align: right;
  margin: 0;
}
@media(max-width:768px) {
  .rp-stats-row { flex-direction: column; }
  .rp-report-top { flex-direction: column; align-items: flex-start; }
  .rp-report-meta { gap: .4rem; }
}
      `}</style>
    </div>
  );
}
