'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, LogIn, LogOut, Users, CheckCircle2, XCircle, Clock, 
  Calendar, ChevronLeft, ChevronRight, UserCheck, UserX, Percent, Download,
  ClipboardCheck, Fingerprint
} from 'lucide-react';
import Image from 'next/image';
import { getProxiedImageUrl } from '@/lib/utils';

interface EmployeeInfo {
  id: string;
  name: string;
  employee_id: string;
  role: string;
  status: string;
  avatar_url: string | null;
  biometric_id?: string | null;
}

interface AttendanceLog {
  id: string;
  employee_id: string;
  action: string;
  details: string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
  employee: {
    name: string;
    employee_id: string;
    avatar_url: string | null;
  } | null;
  metadata?: {
    biometric?: boolean;
    device_id?: string;
    verify_type?: number;
  } | null;
}

interface PresentInfo {
  employee: EmployeeInfo;
  firstLogin: string;
  lastLogout: string | null;
  status: 'active' | 'logged_out';
  total_hours: number | null;
  source: 'biometric' | 'web_login' | 'manual';
  late_by_minutes: number;
}

export default function AttendancePage() {
  const supabase = createClient();
  const [employees, setEmployees] = useState<EmployeeInfo[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [todayRecords, setTodayRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('all');
  const [selectedSource, setSelectedSource] = useState<'all' | 'biometric' | 'web_login'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const updateBiometricId = async (employeeId: string, bioId: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ biometric_id: bioId.trim() || null })
        .eq('id', employeeId);
      
      if (error) {
        alert('Failed to update Biometric ID / Roll Number: ' + error.message);
      } else {
        // Update local state to avoid full refetch delay
        setEmployees(prev => prev.map(emp => emp.id === employeeId ? { ...emp, biometric_id: bioId.trim() || null } : emp));
      }
    } catch (err) {
      console.error('Error updating biometric ID:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch active employees (excluding admins to match "employee" attendance requirement)
      const { data: empsData } = await supabase
        .from('employees')
        .select('id, name, employee_id, role, status, avatar_url, biometric_id')
        .eq('role', 'employee')
        .eq('status', 'active');
      
      setEmployees(empsData as EmployeeInfo[] || []);

      // 2. Fetch login/logout activity logs
      const { data: logsData } = await supabase
        .from('activity_logs')
        .select('*, employee:employees(name, employee_id, avatar_url)')
        .in('action', ['login', 'logout'])
        .order('created_at', { ascending: false })
        .limit(300);

      setLogs((logsData || []) as unknown as AttendanceLog[]);

      // 3. Fetch today's attendance records to build presentList
      const today = getTodayCanadaStr();
      const { data: recordsData } = await supabase
        .from('attendance_records')
        .select('*, employee:employees(name, employee_id, avatar_url)')
        .eq('attendance_date', today);
      
      setTodayRecords(recordsData || []);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (filteredLogs.length === 0) {
      alert('No attendance data available to export.');
      return;
    }

    const headers = ['Date', 'Time', 'Employee ID', 'Employee Name', 'Action', 'Source', 'Details', 'IP Address / Device'];
    const rows = filteredLogs.map(log => {
      const dateStr = new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = formatLocalTime(log.created_at);
      const empId = log.employee?.employee_id || '';
      const empName = log.employee?.name || 'Unknown Employee';
      const actionStr = log.action === 'login' ? 'Login / In' : 'Logout / Out';
      
      const isBiometric = log.metadata?.biometric || log.details?.toLowerCase().includes('biometric');
      const sourceStr = isBiometric ? 'Biometric' : 'Web Login';
      
      const detailsStr = log.details ? `"${log.details.replace(/"/g, '""')}"` : '';
      const ip = log.ip_address || log.metadata?.device_id || '';

      return [dateStr, timeStr, empId, empName, actionStr, sourceStr, detailsStr, ip];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = startDate && endDate 
      ? `${startDate}_to_${endDate}` 
      : startDate 
        ? `from_${startDate}` 
        : endDate 
          ? `to_${endDate}` 
          : todayStr;
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${dateStamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Determine local date string
  const getLocalDateStr = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-CA'); // YYYY-MM-DD
  };

  const formatLocalTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getTodayCanadaStr = () => {
    return new Date().toLocaleDateString('en-CA');
  };

  const todayStr = getTodayCanadaStr();

  // Process presence / absence today using records, fallback to logs if empty
  const presentList: PresentInfo[] = [];
  const absentList: EmployeeInfo[] = [];

  if (todayRecords && todayRecords.length > 0) {
    employees.forEach(emp => {
      const rec = todayRecords.find(r => r.employee_id === emp.id);
      if (rec) {
        presentList.push({
          employee: emp,
          firstLogin: rec.first_punch_in || '',
          lastLogout: rec.last_punch_out,
          status: rec.last_punch_out ? 'logged_out' : 'active',
          total_hours: rec.total_hours,
          source: rec.source || 'biometric',
          late_by_minutes: rec.late_by_minutes || 0
        });
      } else {
        absentList.push(emp);
      }
    });
  } else {
    // Fallback legacy calculation from logs
    const todayLogs = logs.filter(log => getLocalDateStr(log.created_at) === todayStr);
    employees.forEach(emp => {
      const empTodayLogs = todayLogs
        .filter(l => l.employee_id === emp.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      if (empTodayLogs.length > 0) {
        const logins = empTodayLogs.filter(l => l.action === 'login');
        const logouts = empTodayLogs.filter(l => l.action === 'logout');
        
        const firstLogin = logins.length > 0 ? logins[0].created_at : empTodayLogs[0].created_at;
        const lastLogout = logouts.length > 0 ? logouts[logouts.length - 1].created_at : null;

        let currentStatus: 'active' | 'logged_out' = 'active';
        if (empTodayLogs[empTodayLogs.length - 1].action === 'logout') {
          currentStatus = 'logged_out';
        }

        presentList.push({
          employee: emp,
          firstLogin,
          lastLogout,
          status: currentStatus,
          total_hours: null,
          source: 'web_login',
          late_by_minutes: 0
        });
      } else {
        absentList.push(emp);
      }
    });
  }

  // Filtered Logs
  const filteredLogs = logs.filter(log => {
    const empName = log.employee?.name || '';
    const empId = log.employee?.employee_id || '';
    const details = log.details || '';
    
    const matchesSearch = empName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          details.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesEmployee = selectedEmployeeId === 'all' || log.employee_id === selectedEmployeeId;
    
    const isBiometric = log.metadata?.biometric || log.details?.toLowerCase().includes('biometric');
    const matchesSource = selectedSource === 'all' || 
                         (selectedSource === 'biometric' && isBiometric) || 
                         (selectedSource === 'web_login' && !isBiometric);

    const logDate = getLocalDateStr(log.created_at);
    const matchesDate = 
      (!startDate || logDate >= startDate) &&
      (!endDate || logDate <= endDate);

    return matchesSearch && matchesEmployee && matchesSource && matchesDate;
  });

  // Pagination calculations
  const totalLogs = filteredLogs.length;
  const totalPages = Math.ceil(totalLogs / logsPerPage);
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

  // Statistics
  const totalActiveEmployees = employees.length;
  const presentCount = presentList.length;
  const absentCount = absentList.length;
  const attendanceRate = totalActiveEmployees > 0 
    ? Math.round((presentCount / totalActiveEmployees) * 100) 
    : 0;

  return (
    <div className="db-page">
      {/* Page Header */}
      <div className="db-page-header">
        <div>
          <h1 className="db-page-title">Employee Attendance Tracker</h1>
          <p className="db-page-sub">Monitor daily active logins, logouts, and present / absent rosters</p>
        </div>
      </div>

      {/* Attendance Stats Row */}
      <div className="att-stats-row">
        <div className="att-stat-card">
          <div className="att-stat-icon blue"><Users size={20} /></div>
          <div>
            <span className="att-stat-val">{totalActiveEmployees}</span>
            <span className="att-stat-lbl">Active Employees</span>
          </div>
        </div>
        <div className="att-stat-card">
          <div className="att-stat-icon green"><UserCheck size={20} /></div>
          <div>
            <span className="att-stat-val">{presentCount}</span>
            <span className="att-stat-lbl">Present Today</span>
          </div>
        </div>
        <div className="att-stat-card">
          <div className="att-stat-icon red"><UserX size={20} /></div>
          <div>
            <span className="att-stat-val">{absentCount}</span>
            <span className="att-stat-lbl">Absent Today</span>
          </div>
        </div>
        <div className="att-stat-card">
          <div className="att-stat-icon gold"><Percent size={20} /></div>
          <div>
            <span className="att-stat-val">{attendanceRate}%</span>
            <span className="att-stat-lbl">Attendance Rate</span>
          </div>
        </div>
      </div>

      {/* Roster Section: Present & Absent side-by-side */}
      <div className="att-roster-grid">
        {/* Present Today Panel */}
        <div className="att-roster-card">
          <div className="att-roster-header present">
            <CheckCircle2 size={18} />
            <h3>Present Today ({presentCount})</h3>
          </div>
          <div className="att-roster-body">
            {loading ? (
              Array(3).fill(0).map((_, i) => <div key={i} className="att-skel-line" />)
            ) : presentList.length === 0 ? (
              <div className="att-empty-state">No employees checked in today yet.</div>
            ) : (
              <div className="att-list-container">
                {presentList.map(({ employee, firstLogin, lastLogout, status, total_hours, source, late_by_minutes }) => (
                  <div key={employee.id} className="att-list-item">
                    <div className="att-emp-profile">
                      <div className="att-avatar-wrap">
                        <Image 
                          src={getProxiedImageUrl(employee.avatar_url || '/DEFAULT IMAGE.PNG')} 
                          alt={employee.name} 
                          width={36} 
                          height={36} 
                          className="att-avatar"
                        />
                      </div>
                      <div>
                        <div className="att-emp-name">{employee.name}</div>
                        <div className="att-emp-id">{employee.employee_id}</div>
                        <div className="att-bio-id-field" style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--db-tx3)' }}>Bio ID / Roll No:</span>
                          <input 
                            type="text" 
                            placeholder="None" 
                            defaultValue={employee.biometric_id || ''}
                            onBlur={(e) => updateBiometricId(employee.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateBiometricId(employee.id, e.currentTarget.value);
                                e.currentTarget.blur();
                              }
                            }}
                            style={{
                              width: '45px',
                              fontSize: '0.7rem',
                              padding: '1px 4px',
                              borderRadius: '4px',
                              border: '1px solid var(--db-bd)',
                              background: 'var(--db-sf2)',
                              color: 'var(--db-tx)',
                              textAlign: 'center'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="att-emp-times">
                      <div className="att-time-row">
                        <LogIn size={11} className="text-green-500" />
                        <span>In: {firstLogin ? formatLocalTime(firstLogin) : '—'}</span>
                        {late_by_minutes > 0 && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--db-rd, #E10613)', fontWeight: 700, marginLeft: '4px' }}>
                            (Late {late_by_minutes}m)
                          </span>
                        )}
                      </div>
                      {lastLogout ? (
                        <div className="att-time-row">
                          <LogOut size={11} className="text-red-500" />
                          <span>Out: {formatLocalTime(lastLogout)}</span>
                        </div>
                      ) : (
                        <div className="att-time-row text-green-500 font-semibold">
                          <Clock size={11} />
                          <span>On Duty</span>
                        </div>
                      )}
                      {total_hours !== null && total_hours > 0 && (
                        <div className="att-time-row text-slate-500" style={{ fontSize: '0.7rem' }}>
                          <ClipboardCheck size={10} />
                          <span>Work: {total_hours} hrs</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span className={`att-badge ${status}`}>
                        {status === 'active' ? 'Active' : 'Logged Out'}
                      </span>
                      <span className={`att-source-badge ${source}`} style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: source === 'biometric' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                        color: source === 'biometric' ? '#3b82f6' : '#6b7280',
                        textTransform: 'uppercase'
                      }}>
                        {source === 'biometric' ? 'Biometric' : 'Web'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Absent Today Panel */}
        <div className="att-roster-card">
          <div className="att-roster-header absent">
            <XCircle size={18} />
            <h3>Absent Today ({absentCount})</h3>
          </div>
          <div className="att-roster-body">
            {loading ? (
              Array(3).fill(0).map((_, i) => <div key={i} className="att-skel-line" />)
            ) : absentList.length === 0 ? (
              <div className="att-empty-state green">All employees checked in today! 🌟</div>
            ) : (
              <div className="att-list-container">
                {absentList.map((employee) => (
                  <div key={employee.id} className="att-list-item">
                    <div className="att-emp-profile">
                      <div className="att-avatar-wrap">
                        <Image 
                          src={getProxiedImageUrl(employee.avatar_url || '/DEFAULT IMAGE.PNG')} 
                          alt={employee.name} 
                          width={36} 
                          height={36} 
                          className="att-avatar"
                        />
                      </div>
                      <div>
                        <div className="att-emp-name">{employee.name}</div>
                        <div className="att-emp-id">{employee.employee_id}</div>
                        <div className="att-bio-id-field" style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.65rem', color: 'var(--db-tx3)' }}>Bio ID / Roll No:</span>
                          <input 
                            type="text" 
                            placeholder="None" 
                            defaultValue={employee.biometric_id || ''}
                            onBlur={(e) => updateBiometricId(employee.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateBiometricId(employee.id, e.currentTarget.value);
                                e.currentTarget.blur();
                              }
                            }}
                            style={{
                              width: '45px',
                              fontSize: '0.7rem',
                              padding: '1px 4px',
                              borderRadius: '4px',
                              border: '1px solid var(--db-bd)',
                              background: 'var(--db-sf2)',
                              color: 'var(--db-tx)',
                              textAlign: 'center'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="att-emp-times">
                      <span style={{ fontSize: '0.8rem', color: 'var(--db-rd, #E10613)', fontWeight: 600 }}>No check-in detected</span>
                    </div>
                    <span className="att-badge absent">
                      Absent
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Log Table and Filters */}
      <div className="att-log-section">
        <div className="att-section-header">
          <h2 className="att-section-title" style={{ margin: 0 }}>Login / Logout History</h2>
        </div>
        
        {/* Filters bar */}
        <div className="att-filters-bar">
          <div className="att-search-wrap">
            <Search size={16} />
            <input 
              placeholder="Search history by name, ID..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="att-filter-dropdown">
            <Users size={16} />
            <select 
              value={selectedEmployeeId}
              onChange={(e) => { setSelectedEmployeeId(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div className="att-filter-dropdown">
            <ClipboardCheck size={16} />
            <select 
              value={selectedSource}
              onChange={(e) => { setSelectedSource(e.target.value as any); setCurrentPage(1); }}
            >
              <option value="all">All Sources</option>
              <option value="biometric">Biometric Device</option>
              <option value="web_login">Web Login</option>
            </select>
          </div>

          <div className="att-filter-date">
            <Calendar size={16} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>From:</span>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
            />
            {startDate && (
              <button className="att-clear-date" onClick={() => { setStartDate(''); setCurrentPage(1); }}>Clear</button>
            )}
          </div>

          <div className="att-filter-date">
            <Calendar size={16} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>To:</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
            />
            {endDate && (
              <button className="att-clear-date" onClick={() => { setEndDate(''); setCurrentPage(1); }}>Clear</button>
            )}
          </div>

          <button className="att-export-btn" onClick={exportToExcel} style={{ marginLeft: 'auto' }}>
            <Download size={15} /> Export Excel
          </button>
        </div>

        {/* Tabular logs */}
        <div className="att-table-wrap">
          <table className="att-table">
            <thead>
              <tr>
                <th>Performer</th>
                <th>Action</th>
                <th>Details</th>
                <th>Device / IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5}><div className="att-skel-line" /></td>
                  </tr>
                ))
              ) : currentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="att-no-results">
                    No matching attendance logs found.
                  </td>
                </tr>
              ) : (
                currentLogs.map(log => {
                  const emp = log.employee;
                  const isLogin = log.action === 'login';
                  return (
                    <tr key={log.id}>
                      <td>
                        <div className="att-performer-cell">
                          <div className="att-mini-avatar-wrap">
                            <Image 
                              src={getProxiedImageUrl(emp?.avatar_url || '/DEFAULT IMAGE.PNG')} 
                              alt={emp?.name || 'System'} 
                              width={24} 
                              height={24} 
                              className="att-mini-avatar"
                            />
                          </div>
                          <div>
                            <span className="att-perf-name">{emp?.name || 'Unknown Employee'}</span>
                            <span className="att-perf-id">{emp?.employee_id || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {log.metadata?.biometric || log.details?.toLowerCase().includes('biometric') ? (
                          <div className={`att-action-pill ${log.action}`} style={{ background: isLogin ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: isLogin ? '#3b82f6' : '#f59e0b' }}>
                            <Fingerprint size={12} />
                            <span>{isLogin ? 'Punch In' : 'Punch Out'}</span>
                          </div>
                        ) : (
                          <div className={`att-action-pill ${log.action}`}>
                            {isLogin ? <LogIn size={12} /> : <LogOut size={12} />}
                            <span>{isLogin ? 'Login' : 'Logout'}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="att-log-details">"{log.details}"</span>
                      </td>
                      <td>
                        <div className="att-device-cell">
                          <span className="att-ip-addr">{log.ip_address || log.metadata?.device_id || '—'}</span>
                          {log.user_agent && (
                            <span className="att-user-agent" title={log.user_agent}>
                              {log.user_agent.includes('Mobi') ? 'Mobile' : (log.metadata?.biometric ? 'Biometric Terminal' : 'Desktop')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="att-time-cell">
                          <span className="att-log-date">{new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="att-log-time">{formatLocalTime(log.created_at)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="att-pagination">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="att-pag-btn"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="att-pag-info">Page {currentPage} of {totalPages}</span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="att-pag-btn"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        .att-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          margin-bottom: 2rem;
        }
        .att-stat-card {
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }
        .att-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .att-stat-icon.blue { background: rgba(59, 130, 246, 0.08); color: #3b82f6; }
        .att-stat-icon.green { background: rgba(34, 197, 94, 0.08); color: #22c55e; }
        .att-stat-icon.red { background: rgba(225, 6, 19, 0.08); color: #E10613; }
        .att-stat-icon.gold { background: var(--db-gd); color: var(--db-gold); }
        
        .att-stat-val {
          display: block;
          font-size: 1.625rem;
          font-weight: 800;
          color: var(--db-tx);
          line-height: 1.1;
        }
        .att-stat-lbl {
          display: block;
          font-size: .75rem;
          color: var(--db-tx3);
          font-weight: 600;
          margin-top: 2px;
        }
        
        .att-roster-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }
        .att-roster-card {
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }
        .att-roster-header {
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fff;
        }
        .att-roster-header.present {
          background: linear-gradient(135deg, #10b981, #059669);
        }
        .att-roster-header.absent {
          background: linear-gradient(135deg, #ef4444, #dc2626);
        }
        .att-roster-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
        }
        .att-roster-body {
          padding: 1.25rem;
          max-height: 380px;
          overflow-y: auto;
        }
        .att-list-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .att-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: var(--db-sf2);
          border: 1px solid var(--db-bd);
          border-radius: 12px;
          gap: 10px;
        }
        .att-emp-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 160px;
        }
        .att-avatar-wrap {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          border: 1.5px solid var(--db-bd);
          flex-shrink: 0;
        }
        .att-avatar {
          object-fit: cover;
          width: 100%;
          height: 100%;
        }
        .att-emp-name {
          font-weight: 700;
          color: var(--db-tx);
          font-size: 0.875rem;
        }
        .att-emp-id {
          font-size: 0.75rem;
          color: var(--db-tx3);
          font-family: monospace;
          margin-top: 1px;
        }
        .att-emp-times {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.8rem;
          color: var(--db-tx2);
        }
        .att-time-row {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .att-badge {
          font-size: 0.6875rem;
          font-weight: 750;
          padding: 4px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .att-badge.active { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
        .att-badge.logged_out { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .att-badge.absent { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .att-source-badge.biometric { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .att-source-badge.web_login { background: rgba(156, 163, 175, 0.1); color: #6b7280; }
        
        .att-empty-state {
          padding: 2.5rem 1rem;
          text-align: center;
          color: var(--db-tx3);
          font-size: 0.875rem;
        }
        .att-empty-state.green {
          color: #22c55e;
          font-weight: 600;
        }
        
        .att-skel-line {
          height: 52px;
          background: var(--db-sf2);
          border-radius: 12px;
          animation: pulse 1.5s infinite;
          margin-bottom: 10px;
        }
        
        .att-log-section {
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 18px;
          padding: 1.75rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.01);
        }
        .att-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }
        .att-section-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--db-tx);
        }
        .att-export-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #107c41;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          box-shadow: 0 2px 4px rgba(16, 124, 65, 0.15);
        }
        .att-export-btn:hover {
          background: #0f6c38;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(16, 124, 65, 0.25);
        }
        .att-export-btn:active {
          transform: translateY(0);
        }
        .att-filters-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .att-search-wrap, .att-filter-dropdown, .att-filter-date {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--db-sf2);
          border: 1px solid var(--db-bd);
          border-radius: 10px;
          padding: 8px 12px;
          color: var(--db-tx3);
        }
        .att-search-wrap { flex: 1; min-width: 200px; }
        .att-search-wrap input {
          background: none;
          border: none;
          outline: none;
          width: 100%;
          font-size: 0.85rem;
          color: var(--db-tx);
          font-family: inherit;
        }
        .att-filter-dropdown select, .att-filter-date input {
          background: none;
          border: none;
          outline: none;
          font-size: 0.85rem;
          color: var(--db-tx);
          font-family: inherit;
          cursor: pointer;
        }
        .att-clear-date {
          background: none;
          border: none;
          color: var(--db-rd, #E10613);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          padding: 2px 4px;
        }
        
        .att-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--db-bd);
          border-radius: 12px;
          background: var(--db-sf);
        }
        .att-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
          text-align: left;
        }
        .att-table th {
          padding: 14px 16px;
          background: var(--db-sf2);
          color: var(--db-tx3);
          font-weight: 600;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--db-bd);
        }
        .att-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--db-bd);
          color: var(--db-tx2);
        }
        .att-table tr:last-child td { border-bottom: 0; }
        .att-table tr:hover { background: var(--db-sf2); }
        
        .att-performer-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .att-mini-avatar-wrap {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          overflow: hidden;
          border: 1px solid var(--db-bd);
          flex-shrink: 0;
        }
        .att-mini-avatar {
          object-fit: cover;
          width: 100%;
          height: 100%;
        }
        .att-perf-name {
          display: block;
          font-weight: 700;
          color: var(--db-tx);
          font-size: 0.85rem;
        }
        .att-perf-id {
          display: block;
          font-size: 0.7rem;
          color: var(--db-tx3);
          font-family: monospace;
          margin-top: 1px;
        }
        
        .att-action-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
        }
        .att-action-pill.login { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
        .att-action-pill.logout { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        
        .att-log-details {
          font-size: 0.8rem;
          color: var(--db-tx2);
        }
        .att-device-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .att-ip-addr {
          font-family: monospace;
          font-size: 0.75rem;
          color: var(--db-tx3);
        }
        .att-user-agent {
          font-size: 0.7rem;
          color: var(--db-tx3);
        }
        .att-time-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .att-log-date {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--db-tx);
        }
        .att-log-time {
          font-size: 0.75rem;
          color: var(--db-tx3);
        }
        
        .att-no-results {
          text-align: center;
          padding: 2.5rem 0;
          color: var(--db-tx3);
        }
        
        .att-pagination {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
          margin-top: 1.25rem;
        }
        .att-pag-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: var(--db-sf);
          border: 1px solid var(--db-bd);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--db-tx2);
          cursor: pointer;
          transition: all 0.2s;
        }
        .att-pag-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .att-pag-btn:not(:disabled):hover {
          border-color: var(--db-gold);
          background: var(--db-sf2);
        }
        .att-pag-info {
          font-size: 0.8rem;
          color: var(--db-tx3);
        }
        
        @media(max-width: 1024px) {
          .att-stats-row { grid-template-columns: repeat(2, 1fr); }
          .att-roster-grid { grid-template-columns: 1fr; }
        }
        @media(max-width: 640px) {
          .att-stats-row { grid-template-columns: 1fr; }
          .att-filters-bar { flex-direction: column; }
          .att-search-wrap, .att-filter-dropdown, .att-filter-date { width: 100%; }
        }
      `}</style>
    </div>
  );
}
