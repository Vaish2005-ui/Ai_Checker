"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  predict, getImpact, getTimeline, simulate,
  DEFAULT_PROFILE, Profile
} from "@/lib/api";
import { API_BASE } from "@/lib/config";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid, ReferenceLine,
} from "recharts";

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F7F9FB",
  surface: "#ffffff",
  card: "#ffffff",
  border: "#e2e8f0",
  border2: "#cbd5e1",
  muted: "#64748b",
  text: "#1e293b",
  textDim: "#475569",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  red: "#ef4444",
  amber: "#f59e0b",
  green: "#22c55e",
  pink: "#ec4899",
  cyan: "#06b6d4",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function riskColor(pct: number) {
  if (pct >= 70) return { hex: C.red, label: "Critical", badge: "bg-red-500/20 text-red-400 border-red-500/30" };
  if (pct >= 40) return { hex: C.amber, label: "High", badge: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
  return { hex: C.green, label: "Low", badge: "bg-green-500/20 text-green-400 border-green-500/30" };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Topbar({ name, pct, label, badge }: { name: string; pct: number; label: string; badge: string }) {
  return (
    <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}
      className="flex items-center justify-between px-6 py-3 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div style={{ background: C.indigo }} className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold">AI</div>
        <span style={{ color: C.textDim }} className="text-xs">Risk Monitor /</span>
        <span className="text-sm font-semibold" style={{ color: C.text }}>{name}</span>
        <span style={{ background: C.border2, color: C.text }} className="text-xs px-2 py-0.5 rounded font-mono">v2.1.5</span>
      </div>
      <div className="flex items-center gap-6 text-xs">
        {[
          { label: "Critical", val: pct >= 70 ? "YES" : "NO", color: pct >= 70 ? C.red : C.muted },
          { label: "Risk score", val: `${pct}%`, color: riskColor(pct).hex },
          { label: "Status", val: label, color: riskColor(pct).hex },
          { label: "Features", val: "15", color: C.textDim },
        ].map((m, i) => (
          <div key={i} className="text-center">
            <div style={{ color: C.muted }} className="text-[10px] uppercase tracking-wider mb-0.5">{m.label}</div>
            <div style={{ color: m.color }} className="font-bold text-sm">{m.val}</div>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          {["●", "●", "○", "○"].map((d, i) => (
            <span key={i} style={{ color: i < 2 ? C.green : C.border2 }} className="text-[10px]">{d}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub?: string; color: string; icon: string;
}) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}` }}
      className="rounded-xl p-4 flex items-start gap-3">
      <div style={{ background: color + "22", color }} className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
        {icon}
      </div>
      <div>
        <div style={{ color: C.muted }} className="text-[11px] uppercase tracking-wider mb-0.5">{label}</div>
        <div style={{ color }} className="text-2xl font-bold leading-none">{value}</div>
        {sub && <div style={{ color: C.muted }} className="text-[11px] mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function SideSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const barColor = pct > 66 ? C.red : pct > 33 ? C.amber : C.green;
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span style={{ color: C.textDim }} className="text-[11px]">{label}</span>
        <span style={{ color: C.text }} className="text-[11px] font-mono font-medium">{value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ accentColor: barColor }}
        className="w-full h-1 rounded cursor-pointer" />
    </div>
  );
}

function NavIcon({ icon, active, onClick }: { icon: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      style={{ background: active ? C.indigo + "33" : "transparent", color: active ? C.indigo : C.muted }}
      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg hover:bg-slate-100 transition-colors">
      {icon}
    </button>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 8 }} className="px-3 py-2 text-xs">
      <div style={{ color: C.muted }} className="mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}{typeof p.value === 'number' && p.value <= 1 ? '' : '%'}</div>
      ))}
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [startupName, setStartupName] = useState("My Tech Startup");
  const [tab, setTab] = useState(0);
  const [riskData, setRiskData] = useState<any>({ risk_pct: 71, label: "Critical", color: "red" });
  const [impactData, setImpactData] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [simFeature, setSimFeature] = useState("Competition");
  const [simValue, setSimValue] = useState(0.5);
  const [simResult, setSimResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sideOpen, setSideOpen] = useState(true);

  const set = (key: keyof Profile) => (val: number) =>
    setProfile(p => ({ ...p, [key]: val }));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [r, imp, tl] = await Promise.all([
        predict(profile), getImpact(profile), getTimeline(profile, 12),
      ]);
      setRiskData(r);
      setImpactData(imp);
      setTimelineData(tl.map((d: any) => ({ week: `W${d.week}`, risk: parseFloat((d.risk * 100).toFixed(1)) })));
    } catch {
      console.error("API offline — is uvicorn running on port 8000?");
    }
    setLoading(false);
  }, [profile]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    if (compId) {
      fetch(`${API_BASE}/company/info?company_id=${compId}`)
        .then(res => res.json())
        .then(data => { if (data.name) setStartupName(data.name); })
        .catch(console.error);
    }
  }, []);

  const runSim = async () => {
    const res = await simulate(profile, simFeature, simValue);
    setSimResult(res);
  };

  const pct = riskData?.risk_pct ?? 71;
  const rc = riskColor(pct);
  const label = riskData?.label ?? "Critical";

  const topRisks = impactData?.risks?.slice(0, 5).map((d: any) => ({
    name: d.label?.split(" ").slice(0, 2).join(" ") ?? d.feature,
    value: parseFloat((d.risk_delta * 100).toFixed(1)),
  })) ?? [];

  const topGains = impactData?.improvements?.slice(0, 6).map((d: any) => ({
    name: d.label?.split(" ").slice(0, 2).join(" ") ?? d.feature,
    value: Math.abs(parseFloat((d.risk_delta * 100).toFixed(1))),
  })) ?? [];

  const logEntries = [
    { time: "now", level: "CRITICAL", msg: `Failure risk at ${pct}% — ${label}` },
    { time: "-1m", level: "HIGH", msg: `Competition score: ${profile.competition.toFixed(2)}` },
    { time: "-3m", level: "HIGH", msg: `Platform dependency: ${profile.platform_dependency.toFixed(2)}` },
    { time: "-5m", level: "MEDIUM", msg: `Giants pressure: ${profile.giants.toFixed(2)}` },
    { time: "-8m", level: "INFO", msg: `Market fit score: ${(1 - profile.poor_market_fit).toFixed(2)}` },
    { time: "-12m", level: "INFO", msg: `Funding: $${profile.how_much_they_raised}M raised` },
  ];

  const logColor = (l: string) =>
    l === "CRITICAL" ? C.red : l === "HIGH" ? C.amber : l === "MEDIUM" ? C.violet : C.cyan;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Topbar name={startupName} pct={pct} label={label} badge={rc.badge} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left nav ──────────────────────────────────────────────── */}
        <div style={{ background: C.surface, borderRight: `1px solid ${C.border}`, width: 56 }}
          className="flex flex-col items-center py-4 gap-2 flex-shrink-0">
          <NavIcon icon="⌂" active={tab === 0} onClick={() => setTab(0)} />
          <NavIcon icon="◎" active={tab === 1} onClick={() => setTab(1)} />
          <NavIcon icon="⚡" active={tab === 2} onClick={() => setTab(2)} />
          <NavIcon icon="↗" active={tab === 3} onClick={() => setTab(3)} />
          <div className="flex-1" />
          <NavIcon icon="⚙" />
        </div>

        {/* ── Left sidebar — profile inputs ─────────────────────────── */}
        {sideOpen && (
          <div style={{ background: C.surface, borderRight: `1px solid ${C.border}`, width: 240, overflowY: "auto" }}
            className="flex-shrink-0 p-4">
            <div className="flex items-center justify-between mb-4">
              <span style={{ color: C.muted }} className="text-[10px] uppercase tracking-widest">Startup Profile</span>
              <button onClick={() => setSideOpen(false)} style={{ color: C.muted }} className="text-xs hover:text-slate-900">✕</button>
            </div>

            <input value={startupName} onChange={e => setStartupName(e.target.value)}
              style={{ background: C.card, border: `1px solid ${C.border2}`, color: C.text }}
              className="w-full rounded-lg px-3 py-2 text-xs mb-4 outline-none focus:border-indigo-500"
              placeholder="Startup name" />

            <div style={{ color: C.muted }} className="text-[10px] uppercase tracking-widest mb-2">Basics</div>
            <SideSlider label="Years of operation" value={profile.years_of_operation} min={0} max={20} step={0.5} onChange={set("years_of_operation")} />
            <SideSlider label="Funding raised ($M)" value={profile.how_much_they_raised} min={0} max={1200} step={10} onChange={set("how_much_they_raised")} />
            <SideSlider label="Monitoring week" value={profile.week} min={1} max={12} step={1} onChange={set("week")} />

            <div style={{ color: C.muted }} className="text-[10px] uppercase tracking-widest mb-2 mt-4">Market</div>
            <SideSlider label="Competition" value={profile.competition} min={0} max={2} step={0.1} onChange={set("competition")} />
            <SideSlider label="Giants pressure" value={profile.giants} min={0} max={2} step={0.1} onChange={set("giants")} />
            <SideSlider label="Niche limits" value={profile.niche_limits} min={0} max={2} step={0.05} onChange={set("niche_limits")} />
            <SideSlider label="Trend shifts" value={profile.trend_shifts} min={0} max={2} step={0.05} onChange={set("trend_shifts")} />

            <div style={{ color: C.muted }} className="text-[10px] uppercase tracking-widest mb-2 mt-4">Product</div>
            <SideSlider label="Poor market fit" value={profile.poor_market_fit} min={0} max={2} step={0.05} onChange={set("poor_market_fit")} />
            <SideSlider label="Execution flaws" value={profile.execution_flaws} min={0} max={2} step={0.05} onChange={set("execution_flaws")} />
            <SideSlider label="Platform dependency" value={profile.platform_dependency} min={0} max={2} step={0.05} onChange={set("platform_dependency")} />
            <SideSlider label="Monetization failure" value={profile.monetization_failure} min={0} max={2} step={0.05} onChange={set("monetization_failure")} />
            <SideSlider label="Overhype" value={profile.overhype} min={0} max={2} step={0.05} onChange={set("overhype")} />

            <div style={{ color: C.muted }} className="text-[10px] uppercase tracking-widest mb-2 mt-4">Financial</div>
            <SideSlider label="No budget risk" value={profile.no_budget} min={0} max={2} step={0.1} onChange={set("no_budget")} />
            <SideSlider label="Acquisition stagnation" value={profile.acquisition_stagnation} min={0} max={2} step={0.05} onChange={set("acquisition_stagnation")} />
            <SideSlider label="Regulatory pressure" value={profile.regulatory_pressure} min={0} max={2} step={0.05} onChange={set("regulatory_pressure")} />
            <SideSlider label="Toxicity / trust" value={profile.toxicity_trust_issues} min={0} max={2} step={0.05} onChange={set("toxicity_trust_issues")} />
          </div>
        )}

        {/* ── Main content ───────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {!sideOpen && (
            <button onClick={() => setSideOpen(true)}
              style={{ background: C.card, border: `1px solid ${C.border}`, color: C.muted }}
              className="mb-4 px-3 py-1.5 rounded-lg text-xs hover:text-slate-900 transition-colors">
              ☰ Profile
            </button>
          )}

          {/* ── Metric cards row ───────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            <MetricCard label="Failure Risk" value={`${pct}%`} sub={label} color={rc.hex} icon="⚠" />
            <MetricCard label="Competition" value={`${profile.competition.toFixed(2)}`} sub="out of 2.0" color={C.violet} icon="⚡" />
            <MetricCard label="Funding Raised" value={`$${profile.how_much_they_raised}M`} sub="total capital" color={C.cyan} icon="◈" />
            <MetricCard label="Week" value={`W${profile.week}`} sub="monitoring period" color={C.indigo} icon="◷" />
          </div>

          {/* ── Tab nav ────────────────────────────────────────────── */}
          <div style={{ borderBottom: `1px solid ${C.border}` }} className="flex gap-1 mb-5">
            {["Risk Timeline", "What-if Simulation", "Feature Impact", "Risk Signals"].map((t, i) => (
              <button key={i} onClick={() => setTab(i)}
                style={{
                  color: tab === i ? C.text : C.muted,
                  borderBottom: tab === i ? `2px solid ${C.indigo}` : "2px solid transparent",
                  background: "transparent",
                }}
                className="px-4 py-2.5 text-xs font-medium transition-colors hover:text-slate-900">
                {t}
              </button>
            ))}
          </div>

          {/* ── TAB 0: Risk Timeline ───────────────────────────────── */}
          {tab === 0 && (
            <div className="space-y-4">
              {/* Area chart */}
              <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div style={{ color: C.text }} className="text-sm font-semibold">Risk Duration Percentiles</div>
                    <div style={{ color: C.muted }} className="text-xs mt-0.5">Failure risk across monitoring weeks</div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    {[["p50", C.indigo], ["p75", C.violet], ["p95", C.pink], ["max", C.amber]].map(([l, c]) => (
                      <span key={l} className="flex items-center gap-1">
                        <span style={{ background: c as string }} className="w-3 h-0.5 inline-block rounded" />
                        <span style={{ color: C.muted }}>{l}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      {[["g1", C.indigo], ["g2", C.violet], ["g3", C.pink], ["g4", C.amber]].map(([id, color]) => (
                        <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color as string} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={color as string} stopOpacity={0.02} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="week" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={70} stroke={C.red} strokeDasharray="4 2" strokeOpacity={0.5} />
                    <ReferenceLine y={40} stroke={C.amber} strokeDasharray="4 2" strokeOpacity={0.4} />
                    <Area type="monotone" dataKey="risk" name="p50" stroke={C.indigo} strokeWidth={2} fill="url(#g1)" />
                    <Area type="monotone" dataKey="risk" name="p75" stroke={C.violet} strokeWidth={1.5} fill="url(#g2)" strokeOpacity={0.6} />
                    <Area type="monotone" dataKey="risk" name="p95" stroke={C.pink} strokeWidth={1} fill="url(#g3)" strokeOpacity={0.4} />
                    <Area type="monotone" dataKey="risk" name="max" stroke={C.amber} strokeWidth={1} fill="url(#g4)" strokeOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom row: stats + logs */}
              <div className="grid grid-cols-3 gap-4">
                {/* Stats */}
                <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-xl p-4 col-span-1">
                  <div style={{ color: C.muted }} className="text-[10px] uppercase tracking-widest mb-3">Risk Stats</div>
                  {[
                    { label: "Minimum", val: timelineData.length ? `${Math.min(...timelineData.map(d => d.risk)).toFixed(1)}%` : "—" },
                    { label: "Maximum", val: timelineData.length ? `${Math.max(...timelineData.map(d => d.risk)).toFixed(1)}%` : "—" },
                    { label: "Average", val: timelineData.length ? `${(timelineData.reduce((a, d) => a + d.risk, 0) / timelineData.length).toFixed(1)}%` : "—" },
                    { label: "Median", val: timelineData.length ? `${timelineData[Math.floor(timelineData.length / 2)]?.risk.toFixed(1)}%` : "—" },
                  ].map((s, i) => (
                    <div key={i} className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ color: C.muted }} className="text-xs">{s.label}</span>
                      <span style={{ color: C.text }} className="text-sm font-semibold">{s.val}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2">
                    <span style={{ color: C.muted }} className="text-xs">Impacted Branch</span>
                    <span style={{ background: C.border2, color: C.textDim }} className="text-[10px] px-2 py-0.5 rounded font-mono">main-branch</span>
                  </div>
                </div>

                {/* Error logs */}
                <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-xl p-4 col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ color: C.muted }} className="text-[10px] uppercase tracking-widest">Risk Logs</span>
                    <span style={{ color: C.muted }} className="text-[10px]">🔍</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {logEntries.map((e, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span style={{ color: C.muted }} className="flex-shrink-0 w-8">{e.time}</span>
                        <span style={{ color: logColor(e.level) }} className="flex-shrink-0 w-16">{e.level}</span>
                        <span style={{ color: C.textDim }}>{e.msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 1: What-if Simulation ─────────────────────────── */}
          {tab === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-xl p-5">
                  <div style={{ color: C.text }} className="text-sm font-semibold mb-1">Simulate a change</div>
                  <div style={{ color: C.muted }} className="text-xs mb-4">Change one factor and see the risk impact</div>

                  <label style={{ color: C.muted }} className="text-[10px] uppercase tracking-wider block mb-1">Feature</label>
                  <select value={simFeature} onChange={e => setSimFeature(e.target.value)}
                    style={{ background: C.surface, border: `1px solid ${C.border2}`, color: C.text }}
                    className="w-full rounded-lg px-3 py-2 text-xs mb-4 outline-none">
                    {[
                      ["Competition", "Competition intensity"],
                      ["Giants", "Giants pressure"],
                      ["Poor Market Fit", "Poor market fit"],
                      ["Execution Flaws", "Execution flaws"],
                      ["Platform Dependency", "Platform dependency"],
                      ["No Budget", "No budget risk"],
                      ["Acquisition Stagnation", "Acquisition stagnation"],
                      ["Regulatory Pressure", "Regulatory pressure"],
                      ["Overhype", "Overhype"],
                      ["How Much They Raised", "Funding raised ($M)"],
                    ].map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                  </select>

                  <label style={{ color: C.muted }} className="text-[10px] uppercase tracking-wider block mb-1">
                    New value: <span style={{ color: C.text }} className="font-mono">{simValue.toFixed(2)}</span>
                  </label>
                  <input type="range" min={0} max={simFeature === "How Much They Raised" ? 1200 : 2}
                    step={simFeature === "How Much They Raised" ? 10 : 0.05}
                    value={simValue} onChange={e => setSimValue(parseFloat(e.target.value))}
                    style={{ accentColor: C.indigo }} className="w-full mb-4" />

                  <button onClick={runSim}
                    style={{ background: C.indigo, color: "white" }}
                    className="w-full py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity">
                    Run simulation →
                  </button>
                </div>

                <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-xl p-5">
                  <div style={{ color: C.text }} className="text-sm font-semibold mb-4">Result</div>
                  {simResult ? (
                    <>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                          { label: "Before", val: `${(simResult.risk_before * 100).toFixed(1)}%`, color: C.indigo },
                          { label: "After", val: `${(simResult.risk_after * 100).toFixed(1)}%`, color: riskColor(simResult.risk_after * 100).hex },
                        ].map((m, i) => (
                          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border2}` }} className="rounded-xl p-4 text-center">
                            <div style={{ color: C.muted }} className="text-[10px] uppercase tracking-wider mb-1">{m.label}</div>
                            <div style={{ color: m.color }} className="text-3xl font-bold">{m.val}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{
                        background: simResult.risk_delta < 0 ? C.green + "15" : C.red + "15",
                        border: `1px solid ${simResult.risk_delta < 0 ? C.green + "40" : C.red + "40"}`,
                        color: simResult.risk_delta < 0 ? C.green : C.red,
                      }} className="rounded-xl p-3 text-center text-sm font-semibold">
                        {simResult.risk_delta < 0 ? "▼" : "▲"} {Math.abs(simResult.risk_delta * 100).toFixed(1)} pp
                        {simResult.risk_delta < 0 ? " improvement" : " increase"}
                      </div>
                      <div style={{ color: C.muted }} className="text-[11px] mt-3">
                        Changed: <span style={{ color: C.textDim }}>{simResult.label || simFeature}</span> →{" "}
                        <span style={{ color: C.text }}>{simValue}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ color: C.muted }} className="text-xs text-center mt-8">
                      Select a feature and click<br />"Run simulation" to see results
                    </div>
                  )}
                </div>
              </div>

              {/* Waterfall-style trace view */}
              <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-xl p-5">
                <div className="flex items-center gap-4 mb-4 text-xs border-b pb-3" style={{ borderColor: C.border }}>
                  {["Waterfall", "Attributes", "Profiles"].map((t, i) => (
                    <button key={i} style={{
                      color: i === 0 ? C.indigo : C.muted,
                      borderBottom: i === 0 ? `1px solid ${C.indigo}` : "none"
                    }}
                      className="pb-1 font-medium">{t}</button>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { name: "competition", label: "Competition analysis", color: C.violet, pct: (profile.competition / 2) * 100, w: "85%" },
                    { name: "market_fit", label: "Market fit validation", color: C.indigo, pct: (profile.poor_market_fit / 2) * 100, w: "60%" },
                    { name: "execution", label: "Execution risk scan", color: C.pink, pct: (profile.execution_flaws / 2) * 100, w: "40%" },
                    { name: "platform", label: "Platform dependency check", color: C.amber, pct: (profile.platform_dependency / 2) * 100, w: "70%" },
                    { name: "funding", label: "Financial runway check", color: C.cyan, pct: Math.min((profile.how_much_they_raised / 1200) * 100, 100), w: "55%" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 text-[11px]">
                      <span style={{ color: C.muted }} className="w-4 text-[10px]">{i + 1}</span>
                      <span style={{ color: C.textDim }} className="w-44 truncate">{r.label}</span>
                      <div style={{ flex: 1, background: C.surface, borderRadius: 3, height: 16, position: "relative" }}>
                        <div style={{
                          width: `${r.pct}%`, background: r.color + "50",
                          border: `1px solid ${r.color}80`, borderRadius: 3,
                          height: "100%", maxWidth: "100%",
                        }} />
                      </div>
                      <span style={{ color: r.color }} className="w-10 text-right font-mono">{r.pct.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: Feature Impact ─────────────────────────────── */}
          {tab === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-xl p-5">
                <div style={{ color: C.text }} className="text-sm font-semibold mb-1">Top improvements</div>
                <div style={{ color: C.muted }} className="text-xs mb-4">Actions that reduce failure risk (±20%)</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topGains} layout="vertical" margin={{ left: 0, right: 40 }}>
                    <XAxis type="number" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `-${v}pp`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {topGains.map((_: any, i: number) => (
                        <Cell key={i} fill={C.green} fillOpacity={0.8 - i * 0.08} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-xl p-5">
                <div style={{ color: C.text }} className="text-sm font-semibold mb-1">Top risk factors</div>
                <div style={{ color: C.muted }} className="text-xs mb-4">Changes that would increase risk most</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topRisks} layout="vertical" margin={{ left: 0, right: 40 }}>
                    <XAxis type="number" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `+${v}pp`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: C.muted, fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {topRisks.map((_: any, i: number) => (
                        <Cell key={i} fill={C.red} fillOpacity={0.8 - i * 0.08} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── TAB 3: Risk Signals ───────────────────────────────── */}
          {tab === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Critical signals", count: [pct >= 70, profile.competition >= 1.2, profile.platform_dependency >= 0.5].filter(Boolean).length, color: C.red },
                  { label: "High signals", count: [profile.giants >= 1.0, profile.poor_market_fit >= 0.3, profile.execution_flaws >= 0.3].filter(Boolean).length, color: C.amber },
                  { label: "Info signals", count: [profile.how_much_they_raised > 0, true, true].filter(Boolean).length, color: C.cyan },
                ].map((s, i) => (
                  <div key={i} style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-xl p-4 text-center">
                    <div style={{ color: s.color }} className="text-4xl font-bold">{s.count}</div>
                    <div style={{ color: C.muted }} className="text-xs mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: C.card, border: `1px solid ${C.border}` }} className="rounded-xl p-5">
                <div style={{ color: C.muted }} className="text-[10px] uppercase tracking-widest mb-3">Signal Trace</div>
                <div className="space-y-2">
                  {[
                    { sig: `Competition (${profile.competition.toFixed(2)})`, desc: "Competitive market pressure", level: profile.competition >= 1.2 ? "CRITICAL" : profile.competition >= 0.8 ? "HIGH" : "OK", ms: "0.23s" },
                    { sig: `Giants (${profile.giants.toFixed(2)})`, desc: "Giant competitor threat", level: profile.giants >= 1.2 ? "CRITICAL" : profile.giants >= 0.8 ? "HIGH" : "OK", ms: "2.08s" },
                    { sig: `Market fit (${profile.poor_market_fit.toFixed(2)})`, desc: "Product-market alignment", level: profile.poor_market_fit >= 0.5 ? "HIGH" : profile.poor_market_fit >= 0.1 ? "MEDIUM" : "OK", ms: "6s" },
                    { sig: `Execution (${profile.execution_flaws.toFixed(2)})`, desc: "Team execution quality", level: profile.execution_flaws >= 0.5 ? "HIGH" : profile.execution_flaws >= 0.2 ? "MEDIUM" : "OK", ms: "0.8s" },
                    { sig: `Platform dep. (${profile.platform_dependency.toFixed(2)})`, desc: "Single platform risk", level: profile.platform_dependency >= 0.5 ? "CRITICAL" : "OK", ms: "4.40s" },
                    { sig: `Funding ($${profile.how_much_they_raised}M)`, desc: "Capital runway", level: profile.how_much_they_raised < 5 ? "CRITICAL" : profile.how_much_they_raised < 20 ? "HIGH" : "OK", ms: "1.2s" },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                        background: r.level === "CRITICAL" ? C.red : r.level === "HIGH" ? C.amber : r.level === "MEDIUM" ? C.violet : C.green,
                      }} />
                      <span style={{ color: C.text }} className="text-xs font-medium w-40 flex-shrink-0">{r.sig}</span>
                      <span style={{ color: C.muted }} className="text-xs flex-1">{r.desc}</span>
                      <span style={{
                        color: r.level === "CRITICAL" ? C.red : r.level === "HIGH" ? C.amber : r.level === "MEDIUM" ? C.violet : C.green,
                        background: (r.level === "CRITICAL" ? C.red : r.level === "HIGH" ? C.amber : r.level === "OK" ? C.green : C.violet) + "20",
                      }} className="text-[10px] px-2 py-0.5 rounded font-medium">{r.level}</span>
                      <span style={{ color: C.muted }} className="text-[10px] font-mono w-10 text-right">{r.ms}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
