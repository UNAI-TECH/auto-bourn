'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useEmpContext } from '../layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, FileSpreadsheet, Check, AlertCircle, Loader2, Trash2, X } from 'lucide-react';

const CSV_HEADERS = [
  'brand','model','variant','year','fuel_type','transmission','km_driven',
  'ownership','price','original_price','body_type','color','interior_color',
  'engine','horsepower','description','features','insurance_validity',
  'registration_number','location'
];

const REQUIRED = ['brand','model','year','price'];

interface CarRow {
  [key: string]: string | number | null;
}

interface ParsedRow {
  data: CarRow;
  errors: string[];
  index: number;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let inQuotes = false;
  let row: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(current.trim()); current = ''; }
      else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        row.push(current.trim()); current = '';
        if (row.some(c => c !== '')) rows.push(row);
        row = [];
        if (ch === '\r') i++;
      } else { current += ch; }
    }
  }
  row.push(current.trim());
  if (row.some(c => c !== '')) rows.push(row);
  return rows;
}

function validateRow(data: CarRow, idx: number): ParsedRow {
  const errors: string[] = [];
  REQUIRED.forEach(f => {
    if (!data[f] || String(data[f]).trim() === '') errors.push(`${f} is required`);
  });
  const year = Number(data.year);
  if (data.year && (isNaN(year) || year < 1990 || year > new Date().getFullYear() + 1))
    errors.push('Invalid year');
  const price = Number(data.price);
  if (data.price && (isNaN(price) || price <= 0)) errors.push('Invalid price');
  return { data, errors, index: idx };
}

function downloadTemplate() {
  const sample = [
    CSV_HEADERS.join(','),
    'Mercedes-Benz,GLE 300d,4MATIC AMG,2024,Diesel,Automatic,12000,1st Owner,5800000,8900000,SUV,Black,Beige,2.0L Turbo,245,Luxury SUV,"Sunroof,Camera,Leather",2025-12,KA-01-AB-1234,Bangalore',
    'BMW,X5,xDrive30d M Sport,2023,Diesel,Automatic,18000,1st Owner,6200000,9500000,SUV,White,Cognac,3.0L Turbo,286,Premium SUV,"HUD,Harman Kardon",2025-06,MH-01-CD-5678,Mumbai',
  ].join('\n');
  const blob = new Blob([sample], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'bulk_upload_template.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function BulkUploadPage() {
  const { employee } = useEmpContext();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 5000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResults(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rawRows = parseCSV(text);
      if (rawRows.length < 2) { showToast('CSV must have a header row and at least one data row', 'error'); return; }
      const headers = rawRows[0].map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));
      const parsed: ParsedRow[] = [];
      for (let i = 1; i < rawRows.length; i++) {
        const obj: CarRow = {};
        headers.forEach((h, j) => { obj[h] = rawRows[i][j] || ''; });
        parsed.push(validateRow(obj, i));
      }
      setRows(parsed);
      const errCount = parsed.filter(r => r.errors.length > 0).length;
      if (errCount > 0) showToast(`${errCount} row(s) have validation errors`, 'error');
      else showToast(`${parsed.length} car(s) parsed successfully`);
    };
    reader.readAsText(file);
  };

  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));

  const handleBulkSubmit = async () => {
    if (!employee) return;
    const valid = rows.filter(r => r.errors.length === 0);
    if (valid.length === 0) { showToast('No valid rows to upload', 'error'); return; }

    setUploading(true);
    setProgress({ done: 0, total: valid.length });
    let success = 0, failed = 0;
    let hasConstraintError = false;

    for (let i = 0; i < valid.length; i++) {
      try {
        const d = valid[i].data;
        const yr = Number(d.year) || new Date().getFullYear();
        const featStr = String(d.features || '');
        const features = featStr.split(',').map(f => f.trim()).filter(Boolean);

        const { error } = await supabase.from('cars').insert({
          employee_id: employee.id,
          brand: d.brand, model: d.model, variant: d.variant || null, year: yr,
          fuel_type: d.fuel_type || null, transmission: d.transmission || null,
          km_driven: Number(d.km_driven) || 0, ownership: d.ownership || null,
          price: Number(d.price), original_price: Number(d.original_price) || null,
          description: d.description || null, features: features.length ? features : null,
          insurance_validity: d.insurance_validity || null,
          registration_number: d.registration_number || null,
          location: d.location || null, body_type: d.body_type || null,
          color: d.color || null, interior_color: d.interior_color || null,
          engine: d.engine || null, horsepower: Number(d.horsepower) || null,
          thumbnail: '', status: 'pending',
        });
        if (error) throw error;
        success++;
      } catch (err: any) {
        console.error('Bulk upload row error:', err);
        failed++;
        if (err?.message?.includes('violates check constraint "cars_status_check"')) {
          hasConstraintError = true;
        }
      }
      setProgress({ done: i + 1, total: valid.length });
    }

    if (success > 0) {
      // Notify Admin
      await supabase.from('notifications').insert({
        recipient_role: 'admin',
        type: 'car_upload_request',
        title: '🚗 Bulk Car Upload Request',
        message: `Employee "${employee.name}" has requested approval to upload ${success} cars.`,
        metadata: { count: success }
      });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      employee_id: employee.id, action: 'bulk_upload',
      details: `Bulk uploaded ${success} cars (pending approval, ${failed} failed)`,
    });

    setResults({ success, failed });
    setUploading(false);
    if (success > 0) showToast(`${success} car(s) submitted for admin approval!`);
    if (failed > 0) {
      if (hasConstraintError) {
        showToast('Upload failed: The database constraint needs to be updated. Please run "cars-approval-migration.sql" in your Supabase SQL Editor.', 'error');
      } else {
        showToast(`${failed} car(s) failed to upload`, 'error');
      }
    }
  };

  const validCount = rows.filter(r => r.errors.length === 0).length;
  const errorCount = rows.filter(r => r.errors.length > 0).length;

  return (
    <div className="db-page">
      <div className="db-page-header">
        <div className="db-page-title-container">
          <h1 className="db-page-title">Bulk Upload Cars</h1>
          <p className="db-page-sub">Upload multiple vehicles at once using a CSV file</p>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Step 1 */}
        <motion.div whileHover={{ y: -2 }} style={{ background: 'var(--emp-sf)', border: '1.5px solid var(--emp-bd)', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer' }} onClick={downloadTemplate}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(225,6,19,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Download size={20} color="#E10613" />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#E10613', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step 1</span>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--emp-tx)', margin: '0 0 0.35rem' }}>Download Template</h3>
          <p style={{ fontSize: '0.8rem', color: '#8A8A8A', margin: 0, lineHeight: 1.5 }}>Get the CSV template with sample data and all required columns</p>
        </motion.div>

        {/* Step 2 */}
        <motion.div whileHover={{ y: -2 }} style={{ background: 'var(--emp-sf)', border: '1.5px solid var(--emp-bd)', borderRadius: '16px', padding: '1.5rem', cursor: 'pointer' }} onClick={() => fileRef.current?.click()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(225,6,19,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={20} color="#E10613" />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#E10613', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step 2</span>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--emp-tx)', margin: '0 0 0.35rem' }}>Upload CSV File</h3>
          <p style={{ fontSize: '0.8rem', color: '#8A8A8A', margin: 0, lineHeight: 1.5 }}>Fill in car details in the template and upload the file here</p>
        </motion.div>

        {/* Step 3 */}
        <motion.div whileHover={{ y: -2 }} style={{ background: 'var(--emp-sf)', border: '1.5px solid var(--emp-bd)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(225,6,19,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={20} color="#E10613" />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#E10613', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Step 3</span>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--emp-tx)', margin: '0 0 0.35rem' }}>Review & Submit</h3>
          <p style={{ fontSize: '0.8rem', color: '#8A8A8A', margin: 0, lineHeight: 1.5 }}>Preview parsed data, fix errors, then submit all cars at once</p>
        </motion.div>
      </div>

      <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />

      {/* File info bar */}
      {fileName && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--emp-sf)', border: '1.5px solid var(--emp-bd)', borderRadius: '14px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileSpreadsheet size={20} color="#E10613" />
            <span style={{ fontWeight: 600, color: 'var(--emp-tx)', fontSize: '0.9rem' }}>{fileName}</span>
            <span style={{ fontSize: '0.8rem', color: '#8A8A8A' }}>• {rows.length} row(s)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {validCount > 0 && <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14} /> {validCount} valid</span>}
            {errorCount > 0 && <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#E10613', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {errorCount} errors</span>}
            <button onClick={() => { setRows([]); setFileName(''); setResults(null); if (fileRef.current) fileRef.current.value = ''; }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8A8A', padding: '4px' }}><X size={18} /></button>
          </div>
        </motion.div>
      )}

      {/* Preview Table */}
      {rows.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--emp-sf)', border: '1.5px solid var(--emp-bd)', borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'var(--emp-sf2)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--emp-tx)', whiteSpace: 'nowrap', borderBottom: '1.5px solid var(--emp-bd)' }}>#</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 700, color: 'var(--emp-tx)', whiteSpace: 'nowrap', borderBottom: '1.5px solid var(--emp-bd)' }}>Status</th>
                  {['Brand','Model','Variant','Year','Fuel','Trans.','KM','Ownership','Price','Body','Color','Location'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--emp-tx)', whiteSpace: 'nowrap', borderBottom: '1.5px solid var(--emp-bd)' }}>{h}</th>
                  ))}
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', borderBottom: '1.5px solid var(--emp-bd)' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--emp-bd)', background: row.errors.length > 0 ? 'rgba(225,6,19,0.03)' : 'transparent' }}>
                    <td style={{ padding: '0.65rem 1rem', color: '#8A8A8A', fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      {row.errors.length > 0
                        ? <span title={row.errors.join(', ')} style={{ color: '#E10613', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'help' }}><AlertCircle size={14} /> Error</span>
                        : <span style={{ color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14} /> Valid</span>
                      }
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: 'var(--emp-tx)', whiteSpace: 'nowrap' }}>{String(row.data.brand || '-')}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--emp-tx)', whiteSpace: 'nowrap' }}>{String(row.data.model || '-')}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#8A8A8A', whiteSpace: 'nowrap' }}>{String(row.data.variant || '-')}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: 'var(--emp-tx)' }}>{String(row.data.year || '-')}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#8A8A8A' }}>{String(row.data.fuel_type || '-')}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#8A8A8A' }}>{String(row.data.transmission || '-')}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#8A8A8A' }}>{String(row.data.km_driven || '-')}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#8A8A8A' }}>{String(row.data.ownership || '-')}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: 'var(--emp-tx)', whiteSpace: 'nowrap' }}>₹{Number(row.data.price || 0).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#8A8A8A' }}>{String(row.data.body_type || '-')}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#8A8A8A' }}>{String(row.data.color || '-')}</td>
                    <td style={{ padding: '0.65rem 0.75rem', color: '#8A8A8A' }}>{String(row.data.location || '-')}</td>
                    <td style={{ padding: '0.65rem 1rem', textAlign: 'center' }}>
                      <button onClick={() => removeRow(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8A8A', padding: '4px' }}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Upload progress */}
      {uploading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'var(--emp-sf)', border: '1.5px solid var(--emp-bd)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Loader2 size={18} color="#E10613" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontWeight: 600, color: 'var(--emp-tx)', fontSize: '0.9rem' }}>Uploading {progress.done} of {progress.total} cars...</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--emp-sf2)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`, height: '100%', background: '#E10613', borderRadius: '3px', transition: 'width 0.3s ease' }} />
          </div>
        </motion.div>
      )}

      {/* Results */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--emp-sf)', border: '1.5px solid var(--emp-bd)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={20} color="#16a34a" />
            <span style={{ fontWeight: 700, color: '#16a34a', fontSize: '0.95rem' }}>{results.success} Uploaded</span>
          </div>
          {results.failed > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} color="#E10613" />
              <span style={{ fontWeight: 700, color: '#E10613', fontSize: '0.95rem' }}>{results.failed} Failed</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Submit button */}
      {rows.length > 0 && !uploading && !results && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button onClick={() => { setRows([]); setFileName(''); if (fileRef.current) fileRef.current.value = ''; }} style={{ padding: '0.85rem 2rem', borderRadius: '12px', border: '1.5px solid var(--emp-bd)', background: 'var(--emp-sf)', color: 'var(--emp-tx)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleBulkSubmit} disabled={validCount === 0} style={{ padding: '0.85rem 2.5rem', borderRadius: '12px', border: 'none', background: validCount > 0 ? '#E10613' : '#ccc', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: validCount > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={16} /> Upload {validCount} Car{validCount !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} style={{ position: 'fixed', bottom: '2rem', right: '2rem', background: toast.type === 'success' ? '#16a34a' : '#E10613', color: '#fff', padding: '0.85rem 1.5rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
