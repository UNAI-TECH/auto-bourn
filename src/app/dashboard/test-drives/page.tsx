'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Car, User, Calendar, Mail, Phone, 
  Clock, FileText, CheckCircle2, XCircle, AlertCircle, 
  RefreshCw, CheckCircle, HelpCircle, ShieldAlert, Award
} from 'lucide-react';

interface TestDriveRequest {
  id: string;
  lead_id: string;
  car_id: string | null;
  car_name: string;
  scheduled_at: string;
  location: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  created_at: string;
  lead: {
    customer_name: string;
    phone: string;
    email: string | null;
    lead_status: string;
  } | null;
  employee: {
    name: string;
  } | null;
  employee_id: string | null;
}

interface Employee {
  id: string;
  name: string;
}

export default function AdminTestDrivesPage() {
  const [requests, setRequests] = useState<TestDriveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const supabase = createClient();

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/test-drives');
      if (!res.ok) throw new Error('Failed to fetch test drives');
      const data = await res.json();
      setRequests(data.testDrives || []);

      // Fetch employees to allow assignment
      const { data: emps } = await supabase
        .from('employees')
        .select('id, name')
        .eq('status', 'active');
      setEmployees(emps || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading test drives', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Get current logged-in employee ID (Admin)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('employees')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()
          .then(({ data }) => {
            if (data) setCurrentAdminId(data.id);
          });
      }
    });
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/test-drives', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      showToast(`Status updated to ${status}`);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignEmployee = async (id: string, employeeId: string | null) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/test-drives', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, employeeId: employeeId || null }),
      });
      if (!res.ok) throw new Error('Failed to assign employee');
      showToast(employeeId ? 'Employee assigned' : 'Employee unassigned');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to assign employee', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = requests.filter((req) => {
    const custName = req.lead?.customer_name || '';
    const phone = req.lead?.phone || '';
    const email = req.lead?.email || '';
    const car = req.car_name || '';
    const empName = req.employee?.name || '';

    const matchSearch =
      custName.toLowerCase().includes(search.toLowerCase()) ||
      phone.includes(search) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      car.toLowerCase().includes(search.toLowerCase()) ||
      empName.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'all' || req.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.2)', label: 'Completed' };
      case 'cancelled':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.2)', label: 'Cancelled' };
      case 'no_show':
        return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)', label: 'No Show' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)', label: 'Scheduled' };
    }
  };

  // Stats calculation
  const totalCount = requests.length;
  const scheduledCount = requests.filter(r => r.status === 'scheduled').length;
  const completedCount = requests.filter(r => r.status === 'completed').length;
  const cancelledCount = requests.filter(r => r.status === 'cancelled').length;
  const noShowCount = requests.filter(r => r.status === 'no_show').length;

  return (
    <div className="db-page">
      <div className="db-page-header">
        <div>
          <h1 className="db-page-title">Test Drive Bookings</h1>
          <p className="db-page-sub">Monitor, assign, and track vehicle test drive requests from customers</p>
        </div>
        <button className="refresh-btn" onClick={loadData} disabled={loading} title="Reload bookings">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Reload
        </button>
      </div>

      {/* Stats Counter Row */}
      <div className="stats-row">
        <div className="stat-card" onClick={() => setStatusFilter('all')} style={{ cursor: 'pointer', borderLeft: '4px solid var(--db-gold)' }}>
          <div className="stat-icon gold"><Car size={20} /></div>
          <div>
            <span className="stat-val">{totalCount}</span>
            <span className="stat-lbl">Total Requests</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => setStatusFilter('scheduled')} style={{ cursor: 'pointer', borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-icon blue"><Clock size={20} /></div>
          <div>
            <span className="stat-val">{scheduledCount}</span>
            <span className="stat-lbl">Scheduled</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => setStatusFilter('completed')} style={{ cursor: 'pointer', borderLeft: '4px solid #22c55e' }}>
          <div className="stat-icon green"><CheckCircle size={20} /></div>
          <div>
            <span className="stat-val">{completedCount}</span>
            <span className="stat-lbl">Completed</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => setStatusFilter('no_show')} style={{ cursor: 'pointer', borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon yellow"><AlertCircle size={20} /></div>
          <div>
            <span className="stat-val">{noShowCount}</span>
            <span className="stat-lbl">No Show</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search by customer name, phone, car model, or consultant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="tabs-container">
          {[
            { id: 'all', label: 'All Bookings' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'completed', label: 'Completed' },
            { id: 'no_show', label: 'No Show' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map(tab => (
            <button 
              key={tab.id} 
              className={`tab-btn ${statusFilter === tab.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="bookings-grid-container">
        {loading ? (
          <div className="skeleton-grid">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <HelpCircle size={48} />
            <h3>No Test Drive Requests</h3>
            <p>We couldn't find any test drive requests matching the filters.</p>
          </div>
        ) : (
          <div className="bookings-list">
            {filtered.map((req, i) => {
              const meta = getStatusMeta(req.status);
              const initials = (req.lead?.customer_name || 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              
              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.2) }}
                  className="booking-row-card"
                  style={{ borderLeft: `8px solid ${meta.color}` }}
                >
                  {/* Left Column: Customer Info */}
                  <div className="col-customer">
                    <div className="customer-avatar" style={{ background: meta.bg, color: meta.color }}>
                      {initials}
                    </div>
                    <div className="customer-details">
                      <h4>{req.lead?.customer_name || 'Anonymous User'}</h4>
                      <div className="contact-links">
                        <a href={`tel:${req.lead?.phone}`} className="contact-link phone">
                          <Phone size={12} /> {req.lead?.phone || 'No phone'}
                        </a>
                        {req.lead?.email && (
                          <a href={`mailto:${req.lead.email}`} className="contact-link email">
                            <Mail size={12} /> {req.lead.email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Vehicle & Time */}
                  <div className="col-vehicle">
                    <div className="vehicle-badge">
                      <Car size={14} />
                      <span>{req.car_name}</span>
                    </div>
                    <div className="date-badge">
                      <Calendar size={13} />
                      <span>{new Date(req.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  </div>

                  {/* Consultant assignment */}
                  <div className="col-consultant">
                    <label>Assigned Consultant</label>
                    <div className="select-container">
                      <User size={13} />
                      <select
                        value={req.employee_id || ''}
                        onChange={(e) => handleAssignEmployee(req.id, e.target.value || null)}
                        disabled={updatingId === req.id}
                        className="consultant-select"
                      >
                        <option value="">Unassigned</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Right Column: Status & Controls */}
                  <div className="col-status-actions">
                    <span className="status-pill" style={{ backgroundColor: meta.bg, color: meta.color, borderColor: meta.border }}>
                      {meta.label}
                    </span>

                    <div className="action-button-group">
                      <button
                        disabled={updatingId === req.id || req.status === 'completed'}
                        onClick={() => handleUpdateStatus(req.id, 'completed')}
                        title="Mark Complete"
                        className="act-btn btn-done"
                      >
                        <CheckCircle2 size={15} />
                        <span>Complete</span>
                      </button>
                      
                      <button
                        disabled={updatingId === req.id || req.status === 'no_show'}
                        onClick={() => handleUpdateStatus(req.id, 'no_show')}
                        title="Mark No Show"
                        className="act-btn btn-noshow"
                      >
                        <AlertCircle size={15} />
                        <span>No Show</span>
                      </button>
                      
                      <button
                        disabled={updatingId === req.id || req.status === 'cancelled'}
                        onClick={() => handleUpdateStatus(req.id, 'cancelled')}
                        title="Cancel Drive"
                        className="act-btn btn-cancel"
                      >
                        <XCircle size={15} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`toast-alert ${toast.type}`}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0.625rem 1rem;
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 10px;
          color: var(--db-tx);
          font-weight: 600;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .refresh-btn:hover:not(:disabled) {
          border-color: var(--db-gold);
          color: var(--db-gold);
          background: var(--db-gd);
        }
        .refresh-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .refresh-btn svg.spin {
          animation: spin-anim 1s linear infinite;
        }
        @keyframes spin-anim {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .stats-row .stat-card {
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 16px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.01);
        }
        .stats-row .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.04);
        }
        .stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-icon.gold { background: var(--db-gd); color: var(--db-gold); }
        .stat-icon.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .stat-icon.green { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
        .stat-icon.yellow { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

        .stat-val {
          display: block;
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--db-tx);
          line-height: 1.1;
          font-family: 'Outfit', sans-serif;
        }
        .stat-lbl {
          display: block;
          font-size: 0.75rem;
          color: var(--db-tx3);
          font-weight: 600;
          margin-top: 2px;
        }

        .filters-bar {
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 16px;
          padding: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--db-sf2);
          border: 1px solid var(--db-bd);
          border-radius: 12px;
          padding: 8px 14px;
          flex: 1;
          min-width: 280px;
        }
        .search-box svg { color: var(--db-tx3); }
        .search-box input {
          background: none;
          border: none;
          outline: none;
          width: 100%;
          color: var(--db-tx);
          font-size: 0.875rem;
          font-family: inherit;
        }
        .search-box input::placeholder { color: var(--db-tx3); }

        .tabs-container {
          display: flex;
          gap: 6px;
          background: var(--db-sf2);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid var(--db-bd);
        }
        .tab-btn {
          background: none;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--db-tx2);
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .tab-btn:hover {
          color: var(--db-tx);
        }
        .tab-btn.active {
          background: var(--db-sf);
          color: var(--db-gold);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
        }

        .bookings-grid-container {
          width: 100%;
        }
        .skeleton-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .skeleton-card {
          height: 100px;
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 16px;
          animation: pulse 1.5s infinite;
        }
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 16px;
          color: var(--db-tx3);
        }
        .empty-state h3 {
          margin: 1rem 0 0.25rem;
          color: var(--db-tx2);
          font-size: 1.1rem;
        }
        .empty-state p { font-size: 0.875rem; margin: 0; }

        .bookings-list {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }
        .booking-row-card {
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          display: grid;
          grid-template-columns: 1.2fr 1fr 1fr 1.2fr;
          gap: 1.5rem;
          align-items: center;
          transition: all 0.2s ease-in-out;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01);
        }
        .booking-row-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.04);
          border-color: var(--db-gold) !important;
        }

        .col-customer {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .customer-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.95rem;
          flex-shrink: 0;
          font-family: 'Outfit', sans-serif;
        }
        .customer-details h4 {
          margin: 0 0 4px 0;
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--db-tx);
        }
        .contact-links {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .contact-link {
          font-size: 0.78rem;
          color: var(--db-tx2);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: color 0.15s;
        }
        .contact-link:hover {
          color: var(--db-gold);
        }
        .contact-link svg {
          color: var(--db-tx3);
        }

        .col-vehicle {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .vehicle-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--db-tx);
          font-weight: 700;
          font-size: 0.9rem;
        }
        .vehicle-badge svg { color: var(--db-gold); }
        .date-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--db-tx2);
          font-size: 0.8rem;
        }
        .date-badge svg { color: var(--db-tx3); }

        .col-consultant {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .col-consultant label {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--db-tx3);
          font-weight: 700;
        }
        .select-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        .select-container svg {
          position: absolute;
          left: 10px;
          color: var(--db-tx3);
          pointer-events: none;
        }
        .consultant-select {
          width: 100%;
          background: var(--db-sf2);
          border: 1px solid var(--db-bd);
          border-radius: 8px;
          padding: 6px 10px 6px 28px;
          color: var(--db-tx);
          font-size: 0.8125rem;
          font-weight: 600;
          font-family: inherit;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s;
          appearance: none;
        }
        .consultant-select:hover {
          border-color: var(--db-gold);
        }

        .col-status-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 10px;
        }
        .status-pill {
          font-size: 0.725rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid transparent;
        }
        .action-button-group {
          display: flex;
          gap: 4px;
        }
        .act-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: var(--db-sf2);
          border: 1px solid var(--db-bd);
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 0.725rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }
        .act-btn svg { transition: transform 0.2s; }
        .act-btn:hover svg { transform: scale(1.1); }
        .act-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .act-btn.btn-done:hover:not(:disabled) { background: rgba(34, 197, 94, 0.1); border-color: #22c55e; color: #22c55e; }
        .act-btn.btn-noshow:hover:not(:disabled) { background: rgba(245, 158, 11, 0.1); border-color: #f59e0b; color: #f59e0b; }
        .act-btn.btn-cancel:hover:not(:disabled) { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; color: #ef4444; }

        .toast-alert {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          z-index: 200;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }
        .toast-alert.success { background: #065f46; color: #a7f3d0; border: 1px solid rgba(52, 211, 153, 0.2); }
        .toast-alert.error { background: #7f1d1d; color: #fecaca; border: 1px solid rgba(248, 113, 113, 0.2); }

        @media (max-width: 1024px) {
          .stats-row { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 900px) {
          .booking-row-card {
            grid-template-columns: 1fr 1fr !important;
            gap: 1.25rem !important;
          }
          .col-consultant, .col-status-actions {
            align-items: flex-start !important;
          }
          .col-status-actions {
            grid-column: span 2;
            flex-direction: row-reverse !important;
            justify-content: space-between;
            align-items: center !important;
            width: 100%;
            border-top: 1px dashed var(--db-bd);
            padding-top: 10px;
          }
        }
        @media (max-width: 600px) {
          .stats-row { grid-template-columns: 1fr; }
          .booking-row-card {
            grid-template-columns: 1fr !important;
          }
          .col-status-actions {
            grid-column: span 1;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }
          .action-button-group {
            width: 100%;
            justify-content: space-between;
          }
          .act-btn { flex: 1; justify-content: center; }
          .filters-bar { flex-direction: column; align-items: stretch; }
          .tabs-container { overflow-x: auto; }
        }
      `}</style>
    </div>
  );
}
