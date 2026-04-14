import re

with open("api.py", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Replace imports and load/save DB
db_section = r"""# ── JSON Database ───────────.*?def hash_pw"""
replacement = r"""# ── DynamoDB Database ──────────────────────────────────────────────────────────
from database import get_company, save_company, get_all_companies, get_invite, save_invite

def hash_pw"""
code = re.sub(r'# ── JSON Database ──.*def hash_pw', replacement, code, flags=re.DOTALL)

# 2. find_member_by_token
find_mem_old = r"""def find_member_by_token\(token: str, db: dict\):.*?return None, None"""
find_mem_new = r"""def find_member_by_token(token: str):
    if not token or ":" not in token: return None, None
    cid, email = token.split(":", 1)
    comp = get_company(cid)
    if not comp: return None, None
    for m in comp.get("members", []):
        if m["email"] == email: return cid, m
    return None, None"""
code = re.sub(find_mem_old, find_mem_new, code, flags=re.DOTALL)

# 3. Replace all `db = load_db()` usages

# find_member_by_token calls
code = code.replace("company_id, member = find_member_by_token(token, db)", "company_id, member = find_member_by_token(token)")

old_register = r"""@app.post\("/auth/register"\)\ndef register.*?solo_cid, "name": req.name\}"""
new_register = r"""@app.post("/auth/register")
def register(req: RegisterRequest):
    email = req.email.lower().strip()
    for cdata in get_all_companies():
        for m in cdata.get("members", []):
            if m["email"] == email:
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
    return {"status": "success", "token": f"{solo_cid}:{email}", "role": "admin", "company_id": solo_cid, "name": req.name}"""
code = re.sub(old_register, new_register, code, flags=re.DOTALL)


old_login = r"""@app.post\("/auth/login"\)\ndef login.*?Invalid email or password"\)"""
new_login = r"""@app.post("/auth/login")
def login(req: LoginRequest):
    email = req.email.lower().strip()
    for cdata in get_all_companies():
        for m in cdata.get("members", []):
            if m["email"] == email and verify_pw(req.password, m["password"]):
                return {
                    "status": "success",
                    "token": f"{cdata.get('company_id')}:{email}",
                    "role": m["role"],
                    "department": m["department"],
                    "company_id": cdata.get("company_id"),
                    "name": m["name"],
                }
    raise HTTPException(status_code=401, detail="Invalid email or password")"""
code = re.sub(old_login, new_login, code, flags=re.DOTALL)


old_getme = r"""def get_me\(token: str\):.*?db = load_db\(\).*?comp = db\["companies"\].get\(company_id, \{\}\)"""
new_getme = r"""def get_me(token: str):
    company_id, member = find_member_by_token(token)
    if not member: raise HTTPException(status_code=401, detail="Invalid or expired token")
    comp = get_company(company_id) or {}"""
code = re.sub(old_getme, new_getme, code, flags=re.DOTALL)


old_inv_info = r"""def get_invite_info\(token: str\):.*?db = load_db\(\).*?invite = db\["invites"\].get\(token\).*?comp = db\["companies"\].get\(invite\["company_id"\]\)"""
new_inv_info = r"""def get_invite_info(token: str):
    invite = get_invite(token)
    if not invite or invite.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Invalid or expired invite link")
    comp = get_company(invite["company_id"])"""
code = re.sub(old_inv_info, new_inv_info, code, flags=re.DOTALL)


old_join = r"""def join_company\(req: JoinRequest\):.*?db = load_db\(\).*?invite = db\["invites"\].get\(req.invite_token\).*?if company_id not in db\["companies"\]:.*?for m in db\["companies"\]\[company_id\]\["members"\]:.*?db\["companies"\]\[company_id\]\["members"\]\.append\(member\)\n    db\["invites"\]\[req.invite_token\]\["status"\] = "accepted"\n    save_db\(db\)"""
new_join = r"""def join_company(req: JoinRequest):
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
    save_invite(invite)"""
code = re.sub(old_join, new_join, code, flags=re.DOTALL)


old_createcomp = r"""def create_company.*?save_db\(db\).*?return \{"""
new_createcomp = r"""def create_company(req: CompanyCreate):
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
    return {"""
code = re.sub(old_createcomp, new_createcomp, code, flags=re.DOTALL)


old_invite = r"""def invite_user\(req: Invite\):.*?save_db\(db\).*?return \{"status": "success", "invite_token": token,"""
new_invite = r"""def invite_user(req: Invite):
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
    return {"status": "success", "invite_token": token,"""
code = re.sub(old_invite, new_invite, code, flags=re.DOTALL)

# Simple replacements for standard db = load_db(); comp = db["companies"].get(company_id)
def make_repl(func_name, code_str):
    pattern = rf"""def {func_name}\(.*?\):.*?db = load_db\(\)\n\s+comp = db\["companies"\].get\(company_id\)"""
    replacement = rf"""def {func_name}(...):
    comp = get_company(company_id)""" # Doing manually via replace
    pass

code = re.sub(r'db = load_db\(\)\n\s*comp = db\["companies"\].get\(company_id\)', 'comp = get_company(company_id)', code)
code = re.sub(r'db = load_db\(\)\n\s*if company_id not in db\["companies"\]:', 'comp = get_company(company_id)\n    if not comp:', code)
code = re.sub(r'db\["companies"\]\[company_id\]', 'comp', code)
code = re.sub(r'save_db\(db\)', 'save_company(comp)', code)

with open("api.py", "w", encoding="utf-8") as f:
    f.write(code)
