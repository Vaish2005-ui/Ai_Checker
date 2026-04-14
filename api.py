"""
api.py — FastAPI backend (v3 — Jira-like department system)
Run: uvicorn api:app --reload --port 8000

AWS Services: DynamoDB, S3 (models), CloudWatch (logging), Secrets Manager (creds)
"""

import logging
import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import sys, os, json, hashlib, uuid
from uuid import uuid4
from typing import List, Optional, Dict, Any

# ── Initialize Logging ────────────────────────────────────────────────────────
from logging_config import setup_logging
setup_logging()
logger = logging.getLogger("api")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))
from simulation import SimulationEngine
from preprocess import FEATURE_META, DEFAULT_PROFILE

app = FastAPI(title="Startup Risk API v3 — Jira-like Departments")

# ── DynamoDB Database ──────────────────────────────────────────────────────────
from database import get_company, save_company, get_all_companies, get_invite, save_invite, get_company_by_email

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def verify_pw(plain: str, hashed: str) -> bool:
    # Support both hashed and legacy plaintext passwords
    return hash_pw(plain) == hashed or plain == hashed

# ── Department Config ──────────────────────────────────────────────────────────
DEPT_METRICS = {
    "finance": {
        "label": "Finance & Accounting",
        "metrics": ["No Budget", "How Much They Raised", "Monetization Failure", "Acquisition Stagnation"],
        "color": "#14b8a6",
        "icon": "💰",
    },
    "hr": {
        "label": "Human Resources",
        "metrics": ["Toxicity/Trust Issues", "Execution Flaws", "Trend Shifts"],
        "color": "#a855f7",
        "icon": "👥",
    },
    "software": {
        "label": "Software Engineering",
        "metrics": ["Tech Debt", "Security Risk", "change_failure_rate", "deployment_frequency", "lead_time_days", "mttr_hours"],
        "color": "#f59e0b",
        "icon": "💻",
    },
    "engineering": {
        "label": "Engineering",
        "metrics": ["Tech Debt", "Security Risk", "Platform Dependency", "Execution Flaws"],
        "color": "#f59e0b",
        "icon": "⚙️",
    },
    "marketing": {
        "label": "Marketing",
        "metrics": ["Overhype", "Trend Shifts", "Niche Limits", "Competition"],
        "color": "#ec4899",
        "icon": "📣",
    },
    "security": {
        "label": "Security & Compliance",
        "metrics": ["Security Risk", "Regulatory Pressure", "Platform Dependency"],
        "color": "#3b82f6",
        "icon": "🔒",
    },
    "operations": {
        "label": "Operations",
        "metrics": ["Giants", "Poor Market Fit", "Acquisition Stagnation", "Competition"],
        "color": "#f43f5e",
        "icon": "🔧",
    },
}

DEFAULT_GLOBAL_METRICS = {
    "Years of Operation": 5.0,
    "How Much They Raised": 12.0,
    "Giants": 0.5,
    "No Budget": 0.3,
    "Competition": 0.8,
    "Poor Market Fit": 0.2,
    "Acquisition Stagnation": 0.2,
    "Platform Dependency": 0.2,
    "Monetization Failure": 0.2,
    "Niche Limits": 0.2,
    "Execution Flaws": 0.2,
    "Trend Shifts": 0.1,
    "Toxicity/Trust Issues": 0.0,
    "Regulatory Pressure": 0.1,
    "Overhype": 0.1,
    "Security Risk": 0.2,
    "Tech Debt": 0.2,
    "change_failure_rate": 0.1,
    "deployment_frequency": 0.5,
    "lead_time_days": 14.0,
    "mttr_hours": 24.0,
}

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request Logging Middleware ────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    latency_ms = round((time.time() - start) * 1000, 1)
    logger.info(
        "%s %s → %s (%.1fms)",
        request.method, request.url.path, response.status_code, latency_ms,
        extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "latency_ms": latency_ms,
            "event": "request",
        },
    )
    return response

engine = SimulationEngine()
logger.info("🚀 API ready — SimulationEngine loaded")

# ── Pydantic Models ───────────────────────────────────────────────────────────
class StartupProfile(BaseModel):
    years_of_operation: float = 5.0
    how_much_they_raised: float = 12.0
    giants: float = 0.5
    no_budget: float = 0.3
    competition: float = 0.8
    poor_market_fit: float = 0.2
    acquisition_stagnation: float = 0.2
    platform_dependency: float = 0.2
    monetization_failure: float = 0.2
    niche_limits: float = 0.2
    execution_flaws: float = 0.2
    trend_shifts: float = 0.1
    toxicity_trust_issues: float = 0.0
    regulatory_pressure: float = 0.1
    overhype: float = 0.1
    security_risk: float = 0.2
    tech_debt: float = 0.2
    change_failure_rate: float = 0.1
    deployment_frequency: float = 0.5
    lead_time_days: float = 14.0
    mttr_hours: float = 24.0
    week: int = 1
    sector: str = "Technology"

class CompanyCreate(BaseModel):
    name: str
    industry: str
    size: str
    admin_name: str
    admin_email: str
    password: str
    departments: List[str] = []

class CompanyUpdateInfo(BaseModel):
    name: str = ""
    industry: str = ""
    size: str = ""

class Invite(BaseModel):
    company_id: str
    department: str
    email: str
    role: str = "team_leader"

class JoinRequest(BaseModel):
    invite_token: str
    name: str
    password: str

class DepartmentUpdate(BaseModel):
    company_id: str
    department: str
    metrics: Dict[str, float]

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    company: str = ""

class TaskCreate(BaseModel):
    title: str
    description: str = ""
    status: str = "todo"
    priority: str = "medium"
    assignee_email: str = ""
    task_type: str = "task"
    labels: List[str] = []

class TaskUpdate(BaseModel):
    status: str = ""
    title: str = ""
    description: str = ""
    priority: str = ""
    assignee_email: str = ""

class TaskMove(BaseModel):
    status: str

# ── Helper ────────────────────────────────────────────────────────────────────
def to_dict(p: StartupProfile) -> dict:
    return {
        "Years of Operation":     p.years_of_operation,
        "How Much They Raised":   p.how_much_they_raised,
        "Giants":                 p.giants,
        "No Budget":              p.no_budget,
        "Competition":            p.competition,
        "Poor Market Fit":        p.poor_market_fit,
        "Acquisition Stagnation": p.acquisition_stagnation,
        "Platform Dependency":    p.platform_dependency,
        "Monetization Failure":   p.monetization_failure,
        "Niche Limits":           p.niche_limits,
        "Execution Flaws":        p.execution_flaws,
        "Trend Shifts":           p.trend_shifts,
        "Toxicity/Trust Issues":  p.toxicity_trust_issues,
        "Regulatory Pressure":    p.regulatory_pressure,
        "Overhype":               p.overhype,
        "Security Risk":          p.security_risk,
        "Tech Debt":              p.tech_debt,
        "change_failure_rate":    p.change_failure_rate,
        "deployment_frequency":   p.deployment_frequency,
        "lead_time_days":         p.lead_time_days,
        "mttr_hours":             p.mttr_hours,
        "week":                   p.week,
        "Sector":                 p.sector,
    }

def find_member_by_token(token: str):
    if not token or ":" not in token: return None, None
    cid, email = token.split(":", 1)
    comp = get_company(cid)
    if not comp: return None, None
    for m in comp.get("members", []):
        if m["email"] == email: return cid, m
    return None, None

# ══════════════════════════════════════════════════════════════════════════════
# CORE ML ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/health")
def health():
    return {
        "status": "ok", "version": "v3",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "dynamodb": "connected",
            "s3": "enabled" if os.getenv("USE_S3_MODELS", "true").lower() == "true" else "disabled",
            "cloudwatch": "enabled" if os.getenv("CLOUDWATCH_ENABLED", "false").lower() == "true" else "disabled",
            "environment": os.getenv("ENVIRONMENT", "development"),
        },
    }

@app.get("/")
def root():
    return {"status": "ok", "version": "v3", "features": 17}

@app.post("/predict")
def predict(p: StartupProfile):
    risk = engine.predict_risk(to_dict(p))
    logger.info(
        "Prediction: %.1f%% risk", risk * 100,
        extra={"event": "prediction", "risk_score": round(risk * 100, 1)},
    )
    return {
        "risk": risk,
        "risk_pct": round(risk * 100, 1),
        "label": "High Risk" if risk >= 0.7 else "Medium Risk" if risk >= 0.4 else "Low Risk",
        "color": "red" if risk >= 0.7 else "amber" if risk >= 0.4 else "green",
    }

@app.post("/simulate")
def simulate(p: StartupProfile, feature: str, new_value: float):
    return engine.simulate_change(to_dict(p), feature, new_value)

@app.post("/impact")
def impact(p: StartupProfile):
    df = engine.simulate_all(to_dict(p), pct=0.20)
    return {
        "improvements": df[df["risk_delta"] < 0].head(8).to_dict("records"),
        "risks": df[df["risk_delta"] > 0].tail(6).to_dict("records"),
    }

@app.post("/timeline")
def timeline(p: StartupProfile, weeks: int = 12):
    return engine.risk_over_weeks(to_dict(p), weeks=weeks).to_dict("records")

@app.post("/top_improvements")
def top_improvements(p: StartupProfile):
    return engine.top_improvements(to_dict(p), n=5)

@app.get("/features")
def features():
    return FEATURE_META

@app.post("/full_report")
def full_report(p: StartupProfile, weeks: int = 12):
    risk = engine.predict_risk(to_dict(p))
    impact_df = engine.simulate_all(to_dict(p), pct=0.20)
    tl = engine.risk_over_weeks(to_dict(p), weeks=weeks).to_dict("records")
    return {
        "risk": risk,
        "risk_pct": round(risk * 100, 1),
        "label": "High Risk" if risk >= 0.7 else "Medium Risk" if risk >= 0.4 else "Low Risk",
        "color": "red" if risk >= 0.7 else "amber" if risk >= 0.4 else "green",
        "impact": {
            "improvements": impact_df[impact_df["risk_delta"] < 0].head(8).to_dict("records"),
            "risks": impact_df[impact_df["risk_delta"] > 0].tail(6).to_dict("records"),
        },
        "timeline": tl,
        "top_improvements": engine.top_improvements(to_dict(p), n=5),
    }

# ══════════════════════════════════════════════════════════════════════════════
# AUTH ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/auth/register")
def register(req: RegisterRequest):
    email = req.email.lower().strip()
    # Check if email already exists (uses GSI if available)
    existing_comp, existing_member = get_company_by_email(email)
    if existing_member:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    solo_cid = "solo"
    comp = get_company(solo_cid)
    if not comp:
        comp = {
            "company_id": solo_cid,
            "name": "Individual",
            "industry": "",
            "size": "",
            "admin_email": "",
            "departments": [],
            "members": [],
            "department_metrics": {},
            "board": {},
            "global_metrics": dict(DEFAULT_GLOBAL_METRICS),
        }
    comp["members"].append({
        "email": email,
        "name": req.name,
        "password": hash_pw(req.password),
        "role": "admin",
        "department": "all",
    })
    save_company(comp)
    logger.info("New registration: %s", email,
                extra={"event": "register", "user_email": email})
    return {"status": "success", "token": f"{solo_cid}:{email}", "role": "admin", "company_id": solo_cid, "name": req.name}

@app.post("/auth/login")
def login(req: LoginRequest):
    email = req.email.lower().strip()
    # Use GSI lookup (fast) with scan fallback
    comp, member = get_company_by_email(email)
    if comp and member and verify_pw(req.password, member["password"]):
        logger.info("Login success: %s", email,
                    extra={"event": "login_success", "user_email": email, "company_id": comp.get("company_id")})
        return {
            "status": "success",
            "token": f"{comp.get('company_id')}:{email}",
            "role": member["role"],
            "department": member["department"],
            "company_id": comp.get("company_id"),
            "name": member["name"],
        }
    logger.warning("Login failed: %s", email,
                   extra={"event": "login_failed", "user_email": email})
    raise HTTPException(status_code=401, detail="Invalid email or password")

@app.get("/auth/me")
def get_me(token: str):
    company_id, member = find_member_by_token(token)
    if not member: raise HTTPException(status_code=401, detail="Invalid or expired token")
    comp = get_company(company_id) or {}
    return {
        "email": member["email"],
        "name": member["name"],
        "role": member["role"],
        "department": member["department"],
        "company_id": company_id,
        "company_name": comp.get("name", ""),
    }

@app.get("/auth/invite-info/{token}")
def get_invite_info(token: str):
    invite = get_invite(token)
    if not invite or invite.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Invalid or expired invite link")
    comp = get_company(invite["company_id"])
    if not comp:
        raise HTTPException(status_code=400, detail="Company no longer exists")
    return {
        "email": invite["email"],
        "department": invite["department"],
        "company_name": comp["name"],
        "company_id": invite["company_id"],
        "role": invite.get("role", "team_leader"),
    }

@app.post("/auth/join")
def join_company(req: JoinRequest):
    invite = get_invite(req.invite_token)
    if not invite or invite.get("status") != "pending": raise HTTPException(status_code=400, detail="Invalid or already used invite token")
    company_id = invite["company_id"]
    comp = get_company(company_id)
    if not comp: raise HTTPException(status_code=404, detail="Company not found")
    for m in comp["members"]:
        if m["email"] == invite["email"]: raise HTTPException(status_code=400, detail="Already a member")
    member = {
        "email": invite["email"], "name": req.name,
        "password": hash_pw(req.password), "role": invite.get("role", "team_leader"),
        "department": invite["department"]
    }
    comp["members"].append(member)
    save_company(comp)
    invite["status"] = "accepted"
    save_invite(invite)
    return {
        "status": "success",
        "token": f"{company_id}:{invite['email']}",
        "role": member["role"],
        "department": member["department"],
        "company_id": company_id,
    }

# ══════════════════════════════════════════════════════════════════════════════
# COMPANY ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/company/create")
def create_company(req: CompanyCreate):
    email = req.admin_email.lower().strip()
    for cdata in get_all_companies():
        for m in cdata.get("members", []):
            if m["email"] == email: raise HTTPException(status_code=400, detail="Email already registered")
    company_id = str(uuid4())[:12].upper()
    depts = list(dict.fromkeys([d.lower() for d in req.departments])) if req.departments else ["hr", "finance", "software"]
    comp = {
        "company_id": company_id,
        "name": req.name, "industry": req.industry, "size": req.size,
        "admin_email": email, "departments": depts,
        "members": [{"email": email, "name": req.admin_name, "password": hash_pw(req.password), "role": "admin", "department": "all"}],
        "department_metrics": {d: {} for d in depts},
        "board": {d: [] for d in depts},
        "global_metrics": dict(DEFAULT_GLOBAL_METRICS),
        "created_at": datetime.now().isoformat()
    }
    save_company(comp)
    return {
        "status": "success",
        "company_id": company_id,
        "token": f"{company_id}:{email}",
        "role": "admin",
    }

@app.post("/company/invite")
def invite_user(req: Invite):
    comp = get_company(req.company_id)
    if not comp: raise HTTPException(status_code=404, detail="Company not found")
    if req.role not in ["team_leader", "employee"]: raise HTTPException(status_code=400, detail="Role must be team_leader or employee")
    token = str(uuid4())
    save_invite({
        "token": token,
        "company_id": req.company_id, "department": req.department,
        "email": req.email.lower().strip(), "role": req.role,
        "status": "pending", "created_at": datetime.now().isoformat()
    })
    return {"status": "success", "invite_token": token,
            "invite_url": f"http://localhost:3000/join?invite={token}"}

@app.get("/company/info")
def get_company_info(company_id: str):
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    return {
        "name": comp.get("name", ""),
        "industry": comp.get("industry", ""),
        "size": comp.get("size", ""),
        "created_at": comp.get("created_at", ""),
    }

@app.post("/company/update-info")
def update_company_info(company_id: str, req: CompanyUpdateInfo):
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    if req.name:    comp["name"] = req.name
    if req.industry: comp["industry"] = req.industry
    if req.size:    comp["size"] = req.size
    save_company(comp)
    return {"status": "success"}

@app.get("/company/members")
def get_members(company_id: str):
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    return [
        {k: v for k, v in m.items() if k != "password"}
        for m in comp.get("members", [])
    ]

@app.delete("/company/members/{email}")
def remove_member(company_id: str, email: str):
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    before = len(comp["members"])
    comp["members"] = [m for m in comp["members"] if m["email"] != email]
    if len(comp["members"]) == before:
        raise HTTPException(status_code=404, detail="Member not found")
    save_company(comp)
    return {"status": "success"}

@app.get("/company/departments")
def get_departments(company_id: str):
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    seen = set()
    res = []
    for d in comp.get("departments", []):
        dk = d.lower()
        if dk in seen:
            continue
        seen.add(dk)
        info = DEPT_METRICS.get(dk, {"label": d, "metrics": [], "color": "#6366f1", "icon": "📁"})
        member_count = len([
            m for m in comp.get("members", [])
            if m["department"].lower() == dk or m["department"] == "all"
        ])
        res.append({
            "name": dk,
            "label": info["label"],
            "color": info["color"],
            "icon": info.get("icon", "📁"),
            "metrics": comp.get("department_metrics", {}).get(dk, {}),
            "relevant_fields": info["metrics"],
            "member_count": member_count,
        })
    return res

@app.post("/company/add-department")
def add_department(company_id: str, department: str):
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    dk = department.lower()
    if dk not in [d.lower() for d in comp["departments"]]:
        comp["departments"].append(dk)
        comp.setdefault("department_metrics", {})[dk] = {}
        comp.setdefault("board", {})[dk] = []
        save_company(comp)
    return {"status": "success", "departments": comp["departments"]}

@app.post("/company/remove-department")
def remove_department(company_id: str, department: str):
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    dk = department.lower()
    comp["departments"] = [d for d in comp["departments"] if d.lower() != dk]
    save_company(comp)
    return {"status": "success", "departments": comp["departments"]}

@app.get("/company/profile")
def get_company_profile(company_id: str):
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    return comp.get("global_metrics", dict(DEFAULT_GLOBAL_METRICS))

@app.post("/company/profile")
def update_company_profile(company_id: str, metrics: Dict[str, float]):
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    comp.setdefault("global_metrics", {}).update(metrics)
    save_company(comp)
    return {"status": "success"}

@app.get("/company/risk-summary")
def company_risk_summary(company_id: str):
    """Returns risk scores for ALL departments in one call — for admin overview."""
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    global_m = comp.get("global_metrics", dict(DEFAULT_GLOBAL_METRICS))
    base = to_dict(StartupProfile())
    base.update(global_m)
    overall_risk = engine.predict_risk(base)
    dept_risks = []
    seen = set()
    for d in comp.get("departments", []):
        dk = d.lower()
        if dk in seen:
            continue
        seen.add(dk)
        dept_m = comp.get("department_metrics", {}).get(dk, {})
        merged = {**base, **dept_m}
        risk = engine.predict_risk(merged)
        info = DEPT_METRICS.get(dk, {"label": d, "color": "#6366f1"})
        dept_risks.append({
            "department": dk,
            "label": info["label"],
            "color": info["color"],
            "risk": risk,
            "risk_pct": round(risk * 100, 1),
            "status": "Critical" if risk >= 0.7 else "Warning" if risk >= 0.4 else "Healthy",
        })
    dept_risks.sort(key=lambda x: x["risk"], reverse=True)
    return {
        "overall_risk": overall_risk,
        "overall_risk_pct": round(overall_risk * 100, 1),
        "overall_label": "High Risk" if overall_risk >= 0.7 else "Medium Risk" if overall_risk >= 0.4 else "Low Risk",
        "departments": dept_risks,
        "total_members": len(comp.get("members", [])),
        "total_departments": len(seen),
    }

@app.get("/company/org-tree")
def get_org_tree(company_id: str):
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    admin = None
    dept_tree: Dict[str, Any] = {}
    for m in comp.get("members", []):
        if m["role"] == "admin":
            admin = {"name": m["name"], "email": m["email"], "role": "admin"}
        else:
            dk = m["department"].lower()
            if dk not in dept_tree:
                dept_tree[dk] = {"leaders": [], "employees": []}
            if m["role"] == "team_leader":
                dept_tree[dk]["leaders"].append({"name": m["name"], "email": m["email"]})
            else:
                dept_tree[dk]["employees"].append({"name": m["name"], "email": m["email"]})
    tree_depts = []
    seen = set()
    for d in comp.get("departments", []):
        dk = d.lower()
        if dk in seen:
            continue
        seen.add(dk)
        info = DEPT_METRICS.get(dk, {"label": d, "color": "#6366f1"})
        md = dept_tree.get(dk, {"leaders": [], "employees": []})
        tree_depts.append({
            "name": d, "key": dk,
            "label": info.get("label", d),
            "color": info.get("color", "#6366f1"),
            "leaders": md["leaders"],
            "employees": md["employees"],
            "total": len(md["leaders"]) + len(md["employees"]),
        })
    return {"company": comp["name"], "admin": admin, "departments": tree_depts}

# ══════════════════════════════════════════════════════════════════════════════
# DEPARTMENT ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/department/config/{dept}")
def get_dept_config(dept: str):
    dk = dept.lower()
    return DEPT_METRICS.get(dk, {"label": dept, "metrics": list(FEATURE_META.keys()), "color": "#6366f1"})

@app.post("/department/update-metrics")
def update_metrics(req: DepartmentUpdate):
    comp = get_company(req.company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    dk = req.department.lower()
    comp.setdefault("department_metrics", {})[dk] = {
        **comp.get("department_metrics", {}).get(dk, {}),
        **req.metrics,
    }
    if dk not in [d.lower() for d in comp.get("departments", [])]:
        comp.setdefault("departments", []).append(dk)
    save_company(comp)
    logger.info("Metrics updated: %s/%s", req.company_id, dk,
                extra={"event": "metrics_updated", "company_id": req.company_id})
    return {"status": "success"}

@app.get("/department/{company_id}/{dept}/risk")
def get_department_risk(company_id: str, dept: str):
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    dk = dept.lower()
    global_m = comp.get("global_metrics", {})
    dept_m = comp.get("department_metrics", {}).get(dk, {})
    base = to_dict(StartupProfile())
    base.update(global_m)
    base.update(dept_m)
    risk = engine.predict_risk(base)
    relevant = DEPT_METRICS.get(dk, {}).get("metrics", [])
    return {
        "department": dept,
        "risk": risk,
        "risk_pct": round(risk * 100, 1),
        "label": "Critical" if risk >= 0.7 else "Warning" if risk >= 0.4 else "Healthy",
        "color": "red" if risk >= 0.7 else "amber" if risk >= 0.4 else "green",
        "metrics": {k: dept_m.get(k, global_m.get(k, base.get(k, 0))) for k in relevant},
        "all_metrics": dept_m,
        "relevant_fields": relevant,
    }

@app.get("/department/{company_id}/{dept}/members")
def get_dept_members(company_id: str, dept: str):
    """Members of a specific department only."""
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    dk = dept.lower()
    members = [
        {k: v for k, v in m.items() if k != "password"}
        for m in comp.get("members", [])
        if m["department"].lower() == dk or (m["role"] == "admin" and m["department"] == "all")
    ]
    return members

@app.get("/department/{company_id}/{dept}/timeline")
def dept_timeline(company_id: str, dept: str, weeks: int = 12):
    """Department-specific risk over time."""
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    dk = dept.lower()
    global_m = comp.get("global_metrics", {})
    dept_m = comp.get("department_metrics", {}).get(dk, {})
    base = to_dict(StartupProfile())
    base.update(global_m)
    base.update(dept_m)
    # Build a StartupProfile-like object for risk_over_weeks
    from preprocess import prepare_single
    rows = []
    for w in range(1, weeks + 1):
        profile = dict(base)
        profile["week"] = w
        risk = engine.predict_risk(profile)
        rows.append({"week": w, "risk": risk, "risk_pct": round(risk * 100, 1)})
    return rows

# ══════════════════════════════════════════════════════════════════════════════
# BOARD / TASK ENDPOINTS (Jira-like)
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/department/{company_id}/{dept}/board")
def get_board(company_id: str, dept: str):
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    tasks = comp.get("board", {}).get(dept.lower(), [])
    # Group by status for Kanban view
    grouped = {"todo": [], "in_progress": [], "review": [], "done": []}
    for t in tasks:
        s = t.get("status", "todo")
        grouped.setdefault(s, []).append(t)
    return {"department": dept, "tasks": tasks, "columns": grouped}

@app.post("/department/{company_id}/{dept}/board/task")
def create_task(company_id: str, dept: str, task: TaskCreate):
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    dk = dept.lower()
    comp.setdefault("board", {}).setdefault(dk, [])
    new_task = {
        "id": str(uuid4())[:8],
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "assignee_email": task.assignee_email,
        "task_type": task.task_type,
        "labels": task.labels,
        "created_at": datetime.now().isoformat(),
        "department": dept,
    }
    comp["board"][dk].append(new_task)
    comp = comp
    save_company(comp)
    return {"status": "success", "task": new_task}

@app.put("/department/{company_id}/{dept}/board/task/{task_id}")
def update_task(company_id: str, dept: str, task_id: str, updates: TaskUpdate):
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    board = comp.get("board", {}).get(dept.lower(), [])
    for t in board:
        if t["id"] == task_id:
            if updates.status:          t["status"] = updates.status
            if updates.title:           t["title"] = updates.title
            if updates.description:     t["description"] = updates.description
            if updates.priority:        t["priority"] = updates.priority
            if updates.assignee_email:  t["assignee_email"] = updates.assignee_email
            t["updated_at"] = datetime.now().isoformat()
            comp = comp
            save_company(comp)
            return {"status": "success", "task": t}
    raise HTTPException(status_code=404, detail="Task not found")

@app.post("/department/{company_id}/{dept}/board/task/{task_id}/move")
def move_task(company_id: str, dept: str, task_id: str, body: TaskMove):
    """Move a task to a different status column (drag and drop)."""
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    board = comp.get("board", {}).get(dept.lower(), [])
    for t in board:
        if t["id"] == task_id:
            t["status"] = body.status
            t["updated_at"] = datetime.now().isoformat()
            comp = comp
            save_company(comp)
            return {"status": "success", "task": t}
    raise HTTPException(status_code=404, detail="Task not found")

@app.delete("/department/{company_id}/{dept}/board/task/{task_id}")
def delete_task(company_id: str, dept: str, task_id: str):
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    dk = dept.lower()
    before = len(comp.get("board", {}).get(dk, []))
    comp.setdefault("board", {})[dk] = [
        t for t in comp.get("board", {}).get(dk, []) if t["id"] != task_id
    ]
    comp = comp
    save_company(comp)
    return {"status": "success", "deleted": len(comp["board"][dk]) < before}

# ══════════════════════════════════════════════════════════════════════════════
# SOFTWARE DEPT — DORA / DEV METRICS
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/department/{company_id}/software/devmetrics")
def software_dev_metrics(company_id: str):
    comp = get_company(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    global_m = comp.get("global_metrics", {})
    dept_m = comp.get("department_metrics", {}).get("software", {})
    merged = {**global_m, **dept_m}
    dep_freq    = float(merged.get("deployment_frequency", 0.5))
    lead_time   = float(merged.get("lead_time_days", 14.0))
    mttr        = float(merged.get("mttr_hours", 24.0))
    change_fail = float(merged.get("change_failure_rate", 0.1))
    tech_debt   = float(merged.get("Tech Debt", 0.2))
    sec_risk    = float(merged.get("Security Risk", 0.2))
    code_health = max(0, min(100, 100 - tech_debt * 25 - sec_risk * 20 - change_fail * 30))
    base = to_dict(StartupProfile())
    base.update(merged)
    risk = engine.predict_risk(base)
    return {
        "dora": {
            "deployment_frequency": round(dep_freq, 2),
            "lead_time_days": round(lead_time, 1),
            "mttr_hours": round(mttr, 1),
            "change_failure_rate": round(change_fail * 100, 1),
        },
        "code_health": round(code_health, 1),
        "tech_debt_score": round(tech_debt * 100, 1),
        "security_risk_score": round(sec_risk * 100, 1),
        "overall_risk": round(risk * 100, 1),
        "github_activity": {
            "commits_per_week": max(1, int(dep_freq * 40)),
            "prs_per_week": max(1, int(dep_freq * 15)),
            "bug_rate_per_100_deploys": round(change_fail * 100, 1),
            "avg_review_time_hours": round(lead_time * 2.5, 1),
        },
        "sprint_velocity": max(1, int((1 - change_fail) * 20)),
        "open_bugs": max(0, int(change_fail * 50 + sec_risk * 30)),
        "resolved_this_week": max(0, int(dep_freq * 8)),
    }