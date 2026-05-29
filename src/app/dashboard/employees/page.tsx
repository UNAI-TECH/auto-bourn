'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, MoreVertical, X, Shield, Ban, RotateCcw, Trash2, Key, Check, AlertCircle, Copy, CheckCheck } from 'lucide-react';
import { formatDate, timeAgo, generateEmployeeId } from '@/lib/utils';
import type { Employee } from '@/types/database';

interface CredentialsModal {
  name: string;
  employee_id: string;
  email: string;
  password: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<(Employee & { total_uploads?: number; total_sold?: number; last_upload?: string | null })[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', employee_id: generateEmployeeId() });
  const [submitting, setSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<CredentialsModal | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => { fetchEmployees(); }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase.from('employees').select('*').eq('role', 'employee').order('created_at', { ascending: false });
    if (data) {
      const enriched = await Promise.all(data.map(async (emp) => {
        const { count: uploads } = await supabase.from('cars').select('id', { count: 'exact', head: true }).eq('employee_id', emp.id);
        const { count: sold } = await supabase.from('cars').select('id', { count: 'exact', head: true }).eq('employee_id', emp.id).eq('status', 'sold');
        const { data: last } = await supabase.from('cars').select('created_at').eq('employee_id', emp.id).order('created_at', { ascending: false }).limit(1);
        return { ...emp, total_uploads: uploads || 0, total_sold: sold || 0, last_upload: last?.[0]?.created_at || null };
      }));
      setEmployees(enriched);
    }
    setLoading(false);
  };

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Show credentials modal so admin can note & share with employee
      setCredentials({
        name: form.name,
        employee_id: form.employee_id,
        email: form.email,
        password: form.password,
      });
      setShowAdd(false);
      setForm({ name: '', email: '', phone: '', password: '', employee_id: generateEmployeeId() });
      fetchEmployees();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to add employee', 'error');
    }
    setSubmitting(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('employees').update({ status }).eq('id', id);
    showToast(`Employee ${status === 'active' ? 'activated' : status}`);
    setMenuOpen(null);
    fetchEmployees();
  };

  const resetPassword = async (emp: Employee) => {
    const { error } = await supabase.auth.resetPasswordForEmail(emp.email);
    if (error) showToast(error.message, 'error');
    else showToast('Password reset email sent');
    setMenuOpen(null);
  };

  const removeEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to remove this employee?')) return;
    await supabase.from('employees').delete().eq('id', id);
    showToast('Employee removed');
    setMenuOpen(null);
    fetchEmployees();
  };

  const filtered = employees.filter(emp => {
    const matchSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || emp.employee_id.toLowerCase().includes(search.toLowerCase()) || emp.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || emp.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="db-page">
      <div className="db-page-header">
        <div><h1 className="db-page-title">Employee Management</h1><p className="db-page-sub">{employees.length} employees registered</p></div>
        <button className="db-btn-gold" onClick={() => setShowAdd(true)}><UserPlus size={18} />Add Employee</button>
      </div>

      {/* Filters */}
      <div className="emp-filters">
        <div className="db-search-inline"><Search size={16} /><input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="emp-tabs">
          {['all', 'active', 'inactive', 'suspended'].map(f => (
            <button key={f} className={`emp-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="emp-table-wrap">
        <table className="emp-table">
          <thead><tr><th>Employee</th><th>ID</th><th>Phone</th><th>Joined</th><th>Uploads</th><th>Sold</th><th>Last Upload</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {loading ? Array(5).fill(0).map((_, i) => (
              <tr key={i}><td colSpan={9}><div className="emp-skel" /></td></tr>
            )) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="emp-empty">No employees found</td></tr>
            ) : filtered.map(emp => (
              <tr key={emp.id}>
                <td>
                  <div className="emp-user">
                    <div className="emp-avatar">{emp.name.charAt(0)}</div>
                    <div><span className="emp-name">{emp.name}</span><span className="emp-email">{emp.email}</span></div>
                  </div>
                </td>
                <td><span className="emp-id-badge">{emp.employee_id}</span></td>
                <td>{emp.phone || '—'}</td>
                <td>{formatDate(emp.created_at)}</td>
                <td className="emp-num">{emp.total_uploads}</td>
                <td className="emp-num">{emp.total_sold}</td>
                <td>{emp.last_upload ? timeAgo(emp.last_upload) : '—'}</td>
                <td><span className={`emp-status ${emp.status}`}>{emp.status}</span></td>
                <td>
                  <div className="emp-menu-wrap">
                    <button className="emp-menu-btn" onClick={() => setMenuOpen(menuOpen === emp.id ? null : emp.id)}><MoreVertical size={16} /></button>
                    {menuOpen === emp.id && (
                      <div className="emp-dropdown">
                        {emp.status !== 'active' && <button onClick={() => updateStatus(emp.id, 'active')}><Check size={14} />Activate</button>}
                        {emp.status !== 'suspended' && <button onClick={() => updateStatus(emp.id, 'suspended')}><Ban size={14} />Suspend</button>}
                        {emp.status !== 'inactive' && <button onClick={() => updateStatus(emp.id, 'inactive')}><Shield size={14} />Deactivate</button>}
                        <button onClick={() => resetPassword(emp)}><Key size={14} />Reset Password</button>
                        <button className="emp-del" onClick={() => removeEmployee(emp.id)}><Trash2 size={14} />Remove</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div className="emp-modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)}>
            <motion.div className="emp-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="emp-modal-head"><h2>Add Employee</h2><button onClick={() => setShowAdd(false)}><X size={20} /></button></div>
              <form onSubmit={handleAdd} className="emp-form">
                <div className="emp-field"><label>Employee ID</label><input value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} required /><button type="button" className="emp-regen" onClick={() => setForm({ ...form, employee_id: generateEmployeeId() })}>
                  <RotateCcw size={14} /></button></div>
                <div className="emp-field"><label>Full Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Employee name" /></div>
                <div className="emp-field"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="employee@autobourn.com" /></div>
                <div className="emp-field"><label>Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXXXXXXX" /></div>
                <div className="emp-field"><label>Password</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Min 6 characters" minLength={6} /></div>
                <button type="submit" className="db-btn-gold emp-submit" disabled={submitting}>{submitting ? 'Adding...' : 'Add Employee'}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credentials Modal */}
      <AnimatePresence>
        {credentials && (
          <motion.div className="emp-modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="emp-modal cred-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
              <div className="emp-modal-head">
                <h2>✅ Employee Created</h2>
                <button onClick={() => setCredentials(null)}><X size={20} /></button>
              </div>
              <div className="cred-body">
                <p className="cred-intro">Share these login credentials with <strong>{credentials.name}</strong>. Save them now — the password won&apos;t be shown again.</p>
                <div className="cred-box">
                  <div className="cred-row">
                    <span className="cred-label">Employee ID</span>
                    <div className="cred-val-wrap">
                      <code className="cred-val">{credentials.employee_id}</code>
                      <button className="cred-copy" onClick={() => copyToClipboard(credentials.employee_id, 'id')} title="Copy">
                        {copied === 'id' ? <CheckCheck size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="cred-row">
                    <span className="cred-label">Email</span>
                    <div className="cred-val-wrap">
                      <code className="cred-val">{credentials.email}</code>
                      <button className="cred-copy" onClick={() => copyToClipboard(credentials.email, 'email')} title="Copy">
                        {copied === 'email' ? <CheckCheck size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="cred-row">
                    <span className="cred-label">Password</span>
                    <div className="cred-val-wrap">
                      <code className="cred-val">{credentials.password}</code>
                      <button className="cred-copy" onClick={() => copyToClipboard(credentials.password, 'pw')} title="Copy">
                        {copied === 'pw' ? <CheckCheck size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="cred-row">
                    <span className="cred-label">Login URL</span>
                    <div className="cred-val-wrap">
                      <code className="cred-val">{typeof window !== 'undefined' ? window.location.origin : ''}/console</code>
                      <button className="cred-copy" onClick={() => copyToClipboard(`${window.location.origin}/console`, 'url')} title="Copy">
                        {copied === 'url' ? <CheckCheck size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  className="db-btn-gold emp-submit"
                  onClick={() => {
                    const text = `Auto Bourn Employee Console\nLogin: ${window.location.origin}/console\nEmployee ID: ${credentials.employee_id}\nEmail: ${credentials.email}\nPassword: ${credentials.password}`;
                    copyToClipboard(text, 'all');
                  }}
                >
                  {copied === 'all' ? <><CheckCheck size={16} /> Copied!</> : <><Copy size={16} /> Copy All Credentials</>}
                </button>
                <button className="cred-close" onClick={() => setCredentials(null)}>Done</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className={`db-toast ${toast.type}`} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}>
            {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
.emp-filters{display:flex;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;align-items:center}
.db-search-inline{display:flex;align-items:center;gap:.5rem;background:var(--db-sf);border:1px solid var(--db-bd);border-radius:10px;padding:.5rem 1rem;flex:1;min-width:200px}
.db-search-inline svg{color:var(--db-tx3);flex-shrink:0}
.db-search-inline input{background:0;border:0;outline:0;color:var(--db-tx);font-size:.875rem;width:100%;font-family:inherit}
.db-search-inline input::placeholder{color:var(--db-tx3)}
.emp-tabs{display:flex;gap:4px;background:var(--db-sf);border:1px solid var(--db-bd);border-radius:10px;padding:4px}
.emp-tab{background:0;border:0;padding:.5rem 1rem;border-radius:8px;color:var(--db-tx2);font-size:.8125rem;cursor:pointer;transition:all .2s;font-family:inherit}
.emp-tab.active{background:var(--db-gd);color:var(--db-gold);font-weight:600}
.emp-table-wrap{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:14px;overflow-x:auto}
.emp-table{width:100%;border-collapse:collapse;font-size:.875rem}
.emp-table th{text-align:left;padding:.875rem 1rem;color:var(--db-tx3);font-weight:500;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--db-bd)}
.emp-table td{padding:.875rem 1rem;border-bottom:1px solid var(--db-bd);vertical-align:middle}
.emp-table tr:last-child td{border-bottom:0}
.emp-table tr:hover{background:var(--db-sf2)}
.emp-user{display:flex;align-items:center;gap:.75rem}
.emp-avatar{width:36px;height:36px;border-radius:10px;background:var(--db-gd);color:var(--db-gold);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.875rem;flex-shrink:0}
.emp-name{display:block;font-weight:600;color:var(--db-tx)}
.emp-email{display:block;font-size:.75rem;color:var(--db-tx3)}
.emp-id-badge{background:var(--db-gd);color:var(--db-gold);padding:.25rem .75rem;border-radius:6px;font-size:.75rem;font-weight:600;font-family:'Outfit',sans-serif}
.emp-num{font-weight:600;font-family:'Outfit',sans-serif}
.emp-status{padding:.25rem .75rem;border-radius:20px;font-size:.6875rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.emp-status.active{background:rgba(34,197,94,.1);color:#22c55e}
.emp-status.inactive{background:rgba(156,163,175,.1);color:#9ca3af}
.emp-status.suspended{background:rgba(239,68,68,.1);color:#ef4444}
.emp-menu-wrap{position:relative}
.emp-menu-btn{background:0;border:0;color:var(--db-tx3);cursor:pointer;padding:4px;border-radius:6px}
.emp-menu-btn:hover{background:var(--db-gd);color:var(--db-gold)}
.emp-dropdown{position:absolute;right:0;top:100%;background:var(--db-sf);border:1px solid var(--db-bd);border-radius:10px;padding:4px;z-index:20;min-width:160px;box-shadow:0 8px 30px rgba(0,0,0,.3)}
.emp-dropdown button{display:flex;align-items:center;gap:.5rem;width:100%;padding:.5rem .75rem;background:0;border:0;color:var(--db-tx2);font-size:.8125rem;cursor:pointer;border-radius:6px;font-family:inherit;transition:all .2s}
.emp-dropdown button:hover{background:var(--db-gd);color:var(--db-gold)}
.emp-del:hover{background:rgba(239,68,68,.1)!important;color:#ef4444!important}
.emp-skel{height:48px;background:var(--db-sf2);border-radius:8px;animation:pulse 1.5s infinite}
.emp-empty{text-align:center;color:var(--db-tx3);padding:3rem 0}
.db-btn-gold{display:flex;align-items:center;gap:.5rem;padding:.75rem 1.5rem;background:linear-gradient(135deg,#e10613,#c70511);border:0;border-radius:10px;color:#ffffff;font-weight:600;font-size:.875rem;cursor:pointer;transition:all .3s;font-family:inherit}
.db-btn-gold:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(225,6,19,.3)}
.db-btn-gold:disabled{opacity:.5;cursor:not-allowed;transform:none}
.emp-modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:100;display:flex;align-items:center;justify-content:center;padding:1rem}
.emp-modal{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:20px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto}
.emp-modal-head{display:flex;align-items:center;justify-content:space-between;padding:1.5rem;border-bottom:1px solid var(--db-bd)}
.emp-modal-head h2{font-family:'Outfit',sans-serif;font-size:1.25rem;font-weight:600;margin:0}
.emp-modal-head button{background:0;border:0;color:var(--db-tx2);cursor:pointer}
.emp-form{padding:1.5rem;display:flex;flex-direction:column;gap:1rem}
.emp-field{position:relative}
.emp-field label{display:block;font-size:.8125rem;font-weight:500;color:var(--db-tx2);margin-bottom:.5rem}
.emp-field input{width:100%;padding:.75rem 1rem;background:var(--db-sf2);border:1px solid var(--db-bd);border-radius:10px;color:var(--db-tx);font-size:.875rem;font-family:inherit;outline:0;transition:border-color .2s}
.emp-field input:focus{border-color:var(--db-gold)}
.emp-field input::placeholder{color:var(--db-tx3)}
.emp-regen{position:absolute;right:8px;top:50%;background:var(--db-gd);border:0;color:var(--db-gold);cursor:pointer;padding:6px;border-radius:6px;display:flex}
.emp-submit{width:100%;justify-content:center;padding:.875rem;margin-top:.5rem}
.db-toast{position:fixed;bottom:2rem;right:2rem;display:flex;align-items:center;gap:.5rem;padding:.875rem 1.5rem;border-radius:12px;font-size:.875rem;font-weight:500;z-index:200;box-shadow:0 8px 30px rgba(0,0,0,.3)}
.db-toast.success{background:#065f46;color:#6ee7b7;border:1px solid rgba(34,197,94,.3)}
.db-toast.error{background:#7f1d1d;color:#fca5a5;border:1px solid rgba(239,68,68,.3)}
.db-page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem}
.db-page-title{font-family:'Outfit',sans-serif;font-size:1.75rem;font-weight:700;margin:0}
.db-page-sub{color:var(--db-tx2);font-size:.875rem;margin-top:.25rem}
.cred-modal{max-width:460px}
.cred-body{padding:1.5rem;display:flex;flex-direction:column;gap:1rem}
.cred-intro{font-size:.875rem;color:var(--db-tx2);line-height:1.6}
.cred-box{background:var(--db-sf2);border:1px solid var(--db-bd);border-radius:12px;overflow:hidden}
.cred-row{display:flex;align-items:center;justify-content:space-between;padding:.875rem 1rem;border-bottom:1px solid var(--db-bd)}
.cred-row:last-child{border-bottom:0}
.cred-label{font-size:.75rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--db-tx3);flex-shrink:0;width:90px}
.cred-val-wrap{display:flex;align-items:center;gap:.5rem;min-width:0;flex:1;justify-content:flex-end}
.cred-val{font-family:'Outfit',monospace;font-size:.875rem;color:var(--db-gold);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}
.cred-copy{background:var(--db-gd);border:0;color:var(--db-gold);cursor:pointer;padding:5px;border-radius:6px;display:flex;flex-shrink:0;transition:all .2s}
.cred-copy:hover{background:var(--db-gg)}
.cred-close{width:100%;padding:.75rem;background:var(--db-sf2);border:1px solid var(--db-bd);border-radius:10px;color:var(--db-tx2);font-size:.875rem;cursor:pointer;font-family:inherit;transition:all .2s}
.cred-close:hover{background:var(--db-bd)}
@media(max-width:768px){.emp-filters{flex-direction:column}.emp-tabs{flex-wrap:wrap}}
      `}</style>
    </div>
  );
}
