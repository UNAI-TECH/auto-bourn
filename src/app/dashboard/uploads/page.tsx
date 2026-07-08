'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, Calendar, Clock, User, Search, ArrowUpRight, Check, X } from 'lucide-react';
import { formatDateTime, timeAgo, getProxiedImageUrl } from '@/lib/utils';

interface UploadRecord {
  id: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  created_at: string;
  updated_at: string;
  sold_at: string | null;
  status: string;
  thumbnail: string;
  employee_id: string | null;
  employee: { name: string; employee_id: string } | null;
  image_count: number;
}

export default function UploadsPage() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<UploadRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const supabase = createClient();

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUploads = async () => {
    setLoading(true);
    try {
      const { data: cars, error } = await supabase
        .from('cars')
        .select('id, brand, model, variant, year, created_at, updated_at, sold_at, status, thumbnail, employee_id, employee:employees!employee_id(name, employee_id)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (cars) {
        const enriched = await Promise.all(cars.map(async (car) => {
          const { count } = await supabase
            .from('car_images')
            .select('id', { count: 'exact', head: true })
            .eq('car_id', car.id);
          return {
            ...car,
            image_count: count || 0,
            employee: car.employee as unknown as { name: string; employee_id: string } | null
          };
        }));
        setUploads(enriched);
      }
    } catch (err: any) {
      console.error('Error fetching uploads:', err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();
  }, [supabase]);

  const approveCar = async (car: UploadRecord) => {
    try {
      const { error } = await supabase
        .from('cars')
        .update({ status: 'available', rejection_reason: null })
        .eq('id', car.id);

      if (error) throw error;

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

      showToast('Car approved and published successfully');
      fetchUploads();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget) return;
    if (!rejectionReason.trim()) {
      showToast('Rejection reason is required', 'error');
      return;
    }

    try {
      // 1. Delete from Supabase
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', rejectTarget.id);

      if (error) throw error;

      // 2. Notify employee
      if (rejectTarget.employee_id) {
        await supabase.from('notifications').insert({
          recipient_employee_id: rejectTarget.employee_id,
          recipient_role: 'employee',
          type: 'car_rejected',
          title: '❌ Car Upload Rejected',
          message: `your uploard was rejected by admin. Vehicle: ${rejectTarget.brand} ${rejectTarget.model} (${rejectTarget.year}). Reason: ${rejectionReason}`,
          metadata: { brand: rejectTarget.brand, model: rejectTarget.model, year: rejectTarget.year, rejection_reason: rejectionReason }
        });
      }

      showToast('Car listing rejected and deleted successfully');
      setRejectTarget(null);
      setRejectionReason('');
      fetchUploads();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

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
              <div className="up-card">
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
                      <h3 style={{ margin: 0 }}>
                        <Link href={`/vehicle/${u.id}`} className="up-title-link">
                          {u.brand} {u.model}
                        </Link>
                      </h3>
                      <p className="up-variant">{u.variant} · {u.year}</p>
                    </div>
                    <div className="up-badge-container" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`up-status-badge ${u.status}`}>{u.status}</span>
                      <Link href={`/vehicle/${u.id}`} className="up-redirect-arrow">
                        <ArrowUpRight size={18} />
                      </Link>
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

                    {u.status === 'pending' && (
                      <div className="up-action-buttons">
                        <button onClick={() => approveCar(u)} className="btn-approve">
                          <Check size={14} style={{ marginRight: '4px' }} /> Accept Listing
                        </button>
                        <button onClick={() => setRejectTarget(u)} className="btn-reject">
                          <X size={14} style={{ marginRight: '4px' }} /> Reject Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <div className="modal-backdrop" onClick={() => setRejectTarget(null)}>
            <motion.div 
              className="reject-modal" 
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3>Reject Car Upload Request</h3>
              <p>Please enter the reason for rejecting <strong>{rejectTarget.brand} {rejectTarget.model}</strong>:</p>
              <textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason here..."
                rows={4}
              />
              <div className="reject-modal-actions">
                <button className="btn-modal-cancel" onClick={() => setRejectTarget(null)}>Cancel</button>
                <button className="btn-modal-confirm" onClick={handleRejectConfirm}>Reject & Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            className={`db-toast ${toast.type}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

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
          align-items: stretch;
          min-height: 160px;
          overflow: hidden;
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
          min-height: 160px;
          background: var(--db-sf2, #18181c);
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .up-thumb img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .up-card:hover .up-thumb img {
          transform: scale(1.05);
        }
        .up-no-img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
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
        .up-title-link {
          text-decoration: none;
          color: var(--db-tx, #f4f4f5);
          font-family: 'Outfit', sans-serif;
          font-size: 1.2rem;
          font-weight: 600;
          transition: color 0.2s;
        }
        .up-title-link:hover {
          color: var(--db-gold, #c5a880);
        }
        .up-variant {
          color: var(--db-tx2, #a1a1aa);
          font-size: 0.875rem;
          margin: 4px 0 0 0;
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
        .up-status-badge.pending {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .up-status-badge.rejected {
          background: rgba(107, 114, 128, 0.15);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.1);
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
        .up-action-buttons {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.75rem;
          border-top: 1px solid var(--db-bd);
          padding-top: 0.75rem;
        }
        .btn-approve {
          background: #10b981;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.8125rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: background 0.2s;
        }
        .btn-approve:hover {
          background: #0d9668;
        }
        .btn-reject {
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.8125rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: background 0.2s;
        }
        .btn-reject:hover {
          background: #dc2626;
        }
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }
        .reject-modal {
          background: var(--db-sf, #121214);
          border: 1px solid var(--db-bd);
          border-radius: 16px;
          padding: 1.5rem;
          width: 90%;
          max-width: 450px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .reject-modal h3 {
          font-family: 'Outfit', sans-serif;
          margin: 0;
          color: var(--db-tx);
          font-size: 1.25rem;
          font-weight: 700;
        }
        .reject-modal p {
          font-size: 0.875rem;
          color: var(--db-tx2);
          margin: 0;
        }
        .reject-modal textarea {
          width: 100%;
          background: var(--db-sf2);
          border: 1px solid var(--db-bd);
          border-radius: 8px;
          padding: 0.75rem;
          color: var(--db-tx);
          font-family: inherit;
          resize: none;
        }
        .reject-modal textarea:focus {
          border-color: var(--db-gold);
          outline: none;
        }
        .reject-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        .btn-modal-cancel {
          background: transparent;
          border: 1px solid var(--db-bd);
          color: var(--db-tx2);
          padding: 0.5rem 1.125rem;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-modal-cancel:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .btn-modal-confirm {
          background: #ef4444;
          border: none;
          color: white;
          padding: 0.5rem 1.125rem;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-modal-confirm:hover {
          background: #dc2626;
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
