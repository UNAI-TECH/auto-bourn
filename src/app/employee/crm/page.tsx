'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Phone, Clock, CheckCircle2, Users, FileText, CheckSquare } from 'lucide-react';
import { useEmpContext } from '../layout';
import { LEAD_STAGES, FOLLOW_UP_TYPE_LABELS, formatBudget, type Lead, type FollowUp } from '@/types/crm';

export default function EmployeeCRMPage() {
  const router = useRouter();
  const { employee } = useEmpContext();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [todayFollowUps, setTodayFollowUps] = useState<FollowUp[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<FollowUp[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'my'|'unassigned_buy'|'unassigned_sell'>('my');
  const [counts, setCounts] = useState({ my: 0, buy: 0, sell: 0 });
  const supabase = createClient();

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3000); };

  const getPriorityClass = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'crm-badge-high';
      case 'normal': return 'crm-badge-normal';
      default: return 'crm-badge-low';
    }
  };

  const getFollowUpCustomerName = (fu: FollowUp) => {
    const lead = fu.lead as any;
    return lead?.customer_name || 'Customer';
  };

  const getFollowUpCarName = (fu: FollowUp) => {
    const lead = fu.lead as any;
    return lead?.interested_car || 'Luxury Vehicle';
  };

  const getFollowUpTime = (fu: FollowUp) => {
    try {
      const dt = new Date(fu.scheduled_at);
      const today = new Date();
      const isToday = dt.getDate() === today.getDate() &&
                      dt.getMonth() === today.getMonth() &&
                      dt.getFullYear() === today.getFullYear();
      
      if (isToday) {
        return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      } else {
        return `${dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ${dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
      }
    } catch {
      return '12:00 PM';
    }
  };

  const load = useCallback(async () => {
    if (!employee) return;
    setLoading(true);
    const now = new Date();
    const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);

    try {
      // Fetch only assigned leads to calculate counts and display the current tab's leads
      const [assignedRes, todayFURes, upcomingFURes] = await Promise.all([
        fetch(`/api/leads?assigned_to=${employee.id}`),
        supabase
          .from('follow_ups')
          .select('*, lead:leads!lead_id(customer_name,phone,interested_car,assigned_to)')
          .eq('status', 'pending')
          .lte('scheduled_at', todayEnd.toISOString())
          .order('scheduled_at'),
        supabase
          .from('follow_ups')
          .select('*, lead:leads!lead_id(customer_name,phone,interested_car,assigned_to)')
          .eq('status', 'pending')
          .gt('scheduled_at', todayEnd.toISOString())
          .order('scheduled_at')
      ]);

      const assignedData = await assignedRes.json();
      const assignedList = (assignedData.leads || []) as Lead[];

      setCounts({
        my: assignedList.length,
        buy: 0,
        sell: 0
      });

      setLeads(assignedList);

      if (todayFURes.data) {
        const filteredToday = (todayFURes.data as any[]).filter(
          fu => fu.employee_id === employee.id || fu.lead?.assigned_to === employee.id
        );
        setTodayFollowUps(filteredToday);
      }
      if (upcomingFURes.data) {
        const filteredUpcoming = (upcomingFURes.data as any[])
          .filter(fu => fu.employee_id === employee.id || fu.lead?.assigned_to === employee.id)
          .slice(0, 10);
        setUpcomingFollowUps(filteredUpcoming);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load CRM data');
    }
    setLoading(false);
  }, [employee]);

  useEffect(() => { load(); }, [load]);

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    return (
      l.customer_name.toLowerCase().includes(q) ||
      l.phone.includes(q) ||
      (l.interested_car && l.interested_car.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', fontFamily: "'Outfit', sans-serif" }} className="crm-page-container">
      {/* Top Welcome Header */}
      <div className="crm-welcome-header">
        <div>
          <h1 className="crm-welcome-title">Customer Relationship Management (CRM)</h1>
          <p className="crm-welcome-subtitle">Streamline your interactions with luxury buyers and sellers</p>
        </div>
        <Link href="/employee/customer-details" className="crm-add-lead-btn btn-hover-glow">
          <Plus size={16} /> Add Lead Record
        </Link>
      </div>

      {/* Overview Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Leads Listed', count: counts.my + counts.buy + counts.sell, icon: <Users size={20} />, color: '#3b82f6', bg: 'rgba(59,130,246,.07)' },
          { label: 'Active Opportunities', count: counts.my, icon: <FileText size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,.07)' },
          { label: 'Deals Completed', count: 0, icon: <CheckCircle2 size={20} />, color: '#10b981', bg: 'rgba(16,185,129,.07)' },
          { label: "Today's Follow-ups", count: todayFollowUps.length, icon: <CheckSquare size={20} />, color: '#ef4444', bg: 'rgba(239,68,68,.07)' }
        ].map((c, i) => (
          <div key={i} style={{ background: 'var(--db-sf, #ffffff)', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.06))', borderRadius: '20px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: c.bg, color: c.color, width: 44, height: 44, borderRadius: '12px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
              {c.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--db-tx, #000)', lineHeight: 1.2 }}>{c.count}</div>
              <div style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--db-tx2, #555)', marginTop: '2px' }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Follow-ups and Upcoming Leads Two-Column Row */}
      <div className="crm-two-columns-row" style={{ marginBottom: '2.5rem' }}>
        
        {/* Today's Follow-ups Timeline */}
        <div className="crm-sidebar-panel" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
          <div className="crm-sidebar-panel-head">
            <h3>Today's Follow-ups ({todayFollowUps.length})</h3>
            <span style={{ fontSize: '.75rem', color: 'var(--db-tx3, #777)', fontWeight: 600 }}>Scheduled for Today</span>
          </div>
          <div className="crm-timeline-body" style={{ flex: 1, overflowY: 'auto' }}>
            {todayFollowUps.length === 0 ? (
              <p className="crm-empty-state">No pending follow-ups scheduled for today</p>
            ) : (
              todayFollowUps.map((fu, idx) => (
                <div 
                  key={fu.id} 
                  className="crm-timeline-item" 
                  onClick={() => router.push(`/employee/crm/leads/${fu.lead_id}`)} 
                  style={{ cursor: 'pointer' }}
                >
                  <div className="crm-timeline-time" style={{ fontSize: '0.65rem' }}>{getFollowUpTime(fu)}</div>
                  <div className="crm-timeline-indicator">
                    <div className="crm-timeline-dot"></div>
                    {idx < todayFollowUps.length - 1 && <div className="crm-timeline-line"></div>}
                  </div>
                  <div className="crm-timeline-content">
                    <div className="crm-timeline-top">
                      <span className="crm-timeline-name">{getFollowUpCustomerName(fu)}</span>
                      <span className={`crm-timeline-badge ${getPriorityClass(fu.priority)}`}>
                        {fu.priority}
                      </span>
                    </div>
                    <p className="crm-timeline-desc">{getFollowUpCarName(fu)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Leads List */}
        <div className="crm-panel-widget" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
          <div className="crm-widget-head">
            <h3>Upcoming Follow-ups ({upcomingFollowUps.length})</h3>
            <span style={{ fontSize: '.75rem', color: 'var(--db-tx3, #777)', fontWeight: 600 }}>Future Scheduled Tasks</span>
          </div>
          <div className="crm-widget-body" style={{ flex: 1, overflowY: 'auto' }}>
            {upcomingFollowUps.length === 0 ? (
              <p className="crm-empty-state">No future follow-ups scheduled</p>
            ) : (
              upcomingFollowUps.map(fu => (
                <div 
                  key={fu.id} 
                  className="crm-widget-row" 
                  onClick={() => router.push(`/employee/crm/leads/${fu.lead_id}`)} 
                  style={{ cursor: 'pointer', padding: '0.75rem 1rem' }}
                >
                  <div className="crm-widget-avatar-wrap">
                    <div className="crm-mini-avatar bg-blue-soft" style={{ fontSize: '0.85rem' }}>{getFollowUpCustomerName(fu).charAt(0)}</div>
                  </div>
                  <div className="crm-widget-info-block" style={{ marginLeft: '0.75rem' }}>
                    <h4 className="crm-row-name" style={{ margin: 0, fontSize: '0.9rem' }}>{getFollowUpCustomerName(fu)}</h4>
                    <p className="crm-row-sub" style={{ margin: '2px 0 0', fontSize: '0.75rem' }}>{getFollowUpCarName(fu)}</p>
                  </div>
                  <div className="crm-widget-time-block" style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <span className="crm-row-time" style={{ fontSize: '0.7rem', display: 'block', whiteSpace: 'nowrap' }}>
                      {new Date(fu.scheduled_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} at {new Date(fu.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                    <span className={`crm-row-badge ${getPriorityClass(fu.priority)}`} style={{ fontSize: '0.65rem' }}>{fu.priority}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Tabs Header and Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--db-bd, rgba(0,0,0,0.06))', paddingBottom: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }} className="crm-filter-header-row">
        {/* Title */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--db-tx)', margin: 0, fontFamily: "'Outfit', sans-serif" }}>My Assigned Leads ({counts.my})</h2>
        </div>

        {/* Search */}
        <div style={{ background: 'var(--db-sf, #ffffff)', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.08))', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', width: '100%', maxWidth: '280px' }} className="db-search-inline crm-search-inline">
          <Search size={14} style={{ color: 'var(--db-tx3, #777)' }} />
          <input placeholder="Search customer info..." value={search} onChange={e=>setSearch(e.target.value)} style={{ color: 'var(--db-tx)', background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '.875rem' }}/>
        </div>
      </div>

      {/* Leads list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading ? (
          Array(4).fill(0).map((_, i) => <div key={i} style={{ height: 80, background: 'var(--db-sf, #ffffff)', border: '1px solid var(--db-bd, rgba(0,0,0,0.05))', borderRadius: '18px', animation: 'pulse 1.5s infinite' }} />)
        ) : filtered.length === 0 ? (
          <div style={{ padding: '4rem 2rem', background: 'var(--db-sf, #ffffff)', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.05))', borderRadius: '20px', textAlign: 'center' }}>
            <p style={{ color: 'var(--db-tx2, #555)', fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>
              No leads currently assigned to you by the Admin.
            </p>
          </div>
        ) : (
          filtered.map((lead, i) => {
            const stage = LEAD_STAGES.find(s => s.key === lead.lead_status);
            const notesList = lead.customer_notes || [];
            const isSell = notesList.some((n: any) => 
              n.note && (n.note.includes('Vehicle Details:') || n.note.includes('Transmission:') || n.note.includes('Fuel Type:'))
            ) || !!(lead.interested_car && (
              lead.interested_car.includes('Sell a Vehicle') ||
              lead.interested_car.toLowerCase().includes('sell')
            ));
            return (
              <motion.div 
                key={lead.id} 
                onClick={() => router.push(`/employee/crm/leads/${lead.id}`)}
                className="crm-lead-card-item"
                style={{
                  background: isSell ? 'rgba(255, 122, 0, 0.09)' : 'rgba(59, 130, 246, 0.09)',
                  border: isSell ? '1.5px solid rgba(255, 122, 0, 0.28)' : '1.5px solid rgba(59, 130, 246, 0.28)',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', borderColor: isSell ? '#FF7A00' : '#3b82f6' }}
                initial={{ opacity: 0, y: 6 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.02 }}
              >
                {/* Row 1: Customer Name */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--db-tx, #000)', letterSpacing: '-0.01em' }}>
                    {lead.customer_name}
                  </span>
                </div>

                {/* Row 2: Avatar, Category, Stage, Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Avatar */}
                    <div style={{ width: 30, height: 30, borderRadius: '8px', background: stage?.bg, color: stage?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 850, fontSize: '0.8rem', flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
                      {lead.customer_name.charAt(0)}
                    </div>

                    {/* Buyer/Seller label */}
                    <span style={{ 
                      fontSize: '0.55rem', 
                      fontWeight: 800, 
                      letterSpacing: '0.05em', 
                      textTransform: 'uppercase', 
                      padding: '0.15rem 0.35rem', 
                      borderRadius: '5px', 
                      background: isSell ? 'rgba(255, 122, 0, 0.08)' : 'rgba(59, 130, 246, 0.08)', 
                      color: isSell ? '#FF7A00' : '#3b82f6', 
                      border: `1px solid ${isSell ? 'rgba(255, 122, 0, 0.15)' : 'rgba(59, 130, 246, 0.15)'}` 
                    }}>
                      {isSell ? 'SELLER' : 'BUYER'}
                    </span>

                    {/* Status badge */}
                    <span style={{ background: stage?.bg, color: stage?.color, fontSize: '.6rem', fontWeight: 800, padding: '.15rem .5rem', borderRadius: '100px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {stage?.label}
                    </span>
                  </div>

                  {/* Call Action button */}
                  <div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `tel:${lead.phone}`;
                      }}
                      style={{ 
                        width: 30, 
                        height: 30, 
                        background: 'rgba(59,130,246,.08)', 
                        color: '#3b82f6', 
                        border: '1px solid rgba(59,130,246,.15)', 
                        borderRadius: '8px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }} 
                      className="icon-action-btn"
                    >
                      <Phone size={12} />
                    </button>
                  </div>
                </div>

                {/* Row 3: Contact & Budget */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '1rem' }}>
                  {/* Phone */}
                  <div style={{ fontSize: '.75rem', color: 'var(--db-tx2, #555)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 600 }}>{lead.phone}</span>
                  </div>

                  {/* Budget */}
                  <div>
                    <span style={{ fontSize: '.85rem', fontWeight: 800, color: 'var(--db-tx, #000)' }}>
                      {formatBudget(lead.budget)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {toast && <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: '#22c55e', color: '#fff', padding: '.75rem 1.25rem', borderRadius: '12px', fontWeight: 600, zIndex: 200, boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)' }}>{toast}</div>}

      <style jsx>{`
        .icon-action-btn:hover {
          background: rgba(59,130,246,.15) !important;
          transform: scale(1.05);
        }

        .crm-two-columns-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .crm-sidebar-panel, .crm-panel-widget {
          background: var(--db-sf, #ffffff) !important;
          border: 1.5px solid var(--db-bd, rgba(0,0,0,0.06)) !important;
          border-radius: 20px !important;
          padding: 1.5rem !important;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02) !important;
          box-sizing: border-box;
        }

        .crm-sidebar-panel-head, .crm-widget-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--db-bd, rgba(0,0,0,0.06));
          padding-bottom: 0.75rem;
        }

        .crm-sidebar-panel-head h3, .crm-widget-head h3 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--db-tx, #000);
          margin: 0;
        }

        .crm-timeline-body, .crm-widget-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .crm-timeline-item {
          display: flex;
          gap: 12px;
          min-height: 72px;
        }

        .crm-timeline-time {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--db-tx3, #777);
          width: 55px;
          text-align: right;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .crm-timeline-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          margin-top: 4px;
        }

        .crm-timeline-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #E10613;
        }

        .crm-timeline-line {
          width: 1px;
          flex: 1;
          background: var(--db-bd, rgba(0,0,0,0.06));
          margin: 4px 0;
        }

        .crm-timeline-content {
          flex: 1;
          padding-bottom: 12px;
        }

        .crm-timeline-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .crm-timeline-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--db-tx, #000);
        }

        .crm-timeline-badge {
          font-size: 0.55rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 5px;
          border-radius: 4px;
        }

        .crm-timeline-desc {
          font-size: 0.725rem;
          color: var(--db-tx3, #777);
          margin: 2px 0 0 0;
        }

        .crm-badge-high { background: #FEF2F2; color: #EF4444; }
        .crm-badge-normal { background: #EFF6FF; color: #3B82F6; }
        .crm-badge-low { background: #F1F5F9; color: #64748B; }

        .crm-widget-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--db-bd, rgba(0,0,0,0.06));
        }

        .crm-widget-row:last-child {
          border-bottom: none;
        }

        .crm-mini-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--db-sf2, #f5f5f5);
          color: var(--db-tx2, #555);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8125rem;
          font-weight: 700;
        }

        .crm-mini-avatar.bg-blue-soft {
          background: rgba(59,130,246,.08);
          color: #3b82f6;
        }

        .crm-widget-info-block {
          min-width: 0;
          flex: 1;
        }

        .crm-row-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--db-tx, #000);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .crm-row-sub {
          font-size: 0.725rem;
          color: var(--db-tx3, #777);
          margin: 1px 0 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .crm-row-time {
          font-size: 0.725rem;
          color: var(--db-tx3, #777);
          font-weight: 500;
        }

        .crm-row-badge {
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 1px 6px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }

        .crm-empty-state {
          color: var(--db-tx3, #777);
          font-size: 0.8125rem;
          text-align: center;
          padding: 3rem 1rem;
          font-weight: 500;
        }

        :global(.crm-lead-card-item) {
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 6px !important;
          padding: 0.5rem 1rem !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 15px rgba(0,0,0,0.01) !important;
        }

        .crm-page-container {
          padding: 1.5rem;
        }

        :global(.crm-welcome-header) {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        :global(.crm-welcome-title) {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--db-tx, #000);
          margin: 0;
          line-height: 1.25;
        }

        :global(.crm-welcome-subtitle) {
          font-size: .875rem;
          color: var(--db-tx2, #555);
          margin: 4px 0 0;
        }

        :global(.crm-add-lead-btn) {
          background: linear-gradient(135deg, #E10613, #c70511);
          color: #fff;
          border: none;
          padding: 0.625rem 1.25rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          box-shadow: 0 4px 15px rgba(225, 6, 19, 0.2);
          transition: all 0.2s ease;
        }

        :global(.crm-add-lead-btn):hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(225, 6, 19, 0.3);
        }
        .tab-txt-short {
          display: none;
        }
        .tab-txt-full {
          display: inline;
        }
        @media (max-width: 900px) {
          .crm-two-columns-row {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .crm-sidebar-panel, .crm-panel-widget {
            height: auto !important;
            min-height: 280px;
          }
        }
        @media (max-width: 768px) {
          .crm-page-container {
            padding: 0.75rem 1rem !important;
          }
          :global(.crm-welcome-header) {
            flex-direction: column;
            align-items: stretch;
            gap: 0.875rem;
            margin-bottom: 1.5rem;
          }
          :global(.crm-welcome-title) {
            font-size: 1.25rem;
            line-height: 1.35;
          }
          :global(.crm-welcome-subtitle) {
            font-size: 0.8125rem;
          }
          :global(.crm-add-lead-btn) {
            width: 100%;
            justify-content: center;
            padding: 0.75rem 1.25rem;
          }
          .tab-txt-full {
            display: none;
          }
          .tab-txt-short {
            display: inline;
          }
          .crm-filter-header-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .crm-tabs {
            width: 100% !important;
            display: flex !important;
          }
          .crm-tab-btn {
            flex: 1 !important;
            padding: 0.5rem 0.25rem !important;
            font-size: 0.75rem !important;
            text-align: center !important;
          }
          .crm-search-inline {
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
