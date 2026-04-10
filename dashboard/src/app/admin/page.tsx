"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Building2, TrendingUp, Shield, BarChart, Plus, Mail } from "lucide-react";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AdminPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<any[]>([]);
  const [deptRisks, setDeptRisks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDept, setInviteDept] = useState("hr");

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    const role = localStorage.getItem("role");
    
    if (!compId || role !== "admin") {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        const dRes = await fetch(`http://localhost:8000/company/departments?company_id=${compId}`);
        const dData = await dRes.json();
        setDepartments(dData);

        const mRes = await fetch(`http://localhost:8000/company/members?company_id=${compId}`);
        const mData = await mRes.json();
        setMembers(mData);

        const risks = await Promise.all(
          dData.map(async (d: any) => {
            const rRes = await fetch(`http://localhost:8000/department/${compId}/${d.name}/risk`);
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
      const res = await fetch("http://localhost:8000/company/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: compId,
          department: inviteDept,
          email: inviteEmail
        })
      });
      if (res.ok) {
        alert("Invite sent!");
        setInviteEmail("");
      } else {
        alert("Failed to send invite.");
      }
    } catch(err) {
      console.error(err);
    }
  };

  if (loading) {
     return <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-slate-400">Loading Admin Dashboard...</div>;
  }

  const overallRisk = deptRisks.length > 0 
    ? deptRisks.reduce((acc, curr) => acc + curr.risk_pct, 0) / deptRisks.length
    : 0;

  const chartData = deptRisks.map(d => ({
    name: d.department.toUpperCase(),
    score: d.risk_pct
  }));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
      
      {/* Admin Navbar */}
      <nav className="h-16 flex items-center px-8 border-b border-[#1e2035] bg-[#0f0f1a] justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="text-indigo-400 w-5 h-5" />
          <span className="font-semibold text-white">Company Admin</span>
        </div>
        <Link href="/select-department" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
          Go to Workspaces →
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-10">
        
        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
            <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold mb-2">Overall Risk Score</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black text-white">{overallRisk.toFixed(1)}%</span>
              <span className={`text-sm font-medium mb-1.5 ${overallRisk > 50 ? 'text-red-400' : 'text-green-400'}`}>Avg. active state</span>
            </div>
          </div>
          
          <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Active Departments</p>
              <BarChart className="text-slate-500 w-4 h-4" />
            </div>
             <span className="text-4xl font-bold text-white">{departments.length}</span>
          </div>

          <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Total Members</p>
              <Users className="text-slate-500 w-4 h-4" />
            </div>
             <span className="text-4xl font-bold text-white">{members.length}</span>
          </div>
        </div>

        {/* Charts & Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
           
           <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                 <Shield className="w-5 h-5 text-indigo-400" />
                 Department Risk Comparison
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: '#1e2035' }} contentStyle={{ backgroundColor: '#0a0a0f', borderColor: '#1e2035', borderRadius: '8px' }} />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score > 60 ? '#ef4444' : entry.score > 40 ? '#f59e0b' : '#22c55e'} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-0 overflow-hidden">
              <div className="p-6 border-b border-[#1e2035]">
                 <h3 className="text-lg font-semibold flex items-center gap-2">
                     <TrendingUp className="w-5 h-5 text-indigo-400" />
                     Department Status
                 </h3>
              </div>
              <div className="divide-y divide-[#1e2035]">
                 {deptRisks.map(d => (
                    <div key={d.department} className="p-4 flex items-center justify-between hover:bg-[#1e2035]/50 transition-colors">
                       <span className="capitalize font-medium text-slate-200">{d.department}</span>
                       <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                         d.color === "red" ? "bg-red-500/10 text-red-500" :
                         d.color === "amber" ? "bg-amber-500/10 text-amber-500" :
                         "bg-green-500/10 text-green-500"
                       }`}>
                         {d.risk_pct}%
                       </span>
                    </div>
                 ))}
                 {deptRisks.length === 0 && <div className="p-4 text-slate-500">No departments initialized.</div>}
              </div>
           </div>

        </div>

        {/* Team & Invites */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
            
            <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6 lg:col-span-2">
               <h3 className="text-lg font-semibold mb-6">Team Members</h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm">
                    <thead>
                       <tr className="text-slate-500 border-b border-[#1e2035]">
                         <th className="font-semibold pb-3 pl-2">Name</th>
                         <th className="font-semibold pb-3">Email</th>
                         <th className="font-semibold pb-3">Role</th>
                         <th className="font-semibold pb-3">Department</th>
                         <th className="font-semibold pb-3">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2035]">
                       {members.map((m, i) => (
                          <tr key={i} className="hover:bg-[#1e2035]/30">
                             <td className="py-4 pl-2 font-medium text-white">{m.name}</td>
                             <td className="py-4 text-slate-400">{m.email}</td>
                             <td className="py-4">
                                <span className="bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md capitalize text-xs">
                                   {m.role.replace("_", " ")}
                                </span>
                             </td>
                             <td className="py-4 capitalize text-slate-300">{m.department}</td>
                             <td className="py-4">
                                {m.role !== "admin" && (
                                   <button className="text-red-400 hover:text-red-500 text-xs font-semibold">Remove</button>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>

            <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
               <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 relative z-10">
                  <Mail className="w-5 h-5 text-indigo-400" />
                  Invite Team
               </h3>
               
               <form onSubmit={handleInvite} className="space-y-4 relative z-10">
                  <div className="space-y-1">
                     <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Email Address</label>
                     <input 
                        type="email" required
                        className="w-full bg-[#0a0a0f] border border-[#1e2035] rounded-xl py-2 px-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="leader@acme.com"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                     />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Department</label>
                     <select 
                        className="w-full bg-[#0a0a0f] border border-[#1e2035] rounded-xl py-2 px-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none appearance-none"
                        value={inviteDept}
                        onChange={e => setInviteDept(e.target.value)}
                     >
                        <option value="hr">HR</option>
                        <option value="finance">Finance</option>
                        <option value="engineering">Engineering</option>
                        <option value="operations">Operations</option>
                        <option value="security">Security</option>
                        <option value="marketing">Marketing</option>
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
