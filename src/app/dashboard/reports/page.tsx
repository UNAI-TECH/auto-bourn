'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Check, X, FileText, Search, Calendar, BarChart3, CheckCircle, Clock, ArrowUpRight } from 'lucide-react';
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
  employees: { name: string; employee_id: string; avatar_url: string | null };
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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tempDate, setTempDate] = useState('');

  const fetchReports = useCallback(async () => {
    let query = supabase
      .from('daily_reports')
      .select('*, employees(name, employee_id, avatar_url)')
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
      // Create notification for employee
      await supabase.from('notifications').insert({
        recipient_role: 'employee',
        recipient_employee_id: report.employee_id,
        type: 'report_reviewed',
        title: '📋 Daily Report Reviewed',
        message: `Admin reviewed your daily report for ${report.report_date}.${adminNotes.trim() ? ` Notes: ${adminNotes.trim()}` : ''}`,
        metadata: { report_date: report.report_date, report_id: report.id, notes: adminNotes.trim() || null }
      });

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
          <div className="rp-stat-icon green"><CheckCircle size={20} /></div>
          <div>
            <span className="rp-stat-val">{todayReports.length}</span>
            <span className="rp-stat-lbl">Submitted Today</span>
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
          <div className="rp-stat-icon"><FileText size={20} /></div>
          <div>
            <span className="rp-stat-val">{reports.length}</span>
            <span className="rp-stat-lbl">Total Reports</span>
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
        <button 
          onClick={() => { setTempDate(dateFilter || todayStr); setIsCalendarOpen(true); }} 
          className={`rp-date-btn ${dateFilter ? 'active' : ''}`}
        >
          <Calendar size={16} />
          <span>{dateFilter ? new Date(dateFilter).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Filter by Date'}</span>
        </button>
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
              <div className="rp-report-top" onClick={() => { setSelectedReport(report); setAdminNotes(report.admin_notes || ''); }}>
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
                  <div className="rp-view-btn-pill">
                    <span>View Report</span>
                    <ArrowUpRight size={14} />
                  </div>
                </div>
              </div>
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

      {/* Calendar Filter Modal */}
      <AnimatePresence>
        {isCalendarOpen && (
          <div className="calendar-modal-overlay" onClick={() => setIsCalendarOpen(false)}>
            <motion.div 
              className="calendar-modal-card" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="calendar-modal-header">
                <h3>Select Report Date</h3>
                <button className="close-btn" onClick={() => setIsCalendarOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="calendar-modal-body">
                <p className="modal-desc">Choose a specific date to filter the employee daily reports.</p>
                <div className="date-input-wrapper">
                  <Calendar size={20} className="input-icon" />
                  <input
                    type="date"
                    value={tempDate}
                    onChange={e => setTempDate(e.target.value)}
                    className="modal-date-input"
                    max={todayStr}
                  />
                </div>
              </div>
              <div className="calendar-modal-footer">
                {dateFilter && (
                  <button 
                    className="btn-clear" 
                    onClick={() => {
                      setDateFilter('');
                      setIsCalendarOpen(false);
                    }}
                  >
                    Clear Filter
                  </button>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
                  <button className="btn-cancel" onClick={() => setIsCalendarOpen(false)}>Cancel</button>
                  <button 
                    className="btn-apply" 
                    onClick={() => {
                      setDateFilter(tempDate);
                      setIsCalendarOpen(false);
                    }}
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Daily Report Details Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="report-modal-overlay" onClick={() => setSelectedReport(null)}>
            <motion.div 
              className="report-modal-card" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Left Column: Employee Info & Photo */}
              <div className="report-modal-left">
                <div className="modal-avatar-container">
                  <img 
                    src={selectedReport.employees?.avatar_url || '/DEFAULT IMAGE.PNG'} 
                    alt={selectedReport.employees?.name}
                    className="modal-emp-avatar-img"
                  />
                </div>
                <div className="modal-emp-details">
                  <h4>{selectedReport.employees?.name}</h4>
                  <span className="emp-badge">{selectedReport.employees?.employee_id}</span>
                </div>
                
                <div className="modal-report-stats">
                  <div className="stats-header">Report Overview</div>
                  <div className="stats-item">
                    <span className="stats-lbl">Report Date</span>
                    <span className="stats-val">
                      {new Date(selectedReport.report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-lbl">Submitted</span>
                    <span className="stats-val">{timeAgo(selectedReport.submitted_at)}</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-lbl">Uploads</span>
                    <span className="stats-val badge-blue">{selectedReport.uploads_count} vehicles</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-lbl">Sales</span>
                    <span className="stats-val badge-green">{selectedReport.sold_count} sold</span>
                  </div>
                  <div className="stats-item">
                    <span className="stats-lbl">Status</span>
                    <span className={`stats-status-pill ${selectedReport.status}`}>
                      {selectedReport.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Submitted Report Content & Admin Actions */}
              <div className="report-modal-right">
                <div className="modal-right-header">
                  <h3>Daily Performance Review</h3>
                  <button className="close-btn" onClick={() => setSelectedReport(null)}>
                    <X size={20} />
                  </button>
                </div>

                <div className="modal-right-body">
                  <div className="modal-section">
                    <label>Employee Submission Summary</label>
                    <div className="submission-content-box">
                      <p>{selectedReport.summary}</p>
                    </div>
                  </div>

                  {selectedReport.admin_notes && selectedReport.status === 'reviewed' && (
                    <div className="modal-section">
                      <label style={{ color: '#E10613' }}>Admin Notes & Feedback</label>
                      <div className="admin-notes-content-box">
                        <p>{selectedReport.admin_notes}</p>
                      </div>
                    </div>
                  )}

                  {selectedReport.status === 'submitted' && (
                    <div className="modal-section admin-input-section">
                      <label>Add Review Note / Feedback</label>
                      <textarea
                        placeholder="Provide notes or feedback regarding employee's daily achievements..."
                        value={adminNotes}
                        onChange={e => setAdminNotes(e.target.value)}
                        rows={4}
                      />
                    </div>
                  )}
                </div>

                <div className="modal-right-footer">
                  <button className="btn-close-modal" onClick={() => setSelectedReport(null)}>
                    Close
                  </button>
                  {selectedReport.status === 'submitted' && (
                    <button 
                      className="btn-review-submit"
                      onClick={() => markAsReviewed(selectedReport)}
                      disabled={marking}
                    >
                      <Check size={16} />
                      {marking ? 'Submitting...' : 'Mark as Reviewed'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
.rp-admin-page { width: 100%; }
.rp-view-btn-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--db-gd);
  color: var(--db-gold);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  transition: all 0.2s;
  margin-left: auto;
}
.rp-report-top:hover .rp-view-btn-pill {
  background: var(--db-gold);
  color: #fff;
}
.report-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}
.report-modal-card {
  background: var(--db-sf, #ffffff);
  border: 1px solid var(--db-bd, rgba(0, 0, 0, 0.1));
  border-radius: 24px;
  width: 100%;
  max-width: 820px;
  display: flex;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  min-height: 500px;
}
.report-modal-left {
  width: 280px;
  background: var(--db-sf2, #f5f5f5);
  border-right: 1px solid var(--db-bd);
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex-shrink: 0;
}
.modal-avatar-container {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--db-sf);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.25rem;
  position: relative;
  background: var(--db-sf);
}
.modal-emp-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.modal-emp-details h4 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0 0 0.35rem 0;
  color: var(--db-tx);
}
.modal-emp-details .emp-badge {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--db-tx2);
  background: rgba(0, 0, 0, 0.05);
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
}
.modal-report-stats {
  width: 100%;
  margin-top: 2rem;
  border-top: 1px dashed var(--db-bd);
  padding-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.stats-header {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--db-tx3);
  text-align: left;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}
.stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
}
.stats-lbl {
  color: var(--db-tx3);
  font-weight: 500;
}
.stats-val {
  color: var(--db-tx);
  font-weight: 600;
}
.stats-val.badge-blue {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
  padding: 1px 6px;
  border-radius: 4px;
}
.stats-val.badge-green {
  color: #16a34a;
  background: rgba(22, 163, 74, 0.08);
  padding: 1px 6px;
  border-radius: 4px;
}
.stats-status-pill {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
}
.stats-status-pill.submitted {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.2);
}
.stats-status-pill.reviewed {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.2);
}
.report-modal-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2rem 2.25rem;
  overflow-y: auto;
}
.modal-right-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.modal-right-header h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0;
  color: var(--db-tx);
  letter-spacing: -0.01em;
}
.modal-right-header .close-btn {
  background: none;
  border: none;
  color: var(--db-tx3);
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.modal-right-header .close-btn:hover {
  background: var(--db-sf2);
  color: var(--db-tx);
}
.modal-right-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.modal-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.modal-section label {
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--db-tx3);
  display: block;
}
.submission-content-box, .admin-notes-content-box {
  background: var(--db-sf2);
  border: 1px solid var(--db-bd);
  border-radius: 14px;
  padding: 1.1rem 1.25rem;
}
.submission-content-box p, .admin-notes-content-box p {
  font-size: 0.9rem;
  color: var(--db-tx);
  line-height: 1.6;
  margin: 0;
}
.admin-notes-content-box {
  border-color: rgba(225, 6, 19, 0.15);
  background: rgba(225, 6, 19, 0.02);
}
.admin-notes-content-box p {
  color: var(--db-tx);
}
.admin-input-section textarea {
  width: 100%;
  padding: 1rem;
  background: var(--db-sf2);
  border: 1.5px solid var(--db-bd);
  border-radius: 14px;
  color: var(--db-tx);
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.admin-input-section textarea:focus {
  border-color: #E10613;
}
.modal-right-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--db-bd);
}
.btn-close-modal {
  background: none;
  border: 1px solid var(--db-bd);
  color: var(--db-tx2);
  font-family: inherit;
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0.65rem 1.5rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-close-modal:hover {
  background: var(--db-sf2);
}
.btn-review-submit {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #E10613;
  color: #fff;
  border: none;
  padding: 0.65rem 1.5rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}
.btn-review-submit:hover:not(:disabled) {
  background: #c70511;
}
.btn-review-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (max-width: 768px) {
  .report-modal-card {
    flex-direction: column;
    height: 90vh;
  }
  .report-modal-left {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--db-bd);
    padding: 1.5rem;
  }
  .report-modal-right {
    padding: 1.5rem;
  }
}
.db-page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--db-bd, rgba(255, 255, 255, 0.08));
}
.db-page-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--db-tx, #f4f4f5);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}
.db-page-sub {
  font-size: 0.875rem;
  color: var(--db-tx3, #71717a);
  margin: 0;
  line-height: 1.5;
}
.calendar-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.calendar-modal-card {
  background: var(--db-sf, #ffffff);
  border: 1px solid var(--db-bd, rgba(0, 0, 0, 0.1));
  border-radius: 20px;
  width: 90%;
  max-width: 440px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}
.calendar-modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--db-bd);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.calendar-modal-header h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
  color: var(--db-tx);
}
.calendar-modal-header .close-btn {
  background: none;
  border: none;
  color: var(--db-tx3);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: background 0.2s;
}
.calendar-modal-header .close-btn:hover {
  background: var(--db-sf2);
}
.calendar-modal-body {
  padding: 1.5rem;
}
.modal-desc {
  font-size: 0.875rem;
  color: var(--db-tx2);
  margin: 0 0 1.25rem 0;
  line-height: 1.5;
}
.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.date-input-wrapper .input-icon {
  position: absolute;
  left: 1rem;
  color: var(--db-tx3);
  pointer-events: none;
}
.modal-date-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.75rem;
  background: var(--db-sf2);
  border: 1.5px solid var(--db-bd);
  border-radius: 12px;
  color: var(--db-tx);
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}
.modal-date-input:focus {
  border-color: #E10613;
}
.calendar-modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--db-bd);
  background: var(--db-sf2);
  display: flex;
  align-items: center;
}
.btn-clear {
  background: none;
  border: 1px solid var(--db-bd);
  color: #ef4444;
  font-family: inherit;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-clear:hover {
  background: rgba(239, 68, 68, 0.05);
  border-color: #ef4444;
}
.btn-cancel {
  background: none;
  border: 1px solid var(--db-bd);
  color: var(--db-tx2);
  font-family: inherit;
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel:hover {
  background: var(--db-sf);
}
.btn-apply {
  background: #E10613;
  border: none;
  color: #fff;
  font-family: inherit;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-apply:hover {
  background: #c70511;
}
.rp-date-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  border-radius: 12px;
  color: var(--db-tx);
  font-size: 0.875rem;
  font-family: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.rp-date-btn:hover {
  border-color: #E10613;
  color: #E10613;
}
.rp-date-btn.active {
  background: rgba(225, 6, 19, 0.05);
  border-color: #E10613;
  color: #E10613;
}
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
