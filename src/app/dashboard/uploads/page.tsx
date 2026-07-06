'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Upload, Image as ImageIcon, Calendar, Clock, User, Search, ArrowUpRight } from 'lucide-react';
import { formatDateTime, timeAgo, getProxiedImageUrl } from '@/lib/utils';

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
  }, [supabase]);

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
        <div>
          <h1 className="db-page-title">Upload Tracking</h1>
          <p className="db-page-sub">Track and audit vehicle listings submitted by employees</p>
        </div>
      </div>

      <div className="car-filters" style={{ marginBottom: '1.5rem' }}>
        <div className="db-search-inline">
          <Search size={16} />
          <input 
            placeholder="Search by brand, model, employee..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="up-list">
        {loading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="up-skel" />)
        ) : filtered.length === 0 ? (
          <p className="db-empty-full">No upload records found</p>
        ) : (
          filtered.map((u, i) => (
            <motion.div 
              key={u.id} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.03 }}
            >
              <Link href={`/vehicle/${u.id}`} className="up-card">
                <div className="up-thumb">
                  {u.thumbnail ? (
                    <img src={getProxiedImageUrl(u.thumbnail)} alt={`${u.brand} ${u.model}`} />
                  ) : (
                    <div className="up-no-img">
                      <Upload size={24} />
                    </div>
                  )}
                </div>
                <div className="up-body">
                  <div className="up-main-header">
                    <div className="up-title-block">
                      <h3>{u.brand} {u.model}</h3>
                      <p className="up-variant">{u.variant}</p>
                    </div>
                    <div className="up-badge-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`up-status-badge ${u.status}`}>{u.status}</span>
                      <div className="up-redirect-arrow">
                        <ArrowUpRight size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="up-details-middle">
                    <div className="up-user-info">
                      <User size={14} />
                      <span>
                        Uploaded by <strong>{u.employee?.name || 'Unknown'}</strong> ({u.employee?.employee_id || 'N/A'})
                      </span>
                    </div>

                    <div className="up-meta-grid">
                      <div className="up-meta-item">
                        <Calendar size={13} />
                        <span>{daysAgo(u.created_at)}</span>
                      </div>
                      <div className="up-meta-item">
                        <Clock size={13} />
                        <span>{timeAgo(u.created_at)}</span>
                      </div>
                      <div className="up-meta-item">
                        <ImageIcon size={13} />
                        <span>{u.image_count} images</span>
                      </div>
                      {u.sold_at && (
                        <div className="up-meta-item" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.02)' }}>
                          <span style={{ color: '#ef4444' }}>Sold: {formatDateTime(u.sold_at)}</span>
                        </div>
                      )}
                      {u.updated_at !== u.created_at && (
                        <div className="up-meta-item">
                          <span>Updated: {formatDateTime(u.updated_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>

      <style jsx global>{`
        .up-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .db-page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--db-bd, rgba(255, 255, 255, 0.08));
        }
        .db-page-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--db-tx, #f4f4f5);
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
        }
        .db-page-sub {
          font-size: 0.875rem;
          color: var(--db-tx3, #71717a);
          margin: 0;
          line-height: 1.5;
        }
        .up-card {
          background: var(--db-sf, #121214);
          border: 1px solid var(--db-bd, rgba(255, 255, 255, 0.08));
          border-radius: 16px;
          display: flex;
          overflow: hidden;
          text-decoration: none;
          color: inherit;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }
        .up-card:hover {
          border-color: var(--db-gold, #c5a880);
          background: rgba(255, 255, 255, 0.02);
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(197, 168, 128, 0.08);
        }
        .up-thumb {
          width: 240px;
          min-height: 150px;
          background: var(--db-sf2, #18181c);
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .up-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .up-card:hover .up-thumb img {
          transform: scale(1.05);
        }
        .up-no-img {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--db-tx3, #71717a);
          background: var(--db-sf2);
        }
        .up-body {
          flex: 1;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 0.75rem;
        }
        .up-main-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }
        .up-title-block h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.2rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
          color: var(--db-tx, #f4f4f5);
          transition: color 0.2s;
        }
        .up-card:hover .up-title-block h3 {
          color: var(--db-gold, #c5a880);
        }
        .up-variant {
          color: var(--db-tx2, #a1a1aa);
          font-size: 0.875rem;
          margin: 0;
        }
        .up-status-badge {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          text-transform: capitalize;
          letter-spacing: 0.05em;
        }
        .up-status-badge.available {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .up-status-badge.reserved {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .up-status-badge.sold {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .up-redirect-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: var(--db-tx3);
          transition: all 0.3s;
        }
        .up-card:hover .up-redirect-arrow {
          background: var(--db-gold, #c5a880);
          color: #121214;
          border-color: var(--db-gold);
          transform: translate(2px, -2px);
        }
        .up-details-middle {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .up-user-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--db-tx2, #a1a1aa);
        }
        .up-user-info strong {
          color: var(--db-tx, #f4f4f5);
        }
        .up-meta-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 0.25rem;
        }
        .up-meta-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          color: var(--db-tx3, #71717a);
          background: rgba(255, 255, 255, 0.02);
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .up-skel {
          height: 160px;
          background: var(--db-sf, #121214);
          border: 1px solid var(--db-bd, rgba(255, 255, 255, 0.08));
          border-radius: 16px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 768px) {
          .up-card {
            flex-direction: column;
          }
          .up-thumb {
            width: 100%;
            height: auto;
            aspect-ratio: 16 / 9;
          }
          .up-thumb img {
            object-fit: contain;
            background: #000000;
          }
          .up-body {
            padding: 1.25rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
