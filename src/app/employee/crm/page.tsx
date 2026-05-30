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
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem',flexWrap:'wrap',gap:'.75rem'}}>
        <div><h1 style={{fontFamily:"'Outfit',sans-serif",fontSize:'1.375rem',fontWeight:800,margin:0}}>My Leads</h1><p style={{color:'var(--emp-tx2)',fontSize:'.8125rem',margin:'.25rem 0 0'}}>Manage your assigned customer leads</p></div>
        <Link href="/employee/customer-details" className="emp-crm-add-btn"><Plus size={15}/>Add Customer</Link>
      </div>

      {/* Quick stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:'.75rem',marginBottom:'1.25rem'}}>
        {[
          {label:'Total',value:stats.total,color:'#6366f1'},
          {label:'Active',value:stats.active,color:'#3b82f6'},
          {label:'Sold',value:stats.sold,color:'#22c55e'},
          {label:"Today's FU",value:stats.todayFU,color:'#E10613'},
        ].map(s=>(
          <div key={s.label} style={{background:'var(--emp-sf)',border:'1px solid var(--emp-bd)',borderRadius:12,padding:'1rem',textAlign:'center'}}>
            <div style={{fontWeight:800,fontSize:'1.5rem',color:s.color,fontFamily:"'Outfit',sans-serif"}}>{s.value}</div>
            <div style={{fontSize:'.75rem',color:'var(--emp-tx2)'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Today's follow-ups */}
      {followUps.length>0&&(
        <div style={{background:'rgba(225,6,19,.05)',border:'1px solid rgba(225,6,19,.15)',borderRadius:14,padding:'1rem',marginBottom:'1.25rem'}}>
          <div style={{fontWeight:700,fontSize:'.875rem',color:'#E10613',marginBottom:'.75rem',display:'flex',alignItems:'center',gap:'.5rem'}}><Clock size={15}/>Pending Follow-ups ({followUps.length})</div>
          {followUps.slice(0,5).map(fu=>{
            const lead = fu.lead as {customer_name:string;phone:string}|null;
            return (
              <div key={fu.id} style={{display:'flex',alignItems:'center',gap:'.75rem',padding:'.5rem 0',borderBottom:'1px solid rgba(225,6,19,.08)'}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:'.875rem'}}>{lead?.customer_name||'—'}</div>
                  <div style={{fontSize:'.75rem',color:'var(--emp-tx2)'}}>{FOLLOW_UP_TYPE_LABELS[fu.follow_up_type]} · {new Date(fu.scheduled_at).toLocaleString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <a href={`tel:${lead?.phone}`} style={{background:'rgba(59,130,246,.1)',color:'#3b82f6',border:'1px solid rgba(59,130,246,.25)',padding:'.35rem .625rem',borderRadius:8,fontSize:'.75rem',display:'flex',alignItems:'center',gap:4,textDecoration:'none'}}><Phone size={12}/>Call</a>
                <button onClick={()=>completeFollowUp(fu.id)} style={{background:'rgba(34,197,94,.1)',color:'#22c55e',border:'1px solid rgba(34,197,94,.25)',padding:'.35rem .625rem',borderRadius:8,fontSize:'.75rem',cursor:'pointer',display:'flex',alignItems:'center',gap:4}}><CheckCircle2 size={12}/>Done</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="db-search-inline" style={{marginBottom:'1rem'}}><Search size={14}/><input placeholder="Search leads…" value={search} onChange={e=>setSearch(e.target.value)}/></div>

      {/* Leads list */}
      <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
        {loading ? Array(4).fill(0).map((_,i)=><div key={i} style={{height:72,background:'var(--emp-sf)',borderRadius:12,animation:'pulse 1.5s infinite'}}/>) :
        filtered.length===0 ? <p style={{color:'var(--emp-tx2)',textAlign:'center',padding:'2rem'}}>No leads yet.</p> :
        filtered.map((lead,i)=>{
          const stage = LEAD_STAGES.find(s=>s.key===lead.lead_status);
          return (
            <motion.div key={lead.id} style={{display:'flex',alignItems:'center',gap:'.75rem',padding:'.875rem 1rem',background:'var(--emp-sf)',border:'1px solid var(--emp-bd)',borderRadius:12,transition:'all .2s'}}
              initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*.03}}>
              <div style={{width:36,height:36,borderRadius:10,background:stage?.bg,color:stage?.color,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'.9rem',flexShrink:0,fontFamily:"'Outfit',sans-serif"}}>{lead.customer_name.charAt(0)}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:'.9rem'}}>{lead.customer_name}</div>
                <div style={{fontSize:'.75rem',color:'var(--emp-tx2)'}}>{lead.phone} {lead.interested_car&&`· ${lead.interested_car}`}</div>
              </div>
              <span style={{background:stage?.bg,color:stage?.color,fontSize:'.6875rem',fontWeight:600,padding:'.25rem .625rem',borderRadius:99,whiteSpace:'nowrap',flexShrink:0}}>{stage?.label}</span>
              <span style={{fontSize:'.75rem',color:'var(--emp-tx2)',flexShrink:0}}>{formatBudget(lead.budget)}</span>
              <div style={{display:'flex',gap:4}}>
                <a href={`tel:${lead.phone}`} style={{width:28,height:28,background:'rgba(59,130,246,.1)',color:'#3b82f6',border:'1px solid rgba(59,130,246,.2)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center'}}><Phone size={13}/></a>
                <Link href={`/employee/crm/leads/${lead.id}`} style={{width:28,height:28,background:'var(--emp-sf2)',border:'1px solid var(--emp-bd)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--emp-tx2)',textDecoration:'none'}}><ArrowRight size={13}/></Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {toast&&<div style={{position:'fixed',bottom:'1.5rem',right:'1.5rem',background:'#22c55e',color:'#fff',padding:'.75rem 1.25rem',borderRadius:12,fontWeight:600,zIndex:200}}>{toast}</div>}

      <style jsx>{`
.emp-crm-add-btn{display:flex;align-items:center;gap:.375rem;background:linear-gradient(135deg,#E10613,#c70511);color:#fff;border:none;padding:.5rem 1.125rem;border-radius:9px;font-size:.8125rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .2s}
.emp-crm-add-btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(225,6,19,.3)}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
      `}</style>
    </div>
  );
}
