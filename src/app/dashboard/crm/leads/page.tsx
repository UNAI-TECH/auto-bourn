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
      
      const params = new URLSearchParams(window.location.search);
      if (params.get('add') === 'true') {
        setShowForm(true);
      }
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name||!form.phone) return;
    setSaving(true);
    const payload = { ...form, budget: form.budget ? parseInt(form.budget) : null, assigned_to: form.assigned_to||null, created_by: myId };
    const { data: leadData, error } = await supabase.from('leads').insert(payload).select().single();
    if (error) { showToast('Error: '+error.message); }
    else { 
      if (form.assigned_to && leadData) {
        await supabase.from('notifications').insert({
          recipient_role: 'employee',
          recipient_employee_id: form.assigned_to,
          type: 'lead_assigned',
          title: '📞 New Lead Assigned',
          message: `You have been assigned a new lead: ${form.customer_name} (${form.interested_car || 'Luxury car interest'}).`,
          metadata: { lead_id: leadData.id }
        });
      }
      showToast('Lead added!'); 
      setShowForm(false); 
      setForm(emptyForm); 
      load(); 
    }
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
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem',flexWrap:'wrap',gap:'1rem'}}>
        <div>
          <h1 className="db-page-title">Lead Management</h1>
          <p className="db-page-sub">{leads.length} total leads</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'0.75rem',flexWrap:'wrap'}}>
          {/* Segmented Control Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--db-sf2)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid var(--db-bd)',
            alignItems: 'center'
          }}>
            <button 
              className={`crm-view-btn ${view==='kanban'?'active':''}`} 
              onClick={()=>setView('kanban')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: view === 'kanban' ? 'var(--db-sf)' : 'transparent',
                border: 'none',
                color: view === 'kanban' ? 'var(--db-tx)' : 'var(--db-tx3)',
                padding: '0.375rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: view === 'kanban' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <LayoutGrid size={13}/> Kanban
            </button>
            <button 
              className={`crm-view-btn ${view==='list'?'active':''}`} 
              onClick={()=>setView('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: view === 'list' ? 'var(--db-sf)' : 'transparent',
                border: 'none',
                color: view === 'list' ? 'var(--db-tx)' : 'var(--db-tx3)',
                padding: '0.375rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: view === 'list' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              <List size={13}/> List
            </button>
          </div>
          
          <button 
            className="crm-add-btn" 
            onClick={()=>setShowForm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: 'linear-gradient(135deg, #E10613, #c70511)',
              color: '#ffffff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '10px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(225, 6, 19, 0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <Plus size={15}/> New Lead
          </button>
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
        <div className="crm-table-panel" style={{ background: 'var(--db-sf)', border: '1px solid var(--db-bd)', borderRadius: '16px', overflow: 'hidden' }}>
          <div className="crm-table-wrap" style={{ overflowX: 'auto' }}>
            <table className="crm-leads-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.5rem' }}>Customer</th>
                  <th>Phone</th>
                  <th>Interested Car</th>
                  <th>Budget</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ paddingRight: '1.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_,i)=>(
                    <tr key={i}>
                      <td colSpan={8} style={{ padding: '1rem 1.5rem' }}><div className="crm-skel" style={{height:32}}/></td>
                    </tr>
                  ))
                ) : filtered.length===0 ? (
                  <tr>
                    <td colSpan={8} className="crm-empty" style={{ padding: '3rem 0' }}>No leads found.</td>
                  </tr>
                ) : (
                  filtered.map((lead)=>{
                    const stage = LEAD_STAGES.find(s=>s.key===lead.lead_status);
                    const emp = lead.assigned_employee as {name:string}|null;
                    return (
                      <tr key={lead.id} className="crm-table-row-hover" style={{ transition: 'background 0.2s' }}>
                        <td style={{ paddingLeft: '1.5rem', verticalAlign: 'middle' }}>
                          <div className="crm-customer-cell">
                            <div className="crm-customer-avatar" style={{ background: stage?.bg, color: stage?.color }}>
                              {lead.customer_name.charAt(0)}
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--db-tx)' }}>{lead.customer_name}</span>
                          </div>
                        </td>
                        <td style={{ verticalAlign: 'middle' }}>{lead.phone}</td>
                        <td style={{ verticalAlign: 'middle' }}>
                          <span style={{ fontWeight: 600, color: 'var(--db-tx2)' }}>{lead.interested_car || '—'}</span>
                        </td>
                        <td style={{ verticalAlign: 'middle', fontWeight: 600, color: 'var(--db-tx)' }}>{formatBudget(lead.budget)}</td>
                        <td style={{ verticalAlign: 'middle', color: 'var(--db-tx3)' }}>{emp?.name || 'Unassigned'}</td>
                        <td style={{ verticalAlign: 'middle' }}>
                          <span className="crm-status-pill" style={{ background: stage?.bg, color: stage?.color }}>
                            {stage?.label}
                          </span>
                        </td>
                        <td style={{ verticalAlign: 'middle', color: 'var(--db-tx3)' }}>
                          {new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                        <td style={{ paddingRight: '1.5rem', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <a href={`tel:${lead.phone}`} className="crm-action-icon-btn" title="Call"><Phone size={13}/></a>
                            <Link href={`/dashboard/crm/leads/${lead.id}`} className="crm-action-icon-btn" title="View details"><ArrowRight size={13}/></Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="modal-backdrop" onClick={() => setShowForm(false)}>
            <motion.div
              className="inspo-card-modal lead-modal-large"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="inspo-modal-close" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>

              <div className="inspo-card-header">
                <h2 className="inspo-card-title">Add New Customer Lead</h2>
                <p className="inspo-card-subtitle">Create a new customer lead profile to manage requirements and assign follow-ups.</p>
              </div>

              <form onSubmit={handleSubmit} className="inspo-form">
                <div className="inspo-grid">
                  {/* Customer Information */}
                  <div className="crm-form-title-section" style={{ gridColumn: 'span 2' }}>Customer Information</div>
                  
                  <div className="inspo-field">
                    <label>Full Name <span className="required">*</span></label>
                    <input
                      value={form.customer_name}
                      onChange={e => setForm({ ...form, customer_name: e.target.value })}
                      required
                      placeholder="e.g. Rajesh Kumar"
                    />
                  </div>

                  <div className="inspo-field">
                    <label>Phone Number <span className="required">*</span></label>
                    <input
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      required
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>

                  <div className="inspo-field">
                    <label>WhatsApp Number</label>
                    <input
                      value={form.whatsapp}
                      onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                      placeholder="WhatsApp number"
                    />
                  </div>

                  <div className="inspo-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="email@address.com"
                    />
                  </div>

                  <div className="inspo-field">
                    <label>City</label>
                    <input
                      value={form.city}
                      onChange={e => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g. Chennai"
                    />
                  </div>

                  <div className="inspo-field">
                    <label>State</label>
                    <input
                      value={form.state}
                      onChange={e => setForm({ ...form, state: e.target.value })}
                      placeholder="e.g. Tamil Nadu"
                    />
                  </div>

                  {/* Lead Details */}
                  <div className="crm-form-title-section" style={{ gridColumn: 'span 2', marginTop: '1.25rem' }}>Lead Details</div>

                  <div className="inspo-field">
                    <label>Interested Car</label>
                    <input
                      value={form.interested_car}
                      onChange={e => setForm({ ...form, interested_car: e.target.value })}
                      placeholder="e.g. BMW 5 Series / Mercedes E-Class"
                    />
                  </div>

                  <div className="inspo-field">
                    <label>Preferred Brand</label>
                    <select
                      value={form.preferred_brand}
                      onChange={e => setForm({ ...form, preferred_brand: e.target.value })}
                      className="inspo-select"
                    >
                      <option value="">Select brand</option>
                      {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>

                  <div className="inspo-field">
                    <label>Budget (₹)</label>
                    <input
                      type="number"
                      value={form.budget}
                      onChange={e => setForm({ ...form, budget: e.target.value })}
                      placeholder="e.g. 4500000"
                    />
                  </div>

                  <div className="inspo-field">
                    <label>Source</label>
                    <select
                      value={form.source}
                      onChange={e => setForm({ ...form, source: e.target.value as LeadSource })}
                      className="inspo-select"
                    >
                      {SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
                    </select>
                  </div>

                  <div className="inspo-field">
                    <label>Timeline</label>
                    <select
                      value={form.purchase_timeline}
                      onChange={e => setForm({ ...form, purchase_timeline: e.target.value })}
                      className="inspo-select"
                    >
                      <option value="">Select</option>
                      {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="inspo-field">
                    <label>Assign To</label>
                    <select
                      value={form.assigned_to}
                      onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                      className="inspo-select"
                    >
                      <option value="">Select employee</option>
                      {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                    </select>
                  </div>

                  <div className="inspo-field full-width">
                    <label>Notes</label>
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      placeholder="Describe initial customer interest or requirements..."
                      className="inspo-textarea"
                    />
                  </div>
                </div>

                <div className="inspo-form-footer">
                  <button
                    type="button"
                    className="inspo-btn-cancel"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inspo-btn-submit"
                    disabled={saving}
                  >
                    {saving ? 'Creating...' : 'Create Lead Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>{toast&&<motion.div className="db-toast success" initial={{opacity:0,y:50}} animate={{opacity:1,y:0}} exit={{opacity:0,y:50}}>{toast}</motion.div>}</AnimatePresence>

      <style jsx>{`
.crm-view-btn{display:flex;align-items:center;gap:.375rem;background:var(--db-sf);border:1px solid var(--db-bd);color:var(--db-tx2);padding:.5rem .875rem;border-radius:9px;font-size:.8125rem;font-family:inherit;cursor:pointer;transition:all .2s}
.crm-view-btn.active,.crm-view-btn:hover{border-color:var(--db-gold);color:var(--db-gold);background:var(--db-gd)}
.crm-add-btn{display:flex;align-items:center;gap:.375rem;background:linear-gradient(135deg,#E10613,#c70511);color:#fff;border:none;padding:.5rem 1.125rem;border-radius:9px;font-size:.8125rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .2s}
.crm-add-btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(225,6,19,.3)}

/* Horizontal Scrolling Container */
.crm-kanban-wrap {
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  max-width: 100%;
  padding-bottom: 1.5rem;
  -webkit-overflow-scrolling: touch;
}
.crm-kanban-wrap::-webkit-scrollbar {
  height: 6px;
}
.crm-kanban-wrap::-webkit-scrollbar-track {
  background: transparent;
}
.crm-kanban-wrap::-webkit-scrollbar-thumb {
  background: var(--db-bd);
  border-radius: 99px;
}

/* Kanban Row of Columns */
.crm-kanban {
  display: flex;
  gap: 1.25rem;
  min-width: max-content;
  align-items: flex-start;
  padding: 0.25rem 0;
}

/* Individual Column containing Vertical Scroll */
.crm-kanban-col {
  width: 280px;
  flex-shrink: 0;
  background: var(--db-sf2);
  border-radius: 16px;
  border: 1px solid var(--db-bd);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 250px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
}
.crm-col-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  border-top: 3px solid;
  background: var(--db-sf);
  flex-shrink: 0;
}
.crm-col-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 99px;
}

/* Vertical scrolling Column Body */
.crm-col-body {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  flex: 1;
  min-height: 150px;
}
.crm-col-body::-webkit-scrollbar {
  width: 4px;
}
.crm-col-body::-webkit-scrollbar-track {
  background: transparent;
}
.crm-col-body::-webkit-scrollbar-thumb {
  background: var(--db-bd);
  border-radius: 99px;
}

/* Cards style */
.crm-card {
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  border-radius: 12px;
  padding: 1rem;
  cursor: grab;
  transition: all 0.2s ease-in-out;
}
.crm-card:hover {
  border-color: var(--db-gold);
  box-shadow: 0 6px 16px rgba(225, 6, 19, 0.04);
}
.crm-card:active {
  cursor: grabbing;
  opacity: 0.85;
}
.crm-card-btn {
  width: 24px;
  height: 24px;
  background: var(--db-sf2);
  border: 1px solid var(--db-bd);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--db-tx3);
  text-decoration: none;
  transition: all 0.2s;
}
.crm-card-btn:hover {
  border-color: var(--db-gold);
  color: var(--db-gold);
}
/* Table Styles matching Recent Leads */
.crm-leads-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-family: 'Outfit', sans-serif;
}
.crm-leads-table th {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--db-tx3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 12px 16px;
  border-bottom: 1px solid var(--db-bd);
  background: var(--db-sf2);
}
.crm-leads-table td {
  font-size: 0.8125rem;
  color: var(--db-tx2);
  padding: 14px 16px;
  border-bottom: 1px solid var(--db-bd);
}
.crm-table-row-hover:hover {
  background: var(--db-sf2);
}
.crm-leads-table tbody tr:last-child td {
  border-bottom: none;
}
.crm-customer-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.crm-customer-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}
.crm-status-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 9999px;
  display: inline-block;
}
.crm-action-icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--db-bd);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--db-tx2);
  transition: all 0.2s;
  background: var(--db-sf);
}
.crm-action-icon-btn:hover {
  border-color: var(--db-gold);
  color: var(--db-gold);
  background: var(--db-gd);
}
.crm-form-modal {
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
}
.crm-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1.25rem;
}
.crm-form-section {
  grid-column: 1/-1;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--db-tx3);
  padding: 0.25rem 0 0.125rem;
  border-bottom: 1px solid var(--db-bd);
  margin-top: 0.25rem;
}
.crm-empty {
  color: var(--db-tx3);
  text-align: center;
  padding: 3rem 0;
  font-size: 0.9rem;
}
.crm-skel {
  background: var(--db-sf2);
  border-radius: 10px;
  animation: pulse 1.5s infinite;
}

/* Redesigned Premium Modal Styles - Imported from Employee Modal */
:global(.modal-backdrop) {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}
:global(.inspo-card-modal) {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-top: 5px solid #E10613; /* Premium Red bar at the top */
  border-radius: 24px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  color: #1e293b;
  font-family: inherit;
}
:global(.lead-modal-large) {
  max-width: 800px !important;
}
:global(.inspo-modal-close) {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  transition: all 0.2s;
  z-index: 20;
}
:global(.inspo-modal-close):hover {
  background: #f1f5f9;
  color: #0f172a;
}
:global(.inspo-card-header) {
  text-align: center;
  margin-bottom: 1.5rem;
}
:global(.inspo-card-title) {
  font-family: 'Outfit', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
}
:global(.inspo-card-subtitle) {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}
:global(.inspo-form) {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
:global(.inspo-grid) {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}
:global(.inspo-field) {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
:global(.inspo-field.full-width) {
  grid-column: span 2;
}
@media (max-width: 640px) {
  :global(.inspo-grid) {
    grid-template-columns: 1fr;
  }
  :global(.inspo-field.full-width) {
    grid-column: span 1;
  }
}
:global(.inspo-field label) {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
:global(.inspo-field label .required) {
  color: #E10613;
}
:global(.inspo-field input) {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #0f172a;
  font-size: 0.875rem;
  font-family: inherit;
  outline: 0;
  transition: all 0.2s;
}
:global(.inspo-field input:focus) {
  border-color: #E10613;
  box-shadow: 0 0 0 3px rgba(225, 6, 19, 0.1);
}
:global(.inspo-field input::placeholder) {
  color: #94a3b8;
}
:global(.inspo-select),
:global(.inspo-textarea) {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #0f172a;
  font-size: 0.875rem;
  font-family: inherit;
  outline: 0;
  transition: all 0.2s;
  box-sizing: border-box;
}
:global(.inspo-select):focus,
:global(.inspo-textarea):focus {
  border-color: #E10613;
  box-shadow: 0 0 0 3px rgba(225, 6, 19, 0.1);
}
:global(.inspo-form-footer) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
  gap: 1rem;
}
:global(.inspo-btn-cancel) {
  padding: 0.75rem 1.5rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #475569;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
:global(.inspo-btn-cancel):hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
}
:global(.inspo-btn-submit) {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #e10613, #c70511);
  border: 0;
  border-radius: 10px;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(225, 6, 19, 0.2);
}
:global(.inspo-btn-submit:hover) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(225, 6, 19, 0.3);
}
:global(.inspo-btn-submit:active) {
  transform: translateY(0);
}
:global(.inspo-btn-submit:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
      `}</style>
    </div>
  );
}
