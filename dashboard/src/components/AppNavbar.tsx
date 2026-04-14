"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Search, Bell, LogOut } from "lucide-react";
import { API_BASE } from "@/lib/config";

export default function AppNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [departments, setDepartments] = useState<any[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    const r = localStorage.getItem("role");
    const n = localStorage.getItem("user_name") || "";

    if (!compId) return;
    setRole(r);
    setUserName(n);

    fetch(`${API_BASE}/company/info?company_id=${compId}`)
      .then(res => res.json())
      .then(data => { if (data.name) setCompanyName(data.name); })
      .catch(console.error);

    fetch(`${API_BASE}/company/departments?company_id=${compId}`)
      .then(res => res.json())
      .then(data => {
        const d = localStorage.getItem("department");
        let depts = Array.isArray(data) ? data : [];
        if ((r === "employee" || r === "team_leader") && d) {
          depts = depts.filter((dept: any) => dept.name.toLowerCase() === d.toLowerCase());
        }
        setDepartments(depts);
      })
      .catch(console.error);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const navItems = role === "admin" ? [
    { name: 'Overview', href: '/admin' },
    { name: 'Org Tree', href: '/admin/org-tree' },
    ...departments.map(d => ({ name: d.name, href: `/dashboard/${d.name.toLowerCase()}` })),
    { name: 'Startup Profile', href: '/admin/profile' },
  ] : [
    ...departments.map(d => ({ name: d.name, href: `/dashboard/${d.name.toLowerCase()}` })),
  ];

  return (
    <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-50">
      
      {/* Brand & Links */}
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-900 font-bold text-lg">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          {companyName || "Dashboard"}
        </Link>
        
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-black text-white" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <span className="capitalize">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right Utilities */}
      <div className="flex items-center gap-5">
        <button className="text-slate-400 hover:text-slate-900 transition-colors">
          <Search className="w-5 h-5" />
        </button>
        <button className="text-slate-400 hover:text-slate-900 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-900 line-clamp-1">{userName}</p>
            <p className="text-xs text-slate-500 capitalize">{role?.replace("_"," ")}</p>
          </div>
          <button onClick={handleLogout} className="relative group focus:outline-none">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-sm hover:ring-2 hover:ring-slate-300 transition-all">
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
