"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Mail, Lock, User, Briefcase, BarChart } from "lucide-react";

export default function RegisterCompany() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    industry: "",
    size: "1-10",
    admin_name: "",
    admin_email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/company/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, departments: ["HR"] }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("company_id", data.company_id);
        localStorage.setItem("role", data.role);
        localStorage.setItem("department", "all");
        localStorage.setItem("user_name", form.admin_name);
        router.push("/onboarding/departments");
      } else {
        alert(data.detail || "Registration failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FB] text-slate-800">
      <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
        
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-slate-900">
          <Building2 className="text-indigo-500" />
          Setup Company
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-slate-500 font-medium">Company Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Acme Corp"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-slate-500 font-medium">Industry</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="FinTech"
                  value={form.industry}
                  onChange={e => setForm({...form, industry: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm text-slate-500 font-medium">Company Size</label>
              <div className="relative">
                <BarChart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                  value={form.size}
                  onChange={e => setForm({...form, size: e.target.value})}
                >
                  <option>1-10</option>
                  <option>11-50</option>
                  <option>51-200</option>
                  <option>201+</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 pb-2">
            <div className="h-px w-full bg-slate-200" />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-500 font-medium">HR Admin Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="Jane Doe"
                value={form.admin_name}
                onChange={e => setForm({...form, admin_name: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-500 font-medium">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                required type="email"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="hr@acme.com"
                value={form.admin_email}
                onChange={e => setForm({...form, admin_email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-500 font-medium">Admin Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                required type="password"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 mt-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 font-bold text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all"
          >
            Create Company & Admin
          </button>
        </form>
      </div>
    </div>
  );
}
