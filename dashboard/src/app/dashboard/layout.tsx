"use client";

import AppNavbar from "@/components/AppNavbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#F7F9FB] text-slate-800 font-sans">
      <AppNavbar />
      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto overflow-y-auto relative pt-8 px-8">
        {children}
      </main>
    </div>
  );
}
