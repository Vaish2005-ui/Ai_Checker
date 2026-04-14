"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Building2, TrendingUp, Shield, BarChart, Plus, Mail, Network, Code2, ChevronRight } from "lucide-react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import AppNavbar from "@/components/AppNavbar";
import { API_BASE } from "@/lib/config";

export default function AdminPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
  const [deptRisks, setDeptRisks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDept, setInviteDept] = useState("hr");
  const [inviteRole, setInviteRole] = useState("team_leader");

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    const role = localStorage.getItem("role");
    
    if (!compId || role !== "admin") {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        const dRes = await fetch(`${API_BASE}/company/departments?company_id=${compId}`);
        const dData = await dRes.json();
        setDepartments(dData);

        const mRes = await fetch(`${API_BASE}/company/members?company_id=${compId}`);
        const mData = await mRes.json();
        setMembers(mData);

        const risks = await Promise.all(
          dData.map(async (d: any) => {
            const rRes = await fetch(`${API_BASE}/department/${compId}/${d.name}/risk`);
            return await rRes.json();
          })
        );
        setDeptRisks(risks);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const compId = localStorage.getItem("company_id");
    try {
      const res = await fetch(`${API_BASE}/company/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: compId,
          department: inviteDept,
          email: inviteEmail,
          role: inviteRole,
        })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Invite sent! Token: ${data.invite_token}`);
        setInviteEmail("");
      } else {
        alert("Failed to send invite.");
      }
    } catch(err) {
      console.error(err);
    }
  };

  if (loading) {
     return (
       <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center text-slate-400">
         <div className="flex flex-col items-center gap-3">
           <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
           <span>Loading Admin Dashboard...</span>
         </div>
       </div>
     );
  }

  const overallRisk = deptRisks.length > 0 
    ? deptRisks.reduce((acc, curr) => acc + curr.risk_pct, 0) / deptRisks.length
    : 0;

  const chartData = deptRisks.map(d => ({
    name: d.department.toUpperCase(),
    score: d.risk_pct
  }));

  const roleCount = {
    admin: members.filter(m => m.role === "admin").length,
    leaders: members.filter(m => m.role === "team_leader").length,
    employees: members.filter(m => m.role === "employee").length,
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-slate-800 font-sans">
      <AppNavbar />

      <main className="max-w-7xl mx-auto px-8 py-10">
        
        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-10">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Overall Risk Score</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black text-slate-900">{overallRisk.toFixed(1)}%</span>
              <span className={`text-xs font-medium mb-1 ${overallRisk > 50 ? 'text-red-500' : 'text-green-500'}`}>Avg. across depts</span>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Departments</p>
              <BarChart className="text-slate-400 w-4 h-4" />
            </div>
             <span className="text-4xl font-bold text-slate-900">{departments.length}</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Team</p>
              <Users className="text-slate-400 w-4 h-4" />
            </div>
             <span className="text-4xl font-bold text-slate-900">{members.length}</span>
             <div className="flex gap-3 mt-2 text-[10px]">
               <span className="text-indigo-600">{roleCount.admin} admin</span>
               <span className="text-teal-600">{roleCount.leaders} leaders</span>
               <span className="text-slate-500">{roleCount.employees} employees</span>
             </div>
          </div>

          <Link href="/admin/org-tree" className="bg-gradient-to-br from-indigo-600/10 to-violet-600/10 border border-indigo-500/20 rounded-2xl p-6 hover:border-indigo-500/40 transition-all group flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Org Tree</p>
              <Network className="text-indigo-400 w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-indigo-400 group-hover:text-indigo-300">View hierarchy</span>
              <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Charts & Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
           
           <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-2 shadow-sm">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-900">
                 <Shield className="w-5 h-5 text-indigo-500" />
                 Department Risk Comparison
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px' }} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score > 60 ? '#ef4444' : entry.score > 40 ? '#f59e0b' : '#22c55e'} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-white border border-slate-200 rounded-2xl p-0 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200">
                 <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
                     <TrendingUp className="w-5 h-5 text-indigo-500" />
                     Department Status
                 </h3>
              </div>
              <div className="divide-y divide-slate-100">
                 {deptRisks.map(d => (
                    <Link key={d.department} href={`/dashboard/${d.department}`} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors block">
                       <span className="capitalize font-medium text-slate-800">{d.department}</span>
                       <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                         d.color === "red" ? "bg-red-50 text-red-600" :
                         d.color === "amber" ? "bg-amber-50 text-amber-600" :
                         "bg-green-50 text-green-600"
                       }`}>
                         {d.risk_pct}%
                       </span>
                    </Link>
                 ))}
                 {deptRisks.length === 0 && <div className="p-4 text-slate-500">No departments initialized.</div>}
              </div>
           </div>

        </div>

        {/* Team & Invites */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-2 shadow-sm">
               <h3 className="text-lg font-semibold mb-6 text-slate-900">Team Members</h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead>
                       <tr className="text-slate-500 border-b border-slate-200">
                         <th className="font-semibold pb-3 pl-2">Name</th>
                         <th className="font-semibold pb-3">Email</th>
                         <th className="font-semibold pb-3">Role</th>
                         <th className="font-semibold pb-3">Department</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {members.map((m, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                             <td className="py-4 pl-2 font-medium text-slate-900">
                               <div className="flex items-center gap-2.5">
                                 <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
                                   {m.name.charAt(0).toUpperCase()}
                                 </div>
                                 {m.name}
                               </div>
                             </td>
                             <td className="py-4 text-slate-500">{m.email}</td>
                             <td className="py-4">
                                <span className={`px-2 py-1 rounded-md capitalize text-xs font-semibold ${
                                  m.role === "admin" ? "bg-indigo-50 text-indigo-600" :
                                  m.role === "team_leader" ? "bg-teal-50 text-teal-600" :
                                  "bg-slate-100 text-slate-500"
                                }`}>
                                   {m.role.replace("_", " ")}
                                </span>
                             </td>
                             <td className="py-4 capitalize text-slate-600">{m.department}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 relative overflow-hidden shadow-sm">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
               <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 relative z-10 text-slate-900">
                  <Mail className="w-5 h-5 text-indigo-500" />
                  Invite Team
               </h3>
               
               <form onSubmit={handleInvite} className="space-y-4 relative z-10">
                  <div className="space-y-1">
                     <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Email Address</label>
                     <input 
                        type="email" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-slate-900"
                        placeholder="member@acme.com"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                     />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Role</label>
                     <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none appearance-none text-slate-900"
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value)}
                     >
                        <option value="team_leader">Team Leader</option>
                        <option value="employee">Employee</option>
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Department</label>
                     <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none appearance-none text-slate-900"
                        value={inviteDept}
                        onChange={e => setInviteDept(e.target.value)}
                     >
                        {departments.map(d => (
                          <option key={d.name} value={d.name.toLowerCase()}>{d.name}</option>
                        ))}
                     </select>
                  </div>
                  <button type="submit" className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                     <Plus className="w-4 h-4" /> Send Invite
                  </button>
               </form>
            </div>

        </div>

      </main>
    </div>
  );
}
