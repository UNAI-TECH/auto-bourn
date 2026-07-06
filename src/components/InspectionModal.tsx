'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, ChevronDown, Upload } from 'lucide-react';
import { getProxiedImageUrl } from '@/lib/utils';

const BRANDS = ['Mercedes-Benz', 'BMW', 'Audi', 'Jaguar', 'Land Rover', 'Volvo', 'Porsche', 'Lexus', 'Other'];
const YEARS = Array.from({ length: 17 }, (_, i) => String(2010 + i));

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  inspectorName: string;
  onSuccess: () => void;
}

export default function InspectionModal({
  isOpen,
  onClose,
  leadId,
  inspectorName,
  onSuccess
}: InspectionModalProps) {
  const [wizardStep, setWizardStep] = useState(1);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [uploads, setUploads] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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

    // Section 4: Mechanical & Suspension
    engineOil: 'Good',
    coolant: 'Good',
    brakeFluid: 'Good',
    steeringFluid: 'Good',
    leakages: [] as string[],
    batteryAge: '',
    batteryTerminal: 'Clean',
    transmissionResponse: 'Smooth',
    bounceTest: 'Pass',
    frameCondition: 'Good',
    alignment: 'Proper',
    suspensionNoise: 'None',
    mechanicalComments: '',

    // Section 5: Test Drive & Final
    coldStart: 'Pass',
    steeringPerformance: 'Stable',
    brakePerformance: 'Good',
    acceleration: 'Smooth',
    testDriveNoises: [] as string[],
    testDriveNotes: '',
    docsVerified: [] as string[],
    vehicleType: 'Certified Used Vehicle',
    warrantyAvailable: 'No',
    overallCondition: 'Good',
    estimatedValue: '',
    recommendedAction: 'Approve',
    inspectorName: inspectorName || '',
    inspectionDate: new Date().toISOString().substring(0, 10),
  });

  useEffect(() => {
    if (isOpen) {
      setWizardStep(1);
      setUploads({});
      setInspectForm(prev => ({
        ...prev,
        inspectorName: inspectorName || prev.inspectorName,
        inspectionDate: new Date().toISOString().substring(0, 10)
      }));
    }
  }, [isOpen, inspectorName]);

  if (!isOpen) return null;

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

  const submitInspection = async () => {
    try {
      setSubmitting(true);
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
        ? `\n\n#### Uploaded Media\n${photoLinks.join('\n')}`
        : '';

      const formattedReport = `### Used Car Inspection Report
**Overall Condition:** ${inspectForm.overallCondition.toUpperCase()} | **Recommended Action:** ${inspectForm.recommendedAction.toUpperCase()}
**Estimated Value:** INR ${inspectForm.estimatedValue}
**Inspector:** ${inspectForm.inspectorName} on ${inspectForm.inspectionDate}

#### Vehicle Information
- **Reg No:** ${inspectForm.regNo || '—'}
- **VIN:** ${inspectForm.vin || '—'}
- **Brand / Model / Variant:** ${inspectForm.brand} ${inspectForm.model} ${inspectForm.variant} (${inspectForm.year})
- **Fuel / Transmission:** ${inspectForm.fuelType} / ${inspectForm.transmissionType}
- **Odometer:** ${inspectForm.odometer} KM | **Owners:** ${inspectForm.owners}

#### Exterior Condition
- **Body & Paint:** Paint: ${inspectForm.paintCondition} | Rust: ${inspectForm.rustInspection}
- **Body Defects:** ${inspectForm.bodyCondition.join(', ') || 'None'}
- **Glass / Windshield:** Windshield: ${inspectForm.windshieldCondition}
- **Lights Working:** ${inspectForm.lightsWorking.join(', ') || 'None'}
- **Tyre Tread Left:** FL: ${inspectForm.treadFL || '—'}%, FR: ${inspectForm.treadFR || '—'}%, RL: ${inspectForm.treadRL || '—'}%, RR: ${inspectForm.treadRR || '—'}% (Spare: ${inspectForm.spareTyre})
- **Exterior Notes:** ${inspectForm.exteriorNotes || 'None'}

#### Interior Condition
- **Odour:** ${inspectForm.odour} | **Seats:** ${inspectForm.seatCondition} | **Seatbelt:** ${inspectForm.seatbeltCheck}
- **Electrical Controls:** A/C: ${inspectForm.acWorking} | Infotainment: ${inspectForm.infoWorking} | Windows: ${inspectForm.winWorking} | Locks: ${inspectForm.lockWorking} | Horn: ${inspectForm.hornWorking}
- **Warning Lights:** ${inspectForm.warningLights.join(', ') || 'None'}
- **Remarks:** ${inspectForm.interiorRemarks || 'None'}

#### Mechanical & Suspension
- **Fluids:** Oil: ${inspectForm.engineOil} | Coolant: ${inspectForm.coolant} | Brake Fluid: ${inspectForm.brakeFluid} | Steering Fluid: ${inspectForm.steeringFluid}
- **Leakages:** ${inspectForm.leakages.join(', ') || 'None'}
- **Battery:** Age: ${inspectForm.batteryAge || '—'} months | Terminals: ${inspectForm.batteryTerminal}
- **Transmission:** Shift: ${inspectForm.transmissionResponse}
- **Suspension / Chassis:** Bounce: ${inspectForm.bounceTest} | Frame: ${inspectForm.frameCondition} | Alignment: ${inspectForm.alignment} | Noise: ${inspectForm.suspensionNoise}
- **Comments:** ${inspectForm.mechanicalComments || 'None'}

#### Test Drive & Docs
- **Cold Start:** ${inspectForm.coldStart} | **Steering:** ${inspectForm.steeringPerformance} | **Brake:** ${inspectForm.brakePerformance} | **Acceleration:** ${inspectForm.acceleration}
- **Noises Observed:** ${inspectForm.testDriveNoises.join(', ') || 'None'}
- **Evaluation Notes:** ${inspectForm.testDriveNotes || 'None'}
- **Verification Check:** ${inspectForm.docsVerified.join(', ') || 'None'}
- **Vehicle Category:** Type: ${inspectForm.vehicleType} | Warranty: ${inspectForm.warrantyAvailable}
${photosSection}`;

      const cleanVal = inspectForm.estimatedValue.replace(/[^0-9]/g, '');
      const parsedVal = cleanVal ? parseInt(cleanVal) : null;

      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
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
        alert(data.error || 'Failed to submit inspection');
        return;
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Error saving inspection report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wa-modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="inspection-modal-container"
      >
        <div className="wa-modal-header inspection-modal-header">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E10613', margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
              <ShieldAlert size={20} style={{ color: '#E10613' }} /> Used Car Inspection Report
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#555' }}>
              Fill out the checklist to complete physical inspection &amp; evaluate seller lead
            </p>
          </div>
          <button className="wa-close-btn" style={{ color: '#555' }} onClick={onClose}><X size={20}/></button>
        </div>

        {/* Progress Indicator */}
        <div className="inspection-modal-progress">
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

        <div className="inspection-modal-body">
          {/* STEP 1: VEHICLE INFORMATION */}
          {wizardStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#E10613' }}>Vehicle Information</h4>
              <div className="wa-form-grid">
                <div className="wa-form-group">
                  <label>Vehicle Registration Number</label>
                  <input type="text" placeholder="E.g. TN-07-BY-1234" value={inspectForm.regNo} onChange={e => setInspectForm({ ...inspectForm, regNo: e.target.value })} />
                </div>
                <div className="wa-form-group">
                  <label>Vehicle Identification Number (VIN)</label>
                  <input type="text" placeholder="17 digit chassis number" value={inspectForm.vin} onChange={e => setInspectForm({ ...inspectForm, vin: e.target.value })} />
                </div>
                <div className="wa-form-group" style={{ position: 'relative', zIndex: brandDropdownOpen ? 1000001 : 1 }}>
                  <label>Brand / Manufacturer</label>
                  <div className="custom-role-select-trigger" onClick={() => setBrandDropdownOpen(!brandDropdownOpen)}>
                    <span>{inspectForm.brand || 'Select Brand'}</span>
                    <ChevronDown size={18} style={{ color: '#555', transition: 'transform 0.2s', transform: brandDropdownOpen ? 'rotate(180deg)' : 'none' }} />
                  </div>
                  <AnimatePresence>
                    {brandDropdownOpen && (
                      <>
                        <div className="custom-role-dropdown-overlay" onClick={() => setBrandDropdownOpen(false)} />
                        <motion.div
                          className="custom-role-dropdown-menu"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                        >
                          {BRANDS.map(b => (
                            <div
                              key={b}
                              className={`custom-role-option ${inspectForm.brand === b ? 'selected' : ''}`}
                              onClick={() => {
                                setInspectForm({ ...inspectForm, brand: b });
                                setBrandDropdownOpen(false);
                              }}
                            >
                              {b}
                            </div>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <div className="wa-form-group">
                  <label>Model Name</label>
                  <input type="text" placeholder="E.g. E-Class, 5 Series" value={inspectForm.model} onChange={e => setInspectForm({ ...inspectForm, model: e.target.value })} />
                </div>
                <div className="wa-form-group">
                  <label>Variant / Trim</label>
                  <input type="text" placeholder="E.g. E220d Expression" value={inspectForm.variant} onChange={e => setInspectForm({ ...inspectForm, variant: e.target.value })} />
                </div>
                <div className="wa-form-group" style={{ position: 'relative', zIndex: yearDropdownOpen ? 1000001 : 1 }}>
                  <label>Manufacturing Year</label>
                  <div className="custom-role-select-trigger" onClick={() => setYearDropdownOpen(!yearDropdownOpen)}>
                    <span>{inspectForm.year || 'Select Year'}</span>
                    <ChevronDown size={18} style={{ color: '#555', transition: 'transform 0.2s', transform: yearDropdownOpen ? 'rotate(180deg)' : 'none' }} />
                  </div>
                  <AnimatePresence>
                    {yearDropdownOpen && (
                      <>
                        <div className="custom-role-dropdown-overlay" onClick={() => setYearDropdownOpen(false)} />
                        <motion.div
                          className="custom-role-dropdown-menu"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                        >
                          {YEARS.map(y => (
                            <div
                              key={y}
                              className={`custom-role-option ${inspectForm.year === y ? 'selected' : ''}`}
                              onClick={() => {
                                setInspectForm({ ...inspectForm, year: y });
                                setYearDropdownOpen(false);
                              }}
                            >
                              {y}
                            </div>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <div className="wa-form-group">
                  <label>Fuel Type</label>
                  <select value={inspectForm.fuelType} onChange={e => setInspectForm({ ...inspectForm, fuelType: e.target.value })}>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Transmission</label>
                  <select value={inspectForm.transmissionType} onChange={e => setInspectForm({ ...inspectForm, transmissionType: e.target.value })}>
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Odometer Reading (KM)</label>
                  <input type="number" placeholder="Current odometer reading" value={inspectForm.odometer} onChange={e => setInspectForm({ ...inspectForm, odometer: e.target.value })} />
                </div>
                <div className="wa-form-group">
                  <label>No. of Owners</label>
                  <input type="number" placeholder="1, 2, 3..." value={inspectForm.owners} onChange={e => setInspectForm({ ...inspectForm, owners: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EXTERIOR INSPECTION */}
          {wizardStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#E10613' }}>1. Exterior Inspection</h4>
              <div className="wa-form-grid">
                <div className="wa-form-group">
                  <label>Paint Condition</label>
                  <select value={inspectForm.paintCondition} onChange={e => setInspectForm({ ...inspectForm, paintCondition: e.target.value })}>
                    <option value="Original paint">Original Paint</option>
                    <option value="Repainted panels">Repainted Panels</option>
                    <option value="Scratches present">Scratches Present</option>
                    <option value="Dents present">Dents Present</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Rust Inspection</label>
                  <select value={inspectForm.rustInspection} onChange={e => setInspectForm({ ...inspectForm, rustInspection: e.target.value })}>
                    <option value="No rust">No Rust</option>
                    <option value="Surface rust found">Surface Rust Found</option>
                    <option value="Structural rust found">Structural Rust Found</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Glass &amp; Windshield</label>
                  <select value={inspectForm.windshieldCondition} onChange={e => setInspectForm({ ...inspectForm, windshieldCondition: e.target.value })}>
                    <option value="Good">Good / Crack Free</option>
                    <option value="Chipped">Chipped</option>
                    <option value="Cracked">Cracked</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Spare Tyre Available</label>
                  <select value={inspectForm.spareTyre} onChange={e => setInspectForm({ ...inspectForm, spareTyre: e.target.value })}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div className="wa-form-group">
                <label style={{ marginBottom: '6px' }}>Tyre Tread Depth Remaining (%)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {['FL', 'FR', 'RL', 'RR'].map(pos => (
                    <div key={pos} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700 }}>{pos}:</span>
                      <input 
                        type="number" 
                        placeholder="%" 
                        value={(inspectForm as any)[`tread${pos}`]} 
                        onChange={e => setInspectForm({ ...inspectForm, [`tread${pos}`]: e.target.value })} 
                        style={{ padding: '6px', height: '36px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="wa-form-group">
                <label style={{ marginBottom: '8px' }}>Body Panel Defects / Repairs</label>
                <div className="checkbox-group">
                  {['Front Bumper Damage', 'Rear Bumper Damage', 'Left Fender Scratch', 'Right Fender Scratch', 'Door Dents Left', 'Door Dents Right', 'Roof Dents', 'Quarter Panel Scratches'].map(defect => (
                    <label key={defect} className="checkbox-label">
                      <input type="checkbox" checked={inspectForm.bodyCondition.includes(defect)} onChange={() => toggleCheckbox('bodyCondition', defect)} />
                      {defect}
                    </label>
                  ))}
                </div>
              </div>

              <div className="wa-form-group">
                <label style={{ marginBottom: '8px' }}>Lighting System Verification</label>
                <div className="checkbox-group">
                  {['Headlights OK', 'Tail lights OK', 'Turn Indicators OK', 'Fog lamps OK', 'Brake lights OK', 'Reverse lights OK'].map(light => (
                    <label key={light} className="checkbox-label">
                      <input type="checkbox" checked={inspectForm.lightsWorking.includes(light)} onChange={() => toggleCheckbox('lightsWorking', light)} />
                      {light}
                    </label>
                  ))}
                </div>
              </div>

              <div className="wa-form-group">
                <label style={{ marginBottom: '6px' }}>Upload Exterior Photos</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {['Front', 'Rear', 'Left Side', 'Right Side'].map(side => {
                    const key = `Exterior_${side}`;
                    const isUploaded = uploads[key] && uploads[key] !== 'Uploading...';
                    const isUploading = uploads[key] === 'Uploading...';
                    return (
                      <button 
                        key={side}
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
                            <img src={getProxiedImageUrl(uploads[key])} alt={side} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(34, 197, 94, 0.85)', color: '#fff', fontSize: '9px', fontWeight: 750, textAlign: 'center', padding: '1px 0' }}>
                              {side} ✓
                            </div>
                          </>
                        ) : (
                          <>
                            <Upload size={16} style={{ color: '#E10613', marginBottom: '4px' }} />
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#333' }}>
                              {isUploading ? 'Uploading...' : `${side} Photo`}
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="wa-form-group">
                <label>Remarks / Notes (Exterior)</label>
                <textarea rows={2} value={inspectForm.exteriorNotes} onChange={e => setInspectForm({ ...inspectForm, exteriorNotes: e.target.value })} placeholder="Add notes on panels, tires, glass..." />
              </div>
            </div>
          )}

          {/* STEP 3: INTERIOR & ENGINE */}
          {wizardStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#E10613' }}>2. Interior &amp; Mechanical Inspection</h4>
              <div className="wa-form-grid">
                <div className="wa-form-group">
                  <label>Cabin Odour</label>
                  <select value={inspectForm.odour} onChange={e => setInspectForm({ ...inspectForm, odour: e.target.value })}>
                    <option value="Fresh">Fresh / Clean</option>
                    <option value="Musty / Damp">Musty / Damp</option>
                    <option value="Smoke smell">Smoke Smell</option>
                    <option value="Pet smell">Pet Smell</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Seat Upholstery Condition</label>
                  <select value={inspectForm.seatCondition} onChange={e => setInspectForm({ ...inspectForm, seatCondition: e.target.value })}>
                    <option value="Excellent">Excellent / No Wear</option>
                    <option value="Good">Good / Minor Wear</option>
                    <option value="Fair">Fair / Worn Leather</option>
                    <option value="Poor">Poor / Torn Seats</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Seatbelt Retractors</label>
                  <select value={inspectForm.seatbeltCheck} onChange={e => setInspectForm({ ...inspectForm, seatbeltCheck: e.target.value })}>
                    <option value="Working">All Working Properly</option>
                    <option value="Slow response">Slow Response / Weak Tension</option>
                    <option value="Damaged">Damaged / Non-functional</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Air Conditioning Performance</label>
                  <select value={inspectForm.acWorking} onChange={e => setInspectForm({ ...inspectForm, acWorking: e.target.value })}>
                    <option value="Working">Excellent Cooling</option>
                    <option value="Weak cooling">Weak Cooling</option>
                    <option value="Needs service">Needs Service / Leakage</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Infotainment &amp; Audio Screen</label>
                  <select value={inspectForm.infoWorking} onChange={e => setInspectForm({ ...inspectForm, infoWorking: e.target.value })}>
                    <option value="Working">All Screen &amp; Speakers OK</option>
                    <option value="Display issues">Display Issues / No Sound</option>
                    <option value="Dead unit">Dead Unit</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Power Windows</label>
                  <select value={inspectForm.winWorking} onChange={e => setInspectForm({ ...inspectForm, winWorking: e.target.value })}>
                    <option value="Working">All Windows Working</option>
                    <option value="Slow response">Slow Window Response</option>
                    <option value="One or more failed">One or more Failed</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Central Lock / Key Fob</label>
                  <select value={inspectForm.lockWorking} onChange={e => setInspectForm({ ...inspectForm, lockWorking: e.target.value })}>
                    <option value="Working">Working Perfectly</option>
                    <option value="Key Fob Weak">Key Fob Weak</option>
                    <option value="Locks Failed">Failed Locking Mechanism</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Horn Checklist</label>
                  <select value={inspectForm.hornWorking} onChange={e => setInspectForm({ ...inspectForm, hornWorking: e.target.value })}>
                    <option value="Working">Working Perfectly</option>
                    <option value="Muted / Weak">Muted or Weak Tone</option>
                    <option value="Failed">Failed / Dead</option>
                  </select>
                </div>
              </div>

              <div className="wa-form-group">
                <label style={{ marginBottom: '8px' }}>Dashboard Instrument Warnings</label>
                <div className="checkbox-group">
                  {['Check Engine Light', 'ABS Light', 'Airbag (SRS) Light', 'Brake Warning Light', 'Oil Pressure Light', 'Battery Charging Warning', 'Tire Pressure (TPMS)', 'None'].map(warning => (
                    <label key={warning} className="checkbox-label">
                      <input type="checkbox" checked={inspectForm.warningLights.includes(warning)} onChange={() => toggleCheckbox('warningLights', warning)} />
                      {warning}
                    </label>
                  ))}
                </div>
              </div>

              <h4 style={{ margin: '1rem 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#E10613' }}>3. Under the Hood</h4>
              <div className="wa-form-grid">
                <div className="wa-form-group">
                  <label>Engine Oil Level &amp; Quality</label>
                  <select value={inspectForm.engineOil} onChange={e => setInspectForm({ ...inspectForm, engineOil: e.target.value })}>
                    <option value="Good">Level OK / Clean Oil</option>
                    <option value="Needs Replacement">Dirty / Black Oil</option>
                    <option value="Low level">Low Level / Needs Topping</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Coolant Reservoir</label>
                  <select value={inspectForm.coolant} onChange={e => setInspectForm({ ...inspectForm, coolant: e.target.value })}>
                    <option value="Good">Level OK / Clean Coolant</option>
                    <option value="Contaminated">Dirty / Contaminated Coolant</option>
                    <option value="Low level">Low Level / Leaks Found</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Brake Fluid Condition</label>
                  <select value={inspectForm.brakeFluid} onChange={e => setInspectForm({ ...inspectForm, brakeFluid: e.target.value })}>
                    <option value="Good">Level OK / Transparent</option>
                    <option value="Dark / Aged">Dark / Aged Fluid</option>
                    <option value="Low level">Low Level</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Power Steering Fluid</label>
                  <select value={inspectForm.steeringFluid} onChange={e => setInspectForm({ ...inspectForm, steeringFluid: e.target.value })}>
                    <option value="Good">Level OK / Smooth Response</option>
                    <option value="Low level">Low Level</option>
                    <option value="Not Applicable">Not Applicable (EPS)</option>
                  </select>
                </div>
              </div>

              <div className="wa-form-group">
                <label style={{ marginBottom: '8px' }}>Fluid Leakage Inspection</label>
                <div className="checkbox-group">
                  {['Engine Oil Leakage', 'Coolant Leakage', 'Brake Fluid Leakage', 'Gearbox Oil Leakage', 'Power Steering Fluid Leakage', 'None'].map(leak => (
                    <label key={leak} className="checkbox-label">
                      <input type="checkbox" checked={inspectForm.leakages.includes(leak)} onChange={() => toggleCheckbox('leakages', leak)} />
                      {leak}
                    </label>
                  ))}
                </div>
              </div>

              <div className="wa-form-group">
                <label style={{ marginBottom: '6px' }}>Upload Engine / Interior Photos</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
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
                            <img src={getProxiedImageUrl(uploads[item.key])} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
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
                <label>Remarks / Notes (Cabin &amp; Mechanical)</label>
                <textarea rows={2} value={inspectForm.mechanicalComments} onChange={e => setInspectForm({ ...inspectForm, mechanicalComments: e.target.value })} placeholder="Add notes on mechanical wear, gearshifts, leaks..." />
              </div>
            </div>
          )}

          {/* STEP 4: SUSPENSION & DRIVE */}
          {wizardStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#E10613' }}>4. Suspension &amp; Frame</h4>
              <div className="wa-form-grid">
                <div className="wa-form-group">
                  <label>Bounce Test</label>
                  <select value={inspectForm.bounceTest} onChange={e => setInspectForm({ ...inspectForm, bounceTest: e.target.value })}>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Frame / Structural Condition</label>
                  <select value={inspectForm.frameCondition} onChange={e => setInspectForm({ ...inspectForm, frameCondition: e.target.value })}>
                    <option value="Good">Good</option>
                    <option value="Rust Present">Rust Present</option>
                    <option value="Repair Marks Found">Repair Marks Found</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Wheel Alignment Test</label>
                  <select value={inspectForm.alignment} onChange={e => setInspectForm({ ...inspectForm, alignment: e.target.value })}>
                    <option value="Proper">Proper</option>
                    <option value="Requires Alignment">Requires Alignment</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Suspension Noise</label>
                  <select value={inspectForm.suspensionNoise} onChange={e => setInspectForm({ ...inspectForm, suspensionNoise: e.target.value })}>
                    <option value="None">None</option>
                    <option value="Minor">Minor</option>
                    <option value="Major">Major</option>
                  </select>
                </div>
              </div>

              <h4 style={{ margin: '1rem 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#E10613' }}>5. Test Drive Evaluation</h4>
              <div className="wa-form-grid">
                <div className="wa-form-group">
                  <label>Cold Start Performance</label>
                  <select value={inspectForm.coldStart} onChange={e => setInspectForm({ ...inspectForm, coldStart: e.target.value })}>
                    <option value="Pass">Pass / Quick Crank</option>
                    <option value="Rough start">Rough Start / Delays</option>
                    <option value="Fail">Battery Failure</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Steering Response</label>
                  <select value={inspectForm.steeringPerformance} onChange={e => setInspectForm({ ...inspectForm, steeringPerformance: e.target.value })}>
                    <option value="Stable">Stable / Centered</option>
                    <option value="Pulls Left">Pulls Left</option>
                    <option value="Pulls Right">Pulls Right</option>
                    <option value="Vibration">Vibration Present</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Braking Response</label>
                  <select value={inspectForm.brakePerformance} onChange={e => setInspectForm({ ...inspectForm, brakePerformance: e.target.value })}>
                    <option value="Good">Firm / Solid Stops</option>
                    <option value="Spongey">Spongey Pedal</option>
                    <option value="Pulls under braking">Pulls Under Braking</option>
                    <option value="Squeaking">Squeaking Noise</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Acceleration Response</label>
                  <select value={inspectForm.acceleration} onChange={e => setInspectForm({ ...inspectForm, acceleration: e.target.value })}>
                    <option value="Smooth">Smooth Acceleration</option>
                    <option value="Jerky">Jerky / Stalls</option>
                    <option value="Laggy">Turbo / Throttle Lag</option>
                  </select>
                </div>
              </div>

              <div className="wa-form-group">
                <label style={{ marginBottom: '8px' }}>Test Drive Noises Observed</label>
                <div className="checkbox-group">
                  {['Squeaking Noise (Suspension)', 'Knocking Noise (Engine)', 'Rattling Cabin Noise', 'Wheel Bearing Noise', 'Wind Noise at speed', 'None'].map(noise => (
                    <label key={noise} className="checkbox-label">
                      <input type="checkbox" checked={inspectForm.testDriveNoises.includes(noise)} onChange={() => toggleCheckbox('testDriveNoises', noise)} />
                      {noise}
                    </label>
                  ))}
                </div>
              </div>

              <div className="wa-form-group">
                <label>Test Drive Assessment Notes</label>
                <textarea rows={2} value={inspectForm.testDriveNotes} onChange={e => setInspectForm({ ...inspectForm, testDriveNotes: e.target.value })} placeholder="Add comments about gearbox downshifts, engine temp, tire hum..." />
              </div>
            </div>
          )}

          {/* STEP 5: CATEGORY & FINAL */}
          {wizardStep === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1rem', color: '#E10613' }}>6. Document Verification &amp; Certification</h4>
              <div className="wa-form-grid">
                <div className="wa-form-group">
                  <label>Certified Pre-Owned Category</label>
                  <select value={inspectForm.vehicleType} onChange={e => setInspectForm({ ...inspectForm, vehicleType: e.target.value })}>
                    <option value="Certified Used Vehicle">Certified Used Vehicle</option>
                    <option value="Budget Used Vehicle">Budget Used Vehicle</option>
                    <option value="Value Plus Selection">Value Plus Selection</option>
                    <option value="As-Is Sale Category">As-Is Sale Category</option>
                  </select>
                </div>
                <div className="wa-form-group">
                  <label>Warranty Terms Available</label>
                  <select value={inspectForm.warrantyAvailable} onChange={e => setInspectForm({ ...inspectForm, warrantyAvailable: e.target.value })}>
                    <option value="No">No Warranty</option>
                    <option value="6 Months Certified">6 Months Certified Warranty</option>
                    <option value="12 Months Certified">12 Months Certified Warranty</option>
                  </select>
                </div>
              </div>

              <div className="wa-form-group">
                <label style={{ marginBottom: '8px' }}>Documents Verified Checklist</label>
                <div className="checkbox-group">
                  {['Registration Certificate (RC)', 'Insurance Policy Copy', 'RTO Form 29 & 30 Signed', 'NOC Certificate (if out of state)', 'Service History Logs', 'Owner ID Proof Checked'].map(doc => (
                    <label key={doc} className="checkbox-label">
                      <input type="checkbox" checked={inspectForm.docsVerified.includes(doc)} onChange={() => toggleCheckbox('docsVerified', doc)} />
                      {doc}
                    </label>
                  ))}
                </div>
              </div>

              <div className="wa-form-group">
                <label style={{ marginBottom: '6px' }}>Upload Inspection Documents &amp; Certificates</label>
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
              <div className="wa-form-grid">
                <div className="wa-form-group">
                  <label>Overall Vehicle Condition Rating</label>
                  <select value={inspectForm.overallCondition} onChange={e => setInspectForm({ ...inspectForm, overallCondition: e.target.value })}>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>

                <div className="wa-form-group">
                  <label>Estimated Market Value (INR)</label>
                  <input type="text" placeholder="E.g. 45,00,000" value={inspectForm.estimatedValue} onChange={e => setInspectForm({ ...inspectForm, estimatedValue: e.target.value })} />
                </div>

                <div className="wa-form-group">
                  <label>Recommended Action</label>
                  <select value={inspectForm.recommendedAction} onChange={e => setInspectForm({ ...inspectForm, recommendedAction: e.target.value })}>
                    <option value="Approve">Approve / Buy Car</option>
                    <option value="Hold">Hold / Re-evaluate</option>
                    <option value="Reject">Reject Deal</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="wa-modal-footer inspection-modal-footer">
          <div style={{ display: 'flex', gap: '8px' }}>
            {wizardStep > 1 && (
              <button className="wa-btn cancel" onClick={() => setWizardStep(wizardStep - 1)}>
                Back
              </button>
            )}
            <button className="wa-btn cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
          {wizardStep < 5 ? (
            <button className="wa-btn send" style={{ background: '#E10613' }} onClick={() => setWizardStep(wizardStep + 1)}>
              Next Step
            </button>
          ) : (
            <button className="wa-btn send" style={{ background: '#22c55e' }} onClick={submitInspection} disabled={submitting}>
              {submitting ? 'Saving...' : 'Submit Inspection Report'}
            </button>
          )}
        </div>
      </motion.div>

      <style jsx>{`
        .wa-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 1rem;
        }
        .inspection-modal-container {
          max-width: 850px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          background-color: #ffffff;
          color: #000000;
          border: 1.5px solid rgba(0, 0, 0, 0.12);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0,0,0,0.2);
        }
        .inspection-modal-header {
          padding: 1.25rem 1.75rem;
          background: #ffffff;
          border-bottom: 1.5px solid rgba(0, 0, 0, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .wa-close-btn {
          background: 0;
          border: 0;
          color: #555;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .inspection-modal-progress {
          background: #f8f9fa;
          padding: 0.75rem 1.75rem;
          display: flex;
          gap: 1.5rem;
          overflow-x: auto;
          border-bottom: 1.5px solid rgba(0,0,0,0.08);
        }
        .inspection-modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 1.75rem;
          background-color: #ffffff;
        }
        .wa-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.25rem;
        }
        .wa-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .wa-form-group label {
          color: #333;
          font-weight: 700;
          font-size: 0.8125rem;
        }
        .wa-form-group input, .wa-form-group select, .wa-form-group textarea {
          background: #ffffff;
          border: 1.5px solid rgba(0,0,0,0.15);
          color: #000000;
          padding: 0.75rem;
          border-radius: 10px;
          font-size: 0.875rem;
          font-family: inherit;
          outline: none;
        }
        .wa-form-group input:focus, .wa-form-group select:focus, .wa-form-group textarea:focus {
          border-color: #E10613;
        }
        .checkbox-group {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 8px;
          background: #f9f9f9;
          border: 1.5px solid rgba(0,0,0,0.08);
          padding: 12px;
          border-radius: 10px;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #333;
          cursor: pointer;
        }
        .mock-upload-btn {
          border: 1.5px dashed rgba(0,0,0,0.15);
          background: #f9f9f9;
          border-radius: 10px;
          font-size: 0.875rem;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s;
          height: 45px;
        }
        .mock-upload-btn:hover {
          border-color: #E10613;
          background: #fff;
        }
        .custom-role-select-trigger {
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
        }
        .custom-role-dropdown-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000000;
        }
        .custom-role-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          background: #ffffff;
          border: 1.5px solid rgba(0,0,0,0.15);
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000001;
        }
        .custom-role-option {
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: #333;
          cursor: pointer;
          transition: background 0.15s;
        }
        .custom-role-option:hover {
          background: #f8f9fa;
          color: #000;
        }
        .custom-role-option.selected {
          background: rgba(225, 6, 19, 0.05);
          color: #E10613;
          font-weight: 700;
        }
        .inspection-modal-footer {
          display: flex;
          justify-content: space-between;
          padding: 1.25rem 1.75rem;
          background: #f8f9fa;
          border-top: 1.5px solid rgba(0, 0, 0, 0.08);
        }
        .wa-btn {
          padding: 0.625rem 1.25rem;
          border-radius: 9px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        .wa-btn.cancel {
          background: transparent;
          color: #555;
          border: 1.5px solid rgba(0,0,0,0.1);
        }
        .wa-btn.cancel:hover {
          background: #fff;
          color: #000;
        }
        .wa-btn.send {
          color: #fff;
        }
      `}</style>
    </div>
  );
}
