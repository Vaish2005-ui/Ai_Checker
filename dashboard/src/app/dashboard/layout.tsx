"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, Users, DollarSign, Cog, Target, Briefcase, ChevronLeft, Building2, LogOut, LayoutDashboard } from "lucide-react";

const DEPT_MAP: any = {
  hr: { icon: Users, color: "text-purple-400" },
  finance: { icon: DollarSign, color: "text-teal-400" },
  engineering: { icon: Cog, color: "text-amber-400" },
  operations: { icon: Target, color: "text-rose-400" },
  security: { icon: Shield, color: "text-blue-400" },
  marketing: { icon: Briefcase, color: "text-pink-400" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [departments, setDepartments] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    const r = localStorage.getItem("role");
    
    if (!compId) {
      router.push("/");
      return;
    }
    setRole(r);

    fetch(`http://localhost:8000/company/departments?company_id=${compId}`)
      .then(res => res.json())
      .then(data => {
        setDepartments(Array.isArray(data) ? data : []);
      })
      .catch(console.error);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 bg-[#0f0f1a] border-r border-[#1e2035] flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-[#1e2035]">
          <Link href="/select-department" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-medium">
            <ChevronLeft className="w-4 h-4" />
            Workspace
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <div className="px-4 mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-2">Departments</p>
          </div>
          <nav className="space-y-1 px-3">
            {departments.map((dept) => {
              const dName = dept.name.toLowerCase();
              const isActive = pathname === `/dashboard/${dName}`;
              const Icon = DEPT_MAP[dName]?.icon || Cog;
              const color = DEPT_MAP[dName]?.color || "text-slate-400";
              
              return (
                <Link 
                  key={dept.name} 
                  href={`/dashboard/${dName}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-[#1e2035] text-white" 
                      : "text-slate-400 hover:bg-[#13131f] hover:text-slate-200"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? color : "text-slate-500"}`} />
                  <span className="capitalize font-medium text-sm">{dept.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#1e2035] space-y-2">
          {role === "admin" && (
            <>
              <Link 
                href="/admin" 
                className={`flex items-center gap-3 px-3 py-2 w-full rounded-lg transition-colors text-sm font-medium ${
                  pathname === "/admin" ? "bg-[#1e2035] text-white" : "text-slate-400 hover:bg-[#13131f] hover:text-white"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Admin Overview
              </Link>
              <Link 
                href="/admin/profile" 
                className={`flex items-center gap-3 px-3 py-2 w-full rounded-lg transition-colors text-sm font-medium ${
                  pathname === "/admin/profile" ? "bg-[#1e2035] text-white" : "text-slate-400 hover:bg-[#13131f] hover:text-white"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Startup Profile
              </Link>
            </>
          )}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-slate-400 hover:bg-[#13131f] hover:text-red-400 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}
