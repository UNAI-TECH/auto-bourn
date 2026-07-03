'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Key, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  isPassword?: boolean;
}

export default function PromptModal({
  isOpen,
  title,
  message,
  placeholder = '',
  confirmLabel = 'Submit',
  cancelLabel = 'Cancel',
  defaultValue = '',
  onConfirm,
  onCancel,
  isPassword = false
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setShowPassword(false);
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(value);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="prompt-modal-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            zIndex: 8500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backdropFilter: 'blur(4px)'
          }}
        >
          <motion.div
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
                <Key size={18} style={{ color: 'var(--db-gold, #e10613)' }} />
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
                aria-label="Close"
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
            
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  color: 'var(--db-tx2, rgba(42, 42, 42, 0.7))',
                  lineHeight: 1.5
                }}>{message}</p>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={isPassword && !showPassword ? 'password' : 'text'}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder={placeholder}
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      paddingRight: isPassword ? '2.5rem' : '1rem',
                      border: '1px solid var(--db-bd, rgba(0, 0, 0, 0.08))',
                      background: 'var(--db-sf2, #f5f5f5)',
                      borderRadius: '8px',
                      color: 'var(--db-tx, #2a2a2a)',
                      fontSize: '0.9375rem',
                      outline: 'none'
                    }}
                  />
                  {isPassword && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--db-tx3, rgba(0, 0, 0, 0.4))',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex'
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        width: '1px',
                        height: '1px',
                        padding: 0,
                        margin: '-1px',
                        overflow: 'hidden',
                        clip: 'rect(0, 0, 0, 0)',
                        whiteSpace: 'nowrap',
                        border: 0
                      }}>
                        {showPassword ? 'Hide password' : 'Show password'}
                      </span>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
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
                  type="button"
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
                  type="submit"
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--db-gold, #e10613)',
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
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
