'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import AlertModal from '@/components/AlertModal';
import { Car, ClipboardList, Camera, User, UploadCloud, X, Check, ArrowLeft, ArrowRight } from 'lucide-react';

/* ═══════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════ */
interface FormData {
  /* Step 1 — Vehicle Details */
  brand: string;
  model: string;
  year: string;
  variant: string;
  fuelType: string;
  transmission: string;
  /* Step 2 — Vehicle Condition */
  mileage: string;
  ownership: string;
  registrationState: string;
  color: string;
  expectedPrice: string;
  additionalDetails: string;
  /* Step 3 — Photos (handled separately) */
  /* Step 4 — Contact */
  fullName: string;
  phone: string;
  email: string;
  city: string;
  preferredContact: string;
}

interface PhotoFile {
  file: File;
  preview: string;
  id: string;
}

/* ═══════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════ */
const STEPS = [
  { number: 1, title: 'Vehicle Details', description: 'Tell us about your car' },
  { number: 2, title: 'Vehicle Condition', description: 'Condition & pricing details' },
  { number: 3, title: 'Upload Photos', description: 'Show us your vehicle' },
  { number: 4, title: 'Contact Info', description: 'How can we reach you?' },
];

const BRANDS = ['Mercedes-Benz', 'BMW', 'Audi', 'Jaguar', 'Land Rover', 'Volvo', 'Porsche', 'Lexus', 'Other'];
const YEARS = Array.from({ length: 12 }, (_, i) => String(2026 - i));
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid'];
const TRANSMISSIONS = ['Automatic', 'Manual'];
const OWNERSHIPS = ['1st Owner', '2nd Owner', '3rd Owner', '4th+ Owner'];
const CONTACT_METHODS = ['Phone', 'Email', 'WhatsApp'];
const MAX_PHOTOS = 10;

const INITIAL_FORM: FormData = {
  brand: '', model: '', year: '', variant: '', fuelType: '', transmission: '',
  mileage: '', ownership: '', registrationState: '', color: '', expectedPrice: '', additionalDetails: '',
  fullName: '', phone: '', email: '', city: '', preferredContact: '',
};

/* ═══════════════════════════════════════════════
   Shared Styles
   ═══════════════════════════════════════════════ */
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.875rem 1rem',
  border: '1px solid #ECECEC',
  borderRadius: '10px',
  background: '#FAFAFA',
  fontSize: '0.9375rem',
  color: '#2A2A2A',
  fontFamily: 'var(--font-secondary)',
  outline: 'none',
  transition: 'border-color 0.3s, box-shadow 0.3s',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#8A8A8A',
  display: 'block',
  marginBottom: '0.5rem',
};

const fieldWrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

/* ═══════════════════════════════════════════════
   Inline SVG Icons
   ═══════════════════════════════════════════════ */
function CarIcon() {
  return <Car size={22} color="#E10613" />;
}

function ClipboardIcon() {
  return <ClipboardList size={22} color="#E10613" />;
}

function CameraIcon() {
  return <Camera size={22} color="#E10613" />;
}

function UserIcon() {
  return <User size={22} color="#E10613" />;
}

function UploadCloudIcon() {
  return <UploadCloud size={48} color="#B0B0B0" strokeWidth={1.4} />;
}

function CloseIcon() {
  return <X size={14} strokeWidth={2.5} />;
}

function CheckIcon() {
  return <Check size={16} color="#fff" strokeWidth={3} />;
}

function ArrowLeftIcon() {
  return <ArrowLeft size={16} strokeWidth={2} />;
}

function ArrowRightIcon() {
  return <ArrowRight size={16} strokeWidth={2} />;
}

const stepIcons = [<CarIcon key="car" />, <ClipboardIcon key="clip" />, <CameraIcon key="cam" />, <UserIcon key="user" />];

/* ═══════════════════════════════════════════════
   Framer Motion Variants
   ═══════════════════════════════════════════════ */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

/* ═══════════════════════════════════════════════
   Component: Progress Bar
   ═══════════════════════════════════════════════ */
function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'clamp(2rem, 4vw, 3rem)', gap: 0 }} className="sell-progress">
      {STEPS.map((step, i) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;
        return (
          <div key={step.number} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Circle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <motion.div
                animate={{
                  background: isCompleted ? '#E10613' : isActive ? '#E10613' : '#ECECEC',
                  scale: isActive ? 1.1 : 1,
                  boxShadow: isActive ? '0 0 0 6px rgba(225, 6, 19, 0.12)' : '0 0 0 0px rgba(225, 6, 19, 0)',
                }}
                transition={{ duration: 0.35 }}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-primary)', fontWeight: 700,
                  fontSize: '0.875rem',
                  color: isCompleted || isActive ? '#FFFFFF' : '#8A8A8A',
                  cursor: 'default',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {isCompleted ? <CheckIcon /> : step.number}
              </motion.div>
              {/* Label below circle */}
              <p className="sell-progress-label" style={{
                fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.08em', marginTop: '0.5rem',
                color: isActive ? '#E10613' : isCompleted ? '#2A2A2A' : '#B0B0B0',
                whiteSpace: 'nowrap', transition: 'color 0.3s',
              }}>
                {step.title}
              </p>
            </div>
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div style={{
                width: 'clamp(30px, 8vw, 80px)', height: 2,
                background: currentStep > step.number ? '#E10613' : '#ECECEC',
                transition: 'background 0.4s',
                marginBottom: '1.5rem',
                marginLeft: 4, marginRight: 4,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Component: Select Field
   ═══════════════════════════════════════════════ */
function SelectField({ label, value, onChange, options, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder: string; required?: boolean;
}) {
  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>{label}{required && ' *'}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Component: Text / Number / Tel / Email Field
   ═══════════════════════════════════════════════ */
function InputField({ label, value, onChange, type = 'text', placeholder, required, rows }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder: string; required?: boolean; rows?: number;
}) {
  if (rows) {
    return (
      <div style={fieldWrap}>
        <label style={labelStyle}>{label}{required && ' *'}</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>
    );
  }
  return (
    <div style={fieldWrap}>
      <label style={labelStyle}>{label}{required && ' *'}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════ */
export default function SellPage() {
  const supabase = createClient();
  const [submitting, setSubmitting] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
    onClose?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info', onClose?: () => void) => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
      onClose,
    });
  };
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailDetails, setEmailDetails] = useState({ subject: '', body: '' });

  const copyToClipboard = () => {
    navigator.clipboard.writeText('hello@autobourncars.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Form helpers ── */
  const updateField = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors([]);
  }, []);

  /* ── Photo helpers ── */
  const addPhotos = useCallback((files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_PHOTOS - photos.length;
    const newFiles = Array.from(files).slice(0, remaining);
    newFiles.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((prev) => {
          if (prev.length >= MAX_PHOTOS) return prev;
          return [...prev, { file, preview: reader.result as string, id: `${Date.now()}-${Math.random()}` }];
        });
      };
      reader.readAsDataURL(file);
    });
  }, [photos.length]);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  /* ── Drag events ── */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addPhotos(e.dataTransfer.files);
  }, [addPhotos]);

  /* ── Validation ── */
  const validate = (): boolean => {
    const errs: string[] = [];
    if (currentStep === 1) {
      if (!form.brand) errs.push('Brand is required');
      if (!form.model.trim()) errs.push('Model is required');
      if (!form.year) errs.push('Year is required');
      if (!form.fuelType) errs.push('Fuel Type is required');
      if (!form.transmission) errs.push('Transmission is required');
    } else if (currentStep === 2) {
      if (!form.mileage.trim()) errs.push('Mileage is required');
      if (!form.ownership) errs.push('Ownership is required');
    } else if (currentStep === 4) {
      if (!form.fullName.trim()) errs.push('Full Name is required');
      if (!form.phone.trim()) errs.push('Phone is required');
      if (!form.email.trim()) errs.push('Email is required');
      if (!form.city.trim()) errs.push('City is required');
      if (!form.preferredContact) errs.push('Preferred Contact Method is required');
    }
    setErrors(errs);
    return errs.length === 0;
  };

  /* ── Navigation ── */
  const goNext = () => {
    if (!validate()) return;
    if (currentStep < 4) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
      setErrors([]);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const notes = `Vehicle Details:
Variant: ${form.variant || 'N/A'}
Fuel Type: ${form.fuelType}
Transmission: ${form.transmission}
Mileage: ${form.mileage} km
Ownership: ${form.ownership}
Registration State: ${form.registrationState || 'N/A'}
Color: ${form.color || 'N/A'}
Additional Details: ${form.additionalDetails || 'None'}`;

      const cleanPriceStr = form.expectedPrice.replace(/[^0-9]/g, '');
      const expectedPriceVal = cleanPriceStr ? parseInt(cleanPriceStr) : null;

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.fullName,
          phone: form.phone,
          whatsapp: form.phone || null,
          email: form.email,
          city: form.city,
          state: form.registrationState || null,
          source: 'website',
          interested_car: `${form.brand} ${form.model} (${form.year})`,
          preferred_brand: form.brand,
          budget: expectedPriceVal,
          lead_status: 'new',
          notes: notes,
        }),
      });

      const resData = await response.json();

      if (!response.ok || resData.error) {
        console.error('Error inserting lead to Supabase:', resData.error);
        showAlert('Submission Error', 'There was an issue submitting your details: ' + (resData.error || 'Server error'), 'error');
      } else {
        const emailSubject = `Sell My Car Inquiry - ${form.brand} ${form.model}`;
        const emailBody = `Hi Auto Bourn, I want to sell my car:
Brand: ${form.brand}
Model: ${form.model}
Year: ${form.year}
Variant: ${form.variant || 'N/A'}
Fuel Type: ${form.fuelType}
Transmission: ${form.transmission}
Mileage: ${form.mileage} km
Ownership: ${form.ownership}
Registration: ${form.registrationState || 'N/A'}
Color: ${form.color || 'N/A'}
Expected Price: ${expectedPriceVal ? '₹' + expectedPriceVal.toLocaleString('en-IN') : 'N/A'}
${form.additionalDetails ? `Additional Notes: ${form.additionalDetails}` : ''}

Contact Details:
Name: ${form.fullName}
Phone: ${form.phone}
Email: ${form.email}
City: ${form.city}
Preferred Contact: ${form.preferredContact}`;

        if (form.preferredContact === 'Email') {
          setEmailDetails({
            subject: emailSubject,
            body: emailBody
          });
          setEmailModalOpen(true);
          setForm(INITIAL_FORM);
          setCurrentStep(1);
        } else if (form.preferredContact === 'Phone') {
          showAlert(
            'Submission Successful',
            `Your vehicle listing has been submitted successfully to our CRM. Since you selected Phone, you will now be redirected to call our team at +91 91767 77222.`,
            'success',
            () => {
              window.location.href = 'tel:+919176777222';
              setForm(INITIAL_FORM);
              setCurrentStep(1);
            }
          );
        } else {
          // Default to WhatsApp
          const waText = `Hi Auto Bourn, I want to sell my car:
*Brand:* ${form.brand}
*Model:* ${form.model}
*Year:* ${form.year}
*Variant:* ${form.variant || 'N/A'}
*Fuel Type:* ${form.fuelType}
*Transmission:* ${form.transmission}
*Mileage:* ${form.mileage} km
*Ownership:* ${form.ownership}
*Registration:* ${form.registrationState || 'N/A'}
*Color:* ${form.color || 'N/A'}
*Expected Price:* ${expectedPriceVal ? '₹' + expectedPriceVal.toLocaleString('en-IN') : 'N/A'}
${form.additionalDetails ? `*Additional Notes:* ${form.additionalDetails}` : ''}

*Contact Details:*
*Name:* ${form.fullName}
*Phone:* ${form.phone}
*Email:* ${form.email}
*City:* ${form.city}
*Preferred Contact:* ${form.preferredContact}`;

          const waUrl = `https://wa.me/919176777222?text=${encodeURIComponent(waText)}`;
          showAlert(
            'Redirecting to WhatsApp',
            'Your vehicle listing has been submitted successfully to our CRM. You will now be redirected to WhatsApp to complete your submission.',
            'success',
            () => {
              window.location.href = waUrl;
              setForm(INITIAL_FORM);
              setCurrentStep(1);
            }
          );
        }
      }
    } catch (err: any) {
      console.error('Unexpected error submitting lead:', err);
      showAlert('Unexpected Error', 'An unexpected error occurred: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ═══ Step Content Renderers ═══ */
  const renderStep1 = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="sell-form">
      <SelectField label="Brand" value={form.brand} onChange={(v) => updateField('brand', v)} options={BRANDS} placeholder="Select Brand" required />
      <InputField label="Model" value={form.model} onChange={(v) => updateField('model', v)} placeholder="e.g., GLE 300d" required />
      <SelectField label="Year" value={form.year} onChange={(v) => updateField('year', v)} options={YEARS} placeholder="Select Year" required />
      <InputField label="Variant" value={form.variant} onChange={(v) => updateField('variant', v)} placeholder="e.g., AMG Line" />
      <SelectField label="Fuel Type" value={form.fuelType} onChange={(v) => updateField('fuelType', v)} options={FUEL_TYPES} placeholder="Select Fuel Type" required />
      <SelectField label="Transmission" value={form.transmission} onChange={(v) => updateField('transmission', v)} options={TRANSMISSIONS} placeholder="Select Transmission" required />
    </div>
  );

  const renderStep2 = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="sell-form">
      <InputField label="Mileage (km)" value={form.mileage} onChange={(v) => updateField('mileage', v)} type="number" placeholder="e.g., 25000" required />
      <SelectField label="Ownership" value={form.ownership} onChange={(v) => updateField('ownership', v)} options={OWNERSHIPS} placeholder="Select Ownership" required />
      <InputField label="Registration State" value={form.registrationState} onChange={(v) => updateField('registrationState', v)} placeholder="e.g., Maharashtra" />
      <InputField label="Color" value={form.color} onChange={(v) => updateField('color', v)} placeholder="e.g., Obsidian Black" />
      <InputField label="Expected Price (₹)" value={form.expectedPrice} onChange={(v) => updateField('expectedPrice', v)} type="number" placeholder="e.g., 4500000" />
      <div /> {/* spacer for grid alignment */}
      <div style={{ gridColumn: '1 / -1' }}>
        <InputField label="Additional Details" value={form.additionalDetails} onChange={(v) => updateField('additionalDetails', v)} placeholder="Service history, modifications, condition notes..." rows={3} />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? '#E10613' : '#DADADA'}`,
          borderRadius: 16,
          padding: 'clamp(2rem, 4vw, 3rem)',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s',
          background: isDragging ? 'rgba(225, 6, 19, 0.03)' : '#FAFAFA',
          position: 'relative',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => addPhotos(e.target.files)}
          style={{ display: 'none' }}
        />
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <UploadCloudIcon />
        </div>
        <p style={{ fontFamily: 'var(--font-primary)', fontSize: '1rem', fontWeight: 600, color: '#2A2A2A', marginBottom: '0.375rem' }}>
          Drag & drop your photos here
        </p>
        <p style={{ fontSize: '0.8125rem', color: '#8A8A8A' }}>
          or click to browse — up to {MAX_PHOTOS} images
        </p>
        <p style={{ fontSize: '0.75rem', color: '#B0B0B0', marginTop: '0.5rem' }}>
          {photos.length} / {MAX_PHOTOS} uploaded
        </p>
      </div>

      {/* Previews */}
      {photos.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '0.75rem', marginTop: '1.5rem',
        }}>
          {photos.map((photo) => (
            <div key={photo.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', border: '1px solid #ECECEC' }}>
              <img src={photo.preview} alt="Vehicle" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#fff', padding: 0,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#E10613')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
              >
                <CloseIcon />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }} className="sell-form">
      <div style={{ gridColumn: '1 / -1' }}>
        <InputField label="Full Name" value={form.fullName} onChange={(v) => updateField('fullName', v)} placeholder="Your full name" required />
      </div>
      <InputField label="Phone" value={form.phone} onChange={(v) => updateField('phone', v)} type="tel" placeholder="+91" required />
      <InputField label="Email" value={form.email} onChange={(v) => updateField('email', v)} type="email" placeholder="you@email.com" required />
      <InputField label="City" value={form.city} onChange={(v) => updateField('city', v)} placeholder="Your city" required />
      <SelectField label="Preferred Contact Method" value={form.preferredContact} onChange={(v) => updateField('preferredContact', v)} options={CONTACT_METHODS} placeholder="Select Method" required />
    </div>
  );

  const stepRenderers = [renderStep1, renderStep2, renderStep3, renderStep4];

  return (
    <>
      <section style={{ padding: 'clamp(3rem, 6vw, 5rem) 0', background: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
        {/* Background accents */}
        <div style={{ position: 'absolute', top: '-15%', right: '-8%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(225,6,19,0.03) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-8%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(245,245,245,0.8) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div className="container">
          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto clamp(2.5rem, 5vw, 3.5rem)' }}
          >
            <p className="text-overline" style={{ marginBottom: '0.75rem' }}>Sell or Trade-In</p>
            <h1 className="headline-section">Sell Your Luxury Car</h1>
            <p style={{ fontSize: '1rem', color: '#8A8A8A', marginTop: '1rem', lineHeight: 1.7 }}>
              Get the best market value for your premium vehicle. Transparent valuation, instant offer, and seamless process.
            </p>
          </motion.div>

          {/* ── Form Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            style={{
              maxWidth: 800,
              margin: '0 auto',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              borderRadius: 24,
              padding: 'clamp(1.75rem, 4vw, 3rem)',
              border: '1px solid rgba(236, 236, 236, 0.6)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {/* Progress */}
            <ProgressIndicator currentStep={currentStep} />

            {/* Step title */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                {stepIcons[currentStep - 1]}
                <h2 style={{
                  fontFamily: 'var(--font-primary)', fontSize: '1.25rem',
                  fontWeight: 700, color: '#2A2A2A',
                }}>
                  {STEPS[currentStep - 1].title}
                </h2>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#8A8A8A' }}>{STEPS[currentStep - 1].description}</p>
            </div>

            {/* Error messages */}
            <AnimatePresence>
              {errors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    background: 'rgba(225, 6, 19, 0.06)',
                    border: '1px solid rgba(225, 6, 19, 0.15)',
                    borderRadius: 10, padding: '0.875rem 1.25rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  {errors.map((err) => (
                    <p key={err} style={{ fontSize: '0.8125rem', color: '#C70511', lineHeight: 1.8 }}>
                      ◆ {err}
                    </p>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step content with animation */}
            <div style={{ minHeight: 260, position: 'relative' }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  {stepRenderers[currentStep - 1]()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #ECECEC',
            }}>
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={goPrev}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.875rem 1.75rem', borderRadius: 9999,
                    border: '1px solid #DADADA', background: '#FFFFFF',
                    fontFamily: 'var(--font-secondary)', fontSize: '0.875rem',
                    fontWeight: 500, color: '#4A4A4A', cursor: 'pointer',
                    transition: 'all 0.3s', letterSpacing: '0.03em',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#E10613';
                    e.currentTarget.style.color = '#E10613';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#DADADA';
                    e.currentTarget.style.color = '#4A4A4A';
                  }}
                >
                  <ArrowLeftIcon /> Previous
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  Next Step <ArrowRightIcon />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn btn-primary btn-lg"
                  disabled={submitting}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    boxShadow: '0 8px 30px rgba(225, 6, 19, 0.20)',
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Listing'}
                </button>
              )}
            </div>
          </motion.div>

          {/* ═══ How It Works ═══ */}
          <div style={{ maxWidth: 700, margin: 'clamp(3rem, 6vw, 5rem) auto 0', textAlign: 'center' }}>
            <p className="text-overline" style={{ marginBottom: '0.75rem' }}>Process</p>
            <h2 style={{
              fontFamily: 'var(--font-primary)', fontSize: '1.5rem',
              fontWeight: 700, color: '#2A2A2A', marginBottom: '2.5rem',
            }}>
              How It Works
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }} className="sell-how-grid">
              {[
                {
                  symbol: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E10613" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  ),
                  step: '01',
                  title: 'Submit Details',
                  desc: 'Fill in your vehicle information using the form above',
                },
                {
                  symbol: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E10613" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                    </svg>
                  ),
                  step: '02',
                  title: 'Get Valuation',
                  desc: 'Receive a competitive and transparent market valuation',
                },
                {
                  symbol: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E10613" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  ),
                  step: '03',
                  title: 'Complete Sale',
                  desc: 'Quick documentation & instant payment at your doorstep',
                },
              ].map((s, i) => (
                <motion.div
                  key={`sell-how-${s.step}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                >
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'rgba(225, 6, 19, 0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem',
                  }}>
                    {s.symbol}
                  </div>
                  <p style={{
                    fontFamily: 'var(--font-primary)', fontSize: '2rem',
                    fontWeight: 200, color: '#E10613', marginBottom: '0.5rem',
                  }}>
                    {s.step}
                  </p>
                  <h3 style={{
                    fontFamily: 'var(--font-primary)', fontSize: '1rem',
                    fontWeight: 700, color: '#2A2A2A', marginBottom: '0.25rem',
                  }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#8A8A8A', lineHeight: 1.6 }}>
                    {s.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .sell-how-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
        }
        @media (max-width: 768px) {
          .sell-form { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .sell-progress-label { font-size: 0.5rem !important; }
        }
        input:focus, select:focus, textarea:focus {
          border-color: #E10613 !important;
          box-shadow: 0 0 0 3px rgba(225, 6, 19, 0.08) !important;
        }
        select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238A8A8A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") !important; background-repeat: no-repeat !important; background-position: right 1rem center !important; padding-right: 2.5rem !important; }
      `}</style>

      <AnimatePresence>
        {emailModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '2.25rem',
                maxWidth: '440px',
                width: '100%',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)',
                border: '1px solid #EAEAEA',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setEmailModalOpen(false)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  background: '#F5F5F5',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#4A4A4A',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#EAEAEA'}
                onMouseLeave={e => e.currentTarget.style.background = '#F5F5F5'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(225, 6, 19, 0.08)',
                  color: '#E10613',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h3 style={{ fontFamily: 'var(--font-primary)', fontSize: '1.35rem', fontWeight: 700, color: '#2A2A2A', margin: '0 0 0.5rem' }}>
                  Send Listing via Email
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#8A8A8A', margin: 0, lineHeight: 1.5 }}>
                  Choose your preferred email service to send your luxury vehicle listing to <strong style={{ color: '#2A2A2A' }}>hello@autobourncars.com</strong>.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Gmail */}
                <motion.a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=hello@autobourncars.com&su=${encodeURIComponent(emailDetails.subject)}&body=${encodeURIComponent(emailDetails.body)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '0.875rem',
                    borderRadius: '12px',
                    border: '1px solid #ECECEC',
                    background: '#FFFFFF',
                    color: '#333333',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  whileHover={{ borderColor: '#2A2A2A', backgroundColor: '#F9F9F9' }}
                  onClick={() => setEmailModalOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  Open in Gmail
                </motion.a>

                {/* Outlook Web */}
                <motion.a
                  href={`https://outlook.live.com/default.aspx?rru=compose&to=hello@autobourncars.com&subject=${encodeURIComponent(emailDetails.subject)}&body=${encodeURIComponent(emailDetails.body)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '0.875rem',
                    borderRadius: '12px',
                    border: '1px solid #ECECEC',
                    background: '#FFFFFF',
                    color: '#333333',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  whileHover={{ borderColor: '#2A2A2A', backgroundColor: '#F9F9F9' }}
                  onClick={() => setEmailModalOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.24 11.51l-5.66-5.65-1.41 1.41 4.24 4.24H2v2h11.41l-4.24 4.24 1.41 1.41 5.66-5.65z M20 2H4c-1.1 0-2 .9-2 2v4h2V4h16v16H4v-4H2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                  Open in Outlook Web
                </motion.a>

                {/* Default Mail Client */}
                <motion.a
                  href={`mailto:hello@autobourncars.com?subject=${encodeURIComponent(emailDetails.subject)}&body=${encodeURIComponent(emailDetails.body)}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '0.875rem',
                    borderRadius: '12px',
                    border: '1px solid #ECECEC',
                    background: '#FFFFFF',
                    color: '#333333',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  whileHover={{ borderColor: '#2A2A2A', backgroundColor: '#F9F9F9' }}
                  onClick={() => setEmailModalOpen(false)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="2" y1="3" x2="12" y2="10" />
                    <line x1="22" y1="3" x2="12" y2="10" />
                  </svg>
                  Default Mail App
                </motion.a>

                {/* Copy to Clipboard */}
                <motion.button
                  onClick={copyToClipboard}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '0.875rem',
                    borderRadius: '12px',
                    border: '1px solid #E10613',
                    background: copied ? '#E10613' : 'transparent',
                    color: copied ? '#FFFFFF' : '#E10613',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  whileHover={copied ? undefined : { backgroundColor: 'rgba(225, 6, 19, 0.04)' }}
                >
                  {copied ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy Email Address
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        <AlertModal
          isOpen={alertConfig.isOpen}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onClose={() => {
            setAlertConfig(prev => ({ ...prev, isOpen: false }));
            if (alertConfig.onClose) alertConfig.onClose();
          }}
        />
      </AnimatePresence>
    </>
  );
}
