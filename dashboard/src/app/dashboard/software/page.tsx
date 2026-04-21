"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Code2, GitBranch, Bug, Gauge, Activity, Rocket, Shield, AlertTriangle,
  CheckCircle2, Clock, TrendingUp, Zap, GitPullRequest, BarChart3, Github,
  Link2, RefreshCw, Star, GitFork, ExternalLink, Loader2, Unplug
} from "lucide-react";
import { API_BASE } from "@/lib/config";

const CARD_CLASSES = "bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px]";
const INPUT_CLASSES = "w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none text-slate-900";

export default function SoftwareDashboard() {
  const router = useRouter();
  const [devMetrics, setDevMetrics] = useState<any>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [githubData, setGithubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [githubInput, setGithubInput] = useState("");
  const [syncError, setSyncError] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    if (!compId) { router.push("/"); return; }

    Promise.all([
      fetch(`${API_BASE}/department/${compId}/software/devmetrics`).then(r => r.json()),
      fetch(`${API_BASE}/department/${compId}/software/risk`).then(r => r.json()),
      fetch(`${API_BASE}/department/${compId}/software/github-analysis`).then(r => r.json()),
    ]).then(([dm, rd, gh]) => {
      setDevMetrics(dm);
      setRiskData(rd);
      setGithubData(gh);
      if (gh?.github_username) setGithubInput(gh.github_username);
      setLoading(false);
    }).catch(console.error);
  }, [router]);

  const handleGitHubSync = async () => {
    if (!githubInput.trim()) return;
    setSyncing(true);
    setSyncError("");
    const compId = localStorage.getItem("company_id");
    try {
      const res = await fetch(`${API_BASE}/department/${compId}/software/github-sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: compId, github_username: githubInput.trim() }),
      });
      const data = await res.json();
      if (data.status === "synced") {
        setGithubData({ connected: true, ...data });
        // Refresh devmetrics to get updated values
        const dm = await fetch(`${API_BASE}/department/${compId}/software/devmetrics`).then(r => r.json());
        setDevMetrics(dm);
      } else {
        setSyncError(data.detail || "Failed to sync GitHub account");
      }
    } catch (e) {
      setSyncError("Network error. Please try again.");
    }
    setSyncing(false);
  };

  if (loading) {
    return (
      <div className="h-40 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isConnected = githubData?.connected;
  const source = isConnected ? githubData : devMetrics;
  const dora = source?.dora || {};
  const github = source?.github_activity || {};
  const codeHealth = source?.code_health || 0;
  const techDebt = source?.tech_debt_score || 0;
  const secRisk = source?.security_risk_score || 0;

  const healthColor = codeHealth >= 70 ? "#22c55e" : codeHealth >= 40 ? "#f59e0b" : "#ef4444";
  const healthLabel = codeHealth >= 70 ? "Healthy" : codeHealth >= 40 ? "Warning" : "Critical";

  const TABS = ["Overview", "GitHub Connect", "Repositories"];

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
            {isConnected ? (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-bold tracking-wider flex items-center gap-1">
                <Github className="w-3 h-3" /> GITHUB LINKED
              </span>
            ) : (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-900 text-white font-bold tracking-wider">ML-POWERED</span>
            )}
          </div>
          <p className="text-slate-500 text-sm">
            {isConnected
              ? `Live metrics from github.com/${githubData.github_username} • Last synced: ${new Date(githubData.analyzed_at).toLocaleString()}`
              : "GitHub activity, DORA metrics & bug tracking — connect your GitHub to auto-analyze."}
          </p>
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

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 mb-8 mt-4">
        <nav className="flex gap-2">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-2 text-sm font-semibold transition-all relative ${
                activeTab === tab ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900 rounded-t-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {activeTab === "Overview" && (
        <div className="animate-fade-in-up">
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
                    {isConnected && <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">LIVE</span>}
                  </div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">{m.label}</p>
                  <p className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{m.value}</p>
                  <p className="text-[10px] text-slate-500 font-medium">{m.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* GitHub Activity + Tech Debt + Sprint */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* GitHub Activity Card */}
            <div className={`${CARD_CLASSES} p-8`}>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                  <GitBranch className="w-4 h-4 text-teal-500" />
                </div>
                GitHub Activity
                {isConnected && <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold ml-auto">LIVE DATA</span>}
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
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">
                      {isConnected ? "From GitHub analysis" : "From ML prediction"}
                    </p>
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
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">
                      {isConnected ? "From GitHub analysis" : "From ML prediction"}
                    </p>
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
                  { label: "Sprint Velocity", value: source?.sprint_velocity || devMetrics?.sprint_velocity || 0, unit: "pts/sprint", icon: TrendingUp, color: "#8b5cf6" },
                  { label: "Open Bugs", value: source?.open_bugs || devMetrics?.open_bugs || 0, unit: "active", icon: Bug, color: "#ef4444" },
                  { label: "Resolved This Wk", value: source?.resolved_this_week || devMetrics?.resolved_this_week || 0, unit: "closed", icon: CheckCircle2, color: "#22c55e" },
                  { label: "Overall Risk", value: `${source?.overall_risk || devMetrics?.overall_risk || 0}%`, unit: "from model", icon: AlertTriangle, color: "#f59e0b" },
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

          {/* Real GitHub Stats (shown when connected) */}
          {isConnected && githubData.raw_stats && (
            <div className="grid grid-cols-5 gap-4 mb-8">
              {[
                { label: "Total Commits", value: githubData.raw_stats.total_commits_30d, icon: "📝", sub: "Last 30 days" },
                { label: "Pull Requests", value: githubData.raw_stats.total_prs_30d, icon: "🔀", sub: "Last 30 days" },
                { label: "Issues Tracked", value: githubData.raw_stats.total_issues_30d, icon: "📋", sub: "Last 30 days" },
                { label: "Stars", value: githubData.raw_stats.total_stars, icon: "⭐", sub: "All repos" },
                { label: "Forks", value: githubData.raw_stats.total_forks, icon: "🍴", sub: "All repos" },
              ].map((s, i) => (
                <div key={i} className={`${CARD_CLASSES} p-5 text-center hover:-translate-y-0.5 transition-all`}>
                  <span className="text-2xl">{s.icon}</span>
                  <p className="text-2xl font-black text-slate-900 mt-2">{s.value}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{s.label}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* ML Model / Source Attribution */}
          <div className={`${CARD_CLASSES} p-6 flex items-start gap-4 ${isConnected ? 'bg-gradient-to-r from-slate-900 to-slate-800' : 'bg-slate-900'} text-white`}>
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
              {isConnected ? <Github className="w-5 h-5 text-green-400" /> : <Zap className="w-5 h-5 text-orange-400" />}
            </div>
            <div>
              <p className="text-base font-bold mb-1">
                {isConnected ? "GitHub Live Integration" : "ML Model Integration"}
              </p>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                {isConnected ? (
                  <>
                    Metrics are derived from <strong>real GitHub data</strong> for <code className="text-green-400 bg-slate-800 px-1.5 py-0.5 rounded">{githubData.github_username}</code>.
                    Analyzing {githubData.repo_count} repositories with {githubData.raw_stats?.total_commits_30d} commits in the last 30 days.
                    DORA metrics, tech debt, and security risk are automatically computed from your commit history, PRs, issues, and releases.
                  </>
                ) : (
                  <>
                    These metrics are derived from the trained Random Forest model using features: <code className="text-orange-400 bg-slate-800 px-1.5 py-0.5 rounded">change_failure_rate</code>, <code className="text-orange-400 bg-slate-800 px-1.5 py-0.5 rounded">deployment_frequency</code>, <code className="text-orange-400 bg-slate-800 px-1.5 py-0.5 rounded">lead_time_days</code>, <code className="text-orange-400 bg-slate-800 px-1.5 py-0.5 rounded">mttr_hours</code>. Connect your GitHub account to get live data.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ GITHUB CONNECT TAB ═══ */}
      {activeTab === "GitHub Connect" && (
        <div className="max-w-2xl mx-auto animate-fade-in-up">
          <div className={`${CARD_CLASSES} p-10`}>
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Github className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-3">Connect GitHub Account</h2>
              <p className="text-slate-500 max-w-md mx-auto">
                Enter a GitHub username or organization name. We&#39;ll analyze repositories, commits, pull requests, and issues to automatically derive your DORA metrics.
              </p>
            </div>

            {isConnected && (
              <div className="mb-8 p-5 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-green-900">Connected to GitHub</p>
                  <p className="text-sm text-green-700">
                    Account: <strong>{githubData.github_username}</strong> • {githubData.repo_count} repos analyzed •
                    Last sync: {new Date(githubData.analyzed_at).toLocaleString()}
                  </p>
                </div>
                <a href={`https://github.com/${githubData.github_username}`} target="_blank" rel="noopener noreferrer"
                  className="text-green-700 hover:text-green-900 p-2 hover:bg-green-100 rounded-xl transition-colors">
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2 block">GitHub Username or Organization</label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Github className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={githubInput}
                      onChange={e => setGithubInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleGitHubSync()}
                      className={`${INPUT_CLASSES} pl-10`}
                      placeholder="e.g., facebook, torvalds, microsoft"
                    />
                  </div>
                  <button
                    onClick={handleGitHubSync}
                    disabled={syncing || !githubInput.trim()}
                    className="px-6 py-2.5 bg-black hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {syncing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                    ) : (
                      <><RefreshCw className="w-4 h-4" /> {isConnected ? "Re-sync" : "Analyze"}</>
                    )}
                  </button>
                </div>
              </div>

              {syncError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
                  ❌ {syncError}
                </div>
              )}

              {syncing && (
                <div className="p-8 text-center">
                  <div className="w-12 h-12 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Fetching data from GitHub API...</p>
                  <p className="text-xs text-slate-400 mt-1">Analyzing repositories, commits, PRs, and issues</p>
                </div>
              )}
            </div>

            {/* What gets analyzed */}
            <div className="mt-10 pt-8 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">What We Analyze</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: "📊", title: "Commit History", desc: "Frequency and patterns from the last 30 days" },
                  { icon: "🔀", title: "Pull Requests", desc: "Merge times, review cycles, and rejection rates" },
                  { icon: "🐛", title: "Issues & Bugs", desc: "Open issues, bug labels, and resolution speed" },
                  { icon: "🚀", title: "Releases", desc: "Deployment frequency derived from release tags" },
                  { icon: "⏱️", title: "Lead Time", desc: "Time from PR creation to merge (DORA metric)" },
                  { icon: "🔧", title: "Recovery Time", desc: "Issue resolution time as MTTR proxy" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ REPOSITORIES TAB ═══ */}
      {activeTab === "Repositories" && (
        <div className="animate-fade-in-up">
          {isConnected && githubData.repo_details?.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Analyzed Repositories</h2>
                  <p className="text-sm text-slate-500">{githubData.repo_count} repositories from {githubData.github_username}</p>
                </div>
                {githubData.languages && Object.keys(githubData.languages).length > 0 && (
                  <div className="flex items-center gap-2">
                    {Object.entries(githubData.languages).sort(([,a]: any,[,b]: any) => b - a).slice(0, 5).map(([lang, count]: any) => (
                      <span key={lang} className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold border border-slate-200">
                        {lang} ({count})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {githubData.repo_details.map((repo: any, i: number) => (
                  <div key={i} className={`${CARD_CLASSES} p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all group`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                          <Code2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <a href={`https://github.com/${githubData.github_username}/${repo.name}`}
                            target="_blank" rel="noopener noreferrer"
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors flex items-center gap-1">
                            {repo.name}
                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                          {repo.language && (
                            <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold border border-orange-100">
                              {repo.language}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: "Commits", value: repo.commits_30d, icon: "📝" },
                        { label: "PRs", value: repo.prs_30d, icon: "🔀" },
                        { label: "Issues", value: repo.issues_30d, icon: "📋" },
                        { label: "Releases", value: repo.releases_30d, icon: "🚀" },
                      ].map((stat, j) => (
                        <div key={j} className="text-center p-2 bg-slate-50 rounded-lg">
                          <span className="text-sm">{stat.icon}</span>
                          <p className="text-lg font-black text-slate-900">{stat.value}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Star className="w-3 h-3" /> {repo.stars}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <GitFork className="w-3 h-3" /> {repo.forks}
                      </div>
                      <span className="ml-auto text-[10px] text-slate-400">
                        Updated {new Date(repo.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className={`${CARD_CLASSES} p-16 text-center`}>
              <Unplug className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No GitHub Account Connected</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                Connect your GitHub account in the &quot;GitHub Connect&quot; tab to see a detailed per-repository breakdown of commits, PRs, and issues.
              </p>
              <button
                onClick={() => setActiveTab("GitHub Connect")}
                className="px-6 py-3 bg-black hover:bg-slate-800 text-white font-bold rounded-full transition-all shadow-md"
              >
                Connect GitHub
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
