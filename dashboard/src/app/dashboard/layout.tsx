"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, Users, DollarSign, Cog, Target, Briefcase, ChevronLeft, Building2, LogOut, LayoutDashboard, GitBranch, Code2, Network } from "lucide-react";

const DEPT_MAP: any = {
  hr: { icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
  finance: { icon: DollarSign, color: "text-teal-400", bg: "bg-teal-500/10" },
  engineering: { icon: Cog, color: "text-amber-400", bg: "bg-amber-500/10" },
  software: { icon: Code2, color: "text-orange-400", bg: "bg-orange-500/10" },
  operations: { icon: Target, color: "text-rose-400", bg: "bg-rose-500/10" },
  security: { icon: Shield, color: "text-blue-400", bg: "bg-blue-500/10" },
  marketing: { icon: Briefcase, color: "text-pink-400", bg: "bg-pink-500/10" },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [departments, setDepartments] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [userDept, setUserDept] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    const r = localStorage.getItem("role");
    const d = localStorage.getItem("department");
    const n = localStorage.getItem("user_name") || "";
    
    if (!compId) {
      router.push("/");
      return;
    }
    setRole(r);
    setUserDept(d);
    setUserName(n);

    fetch(`http://localhost:8000/company/departments?company_id=${compId}`)
      .then(res => res.json())
      .then(data => {
        let depts = Array.isArray(data) ? data : [];
        // Role-based filtering: employees see only their own department
        if (r === "employee" && d) {
          depts = depts.filter((dept: any) => dept.name.toLowerCase() === d.toLowerCase());
        }
        // team_leader sees only their department too
        if (r === "team_leader" && d) {
          depts = depts.filter((dept: any) => dept.name.toLowerCase() === d.toLowerCase());
        }
        setDepartments(depts);
      })
      .catch(console.error);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const roleBadge = role === "admin" 
    ? { label: "Admin", cls: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30" }
    : role === "team_leader"
    ? { label: "Leader", cls: "bg-teal-500/15 text-teal-400 border-teal-500/30" }
    : { label: "Employee", cls: "bg-slate-500/15 text-slate-400 border-slate-500/30" };

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 bg-[#0f0f1a] border-r border-[#1e2035] flex flex-col">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-[#1e2035]">
          <Link href="/select-department" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-medium">
            <ChevronLeft className="w-4 h-4" />
            Workspace
          </Link>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${roleBadge.cls}`}>
            {roleBadge.label}
          </span>
        </div>

        {/* User info */}
        {userName && (
          <div className="px-5 py-3 border-b border-[#1e2035]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-[10px] text-slate-500 capitalize">{userDept === "all" ? "All Departments" : userDept}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4">
          {/* Projects / Departments */}
          <div className="px-4 mb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">
              {role === "admin" ? "All Projects" : "My Project"}
            </p>
          </div>
          <nav className="space-y-0.5 px-3">
            {departments.map((dept) => {
              const dName = dept.name.toLowerCase();
              const isActive = pathname === `/dashboard/${dName}`;
              const Icon = DEPT_MAP[dName]?.icon || Cog;
              const color = DEPT_MAP[dName]?.color || "text-slate-400";
              
              return (
                <Link 
                  key={dept.name} 
                  href={`/dashboard/${dName}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? "bg-[#1e2035] text-white shadow-sm shadow-indigo-500/5" 
                      : "text-slate-400 hover:bg-[#13131f] hover:text-slate-200"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? color : "text-slate-500 group-hover:text-slate-400"}`} />
                  <span className="capitalize font-medium text-sm flex-1">{dept.name}</span>
                  {dept.member_count > 0 && (
                    <span className="text-[10px] bg-[#1e2035] text-slate-500 px-1.5 py-0.5 rounded-md font-mono">
                      {dept.member_count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-[#1e2035] space-y-0.5">
          {role === "admin" && (
            <>
              <Link 
                href="/admin" 
                className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-colors text-sm font-medium ${
                  pathname === "/admin" ? "bg-[#1e2035] text-white" : "text-slate-400 hover:bg-[#13131f] hover:text-white"
                }`}
              >
                <Building2 className="w-4 h-4" />
                Admin Overview
              </Link>
              <Link 
                href="/admin/org-tree" 
                className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-colors text-sm font-medium ${
                  pathname === "/admin/org-tree" ? "bg-[#1e2035] text-white" : "text-slate-400 hover:bg-[#13131f] hover:text-white"
                }`}
              >
                <Network className="w-4 h-4" />
                Org Tree
              </Link>
              <Link 
                href="/admin/profile" 
                className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg transition-colors text-sm font-medium ${
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
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-400 hover:bg-[#13131f] hover:text-red-400 transition-colors text-sm font-medium"
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
