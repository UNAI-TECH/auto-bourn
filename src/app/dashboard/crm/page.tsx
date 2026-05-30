'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users2, PhoneCall, CalendarClock, TrendingUp, Target,
  Car, Award, ArrowRight, Clock, CheckCircle2, AlertCircle,
  ChevronRight
} from 'lucide-react';
import { LEAD_STAGES, formatBudget, type Lead, type FollowUp } from '@/types/crm';
import { timeAgo } from '@/lib/utils';

interface CRMStats {
  totalLeads: number;
  activeLeads: number;
  todayFollowUps: number;
  missedFollowUps: number;
  soldThisMonth: number;
  conversionRate: number;
}

interface StageCount { key: string; label: string; color: string; count: number; }

export default function CRMOverviewPage() {
  const [stats, setStats] = useState<CRMStats>({ totalLeads: 0, activeLeads: 0, todayFollowUps: 0, missedFollowUps: 0, soldThisMonth: 0, conversionRate: 0 });
  const [stageCounts, setStageCounts] = useState<StageCount[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadData = useCallback(async () => {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      { count: totalLeads },
      { count: activeLeads },
      { count: todayFU },
      { count: missedFU },
      { count: soldMonth },
      { data: stageData },
      { data: recent },
      { data: upcoming },
    ] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }).not('lead_status', 'in', '(sold,lost)'),
      supabase.from('follow_ups').select('id', { count: 'exact', head: true }).eq('status', 'pending').gte('scheduled_at', todayStart.toISOString()).lte('scheduled_at', todayEnd.toISOString()),
      supabase.from('follow_ups').select('id', { count: 'exact', head: true }).eq('status', 'pending').lt('scheduled_at', todayStart.toISOString()),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('lead_status', 'sold').gte('updated_at', monthStart),
      supabase.from('leads').select('lead_status'),
      supabase.from('leads').select('*, assigned_employee:employees!assigned_to(name, employee_id)').order('created_at', { ascending: false }).limit(5),
      supabase.from('follow_ups').select('*, lead:leads!lead_id(customer_name, phone), employee:employees!employee_id(name)').eq('status', 'pending').gte('scheduled_at', now.toISOString()).order('scheduled_at').limit(5),
    ]);

    // Stage counts
    const counts: Record<string, number> = {};
    (stageData || []).forEach((r: { lead_status: string }) => { counts[r.lead_status] = (counts[r.lead_status] || 0) + 1; });
    setStageCounts(LEAD_STAGES.map(s => ({ key: s.key, label: s.label, color: s.color, count: counts[s.key] || 0 })));

    const total = totalLeads || 0;
    const sold = soldMonth || 0;
    setStats({
      totalLeads: total,
      activeLeads: activeLeads || 0,
      todayFollowUps: todayFU || 0,
      missedFollowUps: missedFU || 0,
      soldThisMonth: sold,
      conversionRate: total > 0 ? Math.round((sold / total) * 100) : 0,
    });

    setRecentLeads((recent || []) as Lead[]);
    setUpcomingFollowUps((upcoming || []) as FollowUp[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const statCards = [
    { label: 'Total Leads', value: stats.totalLeads, icon: Users2, color: '#6366f1', sub: 'All time' },
    { label: 'Active Leads', value: stats.activeLeads, icon: Target, color: '#3b82f6', sub: 'In pipeline' },
    { label: "Today's Follow-ups", value: stats.todayFollowUps, icon: CalendarClock, color: '#f59e0b', sub: 'Pending today' },
    { label: 'Missed Follow-ups', value: stats.missedFollowUps, icon: AlertCircle, color: '#E10613', sub: 'Need attention' },
    { label: 'Sold This Month', value: stats.soldThisMonth, icon: Car, color: '#22c55e', sub: 'This month' },
    { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: TrendingUp, color: '#ec4899', sub: 'Lead to sale' },
  ];

  return (
    <div className="db-page">
      <div className="db-page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="db-page-title">CRM Overview</h1>
          <p className="db-page-sub">Customer Relationship Management — Auto Bourn</p>
        </div>
        <Link href="/dashboard/crm/leads" className="crm-btn-primary">
          <PhoneCall size={16} /> New Lead
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="crm-stat-grid">
        {statCards.map((card, i) => (
          <motion.div key={card.label} className="crm-stat-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className="crm-stat-icon" style={{ background: `${card.color}18`, color: card.color }}>
              <card.icon size={22} />
            </div>
            <div className="crm-stat-body">
              <div className="crm-stat-val">{loading ? '—' : card.value}</div>
              <div className="crm-stat-label">{card.label}</div>
              <div className="crm-stat-sub">{card.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pipeline Funnel */}
      <div className="crm-two-col" style={{ marginTop: '1.5rem' }}>
        <motion.div className="crm-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="crm-panel-head">
            <h2>Lead Pipeline</h2>
            <Link href="/dashboard/crm/leads" className="crm-link">View Kanban <ChevronRight size={14} /></Link>
          </div>
          <div className="crm-pipeline">
            {stageCounts.map(s => {
              const max = Math.max(...stageCounts.map(x => x.count), 1);
              const pct = Math.round((s.count / max) * 100);
              return (
                <div key={s.key} className="crm-pipe-row">
                  <span className="crm-pipe-label" style={{ color: s.color }}>{s.label}</span>
                  <div className="crm-pipe-bar-wrap">
                    <motion.div className="crm-pipe-bar" style={{ background: s.color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.4, duration: 0.6 }} />
                  </div>
                  <span className="crm-pipe-count">{loading ? '—' : s.count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Upcoming Follow-ups */}
        <motion.div className="crm-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="crm-panel-head">
            <h2>Upcoming Follow-ups</h2>
            <Link href="/dashboard/crm/follow-ups" className="crm-link">View All <ChevronRight size={14} /></Link>
          </div>
          {loading ? <div className="crm-skel-list">{Array(4).fill(0).map((_, i) => <div key={i} className="crm-skel" style={{ height: 56 }} />)}</div>
           : upcomingFollowUps.length === 0 ? <p className="crm-empty">No upcoming follow-ups</p>
           : upcomingFollowUps.map(fu => {
            const lead = fu.lead as { customer_name: string; phone: string } | null;
            const emp = fu.employee as { name: string } | null;
            const dt = new Date(fu.scheduled_at);
            return (
              <div key={fu.id} className="crm-fu-row">
                <div className={`crm-fu-type ${fu.follow_up_type}`}><Clock size={13} /></div>
                <div className="crm-fu-body">
                  <div className="crm-fu-name">{lead?.customer_name || '—'}</div>
                  <div className="crm-fu-meta">{fu.follow_up_type} · {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · {emp?.name}</div>
                </div>
                <span className={`crm-prio ${fu.priority}`}>{fu.priority}</span>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Recent Leads */}
      <motion.div className="crm-panel" style={{ marginTop: '1.5rem' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="crm-panel-head">
          <h2>Recent Leads</h2>
          <Link href="/dashboard/crm/leads" className="crm-link">View All <ChevronRight size={14} /></Link>
        </div>
        <div className="crm-lead-table">
          {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="crm-skel" style={{ height: 48 }} />) :
          recentLeads.length === 0 ? <p className="crm-empty">No leads yet. <Link href="/dashboard/crm/leads" style={{ color: 'var(--db-gold)' }}>Add your first lead →</Link></p> :
          recentLeads.map((lead, i) => {
            const stage = LEAD_STAGES.find(s => s.key === lead.lead_status);
            const emp = lead.assigned_employee as { name: string } | null;
            return (
              <motion.div key={lead.id} className="crm-lead-row" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + i * 0.04 }}>
                <div className="crm-lead-av" style={{ background: stage?.bg, color: stage?.color }}>
                  {lead.customer_name.charAt(0).toUpperCase()}
                </div>
                <div className="crm-lead-info">
                  <div className="crm-lead-name">{lead.customer_name}</div>
                  <div className="crm-lead-phone">{lead.phone} {lead.interested_car && `· ${lead.interested_car}`}</div>
                </div>
                <span className="crm-status-badge" style={{ background: stage?.bg, color: stage?.color }}>{stage?.label}</span>
                <div className="crm-lead-meta">
                  <span>{emp?.name || 'Unassigned'}</span>
                  <span>{timeAgo(lead.created_at)}</span>
                </div>
                <Link href={`/dashboard/crm/leads/${lead.id}`} className="crm-row-btn"><ArrowRight size={15} /></Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div className="crm-quick-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        {[
          { label: 'Add New Lead', href: '/dashboard/crm/leads', icon: PhoneCall, color: '#E10613' },
          { label: "Today's Follow-ups", href: '/dashboard/crm/follow-ups', icon: CalendarClock, color: '#f59e0b' },
          { label: 'CRM Analytics', href: '/dashboard/crm/analytics', icon: TrendingUp, color: '#6366f1' },
          { label: 'Leaderboard', href: '/dashboard/crm/analytics', icon: Award, color: '#22c55e' },
        ].map(a => (
          <Link key={a.label} href={a.href} className="crm-qa-card">
            <div className="crm-qa-icon" style={{ background: `${a.color}18`, color: a.color }}><a.icon size={20} /></div>
            <span>{a.label}</span>
            <ArrowRight size={14} style={{ marginLeft: 'auto', opacity: .5 }} />
          </Link>
        ))}
      </motion.div>

      <style jsx>{`
.db-page{padding:0}.db-page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem}
.db-page-title{font-family:'Outfit',sans-serif;font-size:1.5rem;font-weight:800;margin:0;color:var(--db-tx)}
.db-page-sub{color:var(--db-tx3);font-size:.8125rem;margin:.25rem 0 0}
.crm-btn-primary{display:flex;align-items:center;gap:.5rem;background:linear-gradient(135deg,#E10613,#c70511);color:#fff;border:none;padding:.625rem 1.25rem;border-radius:10px;font-size:.875rem;font-weight:600;font-family:inherit;cursor:pointer;text-decoration:none;transition:all .2s}
.crm-btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(225,6,19,.3)}
.crm-stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem}
.crm-stat-card{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:16px;padding:1.25rem;display:flex;gap:1rem;align-items:flex-start;transition:all .2s}
.crm-stat-card:hover{border-color:var(--db-gold);box-shadow:0 4px 20px var(--db-gg)}
.crm-stat-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.crm-stat-body{display:flex;flex-direction:column;gap:2px}
.crm-stat-val{font-family:'Outfit',sans-serif;font-size:1.625rem;font-weight:800;line-height:1;color:var(--db-tx)}
.crm-stat-label{font-size:.8125rem;font-weight:600;color:var(--db-tx)}
.crm-stat-sub{font-size:.6875rem;color:var(--db-tx3)}
.crm-two-col{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.crm-panel{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:16px;padding:1.25rem}
.crm-panel-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
.crm-panel-head h2{font-family:'Outfit',sans-serif;font-size:1rem;font-weight:700;margin:0;color:var(--db-tx)}
.crm-link{display:flex;align-items:center;gap:2px;font-size:.75rem;color:var(--db-gold);text-decoration:none;font-weight:500}
.crm-pipeline{display:flex;flex-direction:column;gap:.5rem}
.crm-pipe-row{display:grid;grid-template-columns:150px 1fr 40px;align-items:center;gap:.75rem}
.crm-pipe-label{font-size:.75rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.crm-pipe-bar-wrap{height:8px;background:var(--db-sf2);border-radius:99px;overflow:hidden}
.crm-pipe-bar{height:100%;border-radius:99px}
.crm-pipe-count{font-size:.8125rem;font-weight:700;color:var(--db-tx);text-align:right}
.crm-fu-row{display:flex;align-items:center;gap:.75rem;padding:.625rem 0;border-bottom:1px solid var(--db-bd)}
.crm-fu-row:last-child{border-bottom:none}
.crm-fu-type{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:var(--db-sf2);color:var(--db-tx3);flex-shrink:0}
.crm-fu-type.call{background:rgba(59,130,246,.12);color:#3b82f6}
.crm-fu-type.whatsapp{background:rgba(34,197,94,.12);color:#22c55e}
.crm-fu-type.meeting{background:rgba(245,158,11,.12);color:#f59e0b}
.crm-fu-body{flex:1;min-width:0}
.crm-fu-name{font-size:.875rem;font-weight:600;color:var(--db-tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.crm-fu-meta{font-size:.6875rem;color:var(--db-tx3);margin-top:1px}
.crm-prio{font-size:.6rem;font-weight:700;text-transform:uppercase;padding:2px 6px;border-radius:99px;letter-spacing:.04em}
.crm-prio.high{background:rgba(225,6,19,.12);color:#E10613}
.crm-prio.normal{background:rgba(59,130,246,.12);color:#3b82f6}
.crm-prio.low{background:var(--db-sf2);color:var(--db-tx3)}
.crm-lead-table{display:flex;flex-direction:column;gap:.5rem}
.crm-lead-row{display:flex;align-items:center;gap:.75rem;padding:.625rem .75rem;border-radius:10px;transition:all .2s;background:var(--db-sf2)}
.crm-lead-row:hover{border:1px solid var(--db-gold)}
.crm-lead-av{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.9rem;flex-shrink:0;font-family:'Outfit',sans-serif}
.crm-lead-info{flex:1;min-width:0}
.crm-lead-name{font-size:.875rem;font-weight:600;color:var(--db-tx)}
.crm-lead-phone{font-size:.75rem;color:var(--db-tx3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.crm-status-badge{font-size:.6875rem;font-weight:600;padding:.25rem .625rem;border-radius:99px;white-space:nowrap;flex-shrink:0}
.crm-lead-meta{display:flex;flex-direction:column;align-items:flex-end;gap:2px;font-size:.6875rem;color:var(--db-tx3);flex-shrink:0}
.crm-row-btn{width:30px;height:30px;background:var(--db-sf);border:1px solid var(--db-bd);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--db-tx2);text-decoration:none;transition:all .2s;flex-shrink:0}
.crm-row-btn:hover{border-color:var(--db-gold);color:var(--db-gold)}
.crm-quick-actions{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-top:1.5rem}
.crm-qa-card{display:flex;align-items:center;gap:.75rem;background:var(--db-sf);border:1px solid var(--db-bd);border-radius:14px;padding:1rem 1.25rem;text-decoration:none;color:var(--db-tx);font-size:.875rem;font-weight:500;transition:all .2s}
.crm-qa-card:hover{border-color:var(--db-gold);box-shadow:0 4px 16px var(--db-gg)}
.crm-qa-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.crm-empty{color:var(--db-tx3);font-size:.875rem;padding:1.5rem 0;text-align:center}
.crm-skel-list{display:flex;flex-direction:column;gap:.5rem}
.crm-skel{background:var(--db-sf2);border-radius:10px;animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@media(max-width:768px){.crm-two-col{grid-template-columns:1fr}.crm-pipe-row{grid-template-columns:100px 1fr 30px}}
      `}</style>
    </div>
  );
}
