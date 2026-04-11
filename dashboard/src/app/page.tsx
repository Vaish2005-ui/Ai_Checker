import Link from "next/link";
import { Shield, Users, DollarSign, Cog, Target, Briefcase } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen text-slate-200 bg-[#0a0a0f] font-sans selection:bg-indigo-500/30">
      <main className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center mt-20 mb-32 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 blur-[100px] rounded-full -z-10 pointer-events-none" />
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            AI-powered startup <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">failure prediction</span>
          </h1>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Unify risk monitoring across your entire organization. Anticipate bottlenecks, assess department health, and simulate outcomes before they happen.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/register/company" 
              className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 font-medium text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:scale-105 transition-all duration-300 w-full sm:w-auto text-center"
            >
              Create company account
            </Link>
            <Link 
              href="/login" 
              className="px-8 py-4 rounded-full bg-[#13131f] border border-[#1e2035] hover:border-indigo-500/40 hover:bg-[#1a1a2e] font-medium text-slate-300 transition-all duration-300 w-full sm:w-auto text-center"
            >
              Sign in
            </Link>
            <Link 
              href="/join" 
              className="px-8 py-4 rounded-full bg-[#13131f] border border-[#1e2035] hover:border-slate-600 hover:bg-[#1a1a2e] font-medium text-slate-300 transition-all duration-300 w-full sm:w-auto text-center"
            >
              Join via invite
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="w-full">
          <h2 className="text-3xl font-bold text-center mb-16 text-slate-100">Comprehensive Risk Monitoring</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <FeatureCard 
              icon={<Users className="w-6 h-6 text-purple-400" />} 
              title="HR Department" 
              desc="Monitor team turnover, toxicity & trust issues, and burnout risks."
              borderColor="border-purple-500/20"
              bgColor="bg-purple-500/5"
            />
            <FeatureCard 
              icon={<DollarSign className="w-6 h-6 text-teal-400" />} 
              title="Finance Department" 
              desc="Track burn rate, budget constraints, and monetization failures."
              borderColor="border-teal-500/20"
              bgColor="bg-teal-500/5"
            />
            <FeatureCard 
              icon={<Cog className="w-6 h-6 text-amber-400" />} 
              title="Engineering" 
              desc="Assess tech debt, execution flaws, and platform dependencies."
              borderColor="border-amber-500/20"
              bgColor="bg-amber-500/5"
            />
            <FeatureCard 
              icon={<Target className="w-6 h-6 text-coral-400" />} 
              title="Operations" 
              desc="Evaluate acquisition stagnation and market fit limits."
              borderColor="border-[#ff7f50]/20"
              bgColor="bg-[#ff7f50]/5"
            />
            <FeatureCard 
              icon={<Shield className="w-6 h-6 text-blue-400" />} 
              title="Security" 
              desc="Identify security risks and regulatory pressures early."
              borderColor="border-blue-500/20"
              bgColor="bg-blue-500/5"
            />
            <FeatureCard 
              icon={<Briefcase className="w-6 h-6 text-pink-400" />} 
              title="Marketing" 
              desc="Detect overhype and identify shifting market trends."
              borderColor="border-pink-500/20"
              bgColor="bg-pink-500/5"
            />

          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc, borderColor, bgColor }: any) {
  return (
    <div className={`p-6 rounded-2xl bg-[#13131f] border border-[#1e2035] hover:${borderColor} hover:${bgColor} transition-colors duration-300 group`}>
      <div className="p-3 bg-[#1e2035] w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-slate-400 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}
