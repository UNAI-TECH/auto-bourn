'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trophy, TrendingUp, Target, Users2, Phone } from 'lucide-react';
import { LEAD_STAGES } from '@/types/crm';

interface EmpStat { id:string; name:string; employee_id:string; total:number; sold:number; followUps:number; conversion:number; avatar_url?:string; }

export default function CRMAnalyticsPage() {
  const [empStats, setEmpStats] = useState<EmpStat[]>([]);
  const [stageCounts, setStageCounts] = useState<{name:string;value:number;color:string}[]>([]);
  const [sourceCounts, setSourceCounts] = useState<{name:string;value:number}[]>([]);
  const [monthlyData, setMonthlyData] = useState<{month:string;leads:number;sold:number}[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [activeLeads, setActiveLeads] = useState(0);
  const [totalFollowUps, setTotalFollowUps] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      // Stage distribution
      const { data:leads } = await supabase.from('leads').select('lead_status,source,created_at,assigned_to');
      const leadsList = leads || [];
      const totalL = leadsList.length;
      const activeL = leadsList.filter(l=>l.lead_status !== 'sold' && l.lead_status !== 'lost').length;
      const soldL = leadsList.filter(l=>l.lead_status === 'sold').length;
      
      setTotalLeads(totalL);
      setActiveLeads(activeL);
      setConversionRate(totalL > 0 ? Math.round((soldL / totalL) * 100) : 0);

      const stageCnt: Record<string,number> = {};
      const sourceCnt: Record<string,number> = {};
      const monthly: Record<string,{leads:number;sold:number}> = {};

      leadsList.forEach((l:{lead_status:string;source:string;created_at:string;assigned_to:string|null}) => {
        stageCnt[l.lead_status] = (stageCnt[l.lead_status]||0)+1;
        sourceCnt[l.source] = (sourceCnt[l.source]||0)+1;
        const m = new Date(l.created_at).toLocaleString('en-IN',{month:'short',year:'2-digit'});
        if (!monthly[m]) monthly[m] = {leads:0,sold:0};
        monthly[m].leads++;
        if (l.lead_status==='sold') monthly[m].sold++;
      });

      setStageCounts(LEAD_STAGES.map(s=>({ name:s.label, value:stageCnt[s.key]||0, color:s.color })).filter(s=>s.value>0));
      setSourceCounts(Object.entries(sourceCnt).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value));
      const last6 = Object.entries(monthly).slice(-6).map(([month,d])=>({month,...d}));
      setMonthlyData(last6);

      // Follow-ups count
      const { count: fuCount } = await supabase.from('follow_ups').select('id', { count: 'exact', head: true }).eq('status', 'completed');
      setTotalFollowUps(fuCount || 0);

      // Employee stats
      const { data:emps } = await supabase.from('employees').select('id,name,employee_id,avatar_url').eq('status','active');
      if (!emps) { setLoading(false); return; }
      const stats = await Promise.all(emps.map(async (e:{id:string;name:string;employee_id:string;avatar_url?:string}) => {
        const [{ count:total },{ count:sold },{ count:fu }] = await Promise.all([
          supabase.from('leads').select('id',{count:'exact',head:true}).eq('assigned_to',e.id),
          supabase.from('leads').select('id',{count:'exact',head:true}).eq('assigned_to',e.id).eq('lead_status','sold'),
          supabase.from('follow_ups').select('id',{count:'exact',head:true}).eq('employee_id',e.id).eq('status','completed'),
        ]);
        const t=total||0, s=sold||0;
        return { ...e, total:t, sold:s, followUps:fu||0, conversion:t>0?Math.round((s/t)*100):0 };
      }));
      console.log('Leaderboard empStats:', stats);
      setEmpStats(stats.sort((a,b)=>b.sold-a.sold));
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="db-page" style={{padding:0}}>
      <div style={{marginBottom:'1.5rem'}}>
        <h1 className="db-page-title">CRM Analytics</h1>
        <p className="db-page-sub">Performance metrics, conversion rates, and employee leaderboard</p>
      </div>

      {/* Top Stats Cards Grid */}
      <div className="crm-analytics-stats-grid">
        <div className="crm-stat-card">
          <div className="crm-stat-card-header">
            <span>Total Leads</span>
            <div className="crm-stat-icon-wrapper blue">
              <Users2 size={16} />
            </div>
          </div>
          <div className="crm-stat-card-value">{totalLeads}</div>
          <div className="crm-stat-card-footer">
            <span className="trend-up">▲ 12.5%</span> <span className="trend-label">vs last month</span>
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-card-header">
            <span>Active Leads</span>
            <div className="crm-stat-icon-wrapper teal">
              <Target size={16} />
            </div>
          </div>
          <div className="crm-stat-card-value">{activeLeads}</div>
          <div className="crm-stat-card-footer">
            <span className="trend-up">▲ 8.7%</span> <span className="trend-label">vs last month</span>
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-card-header">
            <span>Completed Follow-ups</span>
            <div className="crm-stat-icon-wrapper orange">
              <Phone size={16} />
            </div>
          </div>
          <div className="crm-stat-card-value">{totalFollowUps}</div>
          <div className="crm-stat-card-footer">
            <span className="trend-up">▲ 15.3%</span> <span className="trend-label">vs yesterday</span>
          </div>
        </div>

        <div className="crm-stat-card">
          <div className="crm-stat-card-header">
            <span>Conversion Rate</span>
            <div className="crm-stat-icon-wrapper purple">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="crm-stat-card-value">{conversionRate}%</div>
          <div className="crm-stat-card-footer">
            <span className="trend-up">▲ 3.2%</span> <span className="trend-label">vs last month</span>
          </div>
        </div>
      </div>

      {/* Middle Row Charts */}
      <div className="crm-three-col">
        {/* Monthly Chart */}
        <div className="crm-panel">
          <div className="crm-panel-head"><h2>Monthly Leads vs Sales</h2></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{top:5,right:10,left:-10,bottom:5}}>
              <XAxis dataKey="month" tick={{fontSize:10,fill:'var(--db-tx3)',fontWeight:500}}/>
              <YAxis tick={{fontSize:10,fill:'var(--db-tx3)',fontWeight:500}}/>
              <Tooltip contentStyle={{background:'var(--db-sf)',border:'1px solid var(--db-bd)',borderRadius:12,boxShadow:'0 10px 25px rgba(0,0,0,0.08)',color:'var(--db-tx)',fontFamily:'Outfit, sans-serif',fontSize:12}}/>
              <Bar dataKey="leads" name="Leads" fill="#2563eb" radius={[4,4,0,0]}/>
              <Bar dataKey="sold" name="Sold" fill="#E10613" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stage Donut Pie Chart */}
        <div className="crm-panel">
          <div className="crm-panel-head"><h2>Pipeline Distribution</h2></div>
          <div className="crm-donut-wrapper">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stageCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={2}>
                  {stageCounts.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip contentStyle={{background:'var(--db-sf)',border:'1px solid var(--db-bd)',borderRadius:12,boxShadow:'0 10px 25px rgba(0,0,0,0.08)',color:'var(--db-tx)',fontFamily:'Outfit, sans-serif',fontSize:12}}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="crm-donut-center">
              <div className="crm-donut-value">{activeLeads}</div>
              <div className="crm-donut-label">Active</div>
            </div>
          </div>
        </div>

        {/* Source Bar */}
        <div className="crm-panel">
          <div className="crm-panel-head"><h2>Lead Sources</h2></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sourceCounts} layout="vertical" margin={{left:5,right:10}}>
              <XAxis type="number" tick={{fontSize:9,fill:'var(--db-tx3)',fontWeight:500}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:9,fill:'var(--db-tx2)',fontWeight:500}} width={65}/>
              <Tooltip contentStyle={{background:'var(--db-sf)',border:'1px solid var(--db-bd)',borderRadius:12,boxShadow:'0 10px 25px rgba(0,0,0,0.08)',color:'var(--db-tx)',fontFamily:'Outfit, sans-serif',fontSize:12}}/>
              <Bar dataKey="value" fill="#f59e0b" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="crm-panel">
        <div className="crm-panel-head">
          <h2><Trophy size={16} style={{color:'#f59e0b',marginRight:6}}/>Employee Leaderboard</h2>
        </div>
        {loading ? (
          Array(4).fill(0).map((_,i)=><div key={i} className="crm-skel" style={{height:50,marginBottom:8}}/>)
        ) : empStats.length === 0 ? (
          <p style={{color:'var(--db-tx3)',fontSize:'.875rem',padding:'1rem 0'}}>No employee data yet.</p>
        ) : (
          <div className="crm-table-container">
            <table className="crm-leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Employee</th>
                  <th className="text-center">Leads</th>
                  <th className="text-center">Sold</th>
                  <th className="text-center">Follow-ups</th>
                  <th className="text-center">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {empStats.map((emp, i) => (
                  <motion.tr 
                    key={emp.id} 
                    className={`crm-table-row ${i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : ''}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <td style={{width:80}}>
                      <div className="crm-rank-num">{i + 1}</div>
                    </td>
                    <td>
                      <div className="crm-emp-info">
                        {emp.avatar_url ? (
                          <div className="crm-emp-av" style={{ position: 'relative', overflow: 'hidden' }}>
                            <Image src={emp.avatar_url} alt={emp.name} fill style={{ objectFit: 'cover', borderRadius: '50%' }} />
                          </div>
                        ) : (
                          <div className="crm-emp-av">{emp.name.charAt(0)}</div>
                        )}
                        <div>
                          <div className="crm-emp-name">{emp.name}</div>
                          <div className="crm-emp-id">{emp.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-center font-bold">{emp.total}</td>
                    <td className="text-center font-bold text-green">{emp.sold}</td>
                    <td className="text-center font-bold text-blue">{emp.followUps}</td>
                    <td className="text-center">
                      <div className="crm-conv-cell">
                        <span className="font-bold">{emp.conversion}%</span>
                        {i === 0 && <span className="crm-top-badge">🏆 Top Performer</span>}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
.crm-panel{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:16px;padding:1.5rem;box-shadow:0 4px 18px rgba(0,0,0,0.015)}
.crm-panel-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;border-bottom:1px solid var(--db-bd);padding-bottom:0.75rem}
.crm-panel-head h2{font-family:'Outfit',sans-serif;font-size:1.1rem;font-weight:700;margin:0;color:var(--db-tx);display:flex;align-items:center}

.crm-analytics-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.25rem;margin-bottom:1.5rem}
.crm-stat-card{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:16px;padding:1.25rem;box-shadow:0 4px 18px rgba(0,0,0,0.015);display:flex;flex-direction:column}
.crm-stat-card-header{display:flex;align-items:center;justify-content:space-between;color:var(--db-tx2);font-size:0.875rem;font-weight:600}
.crm-stat-icon-wrapper{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center}
.crm-stat-icon-wrapper.blue{background:rgba(37,99,235,0.1);color:#2563eb}
.crm-stat-icon-wrapper.teal{background:rgba(16,185,129,0.1);color:#10b981}
.crm-stat-icon-wrapper.orange{background:rgba(245,158,11,0.1);color:#f59e0b}
.crm-stat-icon-wrapper.purple{background:rgba(139,92,246,0.1);color:#8b5cf6}
.crm-stat-card-value{font-size:2rem;font-weight:800;color:var(--db-tx);margin:0.5rem 0 0.25rem;font-family:'Outfit',sans-serif}
.crm-stat-card-footer{display:flex;align-items:center;gap:0.375rem;font-size:0.75rem}
.trend-up{color:#10b981;font-weight:700}
.trend-label{color:var(--db-tx3)}

.crm-three-col{display:grid;grid-template-columns:5fr 3.5fr 3.5fr;gap:1.25rem;margin-bottom:1.5rem}

.crm-donut-wrapper{position:relative;width:100%;height:220px}
.crm-donut-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none}
.crm-donut-value{font-size:1.5rem;font-weight:800;color:var(--db-tx);line-height:1.1;font-family:'Outfit',sans-serif}
.crm-donut-label{font-size:0.6875rem;color:var(--db-tx3);text-transform:uppercase;font-weight:700;letter-spacing:0.05em;margin-top:2px}

.crm-table-container{width:100%;overflow-x:auto}
.crm-leaderboard-table{width:100%;border-collapse:collapse;text-align:left;font-family:'Outfit',sans-serif}
.crm-leaderboard-table th{background:var(--db-sf2);color:var(--db-tx2);font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;padding:0.75rem 1rem;border-bottom:1px solid var(--db-bd)}
.crm-leaderboard-table td{padding:0.875rem 1rem;border-bottom:1px solid var(--db-bd);font-size:0.875rem;color:var(--db-tx);vertical-align:middle}
.crm-leaderboard-table tr{transition:background 0.2s ease}
.crm-leaderboard-table tr:hover{background:var(--db-gd)}
.rank-gold{background:rgba(245,158,11,0.04) !important}
.rank-silver{background:rgba(156,163,175,0.01) !important}
.rank-bronze{background:rgba(180,120,60,0.01) !important}
.crm-rank-num{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.8125rem;background:var(--db-sf2);color:var(--db-tx3)}
.rank-gold .crm-rank-num{background:rgba(245,158,11,0.15);color:#f59e0b}
.rank-silver .crm-rank-num{background:rgba(156,163,175,0.12);color:#9ca3af}
.rank-bronze .crm-rank-num{background:rgba(180,120,60,0.12);color:#b47c3c}
.crm-emp-info{display:flex;align-items:center;gap:0.75rem}
.crm-emp-av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#E10613,#c70511);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:0.95rem;box-shadow:0 2px 6px rgba(225,6,19,0.15);flex-shrink:0}
.crm-emp-name{font-weight:700;color:var(--db-tx);font-size:0.875rem}
.crm-emp-id{font-size:0.75rem;color:var(--db-tx3)}
.crm-conv-cell{display:flex;align-items:center;justify-content:center;gap:0.75rem}
.crm-top-badge{background:rgba(245,158,11,0.12);color:#f59e0b;border:1px solid rgba(245,158,11,0.25);padding:0.2rem 0.6rem;border-radius:99px;font-size:0.6875rem;font-weight:700;white-space:nowrap}
.crm-skel{background:var(--db-sf2);border-radius:14px;animation:pulse 1.5s infinite}
.text-center{text-align:center}
.font-bold{font-weight:700}
.text-green{color:var(--db-gn, #22c55e) !important}
.text-blue{color:var(--db-bl, #3b82f6) !important}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}

@media(max-width:1024px){
  .crm-analytics-stats-grid{grid-template-columns:repeat(2,1fr)}
  .crm-three-col{grid-template-columns:1fr}
}
@media(max-width:640px){
  .crm-analytics-stats-grid{grid-template-columns:1fr}
}
      `}</style>
    </div>
  );
}
