'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Trophy, TrendingUp, Target, Users2, Car, Phone } from 'lucide-react';
import { LEAD_STAGES, formatBudget } from '@/types/crm';

interface EmpStat { id:string; name:string; employee_id:string; total:number; sold:number; followUps:number; conversion:number; }

export default function CRMAnalyticsPage() {
  const [empStats, setEmpStats] = useState<EmpStat[]>([]);
  const [stageCounts, setStageCounts] = useState<{name:string;value:number;color:string}[]>([]);
  const [sourceCounts, setSourceCounts] = useState<{name:string;value:number}[]>([]);
  const [monthlyData, setMonthlyData] = useState<{month:string;leads:number;sold:number}[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      // Stage distribution
      const { data:leads } = await supabase.from('leads').select('lead_status,source,created_at,assigned_to');
      const stageCnt: Record<string,number> = {};
      const sourceCnt: Record<string,number> = {};
      const monthly: Record<string,{leads:number;sold:number}> = {};

      (leads||[]).forEach((l:{lead_status:string;source:string;created_at:string;assigned_to:string|null}) => {
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

      // Employee stats
      const { data:emps } = await supabase.from('employees').select('id,name,employee_id').eq('status','active');
      if (!emps) { setLoading(false); return; }
      const stats = await Promise.all(emps.map(async (e:{id:string;name:string;employee_id:string}) => {
        const [{ count:total },{ count:sold },{ count:fu }] = await Promise.all([
          supabase.from('leads').select('id',{count:'exact',head:true}).eq('assigned_to',e.id),
          supabase.from('leads').select('id',{count:'exact',head:true}).eq('assigned_to',e.id).eq('lead_status','sold'),
          supabase.from('follow_ups').select('id',{count:'exact',head:true}).eq('employee_id',e.id).eq('status','completed'),
        ]);
        const t=total||0, s=sold||0;
        return { ...e, total:t, sold:s, followUps:fu||0, conversion:t>0?Math.round((s/t)*100):0 };
      }));
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

      {/* Monthly Chart */}
      <div className="crm-panel" style={{marginBottom:'1.25rem'}}>
        <div className="crm-panel-head"><h2>Monthly Leads vs Sales</h2></div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} margin={{top:5,right:10,left:-10,bottom:5}}>
            <XAxis dataKey="month" tick={{fontSize:12,fill:'var(--db-tx3)'}}/>
            <YAxis tick={{fontSize:12,fill:'var(--db-tx3)'}}/>
            <Tooltip contentStyle={{background:'var(--db-sf)',border:'1px solid var(--db-bd)',borderRadius:10,color:'var(--db-tx)'}}/>
            <Bar dataKey="leads" name="Leads" fill="#6366f1" radius={[6,6,0,0]}/>
            <Bar dataKey="sold" name="Sold" fill="#E10613" radius={[6,6,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="crm-two-col" style={{marginBottom:'1.25rem'}}>
        {/* Stage Pie */}
        <div className="crm-panel">
          <div className="crm-panel-head"><h2>Pipeline Distribution</h2></div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stageCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                {stageCounts.map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip contentStyle={{background:'var(--db-sf)',border:'1px solid var(--db-bd)',borderRadius:10,color:'var(--db-tx)'}}/>
              <Legend wrapperStyle={{fontSize:'.6875rem'}}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Source Bar */}
        <div className="crm-panel">
          <div className="crm-panel-head"><h2>Lead Sources</h2></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={sourceCounts} layout="vertical" margin={{left:20,right:10}}>
              <XAxis type="number" tick={{fontSize:11,fill:'var(--db-tx3)'}}/>
              <YAxis dataKey="name" type="category" tick={{fontSize:11,fill:'var(--db-tx3)'}} width={80}/>
              <Tooltip contentStyle={{background:'var(--db-sf)',border:'1px solid var(--db-bd)',borderRadius:10,color:'var(--db-tx)'}}/>
              <Bar dataKey="value" fill="#f59e0b" radius={[0,6,6,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="crm-panel">
        <div className="crm-panel-head"><h2><Trophy size={16} style={{color:'#f59e0b',marginRight:6}}/>Employee Leaderboard</h2></div>
        {loading ? Array(4).fill(0).map((_,i)=><div key={i} className="crm-skel" style={{height:64,marginBottom:8}}/>) :
        empStats.map((emp,i)=>(
          <motion.div key={emp.id} className="crm-emp-row" initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*.05}}>
            <div className="crm-emp-rank" style={{background:i===0?'rgba(245,158,11,.15)':i===1?'rgba(156,163,175,.12)':i===2?'rgba(180,120,60,.12)':'var(--db-sf2)',color:i===0?'#f59e0b':i===1?'#9ca3af':i===2?'#b47c3c':'var(--db-tx3)'}}>{i+1}</div>
            <div className="crm-emp-av">{emp.name.charAt(0)}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:700,fontSize:'.9375rem',color:'var(--db-tx)'}}>{emp.name}</div>
              <div style={{fontSize:'.75rem',color:'var(--db-tx3)'}}>{emp.employee_id}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,60px)',gap:'.75rem',textAlign:'center'}}>
              <div><div style={{fontWeight:800,fontSize:'1.125rem',color:'var(--db-tx)'}}>{emp.total}</div><div style={{fontSize:'.625rem',color:'var(--db-tx3)'}}>Leads</div></div>
              <div><div style={{fontWeight:800,fontSize:'1.125rem',color:'#22c55e'}}>{emp.sold}</div><div style={{fontSize:'.625rem',color:'var(--db-tx3)'}}>Sold</div></div>
              <div><div style={{fontWeight:800,fontSize:'1.125rem',color:'#6366f1'}}>{emp.followUps}</div><div style={{fontSize:'.625rem',color:'var(--db-tx3)'}}>Follow-ups</div></div>
              <div><div style={{fontWeight:800,fontSize:'1.125rem',color:'#E10613'}}>{emp.conversion}%</div><div style={{fontSize:'.625rem',color:'var(--db-tx3)'}}>Conv.</div></div>
            </div>
            {i===0&&<div className="crm-champ-badge">🏆 Top</div>}
          </motion.div>
        ))}
        {empStats.length===0&&!loading&&<p style={{color:'var(--db-tx3)',fontSize:'.875rem',padding:'1rem 0'}}>No employee data yet.</p>}
      </div>

      <style jsx>{`
.crm-panel{background:var(--db-sf);border:1px solid var(--db-bd);border-radius:16px;padding:1.25rem}
.crm-panel-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
.crm-panel-head h2{font-family:'Outfit',sans-serif;font-size:1rem;font-weight:700;margin:0;color:var(--db-tx);display:flex;align-items:center}
.crm-two-col{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.crm-emp-row{display:flex;align-items:center;gap:1rem;padding:.875rem 1rem;border-radius:12px;transition:all .2s;margin-bottom:.5rem;border:1px solid var(--db-bd)}
.crm-emp-row:hover{border-color:var(--db-gold);background:var(--db-gd)}
.crm-emp-rank{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.875rem;flex-shrink:0}
.crm-emp-av{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#E10613,#c70511);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:1.05rem;font-family:'Outfit',sans-serif;flex-shrink:0}
.crm-champ-badge{background:rgba(245,158,11,.12);color:#f59e0b;border:1px solid rgba(245,158,11,.25);padding:.25rem .625rem;border-radius:99px;font-size:.6875rem;font-weight:700;flex-shrink:0}
.crm-skel{background:var(--db-sf2);border-radius:12px;animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@media(max-width:768px){.crm-two-col{grid-template-columns:1fr}}
      `}</style>
    </div>
  );
}
