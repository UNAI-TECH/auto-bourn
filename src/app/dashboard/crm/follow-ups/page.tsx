'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, Filter, Phone, MessageCircle, Calendar, X, User } from 'lucide-react';
import { FOLLOW_UP_TYPE_LABELS, type FollowUp } from '@/types/crm';

type Section = 'today' | 'missed' | 'upcoming' | 'pending';

export default function FollowUpsPage() {
  const [section, setSection] = useState<Section>('today');
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [toast, setToast] = useState('');
  const [myId, setMyId] = useState<string|null>(null);
  const [notifiedIds, setNotifiedIds] = useState<string[]>([]);
  const [nearingFollowUp, setNearingFollowUp] = useState<FollowUp | null>(null);
  const supabase = createClient();

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);

    let q = supabase.from('follow_ups')
      .select('*, lead:leads!lead_id(customer_name,phone), employee:employees!employee_id(name)')
      .order('scheduled_at', { ascending: section !== 'missed' });

    if (section === 'today') {
      q = q.eq('status','pending').gte('scheduled_at', todayStart.toISOString()).lte('scheduled_at', todayEnd.toISOString());
    } else if (section === 'missed') {
      q = q.or(`status.eq.missed,and(status.eq.pending,scheduled_at.lt.${todayStart.toISOString()})`);
    } else if (section === 'upcoming') {
      q = q.eq('status','pending').gt('scheduled_at', todayEnd.toISOString());
    } else if (section === 'pending') {
      q = q.eq('status','pending');
    }

    if (typeFilter !== 'all') q = q.eq('follow_up_type', typeFilter);
    const { data } = await q;
    setFollowUps((data||[]) as FollowUp[]);
    setLoading(false);
  }, [section, typeFilter]);

  useEffect(() => { load(); }, [load]);

  // Request browser notification permissions
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Poll for background data updates every 30 seconds
  useEffect(() => {
    const poll = setInterval(() => {
      load();
    }, 30000);
    return () => clearInterval(poll);
  }, [load]);

  // Check for upcoming / nearing follow-ups
  useEffect(() => {
    const checkUpcoming = () => {
      const now = new Date().getTime();
      const tenMinutes = 10 * 60 * 1000;
      const fiveMinutes = 5 * 60 * 1000;

      const near = followUps.find(fu => {
        if (fu.status !== 'pending') return false;
        if (notifiedIds.includes(fu.id)) return false;

        const scheduledTime = new Date(fu.scheduled_at).getTime();
        const diff = scheduledTime - now;

        // Next 10 minutes OR overdue within last 5 minutes
        return (diff > 0 && diff <= tenMinutes) || (diff < 0 && Math.abs(diff) <= fiveMinutes);
      });

      if (near) {
        setNotifiedIds(prev => [...prev, near.id]);
        setNearingFollowUp(near);

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const leadObj = near.lead as { customer_name: string; phone: string } | null;
          new Notification('📅 Follow-up Due Now!', {
            body: `Your follow-up with ${leadObj?.customer_name || 'Customer'} is scheduled at ${new Date(near.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}.`,
            tag: near.id,
            requireInteraction: true
          });
        }
      }
    };

    const interval = setInterval(checkUpcoming, 15000);
    checkUpcoming();

    return () => clearInterval(interval);
  }, [followUps, notifiedIds]);

  useEffect(() => {
    supabase.auth.getUser().then(({data:{user}}) => {
      if (!user) return;
      supabase.from('employees').select('id').eq('auth_user_id',user.id).single().then(({data})=>{ if(data) setMyId(data.id); });
    });
  }, []);

  const complete = async (id: string, leadId: string) => {
    await supabase.from('follow_ups').update({ status:'completed', completed_at:new Date().toISOString() }).eq('id',id);
    await supabase.from('crm_activity_logs').insert({ lead_id:leadId, employee_id:myId, action:'follow_up_completed', details:'Follow-up marked as completed' });
    load(); showToast('Follow-up completed!');
  };

  const markMissed = async (id: string) => {
    await supabase.from('follow_ups').update({ status:'missed' }).eq('id',id);
    load(); showToast('Marked as missed');
  };

  const sectionConfig = {
    today: { label:"Today's Follow-ups", icon: Clock, color:'#f59e0b' },
    upcoming: { label:'Upcoming', icon: ArrowRight, color:'#6366f1' },
    pending: { label:'Pending', icon: Calendar, color:'#a855f7' },
    missed: { label:'Missed Follow-ups', icon: AlertTriangle, color:'#E10613' },
  };

  return (
    <div className="db-page" style={{padding:0}}>
      <div style={{marginBottom:'1.25rem'}}>
        <h1 className="db-page-title">Follow-up Manager</h1>
        <p className="db-page-sub">Track, complete, and manage all customer follow-ups</p>
      </div>

      {/* Section tabs */}
      <div style={{display:'flex',gap:'.5rem',marginBottom:'1.25rem',flexWrap:'wrap'}}>
        {(Object.keys(sectionConfig) as Section[]).map(s => {
          const cfg = sectionConfig[s];
          return (
            <button key={s} onClick={()=>setSection(s)} className={`crm-view-btn ${section===s?'active':''}`}
              style={section===s ? {borderColor:cfg.color,color:cfg.color,background:`${cfg.color}12`} : {}}>
              <cfg.icon size={14}/>{cfg.label}
            </button>
          );
        })}
        <div className="car-select-wrap" style={{marginLeft:'auto'}}>
          <Filter size={13}/>
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
            <option value="all">All Types</option>
            {Object.entries(FOLLOW_UP_TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'.625rem'}}>
        {loading ? Array(5).fill(0).map((_,i)=><div key={i} className="crm-skel" style={{height:72}}/>) :
        followUps.length === 0 ? (
          <div style={{textAlign:'center',padding:'3rem',color:'var(--db-tx3)'}}>
            <CheckCircle2 size={40} style={{margin:'0 auto .75rem',opacity:.4}}/>
            <p>No {section} follow-ups</p>
          </div>
        ) :
        followUps.map((fu, i) => {
          const lead = fu.lead as {customer_name:string;phone:string}|null;
          const emp = fu.employee as {name:string}|null;
          const dt = new Date(fu.scheduled_at);
          const isOverdue = dt < new Date() && fu.status === 'pending';
          return (
            <motion.div key={fu.id} className="crm-fu-card" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*.04}}>
              <div className="crm-fu-top">
                <div className="crm-fu-left">
                  <div className={`crm-status-dot ${fu.priority}`} />
                  <div>
                    <strong className="crm-customer-name">{lead?.customer_name||'—'}</strong>
                    {emp?.name && <span className="crm-assigned-emp">Assigned to {emp.name}</span>}
                  </div>
                </div>
                
                <div className="crm-fu-meta">
                  <span className="crm-date-pill">
                    <Calendar size={12} />
                    {dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                  
                  <span className={`crm-type-tag ${fu.follow_up_type}`}>
                    {fu.follow_up_type}
                  </span>

                  {isOverdue && (
                    <span className="crm-overdue-tag">
                      <Clock size={12} /> Overdue
                    </span>
                  )}

                  {fu.status === 'missed' && (
                    <span className="crm-overdue-tag" style={{ background: 'rgba(225,6,19,0.15)', color: '#E10613' }}>
                      <AlertTriangle size={12} /> Missed
                    </span>
                  )}
                  
                  <div className="crm-actions-row">
                    {lead?.phone && (
                      <>
                        <a href={`tel:${lead.phone}`} className="crm-action-badge call" title="Call">
                          <Phone size={12} /> Call
                        </a>
                        <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" className="crm-action-badge wa" title="WhatsApp">
                          <MessageCircle size={12} /> WA
                        </a>
                      </>
                    )}
                    <button onClick={() => complete(fu.id, fu.lead_id)} className="crm-action-badge done">
                      <CheckCircle2 size={12} /> Done
                    </button>
                    {fu.status === 'pending' && (
                      <button onClick={() => markMissed(fu.id)} className="crm-action-badge miss">
                        <X size={12} /> Miss
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {fu.notes && (
                <div className="crm-fu-body">
                  <div className="crm-notes-box">
                    <label>Note / Feedback</label>
                    <p>{fu.notes}</p>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Nearing Follow-up In-app Modal */}
      <AnimatePresence>
        {nearingFollowUp && (
          <div className="fu-popup-overlay" onClick={() => setNearingFollowUp(null)}>
            <motion.div 
              className="fu-popup-card" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            >
              <div className="fu-popup-header">
                <div className="fu-popup-icon-wrap">
                  <Clock className="fu-pulse-icon" size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3>Follow-up Due Now</h3>
                  <p>An upcoming customer task requires attention</p>
                </div>
                <button className="fu-popup-close" onClick={() => setNearingFollowUp(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="fu-popup-body">
                <div className="fu-popup-grid">
                  <div className="fu-popup-field">
                    <span className="field-label">
                      <User size={12} style={{ marginRight: '4px', display: 'inline-block' }} />
                      Customer
                    </span>
                    <span className="field-value">{(nearingFollowUp.lead as any)?.customer_name || '—'}</span>
                  </div>

                  <div className="fu-popup-field">
                    <span className="field-label">
                      <Clock size={12} style={{ marginRight: '4px', display: 'inline-block' }} />
                      Scheduled Time
                    </span>
                    <span className="field-value time-highlight">
                      {new Date(nearingFollowUp.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>
                </div>

                {nearingFollowUp.notes && (
                  <div className="fu-popup-field note-field">
                    <span className="field-label">Instructions / Note</span>
                    <div className="field-notes">
                      <p>{nearingFollowUp.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="fu-popup-footer">
                {(nearingFollowUp.lead as any)?.phone && (
                  <>
                    <a 
                      href={`tel:${(nearingFollowUp.lead as any).phone}`} 
                      onClick={() => setNearingFollowUp(null)}
                      className="popup-btn popup-btn-call"
                    >
                      <Phone size={14} /> Call
                    </a>
                    <a 
                      href={`https://wa.me/${(nearingFollowUp.lead as any).phone.replace(/\D/g,'')}`} 
                      target="_blank" 
                      onClick={() => setNearingFollowUp(null)}
                      className="popup-btn popup-btn-wa"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </>
                )}
                <button 
                  onClick={async () => {
                    const id = nearingFollowUp.id;
                    const leadId = nearingFollowUp.lead_id;
                    setNearingFollowUp(null);
                    await complete(id, leadId);
                  }}
                  className="popup-btn popup-btn-done"
                >
                  <CheckCircle2 size={14} /> Done
                </button>
                <button className="popup-btn popup-btn-dismiss" onClick={() => setNearingFollowUp(null)}>
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {toast&&<div className="db-toast success" style={{position:'fixed',bottom:'1.5rem',right:'1.5rem'}}>{toast}</div>}

      <style jsx>{`
.crm-view-btn{display:flex;align-items:center;gap:.375rem;background:var(--db-sf);border:1px solid var(--db-bd);color:var(--db-tx2);padding:.5rem .875rem;border-radius:9px;font-size:.8125rem;font-family:inherit;cursor:pointer;transition:all .2s}
.crm-view-btn.active,.crm-view-btn:hover{border-color:var(--db-gold);color:var(--db-gold)}

.crm-fu-card {
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition: border-color .2s;
}

.crm-fu-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.5rem;
  gap: 1rem;
}

.crm-fu-left {
  display: flex;
  align-items: center;
  gap: .875rem;
}

.crm-status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}
.crm-status-dot.high { background: #E10613; }
.crm-status-dot.normal { background: #3b82f6; }
.crm-status-dot.low { background: #64748b; }

.crm-customer-name {
  display: block;
  font-size: .9375rem;
  font-weight: 700;
  color: var(--db-tx);
}

.crm-assigned-emp {
  display: block;
  font-size: .75rem;
  color: var(--db-tx3);
  margin-top: 1px;
}

.crm-fu-meta {
  display: flex;
  align-items: center;
  gap: .75rem;
  flex-wrap: wrap;
}

.crm-date-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: .75rem;
  color: var(--db-tx2);
  font-weight: 600;
}

.crm-type-tag {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: .7rem;
  font-weight: 700;
  text-transform: capitalize;
}
.crm-type-tag.call { background: rgba(59,130,246,0.1); color: #3b82f6; }
.crm-type-tag.whatsapp { background: rgba(34,197,94,0.1); color: #22c55e; }
.crm-type-tag.email { background: rgba(245,158,11,0.1); color: #f59e0b; }
.crm-type-tag.meeting { background: rgba(139,92,246,0.1); color: #8b5cf6; }

.crm-overdue-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: .7rem;
  font-weight: 700;
  background: rgba(225,6,19,0.1);
  color: #E10613;
}

.crm-actions-row {
  display: flex;
  align-items: center;
  gap: .4rem;
}

.crm-action-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: .7rem;
  font-weight: 700;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  background: var(--db-sf);
}
.crm-action-badge.call {
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.2);
}
.crm-action-badge.call:hover {
  background: #3b82f6;
  color: #fff;
}
.crm-action-badge.wa {
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.2);
}
.crm-action-badge.wa:hover {
  background: #22c55e;
  color: #fff;
}
.crm-action-badge.done {
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.2);
}
.crm-action-badge.done:hover {
  background: #22c55e;
  color: #fff;
}
.crm-action-badge.miss {
  color: #E10613;
  border-color: rgba(225, 6, 19, 0.2);
}
.crm-action-badge.miss:hover {
  background: #E10613;
  color: #fff;
}

.crm-fu-body {
  padding: 1.25rem 1.5rem 1.5rem;
  border-top: 1px solid var(--db-bd);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.crm-notes-box {
  background: var(--db-sf2);
  border: 1px solid var(--db-bd);
  border-radius: 14px;
  padding: 1rem 1.25rem;
}
.crm-notes-box label {
  font-size: .7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--db-tx3);
  display: block;
  margin-bottom: .5rem;
}
.crm-notes-box p {
  font-size: .875rem;
  color: var(--db-tx);
  margin: 0;
  line-height: 1.6;
}

.crm-skel {
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  border-radius: 18px;
  height: 60px;
  animation: pulse 1.5s infinite;
}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}

@media (max-width: 768px) {
  .crm-fu-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.1rem 1.1rem;
  }
  .crm-fu-meta {
    width: 100%;
    gap: .5rem;
    flex-direction: column;
    align-items: stretch;
  }
  .crm-actions-row {
    width: 100%;
    margin-top: 0.25rem;
    display: flex;
  }
  .crm-action-badge {
    flex: 1;
    justify-content: center;
    font-size: 0.75rem;
    padding: 6px 6px;
  }
}

/* Nearing Follow-up Alert Box Style */
:global(.fu-popup-overlay) {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1.5rem;
}

:global(.fu-popup-card) {
  background: #ffffff !important;
  border: 1px solid var(--platinum, #ECECEC) !important;
  border-radius: var(--radius-xl, 24px) !important;
  width: 100%;
  max-width: 460px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.12),
    0 2px 10px rgba(0, 0, 0, 0.05) !important;
  overflow: hidden;
}

:global(.fu-popup-header) {
  padding: 1.5rem 1.75rem !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
  display: flex !important;
  align-items: center !important;
  gap: 1.25rem !important;
  position: relative !important;
  background: #ffffff !important;
}

:global(.fu-popup-header) h3 {
  font-family: var(--font-primary), 'Outfit', sans-serif !important;
  font-size: 1.35rem !important;
  font-weight: 800 !important;
  letter-spacing: -0.02em !important;
  color: var(--graphite, #2A2A2A) !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}

:global(.fu-popup-header) h3::after {
  content: '' !important;
  display: inline-block !important;
  width: 6px !important;
  height: 6px !important;
  border-radius: 50% !important;
  background: var(--brand-red, #E10613) !important;
  box-shadow: 0 0 8px var(--brand-red, #E10613) !important;
}

:global(.fu-popup-header) p {
  font-size: 0.8125rem !important;
  font-weight: 500 !important;
  color: var(--graphite-muted, #8A8A8A) !important;
  margin: 0.25rem 0 0 0 !important;
}

:global(.fu-popup-icon-wrap) {
  width: 48px !important;
  height: 48px !important;
  border-radius: 14px !important;
  background: linear-gradient(135deg, var(--brand-red, #E10613) 0%, #ff4b55 100%) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: var(--white, #ffffff) !important;
  flex-shrink: 0 !important;
  box-shadow: 0 8px 20px rgba(225, 6, 19, 0.25) !important;
}

:global(.fu-pulse-icon) {
  animation: pulse-ring 2s infinite ease-in-out !important;
}

@keyframes pulse-ring {
  0% { transform: scale(0.95); opacity: 0.9; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.9; }
}

:global(.fu-popup-close) {
  background: rgba(0, 0, 0, 0.03) !important;
  border: none !important;
  color: var(--graphite-light, #4A4A4A) !important;
  cursor: pointer !important;
  padding: 8px !important;
  border-radius: 50% !important;
  transition: all 0.2s ease !important;
  display: flex !important;
}
:global(.fu-popup-close):hover {
  background: rgba(0, 0, 0, 0.08) !important;
  color: var(--brand-red, #E10613) !important;
  transform: rotate(90deg) !important;
}

:global(.fu-popup-body) {
  padding: 1.75rem !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 1.25rem !important;
}

:global(.fu-popup-grid) {
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 1.25rem !important;
}

:global(.fu-popup-field) {
  display: flex !important;
  flex-direction: column !important;
  gap: 0.375rem !important;
}

:global(.fu-popup-field.note-field) {
  grid-column: span 2 !important;
}

:global(.field-label) {
  font-size: 0.72rem !important;
  font-weight: 800 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.06em !important;
  color: var(--graphite-muted, #8A8A8A) !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
}

:global(.field-value) {
  font-size: 1.05rem !important;
  font-weight: 700 !important;
  color: var(--graphite, #2A2A2A) !important;
  word-break: break-word !important;
}

:global(.field-value.time-highlight) {
  color: var(--brand-red, #E10613) !important;
  background: rgba(225, 6, 19, 0.05) !important;
  padding: 2px 8px !important;
  border-radius: 6px !important;
  display: inline-block !important;
  width: fit-content !important;
}

:global(.field-notes) {
  font-size: 0.875rem !important;
  color: var(--graphite-light, #4A4A4A) !important;
  background: var(--luxury-silver, #F5F5F5) !important;
  padding: 0.875rem 1.125rem !important;
  border-radius: 12px !important;
  border: 1px solid rgba(0, 0, 0, 0.06) !important;
  border-left: 3px solid var(--brand-red, #E10613) !important;
  line-height: 1.5 !important;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.02) !important;
}

:global(.field-notes) p {
  margin: 0 !important;
}

:global(.fu-popup-footer) {
  padding: 1.25rem 1.75rem !important;
  border-top: 1px solid rgba(0, 0, 0, 0.05) !important;
  background: var(--luxury-silver, #F5F5F5) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  gap: 0.75rem !important;
  flex-wrap: wrap !important;
}

:global(.popup-btn) {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  padding: 0.625rem 1.25rem !important;
  border-radius: 12px !important;
  font-size: 0.8125rem !important;
  font-weight: 700 !important;
  cursor: pointer !important;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
  font-family: inherit !important;
  text-decoration: none !important;
  border: 1px solid transparent !important;
}

:global(.popup-btn-call) {
  background: rgba(59, 130, 246, 0.08) !important;
  border-color: rgba(59, 130, 246, 0.15) !important;
  color: #2563eb !important;
}
:global(.popup-btn-call):hover {
  background: #2563eb !important;
  color: #ffffff !important;
  border-color: transparent !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25) !important;
}

:global(.popup-btn-wa) {
  background: rgba(34, 197, 94, 0.08) !important;
  border-color: rgba(34, 197, 94, 0.15) !important;
  color: #16a34a !important;
}
:global(.popup-btn-wa):hover {
  background: #16a34a !important;
  color: #ffffff !important;
  border-color: transparent !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(22, 163, 74, 0.25) !important;
}

:global(.popup-btn-done) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3) !important;
}
:global(.popup-btn-done):hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4) !important;
}

:global(.popup-btn-dismiss) {
  background: transparent !important;
  border-color: rgba(0, 0, 0, 0.15) !important;
  color: var(--graphite-light, #4A4A4A) !important;
}
:global(.popup-btn-dismiss):hover {
  background: rgba(0, 0, 0, 0.04) !important;
  border-color: rgba(0, 0, 0, 0.25) !important;
}

@media (max-width: 480px) {
  :global(.fu-popup-grid) {
    grid-template-columns: 1fr !important;
    gap: 1rem !important;
  }
  :global(.fu-popup-field.note-field) {
    grid-column: span 1 !important;
  }
  :global(.fu-popup-footer) {
    flex-direction: column !important;
    align-items: stretch !important;
    padding: 1.25rem !important;
  }
  :global(.popup-btn) {
    justify-content: center !important;
    width: 100% !important;
  }
}
      `}</style>
    </div>
  );
}
