'use client';
import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import DateTimePicker from '@/components/DateTimePicker';
import { ArrowLeft, Phone, MessageCircle, Mail, Edit, Plus, Check, X, Clock, Car, UserPlus, Download, ClipboardCheck, Sparkles, Armchair, Wrench, FileCheck, Camera, ClipboardList } from 'lucide-react';
import { LEAD_STAGES, FOLLOW_UP_TYPE_LABELS, formatBudget, type Lead, type LeadStatus, type FollowUp, type CustomerNote, type TestDrive, type Booking } from '@/types/crm';
import { getProxiedImageUrl } from '@/lib/utils';
import InspectionModal from '@/components/InspectionModal';
import { downloadInspectionPdf, openPdf } from '@/lib/pdf-utils';

const TABS = ['Calls','Timeline','Follow-ups','Notes','Test Drives','Booking'];

const renderInspectionReport = (note: string) => {
  if (!note.includes('Used Car Inspection Report')) {
    return <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{note}</div>;
  }

  const lines = note.split('\n');
  const sections: { title: string; items: string[] }[] = [];
  let currentSection: { title: string; items: string[] } | null = null;
  let headerInfo: { overall?: string; action?: string; value?: string; inspector?: string } = {};

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('####')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: trimmed.replace(/^####\s*/, ''),
        items: []
      };
      return;
    }

    if (trimmed.startsWith('###')) return;

    if (trimmed.startsWith('**Overall Condition:**')) {
      const match1 = trimmed.match(/\*\*Overall Condition:\*\*\s*([^\s|]+)/i);
      const match2 = trimmed.match(/\*\*Recommended Action:\*\*\s*([^\s|]+)/i);
      if (match1) headerInfo.overall = match1[1];
      if (match2) headerInfo.action = match2[1];
      return;
    }

    if (trimmed.startsWith('**Estimated Value:**')) {
      const match = trimmed.match(/\*\*Estimated Value:\*\*\s*(.*)/i);
      if (match) headerInfo.value = match[1];
      return;
    }

    if (trimmed.startsWith('**Inspector:**')) {
      const match = trimmed.match(/\*\*Inspector:\*\*\s*(.*)/i);
      if (match) headerInfo.inspector = match[1];
      return;
    }

    if (trimmed.startsWith('-')) {
      if (currentSection) {
        currentSection.items.push(trimmed.replace(/^-\s*/, ''));
      }
    } else {
      if (currentSection) {
        currentSection.items.push(trimmed);
      }
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  const getSectionIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('vehicle')) return <Car size={15} />;
    if (t.includes('exterior')) return <Sparkles size={15} />;
    if (t.includes('interior')) return <Armchair size={15} />;
    if (t.includes('mechanical') || t.includes('suspension')) return <Wrench size={15} />;
    if (t.includes('test drive') || t.includes('docs')) return <FileCheck size={15} />;
    if (t.includes('media') || t.includes('photo')) return <Camera size={15} />;
    return <ClipboardCheck size={15} />;
  };

  return (
    <div style={{ background: 'var(--db-sf2, #f8fafc)', border: '1px solid var(--db-bd, #e2e8f0)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginTop: '0.5rem', width: '100%' }}>
      {/* Top Header Card */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              <ClipboardList size={18} style={{ color: '#fff' }} /> Used Car Inspection Report
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
              Inspector: {headerInfo.inspector || '—'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ background: '#e10613', color: '#fff', fontSize: '0.7rem', fontWeight: 750, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              Value: {headerInfo.value || '—'}
            </span>
            <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.7rem', fontWeight: 750, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              Rating: {headerInfo.overall || '—'}
            </span>
            <span style={{ background: '#10b981', color: '#fff', fontSize: '0.7rem', fontWeight: 750, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              {headerInfo.action || '—'}
            </span>
            <button
              onClick={() => downloadInspectionPdf(note)}
              style={{
                background: '#e10613',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.7rem',
                fontWeight: 750,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textTransform: 'uppercase',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#b8040f'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#e10613'}
            >
              <Download size={13} /> Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Sections */}
      <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', background: 'var(--db-sf, #fff)' }}>
        {sections.map((sec, idx) => {
          const isMedia = sec.title.toLowerCase().includes('media') || sec.title.toLowerCase().includes('photo');
          return (
            <div key={idx} style={{ background: 'var(--db-sf2, #f8fafc)', padding: '0.875rem', borderRadius: '8px', border: '1px solid var(--db-bd, #e2e8f0)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 750, color: '#e10613', borderBottom: '1.5px solid var(--db-bd, #f1f5f9)', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {getSectionIcon(sec.title)}
                {sec.title}
              </h4>
              {isMedia ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', padding: 0 }}>
                  {sec.items.map((item, i) => {
                    const parts = item.split('**');
                    if (parts.length >= 3) {
                      const url = parts.slice(2).join('').trim().replace(/^:\s*/, '');
                      const label = parts[1].replace(':', '');
                      const isPdf = url.startsWith('data:application/pdf') || url.toLowerCase().includes('.pdf');
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--db-sf, #fff)', border: '1px solid var(--db-bd, #e2e8f0)', borderRadius: '6px', padding: '6px', minWidth: 0 }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--db-tx3, #64748b)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                          {isPdf ? (
                            <button onClick={() => openPdf(url)} style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', fontSize: '10px', color: '#e10613', fontWeight: 700, textAlign: 'left', display: 'flex', alignItems: 'center', height: '40px' }}>
                              View PDF ↗
                            </button>
                          ) : (
                            <div style={{ width: '100%', height: '50px', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer', background: '#f1f5f9' }} onClick={() => window.open(url, '_blank')}>
                              <img src={getProxiedImageUrl(url)} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          )}
                        </div>
                      );
                    }
                    return <div key={i} style={{ fontSize: '0.75rem', color: 'var(--db-tx2)' }}>{item}</div>;
                  })}
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sec.items.map((item, i) => {
                    const parts = item.split('**');
                    if (parts.length >= 3) {
                      return (
                        <li key={i} style={{ fontSize: '0.78rem', color: 'var(--db-tx2, #334155)', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--db-tx3, #64748b)' }}>{parts[1].replace(':', '')}</span>
                          <span style={{ fontWeight: 500, textAlign: 'right', color: 'var(--db-tx, #0f172a)' }}>{parts.slice(2).join('').trim().replace(/^:\s*/, '')}</span>
                        </li>
                      );
                    }
                    return (
                      <li key={i} style={{ fontSize: '0.78rem', color: 'var(--db-tx2, #334155)', lineHeight: 1.4 }}>
                        {item}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lead, setLead] = useState<Lead|null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [booking, setBooking] = useState<Booking|null>(null);
  const [callSessions, setCallSessions] = useState<any[]>([]);
  const [tab, setTab] = useState('Calls');
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string|null>(null);
  const [employees, setEmployees] = useState<{id:string;name:string;role?:string}[]>([]);

  // form state
  const [newNote, setNewNote] = useState('');
  const [fuForm, setFuForm] = useState({ follow_up_type:'', scheduled_at:'', notes:'', priority:'' });
  const [tdForm, setTdForm] = useState({ car_name:'', scheduled_at:'', location:'', notes:'' });
  const [editStatus, setEditStatus] = useState(false);
  const [editAssignee, setEditAssignee] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptAssigneeId, setAcceptAssigneeId] = useState('');
  const [toast, setToast] = useState('');
  const [showInspection, setShowInspection] = useState(false);
  const [completingFollowUpId, setCompletingFollowUpId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [completingFollowUpType, setCompletingFollowUpType] = useState('');

  const supabase = createClient();
  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3000); };

  const isSellerLead = () => {
    if (!lead) return false;
    return notes.some(n => 
      n.note && (n.note.includes('Vehicle Details:') || n.note.includes('Transmission:') || n.note.includes('Fuel Type:'))
    ) || !!(lead.interested_car && (
      lead.interested_car.includes('Sell a Vehicle') || 
      lead.interested_car.toLowerCase().includes('sell')
    ));
  };

  const hasInspectionForm = () => {
    return notes.some(n => n.note && n.note.includes('Used Car Inspection Report'));
  };

  const formatCallDuration = (seconds: number) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const loadAll = async () => {
    const [{ data:l }, { data:fu }, { data:n }, { data:td }, { data:bk }, { data:calls }] = await Promise.all([
      supabase.from('leads').select('*, assigned_employee:employees!assigned_to(name,employee_id)').eq('id',id).single(),
      supabase.from('follow_ups').select('*, employee:employees!employee_id(name)').eq('lead_id',id).order('scheduled_at',{ascending:false}),
      supabase.from('customer_notes').select('*, employee:employees!employee_id(name)').eq('lead_id',id).order('created_at',{ascending:false}),
      supabase.from('test_drives').select('*, employee:employees!employee_id(name)').eq('lead_id',id).order('scheduled_at',{ascending:false}),
      supabase.from('bookings').select('*').eq('lead_id',id).order('created_at',{ascending:false}).limit(1).maybeSingle(),
      supabase.from('employee_calls').select('*, employee:employees!employee_id(name)').eq('lead_id',id).order('created_at',{ascending:false}),
    ]);
    setLead(l as Lead); setFollowUps((fu||[]) as FollowUp[]); setNotes((n||[]) as CustomerNote[]);
    setTestDrives((td||[]) as TestDrive[]); setBooking(bk as Booking|null); setCallSessions(calls || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    supabase.auth.getUser().then(({ data:{user} }) => {
      if (!user) return;
      supabase.from('employees').select('id').eq('auth_user_id',user.id).single().then(({data})=>{ if(data) setMyId(data.id); });
    });
    supabase.from('employees').select('id,name,role').eq('status','active').then(({data})=>setEmployees(data||[]));
  }, [id]);

  const addNote = async () => {
    if (!newNote.trim()||!myId) return;
    await supabase.from('customer_notes').insert({ lead_id:id, employee_id:myId, note:newNote });
    await supabase.from('crm_activity_logs').insert({ lead_id:id, employee_id:myId, action:'note_added', details:newNote.slice(0,100) });
    setNewNote(''); loadAll(); showToast('Note saved');
  };

  const addFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myId) return;
    if (!fuForm.follow_up_type) {
      showToast('Please select a follow-up type');
      return;
    }
    if (!fuForm.priority) {
      showToast('Please select a priority');
      return;
    }
    if (!fuForm.scheduled_at) {
      showToast('Please select date and time');
      return;
    }
    if (new Date(fuForm.scheduled_at) < new Date()) {
      showToast('Cannot schedule follow-up in the past');
      return;
    }
    const targetEmployeeId = lead?.assigned_to || myId;
    await supabase.from('follow_ups').insert({ lead_id:id, employee_id:targetEmployeeId, ...fuForm });
    await supabase.from('leads').update({ lead_status:'follow_up_pending', updated_at:new Date().toISOString() }).eq('id',id);
    await supabase.from('crm_activity_logs').insert({ lead_id:id, employee_id:targetEmployeeId, action:'follow_up_scheduled', details:`${fuForm.follow_up_type} on ${fuForm.scheduled_at}` });
    setFuForm({ follow_up_type:'', scheduled_at:'', notes:'', priority:'' });
    loadAll(); showToast('Follow-up scheduled');
  };

  const completeFollowUp = async (fuId: string) => {
    const fu = followUps.find(f => f.id === fuId);
    if (fu) {
      setCompletingFollowUpId(fuId);
      setCompletingFollowUpType(fu.follow_up_type);
      setCompletionNote('');
    }
  };

  const handleCompleteFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingFollowUpId) return;

    await supabase.from('follow_ups').update({ 
      status: 'completed', 
      completed_at: new Date().toISOString() 
    }).eq('id', completingFollowUpId);

    if (completionNote.trim()) {
      const formattedNote = `Completed Follow-up (${(FOLLOW_UP_TYPE_LABELS as any)[completingFollowUpType] || completingFollowUpType}): ${completionNote.trim()}`;
      await supabase.from('customer_notes').insert({ 
        lead_id: id, 
        employee_id: myId, 
        note: formattedNote 
      });
      await supabase.from('crm_activity_logs').insert({ 
        lead_id: id, 
        employee_id: myId, 
        action: 'note_added', 
        details: formattedNote.slice(0, 100) 
      });
    }

    setCompletingFollowUpId(null);
    setCompletionNote('');
    loadAll(); 
    showToast('Follow-up completed');
  };

  const addTestDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myId) return;
    if (!tdForm.scheduled_at) {
      showToast('Please select date and time');
      return;
    }
    if (new Date(tdForm.scheduled_at) < new Date()) {
      showToast('Cannot schedule test drive in the past');
      return;
    }
    await supabase.from('test_drives').insert({ lead_id:id, employee_id:myId, ...tdForm });
    await supabase.from('leads').update({ lead_status:'test_drive_scheduled', updated_at:new Date().toISOString() }).eq('id',id);
    setTdForm({ car_name:'', scheduled_at:'', location:'', notes:'' });
    loadAll(); showToast('Test drive scheduled');
  };

  const changeStatus = async (s: LeadStatus) => {
    await supabase.from('leads').update({ lead_status:s, updated_at:new Date().toISOString() }).eq('id',id);
    await supabase.from('crm_activity_logs').insert({ lead_id:id, employee_id:myId, action:'status_change', details:`Status → ${s}` });
    
    if (s === 'follow_up_pending') {
      const { data: existing } = await supabase
        .from('follow_ups')
        .select('id')
        .eq('lead_id', id)
        .eq('status', 'pending')
        .limit(1);

      if (!existing || existing.length === 0) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);

        await supabase.from('follow_ups').insert({
          lead_id: id,
          employee_id: lead?.assigned_to || myId || employees[0]?.id || '',
          follow_up_type: 'call',
          scheduled_at: tomorrow.toISOString(),
          notes: 'Automated follow-up scheduling (status changed to Follow-up Pending)',
          priority: 'normal',
          status: 'pending'
        });
      }
    }

    setEditStatus(false); loadAll(); showToast('Status updated');
  };

  const changeAssignee = async (newAssigneeId: string | null) => {
    if (!myId) return;
    try {
      const payload: any = {
        updateData: { assigned_to: newAssigneeId || null },
        activityLog: {
          action: 'reassign',
          details: newAssigneeId 
            ? `Assigned to ${employees.find(e => e.id === newAssigneeId)?.name || 'Employee'}`
            : 'Lead released (unassigned)'
        }
      };

      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to update assignment');
      }

      if (newAssigneeId) {
        await supabase.from('notifications').insert({
          recipient_role: 'employee',
          recipient_employee_id: newAssigneeId,
          type: 'lead_assigned',
          title: '📞 New Lead Assigned',
          message: `You have been assigned a new lead: ${lead?.customer_name} (${lead?.interested_car || 'Luxury car interest'}).`,
          metadata: { lead_id: id }
        });
      }

      setEditAssignee(false);
      loadAll();
      showToast('Assignment updated');
    } catch (err: any) {
      showToast(err.message || 'Error updating assignee');
    }
  };

  // WhatsApp composer state
  const [waModal, setWaModal] = useState(false);
  const [waText, setWaText] = useState('');
  const [waTemplate, setWaTemplate] = useState('welcome');

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

  if (loading) return <div className="db-loader"><motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}} className="db-spinner"/></div>;
  if (!lead) return <div style={{padding:'2rem',color:'var(--db-tx3)'}}>Lead not found. <Link href="/dashboard/crm/leads" style={{color:'var(--db-gold)'}}>Back</Link></div>;

  const stage = LEAD_STAGES.find(s=>s.key===lead.lead_status);
  const emp = lead.assigned_employee as {name:string;employee_id:string}|null;

  return (
    <div className="db-page" style={{padding:0}}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/dashboard/crm/leads" className="crm-back-btn">
              <ArrowLeft size={15} /> Back
            </Link>
            <div>
              <h1 className="db-page-title" style={{ margin: 0, fontSize: '1.75rem' }}>{lead.customer_name}</h1>
              <p className="db-page-sub" style={{ margin: '0.25rem 0 0' }}>{lead.phone} {lead.city && `· ${lead.city}`} {lead.interested_car && `· ${lead.interested_car}`}</p>
              {lead.assigned_to ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    background: 'var(--db-sf2, #f8fafc)',
                    border: '1.5px solid var(--db-bd, rgba(0,0,0,0.06))',
                    borderRadius: '20px',
                    fontSize: '0.8125rem',
                    color: 'var(--db-tx2)'
                  }}>
                    <span style={{ color: 'var(--db-tx3)' }}>Assigned to:</span>
                    <span style={{ fontWeight: 700, color: '#E10613' }}>{emp?.name || 'Unknown'}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setAcceptAssigneeId(lead.assigned_to || '');
                      setShowAcceptModal(true);
                    }}
                    style={{
                      background: 'var(--db-sf, #ffffff)',
                      border: '1.5px solid var(--db-bd, rgba(0,0,0,0.1))',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      color: 'var(--db-tx)',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                  >
                    <Edit size={11} style={{ color: 'var(--db-gold, #c5a880)' }} /> Change Consultant
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <a href={`tel:${lead.phone}`} className="crm-action-btn call"><Phone size={15} />Call</a>
            <button onClick={() => openWhatsAppComposer('welcome')} className="crm-action-btn wa" style={{ cursor: 'pointer' }}><MessageCircle size={15} />WhatsApp</button>
            {lead.email && <a href={`mailto:${lead.email}`} className="crm-action-btn email"><Mail size={15} />Email</a>}
            {isSellerLead() && (
              hasInspectionForm() ? (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '12px',
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.05)'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Inspection Form Added
                </div>
              ) : (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Inspection Form Pending
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Accept & Assign Lead Banner */}
      {!lead.assigned_to && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(225, 6, 19, 0.08), rgba(197, 168, 128, 0.08))',
          border: '1.5px solid #E10613',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(225, 6, 19, 0.05)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--db-tx, #000)' }}>👋 Unassigned Lead</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--db-tx2, #555)' }}>
              This lead is not yet accepted/assigned. Accept this lead and assign it to a consultant to begin work.
            </p>
          </div>
          <div>
            <button 
              onClick={() => {
                setAcceptAssigneeId('');
                setShowAcceptModal(true);
              }}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '10px',
                border: 0,
                background: '#E10613',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(225, 6, 19, 0.15)'
              }}
            >
              <UserPlus size={16} /> Accept &amp; Assign Lead
            </button>
          </div>
        </div>
      )}

      {/* Accept & Assign Modal */}
      <AnimatePresence>
        {showAcceptModal && (
          <div className="modal-backdrop" onClick={() => setShowAcceptModal(false)} style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}>
            <motion.div 
              className="inspo-card-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '440px',
                background: 'var(--db-sf, #ffffff)',
                border: '1px solid var(--db-bd, rgba(0,0,0,0.06))',
                borderRadius: '16px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--db-tx)' }}>
                    🤝 Accept & Assign Lead
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--db-tx3)' }}>
                    Assign this lead to an employee to start tracking their interaction.
                  </p>
                </div>
                <button onClick={() => setShowAcceptModal(false)} style={{
                  background: 'var(--db-sf2, #f5f5f5)',
                  border: 0,
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--db-tx2)'
                }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 750, color: 'var(--db-tx2)' }}>
                  Select Consultant:
                </label>
                <select 
                  value={acceptAssigneeId}
                  onChange={(e) => setAcceptAssigneeId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '10px',
                    border: '1.5px solid var(--db-bd, rgba(0,0,0,0.08))',
                    background: 'var(--db-sf, #fff)',
                    color: 'var(--db-tx)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" disabled>Choose an employee...</option>
                  {employees.filter(e => e.role !== 'admin').map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role || 'Sales Consultant'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                <button 
                  onClick={() => setShowAcceptModal(false)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '10px',
                    border: '1.5px solid var(--db-bd, rgba(0,0,0,0.08))',
                    background: 'none',
                    color: 'var(--db-tx2)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button 
                  disabled={!acceptAssigneeId}
                  onClick={async () => {
                    if (acceptAssigneeId) {
                      await changeAssignee(acceptAssigneeId);
                      setShowAcceptModal(false);
                    }
                  }}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '10px',
                    border: 0,
                    background: acceptAssigneeId ? '#E10613' : 'rgba(0,0,0,0.05)',
                    color: acceptAssigneeId ? '#fff' : 'var(--db-tx3)',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: acceptAssigneeId ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s'
                  }}
                >
                  Confirm Assignment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="crm-detail-layout">
        {/* Sidebar */}
        <aside className="crm-sidebar">
          <div className="crm-panel" style={{marginBottom:'1rem'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem'}}>
              <span className="crm-status-badge" style={{background:stage?.bg,color:stage?.color,fontSize:'.75rem'}}>{stage?.label}</span>
              <button onClick={()=>setEditStatus(!editStatus)} style={{background:0,border:0,color:'var(--db-tx3)',cursor:'pointer',display:'flex'}}><Edit size={14}/></button>
            </div>
            {editStatus&&(
              <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:'1rem'}}>
                {LEAD_STAGES.map(s=>(
                  <button key={s.key} onClick={()=>changeStatus(s.key)} style={{background:s.bg,color:s.color,border:'none',padding:'.4rem .75rem',borderRadius:8,fontSize:'.75rem',fontWeight:600,cursor:'pointer',textAlign:'left'}}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            <div className="crm-info-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span style={{ color: 'var(--db-tx3)' }}>Assigned</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--db-tx)', fontWeight: 500 }}>{emp?.name || '—'}</span>
                  <button onClick={() => setEditAssignee(!editAssignee)} style={{ background: 0, border: 0, color: 'var(--db-tx3)', cursor: 'pointer', display: 'flex', padding: 0 }}><Edit size={14} /></button>
                </div>
              </div>
              {editAssignee && (
                <div style={{ marginTop: '0.25rem', width: '100%' }}>
                  <select
                    value={lead?.assigned_to || ''}
                    onChange={(e) => changeAssignee(e.target.value || null)}
                    style={{
                      width: '100%',
                      padding: '0.4rem 0.5rem',
                      background: 'var(--db-sf2)',
                      border: '1px solid var(--db-bd)',
                      borderRadius: '8px',
                      color: 'var(--db-tx)',
                      fontSize: '0.8125rem',
                      outline: 'none'
                    }}
                  >
                    <option value="">Unassigned</option>
                    {employees.filter(e => e.role === 'employee').map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="crm-info-row"><span>Budget</span><span>{formatBudget(lead.budget)}</span></div>
            <div className="crm-info-row"><span>Source</span><span>{lead.source}</span></div>
            <div className="crm-info-row"><span>Timeline</span><span>{lead.purchase_timeline||'—'}</span></div>
            <div className="crm-info-row"><span>Email</span><span style={{wordBreak:'break-all'}}>{lead.email||'—'}</span></div>
            <div className="crm-info-row"><span>City</span><span>{lead.city||'—'}</span></div>
            <div className="crm-info-row"><span>Occupation</span><span>{lead.occupation||'—'}</span></div>
          </div>
        </aside>

        {/* Main */}
        <div style={{flex:1,minWidth:0}}>
          <div className="crm-tabs">
            {TABS.map(t=><button key={t} className={`crm-tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</button>)}
          </div>

          {/* CALLS */}
          {tab==='Calls'&&(
            <div className="crm-panel">
              <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--db-tx)' }}>
                📞 Call Sessions History
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {callSessions.map(c => {
                  let statusBg = 'rgba(59, 130, 246, 0.08)';
                  let statusColor = '#3b82f6';
                  let statusLabel = 'Called';
                  if (c.call_status === 'missed') {
                    statusBg = 'rgba(239, 68, 68, 0.08)';
                    statusColor = '#ef4444';
                    statusLabel = 'Missed';
                  } else if (c.call_status === 'no_answer') {
                    statusBg = 'rgba(245, 158, 11, 0.08)';
                    statusColor = '#f59e0b';
                    statusLabel = 'No Answer';
                  }

                  return (
                    <div key={c.id} style={{ background: 'var(--db-sf2, #fafafa)', border: '1px solid var(--db-bd, rgba(0,0,0,0.04))', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', background: statusBg, color: statusColor, textTransform: 'uppercase' }}>
                            {statusLabel}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--db-tx2, #555)', fontWeight: 600 }}>
                            Duration: {formatCallDuration(c.talking_time)}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--db-tx3, #777)' }}>
                            by {c.employee?.name || 'Unknown'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--db-tx3, #777)', fontWeight: 600 }}>
                          {new Date(c.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>

                      {c.review && (
                        <div style={{ fontSize: '0.78rem', color: '#e10613', fontWeight: 750, textTransform: 'capitalize' }}>
                          Customer Interest: {c.review}
                        </div>
                      )}

                      {c.notes && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--db-tx, #000)', background: 'var(--db-sf, #ffffff)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--db-bd, rgba(0,0,0,0.04))' }}>
                          {c.notes}
                        </div>
                      )}
                    </div>
                  );
                })}

                {callSessions.length === 0 && (
                  <p style={{ color: 'var(--db-tx3, #777)', fontSize: '0.875rem', padding: '1rem 0' }}>No calls logged for this customer yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TIMELINE */}
          {tab==='Timeline'&&(
            <div className="crm-panel">
              <p style={{fontSize:'.875rem',color:'var(--db-tx3)',fontStyle:'italic'}}>Full activity timeline — notes, follow-ups, status changes all appear here.</p>
              <div style={{display:'flex',flexDirection:'column',gap:0}}>
                {[
                  ...notes.map(n=>({ date:n.created_at, label:'Note added', detail:(n.note||'').slice(0,120), emp:(n.employee as {name:string}|null)?.name, color:'#6366f1' })),
                  ...followUps.map(f=>({ date:f.created_at, label:`Follow-up (${f.follow_up_type})`, detail:f.notes||'', emp:(f.employee as {name:string}|null)?.name, color:'#f59e0b' })),
                  ...testDrives.map(t=>({ date:t.created_at, label:`Test Drive — ${t.car_name||''}`, detail:t.notes||'', emp:(t.employee as {name:string}|null)?.name, color:'#8b5cf6' })),
                ].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map((ev,i)=>(
                  <div key={i} className="crm-timeline-row">
                    <div className="crm-tl-dot" style={{background:ev.color}}/>
                    <div>
                      <div style={{fontWeight:600,fontSize:'.875rem'}}>{ev.label}</div>
                      {ev.detail&&<div style={{fontSize:'.8125rem',color:'var(--db-tx3)',marginTop:2}}>{ev.detail}</div>}
                      <div style={{fontSize:'.6875rem',color:'var(--db-tx3)',marginTop:4}}>{ev.emp} · {new Date(ev.date).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
                {notes.length===0&&followUps.length===0&&testDrives.length===0&&<p style={{color:'var(--db-tx3)',fontSize:'.875rem',padding:'1rem 0'}}>No activity yet.</p>}
              </div>
            </div>
          )}

          {/* FOLLOW-UPS */}
          {tab==='Follow-ups'&&(
            <div className="crm-panel">
              <form onSubmit={addFollowUp} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.75rem',marginBottom:'1.5rem',padding:'1rem',background:'var(--db-sf2)',borderRadius:12}}>
                <div className="emp-field"><label>Type</label>
                  <select required value={fuForm.follow_up_type} onChange={e=>setFuForm({...fuForm,follow_up_type:e.target.value})}>
                    <option value="" disabled>Select an option</option>
                    {Object.entries(FOLLOW_UP_TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="emp-field">
                  <label>Date &amp; Time</label>
                  <DateTimePicker
                    value={fuForm.scheduled_at}
                    onChange={(val) => setFuForm({ ...fuForm, scheduled_at: val })}
                    required
                  />
                </div>
                <div className="emp-field"><label>Priority</label>
                  <select required value={fuForm.priority} onChange={e=>setFuForm({...fuForm,priority:e.target.value})}>
                    <option value="" disabled>Select an option</option>
                    <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
                  </select>
                </div>
                <div className="emp-field"><label>Notes</label><input value={fuForm.notes} onChange={e=>setFuForm({...fuForm,notes:e.target.value})} placeholder="Brief note…"/></div>
                <button type="submit" className="crm-add-btn" style={{gridColumn:'1/-1'}}><Plus size={14}/>Schedule Follow-up</button>
              </form>
              {followUps.map(fu=>{
                const fuEmp = fu.employee as {name:string}|null;
                return (
                  <div key={fu.id} className="crm-fu-item">
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:'.875rem'}}>{FOLLOW_UP_TYPE_LABELS[fu.follow_up_type]} <span style={{fontSize:'.75rem',color:'var(--db-tx3)'}}>· {new Date(fu.scheduled_at).toLocaleString('en-IN')}</span></div>
                      {fu.notes&&<div style={{fontSize:'.8125rem',color:'var(--db-tx3)',marginTop:2}}>{fu.notes}</div>}
                      <div style={{fontSize:'.6875rem',color:'var(--db-tx3)',marginTop:4}}>
                        {fuEmp?.name} · Priority: {fu.priority}
                        {fu.completed_at && ` · Completed: ${new Date(fu.completed_at).toLocaleString('en-IN')}`}
                      </div>
                    </div>
                    <span className={`crm-fu-status ${fu.status}`}>{fu.status}</span>
                    {fu.status==='pending'&&<button onClick={()=>completeFollowUp(fu.id)} className="crm-card-btn" title="Mark complete"><Check size={13}/></button>}
                  </div>
                );
              })}
              {followUps.length===0&&<p style={{color:'var(--db-tx3)',fontSize:'.875rem'}}>No follow-ups yet.</p>}
            </div>
          )}

          {/* NOTES */}
          {tab==='Notes'&&(
            <div className="crm-panel">
              <div style={{display:'flex',gap:'.5rem',marginBottom:'1rem'}}>
                <textarea className="crm-note-input" rows={2} placeholder="Add a note about this customer…" value={newNote} onChange={e=>setNewNote(e.target.value)}/>
                <button className="crm-add-btn" onClick={addNote} style={{alignSelf:'flex-start',padding:'.625rem'}}><Plus size={16}/></button>
              </div>
              {notes.map(n=>{
                const nEmp = n.employee as {name:string}|null;
                return (
                  <div key={n.id} className="crm-note-item" style={{ borderLeft: n.note.includes('Inspection Report') ? '4px solid #E10613' : '4px solid #6366f1' }}>
                    <div style={{fontSize:'.875rem',lineHeight:1.6}}>{renderInspectionReport(n.note)}</div>
                    <div style={{fontSize:'.6875rem',color:'var(--db-tx3)',marginTop:6}}>{nEmp?.name||'Unknown'} · {new Date(n.created_at).toLocaleString('en-IN')}</div>
                  </div>
                );
              })}
              {notes.length===0&&<p style={{color:'var(--db-tx3)',fontSize:'.875rem'}}>No notes yet.</p>}
            </div>
          )}

          {/* TEST DRIVES */}
          {tab==='Test Drives'&&(
            <div className="crm-panel">
              <form onSubmit={addTestDrive} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.75rem',marginBottom:'1.5rem',padding:'1rem',background:'var(--db-sf2)',borderRadius:12}}>
                <div className="emp-field"><label>Car Name</label><input required value={tdForm.car_name} onChange={e=>setTdForm({...tdForm,car_name:e.target.value})}/></div>
                <div className="emp-field">
                  <label>Date &amp; Time</label>
                  <DateTimePicker
                    value={tdForm.scheduled_at}
                    onChange={(val) => setTdForm({ ...tdForm, scheduled_at: val })}
                    required
                  />
                </div>
                <div className="emp-field"><label>Location</label><input value={tdForm.location} onChange={e=>setTdForm({...tdForm,location:e.target.value})}/></div>
                <div className="emp-field"><label>Notes</label><input value={tdForm.notes} onChange={e=>setTdForm({...tdForm,notes:e.target.value})}/></div>
                <button type="submit" className="crm-add-btn" style={{gridColumn:'1/-1'}}><Car size={14}/>Schedule Test Drive</button>
              </form>
              {testDrives.map(td=>(
                <div key={td.id} className="crm-fu-item">
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:'.875rem'}}>{td.car_name||'—'} <span style={{fontSize:'.75rem',color:'var(--db-tx3)'}}>· {new Date(td.scheduled_at).toLocaleString('en-IN')}</span></div>
                    <div style={{fontSize:'.8125rem',color:'var(--db-tx3)',marginTop:2}}>{td.location} {td.notes&&`· ${td.notes}`}</div>
                  </div>
                  <span className={`crm-fu-status ${td.status}`}>{td.status}</span>
                </div>
              ))}
              {testDrives.length===0&&<p style={{color:'var(--db-tx3)',fontSize:'.875rem'}}>No test drives yet.</p>}
            </div>
          )}

          {/* BOOKING */}
          {tab==='Booking'&&(
            <div className="crm-panel">
              {booking ? (
                <div>
                  <div className="crm-info-row"><span>Car</span><span>{booking.car_name||'—'}</span></div>
                  <div className="crm-info-row"><span>Booking Amount</span><span>{formatBudget(booking.booking_amount)}</span></div>
                  <div className="crm-info-row"><span>Total Amount</span><span>{formatBudget(booking.total_amount)}</span></div>
                  <div className="crm-info-row"><span>Payment</span><span>{booking.payment_status}</span></div>
                  <div className="crm-info-row"><span>Delivery</span><span>{booking.delivery_status}</span></div>
                  <div className="crm-info-row"><span>Finance</span><span>{booking.finance_status}</span></div>
                  <div className="crm-info-row"><span>Insurance</span><span>{booking.insurance_status}</span></div>
                  <div className="crm-info-row"><span>RTO</span><span>{booking.rto_status}</span></div>
                </div>
              ) : <p style={{color:'var(--db-tx3)',fontSize:'.875rem'}}>No booking created yet.</p>}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
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
      </AnimatePresence>

      <AnimatePresence>
        {showInspection && (
          <InspectionModal
            isOpen={showInspection}
            onClose={() => setShowInspection(false)}
            leadId={id}
            inspectorName="Admin"
            onSuccess={() => {
              setShowInspection(false);
              loadAll();
            }}
          />
        )}
      </AnimatePresence>

      {/* Complete Follow-up Modal */}
      {completingFollowUpId && (
        <div className="wa-modal-overlay">
          <div className="wa-modal-content">
            <div className="wa-modal-header">
              <h3>Complete Follow-up</h3>
              <button className="wa-close-btn" onClick={() => setCompletingFollowUpId(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCompleteFollowUpSubmit}>
              <div className="wa-modal-body">
                <div className="wa-form-group">
                  <label>Add Completion Note / Customer Feedback (Optional)</label>
                  <textarea 
                    rows={4} 
                    value={completionNote} 
                    onChange={(e) => setCompletionNote(e.target.value)} 
                    placeholder="Enter details about the customer conversation, status, next steps..."
                    style={{ background: 'var(--db-sf2)', border: '1.5px solid var(--db-bd)', color: 'var(--db-tx)', width: '100%', padding: '0.75rem', borderRadius: '10px' }}
                  />
                </div>
              </div>
              <div className="wa-modal-footer">
                <button type="button" className="wa-btn cancel" onClick={() => setCompletingFollowUpId(null)}>Cancel</button>
                <button type="submit" className="wa-btn send" style={{ background: '#22c55e' }}>Complete Follow-up</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AnimatePresence>{toast&&<motion.div className="db-toast success" initial={{opacity:0,y:50}} animate={{opacity:1,y:0}} exit={{opacity:0,y:50}}>{toast}</motion.div>}</AnimatePresence>

      <style jsx>{`
.wa-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem}
.wa-modal-content{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:16px;width:100%;max-width:500px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.5)}
.wa-modal-header{display:flex;justify-content:space-between;align-items:center;padding:1.25rem 1.5rem;border-bottom:1px solid var(--db-bd)}
.wa-modal-header h3{font-family:'Outfit',sans-serif;font-size:1.125rem;font-weight:700;color:var(--db-tx);margin:0}
.wa-close-btn{background:0;border:0;color:var(--db-tx3);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:color .2s}
.wa-close-btn:hover{color:#fff}
.wa-modal-body{padding:1.5rem;display:flex;flex-direction:column;gap:1.25rem}
.wa-form-group{display:flex;flex-direction:column;gap:.5rem}
.wa-form-group label{font-size:.8125rem;font-weight:600;color:var(--db-tx3)}
.wa-form-group select, .wa-form-group textarea{width:100%;padding:.75rem 1rem;background:var(--db-sf2);border:1px solid var(--db-bd);border-radius:10px;color:var(--db-tx);font-family:inherit;font-size:.875rem;outline:none;transition:border-color .2s}
.wa-form-group select:focus, .wa-form-group textarea:focus{border-color:var(--db-gold)}
.wa-form-group textarea{resize:none}
.wa-modal-footer{display:flex;justify-content:flex-end;gap:.75rem;padding:1rem 1.5rem;background:var(--db-sf2);border-top:1px solid var(--db-bd)}
.wa-btn{padding:.625rem 1.25rem;border-radius:9px;font-size:.875rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .2s;border:none}
.wa-btn.cancel{background:0;color:var(--db-tx2);border:1px solid var(--db-bd)}
.wa-btn.cancel:hover{background:var(--db-sf);color:#fff}
.wa-btn.send{background:#25d366;color:#fff;box-shadow:0 4px 12px rgba(37,211,102,0.2)}
.wa-btn.send:hover{background:#20ba59;transform:translateY(-1px);box-shadow:0 6px 15px rgba(37,211,102,0.3)}
.crm-detail-layout{display:grid;grid-template-columns:280px 1fr;gap:1.25rem;align-items:flex-start}
.crm-sidebar{}
.crm-panel{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:16px;padding:1.25rem}
.crm-info-row{display:flex;justify-content:space-between;padding:.4rem 0;border-bottom:1px solid var(--db-bd);font-size:.8125rem}
.crm-info-row:last-child{border-bottom:none}
.crm-info-row span:first-child{color:var(--db-tx3)}
.crm-info-row span:last-child{color:var(--db-tx);font-weight:500;text-align:right;max-width:60%}
.crm-tabs {
  display: flex;
  gap: 1.5rem;
  border-bottom: 1px solid var(--db-bd);
  margin-bottom: 1.5rem;
  overflow-x: auto;
  padding-bottom: 2px;
}
.crm-tab {
  padding: 0.625rem 0.25rem;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 0.875rem;
  font-family: inherit;
  cursor: pointer;
  background: none;
  color: var(--db-tx2);
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}
.crm-tab:hover {
  color: var(--db-tx);
}
.crm-tab.active {
  color: var(--db-gold);
  border-bottom-color: var(--db-gold);
}
.emp-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.emp-field label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--db-tx3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.emp-field input, .emp-field select {
  width: 100%;
  padding: 0.625rem 0.875rem;
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  border-radius: 8px;
  color: var(--db-tx);
  font-size: 0.8125rem;
  outline: none;
  transition: all 0.2s;
}
.emp-field input:focus, .emp-field select:focus {
  border-color: var(--db-gold);
  box-shadow: 0 0 0 2px rgba(225, 6, 19, 0.1);
}
.crm-action-btn{display:flex;align-items:center;gap:.375rem;padding:.5rem .875rem;border-radius:9px;font-size:.8125rem;font-weight:600;text-decoration:none;border:1px solid var(--db-bd);color:var(--db-tx2);transition:all .2s;background:var(--db-sf)}
.crm-action-btn:hover,.crm-action-btn.call:hover{border-color:#3b82f6;color:#3b82f6}
.crm-action-btn.wa:hover{border-color:#22c55e;color:#22c55e}
.crm-action-btn.email:hover{border-color:#f59e0b;color:#f59e0b}
.crm-add-btn{display:flex;align-items:center;gap:.375rem;background:linear-gradient(135deg,#E10613,#c70511);color:#fff;border:none;padding:.5rem 1.125rem;border-radius:9px;font-size:.8125rem;font-weight:600;font-family:inherit;cursor:pointer}
.crm-timeline-row{display:flex;gap:1rem;padding:.875rem 0;border-bottom:1px solid var(--db-bd);position:relative}
.crm-timeline-row:last-child{border-bottom:none}
.crm-tl-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:5px}
.crm-fu-item{display:flex;align-items:center;gap:.75rem;padding:.75rem;background:var(--db-sf2);border-radius:10px;margin-bottom:.5rem}
.crm-fu-status{font-size:.6875rem;font-weight:700;padding:.25rem .5rem;border-radius:99px;text-transform:capitalize;background:var(--db-sf);border:1px solid var(--db-bd);color:var(--db-tx3);flex-shrink:0}
.crm-fu-status.completed{background:rgba(34,197,94,.12);color:#22c55e;border-color:rgba(34,197,94,.3)}
.crm-fu-status.pending{background:rgba(245,158,11,.12);color:#f59e0b;border-color:rgba(245,158,11,.3)}
.crm-fu-status.missed{background:rgba(225,6,19,.12);color:#E10613;border-color:rgba(225,6,19,.3)}
.crm-note-input {
  width: 100%;
  padding: 0.75rem;
  background: var(--db-sf2);
  border: 1px solid var(--db-bd);
  border-radius: 10px;
  color: var(--db-tx);
  font-family: inherit;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;
  outline: none;
  transition: border-color 0.2s;
}
.crm-note-input:focus{border-color:var(--db-gold)}
.crm-note-item{padding:.875rem;background:var(--db-sf2);border-radius:10px;margin-bottom:.5rem;border-left:3px solid #6366f1}
.crm-card-btn{width:28px;height:28px;background:var(--db-sf);border:1px solid var(--db-bd);border-radius:7px;display:flex;align-items:center;justify-content:center;color:var(--db-tx3);cursor:pointer;transition:all .2s;flex-shrink:0}
.crm-card-btn:hover{border-color:var(--db-gold);color:var(--db-gold)}
.crm-status-badge{font-size:.6875rem;font-weight:600;padding:.25rem .625rem;border-radius:99px;white-space:nowrap}
.crm-back-btn {
  display: flex;
  align-items: center;
  gap: .375rem;
  padding: .5rem .875rem;
  border-radius: 9px;
  font-size: .8125rem;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid var(--db-bd);
  color: var(--db-tx2);
  transition: all 0.2s;
  background: var(--db-sf);
  cursor: pointer;
}
.crm-back-btn:hover {
  background: var(--db-sf2);
  border-color: var(--db-gold);
  color: var(--db-gold);
}
@media(max-width:768px){.crm-detail-layout{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
