'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, Filter, Phone, MessageCircle } from 'lucide-react';
import { FOLLOW_UP_TYPE_LABELS, type FollowUp } from '@/types/crm';

type Section = 'today' | 'missed' | 'upcoming';

export default function FollowUpsPage() {
  const [section, setSection] = useState<Section>('today');
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [toast, setToast] = useState('');
  const [myId, setMyId] = useState<string|null>(null);
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
            <motion.div key={fu.id} className="crm-fu-card" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*.04}}
              style={isOverdue ? {borderLeftColor:'#E10613'} : {}}>
              <div className="crm-fu-card-left">
                <div className={`crm-type-chip ${fu.follow_up_type}`}>{FOLLOW_UP_TYPE_LABELS[fu.follow_up_type]}</div>
                <span className={`crm-prio-dot ${fu.priority}`}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:'.9375rem',color:'var(--db-tx)'}}>{lead?.customer_name||'—'}</div>
                <div style={{fontSize:'.8125rem',color:'var(--db-tx3)',marginTop:2}}>
                  {dt.toLocaleDateString('en-IN')} at {dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                  {emp?.name && <> · {emp.name}</>}
                </div>
                {fu.notes&&<div style={{fontSize:'.8125rem',color:'var(--db-tx2)',marginTop:4,fontStyle:'italic'}}>"{fu.notes}"</div>}
              </div>
              <div style={{display:'flex',gap:'.5rem',flexShrink:0,flexWrap:'wrap',justifyContent:'flex-end'}}>
                {lead?.phone&&<>
                  <a href={`tel:${lead.phone}`} className="crm-action-btn" style={{padding:'.4rem .75rem',fontSize:'.75rem'}}><Phone size={13}/>Call</a>
                  <a href={`https://wa.me/${lead.phone.replace(/\D/g,'')}`} target="_blank" className="crm-action-btn wa" style={{padding:'.4rem .75rem',fontSize:'.75rem'}}><MessageCircle size={13}/>WA</a>
                </>}
                <button onClick={()=>complete(fu.id, fu.lead_id)} className="crm-btn-complete"><CheckCircle2 size={14}/>Done</button>
                {section==='today'&&<button onClick={()=>markMissed(fu.id)} className="crm-btn-missed">Miss</button>}
              </div>
            </motion.div>
          );
        })}
      </div>

      {toast&&<div className="db-toast success" style={{position:'fixed',bottom:'1.5rem',right:'1.5rem'}}>{toast}</div>}

      <style jsx>{`
.crm-view-btn{display:flex;align-items:center;gap:.375rem;background:var(--db-sf);border:1px solid var(--db-bd);color:var(--db-tx2);padding:.5rem .875rem;border-radius:9px;font-size:.8125rem;font-family:inherit;cursor:pointer;transition:all .2s}
.crm-view-btn.active,.crm-view-btn:hover{border-color:var(--db-gold);color:var(--db-gold)}
.crm-fu-card{display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;background:var(--db-sf);border:1px solid var(--db-bd);border-radius:14px;border-left:3px solid var(--db-bd);transition:all .2s;flex-wrap:wrap}
.crm-fu-card:hover{border-color:var(--db-gold)}
.crm-fu-card-left{display:flex;flex-direction:column;align-items:center;gap:.5rem;flex-shrink:0}
.crm-type-chip{font-size:.6875rem;font-weight:700;padding:.25rem .625rem;border-radius:99px;text-transform:capitalize;background:var(--db-sf2);color:var(--db-tx2);border:1px solid var(--db-bd)}
.crm-type-chip.call{background:rgba(59,130,246,.12);color:#3b82f6;border-color:rgba(59,130,246,.25)}
.crm-type-chip.whatsapp{background:rgba(34,197,94,.12);color:#22c55e;border-color:rgba(34,197,94,.25)}
.crm-type-chip.email{background:rgba(245,158,11,.12);color:#f59e0b;border-color:rgba(245,158,11,.25)}
.crm-type-chip.meeting{background:rgba(139,92,246,.12);color:#8b5cf6;border-color:rgba(139,92,246,.25)}
.crm-prio-dot{width:8px;height:8px;border-radius:50%}
.crm-prio-dot.high{background:#E10613}
.crm-prio-dot.normal{background:#3b82f6}
.crm-prio-dot.low{background:var(--db-tx3)}
.crm-action-btn{display:flex;align-items:center;gap:.3rem;padding:.5rem .875rem;border-radius:9px;font-size:.8125rem;font-weight:600;text-decoration:none;border:1px solid var(--db-bd);color:var(--db-tx2);transition:all .2s;background:var(--db-sf);cursor:pointer}
.crm-action-btn:hover{border-color:#3b82f6;color:#3b82f6}
.crm-action-btn.wa:hover{border-color:#22c55e;color:#22c55e}
.crm-btn-complete{display:flex;align-items:center;gap:.3rem;background:rgba(34,197,94,.1);color:#22c55e;border:1px solid rgba(34,197,94,.3);padding:.4rem .875rem;border-radius:9px;font-size:.8125rem;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit}
.crm-btn-complete:hover{background:rgba(34,197,94,.2)}
.crm-btn-missed{background:rgba(225,6,19,.08);color:#E10613;border:1px solid rgba(225,6,19,.2);padding:.4rem .875rem;border-radius:9px;font-size:.8125rem;font-weight:600;cursor:pointer;font-family:inherit}
.crm-skel{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:14px;animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
      `}</style>
    </div>
  );
}
