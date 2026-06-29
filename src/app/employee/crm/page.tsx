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
      return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
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
      // Fetch both assigned and unassigned leads to calculate counts and display the current tab's leads
      const [assignedRes, unassignedRes, todayFURes, upcomingFURes] = await Promise.all([
        fetch(`/api/leads?assigned_to=${employee.id}`),
        fetch('/api/leads?assigned_to=unassigned'),
        supabase
          .from('follow_ups')
          .select('*, lead:leads!lead_id(customer_name,phone,interested_car)')
          .eq('employee_id', employee.id)
          .eq('status', 'pending')
          .lte('scheduled_at', todayEnd.toISOString())
          .order('scheduled_at'),
        supabase
          .from('follow_ups')
          .select('*, lead:leads!lead_id(customer_name,phone,interested_car)')
          .eq('employee_id', employee.id)
          .eq('status', 'pending')
          .gt('scheduled_at', todayEnd.toISOString())
          .order('scheduled_at')
          .limit(10)
      ]);

      const assignedData = await assignedRes.json();
      const unassignedData = await unassignedRes.json();

      const assignedList = (assignedData.leads || []) as Lead[];
      const unassignedList = (unassignedData.leads || []) as Lead[];

      const isSellLead = (lead: any) => {
        const notesList = lead.customer_notes || [];
        return notesList.some((n: any) => 
          n.note && (n.note.includes('Vehicle Details:') || n.note.includes('Transmission:') || n.note.includes('Fuel Type:'))
        );
      };

      const unassignedBuy = unassignedList.filter(l => !isSellLead(l));
      const unassignedSell = unassignedList.filter(l => isSellLead(l));

      setCounts({
        my: assignedList.length,
        buy: unassignedBuy.length,
        sell: unassignedSell.length
      });

      // Filter based on activeTab
      if (activeTab === 'my') {
        setLeads(assignedList);
      } else if (activeTab === 'unassigned_buy') {
        setLeads(unassignedBuy);
      } else {
        setLeads(unassignedSell);
      }

      if (todayFURes.data) {
        setTodayFollowUps(todayFURes.data as any[]);
      }
      if (upcomingFURes.data) {
        setUpcomingFollowUps(upcomingFURes.data as any[]);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load CRM data');
    }
    setLoading(false);
  }, [employee, activeTab]);

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
    <div style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto', fontFamily: "'Outfit', sans-serif" }}>
      {/* Top Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--db-tx, #000)', margin: 0 }}>Customer Relationship Management (CRM)</h1>
          <p style={{ fontSize: '.875rem', color: 'var(--db-tx2, #555)', margin: '4px 0 0' }}>Streamline your interactions with luxury buyers and sellers</p>
        </div>
        <Link href="/employee/crm/leads/new" style={{ background: 'linear-gradient(135deg, #E10613, #c70511)', color: '#fff', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', boxShadow: '0 4px 15px rgba(225, 6, 19, 0.2)' }} className="btn-hover-glow">
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
                  <div className="crm-timeline-time">{getFollowUpTime(fu)}</div>
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
                    <span className="crm-row-time" style={{ fontSize: '0.75rem', display: 'block' }}>
                      {new Date(fu.scheduled_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--db-bd, rgba(0,0,0,0.06))', paddingBottom: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Tabs */}
        <div className="crm-leads-tabs" style={{ display: 'flex', background: 'var(--db-sf2, #f5f5f5)', padding: '5px', borderRadius: '12px', gap: '4px' }}>
          <button 
            onClick={() => setActiveTab('my')} 
            style={{ 
              border: 'none', 
              padding: '0.5rem 1.25rem', 
              borderRadius: '9px', 
              fontFamily: 'inherit', 
              fontSize: '0.875rem', 
              fontWeight: activeTab === 'my' ? 700 : 600, 
              cursor: 'pointer', 
              background: activeTab === 'my' ? 'var(--db-sf, #ffffff)' : 'transparent', 
              color: activeTab === 'my' ? '#E10613' : 'var(--db-tx2, #555)', 
              boxShadow: activeTab === 'my' ? '0 4px 10px rgba(0,0,0,0.03)' : 'none',
              transition: 'all 0.2s' 
            }}
          >
            My Assigned Leads ({counts.my})
          </button>
          <button 
            onClick={() => setActiveTab('unassigned_buy')} 
            style={{ 
              border: 'none', 
              padding: '0.5rem 1.25rem', 
              borderRadius: '9px', 
              fontFamily: 'inherit', 
              fontSize: '0.875rem', 
              fontWeight: activeTab === 'unassigned_buy' ? 700 : 600, 
              cursor: 'pointer', 
              background: activeTab === 'unassigned_buy' ? 'var(--db-sf, #ffffff)' : 'transparent', 
              color: activeTab === 'unassigned_buy' ? '#E10613' : 'var(--db-tx2, #555)',
              boxShadow: activeTab === 'unassigned_buy' ? '0 4px 10px rgba(0,0,0,0.03)' : 'none',
              transition: 'all 0.2s' 
            }}
          >
            Unassigned Buy Leads ({counts.buy})
          </button>
          <button 
            onClick={() => setActiveTab('unassigned_sell')} 
            style={{ 
              border: 'none', 
              padding: '0.5rem 1.25rem', 
              borderRadius: '9px', 
              fontFamily: 'inherit', 
              fontSize: '0.875rem', 
              fontWeight: activeTab === 'unassigned_sell' ? 700 : 600, 
              cursor: 'pointer', 
              background: activeTab === 'unassigned_sell' ? 'var(--db-sf, #ffffff)' : 'transparent', 
              color: activeTab === 'unassigned_sell' ? '#E10613' : 'var(--db-tx2, #555)',
              boxShadow: activeTab === 'unassigned_sell' ? '0 4px 10px rgba(0,0,0,0.03)' : 'none',
              transition: 'all 0.2s' 
            }}
          >
            Unassigned Sell Leads ({counts.sell})
          </button>
        </div>

        {/* Search */}
        <div className="db-search-inline" style={{ background: 'var(--db-sf, #ffffff)', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.08))', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', width: '100%', maxWidth: '280px' }}>
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
              {activeTab === 'my' 
                ? 'No leads currently assigned to you. Go to the unassigned tabs to claim new customer requests.' 
                : activeTab === 'unassigned_buy'
                ? 'There are no unassigned buy inquiries right now.'
                : 'There are no unassigned car sell submissions right now.'}
            </p>
          </div>
        ) : (
          filtered.map((lead, i) => {
            const stage = LEAD_STAGES.find(s => s.key === lead.lead_status);
            const notesList = lead.customer_notes || [];
            const isSell = notesList.some((n: any) => 
              n.note && (n.note.includes('Vehicle Details:') || n.note.includes('Transmission:') || n.note.includes('Fuel Type:'))
            );
            return (
              <motion.div 
                key={lead.id} 
                onClick={() => router.push(`/employee/crm/leads/${lead.id}`)}
                className="crm-lead-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  padding: '1.25rem 1.5rem',
                  background: isSell ? 'rgba(255, 122, 0, 0.09)' : 'rgba(59, 130, 246, 0.09)',
                  border: isSell ? '1.5px solid rgba(255, 122, 0, 0.28)' : '1.5px solid rgba(59, 130, 246, 0.28)',
                  borderRadius: '18px',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.01)',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.04)', borderColor: isSell ? '#FF7A00' : '#3b82f6' }}
                initial={{ opacity: 0, y: 6 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.02 }}
              >
                <div className="crm-lead-left">
                  <div className="crm-lead-avatar" style={{ background: stage?.bg, color: stage?.color }}>
                    {lead.customer_name.charAt(0)}
                  </div>

                  {/* Buyer/Seller label on the left side of the lead */}
                  <div className="crm-lead-badge-container">
                    <span 
                      className="crm-type-badge"
                      style={{
                        background: isSell ? 'rgba(255, 122, 0, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        border: `1px solid ${isSell ? 'rgba(255, 122, 0, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`
                      }}
                    >
                      {isSell ? 'SELLER' : 'BUYER'}
                    </span>
                  </div>

                  <div className="crm-lead-info">
                    <div className="crm-lead-name">{lead.customer_name}</div>
                    <div className="crm-lead-meta">
                      <span>{lead.phone}</span>
                      {lead.interested_car && (
                        <>
                          <span style={{ opacity: 0.5 }}>·</span>
                          <span className="crm-lead-car">{lead.interested_car}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="crm-lead-right">
                  <span className="crm-stage-badge" style={{ background: stage?.bg, color: stage?.color }}>
                    {stage?.label}
                  </span>
                  <span className="crm-lead-budget">{formatBudget(lead.budget)}</span>
                </div>

                <div className="crm-lead-actions">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `tel:${lead.phone}`;
                    }}
                    className="icon-action-btn"
                  >
                    <Phone size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {toast && <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: '#22c55e', color: '#fff', padding: '.75rem 1.25rem', borderRadius: '12px', fontWeight: 600, zIndex: 200, boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)' }}>{toast}</div>}

      <style jsx>{`
        /* Lead list styles */
        .crm-lead-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 0;
        }
        .crm-lead-avatar {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 850;
          font-size: 1rem;
          flex-shrink: 0;
          font-family: 'Outfit', sans-serif;
        }
        .crm-type-badge {
          color: #000000;
          font-weight: 700;
          font-size: 0.875rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 0.375rem 0.625rem;
          border-radius: 8px;
          white-space: nowrap;
        }
        .crm-type-badge.sell {
          background: rgba(255, 122, 0, 0.1);
          border: 1px solid rgba(255, 122, 0, 0.2);
        }
        .crm-type-badge.buy {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .crm-lead-info {
          flex: 1;
          min-width: 0;
        }
        .crm-lead-name {
          font-weight: 700;
          font-size: 1rem;
          color: var(--db-tx, #000);
          margin-bottom: 2px;
        }
        .crm-lead-meta {
          font-size: .8125rem;
          color: var(--db-tx2, #555);
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .crm-lead-car {
          font-weight: 700;
          color: var(--db-tx, #000);
        }
        .crm-lead-right {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .crm-stage-badge {
          font-size: .75rem;
          font-weight: 800;
          padding: .35rem .75rem;
          border-radius: 100px;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .crm-lead-budget {
          font-size: .8125rem;
          font-weight: 700;
          color: var(--db-tx3, #777);
        }
        .crm-lead-actions {
          display: flex;
          gap: 6px;
          align-items: center;
          margin-left: .5rem;
        }
        .icon-action-btn {
          width: 36px;
          height: 36px;
          background: rgba(59,130,246,.08);
          color: #3b82f6;
          border: 1px solid rgba(59,130,246,.15);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          cursor: pointer;
        }
        .icon-action-btn:hover {
          background: rgba(59,130,246,.15) !important;
          transform: scale(1.05);
        }

        /* Two Columns Row layout */
        .crm-two-columns-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        /* Widgets and Sidebar Panels */
        .crm-panel-widget {
          background: var(--db-sf, #ffffff) !important;
          border: 1.5px solid var(--db-bd, rgba(0,0,0,0.06)) !important;
          border-radius: 24px !important;
          padding: 1.5rem !important;
          display: flex;
          flex-direction: column;
          height: 380px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.01) !important;
        }
        .crm-widget-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .crm-widget-head h3 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--db-tx, #000);
          margin: 0;
        }
        .crm-widget-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          overflow-y: auto;
        }
        .crm-widget-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 0.625rem;
          border-bottom: 1px solid var(--db-bd, rgba(0,0,0,0.05));
        }
        .crm-widget-row:last-child {
          border-bottom: none;
        }
        .crm-widget-avatar-wrap {
          flex-shrink: 0;
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
          background: var(--db-gd, rgba(225,6,19,0.05));
          color: var(--db-gold, #c5a880);
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
        .crm-widget-time-block {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          flex-shrink: 0;
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

        /* Empty state styling */
        .crm-empty-state {
          color: var(--db-tx3, #777);
          font-size: 0.8125rem;
          text-align: center;
          padding: 3rem 1rem;
          font-weight: 500;
        }

        /* Sidebar Panels */
        .crm-sidebar-panel {
          background: var(--db-sf, #ffffff) !important;
          border: 1.5px solid var(--db-bd, rgba(0,0,0,0.06)) !important;
          border-radius: 24px !important;
          padding: 1.5rem !important;
          box-shadow: 0 8px 30px rgba(0,0,0,0.01) !important;
        }
        .crm-sidebar-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--db-bd, rgba(0,0,0,0.05));
          padding-bottom: 0.75rem;
        }
        .crm-sidebar-panel-head h3 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--db-tx, #000);
          margin: 0;
        }
        
        /* Timeline style for sidebar */
        .crm-timeline-body {
          display: flex;
          flex-direction: column;
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
          background: var(--db-gold, #c5a880);
        }
        .crm-timeline-line {
          width: 1px;
          flex: 1;
          background: var(--db-bd, rgba(0,0,0,0.05));
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
          padding: 1px 4px;
          border-radius: 3px;
        }
        .crm-timeline-desc {
          font-size: 0.725rem;
          color: var(--db-tx3, #777);
          margin: 2px 0 0 0;
        }

        /* Priority Colors */
        .crm-badge-high { background: #FEF2F2; color: #EF4444; }
        .crm-badge-normal { background: #EFF6FF; color: #3B82F6; }
        .crm-badge-low { background: #F1F5F9; color: #64748B; }

        @media (max-width: 900px) {
          .crm-two-columns-row {
            grid-template-columns: 1fr;
          }
          .crm-panel-widget {
            height: auto;
          }
        }

        @media (max-width: 768px) {
          .crm-lead-card {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 0.875rem !important;
            padding: 1.25rem !important;
          }
          .crm-lead-left {
            align-items: flex-start !important;
            flex-wrap: wrap !important;
            gap: 0.75rem !important;
          }
          .crm-lead-badge-container {
            order: 2 !important;
          }
          .crm-lead-info {
            order: 3 !important;
            flex: 1 1 100% !important;
          }
          .crm-lead-right {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            border-top: 1px dashed var(--db-bd, rgba(0,0,0,0.06));
            padding-top: 0.75rem !important;
            margin-top: 0.25rem !important;
          }
          .crm-lead-actions {
            position: absolute !important;
            top: 1.25rem !important;
            right: 1.25rem !important;
            margin-left: 0 !important;
          }
          .crm-leads-tabs {
            overflow-x: auto !important;
            white-space: nowrap !important;
            width: 100% !important;
            -webkit-overflow-scrolling: touch;
          }
          .crm-leads-tabs button {
            flex-shrink: 0 !important;
          }
        }
        @media (max-width: 600px) {
          .db-search-inline {
            width: 100% !important;
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
}
