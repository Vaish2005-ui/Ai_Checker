"use client";

import { use, useEffect, useState } from "react";
import { Users, AlertTriangle, TrendingUp, Activity, BarChart2, Shield, Plus, Mail, X, GripVertical, Bug, CheckCircle2, Circle, Clock, ArrowRight, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

const STATUS_COLS = [
  { key: "todo", label: "To Do", icon: Circle, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" },
  { key: "in_progress", label: "In Progress", icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { key: "review", label: "Review", icon: ArrowRight, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { key: "done", label: "Done", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
];

const PRIORITY_COLORS: any = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const TYPE_ICONS: any = {
  bug: { icon: "🐛", color: "text-red-400" },
  task: { icon: "✓", color: "text-blue-400" },
  story: { icon: "📖", color: "text-green-400" },
  epic: { icon: "⚡", color: "text-violet-400" },
};

export default function DepartmentDashboard({ params }: { params: Promise<{ department: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const department = resolvedParams.department;
  
  const [activeTab, setActiveTab] = useState("Board");
  const [data, setData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("");

  // Board state
  const [tasks, setTasks] = useState<any[]>([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", task_type: "task", assignee_email: "", status: "todo" });

  // Invite employee state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");

  // Simulation
  const [localMetrics, setLocalMetrics] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const TABS = role === "employee"
    ? ["Board", "Risk Overview", "Failure Causes", "Team Members"]
    : ["Board", "Risk Overview", "Failure Causes", "What-if Simulation", "Team Members"];

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    const r = localStorage.getItem("role") || "";
    setRole(r);
    if (!compId) {
      router.push("/");
      return;
    }

    Promise.all([
      fetch(`http://localhost:8000/department/${compId}/${department}/risk`).then(res => res.json()),
      fetch(`http://localhost:8000/company/members?company_id=${compId}`).then(res => res.json()),
      fetch(`http://localhost:8000/department/${compId}/${department}/board`).then(res => res.json()),
    ]).then(([riskData, allMembers, boardData]) => {
      setData(riskData);
      setLocalMetrics(riskData.metrics || {});
      
      const deptMembers = Array.isArray(allMembers) 
        ? allMembers.filter((m: any) => m.department.toLowerCase() === department || m.department === "all")
        : [];
      setMembers(deptMembers);
      setTasks(boardData.tasks || []);
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
        body: JSON.stringify({ company_id: compId, department, metrics: localMetrics })
      });
      const newRiskData = await fetch(`http://localhost:8000/department/${compId}/${department}/risk`).then(res => res.json());
      setData(newRiskData);
      setActiveTab("Risk Overview");
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  // ── Board actions ────────────────────────────────────────────────────
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const compId = localStorage.getItem("company_id");
    try {
      const res = await fetch(`http://localhost:8000/department/${compId}/${department}/board/task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      const data = await res.json();
      if (data.task) {
        setTasks([...tasks, data.task]);
        setNewTask({ title: "", description: "", priority: "medium", task_type: "task", assignee_email: "", status: "todo" });
        setShowCreateTask(false);
      }
    } catch (e) { console.error(e); }
  };

  const moveTask = async (taskId: string, newStatus: string) => {
    const compId = localStorage.getItem("company_id");
    try {
      await fetch(`http://localhost:8000/department/${compId}/${department}/board/task/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (e) { console.error(e); }
  };

  const removeTask = async (taskId: string) => {
    const compId = localStorage.getItem("company_id");
    try {
      await fetch(`http://localhost:8000/department/${compId}/${department}/board/task/${taskId}`, { method: "DELETE" });
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (e) { console.error(e); }
  };

  // ── Invite Employee ──────────────────────────────────────────────────
  const handleInviteEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const compId = localStorage.getItem("company_id");
    try {
      const res = await fetch("http://localhost:8000/company/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: compId, department, email: inviteEmail, role: "employee" }),
      });
      if (res.ok) {
        const d = await res.json();
        setInviteMsg(`✅ Invite sent! Token: ${d.invite_token}`);
        setInviteEmail("");
      } else {
        setInviteMsg("❌ Failed to send invite.");
      }
    } catch (e) { setInviteMsg("❌ Network error."); }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading department data...</span>
        </div>
      </div>
    );
  }

  const riskColor = data.color === "red" ? "text-red-500" : data.color === "amber" ? "text-amber-500" : "text-green-500";
  const bgRiskColor = data.color === "red" ? "bg-red-500" : data.color === "amber" ? "bg-amber-500" : "bg-green-500";

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold capitalize text-white">{department}</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1e2035] text-slate-500 font-mono uppercase tracking-wider">Project</span>
          </div>
          <p className="text-slate-400 text-sm">Department-scoped risk metrics, board & team management.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-[#13131f] border border-[#1e2035] rounded-2xl px-6 py-4 shadow-xl">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Risk Score</p>
            <div className={`text-3xl font-black ${riskColor} tabular-nums leading-none`}>
              {data.risk_pct}%
            </div>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-[#1e2035] flex items-center justify-center relative overflow-hidden">
             <div className={`absolute bottom-0 w-full ${bgRiskColor} transition-all duration-1000`} style={{ height: `${data.risk_pct}%` }} />
             <div className="absolute inset-0 border-4 border-black/20 rounded-full" />
             <span className="relative z-10 font-bold text-[10px] mix-blend-difference text-white">{data.label}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[#1e2035] mb-8">
        <nav className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-sm font-medium transition-all relative ${
                activeTab === tab ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-t-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══ BOARD TAB — Jira-like Kanban ═══ */}
      {activeTab === "Board" && (
        <div>
          {/* Board Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-white">Sprint Board</h2>
              <span className="text-xs bg-[#1e2035] text-slate-400 px-2 py-0.5 rounded-md">{tasks.length} issues</span>
            </div>
            {role !== "employee" && (
              <button
                onClick={() => setShowCreateTask(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Issue
              </button>
            )}
          </div>

          {/* Create Task Modal */}
          {showCreateTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Create Issue</h3>
                  <button onClick={() => setShowCreateTask(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1 block">Title</label>
                    <input required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1e2035] rounded-xl py-2.5 px-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-white" placeholder="Issue title" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1 block">Description</label>
                    <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1e2035] rounded-xl py-2.5 px-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-white h-20 resize-none" placeholder="Optional description" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1 block">Type</label>
                      <select value={newTask.task_type} onChange={e => setNewTask({...newTask, task_type: e.target.value})}
                        className="w-full bg-[#0a0a0f] border border-[#1e2035] rounded-xl py-2.5 px-3 text-sm outline-none text-white appearance-none">
                        <option value="task">Task</option>
                        <option value="bug">Bug</option>
                        <option value="story">Story</option>
                        <option value="epic">Epic</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1 block">Priority</label>
                      <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}
                        className="w-full bg-[#0a0a0f] border border-[#1e2035] rounded-xl py-2.5 px-3 text-sm outline-none text-white appearance-none">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1 block">Status</label>
                      <select value={newTask.status} onChange={e => setNewTask({...newTask, status: e.target.value})}
                        className="w-full bg-[#0a0a0f] border border-[#1e2035] rounded-xl py-2.5 px-3 text-sm outline-none text-white appearance-none">
                        {STATUS_COLS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1 block">Assignee Email</label>
                    <input value={newTask.assignee_email} onChange={e => setNewTask({...newTask, assignee_email: e.target.value})}
                      className="w-full bg-[#0a0a0f] border border-[#1e2035] rounded-xl py-2.5 px-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-white" placeholder="assignee@company.com" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors">
                    Create Issue
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Kanban Columns */}
          <div className="grid grid-cols-4 gap-4">
            {STATUS_COLS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.key);
              const ColIcon = col.icon;
              return (
                <div key={col.key} className="min-h-[400px]">
                  {/* Column Header */}
                  <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${col.bg} border ${col.border}`}>
                    <ColIcon className={`w-3.5 h-3.5 ${col.color}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>{col.label}</span>
                    <span className="ml-auto text-[10px] bg-black/20 text-slate-400 px-1.5 py-0.5 rounded font-mono">{colTasks.length}</span>
                  </div>
                  
                  {/* Cards */}
                  <div className="space-y-2">
                    {colTasks.map(task => (
                      <div key={task.id} className="bg-[#13131f] border border-[#1e2035] rounded-xl p-3.5 hover:border-[#252540] transition-all group cursor-pointer">
                        {/* Type + ID */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">{TYPE_ICONS[task.task_type]?.icon || "✓"}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{department.toUpperCase().slice(0,3)}-{task.id.slice(0,4)}</span>
                          </div>
                          <button onClick={() => removeTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {/* Title */}
                        <p className="text-sm font-medium text-white mb-2 leading-snug">{task.title}</p>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 mb-2 line-clamp-2">{task.description}</p>
                        )}
                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
                            {task.priority}
                          </span>
                          {task.assignee_email && (
                            <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[9px] font-bold text-indigo-400">
                              {task.assignee_email.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {/* Quick move buttons */}
                        {role !== "employee" && (
                          <div className="flex gap-1 mt-2 pt-2 border-t border-[#1e2035] opacity-0 group-hover:opacity-100 transition-opacity">
                            {STATUS_COLS.filter(s => s.key !== task.status).map(s => (
                              <button
                                key={s.key}
                                onClick={() => moveTask(task.id, s.key)}
                                className={`text-[9px] px-1.5 py-0.5 rounded ${s.bg} ${s.color} hover:opacity-80 transition-opacity`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="border border-dashed border-[#1e2035] rounded-xl p-4 text-center text-[11px] text-slate-600">
                        No issues
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ RISK OVERVIEW TAB ═══ */}
      {activeTab === "Risk Overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(data.metrics || {}).map(([key, val]: any) => (
             <div key={key} className="bg-[#13131f] border border-[#1e2035] rounded-xl p-5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full group-hover:bg-indigo-500/10 transition-colors" />
               <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">{key.replace(/_/g, " ")}</p>
               <p className="text-3xl font-light text-white">{typeof val === 'number' ? val.toFixed(2) : val}</p>
               {data.relevant_fields?.includes(key) && (
                 <span className="mt-2 inline-block text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">Dept-relevant</span>
               )}
             </div>
          ))}
          {Object.keys(data.metrics || {}).length === 0 && (
              <div className="col-span-full border border-dashed border-[#1e2035] rounded-2xl p-12 text-center text-slate-500">
                  No metrics tracked yet. Set them up in the simulation tab or via the admin profile.
              </div>
          )}
        </div>
      )}

      {/* ═══ FAILURE CAUSES TAB ═══ */}
      {activeTab === "Failure Causes" && (
         <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl overflow-hidden">
           <div className="p-6 border-b border-[#1e2035]">
               <h3 className="font-semibold text-lg flex items-center gap-2"><AlertTriangle className="text-amber-500 w-5 h-5"/> Top Risk Contributors</h3>
           </div>
           <div className="divide-y divide-[#1e2035]">
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

      {/* ═══ WHAT-IF SIMULATION TAB ═══ */}
      {activeTab === "What-if Simulation" && (
         <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6 md:p-8">
           <h3 className="font-semibold text-xl mb-2">Simulation Sandbox</h3>
           <p className="text-slate-400 text-sm mb-8">Adjust the sliders below to see how improving or degrading specific factors affects your {department} risk score.</p>

           <div className="space-y-6 max-w-2xl">
               {(data.relevant_fields || []).map((key: string) => {
                   const val = localMetrics[key] ?? data.metrics?.[key] ?? 0.2;
                   const isDevOps = ["change_failure_rate", "deployment_frequency", "lead_time_days", "mttr_hours"].includes(key);
                   const max = isDevOps ? (key === "lead_time_days" ? 60 : key === "mttr_hours" ? 72 : 1) : 2;
                   const step = isDevOps ? (key === "lead_time_days" ? 1 : key === "mttr_hours" ? 1 : 0.05) : 0.05;
                   return (
                       <div key={key}>
                           <div className="flex justify-between mb-2">
                              <label className="text-sm font-medium text-slate-300 capitalize">{key.replace(/_/g, " ")}</label>
                              <span className="text-sm font-bold text-indigo-400 tabular-nums">{typeof val === 'number' ? val.toFixed(2) : val}</span>
                           </div>
                           <input 
                              type="range" min="0" max={max} step={step}
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

      {/* ═══ TEAM MEMBERS TAB ═══ */}
      {activeTab === "Team Members" && (
        <div className="space-y-8">
          {/* Invite Employee — visible to team_leader and admin */}
          {(role === "team_leader" || role === "admin") && (
            <div className="bg-[#13131f] border border-[#1e2035] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 relative z-10">
                <Mail className="w-5 h-5 text-indigo-400" />
                Add Employee to {department}
              </h3>
              <form onSubmit={handleInviteEmployee} className="flex items-end gap-3 relative z-10">
                <div className="flex-1">
                  <label className="text-xs text-slate-400 uppercase tracking-wider font-bold block mb-1">Employee Email</label>
                  <input
                    type="email" required
                    className="w-full bg-[#0a0a0f] border border-[#1e2035] rounded-xl py-2.5 px-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-white"
                    placeholder="employee@company.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                </div>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Invite Employee
                </button>
              </form>
              {inviteMsg && <p className="text-sm mt-3 text-slate-300 relative z-10">{inviteMsg}</p>}
            </div>
          )}

          {/* Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((m, i) => (
                <div key={i} className="bg-[#13131f] border border-[#1e2035] rounded-xl p-6 flex flex-col items-center text-center group hover:border-[#252540] transition-colors">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl font-bold text-white mb-4 shadow-xl">
                        {m.name.charAt(0).toUpperCase()}
                    </div>
                    <h4 className="font-semibold text-lg text-white">{m.name}</h4>
                    <p className="text-slate-400 text-sm mb-1">{m.email}</p>
                    <div className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold capitalize border ${
                      m.role === "admin" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                      m.role === "team_leader" ? "bg-teal-500/10 text-teal-400 border-teal-500/20" :
                      "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    }`}>
                        {m.role.replace("_", " ")}
                    </div>
                </div>
            ))}
            {members.length === 0 && <p className="col-span-full text-slate-500">No team members joined yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
