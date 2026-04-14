"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, AlertCircle, Building, Info, BarChart } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import { API_BASE } from "@/lib/config";

export default function StartupProfilePage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [companyName, setCompanyName] = useState("Company Overview");

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    if (!compId) {
      router.push("/");
      return;
    }

    fetch(`${API_BASE}/company/info?company_id=${compId}`)
      .then(res => res.json())
      .then(data => { if (data.name) setCompanyName(data.name); })
      .catch(console.error);

    fetch(`${API_BASE}/company/profile?company_id=${compId}`)
      .then(res => res.json())
      .then(data => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const compId = localStorage.getItem("company_id");
    try {
      await fetch(`${API_BASE}/company/profile?company_id=${compId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics)
      });
      alert("Profile updated successfully!");
    } catch (e) {
      alert("Failed to update profile.");
    }
    setSaving(false);
  };

  const handleGenerateAnalysis = async () => {
    setGenerating(true);
    const compId = localStorage.getItem("company_id");
    
    // Map human-readable metrics back to API field names
    const payload = {
       years_of_operation:     metrics["Years of Operation"] ?? 5.0,
       how_much_they_raised:   metrics["How Much They Raised"] ?? 10.0,
       giants:                 metrics["Giants"] ?? 0.5,
       no_budget:              metrics["No Budget"] ?? 0.3,
       competition:            metrics["Competition"] ?? 0.8,
       poor_market_fit:        metrics["Poor Market Fit"] ?? 0.2,
       acquisition_stagnation: metrics["Acquisition Stagnation"] ?? 0.2,
       platform_dependency:    metrics["Platform Dependency"] ?? 0.2,
       monetization_failure:   metrics["Monetization Failure"] ?? 0.2,
       niche_limits:           metrics["Niche Limits"] ?? 0.2,
       regulatory_pressure:    metrics["Regulatory Pressure"] ?? 0.1,
       toxicity_trust_issues:  metrics["Toxicity/Trust Issues"] ?? 0.0,
       execution_flaws:        metrics["Execution Flaws"] ?? 0.2,
       trend_shifts:           metrics["Trend Shifts"] ?? 0.1,
       overhype:               metrics["Overhype"] ?? 0.1,
       security_risk:          metrics["Security Risk"] ?? 0.2,
       tech_debt:              metrics["Tech Debt"] ?? 0.2,
       change_failure_rate:    metrics["change_failure_rate"] ?? 0.1,
       deployment_frequency:   metrics["deployment_frequency"] ?? 0.5,
       lead_time_days:         metrics["lead_time_days"] ?? 14.0,
       mttr_hours:             metrics["mttr_hours"] ?? 24.0,
    };

    try {
      // 1. Save changes first
      await fetch(`${API_BASE}/company/profile?company_id=${compId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics)
      });

      // 2. Generate full report
      const res = await fetch(`${API_BASE}/full_report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Failed to generate report");
      
      const result = await res.json();
      
      // 3. Format result for the report page
      const finalReport = {
        company: companyName,
        sector: "Global",
        risk_pct: result.risk_pct,
        label: result.label,
        color: result.color,
        timeline: result.timeline,
        risk_drivers: result.impact?.risks || [],
        top_fixes: result.top_improvements || [],
      };

      localStorage.setItem("startupReportData", JSON.stringify(finalReport));
      router.push("/report");
    } catch (e) {
      alert("Failed to generate analysis.");
    }
    setGenerating(false);
  };

  const setVal = (key: string, val: string) => {
    setMetrics(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center text-slate-400">Loading profile...</div>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-slate-800 font-sans">
      <AppNavbar />

      <div className="p-8 max-w-4xl mx-auto pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Startup Profile</h1>
            <p className="text-slate-500">Manage global company parameters that influence overall risk scores.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleUpdate}
              disabled={saving || generating}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors disabled:opacity-50 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Only"}
            </button>
            <button 
              onClick={handleGenerateAnalysis}
              disabled={saving || generating}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors disabled:opacity-50 shadow-lg shadow-indigo-600/20"
            >
              <BarChart className="w-4 h-4" />
              {generating ? "Analyzing..." : "Save & Generate Analysis"}
            </button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-start gap-4">
          <Info className="w-5 h-5 text-amber-600 mt-0.5" />
          <p className="text-sm text-amber-800 leading-relaxed">
            The values set here act as the default baseline for all departments. Individual departments can override these in their own dashboards for local simulation.
          </p>
        </div>

        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
           <Section title="Financial & Operations">
             <Slider 
               label="How Much They Raised ($M)" 
               value={metrics["How Much They Raised"]} 
               min={0} max={1000} step={10}
               onChange={(v: string) => setVal("How Much They Raised", v)} 
             />
             <Slider 
               label="Years of Operation" 
               value={metrics["Years of Operation"]} 
               min={0} max={20} step={0.5}
               onChange={(v: string) => setVal("Years of Operation", v)} 
             />
             <Slider 
               label="No Budget Risk" 
               value={metrics["No Budget"]} 
               min={0} max={2} step={0.1}
               onChange={(v: string) => setVal("No Budget", v)} 
             />
           </Section>

           <Section title="Market Competition">
             <Slider 
               label="Giant Competitor Pressure" 
               value={metrics["Giants"]} 
               min={0} max={2} step={0.1}
               onChange={(v: string) => setVal("Giants", v)} 
             />
             <Slider 
               label="Competition Intensity" 
               value={metrics["Competition"]} 
               min={0} max={2} step={0.1}
               onChange={(v: string) => setVal("Competition", v)} 
             />
             <Slider 
               label="Poor Market Fit" 
               value={metrics["Poor Market Fit"]} 
               min={0} max={2} step={0.1}
               onChange={(v: string) => setVal("Poor Market Fit", v)} 
             />
           </Section>

           <Section title="Growth & Strategy">
             <Slider 
               label="Acquisition Stagnation" 
               value={metrics["Acquisition Stagnation"]} 
               min={0} max={2} step={0.1}
               onChange={(v: string) => setVal("Acquisition Stagnation", v)} 
             />
             <Slider 
               label="Monetization Failure" 
               value={metrics["Monetization Failure"]} 
               min={0} max={2} step={0.1}
               onChange={(v: string) => setVal("Monetization Failure", v)} 
             />
             <Slider 
               label="Niche Market Limits" 
               value={metrics["Niche Limits"]} 
               min={0} max={2} step={0.1}
               onChange={(v: string) => setVal("Niche Limits", v)} 
             />
           </Section>

           <Section title="Risk & Regulatory">
             <Slider 
               label="Regulatory Pressure" 
               value={metrics["Regulatory Pressure"]} 
               min={0} max={2} step={0.1}
               onChange={(v: string) => setVal("Regulatory Pressure", v)} 
             />
             <Slider 
               label="Toxicity / Trust Issues" 
               value={metrics["Toxicity/Trust Issues"]} 
               min={0} max={2} step={0.1}
               onChange={(v: string) => setVal("Toxicity/Trust Issues", v)} 
             />
             <Slider 
               label="Platform Dependency" 
               value={metrics["Platform Dependency"]} 
               min={0} max={2} step={0.1}
               onChange={(v: string) => setVal("Platform Dependency", v)} 
             />
           </Section>

        </form>
      </div>
    </div>
  );
}

 function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">{title}</h3>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

 interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: string) => void;
}

function Slider({ label, value, min, max, step, onChange }: SliderProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-bold text-indigo-600 tabular-nums">{value ?? 0}</span>
      </div>
      <input 
        type="range"
        min={min} max={max} step={step}
        value={value ?? 0}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
      />
    </div>
  );
}
