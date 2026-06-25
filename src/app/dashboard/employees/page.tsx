'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, MoreVertical, X, Shield, Ban, RotateCcw, Trash2, Key, Check, AlertCircle, Copy, CheckCheck, Mail, PhoneCall, CalendarClock, Upload, ShoppingCart, TrendingUp, Camera } from 'lucide-react';
import Image from 'next/image';
import { formatDate, timeAgo, generateEmployeeId } from '@/lib/utils';
import type { Employee } from '@/types/database';
import ConfirmModal from '@/components/ConfirmModal';
import PromptModal from '@/components/PromptModal';

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
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<Employee | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', employee_id: generateEmployeeId() });
  const [submitting, setSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<CredentialsModal | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Employee Detail Modal State
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'cars'>('profile');
  const [employeeCars, setEmployeeCars] = useState<any[]>([]);
  const detailFileInputRef = useRef<HTMLInputElement>(null);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  const handleDetailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEmployee) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size must be less than 5MB', 'error');
      return;
    }

    setUpdatingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${selectedEmployee.employee_id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('car-images')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Avatar upload failed: ${uploadError.message}`);
      }

      const { data } = supabase.storage
        .from('car-images')
        .getPublicUrl(filePath);

      const uploadedAvatarUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from('employees')
        .update({ avatar_url: uploadedAvatarUrl })
        .eq('id', selectedEmployee.id);

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      setSelectedEmployee({ ...selectedEmployee, avatar_url: uploadedAvatarUrl });
      setEmployees(prev => prev.map(emp => emp.id === selectedEmployee.id ? { ...emp, avatar_url: uploadedAvatarUrl } : emp));
      showToast('Profile photo updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile photo', 'error');
    } finally {
      setUpdatingAvatar(false);
    }
  };

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

  const handleEmployeeClick = async (emp: any) => {
    setModalLoading(true);
    setShowModal(true);
    setSelectedEmployee(emp);
    setEmployeeCars([]);
    setActiveTab('profile');

    try {
      const { data: cars } = await supabase
        .from('cars')
        .select('*')
        .eq('employee_id', emp.id)
        .order('created_at', { ascending: false });

      if (cars) {
        setEmployeeCars(cars);
      }
    } catch (err) {
      console.error('Error fetching employee details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const closeAddModal = () => {
    setShowAdd(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    setForm({ name: '', email: '', phone: '', password: '', employee_id: generateEmployeeId() });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let uploadedAvatarUrl = '';
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `avatar-${form.employee_id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('car-images')
          .upload(filePath, avatarFile);

        if (uploadError) {
          throw new Error(`Avatar upload failed: ${uploadError.message}`);
        }

        const { data } = supabase.storage
          .from('car-images')
          .getPublicUrl(filePath);

        uploadedAvatarUrl = data.publicUrl;
      }

      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          avatar_url: uploadedAvatarUrl || null
        }),
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
      setAvatarFile(null);
      setAvatarPreview(null);
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

  const handleResetPasswordConfirm = async (newPassword: string) => {
    if (!resetTarget) return;
    if (newPassword.trim().length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: resetTarget.id,
          password: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      showToast(`Password for ${resetTarget.name} has been successfully updated.`);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setResetTarget(null);
    }
  };

  const removeEmployee = (id: string) => {
    setDeleteTargetId(id);
    setMenuOpen(null);
  };

  const handleRemoveConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      const res = await fetch(`/api/employees?id=${deleteTargetId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Employee permanently removed');
      } else {
        showToast(data.error || 'Failed to remove employee');
      }
    } catch {
      showToast('Failed to remove employee');
    }
    setDeleteTargetId(null);
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
            {loading ? (
              <tr><td colSpan={9} className="emp-empty" style={{ fontStyle: 'normal' }}>Loading employee list...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="emp-empty">No employees found</td></tr>
            ) : filtered.map(emp => (
              <tr key={emp.id}>
                <td>
                  <div className="emp-user" onClick={() => handleEmployeeClick(emp)}>
                    {emp.avatar_url ? (
                      <div className="emp-avatar-img-wrap">
                        <Image src={emp.avatar_url} alt={emp.name} width={36} height={36} style={{ objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div className="emp-avatar">{emp.name.charAt(0)}</div>
                    )}
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
                        <button onClick={() => { setResetTarget(emp); setMenuOpen(null); }}><Key size={14} />Reset Password</button>
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
          <div className="modal-backdrop" onClick={closeAddModal}>
            <motion.div
              className="inspo-card-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="inspo-modal-close" onClick={closeAddModal}>
                <X size={20} />
              </button>

              <div className="inspo-card-header">
                <h2 className="inspo-card-title">Add New Employee</h2>
                <p className="inspo-card-subtitle">Create a new employee profile to grant system access.</p>
              </div>

              <div className="inspo-photo-section">
                <div className="inspo-photo-upload" onClick={handlePhotoClick}>
                  {avatarPreview ? (
                    <div className="inspo-photo-preview-container">
                      <Image src={avatarPreview} alt="Preview" fill className="inspo-photo-preview" />
                      <div className="inspo-photo-overlay">
                        <span>Change</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload size={20} />
                      <span>Upload Photo</span>
                      <span className="inspo-photo-subtext">JPG, PNG (max 5MB)</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>

              <form onSubmit={handleAdd} className="inspo-form">
                <div className="inspo-grid">
                  <div className="inspo-field full-width">
                    <label>Full Name <span className="required">*</span></label>
                    <input
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="Employee name"
                    />
                  </div>

                  <div className="inspo-field">
                    <label>Email Address <span className="required">*</span></label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      required
                      placeholder="employee@autobourn.com"
                    />
                  </div>

                  <div className="inspo-field">
                    <label>Phone Number</label>
                    <input
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 XXXXXXXXXX"
                    />
                  </div>

                  <div className="inspo-field">
                    <label>Employee ID <span className="required">*</span></label>
                    <div className="inspo-input-btn-wrap">
                      <input
                        value={form.employee_id}
                        onChange={e => setForm({ ...form, employee_id: e.target.value })}
                        required
                        placeholder="Employee ID"
                      />
                      <button
                        type="button"
                        className="inspo-regen-btn"
                        onClick={() => setForm({ ...form, employee_id: generateEmployeeId() })}
                        title="Regenerate ID"
                      >
                        <RotateCcw size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="inspo-field">
                    <label>Password <span className="required">*</span></label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      required
                      placeholder="Min 6 characters"
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="inspo-form-footer">
                  <button
                    type="button"
                    className="inspo-btn-cancel"
                    onClick={closeAddModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inspo-btn-submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Adding...' : 'Add Employee'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
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

      {/* Employee Detail Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-backdrop" onClick={() => setShowModal(false)}>
            <motion.div
              className="modal-card"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>

              {modalLoading ? (
                <div className="modal-loader" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--db-tx3)' }}>
                  Loading employee details...
                </div>
              ) : selectedEmployee ? (
                <div className="modal-grid">
                  <div className="modal-left-col">
                    <div className="founder-card-wrap">
                      <div className="founder-card-photo-container">
                        <Image
                          src={selectedEmployee.avatar_url || '/employee_avatar.png'}
                          alt={selectedEmployee.name}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="280px"
                        />
                        <div className="photo-change-overlay" onClick={() => detailFileInputRef.current?.click()}>
                          {updatingAvatar ? (
                            <div className="avatar-spinner" />
                          ) : (
                            <>
                              <Camera size={20} />
                              <span style={{ marginLeft: 6 }}>Change Photo</span>
                            </>
                          )}
                        </div>
                        <span className={`status-badge ${selectedEmployee.status}`}>
                          {selectedEmployee.status}
                        </span>
                      </div>
                      <input
                        type="file"
                        ref={detailFileInputRef}
                        onChange={handleDetailFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      <div className="founder-card-info">
                        <h3 className="founder-card-name">
                          {selectedEmployee.name}
                        </h3>
                        <p className="founder-card-role">
                          {selectedEmployee.role === 'admin' ? 'Administrator' : 'Sales Executive'}
                        </p>
                        <span className="founder-card-id">{selectedEmployee.employee_id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="modal-right-col">
                    <div className="modal-tabs">
                      <button
                        className={`modal-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                      >
                        Profile & Stats
                      </button>
                      <button
                        className={`modal-tab-btn ${activeTab === 'cars' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cars')}
                      >
                        Managed Cars ({employeeCars.length})
                      </button>
                    </div>

                    <div className="modal-body-scroll">
                      {activeTab === 'profile' ? (
                        <>
                          <div className="modal-details-grid">
                            <div className="modal-detail-item">
                              <Mail size={16} />
                              <div>
                                <label>Email Address</label>
                                <a href={`mailto:${selectedEmployee.email}`}>{selectedEmployee.email}</a>
                              </div>
                            </div>
                            <div className="modal-detail-item">
                              <PhoneCall size={16} />
                              <div>
                                <label>Phone Number</label>
                                <span>{selectedEmployee.phone || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="modal-detail-item">
                              <CalendarClock size={16} />
                              <div>
                                <label>Joined Date</label>
                                <span>{new Date(selectedEmployee.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>

                          <div className="modal-stats">
                            <h4 className="modal-stats-title">Performance Metrics</h4>
                            <div className="modal-stats-grid">
                              <div className="modal-stat-box">
                                <Upload size={18} />
                                <span className="modal-stat-num">{selectedEmployee.total_uploads || 0}</span>
                                <span className="modal-stat-lbl">Cars Uploaded</span>
                              </div>
                              <div className="modal-stat-box">
                                <ShoppingCart size={18} />
                                <span className="modal-stat-num">{selectedEmployee.total_sold || 0}</span>
                                <span className="modal-stat-lbl">Cars Sold</span>
                              </div>
                              <div className="modal-stat-box">
                                <TrendingUp size={18} />
                                <span className="modal-stat-num">
                                  {selectedEmployee.total_uploads > 0
                                    ? `${Math.round((selectedEmployee.total_sold / selectedEmployee.total_uploads) * 100)}%`
                                    : '0%'}
                                </span>
                                <span className="modal-stat-lbl">Conversion Rate</span>
                              </div>
                            </div>

                            {selectedEmployee.last_upload && (
                              <div className="modal-last-upload">
                                Last uploaded car on:{' '}
                                <strong>
                                  {new Date(selectedEmployee.last_upload).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </strong>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="modal-cars-list">
                          {employeeCars.length === 0 ? (
                            <p className="modal-no-cars">No cars uploaded by this employee yet.</p>
                          ) : (
                            <div className="modal-cars-grid">
                              {employeeCars.map((car) => (
                                <div key={car.id} className="modal-car-card">
                                  <div className="modal-car-thumb-wrap">
                                    {car.thumbnail ? (
                                      <Image
                                        src={car.thumbnail}
                                        alt={`${car.brand} ${car.model}`}
                                        width={180}
                                        height={110}
                                        className="modal-car-thumb"
                                      />
                                    ) : (
                                      <div className="modal-car-thumb-placeholder">No Image</div>
                                    )}
                                    <span className={`car-status-badge ${car.status}`}>
                                      {car.status}
                                    </span>
                                  </div>
                                  <div className="modal-car-info">
                                    <h5 className="modal-car-title" title={`${car.brand} ${car.model}`}>
                                      {car.brand} {car.model}
                                    </h5>
                                    <div className="modal-car-meta">
                                      <span>{car.year}</span>
                                      <span className="meta-dot">•</span>
                                      <span>{car.fuel_type || car.transmission}</span>
                                    </div>
                                    <div className="modal-car-price">
                                      {new Intl.NumberFormat('en-IN', {
                                        style: 'currency',
                                        currency: 'INR',
                                        maximumFractionDigits: 0,
                                      }).format(car.price)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="modal-error">Failed to load employee details.</div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Remove Employee"
        message="Are you sure you want to remove this employee? This will permanently delete their account and logs."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setDeleteTargetId(null)}
        isDanger={true}
      />

      <PromptModal
        isOpen={!!resetTarget}
        title="Reset Password"
        message={`Enter a new password for ${resetTarget?.name || ''} (minimum 6 characters):`}
        placeholder="Enter password"
        confirmLabel="Update Password"
        cancelLabel="Cancel"
        onConfirm={handleResetPasswordConfirm}
        onCancel={() => setResetTarget(null)}
        isPassword={true}
      />

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
.emp-table-wrap{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:14px;overflow-x:auto;min-height:550px}
.emp-table{width:100%;border-collapse:collapse;font-size:.875rem}
.emp-table th{text-align:left;padding:.875rem 1rem;color:var(--db-tx3);font-weight:500;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--db-bd)}
.emp-table td{padding:.875rem 1rem;border-bottom:1px solid var(--db-bd);vertical-align:middle}
.emp-table tr:last-child td{border-bottom:0}
.emp-table tr:hover{background:var(--db-sf2)}
.emp-user{display:flex;align-items:center;gap:.75rem;cursor:pointer;user-select:none}
.emp-user:hover .emp-name{color:var(--db-gold);text-decoration:underline}
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

/* Modal Styles */
:global(.modal-backdrop) {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
}

:global(.modal-card) {
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  border-radius: 24px;
  width: 100%;
  max-width: 900px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

:global(.modal-grid) {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2.5rem;
  flex: 1;
  min-height: 0;
  align-items: stretch;
}

@media (max-width: 768px) {
  :global(.modal-grid) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  :global(.modal-card) {
    max-width: 580px;
    padding: 1.75rem;
  }
}

:global(.modal-left-col) {
  flex-shrink: 0;
}

:global(.founder-card-wrap) {
  background: var(--db-sf2);
  border: 1px solid var(--db-bd);
  border-radius: 24px;
  padding: 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
}

:global(.founder-card-photo-container) {
  position: relative;
  width: 100%;
  aspect-ratio: 4/5;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--db-bd);
  background: var(--db-sf2);
}

:global(.founder-card-photo-container) :global(.status-badge) {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 99px;
  border: 2px solid var(--db-sf2);
  color: #fff;
  z-index: 10;
}

:global(.founder-card-photo-container) :global(.status-badge.active) {
  background: var(--db-gn);
}

:global(.founder-card-photo-container) :global(.status-badge.suspended) {
  background: var(--db-rd);
}

:global(.founder-card-photo-container) :global(.status-badge.inactive) {
  background: var(--db-tx3);
}

:global(.founder-card-info) {
  margin-top: 1.25rem;
  padding: 0 0.25rem;
}

:global(.founder-card-name) {
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--db-tx);
  margin: 0 0 0.25rem 0;
}

:global(.founder-card-role) {
  font-size: 0.75rem;
  color: #E10613;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 0.5rem 0;
}

:global(.founder-card-id) {
  font-size: 0.75rem;
  color: var(--db-tx3);
  display: block;
  font-family: monospace;
}

:global(.modal-right-col) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

:global(.modal-body-scroll) {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  margin-top: 0.5rem;
  padding-right: 4px;
}

:global(.modal-body-scroll)::-webkit-scrollbar {
  width: 6px;
}

:global(.modal-body-scroll)::-webkit-scrollbar-track {
  background: transparent;
}

:global(.modal-body-scroll)::-webkit-scrollbar-thumb {
  background: var(--db-bd);
  border-radius: 99px;
}

:global(.modal-tabs) {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--db-bd);
  margin-bottom: 1.5rem;
  padding-bottom: 2px;
}

:global(.modal-tab-btn) {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--db-tx3);
  font-family: 'Outfit', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

:global(.modal-tab-btn):hover {
  color: var(--db-tx);
}

:global(.modal-tab-btn.active) {
  color: var(--db-gold);
  border-bottom-color: var(--db-gold);
}

:global(.modal-cars-list) {
  padding-bottom: 1rem;
}

:global(.modal-no-cars) {
  text-align: center;
  color: var(--db-tx3);
  font-size: 0.875rem;
  padding: 2rem 0;
}

:global(.modal-cars-grid) {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 480px) {
  :global(.modal-cars-grid) {
    grid-template-columns: 1fr;
  }
}

:global(.modal-car-card) {
  background: var(--db-sf2);
  border: 1px solid var(--db-bd);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:global(.modal-car-thumb-wrap) {
  position: relative;
  width: 100%;
  aspect-ratio: 16/10;
  background: #eee;
  overflow: hidden;
}

:global(.modal-car-thumb) {
  object-fit: contain;
  width: 100%;
  height: 100%;
}

:global(.modal-car-thumb-placeholder) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--db-tx3);
}

:global(.car-status-badge) {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
  color: #fff;
  letter-spacing: 0.03em;
}

:global(.car-status-badge.available) {
  background: #22c55e;
}

:global(.car-status-badge.sold) {
  background: #ef4444;
}

:global(.car-status-badge.reserved) {
  background: #f59e0b;
}

:global(.modal-car-info) {
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

:global(.modal-car-title) {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--db-tx);
  margin: 0 0 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.modal-car-meta) {
  font-size: 0.75rem;
  color: var(--db-tx3);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

:global(.meta-dot) {
  font-size: 0.5rem;
}

:global(.modal-car-price) {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--db-gold);
  margin-top: auto;
}

:global(.modal-close) {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: none;
  border: none;
  color: var(--db-tx2);
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  transition: all 0.2s;
  z-index: 20;
}

:global(.modal-close):hover {
  background: var(--db-gd);
  color: var(--db-gold);
}

:global(.modal-loader) {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 250px;
}

:global(.modal-spinner) {
  width: 40px;
  height: 40px;
  border: 3px solid var(--db-gd);
  border-top-color: var(--db-gold);
  border-radius: 50%;
}

:global(.modal-details-grid) {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  background: var(--db-sf2);
  border-radius: 16px;
  margin-bottom: 2rem;
  border: 1px solid var(--db-bd);
  width: 100%;
}

:global(.modal-detail-item) {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  color: var(--db-tx2);
}

:global(.modal-detail-item) svg {
  color: var(--db-gold);
  margin-top: 2px;
  flex-shrink: 0;
}

:global(.modal-detail-item) label {
  display: block;
  font-size: 0.6875rem;
  color: var(--db-tx3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.125rem;
}

:global(.modal-detail-item) span, :global(.modal-detail-item) a {
  font-size: 0.9375rem;
  color: var(--db-tx);
  text-decoration: none;
  font-weight: 500;
}

:global(.modal-detail-item) a:hover {
  color: var(--db-gold);
}

:global(.modal-stats) {
  width: 100%;
}

:global(.modal-stats-title) {
  font-size: 0.8125rem;
  color: var(--db-tx3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 1rem;
  font-weight: 600;
}

:global(.modal-stats-grid) {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  width: 100%;
}

:global(.modal-stat-box) {
  background: var(--db-sf);
  border: 1px solid var(--db-bd);
  border-radius: 12px;
  padding: 1rem 0.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

:global(.modal-stat-box) svg {
  color: var(--db-gold);
  margin-bottom: 0.5rem;
}

:global(.modal-stat-num) {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--db-tx);
  font-family: 'Outfit', sans-serif;
  line-height: 1.2;
}

:global(.modal-stat-lbl) {
  font-size: 0.6875rem;
  color: var(--db-tx3);
  margin-top: 0.125rem;
}

:global(.modal-last-upload) {
  font-size: 0.75rem;
  color: var(--db-tx3);
  text-align: center;
  margin-top: 1rem;
}

:global(.modal-error) {
  text-align: center;
  color: var(--db-rd);
  font-weight: 500;
  padding: 2rem 0;
}

/* Inspo Card Modal Styles (Red & White Theme) */
/* Inspo Card Modal Styles (Red & White Theme) - Made Global */
:global(.inspo-card-modal) {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-top: 5px solid #E10613; /* Premium Red bar at the top */
  border-radius: 24px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  color: #1e293b;
  font-family: inherit;
}

:global(.inspo-modal-close) {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  transition: all 0.2s;
  z-index: 20;
}

:global(.inspo-modal-close):hover {
  background: #f1f5f9;
  color: #0f172a;
}

:global(.inspo-card-header) {
  text-align: center;
  margin-bottom: 1.5rem;
}

:global(.inspo-card-title) {
  font-family: 'Outfit', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
}

:global(.inspo-card-subtitle) {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

:global(.inspo-photo-section) {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

:global(.inspo-photo-preview-container) {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
}

:global(.inspo-photo-preview) {
  object-fit: cover;
}

:global(.inspo-photo-overlay) {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 50%;
}

:global(.inspo-photo-upload:hover .inspo-photo-overlay) {
  opacity: 1;
}

:global(.inspo-photo-upload) {
  width: 110px;
  height: 110px;
  border: 2px dashed #cbd5e1;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #f8fafc;
  color: #64748b;
  transition: all 0.2s;
  padding: 10px;
}

:global(.inspo-photo-upload):hover {
  border-color: #E10613;
  color: #E10613;
  background: #fff5f5;
}

:global(.inspo-photo-upload) svg {
  margin-bottom: 0.25rem;
}

:global(.inspo-photo-upload) span {
  font-size: 0.75rem;
  font-weight: 600;
}

:global(.inspo-photo-subtext) {
  font-size: 0.625rem !important;
  color: #94a3b8;
  margin-top: 2px;
  font-weight: 400 !important;
}

:global(.inspo-form) {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

:global(.inspo-grid) {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

:global(.inspo-field) {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

:global(.inspo-field.full-width) {
  grid-column: span 2;
}

@media (max-width: 640px) {
  :global(.inspo-grid) {
    grid-template-columns: 1fr;
  }
  :global(.inspo-field.full-width) {
    grid-column: span 1;
  }
}

:global(.inspo-field) label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

:global(.inspo-field) label .required {
  color: #E10613;
}

:global(.inspo-field) input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #0f172a;
  font-size: 0.875rem;
  font-family: inherit;
  outline: 0;
  transition: all 0.2s;
}

:global(.inspo-field) input:focus {
  border-color: #E10613;
  box-shadow: 0 0 0 3px rgba(225, 6, 19, 0.1);
}

:global(.inspo-field) input::placeholder {
  color: #94a3b8;
}

:global(.inspo-input-btn-wrap) {
  position: relative;
  display: flex;
  align-items: center;
}

:global(.inspo-input-btn-wrap) input {
  padding-right: 2.75rem;
}

:global(.inspo-regen-btn) {
  position: absolute;
  right: 8px;
  background: #f1f5f9;
  border: 0;
  color: #475569;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

:global(.inspo-regen-btn):hover {
  background: #e2e8f0;
  color: #E10613;
}

:global(.inspo-form-footer) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1.25rem;
  border-top: 1px solid #e2e8f0;
  gap: 1rem;
}

:global(.inspo-btn-cancel) {
  padding: 0.75rem 1.5rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #475569;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

:global(.inspo-btn-cancel):hover {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
}

:global(.inspo-btn-submit) {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #e10613, #c70511);
  border: 0;
  border-radius: 10px;
  color: #ffffff;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(225, 6, 19, 0.2);
}

:global(.inspo-btn-submit):hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(225, 6, 19, 0.3);
}

:global(.inspo-btn-submit):active {
  transform: translateY(0);
}

:global(.inspo-btn-submit):disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.emp-avatar-img-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  border: 1px solid var(--db-bd);
}
:global(.photo-change-overlay) {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: pointer;
  z-index: 5;
}
:global(.founder-card-photo-container:hover) :global(.photo-change-overlay) {
  opacity: 1;
}
:global(.avatar-spinner) {
  width: 24px;
  height: 24px;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: pulse 1s infinite linear;
}
@keyframes pulse {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
      `}</style>
    </div>
  );
}
