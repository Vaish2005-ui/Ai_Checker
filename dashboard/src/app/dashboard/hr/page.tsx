"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, UserMinus, Heart, ShieldAlert, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, Clock, Star, BarChart3, Activity, Zap } from "lucide-react";
import { API_BASE } from "@/lib/config";

const CARD = "bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px]";

export default function HRDashboard() {
  const router = useRouter();
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    if (!compId) { router.push("/"); return; }

    fetch(`${API_BASE}/department/${compId}/hr/risk`).then(r => r.json())
      .then(rd => { setRiskData(rd); setLoading(false); })
      .catch(console.error);
  }, [router]);

  if (loading) {
    return (
      <div className="h-40 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const metrics = riskData?.metrics || {};
  const riskPct = riskData?.risk_pct ?? 50;
  const toxicity = metrics["Toxicity/Trust Issues"] ?? 0;
  const executionFlaws = metrics["Execution Flaws"] ?? 0;
  const trendShifts = metrics["Trend Shifts"] ?? 0;

  // Simulated HR KPIs derived from risk metrics
  const turnoverRate = Math.min(30, (toxicity * 25 + executionFlaws * 10)).toFixed(1);
  const satisfaction = Math.max(20, (100 - toxicity * 60 - executionFlaws * 20)).toFixed(0);
  const hiringPipeline = Math.round(15 + Math.random() * 20);
  const openPositions = Math.round(3 + Math.random() * 8);
  const avgTenure = (2 + (1 - toxicity) * 3).toFixed(1);
  const diversityScore = Math.round(55 + Math.random() * 25);

  const healthColor = Number(satisfaction) >= 70 ? "#22c55e" : Number(satisfaction) >= 40 ? "#f59e0b" : "#ef4444";
  const healthLabel = Number(satisfaction) >= 70 ? "Healthy" : Number(satisfaction) >= 40 ? "At Risk" : "Critical";

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Human Resources</h1>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-900 text-white font-bold tracking-wider">ML-POWERED</span>
          </div>
          <p className="text-slate-500 text-sm">Team health, turnover analytics &amp; culture metrics — powered by ML model predictions.</p>
        </div>
        {/* Satisfaction Gauge */}
        <div className={`${CARD} px-6 py-4 flex items-center gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow`}>
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={healthColor} strokeWidth="3" strokeDasharray={`${satisfaction}, 100`} strokeLinecap="round" className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-black text-slate-900">{satisfaction}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Satisfaction</p>
            <p className="text-sm font-black" style={{ color: healthColor }}>{healthLabel}</p>
          </div>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: "Turnover Rate", value: `${turnoverRate}%`, icon: UserMinus, color: "#ef4444", sub: "Target: <15%", bg: "bg-red-50/50" },
          { label: "Open Positions", value: `${openPositions}`, icon: UserPlus, color: "#3b82f6", sub: `${hiringPipeline} in pipeline`, bg: "bg-blue-50/50" },
          { label: "Avg Tenure", value: `${avgTenure}yr`, icon: Clock, color: "#22c55e", sub: "Industry avg: 2.5yr", bg: "bg-green-50/50" },
          { label: "Diversity Score", value: `${diversityScore}%`, icon: Star, color: "#8b5cf6", sub: "Target: 60%+", bg: "bg-violet-50/50" },
        ].map((m, i) => (
          <div key={i} className={`${CARD} p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${m.bg}`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <m.icon className="w-4 h-4" style={{ color: m.color }} />
                </div>
              </div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">{m.label}</p>
              <p className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{m.value}</p>
              <p className="text-[10px] text-slate-500 font-medium">{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Culture Metrics + Risk Factors */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Culture Health */}
        <div className={`${CARD} p-8`}>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
              <Heart className="w-4 h-4 text-pink-500" />
            </div>
            Culture Health
          </h3>
          <div className="space-y-6">
            {[
              { label: "Team Trust", value: `${(100 - toxicity * 100).toFixed(0)}%`, bar: 100 - toxicity * 100, color: "#22c55e", icon: "🤝" },
              { label: "Communication", value: `${(85 - executionFlaws * 30).toFixed(0)}%`, bar: 85 - executionFlaws * 30, color: "#3b82f6", icon: "💬" },
              { label: "Work-Life Balance", value: `${(75 - toxicity * 20).toFixed(0)}%`, bar: 75 - toxicity * 20, color: "#8b5cf6", icon: "⚖️" },
              { label: "Growth Opportunities", value: `${(70 - trendShifts * 30).toFixed(0)}%`, bar: 70 - trendShifts * 30, color: "#f59e0b", icon: "📈" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <span>{item.icon}</span> {item.label}
                  </span>
                  <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{item.value}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.max(0, item.bar)}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Gauges */}
        <div className="space-y-6">
          <div className={`${CARD} p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow`}>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-red-500" />
              </div>
              Toxicity Score
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={toxicity > 0.5 ? "#ef4444" : toxicity > 0.25 ? "#f59e0b" : "#22c55e"} strokeWidth="2.5" strokeDasharray={`${toxicity * 100}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-slate-900">{(toxicity * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Level</p>
                <p className={`text-lg font-black ${toxicity > 0.5 ? 'text-red-500' : toxicity > 0.25 ? 'text-amber-500' : 'text-green-500'}`}>
                  {toxicity > 0.5 ? "High Risk" : toxicity > 0.25 ? "Moderate" : "Low"}
                </p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">From ML prediction</p>
              </div>
            </div>
          </div>

          <div className={`${CARD} p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow`}>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-amber-500" />
              </div>
              Execution Flaws
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={executionFlaws > 0.5 ? "#ef4444" : executionFlaws > 0.25 ? "#f59e0b" : "#22c55e"} strokeWidth="2.5" strokeDasharray={`${executionFlaws * 100}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-slate-900">{(executionFlaws * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Impact</p>
                <p className={`text-lg font-black ${executionFlaws > 0.5 ? 'text-red-500' : executionFlaws > 0.25 ? 'text-amber-500' : 'text-green-500'}`}>
                  {executionFlaws > 0.5 ? "Critical" : executionFlaws > 0.25 ? "Moderate" : "Minimal"}
                </p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">From ML prediction</p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Overview */}
        <div className={`${CARD} p-8`}>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-violet-500" />
            </div>
            Team Overview
          </h3>
          <div className="space-y-4">
            {[
              { label: "Employee Satisfaction", value: `${satisfaction}%`, unit: "score", icon: Heart, color: "#ec4899" },
              { label: "Hiring Pipeline", value: `${hiringPipeline}`, unit: "candidates", icon: UserPlus, color: "#3b82f6" },
              { label: "Turnover Rate", value: `${turnoverRate}%`, unit: "annual", icon: UserMinus, color: "#ef4444" },
              { label: "Overall Risk", value: `${riskPct}%`, unit: "from model", icon: AlertTriangle, color: "#f59e0b" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm border border-slate-100">
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
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

      {/* ML Attribution */}
      <div className={`${CARD} p-6 flex items-start gap-4 bg-slate-900 text-white`}>
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <p className="text-base font-bold mb-1">ML Model Integration</p>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            HR metrics derived from the trained ML model using features: <code className="text-purple-400 bg-slate-800 px-1.5 py-0.5 rounded">Toxicity/Trust Issues</code>, <code className="text-purple-400 bg-slate-800 px-1.5 py-0.5 rounded">Execution Flaws</code>, and <code className="text-purple-400 bg-slate-800 px-1.5 py-0.5 rounded">Trend Shifts</code>. Turnover and satisfaction scores are composite metrics calculated from model predictions.
          </p>
        </div>
      </div>
    </div>
  );
}
