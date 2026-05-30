'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Edit, Trash2, Eye, Star, Check, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPrice, formatDate, timeAgo } from '@/lib/utils';
import type { Car } from '@/types/database';

const PAGE_SIZE = 12;

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editCar, setEditCar] = useState<Car | null>(null);
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
    const fetchBrands = async () => {
      const { data } = await supabase.from('cars').select('brand');
      if (data) setBrands([...new Set(data.map(c => c.brand))].sort());
    };
    fetchBrands();
  }, []);

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

  const deleteCar = async (id: string) => {
    if (!confirm('Delete this car permanently?')) return;
    await supabase.from('cars').delete().eq('id', id);
    showToast('Car deleted');
    fetchCars();
  };

  const saveEdit = async () => {
    if (!editCar) return;
    const { id, employee, ...rest } = editCar;
    void employee;
    await supabase.from('cars').update(rest).eq('id', id);
    showToast('Car updated');
    setEditCar(null);
    fetchCars();
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
            <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
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
            <div className="car-thumb">
              {car.thumbnail ? <img src={car.thumbnail} alt={`${car.brand} ${car.model}`} /> : <div className="car-no-img">No Image</div>}
              <div className="car-badges">
                <span className={`car-status-badge ${car.status}`}>{car.status}</span>
                {car.featured && <span className="car-feat"><Star size={12} /></span>}
              </div>
            </div>
            <div className="car-info">
              <h3>{car.brand} {car.model}</h3>
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
                <button type="button" className="db-btn-gold emp-submit" style={{ gridColumn: '1/-1' }} onClick={saveEdit}>Save Changes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
.car-thumb img{width:100%;height:100%;object-fit:cover}
.car-no-img{display:flex;align-items:center;justify-content:center;height:100%;color:var(--db-tx3);font-size:.875rem}
.car-badges{position:absolute;top:8px;left:8px;display:flex;gap:6px}
.car-status-badge{padding:.25rem .75rem;border-radius:20px;font-size:.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:.03em}
.car-status-badge.available{background:rgba(34,197,94,.15);color:#22c55e}
.car-status-badge.sold{background:rgba(239,68,68,.15);color:#ef4444}
.car-status-badge.reserved{background:rgba(245,158,11,.15);color:#f59e0b}
.car-feat{background:rgba(225,6,19,.15);color:#e10613;padding:.25rem;border-radius:6px;display:flex}
.car-info{padding:1rem}
.car-info h3{font-family:'Outfit',sans-serif;font-size:1.0625rem;font-weight:600;margin:0 0 .25rem}
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
.car-edit-modal{max-width:640px}
.car-edit-form{display:grid;grid-template-columns:1fr 1fr;gap:1rem;padding:1.5rem}
.car-edit-form textarea{width:100%;padding:.75rem 1rem;background:var(--db-sf2);border:1px solid var(--db-bd);border-radius:10px;color:var(--db-tx);font-size:.875rem;font-family:inherit;outline:0;resize:vertical}
.car-edit-form select{width:100%;padding:.75rem 1rem;background:var(--db-sf2);border:1px solid var(--db-bd);border-radius:10px;color:var(--db-tx);font-size:.875rem;font-family:inherit;outline:0}
@media(max-width:640px){.car-grid{grid-template-columns:1fr}.car-edit-form{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
