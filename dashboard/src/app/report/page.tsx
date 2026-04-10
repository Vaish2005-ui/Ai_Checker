"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertCircle, TrendingDown, TrendingUp, ShieldAlert, CheckCircle2, Activity, Play, Download, ArrowRight, Github } from "lucide-react";

/* ── Jira/Enterprise Dark Theme Tokens ────────────────────────────────────── */
const C = {
  bg:      "#1D2125",
  surface: "#22272B",
  card:    "#2C333A",
  border:  "#38414A",
  text:    "#B6C2CF",
  textMain:"#FFFFFF",
  blue:    "#579DFF",
  green:   "#22A06B",
  amber:   "#D97008",
  red:     "#CA3521",
};

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("startupReportData");
    if (data) {
      setReport(JSON.parse(data));
    } else {
      router.push("/assess");
    }
  }, [router]);

  if (!report) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh" }} className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#579DFF]"></div>
      </div>
    );
  }

  // Formatting strings
  const colorHex = report.color === "red" ? C.red : report.color === "amber" ? C.amber : C.green;
  
  // Format ML feature names into plain English
  const formatFeatureName = (str: string) => {
    if (str.includes("_")) {
      return str.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    return str;
  };

  const drivers = report.risk_drivers?.slice(0, 3) || [];
  const fixes = report.top_fixes?.slice(0, 3) || [];
  const dora = report.doraResult?.dora;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Segoe UI, Roboto, sans-serif" }} className="pb-16 text-[#B6C2CF]">
      
      {/* ── Top Navigation ────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }} className="flex items-center justify-between px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div style={{ background: C.blue, color: C.bg }} className="font-bold text-xs px-2 py-1 rounded">AI</div>
          <span className="text-sm font-semibold hover:text-[#579DFF] cursor-pointer text-white" onClick={() => router.push("/")}>
            Risk Check
          </span>
          <span className="text-sm px-2">/</span>
          <span className="text-sm font-medium">Risk Analysis Report</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} style={{ border: `1px solid ${C.border}` }} className="flex items-center gap-2 px-3 py-1.5 rounded text-sm hover:bg-[#38414A] transition-colors">
            <Download size={14} /> Export PDF
          </button>
          <button onClick={() => router.push("/assess")} style={{ background: C.blue, color: C.bg }} className="px-3 py-1.5 rounded text-sm font-semibold hover:opacity-90">
            New Assessment
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 mt-8">
        
        {/* ── Header Area ─────────────────────────────────────────────────── */}
        <div className="mb-6 pb-6" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#B6C2CF] mb-1">Generated {new Date().toLocaleDateString()}</p>
              <h1 className="text-3xl font-semibold text-white tracking-tight">{report.company}</h1>
              <p className="text-sm mt-1">{report.sector} Sector Analysis</p>
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
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6 }} className="p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <Activity size={16} /> Projected 12-Week Risk Trajectory
              </h2>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.timeline} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#38414A" vertical={false} />
                    <XAxis dataKey="week" stroke="#738496" tick={{ fill: '#738496', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `W${val}`} />
                    <YAxis stroke="#738496" tick={{ fill: '#738496', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val*100).toFixed(0)}%`} domain={[0, 1]} />
                    <Tooltip 
                      contentStyle={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 4, color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(val: number) => [`${(val*100).toFixed(1)}%`, 'Risk Model Projection']}
                      labelFormatter={(val) => `Week ${val}`}
                    />
                    <Line type="monotone" dataKey="risk" stroke={colorHex} strokeWidth={3} dot={{ fill: C.bg, stroke: colorHex, strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: colorHex }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DORA Scorecard */}
            {dora && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6 }} className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Github size={16} /> Engineering Health (DORA)
                  </h2>
                  <span className="text-xs bg-[#22272B] px-2 py-1 rounded border border-[#38414A]">Verified via GitHub API</span>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Deployment Freq", val: `${dora.deployment_frequency.value}/d`, tier: dora.deployment_frequency.tier },
                    { label: "Lead Time", val: `${dora.lead_time.value} days`, tier: dora.lead_time.tier },
                    { label: "Failure Rate", val: `${dora.change_failure_rate.value}%`, tier: dora.change_failure_rate.tier },
                    { label: "MTTR", val: `${dora.mttr.value} hrs`, tier: dora.mttr.tier }
                  ].map(m => (
                    <div key={m.label} style={{ background: C.surface, border: `1px solid ${C.border}` }} className="p-4 rounded text-center">
                      <div className="text-[11px] text-[#8C9BAB] uppercase tracking-wider mb-2 font-semibold">{m.label}</div>
                      <div className="text-xl font-bold text-white mb-1">{m.val}</div>
                      <div className={`text-xs font-bold ${m.tier === 'Elite' ? 'text-[#22A06B]' : m.tier === 'High' ? 'text-[#579DFF]' : m.tier === 'Medium' ? 'text-[#D97008]' : 'text-[#CA3521]'}`}>
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
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6 }} className="p-6 h-full">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                <ShieldAlert size={16} className="text-[#CA3521]" /> Top Risk Drivers
              </h2>
              <div className="space-y-4">
                {drivers.map((d: any, i: number) => {
                  const featureName = d.feature ? formatFeatureName(d.feature) : "Unknown Factor";
                  // Ex: "Tech Debt is currently too high and harming execution."
                  return (
                    <div key={i} className="flex gap-3 pb-4 border-b border-[#38414A] last:border-0 last:pb-0">
                      <div className="mt-1"><TrendingUp size={14} className="text-[#CA3521]" /></div>
                      <div>
                        <div className="font-semibold text-white text-sm mb-1">{featureName}</div>
                        <div className="text-xs text-[#8C9BAB] leading-relaxed">
                          This metric is elevating your overall risk profile by approximately +{(d.risk_delta * 100).toFixed(1)} percentage points.
                        </div>
                      </div>
                    </div>
                  );
                })}
                {drivers.length === 0 && <div className="text-sm text-[#8C9BAB]">No major risk drivers detected.</div>}
              </div>
            </div>

          </div>
        </div>

        {/* ── Recommendations Row ─────────────────────────────────────────── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6 }} className="p-6 mb-12">
           <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
             <CheckCircle2 size={16} className="text-[#22A06B]" /> AI Recommendations Strategy
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {fixes.map((f: any, i: number) => (
                <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}` }} className="p-5 rounded-md relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3">
                    <span className="text-[#22A06B] font-bold text-sm bg-[#164B35] px-2 py-1 rounded">
                      {(f.risk_delta * 100).toFixed(1)}% reduction
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-[#164B35] flex items-center justify-center text-[#22A06B] font-bold text-xs">{i+1}</div>
                    <div className="font-semibold text-white text-sm">Target {formatFeatureName(f.feature || f.label)}</div>
                  </div>
                  <p className="text-xs text-[#8C9BAB] leading-relaxed">
                    Strategy: Our model projects that if you can {f.direction} this factor significantly, it will drive the largest immediate improvement to your survival rate.
                  </p>
                </div>
             ))}
             {fixes.length === 0 && <div className="text-sm text-[#8C9BAB] col-span-3">Your profile is highly optimized.</div>}
           </div>
        </div>

      </div>
    </div>
  );
}
