"use client";

import { use, useEffect, useState } from "react";
import { Users, AlertTriangle, TrendingUp, Activity, BarChart2, Shield, Plus, Mail, X, GripVertical, Bug, CheckCircle2, Circle, Clock, ArrowRight, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer } from "recharts";
import { API_BASE } from "@/lib/config";
import { getImpact, DEFAULT_PROFILE } from "@/lib/api";

const STATUS_COLS = [
  { key: "todo", label: "To Do", icon: Circle, color: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200" },
  { key: "in_progress", label: "In Progress", icon: Clock, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
  { key: "review", label: "Review", icon: ArrowRight, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
  { key: "done", label: "Done", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50", border: "border-green-100" },
];

const PRIORITY_COLORS: any = {
  critical: "bg-red-100 text-red-600 border-red-200",
  high: "bg-orange-100 text-orange-600 border-orange-200",
  medium: "bg-amber-100 text-amber-600 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

const TYPE_ICONS: any = {
  bug: { icon: "🐛", color: "text-red-500" },
  task: { icon: "✓", color: "text-blue-500" },
  story: { icon: "📖", color: "text-green-500" },
  epic: { icon: "⚡", color: "text-violet-500" },
};

const CARD_CLASSES = "bg-white border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px]";
const KANBAN_CARD_CLASSES = "bg-white border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] rounded-[20px] p-4";
const INPUT_CLASSES = "w-full bg-[#F8FAFC] border border-slate-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none text-slate-900";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <div className="text-slate-500 mb-1 font-medium">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {p.value > 0 ? `+${p.value}` : p.value}pp
        </div>
      ))}
    </div>
  );
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
  const [impactData, setImpactData] = useState<any>(null);

  const [tasks, setTasks] = useState<any[]>([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", task_type: "task", assignee_email: "", status: "todo" });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");

  const [localMetrics, setLocalMetrics] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const TABS = role === "employee"
    ? ["Board", "Risk Overview", "Failure Causes", "Team Members"]
    : ["Board", "Risk Overview", "Feature Impact", "Failure Causes", "What-if Simulation", "Team Members"];

  useEffect(() => {
    const compId = localStorage.getItem("company_id");
    const r = localStorage.getItem("role") || "";
    setRole(r);
    if (!compId) {
      router.push("/");
      return;
    }

    Promise.all([
      fetch(`${API_BASE}/department/${compId}/${department}/risk`).then(res => res.json()),
      fetch(`${API_BASE}/company/members?company_id=${compId}`).then(res => res.json()),
      fetch(`${API_BASE}/department/${compId}/${department}/board`).then(res => res.json()),
    ]).then(async ([riskData, allMembers, boardData]) => {
      setData(riskData);
      setLocalMetrics(riskData.metrics || {});
      const deptMembers = Array.isArray(allMembers) 
        ? allMembers.filter((m: any) => m.department.toLowerCase() === department || m.department === "all")
        : [];
      setMembers(deptMembers);
      setTasks(boardData.tasks || []);

      // Fetch Feature Impact (Top Improvements/Risks)
      try {
        const companyProfile = await fetch(`${API_BASE}/company/profile?company_id=${compId}`).then(res => res.json());
        const fullProfile = { 
          ...DEFAULT_PROFILE, 
          ...companyProfile, 
          ...riskData.all_metrics, 
          department 
        };
        const imp = await getImpact(fullProfile);
        setImpactData(imp);
      } catch (e) {
        console.error("Failed to fetch impact data:", e);
      }

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
      await fetch(`${API_BASE}/department/update-metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: compId, department, metrics: localMetrics })
      });
      const newRiskData = await fetch(`${API_BASE}/department/${compId}/${department}/risk`).then(res => res.json());
      setData(newRiskData);
      setActiveTab("Risk Overview");
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const compId = localStorage.getItem("company_id");
    try {
      const res = await fetch(`${API_BASE}/department/${compId}/${department}/board/task`, {
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
      await fetch(`${API_BASE}/department/${compId}/${department}/board/task/${taskId}`, {
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
      await fetch(`${API_BASE}/department/${compId}/${department}/board/task/${taskId}`, { method: "DELETE" });
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (e) { console.error(e); }
  };

  const handleInviteEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const compId = localStorage.getItem("company_id");
    try {
      const res = await fetch(`${API_BASE}/company/invite`, {
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
      <div className="h-40 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const riskColor = data.color === "red" ? "text-red-500" : data.color === "amber" ? "text-amber-500" : "text-green-500";
  const bgRiskColor = data.color === "red" ? "bg-red-500" : data.color === "amber" ? "bg-amber-500" : "bg-green-500";

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold capitalize text-slate-900 tracking-tight">{department}</h1>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-bold uppercase tracking-wider">Project</span>
          </div>
          <p className="text-slate-500 text-sm">Department-scoped risk metrics, board & team management.</p>
        </div>
        
        <div className={`flex items-center gap-4 ${CARD_CLASSES} px-6 py-4`}>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Risk Score</p>
            <div className={`text-4xl font-black ${riskColor} tabular-nums leading-none`}>
              {data.risk_pct}%
            </div>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-slate-100 flex items-center justify-center relative overflow-hidden bg-slate-50">
             <div className={`absolute bottom-0 w-full ${bgRiskColor} transition-all duration-1000`} style={{ height: `${data.risk_pct}%` }} />
             <div className="absolute inset-0 border-4 border-black/5 rounded-full" />
             <span className="relative z-10 font-bold text-[10px] mix-blend-darken text-slate-900 bg-white/70 px-1 rounded-full">{data.label}</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 mb-8 mt-4">
        <nav className="flex gap-2">
          {TABS.map(tab => (
            <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`pb-3 px-2 text-sm font-semibold transition-all relative ${
                activeTab === tab ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-900 rounded-t-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══ BOARD TAB — Jira-like Kanban ═══ */}
      {activeTab === "Board" && (
        <div className="animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sprint Tasks</h2>
              <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-bold">{tasks.length} active</span>
            </div>
            {role !== "employee" && (
              <button
                onClick={() => setShowCreateTask(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-slate-800 text-white text-sm font-semibold rounded-full transition-all shadow-md"
              >
                <Plus className="w-4 h-4" /> Create Issue
              </button>
            )}
          </div>

          {showCreateTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
              <div className={`${CARD_CLASSES} p-8 w-full max-w-lg`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Create Issue</h3>
                  <button onClick={() => setShowCreateTask(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1.5 block">Title</label>
                    <input required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
                      className={INPUT_CLASSES} placeholder="Task title" autoFocus />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1.5 block">Description</label>
                    <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})}
                      className={`${INPUT_CLASSES} h-24 resize-none`} placeholder="Add description..." />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1.5 block">Type</label>
                      <select value={newTask.task_type} onChange={e => setNewTask({...newTask, task_type: e.target.value})} className={INPUT_CLASSES}>
                        <option value="task">Task</option>
                        <option value="bug">Bug</option>
                        <option value="story">Story</option>
                        <option value="epic">Epic</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1.5 block">Priority</label>
                      <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className={INPUT_CLASSES}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1.5 block">Status</label>
                      <select value={newTask.status} onChange={e => setNewTask({...newTask, status: e.target.value})} className={INPUT_CLASSES}>
                        {STATUS_COLS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1.5 block">Assignee Email</label>
                    <input value={newTask.assignee_email} onChange={e => setNewTask({...newTask, assignee_email: e.target.value})}
                      className={INPUT_CLASSES} placeholder="assignee@company.com" />
                  </div>
                  <button type="submit" className="w-full py-3.5 mt-2 bg-black hover:bg-slate-800 text-white font-bold rounded-full transition-colors shadow-lg">
                    Create Issue
                  </button>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-6">
            {STATUS_COLS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.key);
              const ColIcon = col.icon;
              return (
                <div key={col.key} className="min-h-[400px]">
                  <div className={`flex items-center gap-2 mb-4 px-4 py-2.5 rounded-2xl ${col.bg} border ${col.border}`}>
                    <ColIcon className={`w-4 h-4 ${col.color}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>{col.label}</span>
                    <span className="ml-auto text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded-full font-mono shadow-sm">{colTasks.length}</span>
                  </div>
                  
                  <div className="space-y-3">
                    {colTasks.map(task => (
                      <div key={task.id} className={`${KANBAN_CARD_CLASSES} hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all group cursor-pointer`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs bg-slate-50 p-1 rounded-md border border-slate-100">{TYPE_ICONS[task.task_type]?.icon || "✓"}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider">{department.toUpperCase().slice(0,3)}-{task.id.slice(0,4)}</span>
                          </div>
                          <button onClick={() => removeTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 hover:bg-red-50 rounded-md">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-slate-900 mb-2 leading-snug">{task.title}</p>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
                            {task.priority}
                          </span>
                          {task.assignee_email && (
                            <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                              {task.assignee_email.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        {role !== "employee" && (
                          <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                            {STATUS_COLS.filter(s => s.key !== task.status).map(s => (
                              <button
                                key={s.key}
                                onClick={() => moveTask(task.id, s.key)}
                                className={`flex-1 text-[9px] py-1 rounded-md font-bold uppercase tracking-wide border ${s.bg} ${s.color} ${s.border} hover:opacity-80 transition-opacity`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="border-2 border-dashed border-slate-200 rounded-[24px] p-6 text-center text-sm font-medium text-slate-400 bg-slate-50/50">
                        No issues found
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {Object.entries(data.metrics || {}).map(([key, val]: any) => (
             <div key={key} className={`${CARD_CLASSES} p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow`}>
               <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
                  <BarChart2 className="w-5 h-5 text-slate-400" />
               </div>
               <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">{key.replace(/_/g, " ")}</p>
               <p className="text-3xl font-black text-slate-900 tracking-tight">{typeof val === 'number' ? val.toFixed(2) : val}</p>
               {data.relevant_fields?.includes(key) && (
                 <span className="mt-3 inline-block text-[10px] bg-black text-white px-2.5 py-0.5 rounded-full font-bold">Dept-relevant</span>
               )}
             </div>
          ))}
          {Object.keys(data.metrics || {}).length === 0 && (
              <div className={`col-span-full ${CARD_CLASSES} border-dashed border-2 border-slate-200 shadow-none p-16 text-center text-slate-500 font-medium`}>
                  No metrics tracked yet. Set them up in the simulation tab or via the admin profile.
              </div>
          )}
        </div>
      )}

      {/* ═══ FEATURE IMPACT TAB ═══ */}
      {activeTab === "Feature Impact" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up">
          <div className={`${CARD_CLASSES} p-8`}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Top Improvements</h3>
            </div>
            <p className="text-slate-500 text-xs mb-6">Actions that reduce {department} risk score most significantly.</p>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={impactData?.improvements?.slice(0, 6).map((d: any) => ({
                    name: d.label?.split(" ").slice(0, 2).join(" ") ?? d.feature,
                    value: parseFloat((d.risk_delta * 100).toFixed(1)),
                  })) || []}
                  layout="vertical"
                  margin={{ left: 0, right: 30, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }} 
                  />
                  <ReTooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {(impactData?.improvements || []).map((_: any, i: number) => (
                      <Cell key={i} fill="#22c55e" fillOpacity={0.8 - i * 0.1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`${CARD_CLASSES} p-8`}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Top Risk Factors</h3>
            </div>
            <p className="text-slate-500 text-xs mb-6">Factors that would cause the highest risk spike if worsened.</p>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={impactData?.risks?.slice(0, 6).map((d: any) => ({
                    name: d.label?.split(" ").slice(0, 2).join(" ") ?? d.feature,
                    value: parseFloat((d.risk_delta * 100).toFixed(1)),
                  })) || []}
                  layout="vertical"
                  margin={{ left: 0, right: 30, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={100} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }} 
                  />
                  <ReTooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {(impactData?.risks || []).map((_: any, i: number) => (
                      <Cell key={i} fill="#ef4444" fillOpacity={0.8 - i * 0.1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FAILURE CAUSES TAB ═══ */}
      {activeTab === "Failure Causes" && (
         <div className={`${CARD_CLASSES} overflow-hidden animate-fade-in-up`}>
           <div className="p-6 border-b border-slate-100">
               <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                   <AlertTriangle className="text-amber-500 w-4 h-4"/> 
                 </div>
                 Top Risk Contributors
               </h3>
           </div>
           <div className="divide-y divide-slate-100">
               {Object.entries(data.metrics || {})
                  .sort(([,a]:any, [,b]:any) => b - a)
                  .map(([key, val]: any, i: number) => (
                   <div key={key} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                          <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-black border border-slate-200">{i+1}</span>
                          <span className="capitalize text-slate-700 font-semibold">{key.replace(/_/g, " ")}</span>
                      </div>
                      <div className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                          Severity: {(val * 100).toFixed(0)}
                      </div>
                   </div>
               ))}
               {Object.keys(data.metrics || {}).length === 0 && <div className="p-8 text-center text-slate-500">No active failure factors found for department.</div>}
           </div>
         </div>
      )}

      {/* ═══ WHAT-IF SIMULATION TAB ═══ */}
      {activeTab === "What-if Simulation" && (
         <div className={`${CARD_CLASSES} p-8 animate-fade-in-up`}>
           <h3 className="font-bold text-2xl text-slate-900 mb-2">Simulation Sandbox</h3>
           <p className="text-slate-500 text-sm mb-10 pb-6 border-b border-slate-100">Adjust the sliders below to see how improving or degrading specific factors affects your {department} risk score.</p>

           <div className="space-y-8 max-w-2xl">
               {(data.relevant_fields || []).map((key: string) => {
                   const val = localMetrics[key] ?? data.metrics?.[key] ?? 0.2;
                   const isDevOps = ["change_failure_rate", "deployment_frequency", "lead_time_days", "mttr_hours"].includes(key);
                   const max = isDevOps ? (key === "lead_time_days" ? 60 : key === "mttr_hours" ? 72 : 1) : 2;
                   const step = isDevOps ? (key === "lead_time_days" ? 1 : key === "mttr_hours" ? 1 : 0.05) : 0.05;
                   return (
                       <div key={key} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                           <div className="flex justify-between mb-4">
                              <label className="text-sm font-bold text-slate-700 capitalize">{key.replace(/_/g, " ")}</label>
                              <span className="text-sm font-black text-slate-900 tabular-nums bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">{typeof val === 'number' ? val.toFixed(2) : val}</span>
                           </div>
                           <input 
                              type="range" min="0" max={max} step={step}
                              className="w-full accent-slate-900"
                              value={val}
                              onChange={(e) => handleMetricChange(key, e.target.value)}
                           />
                       </div>
                   );
               })}
               
               <div className="pt-6 mt-6 flex justify-end">
                  <button 
                     onClick={saveSimulationAsActive}
                     disabled={saving}
                     className="px-8 py-3.5 bg-black hover:bg-slate-800 text-white rounded-full font-bold transition-all shadow-lg shadow-black/10 disabled:opacity-50"
                  >
                     {saving ? "Saving..." : "Update Department Metrics"}
                  </button>
               </div>
           </div>
         </div>
      )}

      {/* ═══ TEAM MEMBERS TAB ═══ */}
      {activeTab === "Team Members" && (
        <div className="space-y-8 animate-fade-in-up">
          {(role === "team_leader" || role === "admin") && (
            <div className={`${CARD_CLASSES} p-8`}>
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-slate-600" />
                </div>
                Add Employee to {department}
              </h3>
              <form onSubmit={handleInviteEmployee} className="flex items-end gap-4 max-w-2xl">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 uppercase tracking-wider font-bold block mb-2">Employee Email</label>
                  <input
                    type="email" required
                    className={INPUT_CLASSES}
                    placeholder="employee@company.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                </div>
                <button type="submit" className="px-6 py-2.5 bg-black hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 h-[42px]">
                  <Mail className="w-4 h-4" /> Send Invite
                </button>
              </form>
              {inviteMsg && <p className="text-sm mt-4 font-semibold text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-100 inline-block">{inviteMsg}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {members.map((m, i) => (
                <div key={i} className={`${CARD_CLASSES} p-6 flex flex-col items-center text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group`}>
                    <div className="w-16 h-16 rounded-full bg-slate-100 border-4 border-white shadow-sm flex items-center justify-center text-2xl font-black text-slate-700 mb-4 group-hover:scale-105 transition-transform">
                        {m.name.charAt(0).toUpperCase()}
                    </div>
                    <h4 className="font-bold text-lg text-slate-900">{m.name}</h4>
                    <p className="text-slate-500 text-sm mb-4">{m.email}</p>
                    <div className={`mt-auto px-3.5 py-1 rounded-full text-xs font-bold capitalize border ${
                      m.role === "admin" ? "bg-slate-900 text-white border-transparent" :
                      m.role === "team_leader" ? "bg-slate-100 text-slate-600 border-slate-200" :
                      "bg-white text-slate-500 border-slate-200"
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
