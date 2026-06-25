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
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'my'|'unassigned_buy'|'unassigned_sell'>('my');
  const [counts, setCounts] = useState({ my: 0, buy: 0, sell: 0 });
  const supabase = createClient();

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3000); };

  const load = useCallback(async () => {
    if (!employee) return;
    setLoading(true);
    const now = new Date();
    const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);

    try {
      // Fetch both assigned and unassigned leads to calculate counts and display the current tab's leads
      const [assignedRes, unassignedRes, myFURes] = await Promise.all([
        fetch(`/api/leads?assigned_to=${employee.id}`),
        fetch('/api/leads?assigned_to=unassigned'),
        supabase
          .from('follow_ups')
          .select('*, lead:leads!lead_id(customer_name,phone)')
          .eq('employee_id', employee.id)
          .eq('status', 'pending')
          .lte('scheduled_at', todayEnd.toISOString())
          .order('scheduled_at')
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

      if (myFURes.data) {
        setFollowUps(myFURes.data as any[]);
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
          { label: "Today's Follow-ups", count: followUps.length, icon: <CheckSquare size={20} />, color: '#ef4444', bg: 'rgba(239,68,68,.07)' }
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

      {/* Tabs Header and Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--db-bd, rgba(0,0,0,0.06))', paddingBottom: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', background: 'var(--db-sf2, #f5f5f5)', padding: '5px', borderRadius: '12px', gap: '4px' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '12px', background: stage?.bg, color: stage?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 850, fontSize: '1rem', flexShrink: 0, fontFamily: "'Outfit', sans-serif" }}>
                    {lead.customer_name.charAt(0)}
                  </div>

                  {/* Buyer/Seller label on the left side of the lead */}
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ color: '#000000', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.375rem 0.625rem', borderRadius: '8px', background: isSell ? 'rgba(255, 122, 0, 0.1)' : 'rgba(59, 130, 246, 0.1)', border: `1px solid ${isSell ? 'rgba(255, 122, 0, 0.2)' : 'rgba(59, 130, 246, 0.2)'}` }}>
                      {isSell ? 'SELLER' : 'BUYER'}
                    </span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--db-tx, #000)', marginBottom: '2px' }}>{lead.customer_name}</div>
                    <div style={{ fontSize: '.8125rem', color: 'var(--db-tx2, #555)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span>{lead.phone}</span>
                      {lead.interested_car && (
                        <>
                          <span style={{ opacity: 0.5 }}>·</span>
                          <span style={{ fontWeight: 700, color: 'var(--db-tx, #000)' }}>{lead.interested_car}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{ background: stage?.bg, color: stage?.color, fontSize: '.75rem', fontWeight: 800, padding: '.35rem .75rem', borderRadius: '100px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    {stage?.label}
                  </span>
                  <span style={{ fontSize: '.8125rem', fontWeight: 700, color: 'var(--db-tx3, #777)' }}>{formatBudget(lead.budget)}</span>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: '.5rem' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `tel:${lead.phone}`;
                    }}
                    style={{ 
                      width: 36, 
                      height: 36, 
                      background: 'rgba(59,130,246,.08)', 
                      color: '#3b82f6', 
                      border: '1px solid rgba(59,130,246,.15)', 
                      borderRadius: '10px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      transition: 'all 0.2s',
                      cursor: 'pointer'
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
        .icon-action-btn:hover {
          background: rgba(59,130,246,.15) !important;
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
