'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Users, TrendingUp, ShoppingCart, Upload, Calendar, Award, BarChart3, X, Mail, PhoneCall, CalendarClock } from 'lucide-react';
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
  const [uploadActivity, setUploadActivity] = useState<{ date: string; count: number }[]>([]);
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
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [carsRes, empRes, todayRes, weekRes, monthRes] = await Promise.all([
      supabase.from('cars').select('status', { count: 'exact' }),
      supabase.from('employees').select('id', { count: 'exact' }).eq('role', 'employee'),
      supabase.from('cars').select('id', { count: 'exact' }).gte('created_at', todayStart),
      supabase.from('cars').select('id', { count: 'exact' }).gte('created_at', weekStart),
      supabase.from('cars').select('id', { count: 'exact' }).gte('created_at', monthStart),
    ]);

    const cars = carsRes.data || [];
    setStats({
      total_cars: carsRes.count || 0,
      total_sold: cars.filter(c => c.status === 'sold').length,
      total_available: cars.filter(c => c.status === 'available').length,
      total_reserved: cars.filter(c => c.status === 'reserved').length,
      total_employees: empRes.count || 0,
      uploads_today: todayRes.count || 0,
      uploads_this_week: weekRes.count || 0,
      uploads_this_month: monthRes.count || 0,
    });

    // Upload activity (last 14 days)
    const days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const ds = d.toISOString().split('T')[0];
      const de = new Date(d.getTime() + 86400000).toISOString().split('T')[0];
      const { count } = await supabase.from('cars').select('id', { count: 'exact', head: true }).gte('created_at', ds).lt('created_at', de);
      days.push({ date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), count: count || 0 });
    }
    setUploadActivity(days);

    // Employee performance
    const { data: emps } = await supabase.from('employees').select('id, name').eq('role', 'employee');
    if (emps) {
      const perf: EmployeePerformance[] = [];
      for (const e of emps) {
        const { count: total } = await supabase.from('cars').select('id', { count: 'exact', head: true }).eq('employee_id', e.id);
        const { count: sold } = await supabase.from('cars').select('id', { count: 'exact', head: true }).eq('employee_id', e.id).eq('status', 'sold');
        const { data: last } = await supabase.from('cars').select('created_at').eq('employee_id', e.id).order('created_at', { ascending: false }).limit(1);
        perf.push({ employee_id: e.id, name: e.name, total_uploads: total || 0, total_sold: sold || 0, last_upload: last?.[0]?.created_at || null });
      }
      setEmpPerf(perf.sort((a, b) => b.total_uploads - a.total_uploads));
    }

    // Brand analytics
    const { data: allCars } = await supabase.from('cars').select('brand, status');
    if (allCars) {
      const map = new Map<string, BrandAnalytics>();
      allCars.forEach(c => {
        const b = map.get(c.brand) || { brand: c.brand, total: 0, sold: 0, available: 0 };
        b.total++;
        if (c.status === 'sold') b.sold++;
        if (c.status === 'available') b.available++;
        map.set(c.brand, b);
      });
      setBrandData(Array.from(map.values()).sort((a, b) => b.total - a.total));
    }

    setLoading(false);
  };

  const statCards = stats ? [
    { label: 'Total Cars', value: stats.total_cars, icon: Car, color: BRAND_RED },
    { label: 'Available', value: stats.total_available, icon: TrendingUp, color: '#22c55e' },
    { label: 'Sold', value: stats.total_sold, icon: ShoppingCart, color: '#ef4444' },
    { label: 'Employees', value: stats.total_employees, icon: Users, color: '#3b82f6' },
    { label: 'Today', value: stats.uploads_today, icon: Upload, color: '#a855f7' },
    { label: 'This Week', value: stats.uploads_this_week, icon: Calendar, color: '#f59e0b' },
    { label: 'This Month', value: stats.uploads_this_month, icon: BarChart3, color: '#06b6d4' },
    { label: 'Reserved', value: stats.total_reserved, icon: Award, color: '#ec4899' },
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
            <div className="db-stat-card">
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
          <h3>Upload Activity <span>(Last 14 Days)</span></h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={uploadActivity}>
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
                          src={selectedEmployee.avatar_url || '/employee_avatar.png'}
                          alt={selectedEmployee.name}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="280px"
                        />
                        <span className={`status-badge ${selectedEmployee.status}`}>
                          {selectedEmployee.status}
                        </span>
                      </div>
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
.db-stat-card{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:14px;padding:1.25rem;display:flex;align-items:center;gap:1rem;transition:all .2s}
.db-stat-card:hover{border-color:var(--db-gold);box-shadow:0 4px 20px var(--db-gg)}
.db-stat-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.db-stat-val{font-size:1.5rem;font-weight:700;font-family:'Outfit',sans-serif;display:block;line-height:1.2}
.db-stat-lbl{font-size:.75rem;color:var(--db-tx3);text-transform:uppercase;letter-spacing:.05em}
.db-chart-card{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:14px;padding:1.5rem}
.db-chart-card h3{font-family:'Outfit',sans-serif;font-size:1rem;font-weight:600;margin-bottom:1.25rem;color:var(--db-tx)}
.db-chart-card h3 span{color:var(--db-tx3);font-weight:400;font-size:.8125rem}
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
      `}</style>
    </div>
  );
}
