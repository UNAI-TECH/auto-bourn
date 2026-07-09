'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useEmpContext } from '../layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Edit, Trash2, Check, AlertCircle, X, Eye, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { formatPrice, timeAgo, getProxiedImageUrl } from '@/lib/utils';
import type { Car } from '@/types/database';
import ConfirmModal from '@/components/ConfirmModal';

const BRANDS = ['Mercedes-Benz','BMW','Audi','Jaguar','Land Rover','Volvo','Lexus','Porsche','Toyota','Honda','Hyundai','Kia','Tata','Mahindra','Maruti Suzuki','Volkswagen','Skoda','MG','Mini','Lamborghini','Jeep','Crysta','Tucson','Other'];
const FUEL_TYPES = ['Petrol','Diesel','Electric','Hybrid','Petrol Mild-Hybrid','CNG','LPG','Other'];
const TRANSMISSIONS = ['Automatic','Manual','CVT','DCT','AMT','Other'];
const BODY_TYPES = ['SUV','Sedan','Hatchback','Coupe','Convertible','MPV','Pickup','Other'];
const OWNERSHIPS = ['1st Owner','2nd Owner','3rd Owner','4th Owner+','Unregistered','Other'];
const YEARS = [...Array.from({ length: 28 }, (_, i) => String(new Date().getFullYear() + 1 - i)), 'Other'];

const brandOptions = [
  { value: '', label: 'Select Brand' },
  ...BRANDS.map(b => ({ value: b, label: b }))
];
const yearOptions = [
  { value: '', label: 'Select Year' },
  ...YEARS.map(y => ({ value: y, label: y }))
];
const bodyTypeOptions = [
  { value: '', label: 'Select Body Type' },
  ...BODY_TYPES.map(b => ({ value: b, label: b }))
];
const fuelTypeOptions = [
  { value: '', label: 'Select Fuel Type' },
  ...FUEL_TYPES.map(f => ({ value: f, label: f }))
];
const transmissionOptions = [
  { value: '', label: 'Select Transmission' },
  ...TRANSMISSIONS.map(t => ({ value: t, label: t }))
];
const ownershipOptions = [
  { value: '', label: 'Select Ownership' },
  ...OWNERSHIPS.map(o => ({ value: o, label: o }))
];

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

export default function MyCarsPage() {
  const { employee } = useEmpContext();
  const [cars, setCars] = useState<Car[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editCar, setEditCar] = useState<(Car & { features?: string | string[] }) | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  
  const [gallery, setGallery] = useState<{ id: string; image_url: string }[]>([]);
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [newThumbPreview, setNewThumbPreview] = useState('');
  const [newGallery, setNewGallery] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [updatingImages, setUpdatingImages] = useState(false);

  const [customBrand, setCustomBrand] = useState('');
  const [customYear, setCustomYear] = useState('');
  const [customBodyType, setCustomBodyType] = useState('');
  const [customFuelType, setCustomFuelType] = useState('');
  const [customTransmission, setCustomTransmission] = useState('');
  const [customOwnership, setCustomOwnership] = useState('');

  const [selectBrand, setSelectBrand] = useState('');
  const [selectYear, setSelectYear] = useState('');
  const [selectBodyType, setSelectBodyType] = useState('');
  const [selectFuelType, setSelectFuelType] = useState('');
  const [selectTransmission, setSelectTransmission] = useState('');
  const [selectOwnership, setSelectOwnership] = useState('');

  const thumbInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  const supabase = createClient();

  useEffect(() => {
    if (editCar) {
      const fetchGallery = async () => {
        const { data } = await supabase.from('car_images').select('id, image_url').eq('car_id', editCar.id).order('display_order', { ascending: true });
        setGallery(data || []);
      };
      fetchGallery();
      setNewThumbnail(null);
      setNewThumbPreview('');
      setNewGallery([]);
      setNewGalleryPreviews([]);
      setDeletedImageIds([]);

      // Brand mapping
      if (editCar.brand && !BRANDS.filter(b => b !== 'Other').includes(editCar.brand)) {
        setSelectBrand('Other');
        setCustomBrand(editCar.brand);
      } else {
        setSelectBrand(editCar.brand || '');
        setCustomBrand('');
      }

      // Year mapping
      const yearStr = String(editCar.year);
      if (editCar.year && !YEARS.filter(y => y !== 'Other').includes(yearStr)) {
        setSelectYear('Other');
        setCustomYear(yearStr);
      } else {
        setSelectYear(editCar.year ? yearStr : '');
        setCustomYear('');
      }

      // Body Type mapping
      if (editCar.body_type && !BODY_TYPES.filter(b => b !== 'Other').includes(editCar.body_type)) {
        setSelectBodyType('Other');
        setCustomBodyType(editCar.body_type);
      } else {
        setSelectBodyType(editCar.body_type || '');
        setCustomBodyType('');
      }

      // Fuel Type mapping
      if (editCar.fuel_type && !FUEL_TYPES.filter(f => f !== 'Other').includes(editCar.fuel_type)) {
        setSelectFuelType('Other');
        setCustomFuelType(editCar.fuel_type);
      } else {
        setSelectFuelType(editCar.fuel_type || '');
        setCustomFuelType('');
      }

      // Transmission mapping
      if (editCar.transmission && !TRANSMISSIONS.filter(t => t !== 'Other').includes(editCar.transmission)) {
        setSelectTransmission('Other');
        setCustomTransmission(editCar.transmission);
      } else {
        setSelectTransmission(editCar.transmission || '');
        setCustomTransmission('');
      }

      // Ownership mapping
      if (editCar.ownership && !OWNERSHIPS.filter(o => o !== 'Other').includes(editCar.ownership)) {
        setSelectOwnership('Other');
        setCustomOwnership(editCar.ownership);
      } else {
        setSelectOwnership(editCar.ownership || '');
        setCustomOwnership('');
      }
    } else {
      setGallery([]);
    }
  }, [editCar, supabase]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { if (employee) fetchCars(); }, [employee]);

  useEffect(() => {
    if (!employee) return;
    const handleFocus = () => {
      supabase
        .from('cars')
        .select('*, employee:employees!employee_id(name, employee_id)')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setCars(data);
        });
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [employee, supabase]);

  const fetchCars = async () => {
    if (!employee) return;
    const { data } = await supabase
      .from('cars')
      .select('*, employee:employees!employee_id(name, employee_id)')
      .order('created_at', { ascending: false });
    setCars(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: Record<string, unknown> = { status };
    if (status === 'sold') updates.sold_at = new Date().toISOString();
    else { updates.sold_at = null; }
    await supabase.from('cars').update(updates).eq('id', id);
    if (employee) {
      await supabase.from('activity_logs').insert({
        employee_id: employee.id, action: 'sold_status_change',
        details: `Changed car status to ${status}`,
      });
    }
    showToast(`Car marked as ${status}`);
    fetchCars();
  };

  const deleteCar = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    await supabase.from('cars').delete().eq('id', deleteTargetId);
    if (employee) {
      await supabase.from('activity_logs').insert({
        employee_id: employee.id, action: 'delete', details: 'Deleted a car listing',
      });
    }
    showToast('Car deleted');
    setDeleteTargetId(null);
    fetchCars();
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

  const saveEdit = async () => {
    if (!editCar || !employee) return;
    setUpdatingImages(true);
    try {
      let finalThumbnail = editCar.thumbnail;

      // 1. Upload new thumbnail if selected
      if (newThumbnail) {
        finalThumbnail = await uploadFile(newThumbnail, 'thumbnails');
      }

      // 2. Delete gallery images marked for deletion
      if (deletedImageIds.length > 0) {
        const { error: delError } = await supabase.from('car_images').delete().in('id', deletedImageIds);
        if (delError) throw delError;
      }

      // 3. Upload new gallery images
      if (newGallery.length > 0) {
        const currentCount = gallery.length - deletedImageIds.length;
        for (let i = 0; i < newGallery.length; i++) {
          const url = await uploadFile(newGallery[i], `gallery/${editCar.id}`);
          const { error: insError } = await supabase.from('car_images').insert({
            car_id: editCar.id,
            image_url: url,
            display_order: currentCount + i
          });
          if (insError) throw insError;
        }
      }

      const brandToSubmit = selectBrand === 'Other' ? customBrand : selectBrand;
      const yearToSubmit = selectYear === 'Other' ? customYear : selectYear;
      const bodyTypeToSubmit = selectBodyType === 'Other' ? customBodyType : selectBodyType;
      const fuelTypeToSubmit = selectFuelType === 'Other' ? customFuelType : selectFuelType;
      const transmissionToSubmit = selectTransmission === 'Other' ? customTransmission : selectTransmission;
      const ownershipToSubmit = selectOwnership === 'Other' ? customOwnership : selectOwnership;

      const parsedYear = typeof yearToSubmit === 'string' ? (parseInt(yearToSubmit) || null) : (yearToSubmit || null);

      // 4. Update the car document
      const { id, created_at, sold_at, sold_by, featured, views, employee_id, employee: _emp, car_images, ...rest } = editCar as Car & { employee?: unknown; car_images?: unknown };
      void created_at;
      void sold_at;
      void sold_by;
      void featured;
      void views;
      void employee_id;
      void _emp;
      void car_images;

      const features = typeof editCar.features === 'string' 
        ? (editCar.features as string).split(',').map(f => f.trim()).filter(Boolean) 
        : editCar.features;

      const updatedStatus = editCar.status === 'rejected' ? 'pending' : editCar.status;

      const { error: updateError } = await supabase.from('cars').update({
        ...rest,
        brand: brandToSubmit,
        year: parsedYear,
        body_type: bodyTypeToSubmit || null,
        fuel_type: fuelTypeToSubmit || null,
        transmission: transmissionToSubmit || null,
        ownership: ownershipToSubmit || null,
        features,
        thumbnail: finalThumbnail,
        status: updatedStatus,
        rejection_reason: updatedStatus === 'pending' ? null : editCar.rejection_reason
      }).eq('id', id);
      if (updateError) throw updateError;

      // 5. Notify Admin if resubmitted
      if (editCar.status === 'rejected') {
        await supabase.from('notifications').insert({
          recipient_role: 'admin',
          type: 'car_upload_request',
          title: '🚗 Car Upload Re-submitted',
          message: `Employee "${employee.name}" has re-submitted rejected car details for approval: ${brandToSubmit} ${editCar.model} (${parsedYear}).`,
          metadata: { car_id: editCar.id }
        });
      }

      // 6. Insert activity log
      await supabase.from('activity_logs').insert({
        employee_id: employee.id,
        action: 'edit',
        details: editCar.status === 'rejected'
          ? `Re-submitted ${brandToSubmit} ${editCar.model} for approval after rejection`
          : `Edited ${brandToSubmit} ${editCar.model} details and images`,
      });

      showToast(editCar.status === 'rejected' ? 'Car resubmitted for approval' : 'Car updated successfully');
      setEditCar(null);
      fetchCars();
    } catch (err) {
      console.error(err);
      showToast('Failed to update car listing', 'error');
    } finally {
      setUpdatingImages(false);
    }
  };

  const filtered = cars.filter(c => {
    const ms = `${c.brand} ${c.model}`.toLowerCase().includes(search.toLowerCase());
    const sf = statusFilter === 'all' ? true :
               statusFilter === 'my' ? c.employee_id === employee?.id :
               c.status === statusFilter;
    return ms && sf;
  });

  const setEditField = (key: string, val: string | number) => {
    if (editCar) {
      setEditCar({ ...editCar, [key]: val });
    }
  };

  return (
    <div className="db-page">
      {editCar ? (
        // INLINE EDIT FORM
        <div>
          <div className="db-page-header">
            <div className="db-page-title-container">
              <h1 className="db-page-title">Edit Car</h1>
              <p className="db-page-sub">Update vehicle details and gallery images for {editCar.brand} {editCar.model}</p>
            </div>
          </div>

          <div className="upl-form">
            {/* Car Details */}
            <div className="upl-section">
              <h3 className="upl-section-title">Car Details</h3>
              <div className="upl-grid">
                <div className="emp-field"><label>Brand *</label>
                  <CustomSelect
                    options={brandOptions}
                    value={selectBrand}
                    onChange={val => setSelectBrand(val)}
                    placeholder="Select Brand"
                  />
                  {selectBrand === 'Other' && (
                    <input
                      style={{ marginTop: '0.5rem' }}
                      placeholder="Enter custom brand"
                      value={customBrand}
                      onChange={e => setCustomBrand(e.target.value)}
                      required
                    />
                  )}
                </div>
                <div className="emp-field"><label>Model *</label><input value={editCar.model || ''} onChange={e => setEditField('model', e.target.value)} required /></div>
                <div className="emp-field"><label>Variant</label><input value={editCar.variant || ''} onChange={e => setEditField('variant', e.target.value)} /></div>
                <div className="emp-field"><label>Year *</label>
                  <CustomSelect
                    options={yearOptions}
                    value={selectYear}
                    onChange={val => setSelectYear(val)}
                    placeholder="Select Year"
                  />
                  {selectYear === 'Other' && (
                    <input
                      type="number"
                      style={{ marginTop: '0.5rem' }}
                      placeholder="Enter custom year"
                      value={customYear}
                      onChange={e => setCustomYear(e.target.value)}
                      required
                    />
                  )}
                </div>
                <div className="emp-field"><label>Body Type</label>
                  <CustomSelect
                    options={bodyTypeOptions}
                    value={selectBodyType}
                    onChange={val => setSelectBodyType(val)}
                    placeholder="Select Body Type"
                  />
                  {selectBodyType === 'Other' && (
                    <input
                      style={{ marginTop: '0.5rem' }}
                      placeholder="Enter custom body type"
                      value={customBodyType}
                      onChange={e => setCustomBodyType(e.target.value)}
                    />
                  )}
                </div>
                <div className="emp-field"><label>Fuel Type</label>
                  <CustomSelect
                    options={fuelTypeOptions}
                    value={selectFuelType}
                    onChange={val => setSelectFuelType(val)}
                    placeholder="Select Fuel Type"
                  />
                  {selectFuelType === 'Other' && (
                    <input
                      style={{ marginTop: '0.5rem' }}
                      placeholder="Enter custom fuel type"
                      value={customFuelType}
                      onChange={e => setCustomFuelType(e.target.value)}
                    />
                  )}
                </div>
                <div className="emp-field"><label>Transmission</label>
                  <CustomSelect
                    options={transmissionOptions}
                    value={selectTransmission}
                    onChange={val => setSelectTransmission(val)}
                    placeholder="Select Transmission"
                  />
                  {selectTransmission === 'Other' && (
                    <input
                      style={{ marginTop: '0.5rem' }}
                      placeholder="Enter custom transmission"
                      value={customTransmission}
                      onChange={e => setCustomTransmission(e.target.value)}
                    />
                  )}
                </div>
                <div className="emp-field"><label>KM Driven</label><input type="number" value={editCar.km_driven ?? 0} onChange={e => setEditField('km_driven', +e.target.value)} min={0} /></div>
                <div className="emp-field"><label>Ownership</label>
                  <CustomSelect
                    options={ownershipOptions}
                    value={selectOwnership}
                    onChange={val => setSelectOwnership(val)}
                    placeholder="Select Ownership"
                  />
                  {selectOwnership === 'Other' && (
                    <input
                      style={{ marginTop: '0.5rem' }}
                      placeholder="Enter custom ownership"
                      value={customOwnership}
                      onChange={e => setCustomOwnership(e.target.value)}
                    />
                  )}
                </div>
                <div className="emp-field"><label>Price (₹) *</label><input type="number" value={editCar.price ?? ''} onChange={e => setEditField('price', +e.target.value)} min={0} required /></div>
                <div className="emp-field"><label>Original Price (₹)</label><input type="number" value={editCar.original_price ?? ''} onChange={e => setEditField('original_price', +e.target.value)} min={0} /></div>
                <div className="emp-field"><label>Color</label><input value={editCar.color || ''} onChange={e => setEditField('color', e.target.value)} /></div>
                <div className="emp-field"><label>Interior Color</label><input value={editCar.interior_color || ''} onChange={e => setEditField('interior_color', e.target.value)} /></div>
                <div className="emp-field"><label>Engine</label><input value={editCar.engine || ''} onChange={e => setEditField('engine', e.target.value)} /></div>
                <div className="emp-field"><label>Horsepower</label><input type="number" value={editCar.horsepower ?? ''} onChange={e => setEditField('horsepower', +e.target.value)} /></div>
                <div className="emp-field"><label>Registration</label><input value={editCar.registration_number || ''} onChange={e => setEditField('registration_number', e.target.value)} /></div>
                <div className="emp-field"><label>Insurance Validity</label><input value={editCar.insurance_validity || ''} onChange={e => setEditField('insurance_validity', e.target.value)} /></div>
                <div className="emp-field"><label>Location</label><input value={editCar.location || ''} onChange={e => setEditField('location', e.target.value)} /></div>
              </div>
              <div className="emp-field" style={{ marginTop: '1rem' }}><label>Features (comma separated)</label>
                <textarea 
                  value={Array.isArray(editCar.features) ? editCar.features.join(', ') : (editCar.features as string) || ''} 
                  onChange={e => setEditField('features', e.target.value)} 
                  rows={2} 
                />
              </div>
              <div className="emp-field" style={{ marginTop: '1rem' }}><label>Description</label>
                <textarea value={editCar.description || ''} onChange={e => setEditField('description', e.target.value)} rows={3} />
              </div>
            </div>

            {/* Images Section */}
            <div className="upl-section">
              <h3 className="upl-section-title">Images</h3>
              <div className="upl-img-row">
                {/* Thumbnail */}
                <div className="upl-thumb-area">
                  <label>Thumbnail Image</label>
                  <div className="upl-thumb-box" onClick={() => thumbInputRef.current?.click()}>
                    {newThumbPreview ? (
                      <img src={newThumbPreview} alt="New Preview" />
                    ) : editCar.thumbnail ? (
                      <img src={getProxiedImageUrl(editCar.thumbnail)} alt="Current Thumbnail" />
                    ) : (
                      <><Upload size={24} /><span>Click to change</span></>
                    )}
                  </div>
                  <input ref={thumbInputRef} type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) { setNewThumbnail(file); setNewThumbPreview(URL.createObjectURL(file)); }
                  }} hidden />
                </div>

                {/* Gallery */}
                <div className="upl-gallery-area">
                  <label>Gallery Images</label>
                  <div className="upl-dropzone" onClick={() => galleryInputRef.current?.click()}>
                    <ImageIcon size={24} />
                    <span>Click to add more gallery images</span>
                  </div>
                  <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={e => {
                    const files = Array.from(e.target.files || []);
                    setNewGallery(prev => [...prev, ...files]);
                    setNewGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
                  }} hidden />

                  {/* Previews grid of existing and new gallery images */}
                  <div className="upl-preview-grid">
                    {/* Existing gallery */}
                    {gallery.map(img => {
                      const isDeleted = deletedImageIds.includes(img.id);
                      if (isDeleted) return null;
                      return (
                        <div key={img.id} className="upl-preview-item">
                          <img src={getProxiedImageUrl(img.image_url)} alt="" />
                          <button type="button" onClick={() => setDeletedImageIds(prev => [...prev, img.id])} style={{ background: '#E10613' }}>
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                    {/* New gallery preview */}
                    {newGalleryPreviews.map((p, i) => (
                      <div key={i} className="upl-preview-item" style={{ border: '2px solid #E10613' }}>
                        <img src={p} alt="" />
                        <button type="button" onClick={() => {
                          setNewGallery(prev => prev.filter((_, idx) => idx !== i));
                          setNewGalleryPreviews(prev => prev.filter((_, idx) => idx !== i));
                        }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="upl-submit" 
                style={{ background: 'var(--db-sf2)', border: '1.5px solid var(--db-bd)', color: 'var(--db-tx)', width: 'auto', padding: '0.85rem 2rem' }}
                onClick={() => setEditCar(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="db-btn-gold upl-submit" 
                style={{ width: 'auto', padding: '0.85rem 2.5rem' }} 
                onClick={saveEdit} 
                disabled={updatingImages}
              >
                {updatingImages ? <><Loader2 size={18} className="login-spinner" />Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // NORMAL LIST VIEW
        <>
          <div className="db-page-header">
            <div className="db-page-title-container">
              <h1 className="db-page-title">{statusFilter === 'my' ? 'My Cars' : 'All Listings'}</h1>
              <p className="db-page-sub">Manage your uploaded vehicle listings in the inventory ({filtered.length} total)</p>
            </div>
          </div>

          <div className="car-filters" style={{ marginBottom: '1.5rem' }}>
            <div className="db-search-inline"><Search size={16} /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <div className="emp-tabs">
              {['all','available','sold','reserved','pending','rejected','my'].map(f => (
                <button key={f} className={`emp-tab ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatusFilter(f)}>
                  {f === 'all' ? 'All' : f === 'my' ? (
                    <>
                      <span className="hide-mobile">My Cars</span>
                      <span className="show-mobile">Cars</span>
                    </>
                  ) : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="car-grid">
            {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="car-skel" />) :
            filtered.length === 0 ? <p className="db-empty-full">No cars found</p> :
            filtered.map(car => (
              <motion.div key={car.id} className="car-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Link href={`/vehicle/${car.id}`} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
                  <div className="car-thumb">
                    {car.thumbnail ? <img src={getProxiedImageUrl(car.thumbnail)} alt={`${car.brand} ${car.model}`} /> : <div className="car-no-img">No Image</div>}
                    <div className="car-badges"><span className={`car-status-badge ${car.status}`}>{car.status}</span></div>
                  </div>
                </Link>
                <div className="car-info">
                  <h3>
                    <Link href={`/vehicle/${car.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {car.brand} {car.model}
                    </Link>
                  </h3>
                  {car.status === 'rejected' && car.rejection_reason && (
                    <div style={{
                      margin: '0.5rem 0 0.75rem',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1.5px solid rgba(239,68,68,0.2)',
                      borderRadius: '10px',
                      padding: '0.6rem 0.8rem',
                      fontSize: '0.75rem',
                      color: '#ef4444',
                      fontWeight: 500,
                      lineHeight: 1.4
                    }}>
                      <span style={{ fontWeight: 700 }}>Rejection Reason:</span> {car.rejection_reason}
                    </div>
                  )}
                  <p className="car-variant">{car.variant} · {car.year}</p>
                  <p className="car-price">{formatPrice(car.price)}</p>
                  <div className="car-meta"><span>{car.fuel_type}</span><span>·</span><span>{car.transmission}</span><span>·</span><span>{car.km_driven?.toLocaleString()} km</span></div>
                  <div className="car-meta2">
                    <span><Eye size={12} /> {car.views} views</span>
                    <span style={{ color: car.employee_id === employee?.id ? 'var(--db-gold)' : 'var(--db-tx3)', fontWeight: 600 }}>
                      By: {car.employee_id === employee?.id ? 'Me' : (car.employee as unknown as { name: string })?.name || 'Other'}
                    </span>
                  </div>
                  <div className="car-meta2" style={{ justifyContent: 'flex-start' }}>
                    <span>{timeAgo(car.created_at)}</span>
                  </div>
                  <div className="car-actions">
                    {car.employee_id === employee?.id ? (
                      <>
                        <button onClick={() => {
                          setEditCar({
                            ...car,
                            features: Array.isArray(car.features) ? car.features.join(', ') : (car.features as string) || ''
                          } as any);
                        }}><Edit size={15} /> Edit</button>
                        {car.status === 'available' && <button className="act-green" onClick={() => updateStatus(car.id, 'sold')}>Mark Sold</button>}
                        {car.status === 'sold' && <button onClick={() => updateStatus(car.id, 'available')}>Restore</button>}
                        {car.status === 'available' && <button onClick={() => updateStatus(car.id, 'reserved')}>Reserve</button>}
                        <button className="act-red" onClick={() => deleteCar(car.id)}><Trash2 size={15} /></button>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--db-tx3)', fontStyle: 'italic', padding: '4px 0' }}>Read-only (uploaded by another employee)</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Car"
        message="Are you sure you want to delete this car listing permanently? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
        isDanger={true}
      />

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
.upl-grid select,
.upl-grid textarea,
.emp-field input,
.emp-field select,
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
.upl-grid select:focus,
.upl-grid textarea:focus,
.emp-field input:focus,
.emp-field select:focus,
.emp-field textarea:focus {
  border-color: #E10613;
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
  object-fit: contain;
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
  object-fit: contain;
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
  align-items: center;
  justify-content: center;
}

.upl-submit {
  width: 100%;
  padding: 0.85rem;
  background: #E10613;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.upl-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(225, 6, 19, 0.25);
  background: #c30510;
}
.upl-submit:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.car-filters{display:flex;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center;justify-content:space-between}
.db-search-inline{display:flex;align-items:center;gap:.5rem;background:var(--db-sf);border:1px solid var(--db-bd);border-radius:12px;padding:.5rem 1rem;min-width:240px;box-shadow:var(--card-shadow)}
.db-search-inline svg{color:var(--db-tx3);flex-shrink:0}
.db-search-inline input{background:0;border:0;outline:0;color:var(--db-tx);font-size:.875rem;width:100%;font-family:inherit}
.emp-tabs{display:flex;align-items:center;gap:4px;background:rgba(0, 0, 0, 0.03);padding:4px;border-radius:999px;border:1px solid rgba(0, 0, 0, 0.02)}
.emp-tab{background:transparent;border:0;padding:.45rem 1.1rem;border-radius:999px;font-size:.8125rem;font-weight:600;color:var(--db-tx2);cursor:pointer;transition:all .2s}
.emp-tab.active{background:var(--db-gold);color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
.car-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem}
.car-card{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:24px;overflow:hidden;box-shadow:var(--card-shadow);transition:all .25s ease-in-out}
.car-card:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(0,0,0,0.08)}
.car-thumb{position:relative;height:190px;background:var(--db-sf2);overflow:hidden}
.car-thumb img{width:100%;height:100%;object-fit:contain}
.car-no-img{display:flex;align-items:center;justify-content:center;height:100%;color:var(--db-tx3);font-size:.875rem;font-weight:600}
.car-badges{position:absolute;top:12px;left:12px;display:flex;gap:6px}
.car-status-badge{padding:.3rem .75rem;border-radius:20px;font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;box-shadow:0 2px 6px rgba(0,0,0,0.05)}
.car-status-badge.available{background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.1)}
.car-status-badge.sold{background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.1)}
.car-status-badge.reserved{background:rgba(245,158,11,.15);color:#f59e0b;border:1px solid rgba(245,158,11,.1)}
.car-status-badge.pending{background:rgba(59,130,246,.15);color:#3b82f6;border:1px solid rgba(59,130,246,.1)}
.car-status-badge.rejected{background:rgba(107,114,128,.15);color:#6b7280;border:1px solid rgba(107,114,128,.1)}
.car-info{padding:1.25rem}
.car-info h3{font-family:'Outfit',sans-serif;font-size:1.15rem;font-weight:700;margin:0 0 .25rem;color:var(--db-tx)}
.car-info h3:hover{color:var(--db-gold);text-decoration:underline}
.car-variant{color:var(--db-tx2);font-size:.8125rem;margin:0 0 .5rem}
.car-price{font-family:'Outfit',sans-serif;font-size:1.35rem;font-weight:800;color:var(--db-gold);margin:0 0 .5rem;letter-spacing:-0.01em}
.car-meta{display:flex;gap:.35rem;color:var(--db-tx3);font-size:.75rem;flex-wrap:wrap;margin-bottom:.35rem;font-weight:500}
.car-meta2{display:flex;justify-content:space-between;color:var(--db-tx3);font-size:.75rem;margin-bottom:.35rem;align-items:center;gap:.5rem;font-weight:500}
.car-meta2 span{display:flex;align-items:center;gap:4px}
.car-actions{display:flex;gap:6px;margin-top:.85rem;padding-top:.85rem;border-top:1px solid var(--db-bd);flex-wrap:wrap}
.car-actions button{background:var(--db-sf2);border:1px solid var(--db-bd);color:var(--db-tx2);padding:7px 11px;border-radius:10px;cursor:pointer;font-size:.8125rem;display:flex;align-items:center;gap:4px;transition:all .2s;font-weight:600}
.car-actions button:hover{border-color:var(--db-gold);color:var(--db-gold);background:var(--db-sf)}
.car-actions .act-green:hover{color:#22c55e;border-color:rgba(34,197,94,.3)}
.car-actions .act-red:hover{color:#ef4444;border-color:rgba(239,68,68,.3)}
.car-skel{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:24px;height:380px;animation:pulse 1.5s infinite;box-shadow:var(--card-shadow)}
.db-empty-full{color:var(--db-tx3);text-align:center;padding:5rem 0;font-size:.9375rem;grid-column:1/-1;font-weight:600}

.show-mobile { display: none; }
@media (max-width: 900px) {
  .upl-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 640px) {
  .hide-mobile { display: none; }
  .show-mobile { display: inline; }
  .upl-grid {
    grid-template-columns: 1fr;
  }
  .upl-img-row {
    grid-template-columns: 1fr;
  }
  .upl-thumb-box {
    width: 100%;
  }
}
      `}</style>
    </div>
  );
}
