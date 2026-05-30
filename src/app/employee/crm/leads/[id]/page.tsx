'use client';
import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Phone, MessageCircle, Plus, CheckCircle2, X } from 'lucide-react';
import { useEmpContext } from '../../../layout';
import { LEAD_STAGES, FOLLOW_UP_TYPE_LABELS, type Lead, type LeadStatus, type FollowUp, type CustomerNote, formatBudget } from '@/types/crm';

export default function EmpLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { employee } = useEmpContext();
  const [lead, setLead] = useState<Lead|null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [tab, setTab] = useState<'info'|'followups'|'notes'>('info');
  const [newNote, setNewNote] = useState('');
  const [fuForm, setFuForm] = useState({ follow_up_type:'call', scheduled_at:'', notes:'', priority:'normal' });
  const [toast, setToast] = useState('');
  const [editStatus, setEditStatus] = useState(false);
  const [waModal, setWaModal] = useState(false);
  const [waText, setWaText] = useState('');
  const [waTemplate, setWaTemplate] = useState('welcome');
  const supabase = createClient();

  const openWhatsAppComposer = (templateKey = 'welcome') => {
    if (!lead) return;
    setWaTemplate(templateKey);
    const carName = lead.interested_car || 'our inventory';
    let text = '';
    if (templateKey === 'welcome') {
      text = `Hello ${lead.customer_name},\n\nThank you for choosing Auto Bourn. We have received your inquiry for the *${carName}*. Our luxury consultant will assist you shortly with the details.\n\nBest Regards,\n*Auto Bourn Team*`;
    } else if (templateKey === 'followup') {
      text = `Hi ${lead.customer_name},\n\nHope you are doing well. Just following up regarding your interest in the *${carName}* at Auto Bourn. Would you like to schedule a call or test drive?\n\nBest Regards,\n*Auto Bourn Team*`;
    } else if (templateKey === 'testdrive') {
      text = `Hello ${lead.customer_name},\n\nWe have scheduled a test drive for the *${carName}* as per your request. Our representative will contact you shortly to confirm the timings.\n\nBest Regards,\n*Auto Bourn Team*`;
    }
    setWaText(text);
    setWaModal(true);
  };

  const handleTemplateChange = (val: string) => {
    setWaTemplate(val);
    if (val === 'custom') {
      setWaText('');
      return;
    }
    const carName = lead?.interested_car || 'our inventory';
    let text = '';
    if (val === 'welcome') {
      text = `Hello ${lead?.customer_name},\n\nThank you for choosing Auto Bourn. We have received your inquiry for the *${carName}*. Our luxury consultant will assist you shortly with the details.\n\nBest Regards,\n*Auto Bourn Team*`;
    } else if (val === 'followup') {
      text = `Hi ${lead?.customer_name},\n\nHope you are doing well. Just following up regarding your interest in the *${carName}* at Auto Bourn. Would you like to schedule a call or test drive?\n\nBest Regards,\n*Auto Bourn Team*`;
    } else if (val === 'testdrive') {
      text = `Hello ${lead?.customer_name},\n\nWe have scheduled a test drive for the *${carName}* as per your request. Our representative will contact you shortly to confirm the timings.\n\nBest Regards,\n*Auto Bourn Team*`;
    }
    setWaText(text);
  };

  const sendWhatsAppMessage = () => {
    if (!lead) return;
    const phoneNum = lead.whatsapp || lead.phone;
    const formattedPhone = phoneNum.replace(/\D/g, '');
    const cleanPhone = formattedPhone.startsWith('91') || formattedPhone.length > 10
      ? formattedPhone
      : `91${formattedPhone}`;
    
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;
    window.open(url, '_blank');
    setWaModal(false);
  };

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3000); };

  const loadAll = async () => {
    const [{ data:l }, { data:fu }, { data:n }] = await Promise.all([
      supabase.from('leads').select('*').eq('id',id).single(),
      supabase.from('follow_ups').select('*, employee:employees!employee_id(name)').eq('lead_id',id).order('scheduled_at',{ascending:false}),
      supabase.from('customer_notes').select('*, employee:employees!employee_id(name)').eq('lead_id',id).order('created_at',{ascending:false}),
    ]);
    setLead(l as Lead);
    setFollowUps((fu||[]) as FollowUp[]);
    setNotes((n||[]) as CustomerNote[]);
  };

  useEffect(() => { loadAll(); }, [id]);

  const addNote = async () => {
    if (!newNote.trim()||!employee) return;
    await supabase.from('customer_notes').insert({ lead_id:id, employee_id:employee.id, note:newNote });
    setNewNote(''); loadAll(); showToast('Note saved');
  };

  const addFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    await supabase.from('follow_ups').insert({ lead_id:id, employee_id:employee.id, ...fuForm });
    setFuForm({ follow_up_type:'call', scheduled_at:'', notes:'', priority:'normal' });
    loadAll(); showToast('Follow-up scheduled!');
  };

  const complete = async (fuId: string) => {
    await supabase.from('follow_ups').update({ status:'completed', completed_at:new Date().toISOString() }).eq('id',fuId);
    loadAll(); showToast('Done!');
  };

  const changeStatus = async (s: LeadStatus) => {
    await supabase.from('leads').update({ lead_status:s, updated_at:new Date().toISOString() }).eq('id',id);
    if (employee) await supabase.from('crm_activity_logs').insert({ lead_id:id, employee_id:employee.id, action:'status_change', details:`→ ${s}` });
    setEditStatus(false); loadAll(); showToast('Status updated');
  };

  if (!lead) return <div style={{padding:'2rem',color:'#999'}}>Loading… <Link href="/employee/crm" style={{color:'#E10613'}}>Back</Link></div>;

  const stage = LEAD_STAGES.find(s=>s.key===lead.lead_status);

  return (
    <div style={{padding:0}}>
      <Link href="/employee/crm" style={{display:'flex',alignItems:'center',gap:4,color:'var(--emp-tx2)',textDecoration:'none',fontSize:'.875rem',marginBottom:'1rem'}}><ArrowLeft size={15}/>Back to Leads</Link>

      <div style={{display:'flex',alignItems:'flex-start',gap:'1rem',flexWrap:'wrap',marginBottom:'1.25rem'}}>
        <div style={{flex:1}}>
          <h1 style={{fontFamily:"'Outfit',sans-serif",fontSize:'1.375rem',fontWeight:800,margin:0}}>{lead.customer_name}</h1>
          <p style={{fontSize:'.8125rem',color:'var(--emp-tx2)',margin:'.25rem 0 0'}}>{lead.phone} {lead.city&&`· ${lead.city}`}</p>
        </div>
        <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
          <a href={`tel:${lead.phone}`} style={{display:'flex',alignItems:'center',gap:4,padding:'.5rem .875rem',background:'rgba(59,130,246,.1)',color:'#3b82f6',border:'1px solid rgba(59,130,246,.25)',borderRadius:9,fontSize:'.8125rem',fontWeight:600,textDecoration:'none'}}><Phone size={14}/>Call</a>
          <button onClick={() => openWhatsAppComposer('welcome')} style={{display:'flex',alignItems:'center',gap:4,padding:'.5rem .875rem',background:'rgba(34,197,94,.1)',color:'#22c55e',border:'1px solid rgba(34,197,94,.25)',borderRadius:9,fontSize:'.8125rem',fontWeight:600,cursor:'pointer'}}><MessageCircle size={14}/>WhatsApp</button>
        </div>
      </div>

      {/* Status */}
      <div style={{marginBottom:'1.25rem'}}>
        <div style={{display:'flex',alignItems:'center',gap:'.75rem'}}>
          <span style={{background:stage?.bg,color:stage?.color,fontWeight:700,fontSize:'.8125rem',padding:'.35rem .875rem',borderRadius:99}}>{stage?.label}</span>
          <button onClick={()=>setEditStatus(!editStatus)} style={{background:0,border:'1px solid var(--emp-bd)',color:'var(--emp-tx2)',padding:'.35rem .75rem',borderRadius:8,fontSize:'.75rem',cursor:'pointer',fontFamily:'inherit'}}>Change Status</button>
        </div>
        {editStatus&&(
          <div style={{display:'flex',flexWrap:'wrap',gap:'.375rem',marginTop:'.75rem',padding:'.875rem',background:'var(--emp-sf)',border:'1px solid var(--emp-bd)',borderRadius:12}}>
            {LEAD_STAGES.map(s=><button key={s.key} onClick={()=>changeStatus(s.key)} style={{background:s.bg,color:s.color,border:'none',padding:'.35rem .75rem',borderRadius:8,fontSize:'.75rem',fontWeight:600,cursor:'pointer'}}>{s.label}</button>)}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:4,background:'var(--emp-sf)',border:'1px solid var(--emp-bd)',borderRadius:12,padding:4,marginBottom:'1rem'}}>
        {(['info','followups','notes'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'.5rem',border:'none',borderRadius:8,fontFamily:'inherit',fontSize:'.8125rem',fontWeight:tab===t?700:500,cursor:'pointer',background:tab===t?'rgba(225,6,19,.08)':'transparent',color:tab===t?'#E10613':'var(--emp-tx2)',transition:'all .2s'}}>
            {t==='info'?'Info':t==='followups'?'Follow-ups':'Notes'}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {tab==='info'&&(
        <div style={{background:'var(--emp-sf)',border:'1px solid var(--emp-bd)',borderRadius:14,padding:'1.25rem'}}>
          {[
            ['Interested Car', lead.interested_car],['Budget', formatBudget(lead.budget)],
            ['Source', lead.source],['Timeline', lead.purchase_timeline],
            ['Email', lead.email],['WhatsApp', lead.whatsapp],
            ['City', lead.city],['State', lead.state],['Occupation', lead.occupation],
          ].map(([k,v])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'.4rem 0',borderBottom:'1px solid var(--emp-bd)',fontSize:'.875rem'}}>
              <span style={{color:'var(--emp-tx2)'}}>{k}</span><span style={{fontWeight:500}}>{v||'—'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Follow-ups Tab */}
      {tab==='followups'&&(
        <div>
          <form onSubmit={addFollowUp} style={{background:'var(--emp-sf)',border:'1px solid var(--emp-bd)',borderRadius:14,padding:'1rem',marginBottom:'1rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.75rem'}}>
            <div className="emp-field"><label>Type</label>
              <select value={fuForm.follow_up_type} onChange={e=>setFuForm({...fuForm,follow_up_type:e.target.value})}>
                {Object.entries(FOLLOW_UP_TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="emp-field"><label>Date &amp; Time</label><input type="datetime-local" required value={fuForm.scheduled_at} onChange={e=>setFuForm({...fuForm,scheduled_at:e.target.value})}/></div>
            <div className="emp-field"><label>Priority</label>
              <select value={fuForm.priority} onChange={e=>setFuForm({...fuForm,priority:e.target.value})}>
                <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
              </select>
            </div>
            <div className="emp-field"><label>Notes</label><input value={fuForm.notes} onChange={e=>setFuForm({...fuForm,notes:e.target.value})}/></div>
            <button type="submit" style={{gridColumn:'1/-1',background:'linear-gradient(135deg,#E10613,#c70511)',color:'#fff',border:'none',padding:'.625rem',borderRadius:9,fontFamily:'inherit',fontWeight:600,fontSize:'.875rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}><Plus size={14}/>Schedule</button>
          </form>
          {followUps.map(fu=>(
            <div key={fu.id} style={{display:'flex',alignItems:'center',gap:'.75rem',padding:'.75rem',background:'var(--emp-sf)',border:'1px solid var(--emp-bd)',borderRadius:12,marginBottom:.5}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:'.875rem'}}>{FOLLOW_UP_TYPE_LABELS[fu.follow_up_type]}</div>
                <div style={{fontSize:'.75rem',color:'var(--emp-tx2)'}}>{new Date(fu.scheduled_at).toLocaleString('en-IN')} {fu.notes&&`· ${fu.notes}`}</div>
              </div>
              <span style={{fontSize:'.6875rem',fontWeight:700,padding:'.2rem .5rem',borderRadius:99,background:fu.status==='completed'?'rgba(34,197,94,.12)':fu.status==='missed'?'rgba(225,6,19,.12)':'rgba(245,158,11,.12)',color:fu.status==='completed'?'#22c55e':fu.status==='missed'?'#E10613':'#f59e0b'}}>{fu.status}</span>
              {fu.status==='pending'&&<button onClick={()=>complete(fu.id)} style={{background:0,border:'1px solid rgba(34,197,94,.3)',color:'#22c55e',borderRadius:8,padding:'.3rem .5rem',cursor:'pointer',display:'flex'}}><CheckCircle2 size={14}/></button>}
            </div>
          ))}
          {followUps.length===0&&<p style={{color:'var(--emp-tx2)',fontSize:'.875rem',textAlign:'center',padding:'1.5rem'}}>No follow-ups yet.</p>}
        </div>
      )}

      {/* Notes Tab */}
      {tab==='notes'&&(
        <div>
          <div style={{display:'flex',gap:'.5rem',marginBottom:'1rem'}}>
            <textarea value={newNote} onChange={e=>setNewNote(e.target.value)} placeholder="Add a note…" rows={2} style={{flex:1,padding:'.75rem',background:'var(--emp-sf)',border:'1px solid var(--emp-bd)',borderRadius:10,color:'inherit',fontFamily:'inherit',fontSize:'.875rem',resize:'none',outline:'none'}}/>
            <button onClick={addNote} style={{background:'linear-gradient(135deg,#E10613,#c70511)',color:'#fff',border:'none',padding:'.625rem .875rem',borderRadius:9,cursor:'pointer',display:'flex',alignItems:'flex-start'}}><Plus size={16}/></button>
          </div>
          {notes.map(n=>(
            <div key={n.id} style={{background:'var(--emp-sf)',border:'1px solid var(--emp-bd)',borderLeft:'3px solid #6366f1',borderRadius:12,padding:'.875rem',marginBottom:'.5rem'}}>
              <div style={{fontSize:'.875rem',lineHeight:1.6}}>{n.note}</div>
              <div style={{fontSize:'.6875rem',color:'var(--emp-tx2)',marginTop:4}}>{(n.employee as {name:string}|null)?.name} · {new Date(n.created_at).toLocaleString('en-IN')}</div>
            </div>
          ))}
          {notes.length===0&&<p style={{color:'var(--emp-tx2)',fontSize:'.875rem',textAlign:'center',padding:'1.5rem'}}>No notes yet.</p>}
        </div>
      )}

      {waModal && (
        <div className="wa-modal-overlay">
          <div className="wa-modal-content">
            <div className="wa-modal-header">
              <h3>WhatsApp Message Composer</h3>
              <button className="wa-close-btn" onClick={() => setWaModal(false)}><X size={18} /></button>
            </div>
            <div className="wa-modal-body">
              <div className="wa-form-group">
                <label>Message Template</label>
                <select value={waTemplate} onChange={(e) => handleTemplateChange(e.target.value)}>
                  <option value="welcome">Welcome Message</option>
                  <option value="followup">Follow-Up Message</option>
                  <option value="testdrive">Test Drive Schedule</option>
                  <option value="custom">Custom Message (Clear text)</option>
                </select>
              </div>
              <div className="wa-form-group">
                <label>Message Preview</label>
                <textarea 
                  rows={6} 
                  value={waText} 
                  onChange={(e) => setWaText(e.target.value)} 
                  placeholder="Type your custom message here..."
                />
              </div>
            </div>
            <div className="wa-modal-footer">
              <button className="wa-btn cancel" onClick={() => setWaModal(false)}>Cancel</button>
              <button className="wa-btn send" onClick={sendWhatsAppMessage}>
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {toast&&<div style={{position:'fixed',bottom:'1.5rem',right:'1.5rem',background:'#22c55e',color:'#fff',padding:'.75rem 1.25rem',borderRadius:12,fontWeight:600,zIndex:200}}>{toast}</div>}

      <style jsx>{`
        .wa-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.75);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 1rem;
        }
        .wa-modal-content {
          background: var(--emp-sf);
          border: 1px solid var(--emp-bd);
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }
        .wa-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--emp-bd);
        }
        .wa-modal-header h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--emp-tx);
          margin: 0;
        }
        .wa-close-btn {
          background: 0;
          border: 0;
          color: var(--emp-tx2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color .2s;
        }
        .wa-close-btn:hover {
          color: #fff;
        }
        .wa-modal-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .wa-form-group {
          display: flex;
          flex-direction: column;
          gap: .5rem;
        }
        .wa-form-group label {
          font-size: .8125rem;
          font-weight: 600;
          color: var(--emp-tx2);
        }
        .wa-form-group select, 
        .wa-form-group textarea {
          width: 100%;
          padding: .75rem 1rem;
          background: var(--emp-sf2, rgba(255,255,255,0.03));
          border: 1px solid var(--emp-bd);
          border-radius: 10px;
          color: var(--emp-tx);
          font-family: inherit;
          font-size: .875rem;
          outline: none;
          transition: border-color .2s;
        }
        .wa-form-group select:focus, 
        .wa-form-group textarea:focus {
          border-color: var(--db-gold, #c5a880);
        }
        .wa-form-group textarea {
          resize: none;
        }
        .wa-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: .75rem;
          padding: 1rem 1.5rem;
          background: var(--emp-sf2, rgba(255,255,255,0.02));
          border-top: 1px solid var(--emp-bd);
        }
        .wa-btn {
          padding: .625rem 1.25rem;
          border-radius: 9px;
          font-size: .875rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all .2s;
          border: none;
        }
        .wa-btn.cancel {
          background: 0;
          color: var(--emp-tx2);
          border: 1px solid var(--emp-bd);
        }
        .wa-btn.cancel:hover {
          background: var(--emp-sf);
          color: #fff;
        }
        .wa-btn.send {
          background: #25d366;
          color: #fff;
          box-shadow: 0 4px 12px rgba(37,211,102,0.2);
        }
        .wa-btn.send:hover {
          background: #20ba59;
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(37,211,102,0.3);
        }
      `}</style>
    </div>
  );
}
