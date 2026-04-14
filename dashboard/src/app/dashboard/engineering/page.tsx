"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Cog, Wrench, AlertTriangle, Server, Cpu, HardDrive, Activity, Zap, BarChart3, Gauge, Timer, CheckCircle2, XCircle } from "lucide-react";
import { API_BASE } from "@/lib/config";

const CARD = "bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px]";

export default function EngineeringDashboard() {
  const router = useRouter();
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    if (!compId) { router.push("/"); return; }
    fetch(`${API_BASE}/department/${compId}/engineering/risk`).then(r => r.json())
      .then(rd => { setRiskData(rd); setLoading(false); }).catch(console.error);
  }, [router]);

  if (loading) return (<div className="h-40 flex items-center justify-center"><div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /></div>);

  const metrics = riskData?.metrics || {};
  const riskPct = riskData?.risk_pct ?? 50;
  const techDebt = metrics["Tech Debt"] ?? 0;
  const secRisk = metrics["Security Risk"] ?? 0;
  const platformDep = metrics["Platform Dependency"] ?? 0;
  const executionFlaws = metrics["Execution Flaws"] ?? 0;

  const uptime = (99.9 - techDebt * 2 - secRisk * 1.5).toFixed(2);
  const mttr = (4 + executionFlaws * 20).toFixed(1);
  const infraCost = (15 + platformDep * 25).toFixed(0);
  const automationPct = (80 - techDebt * 30 - executionFlaws * 15).toFixed(0);

  const healthColor = riskPct <= 40 ? "#22c55e" : riskPct <= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div className="pb-24 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center"><Cog className="w-6 h-6 text-amber-500" /></div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Engineering</h1>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-900 text-white font-bold tracking-wider">ML-POWERED</span>
          </div>
          <p className="text-slate-500 text-sm">Uptime, infrastructure health &amp; system reliability — powered by ML predictions.</p>
        </div>
        <div className={`${CARD} px-6 py-4 flex items-center gap-5`}>
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={healthColor} strokeWidth="3" strokeDasharray={`${100 - riskPct}, 100`} strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-xl font-black text-slate-900">{(100 - riskPct).toFixed(0)}</span></div>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Infra Health</p>
            <p className="text-sm font-black" style={{ color: healthColor }}>{riskPct <= 40 ? "Stable" : riskPct <= 70 ? "Degraded" : "Critical"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: "Uptime", value: `${uptime}%`, icon: CheckCircle2, color: "#22c55e", sub: "SLA: 99.9%", bg: "bg-green-50/50" },
          { label: "MTTR", value: `${mttr}h`, icon: Timer, color: "#f59e0b", sub: "Mean time to recover", bg: "bg-amber-50/50" },
          { label: "Infra Cost", value: `$${infraCost}K`, icon: Server, color: "#3b82f6", sub: "Monthly cloud spend", bg: "bg-blue-50/50" },
          { label: "Automation", value: `${automationPct}%`, icon: Cpu, color: "#8b5cf6", sub: "CI/CD coverage", bg: "bg-violet-50/50" },
        ].map((m, i) => (
          <div key={i} className={`${CARD} p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${m.bg}`} />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4"><m.icon className="w-4 h-4" style={{ color: m.color }} /></div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">{m.label}</p>
              <p className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{m.value}</p>
              <p className="text-[10px] text-slate-500 font-medium">{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className={`${CARD} p-8`}>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center"><Gauge className="w-4 h-4 text-amber-500" /></div>
            System Performance
          </h3>
          <div className="space-y-6">
            {[
              { label: "CPU Utilization", value: `${(45 + techDebt * 30).toFixed(0)}%`, bar: 45 + techDebt * 30, color: "#f59e0b", icon: "⚡" },
              { label: "Memory Usage", value: `${(55 + executionFlaws * 25).toFixed(0)}%`, bar: 55 + executionFlaws * 25, color: "#3b82f6", icon: "🧠" },
              { label: "Disk I/O", value: `${(30 + platformDep * 20).toFixed(0)}%`, bar: 30 + platformDep * 20, color: "#22c55e", icon: "💾" },
              { label: "Network Latency", value: `${(20 + secRisk * 40).toFixed(0)}ms`, bar: Math.min(100, (20 + secRisk * 40)), color: "#8b5cf6", icon: "🌐" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5"><span>{item.icon}</span> {item.label}</span>
                  <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{item.value}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.max(0, Math.min(100, item.bar))}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {[
            { title: "Tech Debt", val: techDebt, icon: Wrench, iconBg: "bg-amber-50", iconColor: "text-amber-500" },
            { title: "Execution Flaws", val: executionFlaws, icon: XCircle, iconBg: "bg-red-50", iconColor: "text-red-500" },
          ].map((gauge, i) => (
            <div key={i} className={`${CARD} p-8`}>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">
                <div className={`w-8 h-8 rounded-full ${gauge.iconBg} flex items-center justify-center`}><gauge.icon className={`w-4 h-4 ${gauge.iconColor}`} /></div>
                {gauge.title}
              </h3>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={gauge.val > 0.5 ? "#ef4444" : gauge.val > 0.25 ? "#f59e0b" : "#22c55e"} strokeWidth="2.5" strokeDasharray={`${gauge.val * 100}, 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-black text-slate-900">{(gauge.val * 100).toFixed(0)}%</span></div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Level</p>
                  <p className={`text-lg font-black ${gauge.val > 0.5 ? 'text-red-500' : gauge.val > 0.25 ? 'text-amber-500' : 'text-green-500'}`}>{gauge.val > 0.5 ? "Critical" : gauge.val > 0.25 ? "Moderate" : "Low"}</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">From ML prediction</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`${CARD} p-8`}>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center"><Activity className="w-4 h-4 text-violet-500" /></div>
            Infrastructure
          </h3>
          <div className="space-y-4">
            {[
              { label: "Uptime SLA", value: `${uptime}%`, unit: "current", icon: CheckCircle2, color: "#22c55e" },
              { label: "Platform Dep.", value: `${(platformDep * 100).toFixed(0)}%`, unit: "risk", icon: HardDrive, color: "#3b82f6" },
              { label: "Automation", value: `${automationPct}%`, unit: "coverage", icon: Cpu, color: "#8b5cf6" },
              { label: "Overall Risk", value: `${riskPct}%`, unit: "from model", icon: AlertTriangle, color: "#f59e0b" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm border border-slate-100"><item.icon className="w-5 h-5" style={{ color: item.color }} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">{item.label}</p>
                  <p className="text-xl font-black text-slate-900 leading-none tracking-tight">{item.value}</p>
                </div>
                <span className="text-[10px] font-medium text-slate-400 text-right w-16">{item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`${CARD} p-6 flex items-start gap-4 bg-slate-900 text-white`}>
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0"><Zap className="w-5 h-5 text-amber-400" /></div>
        <div>
          <p className="text-base font-bold mb-1">ML Model Integration</p>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            Engineering metrics from: <code className="text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded">Tech Debt</code>, <code className="text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded">Security Risk</code>, <code className="text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded">Platform Dependency</code>, and <code className="text-amber-400 bg-slate-800 px-1.5 py-0.5 rounded">Execution Flaws</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
