'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Phone, Calendar, Clock, Search, ArrowRight, User, AlertTriangle, ShieldCheck, Headphones } from 'lucide-react';
import Link from 'next/link';

export default function AdminCallSessionsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const supabase = createClient();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch calls with lead and employee details
      const { data: callData, error: callErr } = await supabase
        .from('employee_calls')
        .select('*, lead:leads!lead_id(customer_name, phone, interested_car), employee:employees!employee_id(name, employee_id)')
        .order('created_at', { ascending: false });

      if (callErr) throw callErr;
      setCalls(callData || []);

      // 2. Fetch employee list for filters
      const { data: empData, error: empErr } = await supabase
        .from('employees')
        .select('id, name, employee_id')
        .eq('status', 'active')
        .order('name');

      if (empErr) throw empErr;
      setEmployees(empData || []);
    } catch (e: any) {
      console.error('Error loading admin call sessions:', e.message || e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'called':
        return { label: 'Called', bg: 'rgba(34, 197, 94, 0.08)', color: '#22c55e' };
      case 'missed':
        return { label: 'Missed', bg: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' };
      case 'no_answer':
        return { label: 'No Answer', bg: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' };
      default:
        return { label: status, bg: 'rgba(100, 116, 139, 0.08)', color: '#64748b' };
    }
  };

  // Filter computations
  const filtered = calls.filter(c => {
    const q = search.toLowerCase();
    const customerName = c.lead?.customer_name?.toLowerCase() || '';
    const car = c.lead?.interested_car?.toLowerCase() || '';
    const employeeName = c.employee?.name?.toLowerCase() || '';
    const review = c.review?.toLowerCase() || '';
    
    const matchesSearch = customerName.includes(q) || car.includes(q) || employeeName.includes(q) || review.includes(q);
    const matchesEmployee = selectedEmployee === 'all' || c.employee_id === selectedEmployee;
    const matchesStatus = selectedStatus === 'all' || c.call_status === selectedStatus;

    return matchesSearch && matchesEmployee && matchesStatus;
  });

  // Stats computations
  const totalAttempts = calls.length;
  const connectedCalls = calls.filter(c => c.call_status === 'called').length;
  const noAnswerCalls = calls.filter(c => c.call_status === 'no_answer').length;
  const missedCalls = calls.filter(c => c.call_status === 'missed').length;
  const totalDurationSeconds = calls.reduce((acc, c) => acc + (c.talking_time || 0), 0);

  const formatTotalDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Outfit', sans-serif", padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--db-tx, #000)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Headphones size={28} style={{ color: '#E10613' }} /> Employee Call Track Sessions
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--db-tx2, #555)', marginTop: '4px' }}>
            Monitor consultant client calls, talking duration, and lead interest reviews
          </p>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Total Contact Attempts */}
        <div style={{
          background: 'var(--db-sf, #ffffff)',
          border: '1.5px solid var(--db-bd, rgba(0,0,0,0.06))',
          borderRadius: '20px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.01)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--db-tx3, #777)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Dials</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0 0', color: 'var(--db-tx, #000)' }}>{totalAttempts}</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--db-tx2, #555)' }}>Contact attempts</span>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
            <Headphones size={24} />
          </div>
        </div>

        {/* Connected Calls */}
        <div style={{
          background: 'var(--db-sf, #ffffff)',
          border: '1.5px solid var(--db-bd, rgba(0,0,0,0.06))',
          borderRadius: '20px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.01)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--db-tx3, #777)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connected</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0 0', color: 'var(--db-tx, #000)' }}>{connectedCalls}</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--db-tx2, #555)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> {formatTotalDuration(totalDurationSeconds)} talk time
            </span>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e' }}>
            <Phone size={24} />
          </div>
        </div>

        {/* No Answer */}
        <div style={{
          background: 'var(--db-sf, #ffffff)',
          border: '1.5px solid var(--db-bd, rgba(0,0,0,0.06))',
          borderRadius: '20px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.01)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--db-tx3, #777)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No Answer</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0 0', color: 'var(--db-tx, #000)' }}>{noAnswerCalls}</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--db-tx2, #555)' }}>Unreachable / Busy</span>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* Missed Calls */}
        <div style={{
          background: 'var(--db-sf, #ffffff)',
          border: '1.5px solid var(--db-bd, rgba(0,0,0,0.06))',
          borderRadius: '20px',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.01)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--db-tx3, #777)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Missed</span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0 0', color: 'var(--db-tx, #000)' }}>{missedCalls}</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--db-tx2, #555)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> Compliance alert limit
            </span>
          </div>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--db-sf, #ffffff)',
        border: '1.5px solid var(--db-bd, rgba(0,0,0,0.06))',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.01)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search by employee, customer, vehicle..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.7rem 1rem 0.7rem 2.5rem',
              border: '1.5px solid var(--db-bd, rgba(0,0,0,0.08))',
              borderRadius: '10px',
              fontSize: '0.875rem',
              background: 'var(--db-sf2, #f9f9f9)',
              color: 'var(--db-tx, #000)',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'all 0.2s'
            }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--db-tx3, #777)' }} />
        </div>

        {/* Filter Group */}
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Consultant Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--db-tx2, #555)' }}>Consultant:</span>
            <select
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              style={{
                padding: '0.625rem 1rem',
                border: '1.5px solid var(--db-bd, rgba(0,0,0,0.08))',
                borderRadius: '10px',
                fontSize: '0.875rem',
                background: 'var(--db-sf, #fff)',
                color: 'var(--db-tx, #000)',
                outline: 'none',
                fontFamily: 'inherit',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Consultants</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--db-tx2, #555)' }}>Status:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{
                padding: '0.625rem 1rem',
                border: '1.5px solid var(--db-bd, rgba(0,0,0,0.08))',
                borderRadius: '10px',
                fontSize: '0.875rem',
                background: 'var(--db-sf, #fff)',
                color: 'var(--db-tx, #000)',
                outline: 'none',
                fontFamily: 'inherit',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Statuses</option>
              <option value="called">Called</option>
              <option value="missed">Missed</option>
              <option value="no_answer">No Answer</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--db-tx3, #777)' }}>Loading call logs...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--db-sf, #ffffff)', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.06))', borderRadius: '24px', padding: '5rem 2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--db-tx3, #777)', margin: 0, fontSize: '0.9375rem' }}>No call logs found matching your filters.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--db-sf, #ffffff)', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.06))', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.01)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--db-bd, rgba(0,0,0,0.08))', background: 'var(--db-sf2, #f9f9f9)' }}>
                  <th style={{ padding: '1.125rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--db-tx2, #555)', textTransform: 'uppercase' }}>Consultant</th>
                  <th style={{ padding: '1.125rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--db-tx2, #555)', textTransform: 'uppercase' }}>Customer Name</th>
                  <th style={{ padding: '1.125rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--db-tx2, #555)', textTransform: 'uppercase' }}>Vehicle / Interest</th>
                  <th style={{ padding: '1.125rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--db-tx2, #555)', textTransform: 'uppercase' }}>Call Status</th>
                  <th style={{ padding: '1.125rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--db-tx2, #555)', textTransform: 'uppercase' }}>Duration</th>
                  <th style={{ padding: '1.125rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--db-tx2, #555)', textTransform: 'uppercase' }}>Date &amp; Time</th>
                  <th style={{ padding: '1.125rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--db-tx2, #555)', textTransform: 'uppercase' }}>Call Review Comments</th>
                  <th style={{ padding: '1.125rem 1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--db-tx2, #555)', textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const badge = getStatusBadge(c.call_status);
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--db-bd, rgba(0,0,0,0.05))', fontSize: '0.875rem' }}>
                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700, color: 'var(--db-tx, #000)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={14} style={{ color: '#E10613' }} />
                          <div>
                            <div>{c.employee?.name || 'Unknown'}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--db-tx3, #777)', marginTop: '2px' }}>{c.employee?.employee_id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: 650, color: 'var(--db-tx, #000)' }}>
                        {c.lead?.customer_name || 'Customer'}
                        <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--db-tx3, #777)', marginTop: '2px' }}>{c.lead?.phone}</div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', color: 'var(--db-tx2, #555)' }}>
                        {c.lead?.interested_car || 'Luxury Vehicle'}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: badge.bg, color: badge.color, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', fontWeight: 650, color: 'var(--db-tx, #000)' }}>
                        {formatDuration(c.talking_time)}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', color: 'var(--db-tx2, #555)', fontSize: '0.8125rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} style={{ color: '#E10613' }} />
                          {new Date(c.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: 'var(--db-tx3)' }}>
                          <Clock size={13} />
                          {new Date(c.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', maxWidth: '280px' }}>
                        {c.review ? (
                          <div>
                            <span style={{ color: '#E10613', fontWeight: 750, fontSize: '0.78rem', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                              {c.review}
                            </span>
                            {c.notes && <p style={{ fontSize: '0.78rem', color: 'var(--db-tx2, #555)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.notes}>{c.notes}</p>}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--db-tx3, #777)', fontStyle: 'italic', fontSize: '0.78rem' }}>Pending Review</span>
                        )}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem' }}>
                        <Link href={`/dashboard/crm/leads/${c.lead_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#E10613', fontWeight: 700, textDecoration: 'none' }} className="hover-link">
                          View Lead <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
