'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useEmpContext } from '../layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Edit, Trash2, Check, AlertCircle, X, Eye, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { formatPrice, timeAgo } from '@/lib/utils';
import type { Car } from '@/types/database';
import ConfirmModal from '@/components/ConfirmModal';

export default function MyCarsPage() {
  const { employee } = useEmpContext();
  const [cars, setCars] = useState<Car[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editCar, setEditCar] = useState<Car | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  
  const [gallery, setGallery] = useState<{ id: string; image_url: string }[]>([]);
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [newThumbPreview, setNewThumbPreview] = useState('');
  const [newGallery, setNewGallery] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [updatingImages, setUpdatingImages] = useState(false);

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
    } else {
      setGallery([]);
    }
  }, [editCar, supabase]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { if (employee) fetchCars(); }, [employee]);

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

      // 4. Update the car document
      const { id, created_at, sold_at, sold_by, featured, views, employee_id, ...rest } = editCar;
      void created_at;
      void sold_at;
      void sold_by;
      void featured;
      void views;
      void employee_id;

      const { error: updateError } = await supabase.from('cars').update({
        ...rest,
        thumbnail: finalThumbnail
      }).eq('id', id);
      if (updateError) throw updateError;

      // 5. Insert activity log
      await supabase.from('activity_logs').insert({
        employee_id: employee.id,
        action: 'edit',
        details: `Edited ${editCar.brand} ${editCar.model} details and images`,
      });

      showToast('Car updated successfully');
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

  return (
    <div className="db-page">
      <div className="db-page-header"><div><h1 className="db-page-title">{statusFilter === 'my' ? 'My Cars' : 'All Listings'}</h1><p className="db-page-sub">{filtered.length} listings</p></div></div>

      <div className="car-filters" style={{ marginBottom: '1.5rem' }}>
        <div className="db-search-inline"><Search size={16} /><input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="emp-tabs">
          {['all','available','sold','reserved','my'].map(f => (
            <button key={f} className={`emp-tab ${statusFilter === f ? 'active' : ''}`} onClick={() => setStatusFilter(f)}>
              {f === 'all' ? 'All' : f === 'my' ? 'My Cars' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="car-grid">
        {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="car-skel" />) :
        filtered.length === 0 ? <p className="db-empty-full">No cars found</p> :
        filtered.map(car => (
          <motion.div key={car.id} className="car-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="car-thumb">
              {car.thumbnail ? <img src={car.thumbnail} alt={`${car.brand} ${car.model}`} /> : <div className="car-no-img">No Image</div>}
              <div className="car-badges"><span className={`car-status-badge ${car.status}`}>{car.status}</span></div>
            </div>
            <div className="car-info">
              <h3>{car.brand} {car.model}</h3>
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
                    <button onClick={() => setEditCar(car)}><Edit size={15} /> Edit</button>
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

      {/* Edit Modal */}
      <AnimatePresence>
        {editCar && (
          <motion.div className="emp-modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditCar(null)}>
            <motion.div className="emp-modal car-edit-modal" style={{ maxWidth: '800px' }} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="emp-modal-head"><h2>Edit Car</h2><button onClick={() => setEditCar(null)}><X size={20} /></button></div>
              <div className="emp-form car-edit-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', padding: '1.5rem' }}>
                
                {/* Left Column: Form Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <h3 style={{ gridColumn: '1/-1', margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--db-gold)' }}>Car Details</h3>
                  {[
                    { k: 'brand', l: 'Brand' }, { k: 'model', l: 'Model' }, { k: 'variant', l: 'Variant' },
                    { k: 'year', l: 'Year', t: 'number' }, { k: 'price', l: 'Price', t: 'number' },
                    { k: 'fuel_type', l: 'Fuel Type' }, { k: 'transmission', l: 'Transmission' },
                    { k: 'km_driven', l: 'KM Driven', t: 'number' }, { k: 'ownership', l: 'Ownership' },
                    { k: 'color', l: 'Color' }, { k: 'location', l: 'Location' },
                  ].map(({ k, l, t }) => (
                    <div className="emp-field" key={k}><label>{l}</label>
                      <input type={t || 'text'} value={(editCar as unknown as Record<string, unknown>)[k] as string || ''} onChange={e => setEditCar({ ...editCar, [k]: t === 'number' ? +e.target.value : e.target.value })} />
                    </div>
                  ))}
                  <div className="emp-field" style={{ gridColumn: '1/-1' }}><label>Description</label>
                    <textarea value={editCar.description || ''} onChange={e => setEditCar({ ...editCar, description: e.target.value })} rows={3} />
                  </div>
                </div>

                {/* Right Column: Image Editing */}
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
                      {gallery.map(img => {
                        const isDeleted = deletedImageIds.includes(img.id);
                        if (isDeleted) return null;
                        return (
                          <div key={img.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', border: '1px solid var(--db-bd)' }}>
                            <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => setDeletedImageIds(prev => [...prev, img.id])}
                              style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '4px', display: 'flex' }}
                              title="Remove Image"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        );
                      })}
                      {newGalleryPreviews.map((p, i) => (
                        <div key={i} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', border: '1px solid var(--db-gold)' }}>
                          <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => {
                              setNewGallery(prev => prev.filter((_, idx) => idx !== i));
                              setNewGalleryPreviews(prev => prev.filter((_, idx) => idx !== i));
                            }}
                            style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0, 0, 0, 0.7)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '4px', display: 'flex' }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {gallery.filter(g => !deletedImageIds.includes(g.id)).length === 0 && newGallery.length === 0 && (
                        <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '60px', fontSize: '0.75rem', color: 'var(--db-tx3)' }}>
                          No gallery images.
                        </div>
                      )}
                    </div>

                    <button type="button" className="db-btn-gold" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '8px', width: 'fit-content' }} onClick={() => galleryInputRef.current?.click()}>
                      <ImageIcon size={14} /> Add Gallery Images
                    </button>
                    <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={e => {
                      const files = Array.from(e.target.files || []);
                      setNewGallery(prev => [...prev, ...files]);
                      setNewGalleryPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
                    }} hidden />
                  </div>
                </div>

                <button type="button" className="db-btn-gold emp-submit" style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} onClick={saveEdit} disabled={updatingImages}>
                  {updatingImages ? (
                    <>
                      <Loader2 size={16} className="login-spinner" /> Saving Changes...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <style jsx>{`
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
.car-thumb img{width:100%;height:100%;object-fit:cover}
.car-no-img{display:flex;align-items:center;justify-content:center;height:100%;color:var(--db-tx3);font-size:.875rem;font-weight:600}
.car-badges{position:absolute;top:12px;left:12px;display:flex;gap:6px}
.car-status-badge{padding:.3rem .75rem;border-radius:20px;font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;box-shadow:0 2px 6px rgba(0,0,0,0.05)}
.car-status-badge.available{background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.1)}
.car-status-badge.sold{background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.1)}
.car-status-badge.reserved{background:rgba(245,158,11,.15);color:#f59e0b;border:1px solid rgba(245,158,11,.1)}
.car-info{padding:1.25rem}
.car-info h3{font-family:'Outfit',sans-serif;font-size:1.15rem;font-weight:700;margin:0 0 .25rem;color:var(--db-tx)}
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
.emp-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:250;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(5px)}
.emp-modal{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:24px;width:100%;margin:1.5rem;box-shadow:0 24px 60px rgba(0,0,0,0.15);overflow:hidden}
.car-edit-modal{max-width:680px}
.emp-modal-head{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid var(--db-bd)}
.emp-modal-head h2{font-family:'Outfit',sans-serif;font-size:1.35rem;font-weight:700;margin:0;color:var(--db-tx)}
.emp-modal-head button{background:0;border:0;color:var(--db-tx3);cursor:pointer;padding:4px;border-radius:50%}
.emp-modal-head button:hover{background:var(--db-gd);color:var(--db-tx)}
.car-edit-form{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;padding:1.5rem}
.emp-field{display:flex;flex-direction:column;gap:6px}
.emp-field label{font-size:.75rem;font-weight:700;color:var(--db-tx2);text-transform:uppercase;letter-spacing:.05em}
.emp-field input, .car-edit-form select{width:100%;padding:.75rem 1rem;background:var(--db-sf2);border:1px solid var(--db-bd);border-radius:12px;color:var(--db-tx);font-size:.875rem;font-family:inherit;outline:0;transition:all .2s}
.emp-field input:focus, .car-edit-form select:focus, .car-edit-form textarea:focus{border-color:var(--db-gold);background:var(--db-sf)}
.car-edit-form textarea{width:100%;padding:.75rem 1rem;background:var(--db-sf2);border:1px solid var(--db-bd);border-radius:12px;color:var(--db-tx);font-size:.875rem;font-family:inherit;outline:0;resize:vertical}
.emp-submit{width:100%;padding:.875rem;background:var(--db-gold);color:#fff;border:none;border-radius:12px;font-size:.9375rem;font-weight:600;font-family:inherit;cursor:pointer;transition:all .2s;text-align:center}
.emp-submit:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.12)}
@media(max-width:640px){.car-grid{grid-template-columns:1fr}.car-edit-form{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
