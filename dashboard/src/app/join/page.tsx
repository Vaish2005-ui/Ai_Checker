"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, User, Lock, Building, CheckCircle2 } from "lucide-react";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("invite");
  
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    password: ""
  });

  useEffect(() => {
    if (!token) return;
    
    fetch(`http://localhost:8000/auth/invite-info/${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.detail) {
          setError(data.detail);
        } else {
          setInviteInfo(data);
        }
      })
      .catch(err => {
        setError("Network error bridging invite token.");
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    try {
      const res = await fetch("http://localhost:8000/auth/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invite_token: token,
          name: form.name,
          password: form.password
        })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("company_id", data.company_id);
        localStorage.setItem("role", data.role);
        localStorage.setItem("department", data.department);
        router.push(`/dashboard/${data.department}`);
      } else {
        alert(data.detail || "Failed to join");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="text-red-500 font-bold text-2xl">X</div>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-white">Invalid Invite</h2>
        <p className="text-slate-400">{error}</p>
      </div>
    );
  }

  if (!inviteInfo && token) {
    return <div className="text-center p-8 text-slate-400 animate-pulse">Verifying invite...</div>;
  }

  if (!token) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-2 text-white">Missing Invite Token</h2>
        <p className="text-slate-400">Please click the link in your email to join.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#1e2035]">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Join the Team</h2>
          <p className="text-slate-400 text-sm flex items-center gap-2">
            <Building className="w-4 h-4" /> {inviteInfo.company_name}
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium border border-indigo-500/20 capitalize">
          {inviteInfo.department} Leader
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-slate-400">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              readOnly
              className="w-full bg-[#13131f] border border-[#1e2035] rounded-xl py-3 pl-10 pr-4 text-slate-500 opacity-70 cursor-not-allowed"
              value={inviteInfo.email}
            />
            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-slate-400">Your Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              required
              autoFocus
              className="w-full bg-[#0a0a0f] border border-[#1e2035] rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="John Doe"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-slate-400">Create Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              required type="password"
              className="w-full bg-[#0a0a0f] border border-[#1e2035] rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
          Join & View Dashboard
        </button>
      </form>
    </div>
  );
}

export default function JoinTeam() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-slate-200">
      <div className="w-full max-w-md bg-[#13131f] border border-[#1e2035] rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
          <JoinContent />
        </Suspense>
      </div>
    </div>
  );
}
