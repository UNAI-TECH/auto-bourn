'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Car, User, Calendar, Mail, Phone, Clock, FileText, CheckCircle2, XCircle, AlertCircle, Bookmark, BookmarkCheck } from 'lucide-react';
import { useEmpContext } from '../layout';

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

export default function EmployeeTestDrivesPage() {
  const { employee } = useEmpContext();
  const [requests, setRequests] = useState<TestDriveRequest[]>([]);
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

  const loadRequests = async () => {
    try {
      const res = await fetch('/api/test-drives');
      if (!res.ok) throw new Error('Failed to fetch test drives');
      const data = await res.json();
      setRequests(data.testDrives || []);
    } catch (err) {
      console.error(err);
      showToast('Error loading test drives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
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
      loadRequests();
    } catch (err) {
      console.error(err);
      showToast('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClaimRequest = async (id: string) => {
    if (!employee) return;
    setUpdatingId(id);
    try {
      const res = await fetch('/api/test-drives', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, employeeId: employee.id }),
      });
      if (!res.ok) throw new Error('Failed to claim request');
      showToast('Test drive claimed successfully!');
      loadRequests();
    } catch (err) {
      console.error(err);
      showToast('Failed to claim test drive');
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
        return { bg: 'rgba(34, 197, 94, 0.08)', color: '#22c55e' };
      case 'cancelled':
        return { bg: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' };
      case 'no_show':
        return { bg: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' };
      default:
        return { bg: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' };
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '.75rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.375rem', fontWeight: 800, margin: 0 }}>
            Test Drive Bookings
          </h1>
          <p style={{ color: 'var(--emp-tx2)', fontSize: '.8125rem', margin: '.25rem 0 0' }}>
            View and manage customer test drive requests from the website
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div className="db-search-inline" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={14} />
          <input
            placeholder="Search test drives..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--emp-sf)',
            border: '1px solid var(--emp-bd)',
            borderRadius: '10px',
            padding: '0 0.75rem',
          }}
        >
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--emp-tx)',
              fontSize: '0.8125rem',
              fontFamily: 'inherit',
              outline: 'none',
              cursor: 'pointer',
              padding: '0.5rem 0',
            }}
          >
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
          Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                style={{
                  height: '96px',
                  background: 'var(--emp-sf)',
                  border: '1px solid var(--emp-bd)',
                  borderRadius: '12px',
                  animation: 'pulse 1.5s infinite',
                }}
              />
            ))
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--emp-tx2)', textAlign: 'center', padding: '2rem' }}>
            No test drive bookings found.
          </p>
        ) : (
          filtered.map((req, i) => {
            const statusStyle = getStatusColor(req.status);
            const isAssignedToMe = employee && req.employee_id === employee.id;
            const isUnassigned = !req.employee_id;

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                style={{
                  background: 'var(--emp-sf)',
                  border: '1px solid var(--emp-bd)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr 1fr',
                  gap: '1.25rem',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  boxShadow: isAssignedToMe ? '0 4px 12px rgba(225, 6, 19, 0.03)' : 'none',
                  borderColor: isAssignedToMe ? 'rgba(225, 6, 19, 0.2)' : 'var(--emp-bd)',
                }}
                className="emp-td-card"
              >
                {/* Contact details */}
                <div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: '0 0 0.35rem', color: 'var(--emp-tx)' }}>
                    {req.lead?.customer_name || 'Anonymous User'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', color: 'var(--emp-tx2)' }}>
                    <a href={`tel:${req.lead?.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'inherit' }}>
                      <Phone size={12} style={{ color: '#3b82f6' }} /> {req.lead?.phone || '—'}
                    </a>
                    {req.lead?.email && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={12} style={{ color: 'var(--emp-tx3)' }} /> {req.lead.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Booking details */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.2rem' }}>
                    <Car size={14} style={{ color: '#E10613' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--emp-tx)' }}>
                      {req.car_name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--emp-tx2)' }}>
                    <Calendar size={12} style={{ color: 'var(--emp-tx3)' }} />
                    <span>{new Date(req.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>

                {/* Assignment & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {req.status}
                    </span>
                    {req.employee ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--emp-tx2)' }}>
                        👤 {isAssignedToMe ? 'Assigned to You' : req.employee.name}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#ff9800', fontWeight: 600 }}>
                        ⚠️ Unassigned
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {isUnassigned ? (
                      <button
                        disabled={updatingId === req.id}
                        onClick={() => handleClaimRequest(req.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'linear-gradient(135deg, #E10613, #c70511)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        className="claim-btn"
                      >
                        <Bookmark size={12} /> Claim Drive
                      </button>
                    ) : isAssignedToMe && req.status === 'scheduled' ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          disabled={updatingId === req.id}
                          onClick={() => handleUpdateStatus(req.id, 'completed')}
                          title="Mark Completed"
                          style={{
                            background: 'rgba(34, 197, 94, 0.08)',
                            border: '1px solid rgba(34, 197, 94, 0.15)',
                            cursor: 'pointer',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            color: '#22c55e',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={12} /> Done
                        </button>
                        <button
                          disabled={updatingId === req.id}
                          onClick={() => handleUpdateStatus(req.id, 'cancelled')}
                          title="Cancel"
                          style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.15)',
                            cursor: 'pointer',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            color: '#ef4444',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <XCircle size={12} /> Cancel
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            background: '#22c55e',
            color: '#fff',
            padding: '.75rem 1.25rem',
            borderRadius: '12px',
            fontWeight: 600,
            zIndex: 200,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          {toast}
        </div>
      )}

      <style jsx>{`
        .emp-td-card:hover {
          border-color: #E10613 !important;
        }
        .claim-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(225, 6, 19, 0.2);
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        @media (max-width: 768px) {
          .emp-td-card {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}
