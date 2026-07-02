'use client';
import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft, Phone, MessageCircle, Plus, CheckCircle2, X, 
  Calendar, User, Mail, MapPin, DollarSign, Clock, FileText, ChevronRight, Tag,
  Upload, Check, ShieldAlert, Award
} from 'lucide-react';
import { useEmpContext } from '../../../layout';
import { LEAD_STAGES, FOLLOW_UP_TYPE_LABELS, type Lead, type LeadStatus, type FollowUp, type CustomerNote, formatBudget } from '@/types/crm';

const openPdf = (url: string) => {
  if (url.startsWith('data:application/pdf')) {
    const pdfWindow = window.open("");
    if (pdfWindow) {
      pdfWindow.document.write(
        `<iframe width='100%' height='100%' src='${url}' style='border:0;position:fixed;top:0;left:0;right:0;bottom:0;'></iframe>`
      );
    }
  } else {
    window.open(url, '_blank');
  }
};

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

  return (
    <div style={{ background: 'var(--db-sf2, #f8fafc)', border: '1px solid var(--db-bd, #e2e8f0)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginTop: '0.5rem', width: '100%' }} className="inspection-report-card">
      {/* Top Header Card */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', padding: '1rem 1.25rem' }} className="inspection-report-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
              📋 Used Car Inspection Report
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
              Inspector: {headerInfo.inspector || '—'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ background: '#e10613', color: '#fff', fontSize: '0.7rem', fontWeight: 750, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              Value: {headerInfo.value || '—'}
            </span>
            <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.7rem', fontWeight: 750, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              Rating: {headerInfo.overall || '—'}
            </span>
            <span style={{ background: '#10b981', color: '#fff', fontSize: '0.7rem', fontWeight: 750, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              {headerInfo.action || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Sections */}
      <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', background: 'var(--db-sf, #fff)' }} className="inspection-report-grid">
        {sections.map((sec, idx) => {
          const isMedia = sec.title.toLowerCase().includes('media') || sec.title.toLowerCase().includes('photo');
          return (
            <div key={idx} style={{ background: 'var(--db-sf2, #f8fafc)', padding: '0.875rem', borderRadius: '8px', border: '1px solid var(--db-bd, #e2e8f0)' }} className="inspection-report-section">
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 750, color: '#e10613', borderBottom: '1.5px solid var(--db-bd, #f1f5f9)', paddingBottom: '4px' }}>
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
                              <img src={url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
  const [wizardStep, setWizardStep] = useState(1);
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
    return hasSellNote;
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

  const addNote = async () => {
    if (!newNote.trim()||!employee) return;
    // Auto-claim if unassigned
    if (!lead?.assigned_to) {
      await claimLeadSilent();
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

  const submitInspection = async () => {
    if (!employee) return;
    try {
      setClaiming(true);
      // 1. Format detailed Inspection Report note
      const photoLinks = [];
      if (uploads['Exterior_Front'] && uploads['Exterior_Front'] !== 'Uploading...') photoLinks.push(`- **Front Photo:** ${uploads['Exterior_Front']}`);
      if (uploads['Exterior_Rear'] && uploads['Exterior_Rear'] !== 'Uploading...') photoLinks.push(`- **Rear Photo:** ${uploads['Exterior_Rear']}`);
      if (uploads['Exterior_Left Side'] && uploads['Exterior_Left Side'] !== 'Uploading...') photoLinks.push(`- **Left Side Photo:** ${uploads['Exterior_Left Side']}`);
      if (uploads['Exterior_Right Side'] && uploads['Exterior_Right Side'] !== 'Uploading...') photoLinks.push(`- **Right Side Photo:** ${uploads['Exterior_Right Side']}`);
      if (uploads['Engine_Bay'] && uploads['Engine_Bay'] !== 'Uploading...') photoLinks.push(`- **Engine Bay Photo:** ${uploads['Engine_Bay']}`);
      if (uploads['Interior_Cabin'] && uploads['Interior_Cabin'] !== 'Uploading...') photoLinks.push(`- **Interior Cabin Photo:** ${uploads['Interior_Cabin']}`);
      if (uploads['Documents'] && uploads['Documents'] !== 'Uploading...') photoLinks.push(`- **Documents File:** ${uploads['Documents']}`);

      const photosSection = photoLinks.length > 0
        ? `\n\n#### 📸 Uploaded Media\n${photoLinks.join('\n')}`
        : '';

      const formattedReport = `### 📋 Used Car Inspection Report
**Overall Condition:** ${inspectForm.overallCondition.toUpperCase()} | **Recommended Action:** ${inspectForm.recommendedAction.toUpperCase()}
**Estimated Value:** INR ${inspectForm.estimatedValue}
**Inspector:** ${inspectForm.inspectorName} on ${inspectForm.inspectionDate}

#### 🚗 Vehicle Information
- **Reg No:** ${inspectForm.regNo || '—'}
- **VIN:** ${inspectForm.vin || '—'}
- **Brand / Model / Variant:** ${inspectForm.brand} ${inspectForm.model} ${inspectForm.variant} (${inspectForm.year})
- **Fuel / Transmission:** ${inspectForm.fuelType} / ${inspectForm.transmissionType}
- **Odometer:** ${inspectForm.odometer} KM | **Owners:** ${inspectForm.owners}

#### 🎨 Exterior Condition
- **Body & Paint:** Paint: ${inspectForm.paintCondition} | Rust: ${inspectForm.rustInspection}
- **Body Defects:** ${inspectForm.bodyCondition.join(', ') || 'None'}
- **Glass / Windshield:** Windshield: ${inspectForm.windshieldCondition}
- **Lights Working:** ${inspectForm.lightsWorking.join(', ') || 'None'}
- **Tyre Tread Left:** FL: ${inspectForm.treadFL || '—'}%, FR: ${inspectForm.treadFR || '—'}%, RL: ${inspectForm.treadRL || '—'}%, RR: ${inspectForm.treadRR || '—'}% (Spare: ${inspectForm.spareTyre})
- **Exterior Notes:** ${inspectForm.exteriorNotes || 'None'}

#### 🛋️ Interior Condition
- **Odour:** ${inspectForm.odour} | **Seats:** ${inspectForm.seatCondition} | **Seatbelt:** ${inspectForm.seatbeltCheck}
- **Electrical Controls:** A/C: ${inspectForm.acWorking} | Infotainment: ${inspectForm.infoWorking} | Windows: ${inspectForm.winWorking} | Locks: ${inspectForm.lockWorking} | Horn: ${inspectForm.hornWorking}
- **Warning Lights:** ${inspectForm.warningLights.join(', ') || 'None'}
- **Remarks:** ${inspectForm.interiorRemarks || 'None'}

#### ⚙️ Mechanical & Suspension
- **Fluids:** Oil: ${inspectForm.engineOil} | Coolant: ${inspectForm.coolant} | Brake Fluid: ${inspectForm.brakeFluid} | Steering Fluid: ${inspectForm.steeringFluid}
- **Leakages:** ${inspectForm.leakages.join(', ') || 'None'}
- **Battery:** Age: ${inspectForm.batteryAge || '—'} months | Terminals: ${inspectForm.batteryTerminal}
- **Transmission:** Shift: ${inspectForm.transmissionResponse}
- **Suspension / Chassis:** Bounce: ${inspectForm.bounceTest} | Frame: ${inspectForm.frameCondition} | Alignment: ${inspectForm.alignment} | Noise: ${inspectForm.suspensionNoise}
- **Comments:** ${inspectForm.mechanicalComments || 'None'}

#### 🏁 Test Drive & Docs
- **Cold Start:** ${inspectForm.coldStart} | **Steering:** ${inspectForm.steeringPerformance} | **Brake:** ${inspectForm.brakePerformance} | **Acceleration:** ${inspectForm.acceleration}
- **Noises Observed:** ${inspectForm.testDriveNoises.join(', ') || 'None'}
- **Evaluation Notes:** ${inspectForm.testDriveNotes || 'None'}
- **Verification Check:** ${inspectForm.docsVerified.join(', ') || 'None'}
- **Vehicle Category:** Type: ${inspectForm.vehicleType} | Warranty: ${inspectForm.warrantyAvailable}
${photosSection}`;

      const cleanVal = inspectForm.estimatedValue.replace(/[^0-9]/g, '');
      const parsedVal = cleanVal ? parseInt(cleanVal) : null;

      // 2. Claim and update lead via server PATCH endpoint (bypasses RLS limits)
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'claim',
          updateData: {
            lead_status: 'contacted',
            budget: parsedVal,
            interested_car: `${inspectForm.brand} ${inspectForm.model} (${inspectForm.year})`
          },
          note: formattedReport,
          inspectionData: {
            ...inspectForm,
            uploads
          },
          activityLog: {
            action: 'inspection_submitted',
            details: `Inspected ${inspectForm.brand} ${inspectForm.model} - Value: INR ${inspectForm.estimatedValue}`
          }
        })
      });
      
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'Failed to submit inspection');
        setClaiming(false);
        return;
      }

      showToast('🎉 Inspection saved and lead claimed successfully!');
      setShowInspection(false);
      loadAll();
    } catch (err) {
      console.error(err);
      showToast('Error saving inspection report');
    }
    setClaiming(false);
  };

  const handlePhotoUpload = (field: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = field === 'Documents' ? 'image/*,application/pdf' : 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploads(prev => ({ ...prev, [field]: 'Uploading...' }));
      const reader = new FileReader();
      reader.onload = () => {
        setUploads(prev => ({ ...prev, [field]: reader.result as string }));
        showToast('Photo uploaded successfully');
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const toggleCheckbox = (field: 'bodyCondition' | 'lightsWorking' | 'warningLights' | 'leakages' | 'testDriveNoises' | 'docsVerified', value: string) => {
    setInspectForm(prev => {
      const current = prev[field] as string[];
      const updated = current.includes(value) 
        ? current.filter(v => v !== value) 
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const addFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    if (!fuForm.follow_up_type) {
      showToast('Please select a follow-up type');
      return;
    }
    if (!fuForm.priority) {
      showToast('Please select a priority');
      return;
    }
    // Auto-claim if unassigned
    if (!lead?.assigned_to) {
      await claimLeadSilent();
    }
    await supabase.from('follow_ups').insert({ lead_id:id, employee_id:employee.id, ...fuForm });
    setFuForm({ follow_up_type:'', scheduled_at:'', notes:'', priority:'' });
    loadAll(); showToast('Follow-up scheduled!');
  };

  const complete = async (fuId: string) => {
    await supabase.from('follow_ups').update({ status:'completed', completed_at:new Date().toISOString() }).eq('id',fuId);
    loadAll(); showToast('Done!');
  };

  const changeStatus = async (s: LeadStatus) => {
    // Auto-claim if unassigned
    if (!lead?.assigned_to) {
      await claimLeadSilent();
    }
    await supabase.from('leads').update({ lead_status:s, updated_at:new Date().toISOString() }).eq('id',id);
    if (employee) await supabase.from('crm_activity_logs').insert({ lead_id:id, employee_id:employee.id, action:'status_change', details:`→ ${s}` });
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
          {/* Claim Lead Button - Red Auto Bourn Theme */}
          {!isAssigned && (
            <button 
              onClick={handleClaimClick} 
              disabled={claiming}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                background: 'linear-gradient(135deg, #E10613, #c70511)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 15px rgba(225, 6, 19, 0.25)'
              }}
            >
              <User size={15}/> {claiming ? 'Processing...' : 'Claim Lead (Assign to Me)'}
            </button>
          )}

          <a href={`tel:${lead.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.625rem 1.25rem', background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s' }}>
            <Phone size={15} /> Call Customer
          </a>
          <button onClick={() => openWhatsAppComposer('welcome')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.625rem 1.25rem', background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '12px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
            <MessageCircle size={15} /> WhatsApp
          </button>
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
                  <input type="datetime-local" required value={fuForm.scheduled_at} onChange={e => setFuForm({ ...fuForm, scheduled_at: e.target.value })} style={{ padding: '0.625rem', border: '1.5px solid var(--db-bd, rgba(0,0,0,0.08))', borderRadius: '8px', fontFamily: 'inherit', background: '#fff', color: 'inherit' }} />
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Used Car Inspection Modal Dialog - Styled with Solid Opaque Card container & Red Accents */}
      <AnimatePresence>
        {showInspection && (
          <div className="wa-modal-overlay">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ 
                maxWidth: '850px', 
                width: '95%', 
                maxHeight: '90vh', 
                display: 'flex', 
                flexDirection: 'column',
                backgroundColor: '#ffffff', // Solid white background
                color: '#000000',
                border: '1.5px solid rgba(0, 0, 0, 0.12)',
                borderRadius: '20px', 
                overflow: 'hidden', 
                boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                zIndex: 99999
              }}
            >
              <div className="wa-modal-header" style={{ padding: '1.25rem 1.75rem', background: '#ffffff', borderBottom: '1.5px solid rgba(0, 0, 0, 0.08)' }}>
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E10613' }}>
                    <ShieldAlert size={20} style={{ color: '#E10613' }} /> Used Car Inspection Report
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#555' }}>
                    Fill out the checklist to complete physical inspection &amp; claim seller lead
                  </p>
                </div>
                <button className="wa-close-btn" style={{ color: '#555' }} onClick={() => setShowInspection(false)}><X size={20}/></button>
              </div>

              {/* Progress Indicator Ring / bar */}
              <div style={{ background: '#f8f9fa', padding: '0.75rem 1.75rem', display: 'flex', gap: '1.5rem', borderBottom: '1.5px solid rgba(0,0,0,0.08)', overflowX: 'auto' }}>
                {[
                  { step: 1, label: 'Vehicle Info' },
                  { step: 2, label: 'Exterior' },
                  { step: 3, label: 'Interior & Engine' },
                  { step: 4, label: 'Suspension & Drive' },
                  { step: 5, label: 'Category & Final' },
                ].map(s => (
                  <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: wizardStep === s.step ? 1 : 0.5, flexShrink: 0 }}>
                    <span style={{ 
                      width: '24px', height: '24px', borderRadius: '50%', background: wizardStep >= s.step ? '#E10613' : '#ddd',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800
                    }}>
                      {s.step}
                    </span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: wizardStep === s.step ? 700 : 500, color: wizardStep === s.step ? '#000000' : '#555555' }}>{s.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem', backgroundColor: '#ffffff' }} className="inspection-modal-body">
                {/* WIZARD STEP 1: VEHICLE INFORMATION */}
                {wizardStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#E10613' }}>Vehicle Information</h4>
                    <div className="wa-form-grid" style={{ gap: '1.25rem' }}>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Vehicle Registration Number</label>
                        <input style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} type="text" placeholder="E.g. TN-07-BY-1234" value={inspectForm.regNo} onChange={e => setInspectForm({ ...inspectForm, regNo: e.target.value })} />
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Vehicle Identification Number (VIN)</label>
                        <input style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} type="text" placeholder="17 digit chassis number" value={inspectForm.vin} onChange={e => setInspectForm({ ...inspectForm, vin: e.target.value })} />
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Brand / Manufacturer</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.brand} onChange={e => setInspectForm({ ...inspectForm, brand: e.target.value })}>
                          <option value="">Select Brand</option>
                          {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Model</label>
                        <input style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} type="text" placeholder="E.g. C-Class / 5 Series" value={inspectForm.model} onChange={e => setInspectForm({ ...inspectForm, model: e.target.value })} />
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Variant</label>
                        <input style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} type="text" placeholder="E.g. C220d Progressive / 530d M Sport" value={inspectForm.variant} onChange={e => setInspectForm({ ...inspectForm, variant: e.target.value })} />
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Manufacturing Year</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.year} onChange={e => setInspectForm({ ...inspectForm, year: e.target.value })}>
                          <option value="">Select Year</option>
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Current Odometer Reading (KM)</label>
                        <input style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} type="number" placeholder="E.g. 42000" value={inspectForm.odometer} onChange={e => setInspectForm({ ...inspectForm, odometer: e.target.value })} />
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Number of Previous Owners</label>
                        <input style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} type="number" placeholder="E.g. 1" value={inspectForm.owners} onChange={e => setInspectForm({ ...inspectForm, owners: e.target.value })} />
                      </div>
                      
                      <div className="wa-form-group" style={{ gridColumn: '1/-1' }}>
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '8px' }}>Fuel Type</label>
                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                          {['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'].map(f => (
                            <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.875rem', color: '#111' }}>
                              <input type="radio" name="fuelType" checked={inspectForm.fuelType === f} onChange={() => setInspectForm({ ...inspectForm, fuelType: f })} />
                              {f}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="wa-form-group" style={{ gridColumn: '1/-1' }}>
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '8px' }}>Transmission Type</label>
                        <div style={{ display: 'flex', gap: '1.25rem' }}>
                          {['Manual', 'Automatic'].map(t => (
                            <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.875rem', color: '#111' }}>
                              <input type="radio" name="trans" checked={inspectForm.transmissionType === t} onChange={() => setInspectForm({ ...inspectForm, transmissionType: t })} />
                              {t}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* WIZARD STEP 2: EXTERIOR INSPECTION */}
                {wizardStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#E10613' }}>1. Exterior Inspection</h4>
                    
                    <div className="wa-form-group">
                      <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '8px' }}>Body Condition (Select defects)</label>
                      <div className="wa-form-grid" style={{ gap: '8px' }}>
                        {[
                          'No visible damage',
                          'Minor scratches',
                          'Dents present',
                          'Repainted panels',
                          'Accident repair signs'
                        ].map(def => (
                          <label key={def} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.875rem', color: '#111' }}>
                            <input type="checkbox" checked={inspectForm.bodyCondition.includes(def)} onChange={() => toggleCheckbox('bodyCondition', def)} />
                            {def}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="wa-form-group">
                      <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '6px' }}>Upload Photos</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                        {['Front', 'Rear', 'Left Side', 'Right Side'].map(dir => {
                          const key = `Exterior_${dir}`;
                          const isUploaded = uploads[key] && uploads[key] !== 'Uploading...';
                          const isUploading = uploads[key] === 'Uploading...';
                          return (
                            <div key={dir} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <button 
                                onClick={() => handlePhotoUpload(key)} 
                                className="mock-upload-btn"
                                style={{ 
                                  height: '80px', 
                                  padding: '4px',
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  justifyContent: 'center', 
                                  alignItems: 'center',
                                  border: isUploaded ? '1.5px solid #22c55e' : '1.5px dashed rgba(0,0,0,0.15)',
                                  background: '#f9f9f9',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}
                              >
                                {isUploaded ? (
                                  <>
                                    <img src={uploads[key]} alt={dir} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(34, 197, 94, 0.85)', color: '#fff', fontSize: '10px', fontWeight: 750, textAlign: 'center', padding: '2px 0' }}>
                                      {dir} ✓
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <Upload size={16} style={{ color: '#E10613', marginBottom: '4px' }} />
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#333' }}>
                                      {isUploading ? 'Uploading...' : `Upload ${dir}`}
                                    </span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="wa-form-grid" style={{ gap: '1.25rem' }}>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Paint Condition</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.paintCondition} onChange={e => setInspectForm({ ...inspectForm, paintCondition: e.target.value })}>
                          <option value="Original paint">Original paint</option>
                          <option value="Colour mismatch detected">Colour mismatch detected</option>
                          <option value="Overspray visible">Overspray visible</option>
                        </select>
                      </div>

                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Rust Inspection</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.rustInspection} onChange={e => setInspectForm({ ...inspectForm, rustInspection: e.target.value })}>
                          <option value="No rust">No rust</option>
                          <option value="Surface rust">Surface rust</option>
                          <option value="Structural rust">Structural rust</option>
                        </select>
                      </div>

                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Windshield Condition</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.windshieldCondition} onChange={e => setInspectForm({ ...inspectForm, windshieldCondition: e.target.value })}>
                          <option value="Good">Good</option>
                          <option value="Cracked">Cracked</option>
                          <option value="Replaced">Replaced</option>
                        </select>
                      </div>

                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Spare Tyre Available</label>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '4px' }}>
                          {['Yes', 'No'].map(st => (
                            <label key={st} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#111' }}>
                              <input type="radio" name="spareTyre" checked={inspectForm.spareTyre === st} onChange={() => setInspectForm({ ...inspectForm, spareTyre: st })} />
                              {st}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="wa-form-group">
                      <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '8px' }}>Lights Working</label>
                      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                        {['Headlights', 'Tail Lamps', 'Indicators', 'Fog Lamps'].map(l => (
                          <label key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#111' }}>
                            <input type="checkbox" checked={inspectForm.lightsWorking.includes(l)} onChange={() => toggleCheckbox('lightsWorking', l)} />
                            {l}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="wa-form-group">
                      <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '6px' }}>Tyre Tread Remaining (%)</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        {['FL', 'FR', 'RL', 'RR'].map(pos => (
                          <input style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} key={pos} type="number" placeholder={`${pos} Tread %`} value={inspectForm[`tread${pos}` as keyof typeof inspectForm] as string} onChange={e => setInspectForm({ ...inspectForm, [`tread${pos}`]: e.target.value })} />
                        ))}
                      </div>
                    </div>

                    <div className="wa-form-group">
                      <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Exterior Notes</label>
                      <textarea style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} rows={2} value={inspectForm.exteriorNotes} onChange={e => setInspectForm({ ...inspectForm, exteriorNotes: e.target.value })} placeholder="Add any details about scratches, bumps, dents..." />
                    </div>
                  </div>
                )}

                {/* WIZARD STEP 3: INTERIOR & MECHANICAL INSPECTION */}
                {wizardStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#E10613' }}>2. Interior Inspection</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Cabin Odour</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.odour} onChange={e => setInspectForm({ ...inspectForm, odour: e.target.value })}>
                          <option value="Fresh">Fresh</option>
                          <option value="Mild Moisture">Mild Moisture</option>
                          <option value="Water Damage Smell">Water Damage Smell</option>
                        </select>
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Seat Condition</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.seatCondition} onChange={e => setInspectForm({ ...inspectForm, seatCondition: e.target.value })}>
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Worn">Worn</option>
                        </select>
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Seatbelt Check</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.seatbeltCheck} onChange={e => setInspectForm({ ...inspectForm, seatbeltCheck: e.target.value })}>
                          <option value="Working">Working</option>
                          <option value="Requires Repair">Requires Repair</option>
                        </select>
                      </div>
                    </div>

                    <div className="wa-form-group">
                      <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '8px' }}>Controls &amp; Features Check</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                        {[
                          { label: 'Air Conditioning', field: 'acWorking' },
                          { label: 'Infotainment System', field: 'infoWorking' },
                          { label: 'Power Windows', field: 'winWorking' },
                          { label: 'Central Locking', field: 'lockWorking' },
                          { label: 'Horn Operation', field: 'hornWorking' },
                        ].map(ctrl => (
                          <div key={ctrl.field} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.1)' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#333' }}>{ctrl.label}</span>
                            <select 
                              style={{ width: 'auto', padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', background: '#ffffff', color: '#000000', border: '1px solid #ccc' }} 
                              value={inspectForm[ctrl.field as keyof typeof inspectForm] as string} 
                              onChange={e => setInspectForm({ ...inspectForm, [ctrl.field]: e.target.value })}
                            >
                              <option value="Working">Working</option>
                              <option value="Not Working">Not Working</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="wa-form-group">
                      <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '8px' }}>Dashboard Warning Indicators</label>
                      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                        {['No Warning Lights', 'Engine Warning', 'ABS Warning', 'Battery Warning'].map(w => (
                          <label key={w} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#111' }}>
                            <input type="checkbox" checked={inspectForm.warningLights.includes(w)} onChange={() => toggleCheckbox('warningLights', w)} />
                            {w}
                          </label>
                        ))}
                      </div>
                    </div>

                    <h4 style={{ margin: '1rem 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#E10613' }}>3. Mechanical Inspection</h4>
                    <div className="wa-form-grid" style={{ gap: '1.25rem' }}>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Engine Oil Level / Quality</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.engineOil} onChange={e => setInspectForm({ ...inspectForm, engineOil: e.target.value })}>
                          <option value="Good">Good</option>
                          <option value="Low">Low</option>
                          <option value="Dirty">Dirty</option>
                        </select>
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Coolant Level</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.coolant} onChange={e => setInspectForm({ ...inspectForm, coolant: e.target.value })}>
                          <option value="Good">Good</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Brake Fluid Quality</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.brakeFluid} onChange={e => setInspectForm({ ...inspectForm, brakeFluid: e.target.value })}>
                          <option value="Good">Good</option>
                          <option value="Replace">Replace</option>
                        </select>
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Power Steering Fluid</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.steeringFluid} onChange={e => setInspectForm({ ...inspectForm, steeringFluid: e.target.value })}>
                          <option value="Good">Good</option>
                          <option value="Replace">Replace</option>
                        </select>
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Battery Age (Months)</label>
                        <input style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} type="number" placeholder="Months since battery install" value={inspectForm.batteryAge} onChange={e => setInspectForm({ ...inspectForm, batteryAge: e.target.value })} />
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Battery Terminals Condition</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.batteryTerminal} onChange={e => setInspectForm({ ...inspectForm, batteryTerminal: e.target.value })}>
                          <option value="Clean">Clean</option>
                          <option value="Corrosion Found">Corrosion Found</option>
                        </select>
                      </div>
                    </div>

                    <div className="wa-form-group">
                      <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '8px' }}>Fluid Leakage Inspection</label>
                      <div style={{ display: 'flex', gap: '1.25rem' }}>
                        {['No Leaks', 'Oil Leak', 'Coolant Leak'].map(leak => (
                          <label key={leak} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#111' }}>
                            <input type="checkbox" checked={inspectForm.leakages.includes(leak)} onChange={() => toggleCheckbox('leakages', leak)} />
                            {leak}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="wa-form-group">
                      <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '6px' }}>Upload Engine / Interior Photos</label>
                      <div className="wa-form-grid" style={{ gap: '12px' }}>
                        {[
                          { label: 'Engine Bay', key: 'Engine_Bay', btnText: 'Engine Photo' },
                          { label: 'Interior Cabin', key: 'Interior_Cabin', btnText: 'Interior Photo' }
                        ].map(item => {
                          const isUploaded = uploads[item.key] && uploads[item.key] !== 'Uploading...';
                          const isUploading = uploads[item.key] === 'Uploading...';
                          return (
                            <button 
                              key={item.key}
                              onClick={() => handlePhotoUpload(item.key)} 
                              className="mock-upload-btn"
                              style={{ 
                                height: '90px', 
                                padding: '4px',
                                display: 'flex', 
                                flexDirection: 'column', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                border: isUploaded ? '1.5px solid #22c55e' : '1.5px dashed rgba(0,0,0,0.15)',
                                background: '#f9f9f9',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              {isUploaded ? (
                                <>
                                  <img src={uploads[item.key]} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(34, 197, 94, 0.85)', color: '#fff', fontSize: '10px', fontWeight: 750, textAlign: 'center', padding: '2px 0' }}>
                                    {item.label} ✓
                                  </div>
                                </>
                              ) : (
                                <>
                                  <Upload size={18} style={{ color: '#E10613', marginBottom: '4px' }} />
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#333' }}>
                                    {isUploading ? 'Uploading...' : `Upload ${item.btnText}`}
                                  </span>
                                </>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="wa-form-group">
                      <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Inspector Comments / Remarks</label>
                      <textarea style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} rows={2} value={inspectForm.mechanicalComments} onChange={e => setInspectForm({ ...inspectForm, mechanicalComments: e.target.value })} placeholder="Add notes on mechanical wear, gearshifts, belts, leak points..." />
                    </div>
                  </div>
                )}

                {/* WIZARD STEP 4: SUSPENSION & TEST DRIVE EVALUATION */}
                {wizardStep === 4 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#E10613' }}>4. Suspension &amp; Frame</h4>
                    <div className="wa-form-grid" style={{ gap: '1.25rem' }}>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Bounce Test</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.bounceTest} onChange={e => setInspectForm({ ...inspectForm, bounceTest: e.target.value })}>
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                        </select>
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Frame / Structural Condition</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.frameCondition} onChange={e => setInspectForm({ ...inspectForm, frameCondition: e.target.value })}>
                          <option value="Good">Good</option>
                          <option value="Rust Present">Rust Present</option>
                          <option value="Repair Marks Found">Repair Marks Found</option>
                        </select>
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Wheel Alignment Test</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.alignment} onChange={e => setInspectForm({ ...inspectForm, alignment: e.target.value })}>
                          <option value="Proper">Proper</option>
                          <option value="Requires Alignment">Requires Alignment</option>
                        </select>
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Suspension Noise</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.suspensionNoise} onChange={e => setInspectForm({ ...inspectForm, suspensionNoise: e.target.value })}>
                          <option value="None">None</option>
                          <option value="Minor">Minor</option>
                          <option value="Major">Major</option>
                        </select>
                      </div>
                    </div>

                    <h4 style={{ margin: '1rem 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#E10613' }}>5. Test Drive Evaluation</h4>
                    <div className="wa-form-grid" style={{ gap: '1.25rem' }}>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Cold Start Performance</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.coldStart} onChange={e => setInspectForm({ ...inspectForm, coldStart: e.target.value })}>
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                        </select>
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Steering Performance</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.steeringPerformance} onChange={e => setInspectForm({ ...inspectForm, steeringPerformance: e.target.value })}>
                          <option value="Stable">Stable</option>
                          <option value="Pulling">Pulling</option>
                        </select>
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Braking Response</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.brakePerformance} onChange={e => setInspectForm({ ...inspectForm, brakePerformance: e.target.value })}>
                          <option value="Good">Good</option>
                          <option value="Requires Service">Requires Service</option>
                        </select>
                      </div>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Acceleration Response</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.acceleration} onChange={e => setInspectForm({ ...inspectForm, acceleration: e.target.value })}>
                          <option value="Smooth">Smooth</option>
                          <option value="Delayed">Delayed</option>
                        </select>
                      </div>
                    </div>

                    <div className="wa-form-group">
                      <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '8px' }}>Noise Observed During Test Drive</label>
                      <div style={{ display: 'flex', gap: '1.25rem' }}>
                        {['None', 'Engine', 'Suspension', 'Transmission'].map(noise => (
                          <label key={noise} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#111' }}>
                            <input type="checkbox" checked={inspectForm.testDriveNoises.includes(noise)} onChange={() => toggleCheckbox('testDriveNoises', noise)} />
                            {noise}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="wa-form-group">
                      <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Test Drive Evaluation Notes</label>
                      <textarea style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} rows={2} value={inspectForm.testDriveNotes} onChange={e => setInspectForm({ ...inspectForm, testDriveNotes: e.target.value })} placeholder="Describe stability, cornering, acceleration lag, alignment issue remarks..." />
                    </div>
                  </div>
                )}

                {/* WIZARD STEP 5: VEHICLE CATEGORY & DOCUMENTATION VERIFICATION & EVALUATION */}
                {wizardStep === 5 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#E10613' }}>6. Vehicle Category</h4>
                    <div className="wa-form-grid" style={{ gap: '1.25rem' }}>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '6px' }}>Vehicle Type</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          {['Certified Used Vehicle', 'Regular Used Vehicle'].map(vt => (
                            <label key={vt} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#111' }}>
                              <input type="radio" name="vehicleType" checked={inspectForm.vehicleType === vt} onChange={() => setInspectForm({ ...inspectForm, vehicleType: vt })} />
                              {vt}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '6px' }}>Warranty Available</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          {['Yes', 'No'].map(w => (
                            <label key={w} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', color: '#111' }}>
                              <input type="radio" name="warrantyAvailable" checked={inspectForm.warrantyAvailable === w} onChange={() => setInspectForm({ ...inspectForm, warrantyAvailable: w })} />
                              {w}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <h4 style={{ margin: '1rem 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#E10613' }}>7. Document Verification</h4>
                    <div className="wa-form-group">
                      <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '8px' }}>Verify Documents</label>
                      <div className="wa-form-grid" style={{ gap: '8px' }}>
                        {[
                          'Registration Certificate (RC) Verified',
                          'VIN Matched',
                          'Insurance Valid',
                          'Loan NOC Verified',
                          'Form 29 Uploaded',
                          'Form 30 Uploaded',
                          'Pollution Certificate Uploaded',
                          'Road Tax Verified',
                          'Original Invoice Uploaded',
                          'Fitness Certificate Verified'
                        ].map(doc => (
                          <label key={doc} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', color: '#111' }}>
                            <input type="checkbox" checked={inspectForm.docsVerified.includes(doc)} onChange={() => toggleCheckbox('docsVerified', doc)} />
                            {doc}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="wa-form-group">
                      <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '6px' }}>Upload Inspection Documents &amp; Certificates</label>
                      <button 
                        onClick={() => handlePhotoUpload('Documents')} 
                        className="mock-upload-btn" 
                        style={{ 
                          width: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '8px', 
                          background: uploads['Documents'] && uploads['Documents'] !== 'Uploading...' ? '#f0fdf4' : '#fff',
                          border: uploads['Documents'] && uploads['Documents'] !== 'Uploading...' ? '1.5px solid #22c55e' : '1.5px solid rgba(0,0,0,0.15)',
                          color: uploads['Documents'] && uploads['Documents'] !== 'Uploading...' ? '#15803d' : '#333'
                        }}
                      >
                        <Upload size={14} /> {uploads['Documents'] === 'Uploading...' ? 'Uploading...' : uploads['Documents'] ? 'All PDF/Docs Uploaded ✓' : 'Upload Documents (RC, Insurance, Form 29/30)'}
                      </button>
                    </div>

                    <h4 style={{ margin: '1rem 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#E10613' }}>Final Evaluation</h4>
                    <div className="wa-form-grid" style={{ gap: '1.25rem' }}>
                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Overall Vehicle Condition Rating</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.overallCondition} onChange={e => setInspectForm({ ...inspectForm, overallCondition: e.target.value })}>
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                        </select>
                      </div>

                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Estimated Market Value (INR)</label>
                        <input style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} type="text" placeholder="E.g. 45,00,000" value={inspectForm.estimatedValue} onChange={e => setInspectForm({ ...inspectForm, estimatedValue: e.target.value })} />
                      </div>

                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Recommended Action</label>
                        <select style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} value={inspectForm.recommendedAction} onChange={e => setInspectForm({ ...inspectForm, recommendedAction: e.target.value })}>
                          <option value="Approve">Approve / Buy Car</option>
                          <option value="Hold">Hold / Re-evaluate</option>
                          <option value="Reject">Reject Deal</option>
                        </select>
                      </div>

                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Inspector Name</label>
                        <input style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} type="text" placeholder="Consultant Name" value={inspectForm.inspectorName} onChange={e => setInspectForm({ ...inspectForm, inspectorName: e.target.value })} />
                      </div>

                      <div className="wa-form-group">
                        <label style={{ color: '#333', fontWeight: 700, fontSize: '0.8125rem' }}>Inspection Date</label>
                        <input style={{ background: '#ffffff', border: '1.5px solid rgba(0,0,0,0.15)', color: '#000000' }} type="date" value={inspectForm.inspectionDate} onChange={e => setInspectForm({ ...inspectForm, inspectionDate: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard Footer buttons */}
              <div className="wa-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem 1.75rem', background: '#f8f9fa', borderTop: '1.5px solid rgba(0, 0, 0, 0.08)' }}>
                <button 
                  className="wa-btn cancel" 
                  disabled={claiming}
                  onClick={() => {
                    if (wizardStep > 1) {
                      setWizardStep(prev => prev - 1);
                    } else {
                      setShowInspection(false);
                    }
                  }}
                >
                  {wizardStep === 1 ? 'Cancel' : 'Previous'}
                </button>

                {wizardStep < 5 ? (
                  <button 
                    className="wa-btn" 
                    style={{ background: '#E10613', color: '#fff' }}
                    onClick={() => {
                      // Simple validator for page 1
                      if (wizardStep === 1 && (!inspectForm.brand || !inspectForm.model || !inspectForm.year)) {
                        showToast('Please select Brand, Model, and Year first');
                        return;
                      }
                      setWizardStep(prev => prev + 1);
                    }}
                  >
                    Next Step
                  </button>
                ) : (
                  <button 
                    className="wa-btn" 
                    style={{ background: 'linear-gradient(135deg, #E10613, #c70511)', color: '#fff', boxShadow: '0 4px 15px rgba(225, 6, 19, 0.3)' }}
                    onClick={submitInspection}
                    disabled={claiming}
                  >
                    {claiming ? 'Saving Inspection...' : 'Submit Inspection Report'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
        }
      `}</style>
    </div>
  );
}
