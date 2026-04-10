"use client";

import { use, useEffect, useState } from "react";
import { Users, AlertTriangle, TrendingUp, Activity, BarChart2, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

// Utility for creating dynamic tabs
const TABS = ["Risk Overview", "Failure Causes", "What-if Simulation", "Team Members"];

export default function DepartmentDashboard({ params }: { params: Promise<{ department: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const department = resolvedParams.department;
  
  const [activeTab, setActiveTab] = useState("Risk Overview");
  const [data, setData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // For the simulation tab
  const [localMetrics, setLocalMetrics] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    if (!compId) {
      router.push("/");
      return;
    }

    Promise.all([
      fetch(`http://localhost:8000/department/${compId}/${department}/risk`).then(res => res.json()),
      fetch(`http://localhost:8000/company/members?company_id=${compId}`).then(res => res.json())
    ]).then(([riskData, allMembers]) => {
      setData(riskData);
      setLocalMetrics(riskData.metrics || {});
      
      const deptMembers = Array.isArray(allMembers) 
        ? allMembers.filter(m => m.department.toLowerCase() === department)
        : [];
      setMembers(deptMembers);
      setLoading(false);
    }).catch(console.error);
  }, [department, router]);

  const handleMetricChange = (key: string, val: string) => {
    setLocalMetrics({ ...localMetrics, [key]: parseFloat(val) || 0 });
  };

  const saveSimulationAsActive = async () => {
    setSaving(true);
    const compId = localStorage.getItem("company_id");
    try {
      await fetch("http://localhost:8000/department/update-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: compId,
          department: department,
          metrics: localMetrics
        })
      });
      // Refresh
      const newRiskData = await fetch(`http://localhost:8000/department/${compId}/${department}/risk`).then(res => res.json());
      setData(newRiskData);
      setActiveTab("Risk Overview");
    } catch (e) {
        console.error(e);
        alert("Failed to update metrics");
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center">Loading department data...</div>;
  }

  const riskColor = data.color === "red" ? "text-red-500" : data.color === "amber" ? "text-amber-500" : "text-green-500";
  const bgRiskColor = data.color === "red" ? "bg-red-500" : data.color === "amber" ? "bg-amber-500" : "bg-green-500";

  return (
    <div className="p-8 max-w-6xl mx-auto pb-24">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold capitalize text-white mb-2">{department} Department</h1>
          <p className="text-slate-400">Manage risk factors and team health specific to this domain.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-[#13131f] border border-[#1e2035] rounded-2xl px-6 py-4 shadow-xl">
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Risk Score</p>
            <div className={`text-3xl font-black ${riskColor} tabular-nums leading-none`}>
              {data.risk_pct}%
            </div>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-[#1e2035] flex items-center justify-center relative overflow-hidden">
             {/* Simple gauge fill visually mapped manually */}
             <div className={`absolute bottom-0 w-full ${bgRiskColor} transition-all duration-1000`} style={{ height: `${data.risk_pct}%` }} />
             <div className="absolute inset-0 border-4 border-black/20 rounded-full" />
             <span className="relative z-10 font-bold text-xs mix-blend-difference text-white">{data.label.split(" ")[0]}</span>
          </div>
        </div>
      </div>

      <div className="border-b border-[#1e2035] mb-8">
        <nav className="flex gap-8">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-medium transition-colors relative ${
                activeTab === tab ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {activeTab === "Risk Overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(data.metrics || {}).map(([key, val]: any) => (
               <div key={key} className="bg-[#13131f] border border-[#1e2035] rounded-xl p-5 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full group-hover:bg-indigo-500/10 transition-colors" />
                 <p className="text-sm text-slate-400 uppercase tracking-widest font-semibold mb-2">{key.replace(/_/g, " ")}</p>
                 <p className="text-3xl font-light text-white">{val}</p>
               </div>
            ))}
            {Object.keys(data.metrics || {}).length === 0 && (
                <div className="col-span-full border border-dashed border-[#1e2035] rounded-2xl p-12 text-center text-slate-500">
                    No metrics tracked yet. Set them up in the simulation tab.
                </div>
            )}
          </div>
        )}

        {activeTab === "Failure Causes" && (
           <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl overflow-hidden">
             <div className="p-6 border-b border-[#1e2035]">
                 <h3 className="font-semibold text-lg flex items-center gap-2"><AlertTriangle className="text-amber-500 w-5 h-5"/> Top Risk Contributors</h3>
             </div>
             <div className="divide-y divide-[#1e2035]">
                 {/* In a real scenario, this is from /impact endpoint. Drawing dummy or metrics. */}
                 {Object.entries(data.metrics || {})
                    .sort(([,a]:any, [,b]:any) => b - a)
                    .map(([key, val]: any, i: number) => (
                     <div key={key} className="p-4 flex items-center justify-between hover:bg-[#1e2035]/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="w-6 text-center text-slate-500 text-sm font-bold">{i+1}</span>
                            <span className="capitalize text-slate-200">{key.replace(/_/g, " ")}</span>
                        </div>
                        <div className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-semibold">
                            Severity: {(val * 100).toFixed(0)}
                        </div>
                     </div>
                 ))}
                 {Object.keys(data.metrics || {}).length === 0 && <div className="p-6 text-center text-slate-500">No active failure factors found for department.</div>}
             </div>
           </div>
        )}

        {activeTab === "What-if Simulation" && (
           <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6 md:p-8">
             <h3 className="font-semibold text-xl mb-2">Simulation Sandbox</h3>
             <p className="text-slate-400 text-sm mb-8">Adjust the sliders below to see how improving or degrading specific factors affects your {department} risk score. When ready, commit as your new reality.</p>

             <div className="space-y-6 max-w-2xl">
                 {["tech_debt", "platform_dependency", "execution_flaws", "security_risk", "toxicity_trust_issues", "burnout_risk", "burn_rate", "no_budget"].map(key => {
                     // specific subsets based on department could be dynamically generated, showing a selection here.
                     if (department === "hr" && !["toxicity_trust_issues", "burnout_risk", "execution_flaws"].includes(key)) return null;
                     if (department === "finance" && !["burn_rate", "no_budget"].includes(key)) return null;
                     if (department === "engineering" && !["tech_debt", "platform_dependency", "execution_flaws", "security_risk"].includes(key)) return null;
                     
                     const val = localMetrics[key] ?? 0.2;
                     return (
                         <div key={key}>
                             <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-slate-300 capitalize">{key.replace(/_/g, " ")}</label>
                                <span className="text-sm font-bold text-indigo-400">{val}</span>
                             </div>
                             <input 
                                type="range" min="0" max="1" step="0.05"
                                className="w-full accent-indigo-500"
                                value={val}
                                onChange={(e) => handleMetricChange(key, e.target.value)}
                             />
                         </div>
                     );
                 })}
                 
                 <div className="pt-6 mt-6 border-t border-[#1e2035] flex justify-end">
                    <button 
                       onClick={saveSimulationAsActive}
                       disabled={saving}
                       className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
                    >
                       {saving ? "Saving..." : "Update Department Metrics"}
                    </button>
                 </div>
             </div>
           </div>
        )}

        {activeTab === "Team Members" && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((m, i) => (
                  <div key={i} className="bg-[#13131f] border border-[#1e2035] rounded-xl p-6 flex flex-col items-center text-center group hover:border-slate-600 transition-colors">
                      <div className="w-16 h-16 rounded-full bg-[#1e2035] border-2 border-[#252540] flex items-center justify-center text-xl font-bold text-slate-300 mb-4 shadow-xl">
                          {m.name.charAt(0)}
                      </div>
                      <h4 className="font-semibold text-lg text-white">{m.name}</h4>
                      <p className="text-slate-400 text-sm mb-1">{m.email}</p>
                      <div className="mt-4 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-semibold capitalize">
                          {m.role.replace("_", " ")}
                      </div>
                  </div>
              ))}
              {members.length === 0 && <p className="col-span-full">No team members joined yet. Invite them in the Admin view.</p>}
           </div>
        )}

      </div>
    </div>
  );
}
