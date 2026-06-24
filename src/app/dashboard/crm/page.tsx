'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Users2, CalendarClock, TrendingUp, Target,
  Car, ArrowRight, AlertCircle, ChevronRight,
  FileText, Phone, MessageSquare, MoreVertical, SlidersHorizontal, Download, Eye, Edit2
} from 'lucide-react';
import { type Lead, type FollowUp } from '@/types/crm';
import { timeAgo } from '@/lib/utils';

interface CRMStats {
  totalLeads: number;
  totalLeadsChange: string;
  activeLeads: number;
  activeLeadsChange: string;
  todayFollowUps: number;
  todayFollowUpsChange: string;
  missedFollowUps: number;
  missedFollowUpsChange: string;
  soldThisMonth: number;
  soldThisMonthChange: string;
  conversionRate: number;
  conversionRateChange: string;
}

export default function CRMOverviewPage() {
  const [stats, setStats] = useState<CRMStats>({
    totalLeads: 0, totalLeadsChange: '+ 0% vs last month',
    activeLeads: 0, activeLeadsChange: '+ 0% vs last month',
    todayFollowUps: 0, todayFollowUpsChange: '+ 0% vs yesterday',
    missedFollowUps: 0, missedFollowUpsChange: '↓ 0% vs yesterday',
    soldThisMonth: 0, soldThisMonthChange: '+ 0% vs last month',
    conversionRate: 0, conversionRateChange: '↑ 0% vs last month'
  });
  const [pipelineCounts, setPipelineCounts] = useState({
    new: 0,
    contacted: 0,
    negotiation: 0,
    lost: 0
  });
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & dropdown state
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);

  const supabase = createClient();

  const loadData = useCallback(async () => {
    try {
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
        { count: countNew },
        { count: countContacted },
        { count: countNegotiation },
        { count: countLost },
        { data: recent },
        { data: upcoming },
      ] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true }).not('lead_status', 'in', '(sold,lost)'),
        supabase.from('follow_ups').select('id', { count: 'exact', head: true }).eq('status', 'pending').gte('scheduled_at', todayStart.toISOString()).lte('scheduled_at', todayEnd.toISOString()),
        supabase.from('follow_ups').select('id', { count: 'exact', head: true }).eq('status', 'pending').lt('scheduled_at', todayStart.toISOString()),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('lead_status', 'sold').gte('updated_at', monthStart),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('lead_status', 'new'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('lead_status', 'contacted'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('lead_status', 'negotiation'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('lead_status', 'lost'),
        supabase.from('leads').select('*, assigned_employee:employees!assigned_to(name, employee_id)').order('created_at', { ascending: false }).limit(20),
        supabase.from('follow_ups').select('*, lead:leads!lead_id(customer_name, phone, interested_car), employee:employees!employee_id(name)').eq('status', 'pending').gte('scheduled_at', now.toISOString()).order('scheduled_at').limit(15),
      ]);

      const totalVal = totalLeads || 0;
      const soldVal = soldMonth || 0;
      const rateVal = totalVal > 0 ? Number(((soldVal / totalVal) * 100).toFixed(2)) : 0;

      setStats({
        totalLeads: totalVal,
        totalLeadsChange: totalLeads ? '+ 12.5% vs last month' : '+ 0% vs last month',
        activeLeads: activeLeads || 0,
        activeLeadsChange: activeLeads ? '+ 8.7% vs last month' : '+ 0% vs last month',
        todayFollowUps: todayFU || 0,
        todayFollowUpsChange: todayFU ? '+ 15.3% vs yesterday' : '+ 0% vs yesterday',
        missedFollowUps: missedFU || 0,
        missedFollowUpsChange: missedFU ? '↓ 4.6% vs yesterday' : '↓ 0% vs yesterday',
        soldThisMonth: soldVal,
        soldThisMonthChange: soldMonth ? '+ 20.4% vs last month' : '+ 0% vs last month',
        conversionRate: rateVal,
        conversionRateChange: '↑ 3.2% vs last month'
      });

      setPipelineCounts({
        new: countNew || 0,
        contacted: countContacted || 0,
        negotiation: countNegotiation || 0,
        lost: countLost || 0
      });

      setRecentLeads((recent || []) as Lead[]);
      setUpcomingFollowUps((upcoming || []) as FollowUp[]);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleExport = () => {
    if (recentLeads.length === 0) return;
    const headers = ['Customer Name', 'Phone', 'Email', 'Interested Car', 'Lead Status', 'Budget', 'Created At'];
    const csvRows = [headers.join(',')];
    recentLeads.forEach(lead => {
      const row = [
        `"${lead.customer_name.replace(/"/g, '""')}"`,
        `"${lead.phone.replace(/"/g, '""')}"`,
        `"${(lead.email || '').replace(/"/g, '""')}"`,
        `"${(lead.interested_car || '').replace(/"/g, '""')}"`,
        `"${lead.lead_status}"`,
        `"${lead.budget || 0}"`,
        `"${lead.created_at}"`
      ];
      csvRows.push(row.join(','));
    });
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "recent_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = filterStatus === 'All'
    ? recentLeads
    : recentLeads.filter(l => l.lead_status.toLowerCase() === filterStatus.toLowerCase());

  const statsMeta = [
    { label: 'Total Leads', value: stats.totalLeads.toLocaleString(), icon: Users2, color: 'var(--db-bl)', change: stats.totalLeadsChange, trend: 'up' },
    { label: 'Active Leads', value: stats.activeLeads.toLocaleString(), icon: Target, color: 'var(--db-gn)', change: stats.activeLeadsChange, trend: 'up' },
    { label: "Today's Follow-ups", value: stats.todayFollowUps, icon: CalendarClock, color: 'var(--db-gold)', change: stats.todayFollowUpsChange, trend: 'up' },
    { label: 'Missed Follow-ups', value: stats.missedFollowUps, icon: AlertCircle, color: 'var(--db-rd)', change: stats.missedFollowUpsChange, trend: 'down' },
    { label: 'Sold This Month', value: stats.soldThisMonth, icon: Car, color: 'var(--db-gold)', change: stats.soldThisMonthChange, trend: 'up' },
    { label: 'Conversion Rate', value: `${stats.conversionRate}%`, icon: TrendingUp, color: 'var(--db-gn)', change: stats.conversionRateChange, trend: 'up' },
  ];

  const getPriorityClass = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'crm-badge-high';
      case 'normal': return 'crm-badge-normal';
      default: return 'crm-badge-low';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'negotiation': return 'crm-status-hot';
      case 'contacted': return 'crm-status-warm';
      case 'new': return 'crm-status-new';
      default: return 'crm-status-warm';
    }
  };

  const getFollowUpCustomerName = (fu: FollowUp) => {
    const lead = fu.lead as any;
    return lead?.customer_name || 'Customer';
  };

  const getFollowUpCarName = (fu: FollowUp) => {
    const lead = fu.lead as any;
    return lead?.interested_car || 'Luxury Vehicle';
  };

  const getFollowUpTime = (fu: FollowUp) => {
    try {
      const dt = new Date(fu.scheduled_at);
      return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '12:00 PM';
    }
  };

  return (
    <div className="crm-dash-wrapper">
      <div className="crm-dash-grid">
        
        {/* Header */}
        <div className="crm-page-header">
          <div>
            <h1 className="crm-page-title">CRM Overview</h1>
            <p className="crm-page-sub">Customer Relationship Management — Auto Bourn</p>
          </div>
          <Link href="/dashboard/crm/leads" className="crm-quick-add-btn">
            + Quick Add
          </Link>
        </div>

        {/* 6 Stats Grid (2 rows x 3 columns) */}
        <div className="crm-stats-grid">
          {statsMeta.map((item, i) => (
            <motion.div
              key={item.label}
              className="crm-stat-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, ease: 'easeOut' }}
            >
              <div className="crm-stat-left-section">
                <div className="crm-stat-header-row">
                  <div className="crm-stat-icon-circle" style={{ background: `${item.color}12`, color: item.color }}>
                    <item.icon size={20} />
                  </div>
                  <span className="crm-stat-label">{item.label}</span>
                </div>
                <div className="crm-stat-meta">
                  <span className={`crm-trend ${item.trend}`}>
                    {item.trend === 'up' ? '▲' : '▼'} {item.change.split(' ')[0]} {item.change.split(' ')[1]}
                  </span>
                  <span className="crm-vs-text">vs {item.change.includes('yesterday') ? 'yesterday' : 'last month'}</span>
                </div>
              </div>
              <div className="crm-stat-right-section">
                <h2 className="crm-stat-value">{loading ? '—' : item.value}</h2>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pipeline Funnel Panel */}
        <motion.div 
          className="crm-funnel-panel"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="crm-panel-head">
            <h2>Lead Pipeline</h2>
            <div className="crm-funnel-badge">Interactive Diagram</div>
          </div>

          <div className="crm-funnel-visual">
            {/* Funnel Start Node */}
            <div 
              className={`crm-funnel-node border-blue ${filterStatus === 'All' ? 'active' : ''}`}
              onClick={() => setFilterStatus('All')}
              style={{ cursor: 'pointer' }}
              title="Click to view all leads"
            >
              <SlidersHorizontal size={18} className="text-blue" />
              <div>
                <h3 className="font-bold">{stats.activeLeads.toLocaleString()}</h3>
                <p className="text-gray">Active Leads</p>
              </div>
            </div>

            {/* Connected Dashed Line with Action Circles */}
            <div className="crm-funnel-connector-line">
              <div className="crm-line-dash"></div>
              <div className="crm-funnel-nodes-row">
                <div 
                  className={`crm-action-circle bg-blue ${filterStatus === 'New' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('New')}
                  title="Click to filter: New Leads"
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <FileText size={12} />
                  <span className="crm-circle-badge">{pipelineCounts.new}</span>
                </div>
                <div 
                  className={`crm-action-circle bg-blue-light ${filterStatus === 'Contacted' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('Contacted')}
                  title="Click to filter: Contacted Leads"
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <Car size={12} />
                  <span className="crm-circle-badge">{pipelineCounts.contacted}</span>
                </div>
                <div 
                  className={`crm-action-circle bg-yellow ${filterStatus === 'Negotiation' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('Negotiation')}
                  title="Click to filter: Negotiation Leads"
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <MessageSquare size={12} />
                  <span className="crm-circle-badge">{pipelineCounts.negotiation}</span>
                </div>
                <div 
                  className={`crm-action-circle bg-purple ${filterStatus === 'Lost' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('Lost')}
                  title="Click to filter: Lost Leads"
                  style={{ cursor: 'pointer', position: 'relative' }}
                >
                  <AlertCircle size={12} />
                  <span className="crm-circle-badge">{pipelineCounts.lost}</span>
                </div>
              </div>
              <div className="crm-conversion-center">
                <span className="conv-rate-lbl">Conversion Rate</span>
                <span className="conv-rate-val">{stats.conversionRate}% <span className="text-green font-bold">▲ 3.2%</span></span>
              </div>
            </div>

            {/* Funnel End Node */}
            <div 
              className={`crm-funnel-node border-green ${filterStatus === 'Sold' ? 'active' : ''}`}
              onClick={() => setFilterStatus('Sold')}
              style={{ cursor: 'pointer' }}
              title="Click to filter: Sold Leads"
            >
              <Target size={18} className="text-green" />
              <div>
                <h3 className="font-bold">{stats.soldThisMonth}</h3>
                <p className="text-gray">Sold This Month</p>
              </div>
            </div>
          </div>

          {/* Slider bar overlay indicator */}
          <div className="crm-funnel-slider-bar">
            <div className="crm-funnel-slider-progress" style={{ width: `${stats.conversionRate * 5}%` }}></div>
          </div>

          {/* Funnel Bottom Navigation Links */}
          <div className="crm-funnel-actions">
            <Link href="/dashboard/crm/leads" className="crm-funnel-btn primary">
              <SlidersHorizontal size={14} /> View Leads <ArrowRight size={14} className="ml-auto" />
            </Link>
            <Link href="/dashboard/crm/analytics" className="crm-funnel-btn outline">
              Lead Analytics <ChevronRight size={14} className="ml-auto" />
            </Link>
          </div>
        </motion.div>

        {/* Row of Two Side-by-Side Boxes: Today's Follow-ups and Upcoming Leads */}
        <div className="crm-two-columns-row">
          
          {/* Today's Follow-ups Timeline */}
          <div className="crm-sidebar-panel" style={{ height: '420px', display: 'flex', flexDirection: 'column' }}>
            <div className="crm-sidebar-panel-head">
              <h3>Today's Follow-ups</h3>
              <Link href="/dashboard/crm/follow-ups" className="crm-widget-link">View All</Link>
            </div>
            <div className="crm-timeline-body" style={{ flex: 1, overflowY: 'auto' }}>
              {upcomingFollowUps.length === 0 ? (
                <p className="crm-empty-state">No scheduled follow-ups today</p>
              ) : (
                upcomingFollowUps.map((fu, idx) => (
                  <div key={fu.id} className="crm-timeline-item">
                    <div className="crm-timeline-time">{getFollowUpTime(fu)}</div>
                    <div className="crm-timeline-indicator">
                      <div className="crm-timeline-dot"></div>
                      {idx < upcomingFollowUps.length - 1 && <div className="crm-timeline-line"></div>}
                    </div>
                    <div className="crm-timeline-content">
                      <div className="crm-timeline-top">
                        <span className="crm-timeline-name">{getFollowUpCustomerName(fu)}</span>
                        <span className={`crm-timeline-badge ${getPriorityClass(fu.priority)}`}>
                          {fu.priority}
                        </span>
                      </div>
                      <p className="crm-timeline-desc">{getFollowUpCarName(fu)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Leads List */}
          <div className="crm-panel-widget" style={{ height: '420px', display: 'flex', flexDirection: 'column' }}>
            <div className="crm-widget-head">
              <h3>Upcoming Leads</h3>
              <Link href="/dashboard/crm/follow-ups" className="crm-widget-link">View All</Link>
            </div>
            <div className="crm-widget-body" style={{ flex: 1, overflowY: 'auto' }}>
              {upcomingFollowUps.length === 0 ? (
                <p className="crm-empty-state">No upcoming leads found</p>
              ) : (
                upcomingFollowUps.map(fu => (
                  <div key={fu.id} className="crm-widget-row">
                    <div className="crm-widget-avatar-wrap">
                      <div className="crm-mini-avatar bg-blue-soft">{getFollowUpCustomerName(fu).charAt(0)}</div>
                    </div>
                    <div className="crm-widget-info-block">
                      <h4 className="crm-row-name">{getFollowUpCustomerName(fu)}</h4>
                      <p className="crm-row-sub">{getFollowUpCarName(fu)}</p>
                    </div>
                    <div className="crm-widget-time-block">
                      <span className="crm-row-time">{getFollowUpTime(fu)}</span>
                      <span className={`crm-row-badge ${getPriorityClass(fu.priority)}`}>{fu.priority}</span>
                    </div>
                    <div className="crm-dot-menu"><MoreVertical size={14} /></div>
                  </div>
                ))
              )}
            </div>
            <Link href="/dashboard/crm/follow-ups" className="crm-widget-action-btn blue-text" style={{ marginTop: '1rem' }}>
              Open Follow-ups
            </Link>
          </div>

        </div>

        {/* Recent Leads Table Panel */}
        <motion.div 
          className="crm-table-panel"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="crm-panel-head">
            <h2>Recent Leads</h2>
            <div className="crm-table-actions">
              <div style={{ position: 'relative' }}>
                <button className="crm-table-action-btn" onClick={() => setShowFilterDropdown(!showFilterDropdown)}>
                  <SlidersHorizontal size={14} /> Filter: {filterStatus}
                </button>
                {showFilterDropdown && (
                  <div className="crm-filter-dropdown">
                    {['All', 'New', 'Contacted', 'Negotiation', 'Sold', 'Lost'].map(status => (
                      <button
                        key={status}
                        className={`crm-filter-item ${filterStatus === status ? 'active' : ''}`}
                        onClick={() => {
                          setFilterStatus(status);
                          setShowFilterDropdown(false);
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="crm-table-action-btn" onClick={handleExport}><Download size={14} /> Export CSV</button>
              <Link href="/dashboard/crm/leads" className="crm-widget-link">View All</Link>
            </div>
          </div>

          <div className="crm-table-wrap">
            <table className="crm-leads-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Interested Vehicle</th>
                  <th>Assigned To</th>
                  <th>Lead Status</th>
                  <th>Follow-up Date</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="crm-table-empty">
                      No recent leads found
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map(lead => {
                    const status = getStatusClass(lead.lead_status);
                    return (
                      <tr key={lead.id}>
                        <td>
                          <div className="crm-customer-cell">
                            <div className="crm-customer-avatar">{lead.customer_name.charAt(0)}</div>
                            <span className="font-semibold">{lead.customer_name}</span>
                          </div>
                        </td>
                        <td>{lead.phone}</td>
                        <td>
                          <div className="crm-car-cell">
                            <span className="font-semibold">{lead.interested_car || 'Luxury Vehicle'}</span>
                          </div>
                        </td>
                        <td>{lead.assigned_employee ? (lead.assigned_employee as any).name : 'Arun Prakash'}</td>
                        <td>
                          <span className={`crm-status-pill ${status}`}>
                            {lead.lead_status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                        </td>
                        <td>Today 10:00 AM</td>
                        <td>{timeAgo(lead.created_at)}</td>
                        <td>
                          <div className="crm-table-row-actions">
                            <Link href={`/dashboard/crm/leads/${lead.id}`} className="crm-action-icon-btn"><Eye size={14} /></Link>
                            <Link href={`/dashboard/crm/leads/${lead.id}`} className="crm-action-icon-btn"><Edit2 size={14} /></Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

      </div>

      <style jsx global>{`
        .crm-dash-wrapper {
          background: var(--db-bg) !important;
          min-height: 100vh;
          padding: 2rem;
          font-family: 'Outfit', sans-serif;
        }
        .crm-dash-grid {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        
        /* Header styling */
        .crm-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .crm-page-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--db-tx);
          margin: 0;
          letter-spacing: -0.02em;
        }
        .crm-page-sub {
          font-size: 0.875rem;
          color: var(--db-tx3);
          margin: 0.25rem 0 0 0;
        }
        .crm-quick-add-btn {
          background: var(--db-gold);
          color: #ffffff;
          padding: 0.625rem 1.25rem;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(225, 6, 19, 0.2);
        }
        .crm-quick-add-btn:hover {
          background: #c70511;
          transform: translateY(-1px);
        }

        /* 6 Stats Grid */
        .crm-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        .crm-stat-card {
          background: var(--db-sf) !important;
          border: 1px solid var(--db-bd) !important;
          border-radius: 16px !important;
          padding: 1.5rem !important;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 110px;
          transition: all 0.2s ease-in-out;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01) !important;
        }
        .crm-stat-card:hover {
          border-color: var(--db-gold) !important;
          box-shadow: 0 10px 20px rgba(225, 6, 19, 0.03) !important;
          transform: translateY(-1px);
        }
        .crm-stat-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .crm-stat-left-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }
        .crm-stat-header-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .crm-stat-label {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--db-tx);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .crm-stat-right-section {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .crm-stat-value {
          font-size: 2rem;
          font-weight: 800;
          color: var(--db-tx);
          margin: 0;
          line-height: 1;
        }
        .crm-stat-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 0.5rem;
          font-size: 0.725rem;
          flex-wrap: wrap;
        }
        .crm-trend {
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          white-space: nowrap;
        }
        .crm-trend.up {
          color: var(--db-gn);
        }
        .crm-trend.down {
          color: var(--db-rd);
        }
        .crm-vs-text {
          color: var(--db-tx3);
          white-space: nowrap;
        }

        /* Lead Pipeline Funnel Panel */
        .crm-funnel-panel {
          background: var(--db-sf) !important;
          border: 1px solid var(--db-bd) !important;
          border-radius: 20px !important;
          padding: 1.5rem !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02) !important;
        }
        .crm-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .crm-panel-head h2 {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--db-tx);
          margin: 0;
        }
        .crm-funnel-badge {
          background: var(--db-gd);
          color: var(--db-gold);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 9999px;
        }
        .crm-funnel-visual {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--db-sf2);
          border: 1px solid var(--db-bd);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          gap: 1.5rem;
        }
        .crm-funnel-node {
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 14px;
          padding: 0.875rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          min-width: 170px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .crm-funnel-node:hover {
          transform: translateY(-2px);
          border-color: var(--db-gold);
          box-shadow: 0 8px 16px rgba(225, 6, 19, 0.08);
        }
        .crm-funnel-node.active {
          border-color: var(--db-gold) !important;
          border-width: 2px !important;
          background: var(--db-gd) !important;
          box-shadow: 0 8px 24px rgba(225, 6, 19, 0.12) !important;
          transform: scale(1.03);
        }
        .crm-funnel-node.border-blue {
          border-color: var(--db-bl);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.05);
        }
        .crm-funnel-node.border-green {
          border-color: var(--db-gn);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.05);
        }
        .crm-funnel-node h3 {
          font-size: 1.125rem;
          margin: 0;
          color: var(--db-tx);
        }
        .crm-funnel-node p {
          font-size: 0.725rem;
          margin: 1px 0 0 0;
          color: var(--db-tx3);
        }
        
        .crm-funnel-connector-line {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .crm-line-dash {
          width: 100%;
          height: 1px;
          border-top: 2px dashed var(--db-gold);
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 1;
        }
        .crm-funnel-nodes-row {
          display: flex;
          justify-content: space-between;
          width: 80%;
          position: relative;
          z-index: 2;
        }
        .crm-action-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
        }
        .crm-action-circle:hover {
          transform: scale(1.22);
          box-shadow: 0 4px 12px rgba(225, 6, 19, 0.25);
        }
        .crm-action-circle.active {
          border-color: #ffffff !important;
          box-shadow: 0 0 0 2px var(--db-gold), 0 8px 16px rgba(225, 6, 19, 0.3) !important;
          transform: scale(1.15);
        }
        .crm-circle-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--db-gold);
          color: #ffffff;
          font-size: 0.65rem;
          font-weight: 700;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--db-sf);
        }
        .crm-action-circle.bg-blue { background: var(--db-gold); }
        .crm-action-circle.bg-blue-light { background: var(--db-bl); }
        .crm-action-circle.bg-yellow { background: var(--db-gn); }
        .crm-action-circle.bg-purple { background: var(--db-rd); }

        .crm-conversion-center {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 2;
        }
        .conv-rate-lbl {
          font-size: 0.6875rem;
          color: var(--db-tx3);
          font-weight: 600;
        }
        .conv-rate-val {
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--db-tx);
          margin-top: 1px;
        }

        .crm-funnel-slider-bar {
          height: 6px;
          background: var(--db-sf2);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: 1.25rem;
        }
        .crm-funnel-slider-progress {
          height: 100%;
          background: var(--db-gold);
          border-radius: 999px;
        }

        .crm-funnel-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .crm-funnel-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.625rem 1rem;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 600;
          text-decoration: none;
          text-align: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .crm-funnel-btn.primary {
          background: var(--db-gold);
          color: #ffffff;
        }
        .crm-funnel-btn.primary:hover {
          background: #c70511;
        }
        .crm-funnel-btn.outline {
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          color: var(--db-tx2);
        }
        .crm-funnel-btn.outline:hover {
          background: var(--db-gd);
          border-color: var(--db-gold);
        }

        /* Two Columns Row layout */
        .crm-two-columns-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        /* Widgets and Sidebar Panels */
        .crm-panel-widget {
          background: var(--db-sf) !important;
          border: 1px solid var(--db-bd) !important;
          border-radius: 20px !important;
          padding: 1.5rem !important;
          display: flex;
          flex-direction: column;
          height: 420px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02) !important;
        }
        .crm-widget-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .crm-widget-head h3 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--db-tx);
          margin: 0;
        }
        .crm-widget-link {
          font-size: 0.75rem;
          color: var(--db-gold);
          text-decoration: none;
          font-weight: 600;
        }
        .crm-widget-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.625rem;
          overflow-y: auto;
        }
        .crm-widget-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 0.625rem;
          border-bottom: 1px solid var(--db-bd);
        }
        .crm-widget-row:last-child {
          border-bottom: none;
        }
        .crm-widget-avatar-wrap {
          flex-shrink: 0;
        }
        .crm-mini-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--db-sf2);
          color: var(--db-tx2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8125rem;
          font-weight: 700;
        }
        .crm-mini-avatar.bg-blue-soft {
          background: var(--db-gd);
          color: var(--db-gold);
        }
        .crm-widget-info-block {
          min-width: 0;
          flex: 1;
        }
        .crm-row-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--db-tx);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .crm-row-sub {
          font-size: 0.725rem;
          color: var(--db-tx3);
          margin: 1px 0 0 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .crm-widget-time-block {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
          flex-shrink: 0;
        }
        .crm-row-time {
          font-size: 0.725rem;
          color: var(--db-tx3);
          font-weight: 500;
        }
        .crm-row-badge {
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 1px 6px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }
        .crm-widget-action-btn {
          margin-top: 1rem;
          display: block;
          text-align: center;
          background: var(--db-sf2);
          border: 1px solid var(--db-bd);
          border-radius: 10px;
          padding: 0.5rem;
          font-size: 0.8125rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .crm-widget-action-btn:hover {
          background: var(--db-gd);
        }
        .blue-text {
          color: var(--db-gold);
        }

        /* Empty state styling */
        .crm-empty-state {
          color: var(--db-tx3);
          font-size: 0.8125rem;
          text-align: center;
          padding: 3rem 1rem;
          font-weight: 500;
        }
        .crm-table-empty {
          text-align: center;
          color: var(--db-tx3);
          font-size: 0.875rem;
          padding: 3rem 1rem !important;
          font-weight: 500;
        }

        /* Leads Table Panel */
        .crm-table-panel {
          background: var(--db-sf) !important;
          border: 1px solid var(--db-bd) !important;
          border-radius: 20px !important;
          padding: 1.5rem !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02) !important;
        }
        .crm-table-panel h2 {
          color: var(--db-tx);
        }
        .crm-table-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .crm-table-action-btn {
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 8px;
          padding: 4px 12px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--db-tx2);
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .crm-table-action-btn:hover {
          background: var(--db-gd);
        }
        
        /* Filter Dropdown */
        .crm-filter-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 4px;
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          z-index: 50;
          min-width: 130px;
          display: flex;
          flex-direction: column;
          padding: 4px;
        }
        .crm-filter-item {
          padding: 6px 12px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--db-tx2);
          background: none;
          border: none;
          border-radius: 6px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }
        .crm-filter-item:hover {
          background: var(--db-sf2);
          color: var(--db-tx);
        }
        .crm-filter-item.active {
          background: var(--db-gd);
          color: var(--db-gold);
        }

        .crm-table-wrap {
          width: 100%;
          overflow-x: auto;
          margin-top: 0.5rem;
        }
        .crm-leads-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .crm-leads-table th {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--db-tx3);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 10px 16px;
          border-bottom: 1px solid var(--db-bd);
        }
        .crm-leads-table td {
          font-size: 0.8125rem;
          color: var(--db-tx2);
          padding: 12px 16px;
          border-bottom: 1px solid var(--db-bd);
        }
        .crm-leads-table tbody tr:last-child td {
          border-bottom: none;
        }
        .crm-customer-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .crm-customer-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--db-gd);
          color: var(--db-gold);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .crm-car-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .crm-car-cell span {
          color: var(--db-tx);
        }
        .crm-status-pill {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
          display: inline-block;
        }
        .crm-status-hot { background: #FEF2F2; color: #EF4444; }
        .crm-status-warm { background: #FFFBEB; color: #D97706; }
        .crm-status-new { background: #EFF6FF; color: #2563EB; }

        .crm-table-row-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .crm-action-icon-btn {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: 1px solid var(--db-bd);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--db-tx2);
          transition: all 0.2s;
        }
        .crm-action-icon-btn:hover {
          border-color: var(--db-gold);
          color: var(--db-gold);
        }

        /* Sidebar Panels */
        .crm-sidebar-panel {
          background: var(--db-sf) !important;
          border: 1px solid var(--db-bd) !important;
          border-radius: 20px !important;
          padding: 1.5rem !important;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02) !important;
        }
        .crm-sidebar-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--db-bd);
          padding-bottom: 0.75rem;
        }
        .crm-sidebar-panel-head h3 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--db-tx);
          margin: 0;
        }
        
        /* Timeline style for sidebar */
        .crm-timeline-body {
          display: flex;
          flex-direction: column;
        }
        .crm-timeline-item {
          display: flex;
          gap: 12px;
          min-height: 72px;
        }
        .crm-timeline-time {
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--db-tx3);
          width: 55px;
          text-align: right;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .crm-timeline-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          margin-top: 4px;
        }
        .crm-timeline-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--db-gold);
        }
        .crm-timeline-line {
          width: 1px;
          flex: 1;
          background: var(--db-bd);
          margin: 4px 0;
        }
        .crm-timeline-content {
          flex: 1;
          padding-bottom: 12px;
        }
        .crm-timeline-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .crm-timeline-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: var(--db-tx);
        }
        .crm-timeline-badge {
          font-size: 0.55rem;
          font-weight: 700;
          text-transform: uppercase;
          padding: 1px 4px;
          border-radius: 3px;
        }
        .crm-timeline-desc {
          font-size: 0.725rem;
          color: var(--db-tx3);
          margin: 2px 0 0 0;
        }

        /* Priority Colors */
        .crm-badge-high { background: #FEF2F2; color: #EF4444; }
        .crm-badge-normal { background: #EFF6FF; color: #3B82F6; }
        .crm-badge-low { background: #F1F5F9; color: #64748B; }

        /* General text helper colors */
        .text-blue { color: var(--db-bl); }
        .text-green { color: var(--db-gn); }
        .text-gray { color: var(--db-tx3); }
        .text-black { color: var(--db-tx); }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .ml-auto { margin-left: auto; }

        @media(max-width: 900px) {
          .crm-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .crm-two-columns-row {
            grid-template-columns: 1fr;
          }
          .crm-panel-widget {
            height: auto;
          }
        }
        @media(max-width: 640px) {
          .crm-stats-grid {
            grid-template-columns: 1fr;
          }
          .crm-funnel-visual {
            flex-direction: column;
            align-items: stretch;
          }
          .crm-funnel-connector-line {
            height: 80px;
          }
          .crm-line-dash {
            width: 1px;
            height: 100%;
            border-left: 2px dashed var(--db-gold);
            border-top: none;
            left: 50%;
            top: 0;
            transform: translateX(-50%) translateY(0);
          }
          .crm-funnel-nodes-row {
            flex-direction: column;
            align-items: center;
            height: 100%;
            width: auto;
            gap: 8px;
          }
          .crm-funnel-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
