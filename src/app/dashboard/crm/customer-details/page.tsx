'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDashboard } from '@/app/dashboard/layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Filter, Phone, MessageSquare, Mail, 
  Car, Calendar, Briefcase, ChevronDown, CheckCircle, 
  XCircle, Clock, MapPin, DollarSign 
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { Lead, LeadStatus } from '@/types/crm';
import { LEAD_STAGES, formatBudget } from '@/types/crm';

interface MappedLead extends Lead {
  assigned_employee?: {
    name: string;
    employee_id: string;
  } | null;
}

export default function CustomerDetailsPage() {
  const { employee } = useDashboard();
  const [leads, setLeads] = useState<MappedLead[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timelineFilter, setTimelineFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  
  const supabase = createClient();

  const fetchLeadsAndEmployees = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch leads with assigned employee details
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*, assigned_employee:employees!assigned_to(name, employee_id)')
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;
      setLeads((leadsData || []) as MappedLead[]);

      // 2. Fetch active employees for filters
      const { data: empsData, error: empsError } = await supabase
        .from('employees')
        .select('id, name')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (empsError) throw empsError;
      setEmployees(empsData || []);
    } catch (error) {
      console.error('Error loading customer directory details:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeadsAndEmployees();
  }, [fetchLeadsAndEmployees]);

  // Filter logic
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (lead.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.interested_car || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.lead_status === statusFilter;
    const matchesTimeline = timelineFilter === 'all' || lead.purchase_timeline === timelineFilter;
    const matchesEmployee = employeeFilter === 'all' || lead.assigned_to === employeeFilter;

    return matchesSearch && matchesStatus && matchesTimeline && matchesEmployee;
  });

  // Calculate statistics
  const totalCount = leads.length;
  const activeCount = leads.filter(l => !['sold', 'lost'].includes(l.lead_status)).length;
  const wonCount = leads.filter(l => l.lead_status === 'sold').length;
  const lostCount = leads.filter(l => l.lead_status === 'lost').length;

  const getStageStyle = (status: LeadStatus) => {
    const stage = LEAD_STAGES.find(s => s.key === status);
    return {
      bg: stage?.bg || 'rgba(107, 114, 128, 0.12)',
      color: stage?.color || '#6b7280',
      label: stage?.label || status
    };
  };

  const getWhatsAppLink = (name: string, phone: string) => {
    const formattedPhone = phone.replace(/\D/g, '');
    const cleanPhone = formattedPhone.startsWith('91') || formattedPhone.length > 10 
      ? formattedPhone 
      : `91${formattedPhone}`;
    return `https://wa.me/${cleanPhone}`;
  };

  return (
    <div className="cust-directory-container">
      {/* Title & Stats */}
      <div className="cust-header-section">
        <div>
          <h1 className="cust-title">Customer Registry & Details</h1>
          <p className="cust-subtitle">Comprehensive overview of all leads, client profiles, and contact details</p>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="cust-stats-grid">
        <div className="cust-stat-card">
          <div className="cust-stat-icon-wrap" style={{ background: 'rgba(225, 6, 19, 0.1)', color: '#E10613' }}>
            <Users size={20} />
          </div>
          <div>
            <div className="cust-stat-val">{totalCount}</div>
            <div className="cust-stat-lbl">Total Customers</div>
          </div>
        </div>

        <div className="cust-stat-card">
          <div className="cust-stat-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Clock size={20} />
          </div>
          <div>
            <div className="cust-stat-val">{activeCount}</div>
            <div className="cust-stat-lbl">Active Discussions</div>
          </div>
        </div>

        <div className="cust-stat-card">
          <div className="cust-stat-icon-wrap" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="cust-stat-val">{wonCount}</div>
            <div className="cust-stat-lbl">Closed Deals (Won)</div>
          </div>
        </div>

        <div className="cust-stat-card">
          <div className="cust-stat-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <XCircle size={20} />
          </div>
          <div>
            <div className="cust-stat-val">{lostCount}</div>
            <div className="cust-stat-lbl">Lost Leads</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="cust-filter-panel">
        <div className="cust-search-box">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search by name, phone, email, interested car, city..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="cust-filters-row">
          <div className="cust-filter-select-wrap">
            <Filter size={14} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Stages</option>
              {LEAD_STAGES.map(stage => (
                <option key={stage.key} value={stage.key}>{stage.label}</option>
              ))}
            </select>
          </div>

          <div className="cust-filter-select-wrap">
            <Calendar size={14} />
            <select value={timelineFilter} onChange={(e) => setTimelineFilter(e.target.value)}>
              <option value="all">All Timelines</option>
              <option value="Within 1 week">Within 1 week</option>
              <option value="1–2 weeks">1–2 weeks</option>
              <option value="1 month">1 month</option>
              <option value="1–3 months">1–3 months</option>
              <option value="3–6 months">3–6 months</option>
              <option value="6+ months">6+ months</option>
            </select>
          </div>

          <div className="cust-filter-select-wrap">
            <Users size={14} />
            <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
              <option value="all">All Assigned Reps</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="cust-table-card">
        {loading ? (
          <div className="cust-loading-state">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} 
              className="cust-spinner" 
            />
            <p>Loading customer registry details...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="cust-empty-state">
            <Users size={40} />
            <h3>No Customer Details Found</h3>
            <p>Try modifying your filters or search keywords to locate details.</p>
          </div>
        ) : (
          <div className="cust-table-responsive">
            <table className="cust-table">
              <thead>
                <tr>
                  <th>Customer Profile</th>
                  <th>Contact Info</th>
                  <th>Location & Occupation</th>
                  <th>Car Preference & Budget</th>
                  <th>Timeline & Rep</th>
                  <th>Stage Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => {
                  const stageStyle = getStageStyle(lead.lead_status);
                  return (
                    <tr key={lead.id}>
                      {/* Customer Profile Column */}
                      <td>
                        <div className="cust-primary-cell">
                          <div className="cust-avatar-placeholder">
                            {lead.customer_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="cust-name-text">{lead.customer_name}</div>
                            {lead.occupation && (
                              <div className="cust-sub-text">
                                <Briefcase size={12} /> {lead.occupation}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact Info Column */}
                      <td>
                        <div className="cust-contact-cell">
                          <a href={`tel:${lead.phone}`} className="cust-contact-link" title="Call Customer">
                            <Phone size={12} /> {lead.phone}
                          </a>
                          {lead.email ? (
                            <a href={`mailto:${lead.email}`} className="cust-contact-link mail" title="Email Customer">
                              <Mail size={12} /> {lead.email}
                            </a>
                          ) : (
                            <span className="cust-no-info">—</span>
                          )}
                        </div>
                      </td>

                      {/* Location & Occupation Column */}
                      <td>
                        <div className="cust-location-cell">
                          {lead.city || lead.state ? (
                            <span className="cust-loc-text">
                              <MapPin size={12} /> {lead.city || ''}{lead.city && lead.state ? `, ` : ''}{lead.state || ''}
                            </span>
                          ) : (
                            <span className="cust-no-info">—</span>
                          )}
                          <span className="cust-sub-text" style={{ textTransform: 'capitalize' }}>Source: {lead.source.replace('_', ' ')}</span>
                        </div>
                      </td>

                      {/* Preference & Budget */}
                      <td>
                        <div className="cust-pref-cell">
                          {lead.interested_car ? (
                            <span className="cust-car-badge">
                              <Car size={12} /> {lead.interested_car.replace(/^Get In Touch:\s*/i, '')}
                            </span>
                          ) : lead.preferred_brand ? (
                            <span className="cust-car-badge brand-only">
                              Preferred: {lead.preferred_brand}
                            </span>
                          ) : (
                            <span className="cust-no-info">General Inquiry</span>
                          )}
                          {lead.budget ? (
                            <span className="cust-budget-text">
                              Budget: {formatBudget(lead.budget)}
                            </span>
                          ) : (
                            <span className="cust-sub-text">Budget: Not specified</span>
                          )}
                        </div>
                      </td>

                      {/* Timeline & Assignee Column */}
                      <td>
                        <div className="cust-rep-cell">
                          <span className="cust-timeline-badge">
                            {lead.purchase_timeline || 'No timeline'}
                          </span>
                          <span className="cust-sub-text">
                            Rep: {lead.assigned_employee?.name || 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      {/* Stage Status Column */}
                      <td>
                        <span 
                          className="cust-status-badge" 
                          style={{ background: stageStyle.bg, color: stageStyle.color }}
                        >
                          {stageStyle.label}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="cust-actions-wrap">
                          <a 
                            href={getWhatsAppLink(lead.customer_name, lead.phone)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="cust-btn-icon wa"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare size={14} />
                          </a>
                          <Link 
                            href={`/dashboard/crm/leads/${lead.id}`} 
                            className="cust-view-profile-btn"
                            title="View Activity Details"
                          >
                            View Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .cust-directory-container {
          width: 100%;
          font-family: inherit;
        }

        .cust-header-section {
          margin-bottom: 1.5rem;
        }

        .cust-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--db-tx, #2a2a2a);
          margin: 0;
        }

        .cust-subtitle {
          color: var(--db-tx2, rgba(42, 42, 42, 0.7));
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        /* Stats Summary Grid */
        .cust-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .cust-stat-card {
          background: var(--db-sf, #ffffff);
          border: 1px solid var(--db-bd, rgba(0, 0, 0, 0.08));
          border-radius: 14px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -1px rgba(0,0,0,0.01);
        }

        .cust-stat-icon-wrap {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .cust-stat-val {
          font-family: 'Outfit', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--db-tx, #2a2a2a);
          line-height: 1.2;
        }

        .cust-stat-lbl {
          font-size: 0.75rem;
          color: var(--db-tx2, rgba(42, 42, 42, 0.6));
          font-weight: 500;
        }

        /* Search & Filters Panel */
        .cust-filter-panel {
          background: var(--db-sf, #ffffff);
          border: 1px solid var(--db-bd, rgba(0, 0, 0, 0.08));
          border-radius: 14px;
          padding: 1rem;
          margin-bottom: 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .cust-search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--db-sf2, #f5f5f5);
          border: 1px solid var(--db-bd, rgba(0, 0, 0, 0.08));
          border-radius: 10px;
          padding: 0.5rem 1rem;
          flex: 1;
          min-width: 280px;
        }

        .cust-search-box svg {
          color: var(--db-tx3, rgba(0, 0, 0, 0.4));
          flex-shrink: 0;
        }

        .cust-search-box input {
          background: none;
          border: none;
          outline: none;
          color: var(--db-tx, #2a2a2a);
          font-size: 0.8125rem;
          width: 100%;
          font-family: inherit;
        }

        .cust-search-box input::placeholder {
          color: var(--db-tx3, rgba(0, 0, 0, 0.4));
        }

        .cust-filters-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .cust-filter-select-wrap {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          background: var(--db-sf, #ffffff);
          border: 1px solid var(--db-bd, rgba(0, 0, 0, 0.08));
          border-radius: 10px;
          padding: 0.5rem 0.75rem;
          color: var(--db-tx3, rgba(0, 0, 0, 0.5));
        }

        .cust-filter-select-wrap select {
          border: none;
          outline: none;
          background: none;
          font-family: inherit;
          font-size: 0.8125rem;
          color: var(--db-tx2, rgba(42, 42, 42, 0.8));
          font-weight: 600;
          cursor: pointer;
        }

        /* Customer Table Styles */
        .cust-table-card {
          background: var(--db-sf, #ffffff);
          border: 1px solid var(--db-bd, rgba(0, 0, 0, 0.08));
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01);
        }

        .cust-table-responsive {
          width: 100%;
          overflow-x: auto;
        }

        .cust-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.8125rem;
        }

        .cust-table th {
          background: var(--db-sf2, #f5f5f5);
          color: var(--db-tx3, rgba(42, 42, 42, 0.6));
          font-weight: 700;
          text-transform: uppercase;
          font-size: 0.6875rem;
          letter-spacing: 0.05em;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--db-bd, rgba(0, 0, 0, 0.08));
        }

        .cust-table td {
          padding: 1.125rem 1.25rem;
          border-bottom: 1px solid var(--db-bd, rgba(0, 0, 0, 0.04));
          vertical-align: middle;
          color: var(--db-tx, #2a2a2a);
        }

        .cust-table tbody tr {
          transition: background 0.15s ease;
        }

        .cust-table tbody tr:hover {
          background: var(--db-sf2, rgba(0, 0, 0, 0.015));
        }

        /* Cell Styling Details */
        .cust-primary-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .cust-avatar-placeholder {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(225,6,19,0.1), rgba(197,168,128,0.15));
          color: #E10613;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
          border: 1px solid rgba(225,6,19,0.15);
        }

        .cust-name-text {
          font-weight: 600;
          color: var(--db-tx, #2a2a2a);
          font-size: 0.875rem;
        }

        .cust-sub-text {
          font-size: 0.75rem;
          color: var(--db-tx3, rgba(42, 42, 42, 0.5));
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-top: 0.125rem;
        }

        .cust-contact-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .cust-contact-link {
          color: var(--db-tx2, #2a2a2a);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 500;
          transition: color 0.15s;
        }

        .cust-contact-link:hover {
          color: #E10613;
        }

        .cust-contact-link.mail {
          font-size: 0.75rem;
          color: var(--db-tx3, rgba(42, 42, 42, 0.6));
        }

        .cust-contact-link.mail:hover {
          color: #E10613;
        }

        .cust-location-cell {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .cust-loc-text {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 500;
        }

        .cust-pref-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          align-items: flex-start;
        }

        .cust-car-badge {
          background: rgba(225, 6, 19, 0.08);
          color: #E10613;
          border: 1px solid rgba(225, 6, 19, 0.15);
          border-radius: 6px;
          padding: 0.2rem 0.4rem;
          font-size: 0.75rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .cust-car-badge.brand-only {
          background: var(--db-sf2, #f5f5f5);
          color: var(--db-tx2, #2a2a2a);
          border-color: var(--db-bd, rgba(0, 0, 0, 0.1));
        }

        .cust-budget-text {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--db-gold, #c5a880);
        }

        .cust-rep-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .cust-timeline-badge {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--db-tx2, #2a2a2a);
          background: var(--db-sf2, #f5f5f5);
          padding: 0.15rem 0.35rem;
          border-radius: 4px;
          width: fit-content;
        }

        .cust-status-badge {
          padding: 0.25rem 0.625rem;
          border-radius: 99px;
          font-size: 0.6875rem;
          font-weight: 700;
          display: inline-block;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .cust-actions-wrap {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.5rem;
        }

        .cust-btn-icon {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          border: 1px solid var(--db-bd, rgba(0, 0, 0, 0.08));
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--db-tx3, rgba(0,0,0,0.5));
          background: var(--db-sf, #ffffff);
          transition: all 0.2s;
        }

        .cust-btn-icon:hover {
          transform: translateY(-1px);
        }

        .cust-btn-icon.wa:hover {
          color: #22c55e;
          border-color: rgba(34, 197, 94, 0.3);
          background: rgba(34, 197, 94, 0.05);
        }

        .cust-view-profile-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          background: var(--db-sf, #ffffff);
          border: 1px solid var(--db-bd, rgba(0, 0, 0, 0.08));
          color: var(--db-tx2, #2a2a2a);
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          font-size: 0.75rem;
          transition: all 0.2s;
        }

        .cust-view-profile-btn:hover {
          border-color: #E10613;
          color: #E10613;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(225, 6, 19, 0.05);
        }

        .cust-no-info {
          font-size: 0.75rem;
          color: var(--db-tx3, rgba(0, 0, 0, 0.35));
          font-style: italic;
        }

        /* Loading & Empty States */
        .cust-loading-state {
          padding: 4rem 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: var(--db-tx3, rgba(0, 0, 0, 0.5));
        }

        .cust-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(225, 6, 19, 0.1);
          border-top-color: #E10613;
          border-radius: 50%;
        }

        .cust-empty-state {
          padding: 4rem 2rem;
          text-align: center;
          color: var(--db-tx3, rgba(0,0,0,0.5));
        }

        .cust-empty-state h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--db-tx, #2a2a2a);
          margin: 0.75rem 0 0.25rem;
        }

        .cust-empty-state p {
          font-size: 0.8125rem;
          margin: 0;
        }

        @media (max-width: 1024px) {
          .cust-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .cust-stats-grid {
            grid-template-columns: 1fr;
          }
          
          .cust-filter-panel {
            flex-direction: column;
            align-items: stretch;
          }

          .cust-search-box {
            min-width: 100%;
          }

          .cust-filters-row {
            flex-direction: column;
            align-items: stretch;
          }

          .cust-filter-select-wrap {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}
