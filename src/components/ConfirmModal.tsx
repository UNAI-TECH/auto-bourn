'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = false
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="confirm-modal-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}
        >
          <motion.div
            className="confirm-modal-content"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--db-sf, #ffffff)',
              border: '1px solid var(--db-bd, rgba(0, 0, 0, 0.08))',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '400px',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--db-bd, rgba(0, 0, 0, 0.08))'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isDanger && <AlertTriangle size={18} style={{ color: 'var(--db-rd, #ef4444)' }} />}
                <h3 style={{
                  margin: 0,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: 'var(--db-tx, #2a2a2a)',
                  fontFamily: "'Outfit', sans-serif"
                }}>{title}</h3>
              </div>
              <button
                onClick={onCancel}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--db-tx3, rgba(0, 0, 0, 0.4))',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                  display: 'flex'
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <p style={{
                margin: 0,
                fontSize: '0.875rem',
                color: 'var(--db-tx2, rgba(42, 42, 42, 0.7))',
                lineHeight: 1.5
              }}>{message}</p>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              padding: '1.25rem 1.5rem',
              borderTop: '1px solid var(--db-bd, rgba(0, 0, 0, 0.08))',
              background: 'var(--db-sf2, #f5f5f5)',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={onCancel}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  border: '1px solid var(--db-bd, rgba(0, 0, 0, 0.08))',
                  background: 'var(--db-sf, #ffffff)',
                  color: 'var(--db-tx2, rgba(42, 42, 42, 0.7))',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: isDanger ? 'var(--db-rd, #ef4444)' : 'var(--db-gold, #e10613)',
                  color: '#ffffff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(225, 6, 19, 0.15)'
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
