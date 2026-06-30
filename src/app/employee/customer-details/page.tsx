'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useEmpContext } from '../layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, User, Phone, MessageSquare, Car, IndianRupee, 
  Calendar, Briefcase, Plus, Send, CheckCircle2, ChevronRight, AlertCircle, X
} from 'lucide-react';
import Link from 'next/link';

interface CarItem {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
}

const BRANDS = ['Mercedes-Benz','BMW','Audi','Jaguar','Land Rover','Volvo','Lexus','Porsche','Toyota','Honda','Hyundai','Kia','Tata','Mahindra','Maruti Suzuki','Volkswagen','Skoda','MG','Mini','Lamborghini','Jeep','Crysta','Tucson','Other'];
const TIMELINES = ['Within 1 week','1–2 weeks','1 month','1–3 months','3–6 months','6+ months'];

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

function CustomSelect({ options, value, onChange, placeholder, disabled = false }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || { label: placeholder, value };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', fontFamily: 'inherit' }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          border: isOpen ? '1.5px solid #E10613' : '1.5px solid var(--db-bd, rgba(0,0,0,0.15))',
          borderRadius: '10px',
          background: 'var(--db-sf2, #f5f5f5)',
          fontSize: '0.875rem',
          color: 'var(--db-tx, #000000)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          outline: 'none',
          boxShadow: isOpen ? '0 4px 15px rgba(225,6,19,0.05)' : 'none',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxSizing: 'border-box',
          textAlign: 'left'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
          {selectedOption.label}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--db-tx2, #8A8A8A)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            flexShrink: 0
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
 
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'var(--db-sf, #FFFFFF)',
              border: '1.5px solid var(--db-bd, rgba(0, 0, 0, 0.15))',
              borderRadius: '10px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
              zIndex: 100,
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '6px',
              boxSizing: 'border-box'
            }}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.625rem 0.875rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(225,6,19,0.08)' : 'transparent',
                    color: isSelected ? '#E10613' : 'var(--db-tx, #000000)',
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: isSelected ? 700 : 500,
                    outline: 'none',
                    display: 'block',
                    marginBottom: '2px',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--db-sf2, #f5f5f5)';
                      e.currentTarget.style.color = '#E10613';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--db-tx, #000000)';
                    }
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CustomerDetailsPage() {
  const { employee } = useEmpContext();
  const [cars, setCars] = useState<CarItem[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successLead, setSuccessLead] = useState<{ id: string; name: string; phone: string; whatsapp: string; car: string } | null>(null);
  
  // Form State
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    whatsapp: '',
    sameAsPhone: true,
    email: '',
    city: '',
    state: '',
    occupation: '',
    interested_car_id: '',
    interested_car_manual: '',
    preferred_brand: '',
    budget: '',
    purchase_timeline: '',
    notes: '',
  });

  const [errorMsg, setErrorMsg] = useState('');
  const supabase = createClient();

  const carOptions = [
    { value: '', label: 'Select from here...' },
    ...cars.map(c => ({
      value: c.id,
      label: `${c.brand} ${c.model} (${c.year}) — ₹${(c.price / 100000).toFixed(1)}L`
    }))
  ];

  const brandOptions = [
    { value: '', label: 'Select from here...' },
    ...BRANDS.map(b => ({ value: b, label: b }))
  ];

  const timelineOptions = [
    { value: '', label: 'Select from here...' },
    ...TIMELINES.map(t => ({ value: t, label: t }))
  ];

  useEffect(() => {
    const fetchAvailableCars = async () => {
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('id, brand, model, year, price')
          .eq('status', 'available')
          .order('brand', { ascending: true });
        
        if (error) throw error;
        setCars((data || []) as CarItem[]);
      } catch (err: any) {
        console.error('Error fetching cars:', err);
      } finally {
        setLoadingCars(false);
      }
    };

    fetchAvailableCars();
  }, []);

  // Update whatsapp if sameAsPhone is checked
  useEffect(() => {
    if (form.sameAsPhone) {
      setForm(f => ({ ...f, whatsapp: f.phone }));
    }
  }, [form.phone, form.sameAsPhone]);

  const handleCarChange = (carId: string) => {
    if (!carId) {
      setForm(f => ({ ...f, interested_car_id: '', budget: '', preferred_brand: '' }));
      return;
    }
    const selected = cars.find(c => c.id === carId);
    if (selected) {
      setForm(f => ({
        ...f,
        interested_car_id: carId,
        interested_car_manual: `${selected.brand} ${selected.model} (${selected.year})`,
        preferred_brand: selected.brand,
        budget: selected.price.toString(),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    setErrorMsg('');
    setSaving(true);

    try {
      const finalCarName = form.interested_car_id 
        ? form.interested_car_manual 
        : form.interested_car_manual;

      const payload = {
        customer_name: form.customer_name,
        phone: form.phone,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        city: form.city || null,
        state: form.state || null,
        occupation: form.occupation || null,
        source: 'walk_in', // walk-in entry default
        interested_car: finalCarName || null,
        preferred_brand: form.preferred_brand || null,
        budget: form.budget ? parseInt(form.budget) : null,
        purchase_timeline: form.purchase_timeline || null,
        lead_status: 'new',
        assigned_to: employee.id,
        created_by: employee.id,
      };

      const { data: newLead, error } = await supabase
        .from('leads')
        .insert(payload)
        .select('id, customer_name, phone, whatsapp, interested_car')
        .single();

      if (error) throw error;

      // Also create a customer note if notes are filled
      if (form.notes.trim() && newLead) {
        await supabase.from('customer_notes').insert({
          lead_id: newLead.id,
          employee_id: employee.id,
          note: form.notes.trim(),
        });
      }

      // Log activity
      await supabase.from('crm_activity_logs').insert({
        lead_id: newLead.id,
        employee_id: employee.id,
        action: 'lead_created',
        details: `Walk-in customer details submitted by ${employee.name} for ${finalCarName || 'General inquiry'}.`,
      });

      setSuccessLead({
        id: newLead.id,
        name: newLead.customer_name,
        phone: newLead.phone,
        whatsapp: newLead.whatsapp || newLead.phone,
        car: newLead.interested_car || 'our inventory',
      });

      // Reset Form
      setForm({
        customer_name: '',
        phone: '',
        whatsapp: '',
        sameAsPhone: true,
        email: '',
        city: '',
        state: '',
        occupation: '',
        interested_car_id: '',
        interested_car_manual: '',
        preferred_brand: '',
        budget: '',
        purchase_timeline: '',
        notes: '',
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getWhatsAppLink = (name: string, phone: string, car: string) => {
    const formattedPhone = phone.replace(/\D/g, '');
    const cleanPhone = formattedPhone.startsWith('91') || formattedPhone.length > 10 
      ? formattedPhone 
      : `91${formattedPhone}`; // Default to India code if 10 digits
      
    const message = `Hello ${name},\n\nThank you for visiting Auto Bourn. We have registered your interest in the *${car}*. Our luxury consultant will assist you shortly with the test drive and booking details.\n\nBest Regards,\n*Auto Bourn Team*`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="cust-container">
      <div className="db-page-header">
        <div className="db-page-title-container">
          <h1 className="db-page-title">Customer Details</h1>
          <p className="db-page-sub">Add walk-in lead details directly into the CRM database</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!successLead ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            {errorMsg && (
              <div className="error-banner" style={{ marginBottom: '1.5rem' }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="upl-form">
              {/* Contact Details */}
              <div className="upl-section">
                <h3 className="upl-section-title">1. Contact Details</h3>
                <div className="upl-grid">
                  <div className="emp-field">
                    <label>Full Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={form.customer_name}
                      onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                    />
                  </div>

                  <div className="emp-field">
                    <label>Phone Number *</label>
                    <input 
                      type="tel" 
                      required 
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    />
                  </div>

                  <div className="emp-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>WhatsApp Number</label>
                      <label className="toggle-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                        <input 
                          type="checkbox" 
                          checked={form.sameAsPhone}
                          onChange={e => setForm(f => ({ ...f, sameAsPhone: e.target.checked }))}
                          style={{ width: 'auto', margin: 0 }}
                        /> Same as Phone
                      </label>
                    </div>
                    <input 
                      type="tel" 
                      disabled={form.sameAsPhone}
                      value={form.sameAsPhone ? form.phone : form.whatsapp}
                      onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                    />
                  </div>

                  <div className="emp-field">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>

                  <div className="emp-field">
                    <label>City</label>
                    <input 
                      type="text" 
                      value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    />
                  </div>

                  <div className="emp-field">
                    <label>State</label>
                    <input 
                      type="text" 
                      value={form.state}
                      onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    />
                  </div>

                  <div className="emp-field">
                    <label>Customer Occupation</label>
                    <input 
                      type="text" 
                      value={form.occupation}
                      onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Car Interests & Preference */}
              <div className="upl-section">
                <h3 className="upl-section-title">2. Car Interests & Preference</h3>
                <div className="upl-grid">
                  <div className="emp-field">
                    <label>Interested Car (From Inventory)</label>
                    <CustomSelect
                      options={carOptions}
                      value={form.interested_car_id}
                      onChange={handleCarChange}
                      placeholder="Select from here..."
                      disabled={loadingCars}
                    />
                  </div>

                  <div className="emp-field">
                    <label>Or Type Car Name Manually</label>
                    <input 
                      type="text" 
                      value={form.interested_car_manual}
                      onChange={e => setForm(f => ({ ...f, interested_car_manual: e.target.value, interested_car_id: '' }))}
                    />
                  </div>

                  <div className="emp-field">
                    <label>Preferred Brand</label>
                    <CustomSelect
                      options={brandOptions}
                      value={form.preferred_brand}
                      onChange={val => setForm(f => ({ ...f, preferred_brand: val }))}
                      placeholder="Select from here..."
                    />
                  </div>

                  <div className="emp-field">
                    <label>Rupees</label>
                    <input 
                      type="number" 
                      value={form.budget}
                      onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                    />
                  </div>

                  <div className="emp-field">
                    <label>Purchase Timeline</label>
                    <CustomSelect
                      options={timelineOptions}
                      value={form.purchase_timeline}
                      onChange={val => setForm(f => ({ ...f, purchase_timeline: val }))}
                      placeholder="Select from here..."
                    />
                  </div>
                </div>
              </div>

              {/* Requirements & Notes */}
              <div className="upl-section">
                <h3 className="upl-section-title">3. Requirements & Notes</h3>
                <div className="emp-field">
                  <label>Requirements & Notes</label>
                  <textarea 
                    rows={3} 
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="upl-submit"
                disabled={saving}
              >
                {saving ? 'Creating Lead...' : 'Submit & Save Lead'}
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="success-card"
          >
            <div className="success-icon-wrap">
              <CheckCircle2 size={48} className="icon-gold" />
            </div>
            <h2>Lead Created Successfully!</h2>
            <p className="success-lead-name">{successLead.name}</p>
            <p className="success-desc">
              Customer has been registered in the CRM system. The lead is assigned to you and is now visible in both your employee console and the admin dashboard.
            </p>

            <div className="action-buttons-wrap">
              <a 
                href={getWhatsAppLink(successLead.name, successLead.whatsapp, successLead.car)}
                target="_blank" 
                rel="noopener noreferrer"
                className="wa-send-btn"
              >
                <Send size={15} />
                Send Welcome WhatsApp Message
              </a>

              <div className="alt-actions">
                <button 
                  onClick={() => setSuccessLead(null)} 
                  className="reset-form-btn"
                >
                  Create Another Lead
                </button>
                <Link href="/employee/crm" className="crm-nav-link">
                  Go to CRM Console <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .cust-container {
          max-width: 900px;
          margin: 0 auto;
        }
        .upl-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .upl-section {
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 16px;
          padding: 1.75rem;
          box-shadow: 0 4px 30px rgba(0,0,0,0.03);
        }
        .upl-section-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0 0 1.5rem;
          color: #E10613;
          letter-spacing: -0.01em;
        }
        .upl-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        .emp-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .emp-field label {
          display: block;
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--db-tx);
          letter-spacing: -0.01em;
        }
        .upl-grid input,
        .emp-field input,
        .emp-field textarea {
          width: 100%;
          padding: 0.85rem 1.1rem;
          background: var(--db-sf2);
          border: 1.5px solid var(--db-bd);
          border-radius: 12px;
          color: var(--db-tx);
          font-size: 0.9rem;
          font-family: inherit;
          outline: 0;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
        }
        .upl-grid input:focus,
        .emp-field input:focus,
        .emp-field textarea:focus {
          border-color: #E10613;
          background: var(--db-sf);
          box-shadow: 0 0 0 3px rgba(225, 6, 19, 0.08);
        }
        .upl-grid input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .upl-submit {
          width: 100%;
          padding: 0.95rem;
          margin-top: 1rem;
          background: #E10613;
          color: #fff;
          border: 0;
          border-radius: 14px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .upl-submit:hover:not(:disabled) {
          background: #c70511;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(225, 6, 19, 0.25);
        }
        .upl-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(225,6,19,0.08);
          border: 1px solid rgba(225,6,19,0.2);
          color: #ff6b6b;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.8125rem;
        }
 
        /* Success State */
        .success-card {
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 16px;
          padding: 2.5rem 2rem;
          text-align: center;
          box-shadow: 0 4px 30px rgba(0,0,0,0.03);
          max-width: 600px;
          margin: 0 auto;
        }
        .success-icon-wrap {
          margin-bottom: 1.25rem;
          display: flex;
          justify-content: center;
        }
        .success-card h2 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.375rem;
          font-weight: 800;
          color: var(--db-tx);
          margin: 0 0 0.5rem;
        }
        .success-lead-name {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--db-gold, #c5a880);
          margin-bottom: 1rem;
        }
        .success-desc {
          font-size: 0.875rem;
          color: var(--db-tx2);
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        .action-buttons-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }
        .wa-send-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #25d366;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9375rem;
          font-weight: 700;
          padding: 0.875rem 2rem;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 4px 15px rgba(37,211,102,0.3);
        }
        .wa-send-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37,211,102,0.4);
        }
        .alt-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-top: 0.5rem;
        }
        .reset-form-btn {
          background: none;
          border: none;
          color: var(--db-tx);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          padding: 4px;
        }
        .reset-form-btn:hover {
          color: var(--db-gold, #c5a880);
        }
        .crm-nav-link {
          display: flex;
          align-items: center;
          gap: 2px;
          color: var(--db-gold, #c5a880);
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
        }
        .crm-nav-link:hover {
          text-decoration: underline;
        }
 
        @media (max-width: 1024px) {
          .upl-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 640px) {
          .upl-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .alt-actions {
            flex-direction: column;
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
