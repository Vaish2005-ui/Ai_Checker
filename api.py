"""
api.py — FastAPI backend (v3 — Jira-like department system)
Run: uvicorn api:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys, os
import json
from uuid import uuid4
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))
from simulation import SimulationEngine
from preprocess import FEATURE_META, DEFAULT_PROFILE

app = FastAPI(title="Startup Risk API v3 — Jira-like Departments")

# ── JSON Database Helper ───────────────────────────────────────────────────────
DB_FILE = os.path.join(os.path.dirname(__file__), "data", "users.json")

def load_db():
    if not os.path.exists(DB_FILE):
        os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
        default_db = {"companies": {}, "invites": {}}
        with open(DB_FILE, "w") as f:
            json.dump(default_db, f)
        return default_db
    try:
        with open(DB_FILE, "r") as f:
            data = json.load(f)
            if "invites" not in data: data["invites"] = {}
            return data
    except Exception:
        return {"companies": {}, "invites": {}}

def save_db(db):
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    with open(DB_FILE, "w") as f:
        json.dump(db, f, indent=2)

# ── Department-Specific Metric Mapping ─────────────────────────────────────────
DEPT_METRICS = {
    "finance": {
        "label": "Finance & Accounting",
        "metrics": ["No Budget", "How Much They Raised", "Monetization Failure", "Acquisition Stagnation"],
        "color": "#14b8a6",
    },
    "hr": {
        "label": "Human Resources",
        "metrics": ["Toxicity/Trust Issues", "Execution Flaws", "Trend Shifts"],
        "color": "#a855f7",
    },
    "software": {
        "label": "Software Engineering",
        "metrics": ["Tech Debt", "Security Risk", "change_failure_rate", "deployment_frequency", "lead_time_days", "mttr_hours"],
        "color": "#f59e0b",
    },
    "engineering": {
        "label": "Engineering",
        "metrics": ["Tech Debt", "Security Risk", "Platform Dependency", "Execution Flaws"],
        "color": "#f59e0b",
    },
    "marketing": {
        "label": "Marketing",
        "metrics": ["Overhype", "Trend Shifts", "Niche Limits", "Competition"],
        "color": "#ec4899",
    },
    "security": {
        "label": "Security & Compliance",
        "metrics": ["Security Risk", "Regulatory Pressure", "Platform Dependency"],
        "color": "#3b82f6",
    },
    "operations": {
        "label": "Operations",
        "metrics": ["Giants", "Poor Market Fit", "Acquisition Stagnation", "Competition"],
        "color": "#f43f5e",
    },
}

# ── Dynamic CORS — reads allowed origins from env var ─────────────────────────
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = SimulationEngine()

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

@app.get("/")
def root(): return {"status": "ok", "version": "v3", "features": 17}

@app.post("/predict")
def predict(p: StartupProfile):
    risk = engine.predict_risk(to_dict(p))
    return {"risk": risk, "risk_pct": round(risk*100,1),
            "label": "High Risk" if risk>=0.7 else "Medium Risk" if risk>=0.4 else "Low Risk",
            "color": "red" if risk>=0.7 else "amber" if risk>=0.4 else "green"}

@app.post("/simulate")
def simulate(p: StartupProfile, feature: str, new_value: float):
    return engine.simulate_change(to_dict(p), feature, new_value)

@app.post("/impact")
def impact(p: StartupProfile):
    df = engine.simulate_all(to_dict(p), pct=0.20)
    return {"improvements": df[df["risk_delta"]<0].head(8).to_dict("records"),
            "risks": df[df["risk_delta"]>0].tail(6).to_dict("records")}

@app.post("/timeline")
def timeline(p: StartupProfile, weeks: int = 12):
    return engine.risk_over_weeks(to_dict(p), weeks=weeks).to_dict("records")

@app.post("/top_improvements")
def top_improvements(p: StartupProfile):
    return engine.top_improvements(to_dict(p), n=5)

@app.get("/features")
def features(): return FEATURE_META

# ── NEW: Full report endpoint — single call for the report page ───────────────
@app.post("/full_report")
def full_report(p: StartupProfile, weeks: int = 12):
    risk = engine.predict_risk(to_dict(p))
    impact_df = engine.simulate_all(to_dict(p), pct=0.20)
    improvements = impact_df[impact_df["risk_delta"]<0].head(8).to_dict("records")
    risks_list = impact_df[impact_df["risk_delta"]>0].tail(6).to_dict("records")
    tl = engine.risk_over_weeks(to_dict(p), weeks=weeks).to_dict("records")
    top_imps = engine.top_improvements(to_dict(p), n=5)

    return {
        "risk": risk,
        "risk_pct": round(risk*100, 1),
        "label": "High Risk" if risk>=0.7 else "Medium Risk" if risk>=0.4 else "Low Risk",
        "color": "red" if risk>=0.7 else "amber" if risk>=0.4 else "green",
        "impact": {"improvements": improvements, "risks": risks_list},
        "timeline": tl,
        "top_improvements": top_imps,
    }


# ── EXTENDED MODELS & AUTH ENDPOINTS ──────────────────────────────────────────

class CompanyCreate(BaseModel):
    name: str
    industry: str
    size: str
    admin_name: str
    admin_email: str
    password: str
    departments: List[str] = []

class Invite(BaseModel):
    company_id: str
    department: str
    email: str
    role: str = "team_leader"  # admin invites leaders, leaders invite employees

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

# ── Task/Issue Models (Jira-like board) ────────────────────────────────────────
class TaskCreate(BaseModel):
    title: str
    description: str = ""
    status: str = "todo"  # todo, in_progress, review, done
    priority: str = "medium"  # low, medium, high, critical
    assignee_email: str = ""
    task_type: str = "task"  # task, bug, story, epic
    labels: List[str] = []

class TaskUpdate(BaseModel):
    status: str = ""
    title: str = ""
    description: str = ""
    priority: str = ""
    assignee_email: str = ""

@app.post("/company/create")
def create_company(req: CompanyCreate):
    db = load_db()
    
    # Check if admin email already exists anywhere
    for cid, cdata in db["companies"].items():
        for m in cdata.get("members", []):
            if m["email"] == req.admin_email:
                raise HTTPException(status_code=400, detail="Email already taken")
                
    company_id = str(uuid4())
    
    # Ensure software dept is available
    depts = req.departments if req.departments else ["HR", "finance", "software"]
    
    db["companies"][company_id] = {
        "name": req.name,
        "industry": req.industry,
        "size": req.size,
        "admin_email": req.admin_email,
        "departments": depts,
        "members": [
            {
                "email": req.admin_email,
                "name": req.admin_name,
                "password": req.password, # Note: using plaintext for testing as requested
                "role": "admin",
                "department": "all"
            }
        ],
        "department_metrics": {dept.lower(): {} for dept in depts},
        "board": {dept.lower(): [] for dept in depts},
        "global_metrics": {
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
    }

    save_db(db)
    
    return {"status": "success", "company_id": company_id, "token": company_id + ":" + req.admin_email, "role": "admin"}

@app.post("/company/invite")
def invite_user(req: Invite):
    db = load_db()
    if req.company_id not in db["companies"]:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Validate role — admin can invite leaders, leaders can invite employees
    allowed_roles = ["team_leader", "employee"]
    if req.role not in allowed_roles:
        raise HTTPException(status_code=400, detail=f"Role must be one of: {allowed_roles}")
        
    token = str(uuid4())
    db["invites"][token] = {
        "company_id": req.company_id,
        "department": req.department,
        "email": req.email,
        "role": req.role,
        "status": "pending"
    }
    save_db(db)
    return {"status": "success", "invite_token": token}

@app.get("/auth/invite-info/{token}")
def get_invite_info(token: str):
    db = load_db()
    invite = db["invites"].get(token)
    if not invite or invite["status"] != "pending":
        raise HTTPException(status_code=400, detail="Invalid or expired invite")
    company = db["companies"].get(invite["company_id"])
    if not company:
        raise HTTPException(status_code=400, detail="Company no longer exists")
    return {
        "email": invite["email"],
        "department": invite["department"],
        "company_name": company["name"],
        "company_id": invite["company_id"],
        "role": invite.get("role", "team_leader")
    }

@app.post("/auth/join")
def join_company(req: JoinRequest):
    db = load_db()
    invite = db["invites"].get(req.invite_token)
    
    if not invite or invite["status"] != "pending":
        raise HTTPException(status_code=400, detail="Invalid or used token")
        
    company_id = invite["company_id"]
    if company_id not in db["companies"]:
        raise HTTPException(status_code=404, detail="Company not found")
    
    role = invite.get("role", "team_leader")
        
    member = {
        "email": invite["email"],
        "name": req.name,
        "password": req.password,
        "role": role,
        "department": invite["department"]
    }
    db["companies"][company_id]["members"].append(member)
    db["invites"][req.invite_token]["status"] = "accepted"
    save_db(db)
    
    return {"status": "success", "token": f"{company_id}:{invite['email']}", "role": role, "department": invite["department"], "company_id": company_id}

@app.post("/auth/login")
def login(req: LoginRequest):
    db = load_db()
    for cid, cdata in db["companies"].items():
        for m in cdata.get("members", []):
            if m["email"] == req.email and m["password"] == req.password:
                return {"status": "success", "token": f"{cid}:{req.email}", "role": m["role"], "department": m["department"], "company_id": cid, "name": m["name"]}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/company/departments")
def get_departments(company_id: str):
    db = load_db()
    comp = db["companies"].get(company_id)
    if not comp: raise HTTPException(status_code=404, detail="Company not found")
    
    res = []
    for d in comp.get("departments", []):
        dept_key = d.lower()
        dept_info = DEPT_METRICS.get(dept_key, {"label": d, "metrics": [], "color": "#6366f1"})
        member_count = len([m for m in comp.get("members", []) if m["department"].lower() == dept_key or m["department"] == "all"])
        res.append({
            "name": d,
            "label": dept_info["label"],
            "color": dept_info["color"],
            "metrics": comp.get("department_metrics", {}).get(dept_key, {}),
            "relevant_fields": dept_info["metrics"],
            "member_count": member_count,
        })
    return res

@app.get("/company/profile")
def get_company_profile(company_id: str):
    db = load_db()
    comp = db["companies"].get(company_id)
    if not comp: raise HTTPException(status_code=404, detail="Company not found")
    return comp.get("global_metrics", {})

@app.post("/company/profile")
def update_company_profile(company_id: str, metrics: Dict[str, float]):
    db = load_db()
    if company_id not in db["companies"]:
        raise HTTPException(status_code=404, detail="Company not found")
    db["companies"][company_id].setdefault("global_metrics", {}).update(metrics)
    save_db(db)
    return {"status": "success"}

@app.get("/company/members")
def get_members(company_id: str):
    db = load_db()
    comp = db["companies"].get(company_id)
    if not comp: raise HTTPException(status_code=404, detail="Company not found")
    # Return members without passwords
    members = []
    for m in comp.get("members", []):
        members.append({k:v for k,v in m.items() if k != "password"})
    return members

# ── Org Tree Endpoint ──────────────────────────────────────────────────────────
@app.get("/company/org-tree")
def get_org_tree(company_id: str):
    """Returns hierarchical org tree for the admin view."""
    db = load_db()
    comp = db["companies"].get(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    members = comp.get("members", [])
    departments = comp.get("departments", [])
    
    # Build tree
    admin = None
    dept_tree = {}
    
    for m in members:
        if m["role"] == "admin":
            admin = {"name": m["name"], "email": m["email"], "role": "admin"}
        else:
            dept = m["department"].lower()
            if dept not in dept_tree:
                dept_tree[dept] = {"leaders": [], "employees": []}
            if m["role"] == "team_leader":
                dept_tree[dept]["leaders"].append({"name": m["name"], "email": m["email"], "role": "team_leader"})
            else:
                dept_tree[dept]["employees"].append({"name": m["name"], "email": m["email"], "role": "employee"})
    
    tree = {
        "company": comp["name"],
        "admin": admin,
        "departments": []
    }
    
    for d in departments:
        dk = d.lower()
        dept_info = DEPT_METRICS.get(dk, {"label": d, "color": "#6366f1"})
        members_data = dept_tree.get(dk, {"leaders": [], "employees": []})
        tree["departments"].append({
            "name": d,
            "key": dk,
            "label": dept_info.get("label", d),
            "color": dept_info.get("color", "#6366f1"),
            "leaders": members_data["leaders"],
            "employees": members_data["employees"],
            "total": len(members_data["leaders"]) + len(members_data["employees"]),
        })
    
    return tree

# ── Department Metrics Config ──────────────────────────────────────────────────
@app.get("/department/config/{dept}")
def get_dept_config(dept: str):
    """Returns which metrics are relevant for a department — for frontend isolation."""
    dk = dept.lower()
    if dk in DEPT_METRICS:
        return DEPT_METRICS[dk]
    return {"label": dept, "metrics": list(FEATURE_META.keys()), "color": "#6366f1"}

@app.post("/department/update-metrics")
def update_metrics(req: DepartmentUpdate):
    db = load_db()
    if req.company_id not in db["companies"]:
        raise HTTPException(status_code=404, detail="Company not found")
    
    if req.department not in db["companies"][req.company_id].get("department_metrics", {}):
        db["companies"][req.company_id].setdefault("department_metrics", {})[req.department] = {}
        
    db["companies"][req.company_id]["department_metrics"][req.department].update(req.metrics)
    # Ensure department is in list
    if req.department not in db["companies"][req.company_id]["departments"]:
        db["companies"][req.company_id]["departments"].append(req.department)
        
    save_db(db)
    return {"status": "success"}

@app.get("/department/{company_id}/{dept}/risk")
def get_department_risk(company_id: str, dept: str):
    db = load_db()
    comp = db["companies"].get(company_id)
    if not comp: raise HTTPException(status_code=404, detail="Company not found")
    
    metrics = comp.get("department_metrics", {}).get(dept, {})
    global_metrics = comp.get("global_metrics", {})
    
    # Start with default profile
    base_dict = to_dict(StartupProfile())
    
    # Overwrite with global company metrics
    for k, v in global_metrics.items():
        base_dict[k] = v
        
    # Overwrite with specific department overrides
    for k, v in metrics.items():
        base_dict[k] = v
        
    # Re-instantiate profile dict for predict
    risk = engine.predict_risk(base_dict)
    
    # Get department-specific relevant metrics
    dept_config = DEPT_METRICS.get(dept.lower(), {})
    relevant_keys = dept_config.get("metrics", [])
    dept_specific_metrics = {}
    for key in relevant_keys:
        dept_specific_metrics[key] = metrics.get(key, global_metrics.get(key, base_dict.get(key, 0)))
    
    return {
        "department": dept,
        "risk": risk,
        "risk_pct": round(risk*100, 1),
        "label": "Critical" if risk>=0.7 else "Warning" if risk>=0.4 else "Healthy",
        "color": "red" if risk>=0.7 else "amber" if risk>=0.4 else "green",
        "metrics": dept_specific_metrics,
        "all_metrics": metrics,
        "relevant_fields": relevant_keys,
    }


# ── Jira-like Board Endpoints ─────────────────────────────────────────────────

@app.get("/department/{company_id}/{dept}/board")
def get_board(company_id: str, dept: str):
    """Get all tasks/issues for a department board."""
    db = load_db()
    comp = db["companies"].get(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    
    board = comp.get("board", {}).get(dept.lower(), [])
    return {"department": dept, "tasks": board}

@app.post("/department/{company_id}/{dept}/board/task")
def create_task(company_id: str, dept: str, task: TaskCreate):
    """Create a new task on the department board."""
    db = load_db()
    comp = db["companies"].get(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    
    dk = dept.lower()
    if "board" not in comp:
        comp["board"] = {}
    if dk not in comp["board"]:
        comp["board"][dk] = []
    
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
    db["companies"][company_id] = comp
    save_db(db)
    return {"status": "success", "task": new_task}

@app.put("/department/{company_id}/{dept}/board/task/{task_id}")
def update_task(company_id: str, dept: str, task_id: str, updates: TaskUpdate):
    """Update a task's status, title, etc."""
    db = load_db()
    comp = db["companies"].get(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    
    dk = dept.lower()
    board = comp.get("board", {}).get(dk, [])
    
    for t in board:
        if t["id"] == task_id:
            if updates.status: t["status"] = updates.status
            if updates.title: t["title"] = updates.title
            if updates.description: t["description"] = updates.description
            if updates.priority: t["priority"] = updates.priority
            if updates.assignee_email: t["assignee_email"] = updates.assignee_email
            db["companies"][company_id] = comp
            save_db(db)
            return {"status": "success", "task": t}
    
    raise HTTPException(status_code=404, detail="Task not found")

@app.delete("/department/{company_id}/{dept}/board/task/{task_id}")
def delete_task(company_id: str, dept: str, task_id: str):
    """Delete a task from the board."""
    db = load_db()
    comp = db["companies"].get(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    
    dk = dept.lower()
    board = comp.get("board", {}).get(dk, [])
    comp["board"][dk] = [t for t in board if t["id"] != task_id]
    db["companies"][company_id] = comp
    save_db(db)
    return {"status": "success"}


# ── Software Department Dev Metrics ────────────────────────────────────────────

@app.get("/department/{company_id}/software/devmetrics")
def software_dev_metrics(company_id: str):
    """Returns software engineering metrics derived from the ML model for the software department."""
    db = load_db()
    comp = db["companies"].get(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    
    global_m = comp.get("global_metrics", {})
    dept_m = comp.get("department_metrics", {}).get("software", {})
    
    # Merge metrics
    merged = {**global_m, **dept_m}
    
    # DORA metrics
    deployment_freq = merged.get("deployment_frequency", 0.5)
    lead_time = merged.get("lead_time_days", 14.0)
    mttr = merged.get("mttr_hours", 24.0)
    change_fail = merged.get("change_failure_rate", 0.1)
    tech_debt = merged.get("Tech Debt", 0.2)
    security_risk = merged.get("Security Risk", 0.2)
    
    # Compute code health score (0-100) from ML features
    code_health = max(0, min(100, 100 - (tech_debt * 25) - (security_risk * 20) - (change_fail * 30)))
    
    # Bug severity from ML model  
    base_dict = to_dict(StartupProfile())
    for k, v in merged.items():
        base_dict[k] = v
    risk = engine.predict_risk(base_dict)
    
    # Simulated GitHub activity derived from model features
    commits_per_week = max(1, int(deployment_freq * 40))
    prs_per_week = max(1, int(deployment_freq * 15))
    bug_rate = change_fail * 100  # bugs per 100 deploys
    
    return {
        "dora": {
            "deployment_frequency": round(deployment_freq, 2),
            "lead_time_days": round(lead_time, 1),
            "mttr_hours": round(mttr, 1),
            "change_failure_rate": round(change_fail * 100, 1),
        },
        "code_health": round(code_health, 1),
        "tech_debt_score": round(tech_debt * 100, 1),
        "security_risk_score": round(security_risk * 100, 1),
        "overall_risk": round(risk * 100, 1),
        "github_activity": {
            "commits_per_week": commits_per_week,
            "prs_per_week": prs_per_week,
            "bug_rate_per_100_deploys": round(bug_rate, 1),
            "avg_review_time_hours": round(lead_time * 2.5, 1),
        },
        "sprint_velocity": max(1, int((1 - change_fail) * 20)),
        "open_bugs": max(0, int(change_fail * 50 + security_risk * 30)),
        "resolved_this_week": max(0, int(deployment_freq * 8)),
    }

# ── Add Department Endpoint ────────────────────────────────────────────────────
@app.post("/company/add-department")
def add_department(company_id: str, department: str):
    db = load_db()
    comp = db["companies"].get(company_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    
    dk = department.lower()
    if dk not in [d.lower() for d in comp["departments"]]:
        comp["departments"].append(dk)
        comp.setdefault("department_metrics", {})[dk] = {}
        comp.setdefault("board", {})[dk] = []
        save_db(db)
    
    return {"status": "success", "departments": comp["departments"]}
