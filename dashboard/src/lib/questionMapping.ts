/**
 * questionMapping.ts
 * Maps plain-English questionnaire answers to model feature float values.
 * Each step covers a risk domain; each question maps to exactly one Profile feature.
 */

import { Profile } from "./api";

/* ── Types ──────────────────────────────────────────────────────────────────── */

export interface QuestionOption {
  label: string;
  value: number;
}

export interface Question {
  id: string;
  text: string;
  helpText?: string;
  featureKey: keyof Profile;
  options: QuestionOption[];
}

export interface Step {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  questions: Question[];
}

/* ── Sectors ────────────────────────────────────────────────────────────────── */

export const SECTORS = [
  "Technology",
  "Healthcare",
  "Finance and Insurance",
  "Retail and Consumer",
  "Education",
  "Energy",
  "Manufacturing",
  "Media and Entertainment",
  "Real Estate",
  "Transportation",
  "Other",
];

/* ── Steps & Questions ──────────────────────────────────────────────────────── */

export const STEPS: Step[] = [
  {
    id: 0,
    title: "Company Basics",
    subtitle: "Tell us about your company",
    icon: "🏢",
    questions: [
      {
        id: "years",
        text: "How long has your company been operating?",
        featureKey: "years_of_operation",
        options: [
          { label: "Less than 1 year", value: 0.5 },
          { label: "1–2 years", value: 1.5 },
          { label: "3–5 years", value: 4 },
          { label: "5–10 years", value: 7.5 },
          { label: "10+ years", value: 15 },
        ],
      },
      {
        id: "funding",
        text: "How much total funding have you raised?",
        featureKey: "how_much_they_raised",
        options: [
          { label: "Bootstrapped ($0)", value: 0 },
          { label: "Under $1M", value: 0.5 },
          { label: "$1M – $5M", value: 3 },
          { label: "$5M – $25M", value: 15 },
          { label: "$25M – $100M", value: 62.5 },
          { label: "$100M+", value: 300 },
        ],
      },
    ],
  },
  {
    id: 1,
    title: "Market & Competition",
    subtitle: "Understanding your competitive landscape",
    icon: "📊",
    questions: [
      {
        id: "competition",
        text: "How intense is competition in your market?",
        helpText: "Consider both direct and indirect competitors.",
        featureKey: "competition",
        options: [
          { label: "Blue ocean — no real competitors", value: 0 },
          { label: "A few competitors", value: 0.5 },
          { label: "Competitive market", value: 1.0 },
          { label: "Very crowded", value: 1.5 },
          { label: "Bloodbath — dozens of well-funded rivals", value: 2.0 },
        ],
      },
      {
        id: "giants",
        text: "Are there dominant incumbents (Google, Amazon, etc.) in your space?",
        featureKey: "giants",
        options: [
          { label: "No big players nearby", value: 0 },
          { label: "They're tangentially related", value: 0.5 },
          { label: "They offer similar products", value: 1.2 },
          { label: "They've launched a direct competitor", value: 2.0 },
        ],
      },
      {
        id: "market_fit",
        text: "How well does your product fit what your market wants?",
        featureKey: "poor_market_fit",
        options: [
          { label: "Perfect product-market fit", value: 0 },
          { label: "Good fit, some gaps", value: 0.3 },
          { label: "Uncertain — still searching", value: 0.8 },
          { label: "Significant mismatch", value: 1.4 },
          { label: "No validation yet", value: 2.0 },
        ],
      },
      {
        id: "trends",
        text: "Is your market growing, stable, or shifting?",
        featureKey: "trend_shifts",
        options: [
          { label: "Rapidly growing", value: 0 },
          { label: "Stable and predictable", value: 0.3 },
          { label: "Shifting — trends are changing", value: 1.0 },
          { label: "Declining or being disrupted", value: 2.0 },
        ],
      },
      {
        id: "niche",
        text: "How large is your addressable market?",
        featureKey: "niche_limits",
        options: [
          { label: "Massive — billions in TAM", value: 0 },
          { label: "Large market", value: 0.3 },
          { label: "Medium-sized opportunity", value: 0.7 },
          { label: "Small niche", value: 1.3 },
          { label: "Very narrow niche", value: 2.0 },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Product & Execution",
    subtitle: "How well your team is delivering",
    icon: "⚡",
    questions: [
      {
        id: "platform",
        text: "How dependent are you on a single platform?",
        helpText: "e.g., App Store, AWS, Shopify, Google Ads",
        featureKey: "platform_dependency",
        options: [
          { label: "Not dependent at all", value: 0 },
          { label: "Somewhat — we use it but have alternatives", value: 0.5 },
          { label: "Heavily — most revenue comes through it", value: 1.3 },
          { label: "Completely — we'd die without it", value: 2.0 },
        ],
      },
      {
        id: "execution",
        text: "How would you rate your team's ability to execute and ship?",
        featureKey: "execution_flaws",
        options: [
          { label: "Excellent — we ship fast and well", value: 0 },
          { label: "Good — mostly on track", value: 0.3 },
          { label: "Average — some missed deadlines", value: 0.8 },
          { label: "Struggling — frequent delays", value: 1.4 },
          { label: "Failing — can't ship reliably", value: 2.0 },
        ],
      },
      {
        id: "monetization",
        text: "Is your product generating meaningful revenue?",
        featureKey: "monetization_failure",
        options: [
          { label: "Profitable or near-profitable", value: 0 },
          { label: "Revenue growing steadily", value: 0.3 },
          { label: "Some revenue but not enough", value: 0.7 },
          { label: "Pre-revenue — still building", value: 1.3 },
          { label: "Failed attempts to monetize", value: 2.0 },
        ],
      },
      {
        id: "overhype",
        text: "Has your company experienced media overhype or inflated expectations?",
        featureKey: "overhype",
        options: [
          { label: "No — we're under the radar", value: 0 },
          { label: "A little buzz, manageable", value: 0.4 },
          { label: "Moderate — expectations are high", value: 1.0 },
          { label: "Significant — we've overpromised", value: 2.0 },
        ],
      },
      {
        id: "acquisition",
        text: "How is customer acquisition trending?",
        featureKey: "acquisition_stagnation",
        options: [
          { label: "Accelerating — hockey-stick growth", value: 0 },
          { label: "Steady growth", value: 0.3 },
          { label: "Slowing down", value: 0.8 },
          { label: "Stagnating", value: 1.4 },
          { label: "Declining — losing customers", value: 2.0 },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Financial Health",
    subtitle: "Your financial position and risks",
    icon: "💰",
    questions: [
      {
        id: "runway",
        text: "How long is your current cash runway?",
        featureKey: "no_budget",
        options: [
          { label: "18+ months", value: 0 },
          { label: "12–18 months", value: 0.3 },
          { label: "6–12 months", value: 0.8 },
          { label: "3–6 months", value: 1.4 },
          { label: "Less than 3 months", value: 2.0 },
        ],
      },
      {
        id: "regulatory",
        text: "How much regulatory or compliance pressure do you face?",
        featureKey: "regulatory_pressure",
        options: [
          { label: "None — unregulated space", value: 0 },
          { label: "Minor compliance needs", value: 0.3 },
          { label: "Moderate — ongoing requirements", value: 0.8 },
          { label: "Heavy — significant compliance cost", value: 1.4 },
          { label: "Blocking — regulations threaten the business", value: 2.0 },
        ],
      },
      {
        id: "trust",
        text: "Any trust issues, PR crises, or toxic-culture problems?",
        featureKey: "toxicity_trust_issues",
        options: [
          { label: "None — clean reputation", value: 0 },
          { label: "Minor internal concerns", value: 0.5 },
          { label: "Moderate issues — some damage", value: 1.2 },
          { label: "Severe — significant trust deficit", value: 2.0 },
        ],
      },
    ],
  },
  {
    id: 4,
    title: "Technical Risk",
    subtitle: "Your technology and security posture",
    icon: "🔧",
    questions: [
      {
        id: "tech_debt",
        text: "How much technical debt has accumulated in your codebase?",
        helpText: "Legacy code, shortcuts, outdated dependencies, missing tests.",
        featureKey: "tech_debt",
        options: [
          { label: "Minimal — clean, well-maintained codebase", value: 0 },
          { label: "Some — manageable", value: 0.3 },
          { label: "Moderate — slowing us down", value: 0.8 },
          { label: "Heavy — major refactoring needed", value: 1.4 },
          { label: "Crippling — can barely add features", value: 2.0 },
        ],
      },
      {
        id: "security",
        text: "How concerned are you about security vulnerabilities?",
        featureKey: "security_risk",
        options: [
          { label: "Not at all — robust security practices", value: 0 },
          { label: "Slightly — basic security in place", value: 0.3 },
          { label: "Moderately — some known gaps", value: 0.8 },
          { label: "Very — significant vulnerabilities exist", value: 1.4 },
          { label: "Critical — active threats or past breaches", value: 2.0 },
        ],
      },
    ],
  },
];

/* ── Mapping function ───────────────────────────────────────────────────────── */

/**
 * Converts questionnaire selections into a complete Profile for the API.
 * @param selections  Map of question id → selected option index
 * @param companyName User-entered company name (for display only)
 * @param sector      Selected sector string
 */
export function mapAnswersToProfile(
  selections: Record<string, number>,
  sector: string,
): Profile {
  // Start from defaults
  const profile: Profile = {
    years_of_operation: 5,
    how_much_they_raised: 12,
    giants: 0.5,
    no_budget: 0.3,
    competition: 0.8,
    poor_market_fit: 0.2,
    acquisition_stagnation: 0.2,
    platform_dependency: 0.2,
    monetization_failure: 0.2,
    niche_limits: 0.2,
    execution_flaws: 0.2,
    trend_shifts: 0.1,
    toxicity_trust_issues: 0.0,
    regulatory_pressure: 0.1,
    overhype: 0.1,
    security_risk: 0.2,
    tech_debt: 0.2,
    change_failure_rate: 0.1,
    deployment_frequency: 0.5,
    lead_time_days: 14.0,
    mttr_hours: 24.0,
    week: 1,
    sector,
  };

  for (const step of STEPS) {
    for (const q of step.questions) {
      const selectedIndex = selections[q.id];
      if (selectedIndex !== undefined && selectedIndex >= 0 && selectedIndex < q.options.length) {
        (profile as any)[q.featureKey] = q.options[selectedIndex].value;
      }
    }
  }

  return profile;
}
