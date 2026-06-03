'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Plus, Search, Filter, LayoutGrid, List, X, Phone, MessageCircle, ChevronDown, ArrowRight } from 'lucide-react';
import { LEAD_STAGES, SOURCE_LABELS, formatBudget, type Lead, type LeadStatus, type LeadSource } from '@/types/crm';

const SOURCES: LeadSource[] = ['website','instagram','facebook','whatsapp','walk_in','referral','olx','cardekho','manual'];
const TIMELINES = ['Within 1 week','1–2 weeks','1 month','1–3 months','3–6 months','6+ months'];
const BRANDS = ['Mercedes-Benz','BMW','Audi','Jaguar','Land Rover','Volvo','Lexus','Porsche','Toyota','Honda','Hyundai','Kia','Tata','Mahindra','Maruti Suzuki','Volkswagen','Skoda','MG','Mini','Lamborghini','Jeep','Crysta','Tucson','Other'];

const emptyForm = { customer_name:'', phone:'', whatsapp:'', email:'', city:'', state:'', occupation:'', source:'manual' as LeadSource, interested_car:'', preferred_brand:'', budget:'', purchase_timeline:'', lead_status:'new' as LeadStatus, assigned_to:'', notes:'' };

export default function LeadsPage() {
  const [view, setView] = useState<'kanban'|'list'>('kanban');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<{id:string;name:string;employee_id:string}[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [draggingId, setDraggingId] = useState<string|null>(null);
  const [myId, setMyId] = useState<string|null>(null);
  const supabase = createClient();

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(''),3000); };

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('leads').select('*, assigned_employee:employees!assigned_to(name,employee_id)').order('created_at',{ascending:false});
    if (filterStatus !== 'all') q = q.eq('lead_status', filterStatus);
    if (search) q = q.or(`customer_name.ilike.%${search}%,phone.ilike.%${search}%,interested_car.ilike.%${search}%`);
    const { data } = await q;
    setLeads((data||[]) as Lead[]);
    setLoading(false);
  }, [search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const init = async () => {
      const { data:{user} } = await supabase.auth.getUser();
      if (!user) return;
      const { data:emp } = await supabase.from('employees').select('id').eq('auth_user_id',user.id).single();
      if (emp) setMyId(emp.id);
      const { data:emps } = await supabase.from('employees').select('id,name,employee_id').eq('status','active');
      setEmployees(emps||[]);
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name||!form.phone) return;
    setSaving(true);
    const payload = { ...form, budget: form.budget ? parseInt(form.budget) : null, assigned_to: form.assigned_to||null, created_by: myId };
    const { error } = await supabase.from('leads').insert(payload);
    if (error) { showToast('Error: '+error.message); }
    else { showToast('Lead added!'); setShowForm(false); setForm(emptyForm); load(); }
    setSaving(false);
  };

  const moveCard = async (leadId: string, newStatus: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id===leadId ? {...l,lead_status:newStatus} : l));
    await supabase.from('leads').update({lead_status:newStatus, updated_at:new Date().toISOString()}).eq('id',leadId);
    await supabase.from('crm_activity_logs').insert({lead_id:leadId, employee_id:myId, action:'status_change', details:`Status changed to ${newStatus}`});
  };

  const filtered = leads.filter(l =>
    (filterStatus==='all'||l.lead_status===filterStatus) &&
    (!search || l.customer_name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search) || (l.interested_car||'').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="db-page" style={{padding:0}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.25rem',flexWrap:'wrap',gap:'1rem'}}>
        <div><h1 className="db-page-title">Lead Management</h1><p className="db-page-sub">{leads.length} total leads</p></div>
        <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
          <button className={`crm-view-btn ${view==='kanban'?'active':''}`} onClick={()=>setView('kanban')}><LayoutGrid size={15}/>Kanban</button>
          <button className={`crm-view-btn ${view==='list'?'active':''}`} onClick={()=>setView('list')}><List size={15}/>List</button>
          <button className="crm-add-btn" onClick={()=>setShowForm(true)}><Plus size={16}/>New Lead</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:'.75rem',marginBottom:'1.25rem',flexWrap:'wrap',alignItems:'center'}}>
        <div className="db-search-inline"><Search size={15}/><input placeholder="Search name, phone, car…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="car-select-wrap"><Filter size={13}/>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            {LEAD_STAGES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Kanban View */}
      {view==='kanban' && (
        <div className="crm-kanban-wrap">
          <div className="crm-kanban">
            {LEAD_STAGES.map(stage=>{
              const cols = filtered.filter(l=>l.lead_status===stage.key);
              return (
                <div key={stage.key} className="crm-kanban-col"
                  onDragOver={e=>e.preventDefault()}
                  onDrop={()=>{ if(draggingId) moveCard(draggingId, stage.key as LeadStatus); setDraggingId(null); }}>
                  <div className="crm-col-head" style={{borderTopColor:stage.color}}>
                    <span style={{color:stage.color,fontWeight:700,fontSize:'.8125rem'}}>{stage.label}</span>
                    <span className="crm-col-badge" style={{background:stage.bg,color:stage.color}}>{cols.length}</span>
                  </div>
                  <div className="crm-col-body">
                    {loading ? <div className="crm-skel" style={{height:80}}/> :
                    cols.map(lead=>{
                      const emp = lead.assigned_employee as {name:string}|null;
                      return (
                        <div key={lead.id} className="crm-card" draggable
                          onDragStart={()=>setDraggingId(lead.id)}
                          onDragEnd={()=>setDraggingId(null)}>
                          <div style={{fontWeight:700,fontSize:'.875rem',color:'var(--db-tx)',marginBottom:'.25rem'}}>{lead.customer_name}</div>
                          <div style={{fontSize:'.75rem',color:'var(--db-tx3)',marginBottom:'.5rem'}}>{lead.phone} {lead.city&&`· ${lead.city}`}</div>
                          {lead.interested_car&&<div style={{fontSize:'.75rem',color:'var(--db-tx2)',marginBottom:'.4rem'}}>🚗 {lead.interested_car}</div>}
                          {lead.budget&&<div style={{fontSize:'.75rem',color:'var(--db-tx2)',marginBottom:'.5rem'}}>💰 {formatBudget(lead.budget)}</div>}
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'.5rem',paddingTop:'.5rem',borderTop:'1px solid var(--db-bd)'}}>
                            <div style={{fontSize:'.6875rem',color:'var(--db-tx3)'}}>{emp?.name||'Unassigned'}</div>
                            <div style={{display:'flex',gap:4}}>
                              <a href={`tel:${lead.phone}`} className="crm-card-btn" title="Call"><Phone size={11}/></a>
                              <a href={`https://wa.me/${(lead.whatsapp||lead.phone).replace(/\D/g,'')}`} target="_blank" className="crm-card-btn" title="WhatsApp"><MessageCircle size={11}/></a>
                              <Link href={`/dashboard/crm/leads/${lead.id}`} className="crm-card-btn" title="View"><ArrowRight size={11}/></Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {view==='list' && (
        <div className="crm-list-wrap">
          {loading ? Array(5).fill(0).map((_,i)=><div key={i} className="crm-skel" style={{height:60}}/>)
          : filtered.length===0 ? <p className="crm-empty">No leads found.</p>
          : filtered.map((lead,i)=>{
            const stage = LEAD_STAGES.find(s=>s.key===lead.lead_status);
            const emp = lead.assigned_employee as {name:string}|null;
            return (
              <motion.div key={lead.id} className="crm-list-row" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*.03}}>
                <div className="crm-lead-av" style={{background:stage?.bg,color:stage?.color}}>{lead.customer_name.charAt(0)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:'.875rem',color:'var(--db-tx)'}}>{lead.customer_name}</div>
                  <div style={{fontSize:'.75rem',color:'var(--db-tx3)'}}>{lead.phone} {lead.interested_car&&`· ${lead.interested_car}`}</div>
                </div>
                <span className="crm-status-badge" style={{background:stage?.bg,color:stage?.color}}>{stage?.label}</span>
                <div style={{fontSize:'.75rem',color:'var(--db-tx3)',textAlign:'right',flexShrink:0}}>
                  <div>{emp?.name||'Unassigned'}</div>
                  <div>{formatBudget(lead.budget)}</div>
                </div>
                <div style={{display:'flex',gap:4}}>
                  <a href={`tel:${lead.phone}`} className="crm-card-btn"><Phone size={13}/></a>
                  <Link href={`/dashboard/crm/leads/${lead.id}`} className="crm-card-btn"><ArrowRight size={13}/></Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Lead Modal */}
      <AnimatePresence>
        {showForm&&(
          <motion.div className="emp-modal-bg" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setShowForm(false)}>
            <motion.div className="emp-modal crm-form-modal" initial={{scale:.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:.95,opacity:0}} onClick={e=>e.stopPropagation()}>
              <div className="emp-modal-head"><h2>New Lead</h2><button onClick={()=>setShowForm(false)}><X size={20}/></button></div>
              <form onSubmit={handleSubmit} className="crm-form-grid">
                {/* Customer Info */}
                <div className="crm-form-section">Customer Information</div>
                <div className="emp-field"><label>Full Name *</label><input required value={form.customer_name} onChange={e=>setForm({...form,customer_name:e.target.value})}/></div>
                <div className="emp-field"><label>Phone *</label><input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
                <div className="emp-field"><label>WhatsApp</label><input value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})}/></div>
                <div className="emp-field"><label>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
                <div className="emp-field"><label>City</label><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></div>
                <div className="emp-field"><label>State</label><input value={form.state} onChange={e=>setForm({...form,state:e.target.value})}/></div>
                {/* Lead Info */}
                <div className="crm-form-section">Lead Details</div>
                <div className="emp-field"><label>Interested Car</label><input value={form.interested_car} onChange={e=>setForm({...form,interested_car:e.target.value})}/></div>
                <div className="emp-field"><label>Preferred Brand</label>
                  <select value={form.preferred_brand} onChange={e=>setForm({...form,preferred_brand:e.target.value})}>
                    <option value="">Select brand</option>{BRANDS.map(b=><option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="emp-field"><label>Budget (₹)</label><input type="number" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}/></div>
                <div className="emp-field"><label>Source</label>
                  <select value={form.source} onChange={e=>setForm({...form,source:e.target.value as LeadSource})}>
                    {SOURCES.map(s=><option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
                  </select>
                </div>
                <div className="emp-field"><label>Timeline</label>
                  <select value={form.purchase_timeline} onChange={e=>setForm({...form,purchase_timeline:e.target.value})}>
                    <option value="">Select</option>{TIMELINES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="emp-field"><label>Assign To</label>
                  <select value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})}>
                    <option value="">Select employee</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="emp-field" style={{gridColumn:'1/-1'}}><label>Notes</label><textarea rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></div>
                <button type="submit" className="crm-add-btn" style={{gridColumn:'1/-1',justifyContent:'center',width:'100%'}} disabled={saving}>{saving?'Saving…':'Add Lead'}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{toast&&<motion.div className="db-toast success" initial={{opacity:0,y:50}} animate={{opacity:1,y:0}} exit={{opacity:0,y:50}}>{toast}</motion.div>}</AnimatePresence>

      <style jsx>{`
.crm-view-btn{display:flex;align-items:center;gap:.375rem;background:var(--db-sf);border:1px solid var(--db-bd);color:var(--db-tx2);padding:.5rem .875rem;border-radius:9px;font-size:.8125rem;font-family:inherit;cursor:pointer;transition:all .2s}
.crm-view-btn.active,.crm-view-btn:hover{border-color:var(--db-gold);color:var(--db-gold);background:var(--db-gd)}
.crm-add-btn{display:flex;align-items:center;gap:.375rem;background:linear-gradient(135deg,#E10613,#c70511);color:#fff;border:none;padding:.5rem 1.125rem;border-radius:9px;font-size:.8125rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .2s}
.crm-add-btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(225,6,19,.3)}
.crm-kanban-wrap{overflow-x:auto;padding-bottom:1rem}
.crm-kanban{display:flex;gap:1rem;min-width:max-content;align-items:flex-start}
.crm-kanban-col{width:240px;flex-shrink:0;background:var(--db-sf2);border-radius:12px;overflow:hidden;border:1px solid var(--db-bd)}
.crm-col-head{display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;border-top:3px solid;background:var(--db-sf)}
.crm-col-badge{font-size:.6875rem;font-weight:700;padding:2px 8px;border-radius:99px}
.crm-col-body{padding:.5rem;display:flex;flex-direction:column;gap:.5rem;min-height:80px}
.crm-card{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:10px;padding:.875rem;cursor:grab;transition:all .2s}
.crm-card:hover{border-color:var(--db-gold);box-shadow:0 4px 16px var(--db-gg)}
.crm-card:active{cursor:grabbing;opacity:.85;transform:rotate(1deg)}
.crm-card-btn{width:24px;height:24px;background:var(--db-sf2);border:1px solid var(--db-bd);border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--db-tx3);text-decoration:none;transition:all .2s}
.crm-card-btn:hover{border-color:var(--db-gold);color:var(--db-gold)}
.crm-list-wrap{display:flex;flex-direction:column;gap:.5rem}
.crm-list-row{display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;background:var(--db-sf);border:1px solid var(--db-bd);border-radius:12px;transition:all .2s}
.crm-list-row:hover{border-color:var(--db-gold)}
.crm-lead-av{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.9rem;flex-shrink:0;font-family:'Outfit',sans-serif}
.crm-status-badge{font-size:.6875rem;font-weight:600;padding:.25rem .625rem;border-radius:99px;white-space:nowrap;flex-shrink:0}
.crm-form-modal{max-width:640px;max-height:90vh;overflow-y:auto}
.crm-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;padding:1.25rem}
.crm-form-section{grid-column:1/-1;font-size:.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--db-tx3);padding:.25rem 0 .125rem;border-bottom:1px solid var(--db-bd);margin-top:.25rem}
.crm-empty{color:var(--db-tx3);text-align:center;padding:3rem 0;font-size:.9rem}
.crm-skel{background:var(--db-sf2);border-radius:10px;animation:pulse 1.5s infinite}
      `}</style>
    </div>
  );
}
