'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Edit, Trash2, Eye, Star, Check, AlertCircle, X, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { formatPrice, formatDate, timeAgo } from '@/lib/utils';
import type { Car } from '@/types/database';
import ConfirmModal from '@/components/ConfirmModal';

const PAGE_SIZE = 12;

function CarsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const brandParam = searchParams.get('brand') || '';

  const [cars, setCars] = useState<Car[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState(brandParam);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const supabase = createClient();

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
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

  // Reset to page 0 whenever filters change
  useEffect(() => { setPage(0); }, [search, statusFilter, brandFilter]);

  useEffect(() => {
    setBrandFilter(brandParam);
  }, [brandParam]);

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
          <div className="car-select-wrap"><Filter size={14} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option><option value="available">Available</option><option value="sold">Sold</option><option value="reserved">Reserved</option>
            </select>
          </div>
          <div className="car-select-wrap">
            <select value={brandFilter} onChange={e => {
              const val = e.target.value;
              setBrandFilter(val);
              const params = new URLSearchParams(window.location.search);
              if (val) params.set('brand', val);
              else params.delete('brand');
              router.push(`/dashboard/cars?${params.toString()}`);
            }}>
              <option value="">All Brands</option>{brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
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
                {car.thumbnail ? <img src={car.thumbnail} alt={`${car.brand} ${car.model}`} /> : <div className="car-no-img">No Image</div>}
                <div className="car-badges">
                  <span className={`car-status-badge ${car.status}`}>{car.status}</span>
                  {car.featured && <span className="car-feat"><Star size={12} /></span>}
                </div>
              </div>
            </Link>
            <div className="car-info">
              <h3>
                <Link href={`/vehicle/${car.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {car.brand} {car.model}
                </Link>
              </h3>
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
                <button onClick={() => setEditCar(car)} title="Edit"><Edit size={15} /></button>
                <button onClick={() => toggleFeatured(car.id, car.featured)} title="Feature" className={car.featured ? 'feat-on' : ''}><Star size={15} /></button>
                {car.status !== 'sold' && <button onClick={() => updateCarStatus(car.id, 'sold')} title="Mark Sold" className="act-green"><Check size={15} /></button>}
                {car.status === 'sold' && <button onClick={() => updateCarStatus(car.id, 'available')} title="Restore">↩</button>}
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
          <motion.div className="emp-modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditCar(null)}>
            <motion.div className="emp-modal car-edit-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="emp-modal-head"><h2>Edit Car</h2><button onClick={() => setEditCar(null)}><X size={20} /></button></div>
              <div className="emp-form car-edit-form">
                
                {/* Left Column: Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { k: 'brand', l: 'Brand' }, { k: 'model', l: 'Model' }, { k: 'variant', l: 'Variant' },
                    { k: 'year', l: 'Year', t: 'number' }, { k: 'price', l: 'Price', t: 'number' },
                    { k: 'fuel_type', l: 'Fuel Type' }, { k: 'transmission', l: 'Transmission' },
                    { k: 'km_driven', l: 'KM Driven', t: 'number' }, { k: 'ownership', l: 'Ownership' },
                    { k: 'color', l: 'Color' }, { k: 'location', l: 'Location' },
                  ].map(({ k, l, t }) => (
                    <div className="emp-field" key={k}><label>{l}</label>
                      <input type={t || 'text'} value={(editCar as unknown as Record<string, unknown>)[k] as string || ''} onChange={e => setEditCar({ ...editCar, [k]: t === 'number' ? Number(e.target.value) : e.target.value })} />
                    </div>
                  ))}
                  <div className="emp-field" style={{ gridColumn: '1/-1' }}><label>Description</label>
                    <textarea value={editCar.description || ''} onChange={e => setEditCar({ ...editCar, description: e.target.value })} rows={3} />
                  </div>
                  <div className="emp-field"><label>Status</label>
                    <select value={editCar.status} onChange={e => setEditCar({ ...editCar, status: e.target.value as Car['status'] })}>
                      <option value="available">Available</option><option value="sold">Sold</option><option value="reserved">Reserved</option>
                    </select>
                  </div>
                </div>

                {/* Right Column: Images */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--db-gold)' }}>Images</h3>
                  
                  {/* Thumbnail */}
                  <div className="emp-field">
                    <label>Thumbnail Image</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.25rem' }}>
                      <div style={{ width: '100px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--db-bd)', background: 'var(--db-sf2)', position: 'relative', flexShrink: 0 }}>
                        {newThumbPreview ? (
                          <img src={newThumbPreview} alt="Thumb Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : editCar.thumbnail ? (
                          <img src={editCar.thumbnail} alt="Thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.75rem', color: 'var(--db-tx3)' }}>No Image</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button type="button" className="db-btn-gold" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '8px', width: 'fit-content' }} onClick={() => thumbInputRef.current?.click()}>
                          <Upload size={14} /> Change Thumbnail
                        </button>
                        <input ref={thumbInputRef} type="file" accept="image/*" onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) { setNewThumbnail(file); setNewThumbPreview(URL.createObjectURL(file)); }
                        }} hidden />
                        {newThumbnail && <span style={{ fontSize: '0.7rem', color: 'var(--db-tx2)' }}>Selected: {newThumbnail.name}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Gallery */}
                  <div className="emp-field" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label>Gallery Images</label>
                    
                    {/* Grid for existing and new images */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '0.5rem', minHeight: '60px', padding: '0.5rem', background: 'var(--db-sf2)', borderRadius: '12px', border: '1px solid var(--db-bd)' }}>
                      {gallery.map(img => (
                        <div key={img.id} style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden' }}>
                          <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => handleRemoveGalleryImage(img.id)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', border: 0, color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', padding: 0 }} title="Delete">×</button>
                        </div>
                      ))}
                      {newGalleryPreviews.map((preview, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '2px dashed var(--db-gold)' }}>
                          <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => handleRemoveNewPreview(idx)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(225,6,19,0.8)', border: 0, color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', padding: 0 }} title="Remove">×</button>
                        </div>
                      ))}
                    </div>

                    <button type="button" className="db-btn-gold" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '8px', width: 'fit-content', marginTop: '0.25rem' }} onClick={() => galleryInputRef.current?.click()}>
                      <Upload size={14} /> Add Gallery Images
                    </button>
                    <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryChange} hidden />
                  </div>
                </div>

                <button type="button" className="db-btn-gold emp-submit" style={{ gridColumn: '1/-1' }} disabled={uploading} onClick={saveEdit}>
                  {uploading ? 'Updating Listing...' : 'Save Changes'}
                </button>
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

      <AnimatePresence>{toast && <motion.div className={`db-toast ${toast.type}`} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}>{toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}{toast.msg}</motion.div>}</AnimatePresence>

      <style jsx>{`
.car-filters{display:flex;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center}
.car-filter-group{display:flex;gap:.5rem}
.car-select-wrap{display:flex;align-items:center;gap:.5rem;background:var(--db-sf);border:1px solid var(--db-bd);border-radius:10px;padding:.5rem .75rem}
.car-select-wrap svg{color:var(--db-tx3);flex-shrink:0}
.car-select-wrap select{background:0;border:0;color:var(--db-tx);font-size:.8125rem;font-family:inherit;outline:0;cursor:pointer}
.car-select-wrap select option{background:var(--db-sf);color:var(--db-tx)}
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
.car-edit-modal{max-width:800px}
.car-edit-form{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;padding:1.5rem}
.car-edit-form textarea{width:100%;padding:.75rem 1rem;background:var(--db-sf2);border:1px solid var(--db-bd);border-radius:10px;color:var(--db-tx);font-size:.875rem;font-family:inherit;outline:0;resize:vertical}
.car-edit-form select{width:100%;padding:.75rem 1rem;background:var(--db-sf2);border:1px solid var(--db-bd);border-radius:10px;color:var(--db-tx);font-size:.875rem;font-family:inherit;outline:0}
@media(max-width:640px){.car-grid{grid-template-columns:1fr}.car-edit-form{grid-template-columns:1fr}}
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

