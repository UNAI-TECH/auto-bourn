'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Edit, Trash2, Eye, Star, Check, AlertCircle, X, ChevronLeft, ChevronRight, Upload, ChevronDown } from 'lucide-react';
import { formatPrice, formatDate, timeAgo, getProxiedImageUrl } from '@/lib/utils';
import type { Car } from '@/types/database';
import ConfirmModal from '@/components/ConfirmModal';
import PromptModal from '@/components/PromptModal';

const PAGE_SIZE = 12;

function CarsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const brandParam = searchParams.get('brand') || '';

  const statusParam = searchParams.get('status') || 'all';

  const [cars, setCars] = useState<Car[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(statusParam);
  const [brandFilter, setBrandFilter] = useState(brandParam);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isBrandOpen, setIsBrandOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  
  // Edit Modal States
  const [editCar, setEditCar] = useState<Car | null>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [gallery, setGallery] = useState<{ id: string; image_url: string }[]>([]);
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [newThumbPreview, setNewThumbPreview] = useState<string | null>(null);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
  const [deletingImages, setDeletingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [rejectCarTarget, setRejectCarTarget] = useState<Car | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const supabase = createClient();

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const approveCar = async (car: Car) => {
    const { error } = await supabase.from('cars').update({ status: 'available', rejection_reason: null }).eq('id', car.id);
    if (error) {
      showToast(error.message, 'error');
      return;
    }

    // Send notification to employee
    if (car.employee_id) {
      await supabase.from('notifications').insert({
        recipient_employee_id: car.employee_id,
        recipient_role: 'employee',
        type: 'car_approved',
        title: '✅ Car Upload Approved',
        message: `Your request to upload ${car.brand} ${car.model} (${car.year}) has been approved and is now live!`,
        metadata: { car_id: car.id }
      });
    }

    showToast('Car approved successfully');
    fetchCars();
  };

  const rejectCar = async (car: Car, reason: string) => {
    if (!reason.trim()) {
      showToast('Rejection reason is required', 'error');
      return;
    }

    const { error } = await supabase.from('cars').delete().eq('id', car.id);

    if (error) {
      showToast(error.message, 'error');
      return;
    }

    // Send notification to employee
    if (car.employee_id) {
      await supabase.from('notifications').insert({
        recipient_employee_id: car.employee_id,
        recipient_role: 'employee',
        type: 'car_rejected',
        title: '❌ Car Upload Rejected',
        message: `your uploard was rejected by admin. Vehicle: ${car.brand} ${car.model} (${car.year}). Reason: ${reason}`,
        metadata: { brand: car.brand, model: car.model, year: car.year, rejection_reason: reason }
      });
    }

    showToast('Car listing rejected and deleted');
    setRejectCarTarget(null);
    fetchCars();
  };

  const fetchCars = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('cars').select('*, employee:employees!employee_id(name, employee_id)', { count: 'exact' });
    if (search) query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%`);
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (brandFilter) query = query.eq('brand', brandFilter);
    query = query.order('created_at', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    const { data, count } = await query;
    setCars(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [search, statusFilter, brandFilter, page]);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
      if (brandRef.current && !brandRef.current.contains(event.target as Node)) {
        setIsBrandOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      let query = supabase.from('cars').select('*, employee:employees!employee_id(name, employee_id)', { count: 'exact' });
      if (search) query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%`);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (brandFilter) query = query.eq('brand', brandFilter);
      query = query.order('created_at', { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      query.then(({ data, count }) => {
        if (data) setCars(data);
        if (count !== null) setTotal(count);
      });
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [search, statusFilter, brandFilter, page, supabase]);

  // Reset to page 0 whenever filters change
  useEffect(() => { setPage(0); }, [search, statusFilter, brandFilter]);

  useEffect(() => {
    setBrandFilter(brandParam);
  }, [brandParam]);

  useEffect(() => {
    const statusParam = searchParams.get('status') || 'all';
    setStatusFilter(statusParam);
  }, [searchParams]);

  useEffect(() => {
    const fetchBrands = async () => {
      const { data } = await supabase.from('cars').select('brand');
      if (data) setBrands([...new Set(data.map(c => c.brand))].sort());
    };
    fetchBrands();
  }, []);

  // Load gallery when editCar opens
  useEffect(() => {
    if (!editCar) {
      setGallery([]);
      setNewThumbnail(null);
      setNewThumbPreview(null);
      setNewGalleryFiles([]);
      setNewGalleryPreviews([]);
      setDeletingImages([]);
      return;
    }
    const fetchGallery = async () => {
      const { data } = await supabase
        .from('car_images')
        .select('id, image_url')
        .eq('car_id', editCar.id)
        .order('display_order', { ascending: true });
      if (data) setGallery(data);
    };
    fetchGallery();
  }, [editCar]);

  const updateCarStatus = async (id: string, status: string) => {
    const updates: Record<string, unknown> = { status };
    if (status === 'sold') updates.sold_at = new Date().toISOString();
    else { updates.sold_at = null; updates.sold_by = null; }
    await supabase.from('cars').update(updates).eq('id', id);
    showToast(`Car marked as ${status}`);
    fetchCars();
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from('cars').update({ featured: !current }).eq('id', id);
    showToast(!current ? 'Car featured' : 'Car unfeatured');
    fetchCars();
  };

  const deleteCar = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    await supabase.from('cars').delete().eq('id', deleteTargetId);
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

  const handleRemoveGalleryImage = (id: string) => {
    setDeletingImages(prev => [...prev, id]);
    setGallery(prev => prev.filter(img => img.id !== id));
  };

  const handleRemoveNewPreview = (index: number) => {
    setNewGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setNewGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setNewGalleryFiles(prev => [...prev, ...files]);
    setNewGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const saveEdit = async () => {
    if (!editCar) return;
    setUploading(true);
    try {
      let thumbnailUrl = editCar.thumbnail;

      // 1. Upload new thumbnail if selected
      if (newThumbnail) {
        thumbnailUrl = await uploadFile(newThumbnail, 'thumbnails');
      }

      // 2. Delete removed gallery images
      if (deletingImages.length > 0) {
        await supabase.from('car_images').delete().in('id', deletingImages);
      }

      // 3. Upload new gallery images
      if (newGalleryFiles.length > 0) {
        const { count } = await supabase.from('car_images').select('id', { count: 'exact', head: true }).eq('car_id', editCar.id);
        const currentCount = count || 0;
        
        for (let i = 0; i < newGalleryFiles.length; i++) {
          const url = await uploadFile(newGalleryFiles[i], `gallery/${editCar.id}`);
          await supabase.from('car_images').insert({
            car_id: editCar.id,
            image_url: url,
            display_order: currentCount + i
          });
        }
      }

      // 4. Update the car record
      const { id, employee, ...rest } = editCar;
      void employee;
      const { error } = await supabase
        .from('cars')
        .update({
          ...rest,
          thumbnail: thumbnailUrl,
        })
        .eq('id', id);

      if (error) throw error;

      showToast('Car updated successfully');
      setEditCar(null);
      fetchCars();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to update car', 'error');
    } finally {
      setUploading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="db-page">
      <div className="db-page-header">
        <div><h1 className="db-page-title">Car Management</h1><p className="db-page-sub">{total} vehicles in inventory</p></div>
      </div>

      <div className="car-filters">
        <div className="db-search-inline"><Search size={16} /><input placeholder="Search brand, model..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="car-filter-group">
          
          {/* Status Dropdown */}
          <div ref={statusRef} className="custom-status-container">
            <button
              type="button"
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className="custom-status-trigger"
            >
              <Filter size={13} style={{ color: 'var(--db-tx3)' }} />
              <span>
                {statusFilter === 'all'
                  ? 'All Status'
                  : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
              </span>
              <ChevronDown
                size={13}
                style={{
                  color: 'var(--db-tx3)',
                  transform: isStatusOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  marginLeft: '0.25rem'
                }}
              />
            </button>

            <AnimatePresence>
              {isStatusOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="custom-status-dropdown"
                  style={{ right: 'auto', left: 0 }}
                >
                  <button
                    type="button"
                    className={`custom-status-option ${statusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setStatusFilter('all');
                      setIsStatusOpen(false);
                    }}
                  >
                    All Status
                  </button>
                  {['available', 'sold', 'reserved', 'pending', 'rejected'].map(st => (
                    <button
                      key={st}
                      type="button"
                      className={`custom-status-option ${statusFilter === st ? 'active' : ''}`}
                      onClick={() => {
                        setStatusFilter(st);
                        setIsStatusOpen(false);
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: st === 'available' ? '#22c55e' : st === 'sold' ? '#ef4444' : st === 'reserved' ? '#f59e0b' : st === 'pending' ? '#3b82f6' : '#6b7280',
                          display: 'inline-block',
                          marginRight: '8px'
                        }}
                      />
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Brand Dropdown */}
          <div ref={brandRef} className="custom-status-container">
            <button
              type="button"
              onClick={() => setIsBrandOpen(!isBrandOpen)}
              className="custom-status-trigger"
            >
              <span>{brandFilter || 'All Brands'}</span>
              <ChevronDown
                size={13}
                style={{
                  color: 'var(--db-tx3)',
                  transform: isBrandOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  marginLeft: '0.25rem'
                }}
              />
            </button>

            <AnimatePresence>
              {isBrandOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="custom-status-dropdown"
                  style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    right: 'auto',
                    left: 0
                  }}
                >
                  <button
                    type="button"
                    className={`custom-status-option ${!brandFilter ? 'active' : ''}`}
                    onClick={() => {
                      setBrandFilter('');
                      setIsBrandOpen(false);
                      const params = new URLSearchParams(window.location.search);
                      params.delete('brand');
                      router.push(`/dashboard/cars?${params.toString()}`);
                    }}
                  >
                    All Brands
                  </button>
                  {brands.map(b => (
                    <button
                      key={b}
                      type="button"
                      className={`custom-status-option ${brandFilter === b ? 'active' : ''}`}
                      onClick={() => {
                        setBrandFilter(b);
                        setIsBrandOpen(false);
                        const params = new URLSearchParams(window.location.search);
                        params.set('brand', b);
                        router.push(`/dashboard/cars?${params.toString()}`);
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      <div className="car-grid">
        {loading ? Array(6).fill(0).map((_, i) => <div key={i} className="car-skel" />) :
        cars.length === 0 ? <p className="db-empty-full">No cars found</p> :
        cars.map(car => (
          <motion.div key={car.id} className="car-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Link href={`/vehicle/${car.id}`} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
              <div className="car-thumb">
                {car.thumbnail ? <img src={getProxiedImageUrl(car.thumbnail)} alt={`${car.brand} ${car.model}`} /> : <div className="car-no-img">No Image</div>}
                <div className="car-badges">
                  <span className={`car-status-badge ${car.status}`}>{car.status}</span>
                </div>
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
                  margin: '0.5rem 0',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
                  color: '#ef4444',
                  fontWeight: 500,
                  lineHeight: 1.4
                }}>
                  <span style={{ fontWeight: 700 }}>Reason:</span> {car.rejection_reason}
                </div>
              )}
              <p className="car-variant">{car.variant} · {car.year}</p>
              <p className="car-price">{formatPrice(car.price)}</p>
              <div className="car-meta">
                <span>{car.fuel_type}</span><span>·</span><span>{car.transmission}</span><span>·</span><span>{car.km_driven?.toLocaleString()} km</span>
              </div>
              <div className="car-meta2">
                <span>By: {(car.employee as unknown as { name: string })?.name || 'Unknown'}</span>
                <span>{timeAgo(car.created_at)}</span>
              </div>
              <div className="car-meta2"><span><Eye size={12} /> {car.views} views</span></div>
              <div className="car-actions">
                {car.status === 'pending' ? (
                  <>
                    <button onClick={() => approveCar(car)} className="act-green" style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)' }} title="Approve">
                      Approve
                    </button>
                    <button onClick={() => setRejectCarTarget(car)} className="act-red" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }} title="Reject">
                      Reject
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditCar(car)} title="Edit"><Edit size={15} /></button>
                    {car.status !== 'sold' && <button onClick={() => updateCarStatus(car.id, 'sold')} title="Mark Sold" className="act-green"><Check size={15} /></button>}
                    {car.status === 'sold' && <button onClick={() => updateCarStatus(car.id, 'available')} title="Restore">↩</button>}
                  </>
                )}
                <button onClick={() => deleteCar(car.id)} title="Delete" className="act-red"><Trash2 size={15} /></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="car-pagination">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button>
          <span>Page {page + 1} of {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editCar && (
          <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditCar(null)}>
            <motion.div className="inspo-card-modal car-edit-modal-single" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <button className="inspo-modal-close" onClick={() => setEditCar(null)}><X size={20} /></button>

              <div className="inspo-card-header">
                <h2 className="inspo-card-title">Edit Vehicle Details</h2>
                <p className="inspo-card-subtitle">Modify the vehicle specifications, pricing, status, and media assets.</p>
              </div>

              <div className="inspo-form car-edit-vertical-flow">
                
                {/* Centered Thumbnail Section (matching employee photo style) */}
                <div className="inspo-photo-section">
                  <div className="inspo-photo-upload rect-upload" onClick={() => thumbInputRef.current?.click()}>
                    {newThumbPreview ? (
                      <div className="inspo-photo-preview-container rect-preview">
                        <img src={newThumbPreview} alt="Preview" className="inspo-photo-preview" />
                        <div className="inspo-photo-overlay rect-overlay">
                          <span>Change Thumbnail</span>
                        </div>
                      </div>
                    ) : editCar.thumbnail ? (
                      <div className="inspo-photo-preview-container rect-preview">
                        <img src={getProxiedImageUrl(editCar.thumbnail)} alt="Current" className="inspo-photo-preview" />
                        <div className="inspo-photo-overlay rect-overlay">
                          <span>Change Thumbnail</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload size={20} />
                        <span>Upload Thumbnail</span>
                        <span className="inspo-photo-subtext">JPG, PNG (max 5MB)</span>
                      </>
                    )}
                  </div>
                  <input
                    ref={thumbInputRef}
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) { setNewThumbnail(file); setNewThumbPreview(URL.createObjectURL(file)); }
                    }}
                    hidden
                  />
                </div>

                {/* Grid of Fields */}
                <div className="inspo-grid">
                  {[
                    { k: 'brand', l: 'Brand', r: true, p: 'e.g. Audi' }, 
                    { k: 'model', l: 'Model', r: true, p: 'e.g. A4' },
                    { k: 'variant', l: 'Variant', r: true, p: 'e.g. 35 TDI' }, 
                    { k: 'year', l: 'Year', t: 'number', r: true, p: 'e.g. 2021' },
                    { k: 'price', l: 'Price (INR)', t: 'number', r: true, p: 'e.g. 2650000' }, 
                    { k: 'km_driven', l: 'KM Driven', t: 'number', r: true, p: 'e.g. 35000' },
                    { k: 'fuel_type', l: 'Fuel Type', r: true, p: 'e.g. Diesel' }, 
                    { k: 'transmission', l: 'Transmission', r: true, p: 'e.g. Automatic' },
                    { k: 'ownership', l: 'Ownership', p: 'e.g. 1st Owner' }, 
                    { k: 'color', l: 'Color', p: 'e.g. Black' },
                    { k: 'location', l: 'Location', p: 'e.g. Chennai' },
                  ].map(({ k, l, t, r, p }) => (
                    <div className="inspo-field" key={k}>
                      <label>{l} {r && <span className="required">*</span>}</label>
                      <input
                        type={t || 'text'}
                        value={(editCar as unknown as Record<string, unknown>)[k] as string || ''}
                        onChange={e => setEditCar({ ...editCar, [k]: t === 'number' ? Number(e.target.value) : e.target.value })}
                        required={r}
                        placeholder={p}
                      />
                    </div>
                  ))}
                  
                  {/* Status Dropdown */}
                  <div className="inspo-field">
                    <label>Status <span className="required">*</span></label>
                    <select
                      value={editCar.status}
                      onChange={e => setEditCar({ ...editCar, status: e.target.value as Car['status'] })}
                      className="inspo-select"
                    >
                      <option value="available">Available</option>
                      <option value="sold">Sold</option>
                      <option value="reserved">Reserved</option>
                      <option value="pending">Pending Approval</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Description Spanning Full Width */}
                  <div className="inspo-field full-width">
                    <label>Description</label>
                    <textarea
                      value={editCar.description || ''}
                      onChange={e => setEditCar({ ...editCar, description: e.target.value })}
                      rows={3}
                      className="inspo-textarea"
                      placeholder="Enter vehicle details, specs, etc..."
                    />
                  </div>
                </div>

                {/* Gallery Images Section */}
                <div className="inspo-field full-width" style={{ marginTop: '0.5rem' }}>
                  <label>Gallery Images</label>
                  <div className="inspo-gallery-container">
                    <div className="inspo-gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '0.5rem', minHeight: '60px', padding: '0.5rem', background: 'var(--db-sf2)', borderRadius: '12px', border: '1px solid var(--db-bd)' }}>
                      {gallery.map(img => (
                        <div key={img.id} className="inspo-gallery-item" style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden' }}>
                          <img src={getProxiedImageUrl(img.image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            className="inspo-gallery-delete"
                            style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', border: 0, color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', padding: 0 }}
                            onClick={() => handleRemoveGalleryImage(img.id)}
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {newGalleryPreviews.map((preview, idx) => (
                        <div key={idx} className="inspo-gallery-item new-preview" style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '2px dashed var(--db-gold)' }}>
                          <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            className="inspo-gallery-delete danger"
                            style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(225,6,19,0.8)', border: 0, color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', padding: 0 }}
                            onClick={() => handleRemoveNewPreview(idx)}
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="inspo-upload-action-btn"
                      style={{ marginTop: '0.75rem' }}
                      onClick={() => galleryInputRef.current?.click()}
                    >
                      <Upload size={14} /> Add Gallery Images
                    </button>
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryChange}
                      hidden
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="inspo-form-footer">
                  <button
                    type="button"
                    className="inspo-btn-cancel"
                    onClick={() => setEditCar(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inspo-btn-submit"
                    disabled={uploading}
                    onClick={saveEdit}
                  >
                    {uploading ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Car"
        message="Are you sure you want to delete this car permanently? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
        isDanger={true}
      />

      <PromptModal
        isOpen={!!rejectCarTarget}
        title="Reject Car Listing"
        message={`Please enter the reason for rejecting the upload request for ${rejectCarTarget?.brand} ${rejectCarTarget?.model}:`}
        placeholder="Reason for rejection..."
        confirmLabel="Reject Request"
        cancelLabel="Cancel"
        onConfirm={(val) => {
          if (rejectCarTarget) rejectCar(rejectCarTarget, val);
        }}
        onCancel={() => setRejectCarTarget(null)}
      />

      <AnimatePresence>{toast && <motion.div className={`db-toast ${toast.type}`} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}>{toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}{toast.msg}</motion.div>}</AnimatePresence>

      <style jsx>{`
.db-page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem}
.db-page-title{font-family:'Outfit',sans-serif;font-size:1.75rem;font-weight:700;margin:0}
.db-page-sub{color:var(--db-tx2);font-size:.875rem;margin-top:.25rem}
.db-search-inline{display:flex;align-items:center;gap:.5rem;background:var(--db-sf);border:1px solid var(--db-bd);border-radius:10px;padding:.5rem 1rem;flex:1;min-width:200px}
.db-search-inline svg{color:var(--db-tx3);flex-shrink:0}
.db-search-inline input{background:0;border:0;outline:0;color:var(--db-tx);font-size:.875rem;width:100%;font-family:inherit}
.db-search-inline input::placeholder{color:var(--db-tx3)}
.car-filters{display:flex;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center}
.car-filter-group{display:flex;gap:.5rem}
.car-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1rem}
.car-card{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:14px;overflow:hidden;transition:all .2s}
.car-card:hover{border-color:var(--db-gold);box-shadow:0 4px 20px var(--db-gg)}
.car-thumb{position:relative;height:180px;background:var(--db-sf2);overflow:hidden}
.car-thumb img{width:100%;height:100%;object-fit:contain}
.car-no-img{display:flex;align-items:center;justify-content:center;height:100%;color:var(--db-tx3);font-size:.875rem}
.car-badges{position:absolute;top:8px;left:8px;display:flex;gap:6px}
.car-status-badge{padding:.25rem .75rem;border-radius:20px;font-size:.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:.03em}
.car-status-badge.available{background:rgba(34,197,94,.15);color:#22c55e}
.car-status-badge.sold{background:rgba(239,68,68,.15);color:#ef4444}
.car-status-badge.reserved{background:rgba(245,158,11,.15);color:#f59e0b}
.car-status-badge.pending{background:rgba(59,130,246,.15);color:#3b82f6}
.car-status-badge.rejected{background:rgba(107,114,128,.15);color:#6b7280}
.car-feat{background:rgba(225,6,19,.15);color:#e10613;padding:.25rem;border-radius:6px;display:flex}
.car-info{padding:1rem}
.car-info h3{font-family:'Outfit',sans-serif;font-size:1.0625rem;font-weight:600;margin:0 0 .25rem}
.car-info h3:hover{color:var(--db-gold);text-decoration:underline}
.car-variant{color:var(--db-tx2);font-size:.8125rem;margin:0 0 .5rem}
.car-price{font-family:'Outfit',sans-serif;font-size:1.25rem;font-weight:700;color:var(--db-gold);margin:0 0 .5rem}
.car-meta{display:flex;gap:.35rem;color:var(--db-tx3);font-size:.75rem;flex-wrap:wrap;margin-bottom:.35rem}
.car-meta2{display:flex;justify-content:space-between;color:var(--db-tx3);font-size:.75rem;margin-bottom:.35rem;align-items:center;gap:.5rem}
.car-meta2 span{display:flex;align-items:center;gap:4px}
.car-actions{display:flex;gap:6px;margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--db-bd)}
.car-actions button{background:var(--db-sf2);border:1px solid var(--db-bd);color:var(--db-tx2);padding:6px 10px;border-radius:8px;cursor:pointer;font-size:.8125rem;display:flex;align-items:center;gap:4px;transition:all .2s}
.car-actions button:hover{border-color:var(--db-gold);color:var(--db-gold)}
.car-actions .feat-on{color:#e10613;border-color:rgba(225,6,19,.3)}
.car-actions .act-green:hover{color:#22c55e;border-color:rgba(34,197,94,.3)}
.car-actions .act-red:hover{color:#ef4444;border-color:rgba(239,68,68,.3)}
.car-skel{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:14px;height:360px;animation:pulse 1.5s infinite}
.db-empty-full{color:var(--db-tx3);text-align:center;padding:4rem 0;font-size:.9375rem;grid-column:1/-1}
.car-pagination{display:flex;align-items:center;justify-content:center;gap:1rem;margin-top:1.5rem}
.car-pagination button{background:var(--db-sf);border:1px solid var(--db-bd);color:var(--db-tx2);padding:.5rem .75rem;border-radius:8px;cursor:pointer;display:flex;transition:all .2s}
.car-pagination button:hover:not(:disabled){border-color:var(--db-gold);color:var(--db-gold)}
.car-pagination button:disabled{opacity:.3;cursor:not-allowed}
.car-pagination span{font-size:.875rem;color:var(--db-tx2)}
:global(.modal-backdrop) {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}
:global(.inspo-card-modal) {
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  border-top: 5px solid #E10613;
  border-radius: 24px;
  width: 100%;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  color: var(--db-tx);
  font-family: inherit;
}
:global(.car-edit-modal-single) {
  max-width: 640px !important;
}
:global(.car-edit-vertical-flow) {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  padding-right: 0.5rem;
  flex: 1;
}
:global(.inspo-photo-section) {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}
:global(.inspo-photo-upload) {
  width: 110px;
  height: 110px;
  border: 2px dashed var(--db-bd);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--db-sf2);
  color: var(--db-tx2);
  transition: all 0.2s;
  padding: 10px;
}
:global(.inspo-photo-upload:hover) {
  border-color: #E10613;
  color: #E10613;
  background: var(--db-gd);
}
:global(.inspo-photo-upload svg) {
  margin-bottom: 0.25rem;
}
:global(.inspo-photo-upload span) {
  font-size: 0.75rem;
  font-weight: 600;
}
:global(.inspo-photo-subtext) {
  font-size: 0.625rem !important;
  color: var(--db-tx3);
  margin-top: 2px;
  font-weight: 400 !important;
}
:global(.inspo-photo-preview-container) {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
}
:global(.inspo-photo-preview) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
:global(.inspo-photo-overlay) {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 50%;
}
:global(.inspo-photo-upload:hover .inspo-photo-overlay) {
  opacity: 1;
}

/* Rectangular thumbnail specific overrides */
:global(.rect-upload) {
  width: 160px !important;
  height: 110px !important;
  border-radius: 16px !important;
}
:global(.rect-preview) {
  border-radius: 14px !important;
}
:global(.rect-overlay) {
  border-radius: 14px !important;
}

:global(.inspo-grid) {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}
:global(.inspo-grid .full-width) {
  grid-column: span 2;
}

:global(.inspo-modal-close) {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: none;
  border: none;
  color: var(--db-tx2);
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  transition: all 0.2s;
  z-index: 20;
}
:global(.inspo-modal-close:hover) {
  background: var(--db-sf2);
  color: var(--db-tx);
}
:global(.inspo-card-header) {
  text-align: center;
  margin-bottom: 2rem;
}
:global(.inspo-card-title) {
  font-family: 'Outfit', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--db-tx);
  margin: 0 0 0.5rem 0;
}
:global(.inspo-card-subtitle) {
  font-size: 0.875rem;
  color: var(--db-tx2);
  margin: 0;
}
:global(.inspo-field) {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
:global(.inspo-field label) {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--db-tx2);
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
:global(.inspo-field label .required) {
  color: #E10613;
}
:global(.inspo-field input),
:global(.inspo-select),
:global(.inspo-textarea) {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--db-sf2);
  border: 1px solid var(--db-bd);
  border-radius: 10px;
  color: var(--db-tx);
  font-size: 0.875rem;
  font-family: inherit;
  outline: 0;
  transition: all 0.2s;
  box-sizing: border-box;
}
:global(.inspo-field input:focus),
:global(.inspo-select:focus),
:global(.inspo-textarea:focus) {
  border-color: #E10613;
  box-shadow: 0 0 0 3px rgba(225, 6, 19, 0.1);
  background: var(--db-sf);
}
:global(.inspo-field input::placeholder),
:global(.inspo-textarea::placeholder) {
  color: var(--db-tx3);
}
:global(.inspo-upload-action-btn) {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  border-radius: 8px;
  width: fit-content;
  background: var(--db-sf2);
  border: 1px solid var(--db-bd);
  color: var(--db-tx2);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  transition: all 0.2s;
}
:global(.inspo-upload-action-btn:hover) {
  border-color: #E10613;
  color: #E10613;
  background: var(--db-sf);
}
:global(.inspo-gallery-container) {
  display: flex;
  flex-direction: column;
}
:global(.inspo-gallery-item) {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--db-bd);
}
:global(.inspo-gallery-item img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
:global(.inspo-gallery-delete) {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.6);
  border: 0;
  color: #fff;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 10px;
  padding: 0;
  transition: all 0.2s;
  z-index: 5;
}
:global(.inspo-gallery-delete:hover) {
  background: #E10613;
}
:global(.inspo-form-footer) {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--db-bd);
  gap: 1rem;
}
:global(.inspo-btn-cancel) {
  padding: 0.75rem 1.5rem;
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  border-radius: 10px;
  color: var(--db-tx2);
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
:global(.inspo-btn-cancel:hover) {
  background: var(--db-sf2);
  color: var(--db-tx);
  border-color: var(--db-tx3);
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
@media (max-width: 640px) {
  :global(.inspo-grid) {
    grid-template-columns: 1fr;
  }
}
      `}</style>
    </div>
  );
}

export default function CarsPage() {
  return (
    <Suspense fallback={
      <div className="db-page">
        <div className="db-page-header">
          <div>
            <h1 className="db-page-title">Car Management</h1>
            <p className="db-page-sub">Loading inventory...</p>
          </div>
        </div>
        <div className="car-grid">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="car-skel" />
          ))}
        </div>
      </div>
    }>
      <CarsPageContent />
    </Suspense>
  );
}

