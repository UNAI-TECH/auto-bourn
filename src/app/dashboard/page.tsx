'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Users, TrendingUp, ShoppingCart, Upload, Calendar, Award, BarChart3, X, Mail, PhoneCall, CalendarClock, CheckCircle2, XCircle, Camera } from 'lucide-react';
import Image from 'next/image';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { DashboardStats, EmployeePerformance, BrandAnalytics } from '@/types/database';

const BRAND_RED = '#E10613';
const COLORS = [BRAND_RED, '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#06b6d4'];

export default function DashboardOverview() {
  const supabase = createClient();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'month' | 'year'>('day');
  const [uploadActivityDay, setUploadActivityDay] = useState<{ date: string; count: number }[]>([]);
  const [uploadActivityMonth, setUploadActivityMonth] = useState<{ date: string; count: number }[]>([]);
  const [uploadActivityYear, setUploadActivityYear] = useState<{ date: string; count: number }[]>([]);
  const [empPerf, setEmpPerf] = useState<EmployeePerformance[]>([]);
  const [brandData, setBrandData] = useState<BrandAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  // Employee Detail Modal State
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [selectedEmpStats, setSelectedEmpStats] = useState<EmployeePerformance | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'cars'>('profile');
  const [employeeCars, setEmployeeCars] = useState<any[]>([]);
  const detailFileInputRef = useRef<HTMLInputElement>(null);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

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
      const fileName = `avatar-${selectedEmployee.employee_id || 'temp'}-${Math.random().toString(36).substring(2)}.${fileExt}`;
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
      fetchAll();
      showToast('Profile photo updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile photo', 'error');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleBarClick = async (clickedData: any) => {
    if (!clickedData) return;
    
    // Extract payload from various possible Recharts onClick signatures
    let payload = null;
    if (clickedData.activePayload && clickedData.activePayload.length > 0) {
      payload = clickedData.activePayload[0].payload;
    } else if (clickedData.payload) {
      payload = clickedData.payload;
    } else if (clickedData.employee_id) {
      payload = clickedData;
    }

    if (!payload || !payload.employee_id) return;

    // Prevent duplicate fetch
    if (showModal && selectedEmployee?.id === payload.employee_id) return;

    setModalLoading(true);
    setShowModal(true);
    setSelectedEmpStats(payload);
    setSelectedEmployee(null);
    setEmployeeCars([]);
    setActiveTab('profile');

    try {
      const { data: emp } = await supabase
        .from('employees')
        .select('*')
        .eq('id', payload.employee_id)
        .single();
      
      if (emp) {
        setSelectedEmployee(emp);

        // Fetch employee's managed cars
        const { data: cars } = await supabase
          .from('cars')
          .select('*')
          .eq('employee_id', payload.employee_id)
          .order('created_at', { ascending: false });

        if (cars) {
          setEmployeeCars(cars);
        }
      }
    } catch (err) {
      console.error('Error fetching employee details:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleBrandClick = (clickedData: any) => {
    if (!clickedData) return;
    let payload = null;
    if (clickedData.activePayload && clickedData.activePayload.length > 0) {
      payload = clickedData.activePayload[0].payload;
    } else if (clickedData.payload) {
      payload = clickedData.payload;
    } else {
      payload = clickedData;
    }
    
    if (payload && payload.brand) {
      router.push(`/dashboard/cars?brand=${encodeURIComponent(payload.brand)}`);
    }
  };

  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const brandName = payload.value;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={15}
          textAnchor="middle"
          fill="var(--db-tx2)"
          fontSize={10}
          fontWeight={600}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/dashboard/cars?brand=${encodeURIComponent(brandName)}`);
          }}
        >
          {brandName}
        </text>
      </g>
    );
  };

  const CustomYAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const empName = payload.value;
    const emp = empPerf.find(e => e.name === empName);
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={-10}
          y={4}
          textAnchor="end"
          fill="var(--db-tx2)"
          fontSize={12}
          fontWeight={600}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            if (emp) handleBarClick(emp);
          }}
        >
          {empName}
        </text>
      </g>
    );
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      const [
        carsRes,
        empsRes,
        leadsRes,
        presentRes,
        testDrivesRes
      ] = await Promise.all([
        supabase.from('cars').select('employee_id, status, created_at, brand'),
        supabase.from('employees').select('id, name, status, role, avatar_url, employee_id'),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('daily_reports').select('id', { count: 'exact', head: true }).eq('report_date', todayStr),
        supabase.from('test_drives').select('id', { count: 'exact', head: true }),
      ]);

      const cars = carsRes.data || [];
      const employees = empsRes.data || [];
      const activeEmployees = employees.filter(e => e.role === 'employee' && e.status === 'active');
      const totalActiveEmployees = activeEmployees.length;
      const presentCount = presentRes.count || 0;

      // 1. Stats
      setStats({
        total_cars: cars.length,
        total_sold: cars.filter(c => c.status === 'sold').length,
        total_available: cars.filter(c => c.status === 'available').length,
        total_reserved: cars.filter(c => c.status === 'reserved').length,
        enquiries: leadsRes.count || 0,
        present: presentCount,
        absent: Math.max(0, totalActiveEmployees - presentCount),
        test_drives: testDrivesRes.count || 0,
      });

      // 2a. Upload activity (last 14 days)
      const days: { date: string; count: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const ds = d.toISOString().split('T')[0];
        const de = new Date(d.getTime() + 86400000).toISOString().split('T')[0];
        
        const count = cars.filter(c => {
          if (!c.created_at) return false;
          const cDate = c.created_at.split('T')[0];
          return cDate >= ds && cDate < de;
        }).length;
        
        days.push({ date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), count });
      }
      setUploadActivityDay(days);

      // 2b. Upload activity (last 12 months)
      const months: { date: string; count: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        
        const count = cars.filter(c => {
          if (!c.created_at) return false;
          const cDate = new Date(c.created_at);
          return cDate.getFullYear() === y && cDate.getMonth() === m;
        }).length;
        
        months.push({
          date: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
          count
        });
      }
      setUploadActivityMonth(months);

      // 2c. Upload activity (last 5 years)
      const years: { date: string; count: number }[] = [];
      for (let i = 4; i >= 0; i--) {
        const y = now.getFullYear() - i;
        
        const count = cars.filter(c => {
          if (!c.created_at) return false;
          const cDate = new Date(c.created_at);
          return cDate.getFullYear() === y;
        }).length;
        
        years.push({
          date: String(y),
          count
        });
      }
      setUploadActivityYear(years);

      // 3. Employee performance
      const salesStaff = employees.filter(e => e.role === 'employee');
      const perf: EmployeePerformance[] = salesStaff.map(e => {
        const empCars = cars.filter(c => c.employee_id === e.id);
        const totalUploads = empCars.length;
        const totalSold = empCars.filter(c => c.status === 'sold').length;
        
        let lastUpload: string | null = null;
        if (empCars.length > 0) {
          const sorted = [...empCars].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          lastUpload = sorted[0].created_at;
        }

        return {
          employee_id: e.id,
          name: e.name,
          total_uploads: totalUploads,
          total_sold: totalSold,
          last_upload: lastUpload,
        };
      });
      setEmpPerf(perf.sort((a, b) => b.total_uploads - a.total_uploads));

      // 4. Brand analytics
      const brandMap = new Map<string, BrandAnalytics>();
      cars.forEach(c => {
        if (!c.brand) return;
        const b = brandMap.get(c.brand) || { brand: c.brand, total: 0, sold: 0, available: 0 };
        b.total++;
        if (c.status === 'sold') b.sold++;
        if (c.status === 'available') b.available++;
        brandMap.set(c.brand, b);
      });
      setBrandData(Array.from(brandMap.values()).sort((a, b) => b.total - a.total));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { label: 'Total Cars', value: stats.total_cars, icon: Car, color: BRAND_RED, link: '/dashboard/cars' },
    { label: 'Available', value: stats.total_available, icon: TrendingUp, color: '#22c55e', link: '/dashboard/cars?status=available' },
    { label: 'Sold', value: stats.total_sold, icon: ShoppingCart, color: '#ef4444', link: '/dashboard/cars?status=sold' },
    { label: 'Reserved', value: stats.total_reserved, icon: Award, color: '#ec4899', link: '/dashboard/cars?status=reserved' },
    { label: 'Enquiry', value: stats.enquiries, icon: PhoneCall, color: '#3b82f6', link: '/dashboard/crm/leads' },
    { label: 'Present', value: stats.present, icon: CheckCircle2, color: '#22c55e', link: '/dashboard/reports' },
    { label: 'Absent', value: stats.absent, icon: XCircle, color: '#f59e0b', link: '/dashboard/reports' },
    { label: 'Test Drive', value: stats.test_drives, icon: CalendarClock, color: '#06b6d4', link: '/dashboard/test-drives' },
  ] : [];

  const pieData = stats ? [
    { name: 'Available', value: stats.total_available },
    { name: 'Sold', value: stats.total_sold },
    { name: 'Reserved', value: stats.total_reserved },
  ].filter(d => d.value > 0) : [];

  if (loading) {
    return (
      <div className="db-page">
        <h1 className="db-page-title">Dashboard Overview</h1>
        <div className="db-grid-4">{Array(8).fill(0).map((_, i) => <div key={i} className="db-skeleton-card" />)}</div>
      </div>
    );
  }

  return (
    <div className="db-page">
      <div className="db-page-header">
        <div><h1 className="db-page-title">Dashboard Overview</h1><p className="db-page-sub">Welcome back! Here&apos;s your dealership at a glance.</p></div>
      </div>

      {/* Stat Cards */}
      <div className="db-grid-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="db-stat-card" onClick={() => router.push(card.link)}>
              <div className="db-stat-icon" style={{ background: `${card.color}15`, color: card.color }}><card.icon size={20} /></div>
              <div className="db-stat-info">
                <span className="db-stat-val">{card.value}</span>
                <span className="db-stat-lbl">{card.label}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="db-grid-2" style={{ marginTop: '1.5rem' }}>
        <motion.div className="db-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0 }}>
              Upload Activity{' '}
              <span>
                {timeframe === 'day' ? '(Last 14 Days)' : timeframe === 'month' ? '(Last 12 Months)' : '(Last 5 Years)'}
              </span>
            </h3>
            <div className="timeframe-switch">
              <button className={timeframe === 'day' ? 'active' : ''} onClick={() => setTimeframe('day')}>Day</button>
              <button className={timeframe === 'month' ? 'active' : ''} onClick={() => setTimeframe('month')}>Month</button>
              <button className={timeframe === 'year' ? 'active' : ''} onClick={() => setTimeframe('year')}>Year</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={timeframe === 'day' ? uploadActivityDay : timeframe === 'month' ? uploadActivityMonth : uploadActivityYear}>
              <defs><linearGradient id="gRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BRAND_RED} stopOpacity={0.3} /><stop offset="100%" stopColor={BRAND_RED} stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="date" tick={{ fill: 'var(--db-tx3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--db-tx3)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--db-sf)', border: '1px solid var(--db-bd)', borderRadius: 10, color: 'var(--db-tx)', fontSize: 13 }} />
              <Area type="monotone" dataKey="count" stroke={BRAND_RED} strokeWidth={2} fill="url(#gRed)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="db-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3>Car Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={(props: PieLabelRenderProps) => `${props.name ?? ''} ${(((props.percent as number) ?? 0) * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--db-sf)', border: '1px solid var(--db-bd)', borderRadius: 10, color: 'var(--db-tx)', fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Employee Performance & Brand Analytics */}
      <div className="db-grid-2" style={{ marginTop: '1.5rem' }}>
        <motion.div className="db-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3>Employee Performance</h3>
          {empPerf.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={empPerf.slice(0, 8)} layout="vertical" style={{ cursor: 'pointer' }}>
                <XAxis type="number" tick={{ fill: 'var(--db-tx3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={<CustomYAxisTick />} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ background: 'var(--db-sf)', border: '1px solid var(--db-bd)', borderRadius: 10, color: 'var(--db-tx)', fontSize: 13 }} />
                <Bar dataKey="total_uploads" fill={BRAND_RED} radius={[0, 6, 6, 0]} name="Uploads" onClick={(data) => handleBarClick(data)} />
                <Bar dataKey="total_sold" fill="#22c55e" radius={[0, 6, 6, 0]} name="Sold" onClick={(data) => handleBarClick(data)} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="db-empty">No employee data yet</p>}
        </motion.div>

        <motion.div className="db-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <h3>Brand Analytics</h3>
          {brandData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={brandData.slice(0, 8)} style={{ cursor: 'pointer' }}>
                <XAxis dataKey="brand" tick={<CustomXAxisTick />} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--db-tx3)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--db-sf)', border: '1px solid var(--db-bd)', borderRadius: 10, color: 'var(--db-tx)', fontSize: 13 }} />
                <Bar dataKey="total" fill={BRAND_RED} radius={[6, 6, 0, 0]} name="Total" onClick={(data) => handleBrandClick(data)} />
                <Bar dataKey="sold" fill="#ef4444" radius={[6, 6, 0, 0]} name="Sold" onClick={(data) => handleBrandClick(data)} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="db-empty">No brand data yet</p>}
        </motion.div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div className={`db-toast ${toast.type}`} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}>
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

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
                <div className="modal-loader">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="modal-spinner"
                  />
                </div>
              ) : selectedEmployee ? (
                <div className="modal-grid">
                  <div className="modal-left-col">
                    <div className="founder-card-wrap">
                      <div className="founder-card-photo-container">
                        <Image
                          src={selectedEmployee.avatar_url || '/DEFAULT IMAGE.PNG'}
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

                          {selectedEmpStats && (
                            <div className="modal-stats">
                              <h4 className="modal-stats-title">Performance Metrics</h4>
                              <div className="modal-stats-grid">
                                <div className="modal-stat-box">
                                  <Upload size={18} />
                                  <span className="modal-stat-num">{selectedEmpStats.total_uploads}</span>
                                  <span className="modal-stat-lbl">Cars Uploaded</span>
                                </div>
                                <div className="modal-stat-box">
                                  <ShoppingCart size={18} />
                                  <span className="modal-stat-num">{selectedEmpStats.total_sold}</span>
                                  <span className="modal-stat-lbl">Cars Sold</span>
                                </div>
                                <div className="modal-stat-box">
                                  <TrendingUp size={18} />
                                  <span className="modal-stat-num">
                                    {selectedEmpStats.total_uploads > 0
                                      ? `${Math.round((selectedEmpStats.total_sold / selectedEmpStats.total_uploads) * 100)}%`
                                      : '0%'}
                                  </span>
                                  <span className="modal-stat-lbl">Conversion Rate</span>
                                </div>
                              </div>

                              {selectedEmpStats.last_upload && (
                                <div className="modal-last-upload">
                                  Last uploaded car on:{' '}
                                  <strong>
                                    {new Date(selectedEmpStats.last_upload).toLocaleDateString('en-IN', {
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
                          )}
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

      <style jsx>{`
.db-page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem}
.db-page-title{font-family:'Outfit',sans-serif;font-size:1.75rem;font-weight:700;color:var(--db-tx);margin:0}
.db-page-sub{color:var(--db-tx2);font-size:.875rem;margin-top:.25rem}
.db-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem}
.db-grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem}
.db-stat-card{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:14px;padding:1.25rem;display:flex;align-items:center;gap:1rem;transition:all .2s;cursor:pointer;user-select:none}
.db-stat-card:hover{border-color:var(--db-gold);box-shadow:0 4px 20px var(--db-gg);transform:translateY(-2px)}
.db-stat-card:active{transform:translateY(0)}
.db-stat-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.db-stat-val{font-size:1.5rem;font-weight:700;font-family:'Outfit',sans-serif;display:block;line-height:1.2}
.db-stat-lbl{font-size:.75rem;color:var(--db-tx3);text-transform:uppercase;letter-spacing:.05em}
.db-chart-card{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:14px;padding:1.5rem}
.db-chart-card h3{font-family:'Outfit',sans-serif;font-size:1rem;font-weight:600;color:var(--db-tx)}
.db-chart-card h3 span{color:var(--db-tx3);font-weight:400;font-size:.8125rem}
.timeframe-switch{display:flex;background:var(--db-sf2,#f5f5f5);padding:3px;border-radius:10px;border:1px solid var(--db-bd,rgba(0,0,0,0.06))}
.timeframe-switch button{background:none;border:none;padding:5px 11px;border-radius:8px;font-size:.8125rem;font-weight:600;color:var(--db-tx2,#555);cursor:pointer;transition:all .2s;font-family:inherit}
.timeframe-switch button.active{background:var(--db-sf,#fff);color:#E10613;box-shadow:0 2px 8px rgba(0,0,0,0.05)}
.db-empty{color:var(--db-tx3);text-align:center;padding:3rem 0;font-size:.875rem}
.db-skeleton-card{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:14px;height:90px;animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@media(max-width:1024px){.db-grid-4{grid-template-columns:repeat(2,1fr)}.db-grid-2{grid-template-columns:1fr}}
@media(max-width:640px){.db-grid-4{grid-template-columns:1fr}}

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
:global(.db-toast) {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .875rem 1.5rem;
  border-radius: 12px;
  font-size: .875rem;
  font-weight: 500;
  z-index: 200;
  box-shadow: 0 8px 30px rgba(0,0,0,.3);
}
:global(.db-toast.success) {
  background: #065f46;
  color: #6ee7b7;
  border: 1px solid rgba(34,197,94,.3);
}
:global(.db-toast.error) {
  background: #7f1d1d;
  color: #fca5a5;
  border: 1px solid rgba(239,68,68,.3);
}
@keyframes pulse {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
      `}</style>
    </div>
  );
}
