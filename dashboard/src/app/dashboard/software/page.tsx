"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Code2, GitBranch, Bug, Gauge, Activity, Rocket, Shield, AlertTriangle, CheckCircle2, Clock, TrendingUp, Zap, GitPullRequest, BarChart3 } from "lucide-react";

export default function SoftwareDashboard() {
  const router = useRouter();
  const [devMetrics, setDevMetrics] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    if (!compId) { router.push("/"); return; }

    Promise.all([
      fetch(`http://localhost:8000/department/${compId}/software/devmetrics`).then(r => r.json()),
      fetch(`http://localhost:8000/department/${compId}/software/risk`).then(r => r.json()),
    ]).then(([dm, rd]) => {
      setDevMetrics(dm);
      setRiskData(rd);
      setLoading(false);
    }).catch(console.error);
  }, [router]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading software metrics...</span>
        </div>
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
    <div className="p-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Code2 className="w-7 h-7 text-orange-400" />
            <h1 className="text-3xl font-bold text-white">Software Engineering</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">ML-POWERED</span>
          </div>
          <p className="text-slate-400 text-sm">GitHub activity, DORA metrics & bug tracking — powered by your ML model predictions.</p>
        </div>
        {/* Code Health Gauge */}
        <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl px-6 py-4 flex items-center gap-4 shadow-xl">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#1e2035" strokeWidth="3" />
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke={healthColor} strokeWidth="3"
                strokeDasharray={`${codeHealth}, 100`}
                strokeLinecap="round"
                className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black text-white">{codeHealth.toFixed(0)}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Code Health</p>
            <p className="text-sm font-bold" style={{ color: healthColor }}>{healthLabel}</p>
          </div>
        </div>
      </div>

      {/* DORA Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Deploy Frequency", value: `${dora.deployment_frequency}/day`, icon: Rocket, color: "#22c55e", sub: "Elite: >1/day" },
          { label: "Lead Time", value: `${dora.lead_time_days}d`, icon: Clock, color: "#3b82f6", sub: "Elite: <1 day" },
          { label: "MTTR", value: `${dora.mttr_hours}h`, icon: Zap, color: "#f59e0b", sub: "Elite: <1 hour" },
          { label: "Change Fail %", value: `${dora.change_failure_rate}%`, icon: AlertTriangle, color: "#ef4444", sub: "Elite: <15%" },
        ].map((m, i) => (
          <div key={i} className="bg-[#13131f] border border-[#1e2035] rounded-xl p-5 relative overflow-hidden group hover:border-[#252540] transition-all">
            <div className="absolute -top-8 -right-8 w-20 h-20 blur-2xl rounded-full opacity-20" style={{ background: m.color }} />
            <div className="flex items-center gap-2 mb-3">
              <m.icon className="w-4 h-4" style={{ color: m.color }} />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{m.label}</span>
            </div>
            <p className="text-2xl font-black text-white mb-1">{m.value}</p>
            <p className="text-[10px] text-slate-600">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* GitHub Activity + Tech Debt + Bugs */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        
        {/* GitHub Activity Card */}
        <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-5">
            <GitBranch className="w-4 h-4 text-teal-400" /> GitHub Activity
          </h3>
          <div className="space-y-4">
            {[
              { label: "Commits/week", value: github.commits_per_week, icon: "📝", bar: Math.min((github.commits_per_week / 50) * 100, 100), color: "#22c55e" },
              { label: "PRs/week", value: github.prs_per_week, icon: "🔀", bar: Math.min((github.prs_per_week / 20) * 100, 100), color: "#3b82f6" },
              { label: "Avg review time", value: `${github.avg_review_time_hours}h`, icon: "⏱️", bar: Math.min((github.avg_review_time_hours / 72) * 100, 100), color: "#f59e0b" },
              { label: "Bug rate /100 deploys", value: github.bug_rate_per_100_deploys, icon: "🐛", bar: Math.min((github.bug_rate_per_100_deploys / 30) * 100, 100), color: "#ef4444" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span>{item.icon}</span> {item.label}
                  </span>
                  <span className="font-bold text-white">{item.value}</span>
                </div>
                <div className="w-full h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.bar}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Debt + Security */}
        <div className="space-y-6">
          {/* Tech Debt */}
          <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-amber-400" /> Tech Debt Score
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#1e2035" strokeWidth="2.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke={techDebt > 50 ? "#ef4444" : techDebt > 25 ? "#f59e0b" : "#22c55e"} strokeWidth="2.5"
                    strokeDasharray={`${techDebt}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-black text-white">{techDebt.toFixed(0)}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Level</p>
                <p className={`text-sm font-bold ${techDebt > 50 ? 'text-red-400' : techDebt > 25 ? 'text-amber-400' : 'text-green-400'}`}>
                  {techDebt > 50 ? "High" : techDebt > 25 ? "Moderate" : "Low"}
                </p>
                <p className="text-[10px] text-slate-600 mt-1">From ML model prediction</p>
              </div>
            </div>
          </div>

          {/* Security Risk */}
          <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-blue-400" /> Security Risk
            </h3>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#1e2035" strokeWidth="2.5" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke={secRisk > 50 ? "#ef4444" : secRisk > 25 ? "#f59e0b" : "#22c55e"} strokeWidth="2.5"
                    strokeDasharray={`${secRisk}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-black text-white">{secRisk.toFixed(0)}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Exposure</p>
                <p className={`text-sm font-bold ${secRisk > 50 ? 'text-red-400' : secRisk > 25 ? 'text-amber-400' : 'text-green-400'}`}>
                  {secRisk > 50 ? "Critical" : secRisk > 25 ? "Moderate" : "Secure"}
                </p>
                <p className="text-[10px] text-slate-600 mt-1">From ML model prediction</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sprint Stats */}
        <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-violet-400" /> Sprint Overview
          </h3>
          <div className="space-y-5">
            {[
              { label: "Sprint Velocity", value: devMetrics?.sprint_velocity || 0, unit: "pts/sprint", icon: TrendingUp, color: "#8b5cf6" },
              { label: "Open Bugs", value: devMetrics?.open_bugs || 0, unit: "active", icon: Bug, color: "#ef4444" },
              { label: "Resolved This Week", value: devMetrics?.resolved_this_week || 0, unit: "closed", icon: CheckCircle2, color: "#22c55e" },
              { label: "Overall Risk", value: `${devMetrics?.overall_risk || 0}%`, unit: "from model", icon: AlertTriangle, color: "#f59e0b" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-[#0a0a0f] rounded-xl border border-[#1a1a28]">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.color + "15" }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
                  <p className="text-lg font-bold text-white leading-tight">{item.value}</p>
                </div>
                <span className="text-[9px] text-slate-600">{item.unit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ML Model Attribution Notice */}
      <div className="bg-gradient-to-r from-orange-500/5 to-violet-500/5 border border-orange-500/10 rounded-2xl p-4 flex items-start gap-3">
        <Zap className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-white mb-1">ML Model Integration</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            These metrics are derived from the trained Random Forest model using features: <code className="text-orange-400">change_failure_rate</code>, <code className="text-orange-400">deployment_frequency</code>, <code className="text-orange-400">lead_time_days</code>, <code className="text-orange-400">mttr_hours</code>, <code className="text-orange-400">Tech Debt</code>, and <code className="text-orange-400">Security Risk</code>. The code health score is a composite metric calculated from model predictions.
          </p>
        </div>
      </div>
    </div>
  );
}
