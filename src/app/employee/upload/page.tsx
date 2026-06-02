'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useEmpContext } from '../layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image, Check, AlertCircle, Loader2 } from 'lucide-react';

const BRANDS = ['Mercedes-Benz','BMW','Audi','Jaguar','Land Rover','Volvo','Lexus','Porsche','Toyota','Honda','Hyundai','Kia','Tata','Mahindra','Maruti Suzuki','Volkswagen','Skoda','MG','Other'];
const FUEL_TYPES = ['Petrol','Diesel','Electric','Hybrid','Petrol Mild-Hybrid','CNG','LPG'];
const TRANSMISSIONS = ['Automatic','Manual','CVT','DCT','AMT'];
const BODY_TYPES = ['SUV','Sedan','Hatchback','Coupe','Convertible','MPV','Pickup'];
const OWNERSHIPS = ['1st Owner','2nd Owner','3rd Owner','4th Owner+','Unregistered'];

const brandOptions = [
  { value: '', label: 'Select Brand' },
  ...BRANDS.map(b => ({ value: b, label: b }))
];
const bodyTypeOptions = BODY_TYPES.map(b => ({ value: b, label: b }));
const fuelTypeOptions = FUEL_TYPES.map(f => ({ value: f, label: f }));
const transmissionOptions = TRANSMISSIONS.map(t => ({ value: t, label: t }));
const ownershipOptions = OWNERSHIPS.map(o => ({ value: o, label: o }));

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

function CustomSelect({ options, value, onChange, placeholder }: CustomSelectProps) {
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
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1.1rem',
          border: isOpen ? '1.5px solid #E10613' : '1.5px solid var(--db-bd)',
          borderRadius: '12px',
          background: 'var(--db-sf2)',
          fontSize: '0.9rem',
          color: 'var(--db-tx)',
          cursor: 'pointer',
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
          stroke="var(--db-tx3)"
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
        {isOpen && (
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
              background: 'var(--db-sf)',
              border: '1.5px solid var(--db-bd)',
              borderRadius: '12px',
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
                    padding: '0.75rem 1rem',
                    border: 'none',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(225,6,19,0.08)' : 'transparent',
                    color: isSelected ? '#E10613' : 'var(--db-tx)',
                    fontSize: '0.875rem',
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
                      e.currentTarget.style.background = 'var(--db-sf2)';
                      e.currentTarget.style.color = '#E10613';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--db-tx)';
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

export default function UploadCarPage() {
  const { employee } = useEmpContext();
  const [form, setForm] = useState({
    brand: '', model: '', variant: '', year: new Date().getFullYear(), fuel_type: 'Petrol',
    transmission: 'Automatic', km_driven: 0, ownership: '1st Owner', price: 0, original_price: 0,
    description: '', features: '', insurance_validity: '', registration_number: '',
    location: '', body_type: 'SUV', color: '', interior_color: '', engine: '', horsepower: 0,
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState('');
  const [gallery, setGallery] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  const handleThumbChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setThumbnail(file); setThumbPreview(URL.createObjectURL(file)); }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setGallery(prev => [...prev, ...files]);
    setGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeGalleryImage = (idx: number) => {
    setGallery(prev => prev.filter((_, i) => i !== idx));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    setGallery(prev => [...prev, ...files]);
    setGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const uploadFile = async (file: File, path: string) => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const fullPath = `${path}/${fileName}`;
    const { error } = await supabase.storage.from('car-images').upload(fullPath, file);
    if (error) throw error;
    const { data } = supabase.storage.from('car-images').getPublicUrl(fullPath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    if (!form.brand || !form.model || !form.price) { showToast('Please fill required fields', 'error'); return; }

    setUploading(true);
    setProgress(0);

    try {
      let thumbnailUrl = '';
      const totalFiles = (thumbnail ? 1 : 0) + gallery.length;
      let uploaded = 0;

      // Upload thumbnail
      if (thumbnail) {
        thumbnailUrl = await uploadFile(thumbnail, 'thumbnails');
        uploaded++;
        setProgress(Math.round((uploaded / (totalFiles + 1)) * 100));
      }

      // Insert car
      const { data: car, error: carError } = await supabase.from('cars').insert({
        employee_id: employee.id,
        brand: form.brand, model: form.model, variant: form.variant, year: form.year,
        fuel_type: form.fuel_type, transmission: form.transmission, km_driven: form.km_driven,
        ownership: form.ownership, price: form.price, original_price: form.original_price || null,
        description: form.description, features: form.features.split(',').map(f => f.trim()).filter(Boolean),
        insurance_validity: form.insurance_validity || null, registration_number: form.registration_number || null,
        location: form.location || null, body_type: form.body_type, color: form.color || null,
        interior_color: form.interior_color || null, engine: form.engine || null,
        horsepower: form.horsepower || null, thumbnail: thumbnailUrl, status: 'available',
      }).select().single();

      if (carError) throw carError;
      setProgress(50);

      // Upload gallery images
      if (car && gallery.length > 0) {
        for (let i = 0; i < gallery.length; i++) {
          const url = await uploadFile(gallery[i], `gallery/${car.id}`);
          await supabase.from('car_images').insert({ car_id: car.id, image_url: url, display_order: i });
          uploaded++;
          setProgress(50 + Math.round((uploaded / totalFiles) * 50));
        }
      }

      // Log activity
      await supabase.from('activity_logs').insert({
        employee_id: employee.id, action: 'upload',
        details: `Uploaded ${form.brand} ${form.model} with ${gallery.length} images`,
      });

      setProgress(100);
      showToast(`${form.brand} ${form.model} uploaded successfully!`);

      // Reset form
      setForm({ brand: '', model: '', variant: '', year: new Date().getFullYear(), fuel_type: 'Petrol', transmission: 'Automatic', km_driven: 0, ownership: '1st Owner', price: 0, original_price: 0, description: '', features: '', insurance_validity: '', registration_number: '', location: '', body_type: 'SUV', color: '', interior_color: '', engine: '', horsepower: 0 });
      setThumbnail(null); setThumbPreview(''); setGallery([]); setGalleryPreviews([]);
    } catch (err) {
      console.error(err);
      showToast('Failed to upload. Please try again.', 'error');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const setField = (key: string, value: string | number) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="db-page">
      <div className="db-page-header"><div><h1 className="db-page-title">Upload Car</h1><p className="db-page-sub">Add a new vehicle to the inventory</p></div></div>

      <form onSubmit={handleSubmit} className="upl-form">
        {/* Car Details */}
        <div className="upl-section">
          <h3 className="upl-section-title">Car Details</h3>
          <div className="upl-grid">
            <div className="emp-field"><label>Brand *</label>
              <CustomSelect
                options={brandOptions}
                value={form.brand}
                onChange={val => setField('brand', val)}
                placeholder="Select Brand"
              />
            </div>
            <div className="emp-field"><label>Model *</label><input value={form.model} onChange={e => setField('model', e.target.value)} required /></div>
            <div className="emp-field"><label>Variant</label><input value={form.variant} onChange={e => setField('variant', e.target.value)} /></div>
            <div className="emp-field"><label>Year *</label><input type="number" value={form.year} onChange={e => setField('year', +e.target.value)} min={2000} max={2030} required /></div>
            <div className="emp-field"><label>Body Type</label>
              <CustomSelect
                options={bodyTypeOptions}
                value={form.body_type}
                onChange={val => setField('body_type', val)}
                placeholder="Select Body Type"
              />
            </div>
            <div className="emp-field"><label>Fuel Type</label>
              <CustomSelect
                options={fuelTypeOptions}
                value={form.fuel_type}
                onChange={val => setField('fuel_type', val)}
                placeholder="Select Fuel Type"
              />
            </div>
            <div className="emp-field"><label>Transmission</label>
              <CustomSelect
                options={transmissionOptions}
                value={form.transmission}
                onChange={val => setField('transmission', val)}
                placeholder="Select Transmission"
              />
            </div>
            <div className="emp-field"><label>KM Driven</label><input type="number" value={form.km_driven} onChange={e => setField('km_driven', +e.target.value)} min={0} /></div>
            <div className="emp-field"><label>Ownership</label>
              <CustomSelect
                options={ownershipOptions}
                value={form.ownership}
                onChange={val => setField('ownership', val)}
                placeholder="Select Ownership"
              />
            </div>
            <div className="emp-field"><label>Price (₹) *</label><input type="number" value={form.price || ''} onChange={e => setField('price', +e.target.value)} min={0} required /></div>
            <div className="emp-field"><label>Original Price (₹)</label><input type="number" value={form.original_price || ''} onChange={e => setField('original_price', +e.target.value)} min={0} /></div>
            <div className="emp-field"><label>Color</label><input value={form.color} onChange={e => setField('color', e.target.value)} /></div>
            <div className="emp-field"><label>Interior Color</label><input value={form.interior_color} onChange={e => setField('interior_color', e.target.value)} /></div>
            <div className="emp-field"><label>Engine</label><input value={form.engine} onChange={e => setField('engine', e.target.value)} /></div>
            <div className="emp-field"><label>Horsepower</label><input type="number" value={form.horsepower || ''} onChange={e => setField('horsepower', +e.target.value)} /></div>
            <div className="emp-field"><label>Registration</label><input value={form.registration_number} onChange={e => setField('registration_number', e.target.value)} /></div>
            <div className="emp-field"><label>Insurance Validity</label><input value={form.insurance_validity} onChange={e => setField('insurance_validity', e.target.value)} /></div>
            <div className="emp-field"><label>Location</label><input value={form.location} onChange={e => setField('location', e.target.value)} /></div>
          </div>
          <div className="emp-field" style={{ marginTop: '1rem' }}><label>Features (comma separated)</label>
            <textarea value={form.features} onChange={e => setField('features', e.target.value)} rows={2} />
          </div>
          <div className="emp-field" style={{ marginTop: '1rem' }}><label>Description</label>
            <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={3} />
          </div>
        </div>

        {/* Images */}
        <div className="upl-section">
          <h3 className="upl-section-title">Images</h3>
          <div className="upl-img-row">
            <div className="upl-thumb-area">
              <label>Thumbnail Image</label>
              <div className="upl-thumb-box" onClick={() => fileRef.current?.click()}>
                {thumbPreview ? <img src={thumbPreview} alt="Thumb" /> : <><Upload size={24} /><span>Click to upload</span></>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleThumbChange} hidden />
            </div>
            <div className="upl-gallery-area">
              <label>Gallery Images</label>
              <div className="upl-dropzone" onDragOver={e => e.preventDefault()} onDrop={handleDrop} onClick={() => galleryRef.current?.click()}>
                <Image size={24} /><span>Drag & drop or click to upload</span><span className="upl-hint">Multiple images supported</span>
              </div>
              <input ref={galleryRef} type="file" accept="image/*" multiple onChange={handleGalleryChange} hidden />
              {galleryPreviews.length > 0 && (
                <div className="upl-preview-grid">
                  {galleryPreviews.map((p, i) => (
                    <div key={i} className="upl-preview-item">
                      <img src={p} alt="" /><button type="button" onClick={() => removeGalleryImage(i)}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="upl-progress"><div className="upl-progress-bar" style={{ width: `${progress}%` }} /><span>{progress}%</span></div>
        )}

        <button type="submit" className="db-btn-gold upl-submit" disabled={uploading}>
          {uploading ? <><Loader2 size={18} className="login-spinner" />Uploading...</> : 'Upload Car'}
        </button>
      </form>

      <AnimatePresence>{toast && <motion.div className={`db-toast ${toast.type}`} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}>{toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}{toast.msg}</motion.div>}</AnimatePresence>

      <style jsx global>{`
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
  box-shadow: var(--card-shadow);
}
.upl-section-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 1.5rem;
  color: #E10613; /* Use prominent brand red for section titles */
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
  color: var(--db-tx); /* Bold, dark text for maximum readability */
  letter-spacing: -0.01em;
}

/* Beautiful Input Boxes */
.upl-grid input,
.upl-grid select,
.upl-grid textarea,
.emp-field input,
.emp-field select,
.emp-field textarea {
  width: 100%;
  padding: 0.85rem 1.1rem;
  background: var(--db-sf2);
  border: 1.5px solid var(--db-bd); /* Highly visible border */
  border-radius: 12px;
  color: var(--db-tx);
  font-size: 0.9rem;
  font-family: inherit;
  outline: 0;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-sizing: border-box;
}

.upl-grid input:focus,
.upl-grid select:focus,
.upl-grid textarea:focus,
.emp-field input:focus,
.emp-field select:focus,
.emp-field textarea:focus {
  border-color: #E10613; /* Highlight active border in brand red */
  background: var(--db-sf);
  box-shadow: 0 0 0 3px rgba(225, 6, 19, 0.08);
}

.upl-img-row {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1.5rem;
}
.upl-thumb-area label,
.upl-gallery-area label {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--db-tx);
  margin-bottom: 0.5rem;
}
.upl-thumb-box {
  width: 220px;
  height: 220px;
  border: 2px dashed var(--db-bd);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--db-tx3);
  font-size: 0.8125rem;
  overflow: hidden;
  transition: all 0.2s ease;
  background: var(--db-sf2);
}
.upl-thumb-box:hover {
  border-color: #E10613;
  color: #E10613;
}
.upl-thumb-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.upl-dropzone {
  border: 2px dashed var(--db-bd);
  border-radius: 16px;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--db-tx3);
  font-size: 0.8125rem;
  transition: all 0.2s ease;
  min-height: 150px;
  background: var(--db-sf2);
}
.upl-dropzone:hover {
  border-color: #E10613;
  color: #E10613;
}
.upl-hint {
  font-size: 0.6875rem;
  opacity: 0.6;
}
.upl-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}
.upl-preview-item {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 1;
  border: 1px solid var(--db-bd);
}
.upl-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.upl-preview-item button {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.75);
  border: 0;
  color: #fff;
  padding: 5px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  transition: background 0.2s;
}
.upl-preview-item button:hover {
  background: #E10613;
}
.upl-progress {
  background: var(--db-sf2);
  border-radius: 10px;
  height: 32px;
  overflow: hidden;
  position: relative;
  border: 1px solid var(--db-bd);
}
.upl-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #e10613, #c70511);
  border-radius: 10px;
  transition: width 0.3s;
}
.upl-progress span {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--db-tx);
}

/* Red Upload Submit Button (No Icon) */
.upl-submit {
  width: 100%;
  justify-content: center;
  padding: 1rem 2rem;
  font-size: 0.95rem;
  font-weight: 700;
  background: #E10613 !important;
  color: #ffffff !important;
  border: none !important;
  border-radius: 14px !important;
  cursor: pointer !important;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  box-shadow: 0 4px 14px rgba(225, 6, 19, 0.25) !important;
}
.upl-submit:hover:not(:disabled) {
  background: #c70511 !important;
  box-shadow: 0 6px 20px rgba(225, 6, 19, 0.35) !important;
  transform: translateY(-1px);
}
.upl-submit:active:not(:disabled) {
  transform: translateY(0);
}
.upl-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none !important;
}

@media(max-width: 992px) {
  .upl-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media(max-width: 768px) {
  .upl-img-row {
    grid-template-columns: 1fr;
  }
  .upl-thumb-box {
    width: 100%;
  }
}
@media(max-width: 576px) {
  .upl-grid {
    grid-template-columns: 1fr;
  }
}
      `}</style>
    </div>
  );
}
