'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Car, User, Calendar, Mail, Phone, Clock, FileText, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

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
  const [toast, setToast] = useState('');

  const supabase = createClient();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
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
      showToast('Error loading test drives');
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
      showToast('Failed to update status');
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
      showToast('Failed to assign employee');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' };
      case 'cancelled':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
      case 'no_show':
        return { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
    }
  };

  return (
    <div className="db-page">
      <div className="db-page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="db-page-title">Test Drive Bookings</h1>
          <p className="db-page-sub">Monitor and assign incoming vehicle test drive requests</p>
        </div>
      </div>

      <div className="car-filters" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="db-search-inline" style={{ flex: 1, minWidth: '260px' }}>
          <Search size={16} />
          <input
            placeholder="Search bookings by customer, car, or consultant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="car-select-wrap">
          <Filter size={14} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
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
            No test drives found.
          </p>
        ) : (
          filtered.map((req, i) => {
            const statusStyle = getStatusColor(req.status);
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
                  gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  transition: 'border-color 0.2s',
                }}
                className="test-drive-card"
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
                    <span>{new Date(req.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>

                {/* Column 3: Consultant Assignment */}
                <div>
                  <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--db-tx3)', display: 'block', marginBottom: '0.35rem' }}>
                    Assign Consultant
                  </span>
                  <select
                    disabled={updatingId === req.id}
                    value={req.employee_id || ''}
                    onChange={(e) => handleAssignEmployee(req.id, e.target.value || null)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      background: 'var(--db-sf2)',
                      border: '1px solid var(--db-bd)',
                      color: 'var(--db-tx)',
                      fontSize: '0.8125rem',
                      fontFamily: 'inherit',
                      outline: 'none',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
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
                    {req.status}
                  </span>

                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      disabled={updatingId === req.id || req.status === 'completed'}
                      onClick={() => handleUpdateStatus(req.id, 'completed')}
                      title="Mark Completed"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                        color: req.status === 'completed' ? '#B0B0B0' : '#22c55e',
                        transition: 'background 0.2s',
                      }}
                      className="status-btn"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                    <button
                      disabled={updatingId === req.id || req.status === 'cancelled'}
                      onClick={() => handleUpdateStatus(req.id, 'cancelled')}
                      title="Mark Cancelled"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                        color: req.status === 'cancelled' ? '#B0B0B0' : '#ef4444',
                        transition: 'background 0.2s',
                      }}
                      className="status-btn"
                    >
                      <XCircle size={16} />
                    </button>
                    <button
                      disabled={updatingId === req.id || req.status === 'no_show'}
                      onClick={() => handleUpdateStatus(req.id, 'no_show')}
                      title="Mark No Show"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                        color: req.status === 'no_show' ? '#B0B0B0' : '#f59e0b',
                        transition: 'background 0.2s',
                      }}
                      className="status-btn"
                    >
                      <AlertCircle size={16} />
                    </button>
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
        .test-drive-card:hover {
          border-color: var(--db-gold) !important;
        }
        .status-btn:hover:not(:disabled) {
          background: var(--db-sf2);
        }
        .status-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        @media (max-width: 900px) {
          .test-drive-card {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .test-drive-card {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
