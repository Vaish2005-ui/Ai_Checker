/**
 * recommendations.ts
 * Maps model feature values to actionable, plain-English recommendations.
 * Also computes domain-level risk aggregates for the report.
 */

import { Profile } from "./api";

/* ── Types ──────────────────────────────────────────────────────────────────── */

export interface Recommendation {
  title: string;
  description: string;
  urgency: "critical" | "high" | "medium" | "low";
  category: "Market" | "Product" | "Financial" | "Technical";
  featureKey: keyof Profile;
  currentValue: number;
}

export interface DomainScore {
  name: string;
  score: number;      // 0–100 (percentage risk)
  label: string;
  color: string;
  icon: string;
  factors: { name: string; value: number; max: number }[];
}

/* ── Feature advice catalogue ───────────────────────────────────────────────── */

interface AdviceEntry {
  title: string;
  description: string;
  category: "Market" | "Product" | "Financial" | "Technical";
  threshold: number;     // value ≥ this triggers the recommendation
  featureLabel: string;  // human-readable name
}

const ADVICE: Record<keyof Profile, AdviceEntry> = {
  competition: {
    title: "Intense market competition detected",
    description:
      "Your market is highly competitive. Focus on building defensible moats — proprietary technology, network effects, exclusive partnerships, or a unique brand position that competitors can't easily replicate.",
    category: "Market",
    threshold: 0.8,
    featureLabel: "Competition",
  },
  giants: {
    title: "Competing with dominant incumbents",
    description:
      "Major incumbents operate in your space. Avoid direct feature-for-feature competition. Target underserved segments they ignore, move faster on innovation, and build deep customer relationships.",
    category: "Market",
    threshold: 0.8,
    featureLabel: "Giants",
  },
  poor_market_fit: {
    title: "Product-market fit needs improvement",
    description:
      "Your product isn't fully aligned with market needs. Conduct intensive customer discovery — 50+ user interviews in the next 30 days. Iterate rapidly on the value proposition and validate with paying customers.",
    category: "Product",
    threshold: 0.5,
    featureLabel: "Market Fit",
  },
  trend_shifts: {
    title: "Market is undergoing significant change",
    description:
      "Your market is shifting. Stay close to emerging trends and invest in R&D. Consider whether your current positioning aligns with where the market is heading in 2-3 years.",
    category: "Market",
    threshold: 0.8,
    featureLabel: "Trend Shifts",
  },
  niche_limits: {
    title: "Addressable market may be too narrow",
    description:
      "Your TAM may be limiting growth potential. Explore adjacent markets or use cases that leverage your existing technology. Consider platform strategies that expand your reach.",
    category: "Market",
    threshold: 1.0,
    featureLabel: "Niche Limits",
  },
  platform_dependency: {
    title: "High platform dependency risk",
    description:
      "You're heavily dependent on a single platform. Diversify distribution channels immediately. Build direct customer relationships through email, owned communities, and alternative revenue paths.",
    category: "Product",
    threshold: 0.8,
    featureLabel: "Platform Dependency",
  },
  execution_flaws: {
    title: "Execution quality needs attention",
    description:
      "Your team's execution has gaps. Implement structured sprints, clear ownership for deliverables, and weekly accountability reviews. Evaluate whether you have the right people in the right roles.",
    category: "Product",
    threshold: 0.5,
    featureLabel: "Execution",
  },
  monetization_failure: {
    title: "Revenue generation is struggling",
    description:
      "Monetization is underperforming. Test new pricing models (usage-based, tiered, enterprise). Talk to your best customers about willingness-to-pay. Pivot your business model if the current approach isn't working.",
    category: "Financial",
    threshold: 0.7,
    featureLabel: "Monetization",
  },
  acquisition_stagnation: {
    title: "Customer acquisition is slowing",
    description:
      "Growth is stagnating. Diversify acquisition channels — if relying on one, test 2-3 alternatives. Optimize funnel metrics and reconsider whether your ICP definition needs updating.",
    category: "Product",
    threshold: 0.8,
    featureLabel: "Customer Acquisition",
  },
  overhype: {
    title: "Expectations may be inflated",
    description:
      "There's a gap between expectations and deliverables. Focus on measurable results rather than promises. Underpromise and overdeliver. Reset investor and customer expectations proactively.",
    category: "Product",
    threshold: 0.8,
    featureLabel: "Overhype",
  },
  no_budget: {
    title: "Cash runway is critically low",
    description:
      "Your financial runway is dangerously short. Priority #1: close a funding round or achieve profitability within 90 days. Cut all non-essential expenses and focus only on revenue-generating activities.",
    category: "Financial",
    threshold: 0.8,
    featureLabel: "Cash Runway",
  },
  regulatory_pressure: {
    title: "Regulatory challenges ahead",
    description:
      "Regulatory pressure is impacting your business. Invest in compliance expertise — hire or contract a regulatory specialist. Proactively engage with regulators rather than reacting to enforcement.",
    category: "Financial",
    threshold: 0.8,
    featureLabel: "Regulatory",
  },
  toxicity_trust_issues: {
    title: "Trust and reputation concerns",
    description:
      "Trust issues are impacting your business. Address the root cause — whether internal culture, customer complaints, or public perception. Rebuild trust through transparency and consistent actions.",
    category: "Financial",
    threshold: 0.5,
    featureLabel: "Trust Issues",
  },
  tech_debt: {
    title: "Significant technical debt accumulated",
    description:
      "Technical debt is slowing your velocity. Dedicate 20% of engineering capacity to paying it down. Prioritize by business impact: fix what causes the most customer-facing issues or feature development delays.",
    category: "Technical",
    threshold: 0.8,
    featureLabel: "Tech Debt",
  },
  security_risk: {
    title: "Security vulnerabilities need addressing",
    description:
      "Your security posture has gaps. Conduct a security audit, implement basic controls (encryption, auth, input validation), and set up breach monitoring. A single incident can be existential.",
    category: "Technical",
    threshold: 0.8,
    featureLabel: "Security",
  },
  // Non-risk features — no advice needed
  years_of_operation: { title: "", description: "", category: "Market", threshold: 999, featureLabel: "Years" },
  how_much_they_raised: { title: "", description: "", category: "Financial", threshold: 999, featureLabel: "Funding" },
  week: { title: "", description: "", category: "Market", threshold: 999, featureLabel: "Week" },
  sector: { title: "", description: "", category: "Market", threshold: 999, featureLabel: "Sector" } as any,
  change_failure_rate: { title: "", description: "", category: "Technical", threshold: 999, featureLabel: "Change Failure Rate" },
  deployment_frequency: { title: "", description: "", category: "Technical", threshold: 999, featureLabel: "Deployment Frequency" },
  lead_time_days: { title: "", description: "", category: "Technical", threshold: 999, featureLabel: "Lead Time" },
  mttr_hours: { title: "", description: "", category: "Technical", threshold: 999, featureLabel: "MTTR" },
};

/* ── Build recommendations for a profile ────────────────────────────────────── */

export function getRecommendations(profile: Profile): Recommendation[] {
  const recs: Recommendation[] = [];
  const riskKeys: (keyof Profile)[] = [
    "competition", "giants", "poor_market_fit", "trend_shifts", "niche_limits",
    "platform_dependency", "execution_flaws", "monetization_failure",
    "acquisition_stagnation", "overhype", "no_budget", "regulatory_pressure",
    "toxicity_trust_issues", "tech_debt", "security_risk",
  ];

  for (const key of riskKeys) {
    const val = profile[key] as number;
    const advice = ADVICE[key];
    if (!advice || val < advice.threshold) continue;

    const urgency: Recommendation["urgency"] =
      val >= 1.5 ? "critical" : val >= 1.0 ? "high" : val >= 0.5 ? "medium" : "low";

    recs.push({
      title: advice.title,
      description: advice.description,
      urgency,
      category: advice.category,
      featureKey: key,
      currentValue: val,
    });
  }

  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return recs.sort((a, b) => order[a.urgency] - order[b.urgency]);
}

/* ── Domain-level risk aggregation ──────────────────────────────────────────── */

export function getDomainScores(profile: Profile): DomainScore[] {
  const pct = (vals: number[], max = 2) =>
    Math.round((vals.reduce((a, b) => a + b, 0) / (vals.length * max)) * 100);

  return [
    {
      name: "Market Risk",
      score: pct([profile.competition, profile.giants, profile.niche_limits, profile.trend_shifts, profile.poor_market_fit]),
      label: "",
      color: "#8b5cf6",
      icon: "📊",
      factors: [
        { name: "Competition", value: profile.competition, max: 2 },
        { name: "Giants", value: profile.giants, max: 2 },
        { name: "Market Fit", value: profile.poor_market_fit, max: 2 },
        { name: "Trend Shifts", value: profile.trend_shifts, max: 2 },
        { name: "Niche Limits", value: profile.niche_limits, max: 2 },
      ],
    },
    {
      name: "Execution Risk",
      score: pct([profile.execution_flaws, profile.platform_dependency, profile.acquisition_stagnation, profile.monetization_failure, profile.overhype]),
      label: "",
      color: "#6366f1",
      icon: "⚡",
      factors: [
        { name: "Execution", value: profile.execution_flaws, max: 2 },
        { name: "Platform Dep.", value: profile.platform_dependency, max: 2 },
        { name: "Acquisition", value: profile.acquisition_stagnation, max: 2 },
        { name: "Monetization", value: profile.monetization_failure, max: 2 },
        { name: "Overhype", value: profile.overhype, max: 2 },
      ],
    },
    {
      name: "Financial Risk",
      score: pct([profile.no_budget, profile.regulatory_pressure, profile.toxicity_trust_issues]),
      label: "",
      color: "#f59e0b",
      icon: "💰",
      factors: [
        { name: "Cash Runway", value: profile.no_budget, max: 2 },
        { name: "Regulatory", value: profile.regulatory_pressure, max: 2 },
        { name: "Trust Issues", value: profile.toxicity_trust_issues, max: 2 },
      ],
    },
    {
      name: "Technical Risk",
      score: pct([profile.tech_debt, profile.security_risk]),
      label: "",
      color: "#06b6d4",
      icon: "🔧",
      factors: [
        { name: "Tech Debt", value: profile.tech_debt, max: 2 },
        { name: "Security", value: profile.security_risk, max: 2 },
      ],
    },
  ].map((d) => ({
    ...d,
    label: d.score >= 60 ? "High" : d.score >= 30 ? "Moderate" : "Low",
  }));
}

/* ── Risk summary sentence generator ───────────────────────────────────────── */

export function generateSummary(riskPct: number, profile: Profile): string {
  const recs = getRecommendations(profile);
  const criticalCount = recs.filter((r) => r.urgency === "critical").length;
  const topDrivers = recs
    .slice(0, 2)
    .map((r) => r.title.replace(/detected|needs.*|is .*|accumulated|ahead/gi, "").trim().toLowerCase())
    .join(" and ");

  if (riskPct >= 70) {
    return `Your startup faces critical risk (${riskPct}%) with ${criticalCount} critical factor${criticalCount !== 1 ? "s" : ""}. Immediate attention is required${topDrivers ? `, especially around ${topDrivers}` : ""}.`;
  }
  if (riskPct >= 40) {
    return `Your startup has elevated risk (${riskPct}%). While not critical, there are key areas that need improvement${topDrivers ? ` — primarily ${topDrivers}` : ""}.`;
  }
  return `Your startup is in a healthy position with a ${riskPct}% risk score. Continue monitoring and maintain your current trajectory.`;
}
