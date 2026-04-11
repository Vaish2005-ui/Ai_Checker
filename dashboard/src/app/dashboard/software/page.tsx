"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Code2, GitBranch, Bug, Gauge, Activity, Rocket, Shield, AlertTriangle, CheckCircle2, Clock, TrendingUp, Zap, GitPullRequest, BarChart3 } from "lucide-react";

const CARD_CLASSES = "bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px]";

export default function SoftwareDashboard() {
  const router = useRouter();
  const [devMetrics, setDevMetrics] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    if (!compId) { router.push("/"); return; }

    Promise.all([
      fetch(`http://localhost:8002/department/${compId}/software/devmetrics`).then(r => r.json()),
      fetch(`http://localhost:8002/department/${compId}/software/risk`).then(r => r.json()),
    ]).then(([dm, rd]) => {
      setDevMetrics(dm);
      setRiskData(rd);
      setLoading(false);
    }).catch(console.error);
  }, [router]);

  if (loading) {
    return (
      <div className="h-40 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const dora = devMetrics?.dora || {};
  const github = devMetrics?.github_activity || {};
  const codeHealth = devMetrics?.code_health || 0;
  const techDebt = devMetrics?.tech_debt_score || 0;
  const secRisk = devMetrics?.security_risk_score || 0;

  const healthColor = codeHealth >= 70 ? "#22c55e" : codeHealth >= 40 ? "#f59e0b" : "#ef4444";
  const healthLabel = codeHealth >= 70 ? "Healthy" : codeHealth >= 40 ? "Warning" : "Critical";

  return (
    <div className="pb-24 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
              <Code2 className="w-6 h-6 text-orange-500" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Software Engineering</h1>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-900 text-white font-bold tracking-wider">ML-POWERED</span>
          </div>
          <p className="text-slate-500 text-sm">GitHub activity, DORA metrics & bug tracking — powered by your ML model predictions.</p>
        </div>
        {/* Code Health Gauge */}
        <div className={`${CARD_CLASSES} px-6 py-4 flex items-center gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow`}>
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#f1f5f9" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke={healthColor} strokeWidth="3"
                strokeDasharray={`${codeHealth}, 100`}
                strokeLinecap="round"
                className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-black text-slate-900">{codeHealth.toFixed(0)}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Code Health</p>
            <p className="text-sm font-black" style={{ color: healthColor }}>{healthLabel}</p>
          </div>
        </div>
      </div>

      {/* DORA Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { label: "Deploy Frequency", value: `${dora.deployment_frequency}/day`, icon: Rocket, color: "#22c55e", sub: "Elite: >1/day", bg: "bg-green-50/50" },
          { label: "Lead Time", value: `${dora.lead_time_days}d`, icon: Clock, color: "#3b82f6", sub: "Elite: <1 day", bg: "bg-blue-50/50" },
          { label: "MTTR", value: `${dora.mttr_hours}h`, icon: Zap, color: "#f59e0b", sub: "Elite: <1 hour", bg: "bg-amber-50/50" },
          { label: "Change Fail %", value: `${dora.change_failure_rate}%`, icon: AlertTriangle, color: "#ef4444", sub: "Elite: <15%", bg: "bg-red-50/50" },
        ].map((m, i) => (
          <div key={i} className={`${CARD_CLASSES} p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
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

      {/* GitHub Activity + Tech Debt + Bugs */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        
        {/* GitHub Activity Card */}
        <div className={`${CARD_CLASSES} p-8`}>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-teal-500" />
            </div>
            GitHub Activity
          </h3>
          <div className="space-y-6">
            {[
              { label: "Commits/week", value: github.commits_per_week, icon: "📝", bar: Math.min((github.commits_per_week / 50) * 100, 100), color: "#22c55e" },
              { label: "PRs/week", value: github.prs_per_week, icon: "🔀", bar: Math.min((github.prs_per_week / 20) * 100, 100), color: "#3b82f6" },
              { label: "Avg review time", value: `${github.avg_review_time_hours}h`, icon: "⏱️", bar: Math.min((github.avg_review_time_hours / 72) * 100, 100), color: "#f59e0b" },
              { label: "Bug rate /100 deploys", value: github.bug_rate_per_100_deploys, icon: "🐛", bar: Math.min((github.bug_rate_per_100_deploys / 30) * 100, 100), color: "#ef4444" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <span>{item.icon}</span> {item.label}
                  </span>
                  <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{item.value}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.bar}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Debt + Security */}
        <div className="space-y-6">
          {/* Tech Debt */}
          <div className={`${CARD_CLASSES} p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow`}>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-amber-500" />
              </div>
              Tech Debt Score
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke={techDebt > 50 ? "#ef4444" : techDebt > 25 ? "#f59e0b" : "#22c55e"} strokeWidth="2.5"
                    strokeDasharray={`${techDebt}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-slate-900">{techDebt.toFixed(0)}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Level</p>
                <p className={`text-lg font-black ${techDebt > 50 ? 'text-red-500' : techDebt > 25 ? 'text-amber-500' : 'text-green-500'}`}>
                  {techDebt > 50 ? "High Risk" : techDebt > 25 ? "Moderate" : "Low"}
                </p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">From ML prediction</p>
              </div>
            </div>
          </div>

          {/* Security Risk */}
          <div className={`${CARD_CLASSES} p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow`}>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-500" />
              </div>
              Security Risk
            </h3>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke={secRisk > 50 ? "#ef4444" : secRisk > 25 ? "#f59e0b" : "#22c55e"} strokeWidth="2.5"
                    strokeDasharray={`${secRisk}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-slate-900">{secRisk.toFixed(0)}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Exposure</p>
                <p className={`text-lg font-black ${secRisk > 50 ? 'text-red-500' : secRisk > 25 ? 'text-amber-500' : 'text-green-500'}`}>
                  {secRisk > 50 ? "Critical" : secRisk > 25 ? "Moderate" : "Secure"}
                </p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">From ML prediction</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sprint Stats */}
        <div className={`${CARD_CLASSES} p-8`}>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center">
              <Activity className="w-4 h-4 text-violet-500" />
            </div>
            Sprint Overview
          </h3>
          <div className="space-y-4">
            {[
              { label: "Sprint Velocity", value: devMetrics?.sprint_velocity || 0, unit: "pts/sprint", icon: TrendingUp, color: "#8b5cf6" },
              { label: "Open Bugs", value: devMetrics?.open_bugs || 0, unit: "active", icon: Bug, color: "#ef4444" },
              { label: "Resolved This Wk", value: devMetrics?.resolved_this_week || 0, unit: "closed", icon: CheckCircle2, color: "#22c55e" },
              { label: "Overall Risk", value: `${devMetrics?.overall_risk || 0}%`, unit: "from model", icon: AlertTriangle, color: "#f59e0b" },
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

      {/* ML Model Attribution Notice */}
      <div className={`${CARD_CLASSES} p-6 flex items-start gap-4 bg-slate-900 text-white`}>
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-orange-400" />
        </div>
        <div>
          <p className="text-base font-bold mb-1">ML Model Integration</p>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            These metrics are derived from the trained Random Forest model using features: <code className="text-orange-400 bg-slate-800 px-1.5 py-0.5 rounded">change_failure_rate</code>, <code className="text-orange-400 bg-slate-800 px-1.5 py-0.5 rounded">deployment_frequency</code>, <code className="text-orange-400 bg-slate-800 px-1.5 py-0.5 rounded">lead_time_days</code>, <code className="text-orange-400 bg-slate-800 px-1.5 py-0.5 rounded">mttr_hours</code>, <code className="text-orange-400 bg-slate-800 px-1.5 py-0.5 rounded">Tech Debt</code>, and <code className="text-orange-400 bg-slate-800 px-1.5 py-0.5 rounded">Security Risk</code>. The code health score is a composite metric calculated from model predictions.
          </p>
        </div>
      </div>
    </div>
  );
}
