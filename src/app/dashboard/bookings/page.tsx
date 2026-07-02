'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Car, User, Calendar, Mail, Phone, Clock, 
  FileText, CheckCircle2, XCircle, AlertCircle, Bookmark, 
  BookmarkCheck, RefreshCw, DollarSign, Wallet, HelpCircle,
  TrendingUp, CreditCard, Users2
} from 'lucide-react';
import type { Employee } from '@/types/database';

interface BookingRequest {
  id: string;
  lead_id: string;
  car_id: string | null;
  car_name: string;
  booking_amount: number | null;
  total_amount: number | null;
  payment_status: 'pending' | 'partial' | 'completed';
  delivery_status: 'pending' | 'processing' | 'completed' | 'cancelled';
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

export default function BookingsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const supabase = createClient();

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadRequests = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (!res.ok) throw new Error('Failed to fetch reservations');
      const data = await res.json();
      setRequests(data.bookings || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading reservations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('role', 'sales')
        .order('name');
      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRequests();
    loadEmployees();
  }, []);

  const handleUpdateStatus = async (id: string, deliveryStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, deliveryStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');

      let msg = '';
      if (deliveryStatus === 'processing') msg = 'Reservation accepted — Car status set to Booked.';
      else if (deliveryStatus === 'cancelled') msg = 'Reservation cancelled — Car released to Available.';
      else if (deliveryStatus === 'completed') msg = 'Reservation completed — Car marked Sold.';

      showToast(msg);
      loadRequests();
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
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, employeeId }),
      });
      if (!res.ok) throw new Error('Failed to assign consultant');
      showToast(employeeId ? 'Consultant assigned successfully' : 'Consultant unassigned');
      loadRequests();
    } catch (err) {
      console.error(err);
      showToast('Failed to assign consultant', 'error');
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

    const matchStatus = statusFilter === 'all' || req.delivery_status === statusFilter;

    return matchSearch && matchStatus;
  });

  const getStatusMeta = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.2)', label: 'Delivered (Sold)' };
      case 'cancelled':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.2)', label: 'Cancelled' };
      case 'processing':
        return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)', label: 'Booked (Active)' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)', label: 'Pending Request' };
    }
  };

  const getPaymentStatusMeta = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(34, 197, 94, 0.08)', color: '#22c55e', label: 'Paid' };
      case 'partial':
        return { bg: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', label: 'Partial' };
      default:
        return { bg: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', label: 'Unpaid' };
    }
  };

  const formatCurrency = (val: number | null) => {
    if (val === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Metrics counters
  const totalCount = requests.length;
  const activeCount = requests.filter(r => r.delivery_status === 'processing').length;
  const completedCount = requests.filter(r => r.delivery_status === 'completed').length;
  const unassignedCount = requests.filter(r => !r.employee_id).length;

  return (
    <div className="db-page">
      <div className="db-page-header">
        <div>
          <h1 className="db-page-title">Reservations</h1>
          <p className="db-page-sub">View and manage customer booking and vehicle reservation requests</p>
        </div>
        <button className="refresh-btn" onClick={loadRequests} disabled={loading} title="Reload reservations">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          Reload
        </button>
      </div>

      {/* Stats Counter Row */}
      <div className="stats-row">
        <div className="stat-card" onClick={() => setStatusFilter('all')} style={{ cursor: 'pointer', borderLeft: '4px solid var(--db-gold, #c5a880)' }}>
          <div className="stat-icon gold"><CreditCard size={20} /></div>
          <div>
            <span className="stat-val">{totalCount}</span>
            <span className="stat-lbl">All Requests</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => setStatusFilter('processing')} style={{ cursor: 'pointer', borderLeft: '4px solid #3b82f6' }}>
          <div className="stat-icon blue"><Clock size={20} /></div>
          <div>
            <span className="stat-val">{activeCount}</span>
            <span className="stat-lbl">Active Bookings</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => setStatusFilter('completed')} style={{ cursor: 'pointer', borderLeft: '4px solid #22c55e' }}>
          <div className="stat-icon green"><TrendingUp size={20} /></div>
          <div>
            <span className="stat-val">{completedCount}</span>
            <span className="stat-lbl">Delivered Sales</span>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon yellow"><Bookmark size={20} /></div>
          <div>
            <span className="stat-val">{unassignedCount}</span>
            <span className="stat-lbl">Unassigned Requests</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search by customer name, phone, or vehicle model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="tabs-container">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Pending' },
            { id: 'processing', label: 'Booked' },
            { id: 'completed', label: 'Delivered' },
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

      {/* Grid container */}
      <div className="bookings-grid-container">
        {loading ? (
          <div className="skeleton-grid">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={48} />
            <h3>No Reservations Found</h3>
            <p>No customer reservation requests match the current selection.</p>
          </div>
        ) : (
          <div className="bookings-list">
            {filtered.map((req, i) => {
              const meta = getStatusMeta(req.delivery_status);
              const payMeta = getPaymentStatusMeta(req.payment_status);
              const initials = (req.lead?.customer_name || 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.2) }}
                  className="booking-row-card emp-booking-card"
                  style={{ borderLeft: `8px solid ${meta.color}` }}
                >
                  {/* Left Column: Client Details */}
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

                  {/* Middle Column: Vehicle & Date */}
                  <div className="col-vehicle">
                    <div className="vehicle-badge">
                      <Car size={14} />
                      <span>{req.car_name}</span>
                    </div>
                    <div className="date-badge">
                      <Calendar size={13} />
                      <span>Requested: {new Date(req.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                    </div>
                  </div>

                  {/* Financial details */}
                  <div className="col-financials">
                    <div className="finance-row">
                      <Wallet size={12} className="f-icon token" />
                      <span className="lbl">Token:</span>
                      <strong className="val token-val">{formatCurrency(req.booking_amount)}</strong>
                    </div>
                    <div className="finance-row">
                      <DollarSign size={12} className="f-icon total" />
                      <span className="lbl">Price:</span>
                      <strong className="val">{formatCurrency(req.total_amount)}</strong>
                    </div>
                    <div className="payment-pill-container">
                      <span className="payment-pill" style={{ backgroundColor: payMeta.bg, color: payMeta.color }}>
                        {payMeta.label}
                      </span>
                    </div>
                  </div>

                  {/* Consultant assignment (Admin control) */}
                  <div className="col-consultant">
                    <label>Assigned Consultant</label>
                    <div className="select-container">
                      <Users2 size={13} />
                      <select
                        disabled={updatingId === req.id}
                        value={req.employee_id || ''}
                        onChange={(e) => handleAssignEmployee(req.id, e.target.value || null)}
                        className="consultant-select"
                      >
                        <option value="">Unassigned</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="col-status-actions flex-end-actions">
                    <span className="status-pill" style={{ backgroundColor: meta.bg, color: meta.color, borderColor: meta.border }}>
                      {meta.label}
                    </span>

                    <div className="action-button-group">
                      {req.delivery_status === 'pending' && (
                        <button
                          disabled={updatingId === req.id}
                          onClick={() => handleUpdateStatus(req.id, 'processing')}
                          className="act-btn btn-accept"
                        >
                          <BookmarkCheck size={13} />
                          <span>Accept Booking</span>
                        </button>
                      )}
                      
                      {req.delivery_status === 'processing' && (
                        <button
                          disabled={updatingId === req.id}
                          onClick={() => handleUpdateStatus(req.id, 'completed')}
                          className="act-btn btn-done"
                        >
                          <CheckCircle2 size={13} />
                          <span>Mark Delivered</span>
                        </button>
                      )}

                      {req.delivery_status !== 'completed' && req.delivery_status !== 'cancelled' && (
                        <button
                          disabled={updatingId === req.id}
                          onClick={() => handleUpdateStatus(req.id, 'cancelled')}
                          className="act-btn btn-cancel"
                        >
                          <XCircle size={13} />
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast Alert */}
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
          background: var(--db-sf, #ffffff);
          border: 1px solid var(--db-bd, rgba(0,0,0,0.08));
          border-radius: 10px;
          color: var(--db-tx, #000);
          font-weight: 600;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .refresh-btn:hover:not(:disabled) {
          border-color: var(--db-gold, #c5a880);
          color: var(--db-gold, #c5a880);
          background: var(--db-sf2, #f9f9f9);
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
          background: var(--db-sf, #ffffff);
          border: 1px solid var(--db-bd, rgba(0,0,0,0.08));
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
        .stat-icon.gold { background: rgba(197, 168, 128, 0.12); color: var(--db-gold, #c5a880); }
        .stat-icon.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .stat-icon.green { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
        .stat-icon.yellow { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

        .stat-val {
          display: block;
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--db-tx, #000);
          line-height: 1.1;
          font-family: 'Outfit', sans-serif;
        }
        .stat-lbl {
          display: block;
          font-size: 0.75rem;
          color: var(--db-tx3, #777);
          font-weight: 600;
          margin-top: 2px;
        }

        .filters-bar {
          background: var(--db-sf, #ffffff);
          border: 1px solid var(--db-bd, rgba(0,0,0,0.08));
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
          background: var(--db-sf2, #f9f9f9);
          border: 1px solid var(--db-bd, rgba(0,0,0,0.08));
          border-radius: 12px;
          padding: 8px 14px;
          flex: 1;
          min-width: 280px;
        }
        .search-box svg { color: var(--db-tx3, #777); }
        .search-box input {
          background: none;
          border: none;
          outline: none;
          width: 100%;
          color: var(--db-tx, #000);
          font-size: 0.875rem;
          font-family: inherit;
        }
        .search-box input::placeholder { color: var(--db-tx3, #777); }

        .tabs-container {
          display: flex;
          gap: 6px;
          background: var(--db-sf2, #f9f9f9);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid var(--db-bd, rgba(0,0,0,0.08));
        }
        .tab-btn {
          background: none;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--db-tx2, #555);
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .tab-btn:hover {
          color: var(--db-tx, #000);
        }
        .tab-btn.active {
          background: var(--db-sf, #ffffff);
          color: var(--db-gold, #c5a880);
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
          background: var(--db-sf, #ffffff);
          border: 1px solid var(--db-bd, rgba(0,0,0,0.08));
          border-radius: 16px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: var(--db-sf, #ffffff);
          border: 1px solid var(--db-bd, rgba(0,0,0,0.08));
          border-radius: 16px;
          color: var(--db-tx3, #777);
        }
        .empty-state h3 {
          margin: 1rem 0 0.25rem;
          color: var(--db-tx2, #555);
          font-size: 1.1rem;
        }
        .empty-state p { font-size: 0.875rem; margin: 0; }

        .bookings-list {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }
        .booking-row-card {
          background: var(--db-sf, #ffffff);
          border: 1px solid var(--db-bd, rgba(0,0,0,0.08));
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          display: grid;
          gap: 1.5rem;
          align-items: center;
          transition: all 0.2s ease-in-out;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01);
          position: relative;
        }
        .booking-row-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.04);
          border-color: var(--db-gold, #c5a880) !important;
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
          color: var(--db-tx, #000);
        }
        .contact-links {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .contact-link {
          font-size: 0.78rem;
          color: var(--db-tx2, #555);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: color 0.15s;
        }
        .contact-link:hover {
          color: var(--brand-red, #E10613);
        }
        .contact-link svg {
          color: var(--db-tx3, #777);
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
          color: var(--db-tx, #000);
          font-weight: 700;
          font-size: 0.9rem;
        }
        .vehicle-badge svg { color: var(--brand-red, #E10613); }
        .date-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--db-tx2, #555);
          font-size: 0.8rem;
        }
        .date-badge svg { color: var(--db-tx3, #777); }

        .col-consultant {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .col-consultant label {
          font-size: 0.6875rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--db-tx3, #777);
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
          color: var(--db-tx3, #777);
          pointer-events: none;
        }
        .consultant-select {
          width: 100%;
          background: var(--db-sf2, #f9f9f9) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>") no-repeat;
          background-position: right 10px center;
          background-size: 14px;
          border: 1px solid var(--db-bd, rgba(0,0,0,0.08));
          border-radius: 8px;
          padding: 6px 26px 6px 28px;
          color: var(--db-tx, #000);
          font-size: 0.8125rem;
          font-weight: 600;
          font-family: inherit;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
        }
        .consultant-select:hover {
          border-color: var(--brand-red, #E10613);
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
          background: var(--db-sf2, #f9f9f9);
          border: 1px solid var(--db-bd, rgba(0,0,0,0.08));
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

        .col-financials {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .finance-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          color: var(--db-tx2, #555);
        }
        .finance-row .lbl {
          color: var(--db-tx3, #777);
          font-weight: 500;
          font-size: 0.75rem;
          width: 36px;
        }
        .finance-row .val {
          color: var(--db-tx, #000);
          font-weight: 700;
        }
        .finance-row .val.token-val {
          color: var(--db-gold, #c5a880);
        }
        .finance-row .f-icon {
          flex-shrink: 0;
        }
        .finance-row .f-icon.token { color: var(--db-gold, #c5a880); }
        .finance-row .f-icon.total { color: var(--db-tx3, #777); }
        
        .payment-pill-container {
          margin-top: 2px;
        }
        .payment-pill {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: inline-block;
        }

        .emp-booking-card {
          grid-template-columns: 1fr 0.8fr 0.8fr 0.8fr 1.1fr !important;
        }

        .flex-end-actions {
          align-items: flex-end !important;
        }

        .act-btn.btn-accept:hover:not(:disabled) {
          background: rgba(34, 197, 94, 0.1);
          border-color: #22c55e;
          color: #22c55e;
        }

        @media (max-width: 1024px) {
          .stats-row {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .booking-row-card {
            grid-template-columns: 1fr 1fr !important;
            gap: 1.25rem !important;
          }
          .col-consultant, .col-status-actions {
            align-items: flex-start !important;
            grid-column: span 1;
          }
          .col-status-actions {
            grid-column: span 2;
            flex-direction: row-reverse !important;
            justify-content: space-between;
            align-items: center !important;
            width: 100%;
            border-top: 1px dashed var(--db-bd, rgba(0,0,0,0.08));
            padding-top: 10px;
          }
        }

        @media (max-width: 600px) {
          .stats-row {
            grid-template-columns: 1fr !important;
          }
          .db-page-header {
            position: relative;
            padding-right: 90px !important;
          }
          .refresh-btn {
            position: absolute !important;
            top: 0px !important;
            right: 0px !important;
          }
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
          .filters-bar { flex-direction: column; align-items: stretch; gap: 1rem !important; }
          .search-box { min-width: 0 !important; width: 100% !important; }
          .select-container { width: 100% !important; }
          .tabs-container {
            display: flex !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
            width: 100% !important;
            gap: 8px !important;
            padding: 4px !important;
            background: var(--db-sf2) !important;
            border: 1px solid var(--db-bd) !important;
            border-radius: 12px !important;
          }
          .tabs-container::-webkit-scrollbar {
            display: none !important;
          }
          .tab-btn {
            white-space: nowrap !important;
            padding: 8px 16px !important;
            font-size: 0.8rem !important;
            border-radius: 8px !important;
            flex: 1 0 auto !important;
            text-align: center !important;
          }
        }
      `}</style>
    </div>
  );
}
