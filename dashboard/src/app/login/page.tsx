"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, LogIn, Building2 } from "lucide-react";
import Link from "next/link";
import { API_BASE } from "@/lib/config";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("company_id", data.company_id);
        localStorage.setItem("role", data.role);
        localStorage.setItem("department", data.department);
        localStorage.setItem("user_name", data.name || "");
        localStorage.setItem("user_email", form.email);
        
        if (data.role === "admin") {
          router.push("/admin");
        } else {
          router.push(`/dashboard/${data.department}`);
        }
      } else {
        setError(data.detail || "Invalid credentials");
      }
    } catch (err) {
      setError("Cannot connect to server.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FB] text-slate-800">
      <div className="w-full max-w-md p-8 bg-white border border-slate-200 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-indigo-500/15 blur-3xl rounded-full" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-violet-500/10 blur-3xl rounded-full" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Sign In</h2>
              <p className="text-xs text-slate-500">StartupRisk.ai Dashboard</p>
            </div>
          </div>
          
          <p className="text-slate-500 text-sm mt-4 mb-8">Access your department dashboard, board, and risk analytics.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  required type="email" autoFocus
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  required type="password"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 font-bold text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-3">
            <p className="text-sm text-slate-500">Don&apos;t have an account?</p>
            <div className="flex gap-3">
              <Link href="/register/company" className="flex-1 py-2.5 border border-slate-200 hover:border-indigo-500/30 text-sm font-medium text-slate-700 rounded-xl text-center transition-all hover:bg-slate-50">
                Create Company
              </Link>
              <Link href="/join" className="flex-1 py-2.5 border border-slate-200 hover:border-indigo-500/30 text-sm font-medium text-slate-700 rounded-xl text-center transition-all hover:bg-slate-50">
                Join via Invite
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
