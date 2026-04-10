"""
api.py — FastAPI backend (v2 — multi-domain model)
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

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))
from simulation import SimulationEngine
from preprocess import FEATURE_META, DEFAULT_PROFILE

app = FastAPI(title="Startup Risk API v2")

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


# ── Dynamic CORS — reads allowed origins from env var ─────────────────────────
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
def root(): return {"status": "ok", "version": "v2", "features": 17}

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

@app.post("/company/create")
def create_company(req: CompanyCreate):
    db = load_db()
    
    # Check if admin email already exists anywhere
    for cid, cdata in db["companies"].items():
        for m in cdata.get("members", []):
            if m["email"] == req.admin_email:
                raise HTTPException(status_code=400, detail="Email already taken")
                
    company_id = str(uuid4())
    db["companies"][company_id] = {
        "name": req.name,
        "industry": req.industry,
        "size": req.size,
        "admin_email": req.admin_email,
        "departments": req.departments,
        "members": [
            {
                "email": req.admin_email,
                "name": req.admin_name,
                "password": req.password, # Note: using plaintext for testing as requested
                "role": "admin",
                "department": "hr" # default
            }
        ],
        "department_metrics": {dept: {} for dept in req.departments},
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
        
    token = str(uuid4())
    db["invites"][token] = {
        "company_id": req.company_id,
        "department": req.department,
        "email": req.email,
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
    return {"email": invite["email"], "department": invite["department"], "company_name": company["name"], "company_id": invite["company_id"]}

@app.post("/auth/join")
def join_company(req: JoinRequest):
    db = load_db()
    invite = db["invites"].get(req.invite_token)
    
    if not invite or invite["status"] != "pending":
        raise HTTPException(status_code=400, detail="Invalid or used token")
        
    company_id = invite["company_id"]
    if company_id not in db["companies"]:
        raise HTTPException(status_code=404, detail="Company not found")
        
    member = {
        "email": invite["email"],
        "name": req.name,
        "password": req.password,
        "role": "team_leader",
        "department": invite["department"]
    }
    db["companies"][company_id]["members"].append(member)
    db["invites"][req.invite_token]["status"] = "accepted"
    save_db(db)
    
    return {"status": "success", "token": f"{company_id}:{invite['email']}", "role": "team_leader", "department": invite["department"], "company_id": company_id}

@app.post("/auth/login")
def login(req: LoginRequest):
    db = load_db()
    for cid, cdata in db["companies"].items():
        for m in cdata.get("members", []):
            if m["email"] == req.email and m["password"] == req.password:
                return {"status": "success", "token": f"{cid}:{req.email}", "role": m["role"], "department": m["department"], "company_id": cid}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/company/departments")
def get_departments(company_id: str):
    db = load_db()
    comp = db["companies"].get(company_id)
    if not comp: raise HTTPException(status_code=404, detail="Company not found")
    
    res = []
    # If standard risk prediction required per department
    # For now returning skeleton as per DB metrics
    for d in comp.get("departments", []):
        res.append({
            "name": d,
            "metrics": comp.get("department_metrics", {}).get(d, {})
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
    return comp.get("members", [])

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
    
    return {
        "department": dept,
        "risk": risk,
        "risk_pct": round(risk*100, 1),
        "label": "Critical" if risk>=0.7 else "Warning" if risk>=0.4 else "Healthy",
        "color": "red" if risk>=0.7 else "amber" if risk>=0.4 else "green",
        "metrics": metrics
    }

