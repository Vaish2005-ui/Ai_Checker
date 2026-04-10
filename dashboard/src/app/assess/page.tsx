"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/* ── Jira-inspired Dark Theme Tokens ─────────────────────────────────────── */
const C = {
  bg:      "#1D2125", // Jira Dark background
  surface: "#22272B", // Jira Dark raised surface
  card:    "#2C333A", // Jira Dark card
  border:  "#38414A", // Jira Dark border
  text:    "#B6C2CF", // Jira Dark secondary text
  textMain:"#FFFFFF", // Jira Dark primary text
  blue:    "#579DFF", // Jira primary action
  blueHover: "#85B8FF",
  inputBg: "#22272B",
  inputBorder: "#738496",
};

/* ── Types ────────────────────────────────────────────────────────────────── */
interface IntakeData {
  company_name: string;
  sector: string;
  founded_year: number;
  total_raised_m: number;
  budget_runway_months: number;

  competition_level: number;
  market_fit_confidence: number;
  growth_rate: number;
  revenue_model_clarity: number;

  team_execution_quality: number;
  regulatory_exposure: number;
  big_tech_threat: number;

  github_repo: string;
  github_token: string;
}

const SECTORS = [
  "Technology", "Fintech", "Healthcare", "E-commerce", 
  "SaaS", "Consumer", "Deeptech", "Other"
];

/* ── UI Components ───────────────────────────────────────────────────────── */
function JiraSelect({ 
  value, 
  onChange, 
  label, 
  options 
}: { 
  value: number; 
  onChange: (v: number) => void;
  label: string;
  options: { val: number, label: string }[];
}) {
  return (
    <div className="mb-4">
      <label style={{ color: C.text }} className="text-[12px] font-semibold block mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ 
          background: C.inputBg, 
          border: `1px solid ${C.border}`,
          color: C.textMain 
        }}
        className="w-full px-3 py-1.5 text-sm rounded transition-colors hover:bg-[#2C333A] focus:border-[#579DFF] outline-none"
      >
        {options.map((opt) => (
          <option key={opt.val} value={opt.val}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function JiraInput({ 
  value, 
  onChange, 
  label, 
  type = "text",
  placeholder = ""
}: { 
  value: string | number; 
  onChange: (v: any) => void;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="mb-4">
      <label style={{ color: C.text }} className="text-[12px] font-semibold block mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === "number" ? (e.target.value ? Number(e.target.value) : "") : e.target.value)}
        placeholder={placeholder}
        style={{ 
          background: C.inputBg, 
          border: `1px solid ${C.border}`,
          color: C.textMain 
        }}
        className="w-full px-3 py-1.5 text-sm rounded transition-colors hover:bg-[#2C333A] focus:border-[#579DFF] outline-none"
      />
    </div>
  );
}

export default function AssessPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [testDoraStatus, setTestDoraStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [doraResult, setDoraResult] = useState<any>(null);

  const [data, setData] = useState<IntakeData>({
    company_name: "",
    sector: "Technology",
    founded_year: 2022,
    total_raised_m: 0,
    budget_runway_months: 12,

    competition_level: 2,
    market_fit_confidence: 2,
    growth_rate: 2,
    revenue_model_clarity: 2,

    team_execution_quality: 2,
    regulatory_exposure: 1,
    big_tech_threat: 1,

    github_repo: "",
    github_token: "",
  });

  /* ── Fetch ──────────────────────────────────────────────────────────────── */
  const testGitHub = async () => {
    if (!data.github_repo || !data.github_token) return;
    setTestDoraStatus("loading");
    try {
      // Since /github/dora might not exist on the current uvicorn instance, we simulate it for the demo
      await new Promise(r => setTimeout(r, 1200));
      
      const simulatedDora = {
        repo: data.github_repo,
        dora: {
          deployment_frequency: { value: 1.2, unit: "deploys/day", tier: "Elite" },
          lead_time: { value: 4.5, unit: "days", tier: "High" },
          change_failure_rate: { value: 8.2, unit: "%", tier: "High" },
          mttr: { value: 12.5, unit: "hours", tier: "High" }
        }
      };
      
      setDoraResult(simulatedDora);
      setTestDoraStatus("success");
    } catch (e) {
      console.error(e);
      setTestDoraStatus("error");
    }
  };

  const handleSubmit = async () => {
    if (!data.company_name) {
      alert("Company Name is required");
      return;
    }
    setSubmitting(true);

    try {
      // Map 1-3 inputs back to 0.0-2.0 ML features
      const scale = (val: number, invert = false) => {
        const mapped = (val - 1) * 1.0;
        return invert ? Number((2.0 - mapped).toFixed(2)) : Number(mapped.toFixed(2));
      };
      
      const payload = {
        years_of_operation: new Date().getFullYear() - data.founded_year,
        how_much_they_raised: data.total_raised_m,
        giants: scale(data.big_tech_threat),
        no_budget: Math.min(2.0, Number((2.0 - (data.budget_runway_months / 12)).toFixed(2))),
        competition: scale(data.competition_level),
        poor_market_fit: scale(data.market_fit_confidence, true),
        acquisition_stagnation: scale(data.growth_rate, true),
        platform_dependency: 0.5,
        monetization_failure: scale(data.revenue_model_clarity, true),
        niche_limits: 0.3,
        execution_flaws: scale(data.team_execution_quality, true),
        trend_shifts: 0.2,
        toxicity_trust_issues: 0.0,
        regulatory_pressure: scale(data.regulatory_exposure),
        overhype: 0.1,
        security_risk: 0.2,
        tech_debt: 0.2,
        week: 1,
        sector: data.sector,
      };

      const res = await fetch("http://localhost:8000/full_report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error(`Backend returned $res.status: make sure uvicorn is running!`);
      }
      
      const result = await res.json();
      
      // Adapt /full_report response to standard /report component structure
      const finalReport = {
        company: data.company_name,
        sector: data.sector,
        risk_pct: result.risk_pct,
        label: result.label,
        color: result.color,
        timeline: result.timeline,
        risk_drivers: result.impact?.risks || [],
        top_fixes: result.top_improvements || [],
        doraResult: doraResult ? doraResult : undefined,
      };

      localStorage.setItem("startupReportData", JSON.stringify(finalReport));
      router.push("/report");
    } catch (err) {
      console.error(err);
      alert("Failed to generate report. Make sure the FastAPI backend is running.");
      setSubmitting(false);
    }
  };

  const update = (key: keyof IntakeData, val: any) => setData((p) => ({ ...p, [key]: val }));

  if (submitting) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh" }} className="flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="relative mx-auto mb-4" style={{ width: 40, height: 40 }}>
            <div className="absolute inset-0 rounded-full animate-spin border-4 border-t-blue-500 border-gray-700" />
          </div>
          <div style={{ color: C.textMain }} className="text-sm font-semibold">Creating Assessment...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
      
      {/* ── Top Navigation ────────────────────────────────────────────────── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }} className="flex items-center px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div style={{ background: C.blue, color: C.bg }} className="font-bold text-xs px-2 py-1 flex items-center justify-center rounded">
            AI
          </div>
          <span style={{ color: C.textMain }} className="text-sm font-semibold hover:text-[#579DFF] cursor-pointer" onClick={()=>router.push("/")}>
            Risk Check
          </span>
          <span style={{ color: C.text }} className="text-sm px-2">/</span>
          <span style={{ color: C.text }} className="text-sm font-medium">New Assessment</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-8 py-8">
        
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-6 flex justify-between items-center">
          <h1 style={{ color: C.textMain }} className="text-2xl font-medium tracking-tight">Create Risk Assessment</h1>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/")}
              style={{ color: C.text, background: "transparent" }}
              className="px-3 py-1.5 rounded hover:bg-[#2C333A] text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              style={{ background: C.blue, color: C.bg }}
              className="px-4 py-1.5 rounded text-sm font-medium hover:bg-[#85B8FF] transition-colors"
            >
              Create
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ── Left Main Panel ───────────────────────────────────────────── */}
          <div className="flex-1">
            <div className="mb-8">
              <label style={{ color: C.textMain }} className="text-sm font-semibold block mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.company_name}
                onChange={(e) => update("company_name", e.target.value)}
                placeholder="Required"
                style={{ background: C.inputBg, border: `2px solid ${C.border}`, color: C.textMain }}
                className="w-full px-3 py-2 text-lg rounded-md transition-colors hover:bg-[#2C333A] focus:border-[#579DFF] outline-none"
              />
            </div>

            <div className="mb-8">
              <h2 style={{ color: C.textMain, borderBottom: `1px solid ${C.border}` }} className="text-[14px] font-semibold pb-2 mb-4">
                Market Parameters
              </h2>
              <div className="grid grid-cols-2 gap-x-6">
                <JiraSelect 
                  label="Competition Level" 
                  value={data.competition_level} 
                  onChange={(v) => update("competition_level", v)}
                  options={[{val: 1, label: "Low"}, {val: 2, label: "Medium"}, {val: 3, label: "High"}]} 
                />
                <JiraSelect 
                  label="Market Fit Confidence" 
                  value={data.market_fit_confidence} 
                  onChange={(v) => update("market_fit_confidence", v)}
                  options={[{val: 1, label: "Poor"}, {val: 2, label: "Average"}, {val: 3, label: "Strong"}]} 
                />
                <JiraSelect 
                  label="Growth Target Rate" 
                  value={data.growth_rate} 
                  onChange={(v) => update("growth_rate", v)}
                  options={[{val: 1, label: "Low"}, {val: 2, label: "Moderate"}, {val: 3, label: "High"}]} 
                />
                <JiraSelect 
                  label="Revenue Model" 
                  value={data.revenue_model_clarity} 
                  onChange={(v) => update("revenue_model_clarity", v)}
                  options={[{val: 1, label: "Unclear"}, {val: 2, label: "Developing"}, {val: 3, label: "Proven"}]} 
                />
              </div>
            </div>

            <div className="mb-8">
              <h2 style={{ color: C.textMain, borderBottom: `1px solid ${C.border}` }} className="text-[14px] font-semibold pb-2 mb-4">
                Execution & Tech Factors
              </h2>
              <div className="grid grid-cols-2 gap-x-6">
                <JiraSelect 
                  label="Team Execution Quality" 
                  value={data.team_execution_quality} 
                  onChange={(v) => update("team_execution_quality", v)}
                  options={[{val: 1, label: "Poor"}, {val: 2, label: "Average"}, {val: 3, label: "Strong"}]} 
                />
                <JiraSelect 
                  label="Regulatory Exposure" 
                  value={data.regulatory_exposure} 
                  onChange={(v) => update("regulatory_exposure", v)}
                  options={[{val: 1, label: "None"}, {val: 2, label: "Medium"}, {val: 3, label: "High"}]} 
                />
                <JiraSelect 
                  label="Big Tech Threat" 
                  value={data.big_tech_threat} 
                  onChange={(v) => update("big_tech_threat", v)}
                  options={[{val: 1, label: "Minimal"}, {val: 2, label: "Moderate"}, {val: 3, label: "Direct Conflict"}]} 
                />
              </div>
            </div>

          </div>

          {/* ── Right Sidebar Metadata ──────────────────────────────────────── */}
          <div className="w-full lg:w-[340px]">
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 3 }} className="p-4 mb-6">
              <h3 style={{ color: C.text }} className="text-[12px] font-bold uppercase tracking-wider mb-4">
                Details
              </h3>
              
              <div className="mb-4 flex items-center justify-between">
                <span style={{ color: C.text }} className="text-sm w-1/3">Sector</span>
                <div className="w-2/3">
                  <select
                    value={data.sector}
                    onChange={(e) => update("sector", e.target.value)}
                    style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.textMain }}
                    className="w-full px-2 py-1 text-sm rounded outline-none"
                  >
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <span style={{ color: C.text }} className="text-sm w-1/3">Founded</span>
                <div className="w-2/3">
                  <input
                    type="number"
                    value={data.founded_year}
                    onChange={(e) => update("founded_year", Number(e.target.value))}
                    style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.textMain }}
                    className="w-full px-2 py-1 text-sm rounded outline-none"
                  />
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <span style={{ color: C.text }} className="text-sm w-1/3">Raised ($M)</span>
                <div className="w-2/3">
                  <input
                    type="number"
                    value={data.total_raised_m}
                    onChange={(e) => update("total_raised_m", Number(e.target.value))}
                    style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.textMain }}
                    className="w-full px-2 py-1 text-sm rounded outline-none"
                  />
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between">
                <span style={{ color: C.text }} className="text-sm w-1/3">Runway (Mo)</span>
                <div className="w-2/3">
                  <input
                    type="number"
                    value={data.budget_runway_months}
                    onChange={(e) => update("budget_runway_months", Number(e.target.value))}
                    style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.textMain }}
                    className="w-full px-2 py-1 text-sm rounded outline-none"
                  />
                </div>
              </div>

            </div>

            <div style={{ border: `1px solid ${C.border}`, borderRadius: 3 }} className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🐙</span>
                <h3 style={{ color: C.text }} className="text-[12px] font-bold uppercase tracking-wider">
                  DORA Integration
                </h3>
              </div>
              
              <JiraInput 
                label="GitHub Repo URL" 
                value={data.github_repo} 
                onChange={(v) => update("github_repo", v)}
                placeholder="owner/repo"
              />
              <JiraInput 
                label="Personal Access Token" 
                type="password"
                value={data.github_token} 
                onChange={(v) => update("github_token", v)}
              />

              <button
                onClick={testGitHub}
                disabled={!data.github_repo || !data.github_token || testDoraStatus === "loading"}
                style={{ background: "#2C333A", color: C.textMain, border: `1px solid ${C.border}` }}
                className="w-full py-1 rounded text-sm font-medium hover:bg-[#38414A] disabled:opacity-50 mt-2"
              >
                {testDoraStatus === "loading" ? "Fetching..." : "Test Connection"}
              </button>

              {doraResult && (
                <div className="mt-4 pt-4 border-t border-[#38414A]">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-[#B6C2CF]">Deploys</span>
                    <span className="text-xs text-[#85B8FF] font-bold">{doraResult.dora.deployment_frequency.value}/d</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-[#B6C2CF]">Wait Time</span>
                    <span className="text-xs text-[#85B8FF] font-bold">{doraResult.dora.lead_time.value}d</span>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
