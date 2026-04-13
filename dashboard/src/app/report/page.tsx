"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle, TrendingDown, TrendingUp, ShieldAlert, CheckCircle2, Activity, Play, Download, ArrowRight, Github } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [hasCompany, setHasCompany] = useState(false);

  useEffect(() => {
    setHasCompany(!!localStorage.getItem("company_id"));
    const data = localStorage.getItem("startupReportData");
    if (data) {
      setReport(JSON.parse(data));
    } else {
      router.push("/assess");
    }
  }, [router]);

  if (!report) {
    return (
      <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Color mapping
  const colorHex = report.color === "red" ? "#ef4444" : report.color === "amber" ? "#f59e0b" : "#22c55e";
  
  // Format ML feature names into plain English
  const formatFeatureName = (str: string) => {
    if (str.includes("_")) {
      return str.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    return str;
  };

  const drivers = report.risk_drivers?.slice(0, 3) || [];
  const fixes = report.top_fixes?.slice(0, 3) || [];
  const dora = report.doraResult?.dora;

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-slate-800 font-sans pb-16">
      
      {/* Show shared navbar if user has a company */}
      {hasCompany ? (
        <AppNavbar />
      ) : (
        /* Standalone fallback nav */
        <div className="bg-white border-b border-slate-200 flex items-center justify-between px-6 py-3 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 text-white font-bold text-xs px-2 py-1 rounded">AI</div>
            <span className="text-sm font-semibold text-slate-900 hover:text-indigo-600 cursor-pointer" onClick={() => router.push("/")}>
              Risk Check
            </span>
            <span className="text-sm px-2 text-slate-300">/</span>
            <span className="text-sm font-medium text-slate-500">Risk Analysis Report</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 rounded text-sm hover:bg-slate-100 transition-colors border border-slate-200 text-slate-600">
              <Download size={14} /> Export PDF
            </button>
            <button onClick={() => router.push("/assess")} className="px-3 py-1.5 rounded text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500">
              New Assessment
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1200px] mx-auto px-6 mt-8">
        
        {/* Report Action Bar */}
        <div className="flex items-center justify-between mb-6">
          <div />
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm hover:bg-slate-100 transition-colors border border-slate-200 text-slate-600">
              <Download size={14} /> Export PDF
            </button>
            <button onClick={() => router.push("/assess")} className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500">
              New Assessment
            </button>
          </div>
        </div>

        {/* ── Header Area ─────────────────────────────────────────────────── */}
        <div className="mb-6 pb-6 border-b border-slate-200">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Generated {new Date().toLocaleDateString()}</p>
              <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">{report.company}</h1>
              <p className="text-sm mt-1 text-slate-500">{report.sector} Sector Analysis</p>
            </div>
            <div className="text-right">
              <div style={{ color: colorHex }} className="text-5xl font-bold tracking-tighter">
                {report.risk_pct}%
              </div>
              <div className="text-sm font-semibold uppercase tracking-wider mt-1" style={{ color: colorHex }}>
                {report.label}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Main Chart Column (Span 2) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Timeline */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Activity size={16} className="text-indigo-500" /> Projected 12-Week Risk Trajectory
              </h2>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.timeline} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="week" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `W${val}`} />
                    <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val*100).toFixed(0)}%`} domain={[0, 1]} />
                    <Tooltip 
                      contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#1e293b' }}
                      itemStyle={{ color: '#1e293b' }}
                      formatter={(val: number) => [`${(val*100).toFixed(1)}%`, 'Risk Model Projection']}
                      labelFormatter={(val) => `Week ${val}`}
                    />
                    <Line type="monotone" dataKey="risk" stroke={colorHex} strokeWidth={3} dot={{ fill: '#fff', stroke: colorHex, strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: colorHex }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DORA Scorecard */}
            {dora && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Github size={16} /> Engineering Health (DORA)
                  </h2>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-500">Verified via GitHub API</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Deployment Freq", val: `${dora.deployment_frequency.value}/d`, tier: dora.deployment_frequency.tier },
                    { label: "Lead Time", val: `${dora.lead_time.value} days`, tier: dora.lead_time.tier },
                    { label: "Failure Rate", val: `${dora.change_failure_rate.value}%`, tier: dora.change_failure_rate.tier },
                    { label: "MTTR", val: `${dora.mttr.value} hrs`, tier: dora.mttr.tier }
                  ].map(m => (
                    <div key={m.label} className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-center">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-2 font-semibold">{m.label}</div>
                      <div className="text-xl font-bold text-slate-900 mb-1">{m.val}</div>
                      <div className={`text-xs font-bold ${m.tier === 'Elite' ? 'text-green-600' : m.tier === 'High' ? 'text-indigo-600' : m.tier === 'Medium' ? 'text-amber-600' : 'text-red-600'}`}>
                        {m.tier}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Drivers & Fixes */}
          <div className="space-y-6">
            
            {/* Drivers */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 h-full shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                <ShieldAlert size={16} className="text-red-500" /> Top Risk Drivers
              </h2>
              <div className="space-y-4">
                {drivers.map((d: any, i: number) => {
                  const featureName = d.feature ? formatFeatureName(d.feature) : "Unknown Factor";
                  return (
                    <div key={i} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="mt-1"><TrendingUp size={14} className="text-red-500" /></div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm mb-1">{featureName}</div>
                        <div className="text-xs text-slate-500 leading-relaxed">
                          This metric is elevating your overall risk profile by approximately +{(d.risk_delta * 100).toFixed(1)} percentage points.
                        </div>
                      </div>
                    </div>
                  );
                })}
                {drivers.length === 0 && <div className="text-sm text-slate-500">No major risk drivers detected.</div>}
              </div>
            </div>

          </div>
        </div>

        {/* ── Recommendations Row ─────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-12 shadow-sm">
           <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
             <CheckCircle2 size={16} className="text-green-600" /> AI Recommendations Strategy
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {fixes.map((f: any, i: number) => (
                <div key={i} className="bg-slate-50 border border-slate-200 p-5 rounded-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3">
                    <span className="text-green-700 font-bold text-sm bg-green-50 px-2 py-1 rounded border border-green-200">
                      {(f.risk_delta * 100).toFixed(1)}% reduction
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs">{i+1}</div>
                    <div className="font-semibold text-slate-900 text-sm">Target {formatFeatureName(f.feature || f.label)}</div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Strategy: Our model projects that if you can {f.direction} this factor significantly, it will drive the largest immediate improvement to your survival rate.
                  </p>
                </div>
             ))}
             {fixes.length === 0 && <div className="text-sm text-slate-500 col-span-3">Your profile is highly optimized.</div>}
           </div>
        </div>

      </div>
    </div>
  );
}
