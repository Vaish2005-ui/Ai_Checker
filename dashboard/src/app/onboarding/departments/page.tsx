"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Users, DollarSign, Cog, Target, Briefcase, ChevronRight, Check, Code2 } from "lucide-react";

const DEPARTMENTS = [
  { id: "hr", name: "HR", icon: Users, color: "text-purple-400", border: "border-purple-500", bg: "bg-purple-500/10" },
  { id: "finance", name: "Finance", icon: DollarSign, color: "text-teal-400", border: "border-teal-500", bg: "bg-teal-500/10" },
  { id: "software", name: "Software", icon: Code2, color: "text-orange-400", border: "border-orange-500", bg: "bg-orange-500/10" },
  { id: "engineering", name: "Engineering", icon: Cog, color: "text-amber-400", border: "border-amber-500", bg: "bg-amber-500/10" },
  { id: "operations", name: "Operations", icon: Target, color: "text-rose-400", border: "border-rose-500", bg: "bg-rose-500/10" },
  { id: "security", name: "Security", icon: Shield, color: "text-blue-400", border: "border-blue-500", bg: "bg-blue-500/10" },
  { id: "marketing", name: "Marketing", icon: Briefcase, color: "text-pink-400", border: "border-pink-500", bg: "bg-pink-500/10" }
];

export default function DepartmentSetup() {
  const router = useRouter();
  const [activeDepts, setActiveDepts] = useState<Record<string, boolean>>({
    hr: true // HR active by default
  });
  const [invites, setInvites] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("company_id")) {
      router.push("/register/company");
    }
  }, [router]);

  const toggleDept = (id: string) => {
    setActiveDepts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const setInvite = (id: string, email: string) => {
    setInvites(prev => ({ ...prev, [id]: email }));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const companyId = localStorage.getItem("company_id");
      
      // We should probably update the company with the new departments but the API
      // right now uses /department/update-metrics to add departments, or we could just 
      // rely on the invites and manual addition later. Let's send invites.
      
      const activeIds = Object.keys(activeDepts).filter(k => activeDepts[k]);
      
      for (const deptId of activeIds) {
        if (invites[deptId]) {
          await fetch("http://localhost:8000/company/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              company_id: companyId,
              department: deptId,
              email: invites[deptId]
            })
          });
        }
      }
      
      // Update the company's active departments (We'll use update-metrics dummy call to just register them)
      for (const deptId of activeIds) {
        await fetch("http://localhost:8000/department/update-metrics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              company_id: companyId,
              department: deptId,
              metrics: {}
            })
          });
      }

      router.push("/assess");
    } catch (e) {
      console.error(e);
      alert("Failed to save and invite.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-slate-800 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-3 text-slate-900">Which departments do you have?</h1>
        <p className="text-slate-500 mb-10">Select the departments you want to monitor and invite team leaders.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {DEPARTMENTS.map(dept => {
            const isActive = activeDepts[dept.id];
            const Icon = dept.icon;
            
            return (
              <div 
                key={dept.id} 
                className={`p-4 rounded-2xl border transition-all duration-300 shadow-sm ${isActive ? 'bg-white ' + dept.border : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'}`}
                onClick={() => !isActive && toggleDept(dept.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isActive ? dept.bg : 'bg-slate-50 border border-slate-100'}`}>
                      <Icon className={`w-5 h-5 ${isActive ? dept.color : 'text-slate-400'}`} />
                    </div>
                    <span className={`font-medium ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>{dept.name}</span>
                  </div>
                  
                  {isActive ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleDept(dept.id); }}
                      className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"
                    >
                      <Check className="w-4 h-4 text-slate-600" />
                    </button>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-slate-200" />
                  )}
                </div>

                {isActive && (
                  <div className="mt-4 animate-in slide-in-from-top-2 fade-in">
                    <label className="text-xs text-slate-500 font-medium mb-1 block">Invite Team Leader (Email)</label>
                    <input 
                      type="email"
                      placeholder="leader@acme.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-900"
                      value={invites[dept.id] || ""}
                      onChange={(e) => setInvite(dept.id, e.target.value)}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">They will receive a link to join your dashboard.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <p className="text-sm text-slate-500">
            You can always add more departments and users later from the Admin Overview.
          </p>
          <button 
            onClick={handleComplete}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue to Company Data"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
