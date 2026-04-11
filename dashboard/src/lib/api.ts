const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

export interface Profile {
  years_of_operation: number;
  how_much_they_raised: number;
  giants: number;
  no_budget: number;
  competition: number;
  poor_market_fit: number;
  acquisition_stagnation: number;
  platform_dependency: number;
  monetization_failure: number;
  niche_limits: number;
  execution_flaws: number;
  trend_shifts: number;
  toxicity_trust_issues: number;
  regulatory_pressure: number;
  overhype: number;
  security_risk: number;
  tech_debt: number;
  week: number;
  sector: string;
}

export const DEFAULT_PROFILE: Profile = {
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
  week: 1,
  sector: "Technology",
};

async function post(url: string, body: object) {
  const res = await fetch(`${BASE}${url}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function get(url: string) {
  const res = await fetch(`${BASE}${url}`);
  return res.json();
}

export const predict           = (p: Profile) => post("/predict", p);
export const getImpact         = (p: Profile) => post("/impact", p);
export const getTopImprovements= (p: Profile) => post("/top_improvements", p);

export async function getTimeline(p: Profile, weeks = 12) {
  const res = await fetch(`${BASE}/timeline?weeks=${weeks}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  return res.json();
}

export async function simulate(p: Profile, feature: string, new_value: number) {
  const res = await fetch(`${BASE}/simulate?feature=${encodeURIComponent(feature)}&new_value=${new_value}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  return res.json();
}

/** Single call that returns everything needed for the professional report */
export async function getFullReport(p: Profile, weeks = 12) {
  const res = await fetch(`${BASE}/full_report?weeks=${weeks}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  return res.json();
}

// ── NEW: Company & Auth helpers ────────────────────────────────────────────────

export const getOrgTree = (companyId: string) =>
  get(`/company/org-tree?company_id=${companyId}`);

export const getDepartments = (companyId: string) =>
  get(`/company/departments?company_id=${companyId}`);

export const getMembers = (companyId: string) =>
  get(`/company/members?company_id=${companyId}`);

export const getDeptRisk = (companyId: string, dept: string) =>
  get(`/department/${companyId}/${dept}/risk`);

export const getDeptConfig = (dept: string) =>
  get(`/department/config/${dept}`);

// ── Board / Task helpers ──────────────────────────────────────────────────────
export const getBoardTasks = (companyId: string, dept: string) =>
  get(`/department/${companyId}/${dept}/board`);

export const createTask = (companyId: string, dept: string, task: any) =>
  post(`/department/${companyId}/${dept}/board/task`, task);

export async function updateTaskStatus(companyId: string, dept: string, taskId: string, status: string) {
  const res = await fetch(`${BASE}/department/${companyId}/${dept}/board/task/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return res.json();
}

export async function deleteTask(companyId: string, dept: string, taskId: string) {
  const res = await fetch(`${BASE}/department/${companyId}/${dept}/board/task/${taskId}`, {
    method: "DELETE",
  });
  return res.json();
}

// ── Invite helpers ────────────────────────────────────────────────────────────
export const inviteUser = (companyId: string, department: string, email: string, role: string = "team_leader") =>
  post("/company/invite", { company_id: companyId, department, email, role });

export const inviteEmployee = (companyId: string, department: string, email: string) =>
  inviteUser(companyId, department, email, "employee");

// ── Software Dev Metrics ──────────────────────────────────────────────────────
export const getSoftwareDevMetrics = (companyId: string) =>
  get(`/department/${companyId}/software/devmetrics`);

// ── Add Department ────────────────────────────────────────────────────────────
export async function addDepartment(companyId: string, department: string) {
  const res = await fetch(`${BASE}/company/add-department?company_id=${companyId}&department=${encodeURIComponent(department)}`, {
    method: "POST",
  });
  return res.json();
}
