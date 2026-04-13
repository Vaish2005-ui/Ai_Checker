"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Users, DollarSign, Cog, Target, Briefcase, Activity } from "lucide-react";
import AppNavbar from "@/components/AppNavbar";

const DEPT_ICONS: any = {
  hr: { icon: Users, color: "text-purple-600", border: "border-purple-300", bg: "bg-purple-100" },
  finance: { icon: DollarSign, color: "text-teal-600", border: "border-teal-300", bg: "bg-teal-100" },
  engineering: { icon: Cog, color: "text-amber-600", border: "border-amber-300", bg: "bg-amber-100" },
  operations: { icon: Target, color: "text-rose-600", border: "border-rose-300", bg: "bg-rose-100" },
  security: { icon: Shield, color: "text-blue-600", border: "border-blue-300", bg: "bg-blue-100" },
  marketing: { icon: Briefcase, color: "text-pink-600", border: "border-pink-300", bg: "bg-pink-100" }
};

export default function SelectDepartment() {
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    
    if (!compId) {
      router.push("/");
      return;
    }

    fetch(`http://localhost:8000/company/departments?company_id=${compId}`)
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
    return <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center text-slate-400">Loading your workspaces...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-slate-800 font-sans">
      <AppNavbar />

      <div className="max-w-4xl mx-auto py-16 px-6">
        <h1 className="text-3xl font-bold mb-2 text-slate-900">Select Workspace</h1>
        <p className="text-slate-500 mb-10">Choose a department dashboard to view risk metrics & simulations.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => {
            const style = DEPT_ICONS[dept.name.toLowerCase()] || DEPT_ICONS.engineering;
            const Icon = style.icon;
            
            return (
              <Link href={`/dashboard/${dept.name.toLowerCase()}`} key={dept.name}>
                <div className={`p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-300 group hover:-translate-y-1 shadow-sm`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2.5 rounded-xl ${style.bg} group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${style.color}`} />
                    </div>
                    <span className="font-semibold text-lg text-slate-900 capitalize">{dept.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Activity className="w-4 h-4" /> Go to Dashboard
                    </span>
                    <span className="text-slate-300 group-hover:text-indigo-600 transition-colors">→</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {localStorage.getItem("role") === "admin" && (
          <div className="mt-12 text-center">
            <Link href="/admin" className="text-indigo-600 hover:text-indigo-500 font-medium hover:underline">
              Or go to Global Admin Overview →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
