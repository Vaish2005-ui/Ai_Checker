"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Users, Shield, DollarSign, Cog, Target, Briefcase, Code2, Crown, UserCheck, User, ChevronRight, Network, Plus } from "lucide-react";

const DEPT_ICONS: any = {
  hr: { icon: Users, color: "#a855f7", bg: "bg-purple-500/10" },
  finance: { icon: DollarSign, color: "#14b8a6", bg: "bg-teal-500/10" },
  engineering: { icon: Cog, color: "#f59e0b", bg: "bg-amber-500/10" },
  software: { icon: Code2, color: "#f97316", bg: "bg-orange-500/10" },
  operations: { icon: Target, color: "#f43f5e", bg: "bg-rose-500/10" },
  security: { icon: Shield, color: "#3b82f6", bg: "bg-blue-500/10" },
  marketing: { icon: Briefcase, color: "#ec4899", bg: "bg-pink-500/10" },
};

export default function OrgTreePage() {
  const router = useRouter();
  const [tree, setTree] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newDept, setNewDept] = useState("");
  const [showAddDept, setShowAddDept] = useState(false);

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    const role = localStorage.getItem("role");
    if (!compId || role !== "admin") {
      router.push("/");
      return;
    }

    fetch(`http://localhost:8000/company/org-tree?company_id=${compId}`)
      .then(res => res.json())
      .then(data => {
        setTree(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [router]);

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    const compId = localStorage.getItem("company_id");
    try {
      await fetch(`http://localhost:8000/company/add-department?company_id=${compId}&department=${encodeURIComponent(newDept)}`, { method: "POST" });
      // Refresh tree
      const res = await fetch(`http://localhost:8000/company/org-tree?company_id=${compId}`);
      setTree(await res.json());
      setNewDept("");
      setShowAddDept(false);
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading org tree...</span>
        </div>
      </div>
    );
  }

  const totalMembers = tree.departments.reduce((acc: number, d: any) => acc + d.total, 0) + 1; // +1 for admin

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      {/* Header */}
      <nav className="h-16 flex items-center px-8 border-b border-[#1e2035] bg-[#0f0f1a] justify-between">
        <div className="flex items-center gap-3">
          <Network className="text-indigo-400 w-5 h-5" />
          <span className="font-semibold text-white">Organization Tree</span>
          <span className="text-xs bg-[#1e2035] text-slate-500 px-2 py-0.5 rounded-md">{totalMembers} members</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowAddDept(true)} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors">
            <Plus className="w-3 h-3" /> Add Department
          </button>
          <Link href="/admin" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">← Back to Admin</Link>
        </div>
      </nav>

      {/* Add Dept Modal */}
      {showAddDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Add Department</h3>
            <form onSubmit={handleAddDept} className="space-y-4">
              <input
                required value={newDept} onChange={e => setNewDept(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-[#1e2035] rounded-xl py-2.5 px-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-white"
                placeholder="e.g. design, qa, devops"
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddDept(false)} className="flex-1 py-2.5 border border-[#1e2035] text-slate-400 rounded-xl text-sm font-medium hover:bg-[#1e2035] transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-colors">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-8 py-12">
        
        {/* Tree Visualization */}
        <div className="flex flex-col items-center">
          
          {/* ROOT: Company */}
          <div className="relative mb-2">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl px-8 py-5 text-center shadow-lg shadow-indigo-500/20 border border-indigo-500/30">
              <Building2 className="w-8 h-8 text-white mx-auto mb-2" />
              <h2 className="text-xl font-bold text-white">{tree.company}</h2>
              <p className="text-indigo-200 text-xs mt-1">Organization</p>
            </div>
          </div>
          
          {/* Connector line */}
          <div className="w-0.5 h-8 bg-gradient-to-b from-indigo-500 to-[#1e2035]" />
          
          {/* ADMIN NODE */}
          {tree.admin && (
            <>
              <div className="relative mb-2">
                <div className="bg-[#13131f] border-2 border-indigo-500/40 rounded-xl px-6 py-3 text-center shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-md">
                      {tree.admin.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-white">{tree.admin.name}</p>
                      <p className="text-[10px] text-slate-500">{tree.admin.email}</p>
                    </div>
                    <Crown className="w-5 h-5 text-amber-400 ml-2" />
                  </div>
                  <span className="mt-2 inline-block text-[10px] bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-bold">ADMIN</span>
                </div>
              </div>
              <div className="w-0.5 h-8 bg-[#1e2035]" />
            </>
          )}

          {/* Horizontal connector */}
          <div className="relative w-full flex justify-center mb-2">
            <div className="h-0.5 bg-[#1e2035]" style={{ width: `${Math.min(tree.departments.length * 180, 900)}px` }} />
          </div>

          {/* DEPARTMENT BRANCHES */}
          <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(tree.departments.length, 4)}, minmax(200px, 1fr))` }}>
            {tree.departments.map((dept: any) => {
              const dk = dept.key;
              const deptStyle = DEPT_ICONS[dk] || { icon: Cog, color: "#6366f1", bg: "bg-indigo-500/10" };
              const DeptIcon = deptStyle.icon;
              
              return (
                <div key={dk} className="flex flex-col items-center">
                  {/* Vertical connector */}
                  <div className="w-0.5 h-6 bg-[#1e2035]" />
                  
                  {/* Department Node */}
                  <Link href={`/dashboard/${dk}`} className="block group">
                    <div className="bg-[#13131f] border border-[#1e2035] rounded-xl p-4 text-center hover:border-slate-600 transition-all group-hover:-translate-y-1 min-w-[200px] relative overflow-hidden">
                      <div className="absolute -top-8 -right-8 w-16 h-16 blur-2xl rounded-full opacity-30" style={{ background: deptStyle.color }} />
                      
                      <div className={`w-10 h-10 rounded-xl ${deptStyle.bg} flex items-center justify-center mx-auto mb-3`}>
                        <DeptIcon className="w-5 h-5" style={{ color: deptStyle.color }} />
                      </div>
                      <h3 className="text-sm font-bold text-white capitalize mb-1">{dept.label || dept.name}</h3>
                      <span className="text-[10px] text-slate-500">{dept.total} member{dept.total !== 1 ? "s" : ""}</span>
                    </div>
                  </Link>
                  
                  {/* Team members below */}
                  {(dept.leaders.length > 0 || dept.employees.length > 0) && (
                    <>
                      <div className="w-0.5 h-4 bg-[#1e2035]" />
                      <div className="space-y-1.5 w-full">
                        {dept.leaders.map((l: any, i: number) => (
                          <div key={i} className="flex items-center gap-2.5 bg-[#0f0f1a] border border-[#1e2035] rounded-lg px-3 py-2 mx-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: deptStyle.color }}>
                              {l.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-white truncate">{l.name}</p>
                              <p className="text-[9px] text-slate-500 truncate">{l.email}</p>
                            </div>
                            <UserCheck className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                          </div>
                        ))}
                        {dept.employees.map((emp: any, i: number) => (
                          <div key={`e-${i}`} className="flex items-center gap-2.5 bg-[#0a0a12] border border-[#1a1a28] rounded-lg px-3 py-2 mx-2">
                            <div className="w-6 h-6 rounded-full bg-[#1e2035] flex items-center justify-center text-[10px] font-bold text-slate-400">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] text-slate-300 truncate">{emp.name}</p>
                              <p className="text-[9px] text-slate-600 truncate">{emp.email}</p>
                            </div>
                            <User className="w-3 h-3 text-slate-600 flex-shrink-0" />
                          </div>
                        ))}
                        {dept.leaders.length === 0 && dept.employees.length === 0 && (
                          <div className="text-[10px] text-slate-600 text-center py-2 mx-2 border border-dashed border-[#1e2035] rounded-lg">
                            No members yet
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
