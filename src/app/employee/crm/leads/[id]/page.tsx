'use client';
import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import DateTimePicker from '@/components/DateTimePicker';
import { 
  ArrowLeft, Phone, MessageCircle, Plus, CheckCircle2, X, 
  Calendar, User, Mail, MapPin, DollarSign, Clock, FileText, ChevronRight, Tag,
  Upload, Check, ShieldAlert, Award, ChevronDown, Download, ClipboardCheck, Sparkles, Armchair, Wrench, FileCheck, Camera, ClipboardList, Car
} from 'lucide-react';
import { useEmpContext } from '../../../layout';
import { LEAD_STAGES, FOLLOW_UP_TYPE_LABELS, type Lead, type LeadStatus, type FollowUp, type CustomerNote, formatBudget } from '@/types/crm';
import { getProxiedImageUrl } from '@/lib/utils';
import InspectionModal from '@/components/InspectionModal';
import { downloadInspectionPdf, openPdf } from '@/lib/pdf-utils';

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
    <div style={{ background: 'var(--db-sf2, #f8fafc)', border: '1px solid var(--db-bd, #e2e8f0)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginTop: '0.5rem', width: '100%' }} className="inspection-report-card">
      {/* Top Header Card */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', padding: '1rem 1.25rem' }} className="inspection-report-header">
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
      <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', background: 'var(--db-sf, #fff)' }} className="inspection-report-grid">
        {sections.map((sec, idx) => {
          const isMedia = sec.title.toLowerCase().includes('media') || sec.title.toLowerCase().includes('photo');
          return (
            <div key={idx} style={{ background: 'var(--db-sf2, #f8fafc)', padding: '0.875rem', borderRadius: '8px', border: '1px solid var(--db-bd, #e2e8f0)' }} className="inspection-report-section">
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

const BRANDS = ['Mercedes-Benz', 'BMW', 'Audi', 'Jaguar', 'Land Rover', 'Volvo', 'Porsche', 'Lexus', 'Other'];
const YEARS = Array.from({ length: 17 }, (_, i) => String(2010 + i));

export default function EmpLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { employee } = useEmpContext();
  const [lead, setLead] = useState<Lead|null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [tab, setTab] = useState<'info'|'followups'|'notes'>('info');
  const [newNote, setNewNote] = useState('');
  const [fuForm, setFuForm] = useState({ follow_up_type:'', scheduled_at:'', notes:'', priority:'' });
  const [toast, setToast] = useState('');
  const [editStatus, setEditStatus] = useState(false);
  const [waModal, setWaModal] = useState(false);
  const [waText, setWaText] = useState('');
  const [waTemplate, setWaTemplate] = useState('welcome');
  const [errorMsg, setErrorMsg] = useState('');
  const [claiming, setClaiming] = useState(false);
  const supabase = createClient();

  // Used Car Inspection Modal States
  const [showInspection, setShowInspection] = useState(false);
  const [hasInspection, setHasInspection] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const [inspectForm, setInspectForm] = useState({
    // Section 1: Vehicle Information
    regNo: '',
    vin: '',
    brand: '',
    model: '',
    variant: '',
    year: '',
    fuelType: 'Petrol',
    transmissionType: 'Automatic',
    odometer: '',
    owners: '',

    // Section 2: Exterior Inspection
    bodyCondition: [] as string[],
    paintCondition: 'Original paint',
    rustInspection: 'No rust',
    windshieldCondition: 'Good',
    lightsWorking: [] as string[],
    treadFL: '',
    treadFR: '',
    treadRL: '',
    treadRR: '',
    spareTyre: 'Yes',
    exteriorNotes: '',

    // Section 3: Interior Inspection
    odour: 'Fresh',
    seatCondition: 'Excellent',
    seatbeltCheck: 'Working',
    acWorking: 'Working',
    infoWorking: 'Working',
    winWorking: 'Working',
    lockWorking: 'Working',
    hornWorking: 'Working',
    warningLights: [] as string[],
    interiorRemarks: '',

    // Section 4: Mechanical Inspection
    engineOil: 'Good',
    coolant: 'Good',
    brakeFluid: 'Good',
    steeringFluid: 'Good',
    leakages: [] as string[],
    batteryAge: '',
    batteryTerminal: 'Clean',
    transmissionResponse: 'Smooth',
    mechanicalComments: '',

    // Section 5: Suspension & Frame
    bounceTest: 'Pass',
    frameCondition: 'Good',
    alignment: 'Proper',
    suspensionNoise: 'None',

    // Section 6: Test Drive Evaluation
    coldStart: 'Pass',
    steeringPerformance: 'Stable',
    brakePerformance: 'Good',
    acceleration: 'Smooth',
    testDriveNoises: [] as string[],
    testDriveNotes: '',

    // Section 7: Vehicle Category
    vehicleType: 'Certified Used Vehicle',
    warrantyAvailable: 'No',

    // Section 8: Document Verification
    docsVerified: [] as string[],

    // Section 9: Final Evaluation
    overallCondition: 'Good',
    estimatedValue: '',
    recommendedAction: 'Approve',
    inspectorName: employee?.name || '',
    inspectionDate: new Date().toISOString().substring(0, 10),
  });

  const isSellerLead = () => {
    if (!lead) return false;
    const hasSellNote = notes.some(n => 
      n.note && (n.note.includes('Vehicle Details:') || n.note.includes('Transmission:') || n.note.includes('Fuel Type:'))
    );
    const isSellInterest = lead.interested_car && (
      lead.interested_car.includes('Sell a Vehicle') || 
      lead.interested_car.toLowerCase().includes('sell')
    );
    return !!(hasSellNote || isSellInterest);
  };

  const handleClaimClick = async () => {
    if (isSellerLead()) {
      setShowInspection(true);
    } else {
      await claimLead();
    }
  };

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
    try {
      const res = await fetch(`/api/leads/${id}`);
      const data = await res.json();
      if (data.success) {
        setLead(data.lead);
        setFollowUps(data.followUps || []);
        setNotes(data.notes || []);
        setHasInspection(!!data.inspection);
        
        // Auto pre-populate brand/model/variant if lead details exist
        if (data.lead) {
          const match = data.lead.interested_car?.match(/^([^\s]+)\s+([^\(]+)(?:\s+\((\d+)\))?/);
          
          // Parse sell details from customer notes
          const sellNote = (data.notes || []).find((n: any) => n.note && n.note.includes('Vehicle Details:'))?.note || '';
          
          const extractField = (regex: RegExp) => {
            const m = sellNote.match(regex);
            return m ? m[1].trim() : null;
          };

          const pVariant = extractField(/Variant:\s*(.*)/i);
          const pFuel = extractField(/Fuel Type:\s*(.*)/i);
          const pTrans = extractField(/Transmission:\s*(.*)/i);
          const pMileage = extractField(/Mileage:\s*(\d+)/i);
          const pOwnership = extractField(/Ownership:\s*(.*)/i);
          const pAdditional = extractField(/Additional Details:\s*([\s\S]*)/i);

          let pOwners = '';
          if (pOwnership) {
            if (pOwnership.includes('1')) pOwners = '1';
            else if (pOwnership.includes('2')) pOwners = '2';
            else if (pOwnership.includes('3')) pOwners = '3';
            else if (pOwnership.includes('4')) pOwners = '4';
          }

          let pPaint = 'Original paint';
          let pRust = 'No rust';
          let pWindshield = 'Good';
          let pSpare = 'Yes';

          const checkText = (pAdditional || sellNote || '').toLowerCase();
          
          if (checkText) {
            if (checkText.includes('colour mismatch') || checkText.includes('color mismatch') || checkText.includes('mismatch')) {
              pPaint = 'Colour mismatch detected';
            } else if (checkText.includes('overspray')) {
              pPaint = 'Overspray visible';
            } else if (checkText.includes('original paint') || checkText.includes('good paint') || checkText.includes('excellent paint')) {
              pPaint = 'Original paint';
            }

            if (checkText.includes('surface rust')) {
              pRust = 'Surface rust';
            } else if (checkText.includes('structural rust') || checkText.includes('heavy rust') || checkText.includes('rust in frame')) {
              pRust = 'Structural rust';
            } else if (checkText.includes('no rust') || checkText.includes('rust free') || checkText.includes('rust-free')) {
              pRust = 'No rust';
            }

            if (checkText.includes('crack') || checkText.includes('cracked')) {
              pWindshield = 'Cracked';
            } else if (checkText.includes('replaced')) {
              pWindshield = 'Replaced';
            } else if (checkText.includes('good windshield') || checkText.includes('clear windshield') || checkText.includes('perfect glass')) {
              pWindshield = 'Good';
            }

            if (checkText.includes('no spare') || checkText.includes('spare missing') || checkText.includes('spare tyre missing') || checkText.includes('spare tire missing') || checkText.includes('spare tyre not available')) {
              pSpare = 'No';
            } else if (checkText.includes('spare tyre') || checkText.includes('spare tire') || checkText.includes('spare available')) {
              pSpare = 'Yes';
            }
          }

          setInspectForm(prev => ({
            ...prev,
            brand: match ? match[1] : '',
            model: match ? match[2]?.trim() : '',
            year: match && match[3] ? match[3] : '',
            estimatedValue: data.lead.budget ? String(data.lead.budget) : '',
            inspectorName: employee?.name || '',
            
            // Auto-populated from sell notes
            variant: pVariant || prev.variant,
            fuelType: pFuel || prev.fuelType,
            transmissionType: pTrans || prev.transmissionType,
            odometer: pMileage || prev.odometer,
            owners: pOwners || prev.owners,
            paintCondition: pPaint,
            rustInspection: pRust,
            windshieldCondition: pWindshield,
            spareTyre: pSpare
          }));
        }
      } else {
        setErrorMsg(data.error || 'Failed to load lead details');
      }
    } catch (e) {
      setErrorMsg('Failed to load lead details');
    }
  };

  useEffect(() => { loadAll(); }, [id]);

  useEffect(() => {
    if (showInspection || waModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showInspection, waModal]);

  const addNote = async () => {
    if (!newNote.trim()||!employee) return;
    if (lead?.assigned_to !== employee.id) {
      showToast('You cannot comment on an unassigned lead or lead assigned to someone else.');
      return;
    }
    await supabase.from('customer_notes').insert({ lead_id:id, employee_id:employee.id, note:newNote });
    setNewNote(''); loadAll(); showToast('Note saved');
  };

  const claimLeadSilent = async () => {
    if (!employee) return;
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'claim' })
    });
  };

  const claimLead = async () => {
    if (!employee) return;
    setClaiming(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'claim' })
      });
      const data = await res.json();
      if (data.success) {
        showToast('🎉 Lead claimed and added to your CRM!');
        loadAll();
      } else {
        showToast(data.error || 'Failed to claim lead');
      }
    } catch (err) {
      showToast('Error claiming lead');
    }
    setClaiming(false);
  };



  const addFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    if (lead?.assigned_to !== employee.id) {
      showToast('You cannot modify an unassigned lead.');
      return;
    }
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
    await supabase.from('follow_ups').insert({ lead_id:id, employee_id:employee.id, ...fuForm });
    setFuForm({ follow_up_type:'', scheduled_at:'', notes:'', priority:'' });
    loadAll(); showToast('Follow-up scheduled!');
  };

  const complete = async (fuId: string) => {
    if (!employee) return;
    if (lead?.assigned_to !== employee.id) {
      showToast('You cannot modify an unassigned lead.');
      return;
    }
    await supabase.from('follow_ups').update({ status:'completed', completed_at:new Date().toISOString() }).eq('id',fuId);
    loadAll(); showToast('Done!');
  };

  const changeStatus = async (s: LeadStatus) => {
    if (!employee) return;
    if (lead?.assigned_to !== employee.id) {
      showToast('You cannot modify an unassigned lead.');
      return;
    }
    await supabase.from('leads').update({ lead_status:s, updated_at:new Date().toISOString() }).eq('id',id);
    if (employee) await supabase.from('crm_activity_logs').insert({ lead_id:id, employee_id:employee.id, action:'status_change', details:`→ ${s}` });
    
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
          employee_id: lead?.assigned_to || employee.id,
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

  if (errorMsg) return <div style={{padding:'3rem',color:'#999',textAlign:'center',fontFamily:"'Outfit',sans-serif"}}>{errorMsg} <br/><br/><Link href="/employee/crm" style={{color:'#E10613',fontWeight:700}}>Back to CRM</Link></div>;
  if (!lead) return <div style={{padding:'5rem',color:'#999',textAlign:'center',fontFamily:"'Outfit',sans-serif"}}>Loading Lead Details… <br/><br/><Link href="/employee/crm" style={{color:'#E10613'}}>Back</Link></div>;

  const stage = LEAD_STAGES.find(s=>s.key===lead.lead_status);
  const isAssigned = !!lead.assigned_to;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto', fontFamily: "'Outfit', sans-serif" }} className="crm-details-container">
      {/* Top breadcrumb */}
      <Link href="/employee/crm" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--db-tx2, #555)', textDecoration: 'none', fontSize: '.875rem', fontWeight: 600, marginBottom: '1.5rem', transition: 'color 0.2s' }} className="hover-link">
        <ArrowLeft size={16} /> Back to CRM
      </Link>

      {/* Main Header Card */}
      <div style={{ background: 'var(--db-sf, #ffffff)', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.06))', borderRadius: '20px', padding: '1.5rem 2rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--db-tx, #000)', margin: 0 }}>{lead.customer_name}</h1>
            <span style={{ background: stage?.bg, color: stage?.color, fontWeight: 800, fontSize: '.75rem', padding: '.35rem 1rem', borderRadius: '100px', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              {stage?.label}
            </span>
            {isSellerLead() && (
              <span style={{ background: 'rgba(225,6,19,0.08)', color: '#E10613', fontWeight: 800, fontSize: '.75rem', padding: '.35rem 1rem', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Award size={12}/> SELLER
              </span>
            )}
          </div>
          <p style={{ fontSize: '.875rem', color: 'var(--db-tx2, #555)', margin: '.375rem 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={14} style={{ color: '#E10613' }} /> {lead.city || 'Chennai'} {lead.state && `· ${lead.state}`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {lead.assigned_to !== employee?.id && (
            <div style={{ padding: '0.625rem 1.25rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700 }}>
              ⚠️ Unassigned / Assigned to another consultant. Only the assignee can modify this lead.
            </div>
          )}

          <a href={`tel:${lead.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.625rem 1.25rem', background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s' }}>
            <Phone size={15} /> Call Customer
          </a>
          <button onClick={() => openWhatsAppComposer('welcome')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.625rem 1.25rem', background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            <MessageCircle size={15} /> WhatsApp
          </button>
          {lead.assigned_to === employee?.id && isSellerLead() && (
            <button onClick={() => setShowInspection(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.625rem 1.25rem', background: 'rgba(225, 6, 19, 0.08)', color: '#E10613', border: '1px solid rgba(225, 6, 19, 0.2)', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
              <ClipboardCheck size={15} /> {hasInspection ? 'Edit Inspection' : 'Vehicle Inspection'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gap: '1.5rem', alignItems: 'flex-start' }} className="crm-details-grid">
        {/* Left Column: Tabbed Information */}
        <div style={{ background: 'var(--db-sf, #ffffff)', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.06))', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.01)' }}>
          {/* Tab Switchers */}
          <div style={{ display: 'flex', gap: '8px', background: 'var(--db-sf2, #f5f5f5)', borderRadius: '14px', padding: '6px', marginBottom: '1.5rem' }}>
            {(['info', 'followups', 'notes'] as const).map(t => (
              <button 
                key={t} 
                onClick={() => setTab(t)} 
                style={{ 
                  flex: 1, 
                  padding: '0.625rem', 
                  border: 'none', 
                  borderRadius: '10px', 
                  fontFamily: 'inherit', 
                  fontSize: '0.875rem', 
                  fontWeight: tab === t ? 700 : 600, 
                  cursor: 'pointer', 
                  background: tab === t ? 'var(--db-sf, #ffffff)' : 'transparent', 
                  color: tab === t ? '#E10613' : 'var(--db-tx2, #555)', 
                  boxShadow: tab === t ? '0 4px 12px rgba(0,0,0,0.04)' : 'none',
                  transition: 'all 0.2s' 
                }}
              >
                {t === 'info' ? 'Customer Profile' : t === 'followups' ? `Follow-ups (${followUps.length})` : `Notes (${notes.length})`}
              </button>
            ))}
          </div>

          {/* Info Tab */}
          {tab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--db-tx, #000)' }}>Customer Profile Details</h2>
              {[
                { label: 'Interested Vehicle', value: lead.interested_car, icon: <Tag size={16} /> },
                { label: 'Estimated Budget', value: formatBudget(lead.budget), icon: <DollarSign size={16} /> },
                { label: 'Lead Source', value: lead.source, icon: <ChevronRight size={16} /> },
                { label: 'Purchase Timeline', value: lead.purchase_timeline, icon: <Clock size={16} /> },
                { label: 'Email Address', value: lead.email, icon: <Mail size={16} /> },
                { label: 'WhatsApp / Contact', value: lead.whatsapp || lead.phone, icon: <MessageCircle size={16} /> },
                { label: 'Occupation', value: lead.occupation, icon: <User size={16} /> },
                { label: 'Location', value: `${lead.city || 'Chennai'} · ${lead.state || 'Tamil Nadu'}`, icon: <MapPin size={16} /> }
              ].map((item, index) => (
                <div key={index} className="crm-profile-row" style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--db-bd, rgba(0,0,0,0.05))', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--db-tx2, #555)', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                    <span style={{ color: '#E10613', opacity: 0.85 }}>{item.icon}</span>
                    {item.label}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--db-tx, #000)' }}>{item.value || '—'}</span>
                </div>
              ))}
            </div>
          )}

          {/* Follow-ups Tab */}
          {tab === 'followups' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--db-tx, #000)' }}>Schedule Follow-up</h2>
              <form onSubmit={addFollowUp} className="wa-form-grid" style={{ background: 'var(--db-sf2, #f9f9f9)', border: '1px solid var(--db-bd, rgba(0,0,0,0.05))', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', gap: '1rem' }}>
                <div className="emp-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--db-tx2, #555)' }}>Type</label>
                  <select required value={fuForm.follow_up_type} onChange={e => setFuForm({ ...fuForm, follow_up_type: e.target.value })} style={{ padding: '0.625rem', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.08))', borderRadius: '8px', fontFamily: 'inherit', background: '#fff', color: 'inherit' }}>
                    <option value="" disabled>Select an option</option>
                    {Object.entries(FOLLOW_UP_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="emp-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--db-tx2, #555)' }}>Date &amp; Time</label>
                  <DateTimePicker
                    value={fuForm.scheduled_at}
                    onChange={(val) => setFuForm({ ...fuForm, scheduled_at: val })}
                    required
                  />
                </div>
                <div className="emp-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--db-tx2, #555)' }}>Priority</label>
                  <select required value={fuForm.priority} onChange={e => setFuForm({ ...fuForm, priority: e.target.value })} style={{ padding: '0.625rem', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.08))', borderRadius: '8px', fontFamily: 'inherit', background: '#fff', color: 'inherit' }}>
                    <option value="" disabled>Select an option</option>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="emp-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--db-tx2, #555)' }}>Notes / Task Description</label>
                  <input placeholder="E.g. send catalog on whatsapp" value={fuForm.notes} onChange={e => setFuForm({ ...fuForm, notes: e.target.value })} style={{ padding: '0.625rem', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.08))', borderRadius: '8px', fontFamily: 'inherit', background: '#fff', color: 'inherit' }} />
                </div>
                <button type="submit" style={{ gridColumn: '1/-1', background: 'linear-gradient(135deg, #E10613, #c70511)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '10px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 15px rgba(225, 6, 19, 0.2)' }} className="btn-hover-glow">
                  <Plus size={16} /> Schedule Follow-up
                </button>
              </form>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--db-tx, #000)' }}>Scheduled Tasks &amp; History</h3>
              {followUps.map(fu => (
                <div key={fu.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--db-sf2, #fdfdfd)', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.04))', borderRadius: '14px', marginBottom: '.625rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--db-tx, #000)' }}>{FOLLOW_UP_TYPE_LABELS[fu.follow_up_type]}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--db-tx2, #555)', marginTop: '2px' }}>
                      {new Date(fu.scheduled_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })} {fu.notes && ` · ${fu.notes}`}
                    </div>
                  </div>
                  <span style={{ fontSize: '.6875rem', fontWeight: 800, padding: '.3rem .6rem', borderRadius: '8px', background: fu.status === 'completed' ? 'rgba(34,197,94,.12)' : fu.status === 'missed' ? 'rgba(225,6,19,.12)' : 'rgba(245,158,11,.12)', color: fu.status === 'completed' ? '#22c55e' : fu.status === 'missed' ? '#E10613' : '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {fu.status}
                  </span>
                  {fu.status === 'pending' && (
                    <button onClick={() => complete(fu.id)} style={{ background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.2)', color: '#22c55e', borderRadius: '8px', padding: '.4rem', cursor: 'pointer', display: 'flex', transition: 'all 0.2s' }} title="Mark as Completed" className="complete-btn">
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              {followUps.length === 0 && <p style={{ color: 'var(--db-tx3, #777)', fontSize: '.875rem', textAlign: 'center', padding: '2rem' }}>No follow-up activities scheduled.</p>}
            </div>
          )}

          {/* Notes Tab */}
          {tab === 'notes' && (
            <div>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--db-tx, #000)' }}>Customer Timeline Notes</h2>
              <div className="notes-form-container">
                <textarea 
                  value={newNote} 
                  onChange={e => setNewNote(e.target.value)} 
                  placeholder="Add details about customer phone call, preferences, next steps..." 
                  rows={2} 
                  style={{ flex: 1, padding: '0.75rem 1rem', background: 'var(--db-sf2, #f9f9f9)', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.08))', borderRadius: '12px', color: 'inherit', fontFamily: 'inherit', fontSize: '.875rem', resize: 'none', outline: 'none' }}
                />
                <button onClick={addNote} className="notes-submit-btn">
                  <Plus size={20} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notes.map(n => (
                  <div key={n.id} style={{ background: 'var(--db-sf2, #fafafa)', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.04))', borderLeft: n.note.includes('Inspection Report') ? '4px solid #E10613' : '4px solid #6366f1', borderRadius: '14px' }} className="timeline-note-item">
                    <div style={{ fontSize: '.9rem', lineHeight: 1.5, color: 'var(--db-tx, #000)', fontWeight: 500 }}>{renderInspectionReport(n.note)}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--db-tx3, #777)', marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span>👤 {(n.employee as {name:string}|null)?.name || 'Admin'}</span>
                      <span>{new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                ))}
              </div>
              {notes.length === 0 && <p style={{ color: 'var(--db-tx3, #777)', fontSize: '.875rem', textAlign: 'center', padding: '2rem' }}>No customer notes yet.</p>}
            </div>
          )}
        </div>

        {/* Right Column: Sidebar Metadata & Status Control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Lead Lifecycle Status Card */}
          <div style={{ background: 'var(--db-sf, #ffffff)', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.06))', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.01)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--db-tx, #000)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} style={{ color: '#E10613' }} /> Lead Lifecycle
            </h3>
            
            <div style={{ background: 'var(--db-sf2, #fdfdfd)', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.04))', borderRadius: '16px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--db-tx2, #555)', textTransform: 'uppercase', marginBottom: '4px' }}>Current Status</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, color: stage?.color }}>{stage?.label}</div>
            </div>

            <button 
              onClick={() => setEditStatus(!editStatus)} 
              style={{ 
                width: '100%', 
                background: 'transparent', 
                border: '1.5px solid var(--db-bd, rgba(0,0,0,0.15))', 
                color: 'var(--db-tx, #000)', 
                padding: '0.75rem', 
                borderRadius: '12px', 
                fontSize: '0.875rem', 
                fontWeight: 700, 
                cursor: 'pointer', 
                fontFamily: 'inherit',
                transition: 'all 0.2s'
              }}
              className="outline-btn"
            >
              Update Lifecycle Stage
            </button>

            {editStatus && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem', padding: '0.75rem', background: 'var(--db-sf2, #f5f5f5)', borderRadius: '14px', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.05))' }}>
                {LEAD_STAGES.map(s => (
                  <button 
                    key={s.key} 
                    onClick={() => changeStatus(s.key)} 
                    style={{ 
                      background: s.bg, 
                      color: s.color, 
                      border: 'none', 
                      padding: '0.5rem 1rem', 
                      borderRadius: '8px', 
                      fontSize: '0.75rem', 
                      fontWeight: 800, 
                      cursor: 'pointer', 
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'transform 0.1s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {s.label}
                    {lead.lead_status === s.key && <CheckCircle2 size={12} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ownership & System Info Card */}
          <div style={{ background: 'var(--db-sf, #ffffff)', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.06))', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.01)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem', color: 'var(--db-tx, #000)' }}>Lead Meta</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--db-bd, rgba(0,0,0,0.05))' }}>
                <span style={{ color: 'var(--db-tx2, #555)', fontWeight: 600 }}>Assigned Consultant</span>
                <span style={{ fontWeight: 700, color: isAssigned ? '#22c55e' : '#E10613' }}>
                  {isAssigned ? (employee?.id === lead.assigned_to ? 'You' : 'Another Employee') : 'Unassigned'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--db-bd, rgba(0,0,0,0.05))' }}>
                <span style={{ color: 'var(--db-tx2, #555)', fontWeight: 600 }}>Created Date</span>
                <span style={{ fontWeight: 700, color: 'var(--db-tx, #000)' }}>
                  {new Date(lead.created_at).toLocaleString('en-IN', { dateStyle: 'short' })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--db-tx2, #555)', fontWeight: 600 }}>Lead Reference</span>
                <span style={{ fontWeight: 700, color: 'var(--db-tx3, #777)', fontFamily: 'monospace' }}>
                  #{lead.id.substring(0, 8).toUpperCase()}
                </span>
                {/* Used Car Inspection Modal Dialog */}
                <AnimatePresence>
                  {showInspection && (
                    <InspectionModal
                      isOpen={showInspection}
                      onClose={() => setShowInspection(false)}
                      leadId={id}
                      inspectorName={employee?.name || ''}
                      onSuccess={() => {
                        setShowInspection(false);
                        loadAll();
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {waModal && (
        <div className="wa-modal-overlay">
          <div className="wa-modal-content">
            <div className="wa-modal-header">
              <h3>WhatsApp Composer</h3>
              <button className="wa-close-btn" onClick={() => setWaModal(false)}><X size={18} /></button>
            </div>
            <div className="wa-modal-body">
              <div className="wa-form-group">
                <label>Template</label>
                <select value={waTemplate} onChange={(e) => handleTemplateChange(e.target.value)}>
                  <option value="welcome">Welcome Message</option>
                  <option value="followup">Follow-Up Message</option>
                  <option value="testdrive">Test Drive Schedule</option>
                  <option value="custom">Custom Message (Clear text)</option>
                </select>
              </div>
              <div className="wa-form-group">
                <label>Message Content</label>
                <textarea 
                  rows={6} 
                  value={waText} 
                  onChange={(e) => setWaText(e.target.value)} 
                  placeholder="Type message details..."
                />
              </div>
            </div>
            <div className="wa-modal-footer">
              <button className="wa-btn cancel" onClick={() => setWaModal(false)}>Cancel</button>
              <button className="wa-btn send" onClick={sendWhatsAppMessage}>Send WhatsApp</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', background: '#22c55e', color: '#fff', padding: '.75rem 1.25rem', borderRadius: '12px', fontWeight: 600, zIndex: 99999, boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)' }}>{toast}</div>}

      <style jsx>{`
        .hover-link:hover {
          color: #E10613 !important;
        }
        .btn-hover-glow:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(225, 6, 19, 0.35) !important;
        }
        .outline-btn:hover {
          border-color: #E10613 !important;
          color: #E10613 !important;
          background: rgba(225, 6, 19, 0.02) !important;
        }
        .mock-upload-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(225, 6, 19, 0.05);
          border: 1.5px dashed rgba(225, 6, 19, 0.3);
          border-radius: 8px;
          color: #E10613;
          font-family: inherit;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mock-upload-btn:hover {
          background: rgba(225, 6, 19, 0.12);
          border-color: #E10613;
        }
        .wa-modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center;
          z-index: 9999; padding: 1rem; backdrop-filter: blur(4px);
        }
        .wa-modal-content {
          background: var(--db-sf, #ffffff); border: 1.5px solid var(--db-bd, rgba(0,0,0,0.06));
          border-radius: 20px; width: 100%; max-width: 500px; overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        }
        .wa-modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--db-bd, rgba(0,0,0,0.06));
        }
        .wa-modal-header h3 {
          font-size: 1.125rem; fontWeight: 800; color: var(--db-tx, #000); margin: 0;
        }
        .wa-close-btn {
          background: 0; border: 0; color: var(--db-tx2, #555); cursor: pointer;
          display: flex; align-items: center; justify-content: center; transition: color .2s;
        }
        .wa-close-btn:hover { color: #E10613; }
        .wa-modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
        .wa-form-group { display: flex; flex-direction: column; gap: .5rem; }
        .wa-form-group label { font-size: .8125rem; fontWeight: 700; color: var(--db-tx2, #555); }
        .wa-form-group select, 
        .wa-form-group input[type="text"],
        .wa-form-group input[type="number"],
        .wa-form-group input[type="date"],
        .wa-form-group textarea {
          width: 100%; padding: .75rem 1rem; background: var(--db-sf2, #f9f9f9);
          border: 1.5px solid var(--db-bd, rgba(0,0,0,0.08)); border-radius: 10px;
          color: var(--db-tx, #000); font-family: inherit; font-size: .875rem; outline: none;
        }
        .wa-form-group textarea { resize: none; }
        .wa-modal-footer {
          display: flex; justify-content: flex-end; gap: .75rem;
          padding: 1rem 1.5rem; background: var(--db-sf2, #fafafa);
          border-top: 1px solid var(--db-bd, rgba(0,0,0,0.06));
        }
        .wa-btn {
          padding: .625rem 1.25rem; border-radius: 9px; font-size: .875rem;
          fontWeight: 700; font-family: inherit; cursor: pointer; transition: all .2s; border: none;
        }
        .wa-btn.cancel { background: 0; color: var(--db-tx2, #555); border: 1.5px solid var(--db-bd, rgba(0,0,0,0.15)); }
        .wa-btn.cancel:hover { background: var(--db-sf2, #f5f5f5); }
        .wa-btn.send { background: #22c55e; color: #fff; boxShadow: 0 4px 15px rgba(34,197,94,0.2); }
        .wa-btn.send:hover { background: #1eb253; }
        .crm-details-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
        }
        .crm-profile-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .wa-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .crm-details-container {
          padding: 1.5rem !important;
        }
        .timeline-note-item {
          padding: 1rem;
        }
        .notes-form-container {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          align-items: stretch;
        }
        .notes-submit-btn {
          background: linear-gradient(135deg, #E10613, #c70511);
          color: #fff;
          border: none;
          padding: 0 1.25rem;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(225, 6, 19, 0.2);
          transition: all 0.2s;
        }
        @media (max-width: 768px) {
          .crm-details-container {
            padding: 0.75rem 0 !important;
          }
          .crm-details-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 600px) {
          .crm-profile-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          .wa-form-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem !important;
          }
          .notes-form-container {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
          }
          .notes-submit-btn {
            padding: 0.75rem !important;
            border-radius: 10px !important;
          }
          .timeline-note-item {
            padding: 0.75rem !important;
            border-radius: 10px !important;
          }
          .inspection-report-grid {
            padding: 0.5rem !important;
            gap: 0.5rem !important;
          }
          .inspection-report-section {
            padding: 0.5rem !important;
          }
          .inspection-report-header {
            padding: 0.75rem 0.5rem !important;
          }
          .inspection-modal-header {
            padding: 1rem 1rem !important;
          }
          .inspection-modal-progress {
            padding: 0.75rem 1rem !important;
            gap: 1rem !important;
          }
          .inspection-modal-body {
            padding: 1rem !important;
          }
          .inspection-modal-footer {
            padding: 1rem 1rem !important;
          }
          .wa-modal-overlay {
            padding: 0.5rem !important;
          }
        }
        .inspection-modal-header {
          padding: 1.25rem 1.75rem;
        }
        .inspection-modal-progress {
          background: #f8f9fa;
          padding: 0.75rem 1.75rem;
          display: flex;
          gap: 1.5rem;
          overflow-x: auto;
        }
        .inspection-modal-body {
          padding: 1.75rem;
        }
        .inspection-modal-footer {
          padding: 1.25rem 1.75rem;
        }
        :global(.custom-role-select-trigger) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.75rem 1rem;
          background: #ffffff;
          border: 1.5px solid rgba(0,0,0,0.15);
          border-radius: 10px;
          color: #000000;
          font-size: 0.875rem;
          font-family: inherit;
          cursor: pointer;
          user-select: none;
          height: 45px;
          transition: all 0.2s;
        }
        :global(.custom-role-select-trigger:hover) {
          border-color: #E10613;
        }
        :global(.custom-role-dropdown-overlay) {
          position: fixed;
          inset: 0;
          z-index: 999999;
        }
        :global(.custom-role-dropdown-menu) {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          background: #ffffff;
          border: 1.5px solid rgba(0,0,0,0.15);
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          z-index: 1000000;
          overflow: hidden;
        }
        :global(.custom-role-option) {
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: #333333;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }
        :global(.custom-role-option:hover) {
          background: #f1f5f9;
          color: #E10613;
        }
        :global(.custom-role-option.selected) {
          background: rgba(225, 6, 19, 0.05);
          color: #E10613;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
