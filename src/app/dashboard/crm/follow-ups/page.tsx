'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, Filter, Phone, MessageCircle, Calendar, X } from 'lucide-react';
import { FOLLOW_UP_TYPE_LABELS, type FollowUp } from '@/types/crm';

type Section = 'today' | 'missed' | 'upcoming';

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
      q = q.eq('status','pending').lt('scheduled_at', todayStart.toISOString());
    } else {
      q = q.eq('status','pending').gt('scheduled_at', todayEnd.toISOString());
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
    missed: { label:'Missed Follow-ups', icon: AlertTriangle, color:'#E10613' },
    upcoming: { label:'Upcoming', icon: ArrowRight, color:'#6366f1' },
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
                    {section === 'today' && (
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
                <div className="fu-popup-field">
                  <span className="field-label">Customer</span>
                  <span className="field-value">{(nearingFollowUp.lead as any)?.customer_name || '—'}</span>
                </div>

                <div className="fu-popup-field">
                  <span className="field-label">Scheduled Time</span>
                  <span className="field-value">
                    {new Date(nearingFollowUp.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </div>

                {nearingFollowUp.notes && (
                  <div className="fu-popup-field">
                    <span className="field-label">Instructions / Note</span>
                    <span className="field-notes">{nearingFollowUp.notes}</span>
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
.fu-popup-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1.5rem;
}

.fu-popup-card {
  background: var(--white);
  border: 1px solid var(--platinum);
  border-radius: 24px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.12);
  overflow: hidden;
}

.fu-popup-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--platinum);
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}
.fu-popup-header h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--graphite);
  margin: 0;
}
.fu-popup-header p {
  font-size: 0.8125rem;
  color: var(--graphite-light);
  margin: 0.125rem 0 0 0;
}

.fu-popup-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(225, 6, 19, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-red);
  flex-shrink: 0;
}

.fu-pulse-icon {
  animation: pulse-ring 1.5s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(0.95); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.8; }
}

.fu-popup-close {
  background: none;
  border: none;
  color: var(--graphite-light);
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
}
.fu-popup-close:hover {
  background: var(--luxury-silver);
  color: var(--graphite);
}

.fu-popup-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
}

.fu-popup-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.field-label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--graphite-muted);
}
.field-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--graphite);
}
.field-notes {
  font-size: 0.875rem;
  color: var(--graphite-light);
  background: var(--luxury-silver);
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid var(--platinum);
  line-height: 1.5;
}

.fu-popup-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--platinum);
  background: var(--luxury-silver);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.popup-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.625rem 1.125rem;
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  text-decoration: none;
  border: 1px solid transparent;
}

.popup-btn-call {
  background: var(--white);
  border-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}
.popup-btn-call:hover {
  background: rgba(59, 130, 246, 0.05);
}

.popup-btn-wa {
  background: var(--white);
  border-color: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}
.popup-btn-wa:hover {
  background: rgba(34, 197, 94, 0.05);
}

.popup-btn-done {
  background: #22c55e;
  color: var(--white);
}
.popup-btn-done:hover {
  background: #16a34a;
}

.popup-btn-dismiss {
  background: none;
  border-color: var(--platinum);
  color: var(--graphite-light);
}
.popup-btn-dismiss:hover {
  background: rgba(0,0,0,0.03);
}

@media (max-width: 480px) {
  .fu-popup-footer {
    flex-direction: column;
    align-items: stretch;
  }
  .popup-btn {
    justify-content: center;
  }
}
      `}</style>
    </div>
  );
}
