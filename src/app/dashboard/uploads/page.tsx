'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Upload, Image, Calendar, Clock, User, Search } from 'lucide-react';
import { formatDateTime, timeAgo } from '@/lib/utils';

interface UploadRecord {
  id: string;
  brand: string;
  model: string;
  variant: string;
  created_at: string;
  updated_at: string;
  sold_at: string | null;
  status: string;
  thumbnail: string;
  employee: { name: string; employee_id: string } | null;
  image_count: number;
}

export default function UploadsPage() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const { data: cars } = await supabase
        .from('cars')
        .select('id, brand, model, variant, created_at, updated_at, sold_at, status, thumbnail, employee:employees!employee_id(name, employee_id)')
        .order('created_at', { ascending: false });

      if (cars) {
        const enriched = await Promise.all(cars.map(async (car) => {
          const { count } = await supabase.from('car_images').select('id', { count: 'exact', head: true }).eq('car_id', car.id);
          return { ...car, image_count: count || 0, employee: car.employee as unknown as { name: string; employee_id: string } | null };
        }));
        setUploads(enriched);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = uploads.filter(u =>
    u.brand.toLowerCase().includes(search.toLowerCase()) ||
    u.model.toLowerCase().includes(search.toLowerCase()) ||
    (u.employee?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const daysAgo = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    return diff === 0 ? 'Today' : diff === 1 ? '1 day ago' : `${diff} days ago`;
  };

  return (
    <div className="db-page">
      <div className="db-page-header">
        <div><h1 className="db-page-title">Upload Tracking</h1><p className="db-page-sub">Track every upload with details</p></div>
      </div>

      <div className="car-filters" style={{ marginBottom: '1.5rem' }}>
        <div className="db-search-inline"><Search size={16} /><input placeholder="Search by brand, model, employee..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      <div className="up-list">
        {loading ? Array(5).fill(0).map((_, i) => <div key={i} className="up-skel" />) :
        filtered.length === 0 ? <p className="db-empty-full">No upload records found</p> :
        filtered.map((u, i) => (
          <motion.div key={u.id} className="up-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <div className="up-thumb">
              {u.thumbnail ? <img src={u.thumbnail} alt="" /> : <div className="up-no-img"><Upload size={20} /></div>}
            </div>
            <div className="up-body">
              <div className="up-main">
                <h3>{u.brand} {u.model}</h3>
                <p className="up-variant">{u.variant}</p>
                <span className={`car-status-badge ${u.status}`}>{u.status}</span>
              </div>
              <div className="up-detail">
                <p className="up-log">
                  <User size={13} /> <strong>{u.employee?.name || 'Unknown'}</strong> uploaded <strong>{u.brand} {u.model}</strong> on {formatDateTime(u.created_at)} with <strong>{u.image_count} images</strong>.
                </p>
                <div className="up-meta-row">
                  <span><Calendar size={13} /> {daysAgo(u.created_at)}</span>
                  <span><Clock size={13} /> {timeAgo(u.created_at)}</span>
                  <span><Image size={13} /> {u.image_count} images</span>
                  {u.sold_at && <span>Sold: {formatDateTime(u.sold_at)}</span>}
                  {u.updated_at !== u.created_at && <span>Updated: {formatDateTime(u.updated_at)}</span>}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <style jsx>{`
.up-list{display:flex;flex-direction:column;gap:.75rem}
.up-card{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:14px;display:flex;overflow:hidden;transition:all .2s}
.up-card:hover{border-color:var(--db-gold);box-shadow:0 4px 20px var(--db-gg)}
.up-thumb{width:120px;min-height:100px;background:var(--db-sf2);flex-shrink:0;overflow:hidden}
.up-thumb img{width:100%;height:100%;object-fit:cover}
.up-no-img{display:flex;align-items:center;justify-content:center;height:100%;color:var(--db-tx3)}
.up-body{flex:1;padding:1rem 1.25rem;display:flex;flex-direction:column;gap:.5rem}
.up-main{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}
.up-main h3{font-family:'Outfit',sans-serif;font-size:1rem;font-weight:600;margin:0}
.up-variant{color:var(--db-tx2);font-size:.8125rem;margin:0}
.up-log{font-size:.8125rem;color:var(--db-tx2);line-height:1.6;margin:0}
.up-log strong{color:var(--db-tx);font-weight:600}
.up-meta-row{display:flex;flex-wrap:wrap;gap:.75rem;font-size:.75rem;color:var(--db-tx3)}
.up-meta-row span{display:flex;align-items:center;gap:4px}
.up-skel{height:100px;background:var(--db-sf);border:1px solid var(--db-bd);border-radius:14px;animation:pulse 1.5s infinite}
@media(max-width:640px){.up-card{flex-direction:column}.up-thumb{width:100%;height:140px}}
      `}</style>
    </div>
  );
}
