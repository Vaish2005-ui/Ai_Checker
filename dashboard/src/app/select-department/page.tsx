"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Users, DollarSign, Cog, Target, Briefcase, Activity } from "lucide-react";

const DEPT_ICONS: any = {
  hr: { icon: Users, color: "text-purple-400", border: "border-purple-500", bg: "bg-purple-500/10" },
  finance: { icon: DollarSign, color: "text-teal-400", border: "border-teal-500", bg: "bg-teal-500/10" },
  engineering: { icon: Cog, color: "text-amber-400", border: "border-amber-500", bg: "bg-amber-500/10" },
  operations: { icon: Target, color: "text-rose-400", border: "border-rose-500", bg: "bg-rose-500/10" },
  security: { icon: Shield, color: "text-blue-400", border: "border-blue-500", bg: "bg-blue-500/10" },
  marketing: { icon: Briefcase, color: "text-pink-400", border: "border-pink-500", bg: "bg-pink-500/10" }
};

export default function SelectDepartment() {
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    const role = localStorage.getItem("role");
    
    if (!compId) {
      router.push("/");
      return;
    }

    // Role-based routing: Admin normally goes to /admin, team_leader goes to specific dashboard
    // But if we landed here, we show the departments available
    fetch(`http://localhost:8002/company/departments?company_id=${compId}`)
      .then(res => res.json())
      .then(data => {
        setDepartments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-slate-400">Loading your workspaces...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200 py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Select Workspace</h1>
        <p className="text-slate-400 mb-10">Choose a department dashboard to view risk metrics & simulations.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const style = DEPT_ICONS[dept.name.toLowerCase()] || DEPT_ICONS.engineering;
            const Icon = style.icon;
            
            return (
              <Link href={`/dashboard/${dept.name.toLowerCase()}`} key={dept.name}>
                <div className={`p-6 rounded-2xl bg-[#13131f] border border-[#1e2035] hover:${style.border} transition-all duration-300 group hover:-translate-y-1`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2.5 rounded-xl ${style.bg} group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${style.color}`} />
                    </div>
                    <span className="font-semibold text-lg text-white capitalize">{dept.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Activity className="w-4 h-4" /> Go to Dashboard
                    </span>
                    <span className="text-slate-600 group-hover:text-white transition-colors">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {localStorage.getItem("role") === "admin" && (
          <div className="mt-12 text-center">
            <Link href="/admin" className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline">
              Or go to Global Admin Overview →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
