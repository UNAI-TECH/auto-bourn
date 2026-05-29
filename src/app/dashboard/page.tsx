'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Car, Users, TrendingUp, ShoppingCart, Upload, Calendar, Award, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { DashboardStats, EmployeePerformance, BrandAnalytics } from '@/types/database';

const BRAND_RED = '#E10613';
const COLORS = [BRAND_RED, '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#06b6d4'];

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [uploadActivity, setUploadActivity] = useState<{ date: string; count: number }[]>([]);
  const [empPerf, setEmpPerf] = useState<EmployeePerformance[]>([]);
  const [brandData, setBrandData] = useState<BrandAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

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
          <motion.div key={card.label} className="db-stat-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="db-stat-icon" style={{ background: `${card.color}15`, color: card.color }}><card.icon size={20} /></div>
            <div className="db-stat-info">
              <span className="db-stat-val">{card.value}</span>
              <span className="db-stat-lbl">{card.label}</span>
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
              <BarChart data={empPerf.slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={{ fill: 'var(--db-tx3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: 'var(--db-tx2)', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ background: 'var(--db-sf)', border: '1px solid var(--db-bd)', borderRadius: 10, color: 'var(--db-tx)', fontSize: 13 }} />
                <Bar dataKey="total_uploads" fill={BRAND_RED} radius={[0, 6, 6, 0]} name="Uploads" />
                <Bar dataKey="total_sold" fill="#22c55e" radius={[0, 6, 6, 0]} name="Sold" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="db-empty">No employee data yet</p>}
        </motion.div>

        <motion.div className="db-chart-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <h3>Brand Analytics</h3>
          {brandData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={brandData.slice(0, 8)}>
                <XAxis dataKey="brand" tick={{ fill: 'var(--db-tx3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--db-tx3)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'var(--db-sf)', border: '1px solid var(--db-bd)', borderRadius: 10, color: 'var(--db-tx)', fontSize: 13 }} />
                <Bar dataKey="total" fill={BRAND_RED} radius={[6, 6, 0, 0]} name="Total" />
                <Bar dataKey="sold" fill="#ef4444" radius={[6, 6, 0, 0]} name="Sold" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="db-empty">No brand data yet</p>}
        </motion.div>
      </div>

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
      `}</style>
    </div>
  );
}
