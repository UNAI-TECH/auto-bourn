'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Car, User, Calendar, Mail, Phone, Clock, FileText, CheckCircle2, XCircle, AlertCircle, RefreshCw, BookmarkCheck } from 'lucide-react';

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

interface Employee {
  id: string;
  name: string;
}

export default function AdminBookingsPage() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const supabase = createClient();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/bookings');
      if (!res.ok) throw new Error('Failed to fetch reservations');
      const data = await res.json();
      setRequests(data.bookings || []);

      // Fetch employees to allow assignment
      const { data: emps } = await supabase
        .from('employees')
        .select('id, name')
        .eq('status', 'active');
      setEmployees(emps || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
      if (deliveryStatus === 'processing') msg = 'Reservation accepted — Car status changed to Booked.';
      else if (deliveryStatus === 'cancelled') msg = 'Reservation cancelled — Car status released to Available.';
      else if (deliveryStatus === 'completed') msg = 'Reservation completed — Car status changed to Sold.';

      showToast(msg);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to update status');
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
        body: JSON.stringify({ id, employeeId: employeeId || null }),
      });
      if (!res.ok) throw new Error('Failed to assign employee');
      showToast(employeeId ? 'Consultant assigned' : 'Consultant unassigned');
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to assign consultant');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', label: 'Delivered (Sold)' };
      case 'cancelled':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', label: 'Cancelled' };
      case 'processing':
        return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', label: 'Booked (Active)' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', label: 'Pending Request' };
    }
  };

  return (
    <div className="db-page">
      <div className="db-page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="db-page-title">Vehicle Reservations</h1>
          <p className="db-page-sub">Manage client booking requests, accept reservations, and assign consultants</p>
        </div>
      </div>

      <div className="car-filters" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="db-search-inline" style={{ flex: 1, minWidth: '260px' }}>
          <Search size={16} />
          <input
            placeholder="Search reservations by customer, car, or consultant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="car-select-wrap">
          <Filter size={14} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Booked (Active)</option>
            <option value="completed">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading ? (
          Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                style={{
                  height: '110px',
                  background: 'var(--db-sf)',
                  border: '1px solid var(--db-bd)',
                  borderRadius: '16px',
                  animation: 'pulse 1.5s infinite',
                }}
              />
            ))
        ) : filtered.length === 0 ? (
          <p className="db-empty-full" style={{ textAlign: 'center', padding: '3rem', color: 'var(--db-tx3)' }}>
            No reservations found.
          </p>
        ) : (
          filtered.map((req, i) => {
            const statusStyle = getStatusColor(req.delivery_status);
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  background: 'var(--db-sf)',
                  border: '1px solid var(--db-bd)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr 1.2fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  transition: 'border-color 0.2s',
                }}
                className="booking-card"
              >
                {/* Column 1: Client & Contact */}
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--db-tx)' }}>
                    {req.lead?.customer_name || 'Anonymous User'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--db-tx2)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={13} style={{ color: 'var(--db-tx3)' }} /> {req.lead?.phone || '—'}
                    </span>
                    {req.lead?.email && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={13} style={{ color: 'var(--db-tx3)' }} /> {req.lead.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Column 2: Car Interest */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
                    <Car size={16} style={{ color: 'var(--db-gold)' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--db-tx)' }}>
                      {req.car_name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--db-tx2)' }}>
                    <Calendar size={13} style={{ color: 'var(--db-tx3)' }} />
                    <span>Requested: {new Date(req.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                  </div>
                </div>

                {/* Column 3: Assigned Consultant */}
                <div>
                  <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--db-tx3)', display: 'block', marginBottom: '0.35rem' }}>
                    Assigned Consultant
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--db-tx)' }}>
                    {req.employee?.name || 'Unassigned'}
                  </span>
                </div>

                {/* Column 4: Status & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.35rem 0.75rem',
                      borderRadius: '99px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {statusStyle.label}
                  </span>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '0.25rem' }}>
                    {req.delivery_status === 'pending' && (
                      <button
                        disabled={updatingId === req.id}
                        onClick={() => handleUpdateStatus(req.id, 'processing')}
                        className="btn-action btn-accept"
                        style={{
                          background: '#22c55e',
                          color: '#fff',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <BookmarkCheck size={14} /> Accept Request
                      </button>
                    )}
                    
                    {req.delivery_status === 'processing' && (
                      <button
                        disabled={updatingId === req.id}
                        onClick={() => handleUpdateStatus(req.id, 'completed')}
                        className="btn-action btn-complete"
                        style={{
                          background: 'var(--db-bl)',
                          color: '#fff',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={14} /> Mark Delivered
                      </button>
                    )}

                    {req.delivery_status !== 'completed' && req.delivery_status !== 'cancelled' && (
                      <button
                        disabled={updatingId === req.id}
                        onClick={() => handleUpdateStatus(req.id, 'cancelled')}
                        className="btn-action btn-cancel"
                        style={{
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <XCircle size={14} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            className="db-toast success"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .booking-card:hover {
          border-color: var(--db-gold) !important;
        }
        .btn-action {
          transition: transform 0.2s, opacity 0.2s;
        }
        .btn-action:hover {
          transform: translateY(-1px);
          opacity: 0.9;
        }
        .btn-action:active {
          transform: translateY(0);
        }
        .btn-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        @media (max-width: 900px) {
          .booking-card {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .booking-card {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
