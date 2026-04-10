"use client";
import { useRouter } from "next/navigation";

/* ── Design tokens ────────────────────────────────────────────────────────── */
const C = {
  bg:      "#0a0a0f",
  surface: "#0f0f1a",
  card:    "#13131f",
  border:  "#1e2035",
  border2: "#252540",
  muted:   "#64748b",
  text:    "#e2e8f0",
  textDim: "#94a3b8",
  indigo:  "#6366f1",
  violet:  "#8b5cf6",
  green:   "#22c55e",
  cyan:    "#06b6d4",
  amber:   "#f59e0b",
};

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav
        style={{ background: C.surface + "cc", borderBottom: `1px solid ${C.border}`, backdropFilter: "blur(12px)" }}
        className="sticky top-0 z-50 flex items-center justify-between px-8 py-3"
      >
        <div className="flex items-center gap-3">
          <div
            style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.violet})` }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg"
          >
            AI
          </div>
          <span style={{ color: C.text }} className="text-sm font-semibold tracking-tight">
            StartupRisk<span style={{ color: C.indigo }}>.ai</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            style={{ color: C.muted }}
            className="text-sm hover:text-white transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={() => router.push("/assess")}
            style={{ background: C.indigo, color: "#fff" }}
            className="px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background glow effects */}
        <div
          className="absolute animate-float"
          style={{
            width: 500, height: 500, borderRadius: "50%",
            background: `radial-gradient(circle, ${C.indigo}15 0%, transparent 70%)`,
            top: -100, right: -100, pointerEvents: "none",
          }}
        />
        <div
          className="absolute"
          style={{
            width: 400, height: 400, borderRadius: "50%",
            background: `radial-gradient(circle, ${C.violet}10 0%, transparent 70%)`,
            bottom: -50, left: -50, pointerEvents: "none",
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center px-6 pt-24 pb-20">
          {/* Badge */}
          <div className="animate-fade-in-up" style={{ opacity: 0 }}>
            <span
              style={{
                background: C.indigo + "15",
                border: `1px solid ${C.indigo}30`,
                color: C.indigo,
              }}
              className="inline-block px-4 py-1.5 rounded-full text-xs font-medium mb-6"
            >
              🔬 AI-Powered Risk Intelligence — Backed by ML trained on 1000s of startups
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl md:text-6xl font-bold leading-tight mb-6 animate-fade-in-up delay-100"
            style={{ color: C.text, opacity: 0 }}
          >
            Know Your Startup&apos;s{" "}
            <span
              style={{
                background: `linear-gradient(135deg, ${C.indigo}, ${C.violet}, ${C.cyan})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Failure Risk
            </span>
            <br />
            Before It&apos;s Too Late
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg mb-10 max-w-2xl mx-auto animate-fade-in-up delay-200"
            style={{ color: C.textDim, opacity: 0 }}
          >
            Answer a 5-minute questionnaire about your business and get an instant,
            AI-powered risk assessment with actionable recommendations you can act on today.
          </p>

          {/* CTA buttons */}
          <div className="flex items-center justify-center gap-4 animate-fade-in-up delay-300" style={{ opacity: 0 }}>
            <button
              onClick={() => router.push("/assess")}
              style={{
                background: `linear-gradient(135deg, ${C.indigo}, ${C.violet})`,
                color: "#fff",
                boxShadow: `0 4px 24px ${C.indigo}40`,
              }}
              className="px-8 py-3.5 rounded-xl text-base font-semibold hover:opacity-90 transition-all hover:shadow-lg"
            >
              Assess Your Startup →
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              style={{ border: `1px solid ${C.border2}`, color: C.textDim, background: "transparent" }}
              className="px-8 py-3.5 rounded-xl text-base hover:text-white hover:border-slate-500 transition-colors"
            >
              Expert Dashboard
            </button>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center justify-center gap-6 animate-fade-in delay-500" style={{ opacity: 0 }}>
            {[
              { val: "17", label: "Risk Factors" },
              { val: "2", label: "ML Models" },
              { val: "5 min", label: "Assessment" },
              { val: "Instant", label: "Results" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div style={{ color: C.text }} className="text-lg font-bold">{s.val}</div>
                <div style={{ color: C.muted }} className="text-[10px] uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <div style={{ color: C.muted }} className="text-[10px] uppercase tracking-widest mb-2">How It Works</div>
            <h2 style={{ color: C.text }} className="text-3xl font-bold">Three Steps to Clarity</h2>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "📝",
                title: "Answer Questions",
                desc: "Complete a 5-minute questionnaire covering market, execution, financial, and technical dimensions of your business.",
              },
              {
                step: "02",
                icon: "🔬",
                title: "AI Analysis",
                desc: "Our ML model — trained on a Random Forest and XGBoost ensemble — analyzes 17 risk factors across 4 domains simultaneously.",
              },
              {
                step: "03",
                icon: "📊",
                title: "Get Your Report",
                desc: "Receive a professional risk report with your overall score, domain breakdown, and a prioritized action plan with projected impact.",
              },
            ].map((s, i) => (
              <div
                key={i}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20 }}
                className="p-6 text-center relative overflow-hidden group hover:border-indigo-500/30 transition-colors"
              >
                <div
                  style={{ color: C.border2 }}
                  className="absolute top-3 right-4 text-4xl font-black opacity-50"
                >
                  {s.step}
                </div>
                <div className="text-3xl mb-4">{s.icon}</div>
                <h3 style={{ color: C.text }} className="text-base font-semibold mb-2">{s.title}</h3>
                <p style={{ color: C.muted }} className="text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature cards ──────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <div style={{ color: C.muted }} className="text-[10px] uppercase tracking-widest mb-2">What You Get</div>
          <h2 style={{ color: C.text }} className="text-3xl font-bold">More Than Just a Number</h2>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {[
            {
              icon: "🎯",
              title: "Risk Score with Context",
              desc: "Not just '74%' — see what's driving it, why it matters, and how it compares across domains.",
              color: C.indigo,
            },
            {
              icon: "📋",
              title: "Prioritized Action Plan",
              desc: "Ranked recommendations with projected risk reduction. Know exactly what to fix first and by how much.",
              color: C.green,
            },
            {
              icon: "📈",
              title: "12-Week Projection",
              desc: "See how your risk evolves over time. Understand the trajectory you're on before making changes.",
              color: C.amber,
            },
            {
              icon: "⚡",
              title: "What-If Simulations",
              desc: "Use the advanced dashboard to simulate changes — 'What if we raise $10M?' or 'What if competition increases?'",
              color: C.violet,
            },
          ].map((f, i) => (
            <div
              key={i}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, borderLeft: `3px solid ${f.color}` }}
              className="p-6 hover:border-slate-700 transition-colors"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 style={{ color: C.text }} className="text-sm font-semibold mb-2">{f.title}</h3>
              <p style={{ color: C.muted }} className="text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────────────────── */}
      <section
        style={{ borderTop: `1px solid ${C.border}` }}
        className="py-20"
      >
        <div className="max-w-2xl mx-auto text-center px-6">
          <h2 style={{ color: C.text }} className="text-3xl font-bold mb-4">
            Ready to assess your risk?
          </h2>
          <p style={{ color: C.muted }} className="text-sm mb-8">
            It takes 5 minutes. No signup required. Your data stays private.
          </p>
          <button
            onClick={() => router.push("/assess")}
            style={{
              background: `linear-gradient(135deg, ${C.indigo}, ${C.violet})`,
              color: "#fff",
              boxShadow: `0 4px 24px ${C.indigo}40`,
            }}
            className="px-10 py-4 rounded-xl text-lg font-semibold hover:opacity-90 transition-all"
          >
            Start Free Assessment →
          </button>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, background: C.surface }}>
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.violet})` }}
              className="w-5 h-5 rounded flex items-center justify-center text-white text-[8px] font-bold"
            >
              AI
            </div>
            <span style={{ color: C.muted }} className="text-xs">StartupRisk.ai — AI Failure Prediction System</span>
          </div>
          <span style={{ color: C.muted }} className="text-xs">Built with Random Forest + XGBoost • 17 risk factors</span>
        </div>
      </footer>
    </div>
  );
}
