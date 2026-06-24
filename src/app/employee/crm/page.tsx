'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Plus, Search, Phone, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { useEmpContext } from '../layout';
import { LEAD_STAGES, FOLLOW_UP_TYPE_LABELS, formatBudget, type Lead, type FollowUp } from '@/types/crm';


export default function EmployeeCRMPage() {
  const { employee } = useEmpContext();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const supabase = createClient();

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3000); };

  const load = useCallback(async () => {
    if (!employee) return;
    setLoading(true);
    const now = new Date();
    const todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);
    const [{ data:myLeads }, { data:myFU }] = await Promise.all([
      supabase.from('leads').select('*').eq('assigned_to', employee.id).order('updated_at',{ascending:false}),
      supabase.from('follow_ups').select('*, lead:leads!lead_id(customer_name,phone)').eq('employee_id',employee.id).eq('status','pending').lte('scheduled_at',todayEnd.toISOString()).order('scheduled_at'),
    ]);
    setLeads((myLeads||[]) as Lead[]);
    setFollowUps((myFU||[]) as FollowUp[]);
    setLoading(false);
  }, [employee]);

  useEffect(() => { load(); }, [load]);

  const completeFollowUp = async (fuId: string) => {
    await supabase.from('follow_ups').update({ status:'completed', completed_at:new Date().toISOString() }).eq('id',fuId);
    load(); showToast('Follow-up done!');
  };

  const filtered = leads.filter(l =>
    !search || l.customer_name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search)
  );

  const stats = {
    total: leads.length,
    active: leads.filter(l=>!['sold','lost'].includes(l.lead_status)).length,
    sold: leads.filter(l=>l.lead_status==='sold').length,
    todayFU: followUps.filter(f=>{ const d=new Date(f.scheduled_at); const now=new Date(); return d.toDateString()===now.toDateString(); }).length,
  };

  return (
    <div style={{padding:0}}>
      <div className="db-page-header">
        <div className="db-page-title-container">
          <h1 className="db-page-title">My Leads (CRM)</h1>
          <p className="db-page-sub">Manage your assigned customer leads</p>
        </div>
        <Link 
          href="/employee/customer-details" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: '#E10613',
            color: '#ffffff',
            border: 'none',
            padding: '0.625rem 1.25rem',
            borderRadius: '10px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textDecoration: 'none',
            boxShadow: '0 4px 15px rgba(225, 6, 19, 0.2)'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#c70511'}
          onMouseLeave={e => e.currentTarget.style.background = '#E10613'}
        >
          <Plus size={15}/>Add Customer
        </Link>
      </div>

      {/* Quick stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:'.75rem',marginBottom:'1.25rem'}}>
        {[
          {label:'Total',value:stats.total,color:'#3b82f6'},
          {label:'Active',value:stats.active,color:'#f59e0b'},
          {label:'Sold',value:stats.sold,color:'#22c55e'},
          {label:"Today's FU",value:stats.todayFU,color:'#E10613'},
        ].map(s=>(
          <div key={s.label} style={{background:'var(--db-sf, #ffffff)',border:'1px solid var(--db-bd, rgba(0,0,0,0.08))',borderRadius:14,padding:'1rem',textAlign:'center',boxShadow:'0 4px 10px rgba(0,0,0,0.02)'}}>
            <div style={{fontWeight:800,fontSize:'1.5rem',color:s.color,fontFamily:"'Outfit',sans-serif"}}>{s.value}</div>
            <div style={{fontSize:'.75rem',color:'var(--db-tx2, #555555)',fontWeight:600}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Today's follow-ups */}
      {followUps.length>0&&(
        <div style={{background:'rgba(225,6,19,.03)',border:'1.5px solid rgba(225,6,19,.12)',borderRadius:16,padding:'1.25rem',marginBottom:'1.5rem'}}>
          <div style={{fontWeight:700,fontSize:'.875rem',color:'#E10613',marginBottom:'.75rem',display:'flex',alignItems:'center',gap:'.5rem'}}><Clock size={15}/>Pending Follow-ups ({followUps.length})</div>
          {followUps.slice(0,5).map(fu=>{
            const lead = fu.lead as {customer_name:string;phone:string}|null;
            return (
              <div key={fu.id} style={{display:'flex',alignItems:'center',gap:'.75rem',padding:'.75rem 0',borderBottom:'1.5px solid var(--db-bd, rgba(0,0,0,0.05))'}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:'.875rem',color:'var(--db-tx, #000000)'}}>{lead?.customer_name||'—'}</div>
                  <div style={{fontSize:'.75rem',color:'var(--db-tx2, #555555)'}}>{FOLLOW_UP_TYPE_LABELS[fu.follow_up_type]} · {new Date(fu.scheduled_at).toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <a href={`tel:${lead?.phone}`} style={{background:'rgba(59,130,246,.1)',color:'#3b82f6',border:'1px solid rgba(59,130,246,.25)',padding:'.35rem .625rem',borderRadius:8,fontSize:'.75rem',display:'flex',alignItems:'center',gap:4,textDecoration:'none',fontWeight:600}}><Phone size={12}/>Call</a>
                <button onClick={()=>completeFollowUp(fu.id)} style={{background:'rgba(34,197,94,.1)',color:'#22c55e',border:'1px solid rgba(34,197,94,.25)',padding:'.35rem .625rem',borderRadius:8,fontSize:'.75rem',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontWeight:600}}><CheckCircle2 size={12}/>Done</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="db-search-inline" style={{marginBottom:'1.25rem', background: 'var(--db-sf2, #f5f5f5)', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.08))'}}>
        <Search size={14} style={{color: 'var(--db-tx3)'}} />
        <input placeholder="Search leads…" value={search} onChange={e=>setSearch(e.target.value)} style={{color: 'var(--db-tx)', background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '.875rem'}}/>
      </div>

      {/* Leads list */}
      <div style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
        {loading ? Array(4).fill(0).map((_,i)=><div key={i} style={{height:80,background:'var(--db-sf, #ffffff)',border:'1px solid var(--db-bd)',borderRadius:16,animation:'pulse 1.5s infinite'}}/>) :
        filtered.length===0 ? <p style={{color:'var(--db-tx2, #555555)',textAlign:'center',padding:'2rem'}}>No leads yet.</p> :
        filtered.map((lead,i)=>{
          const stage = LEAD_STAGES.find(s=>s.key===lead.lead_status);
          return (
            <motion.div key={lead.id} 
              style={{
                display:'flex',
                alignItems:'center',
                justifyContent:'space-between',
                gap:'1rem',
                padding:'1.25rem 1.5rem',
                background:'var(--db-sf, #ffffff)',
                border:'1.5px solid var(--db-bd, rgba(0,0,0,0.08))',
                borderRadius:16,
                transition:'all .2s ease',
                boxShadow:'0 4px 15px rgba(0,0,0,0.02)',
                position:'relative',
                overflow:'hidden'
              }}
              whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', borderColor: '#E10613' }}
              initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*.03}}>
              
              {/* Left Color Indicator based on status */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                background: stage?.color || '#E10613'
              }} />

              <div style={{display:'flex',alignItems:'center',gap:'1rem',flex:1,minWidth:0}}>
                <div style={{width:42,height:42,borderRadius:12,background:stage?.bg,color:stage?.color,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'1rem',flexShrink:0,fontFamily:"'Outfit',sans-serif"}}>{lead.customer_name.charAt(0)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:'.975rem',color:'var(--db-tx, #000000)',marginBottom:'2px'}}>{lead.customer_name}</div>
                  <div style={{fontSize:'.8125rem',color:'var(--db-tx2, #555555)',display:'flex',alignItems:'center',gap:'6px',flexWrap:'wrap'}}>
                    <span>{lead.phone}</span>
                    {lead.interested_car&&<>
                      <span style={{opacity:0.5}}>·</span>
                      <span style={{fontWeight:600,color:'var(--db-tx)'}}>{lead.interested_car}</span>
                    </>}
                  </div>
                </div>
              </div>
              <div style={{flexShrink:0,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'4px'}}>
                <span style={{background:stage?.bg,color:stage?.color,fontSize:'.75rem',fontWeight:700,padding:'.35rem .75rem',borderRadius:99,whiteSpace:'nowrap'}}>{stage?.label}</span>
                <span style={{fontSize:'.8125rem',fontWeight:600,color:'var(--db-tx3, #777777)'}}>{formatBudget(lead.budget)}</span>
              </div>
              <div style={{display:'flex',gap:6,alignItems:'center',marginLeft:'.5rem'}}>
                <a href={`tel:${lead.phone}`} style={{width:36,height:36,background:'rgba(59,130,246,.1)',color:'#3b82f6',border:'1px solid rgba(59,130,246,.15)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .2s'}}
                   onMouseEnter={e=>e.currentTarget.style.background='rgba(59,130,246,.2)'}
                   onMouseLeave={e=>e.currentTarget.style.background='rgba(59,130,246,.1)'}><Phone size={14}/></a>
                <Link href={`/employee/crm/leads/${lead.id}`} style={{width:36,height:36,background:'var(--db-sf2, #f5f5f5)',border:'1px solid var(--db-bd, rgba(0,0,0,0.15))',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--db-tx2, #555555)',textDecoration:'none',transition:'all .2s'}}
                   onMouseEnter={e=>e.currentTarget.style.borderColor='#E10613'}
                   onMouseLeave={e=>e.currentTarget.style.borderColor='var(--db-bd, rgba(0,0,0,0.15))'}><ArrowRight size={14}/></Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {toast&&<div style={{position:'fixed',bottom:'1.5rem',right:'1.5rem',background:'#22c55e',color:'#fff',padding:'.75rem 1.25rem',borderRadius:12,fontWeight:600,zIndex:200}}>{toast}</div>}

      <style jsx>{`
.emp-crm-add-btn{display:flex;align-items:center;gap:.375rem;background:#E10613;color:#fff;border:none;padding:.625rem 1.25rem;border-radius:10px;font-size:.8125rem;font-weight:700;font-family:inherit;cursor:pointer;transition:all .2s;text-decoration:none}
.emp-crm-add-btn:hover{background:#c70511;transform:translateY(-1px);box-shadow:0 6px 16px rgba(225,6,19,.25)}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
      `}</style>
    </div>
  );
}
