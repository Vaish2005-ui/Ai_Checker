import boto3
import os
from decimal import Decimal
import json
from dotenv import load_dotenv

load_dotenv()

# ── Connect to DynamoDB ───────────────────────────────────────────────────────
dynamodb = boto3.resource(
    "dynamodb",
    region_name=os.getenv("AWS_REGION", "us-east-1"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

companies_table = dynamodb.Table("startup_companies")
invites_table   = dynamodb.Table("startup_invites")

# Helper to handle DynamoDB floats (Float -> Decimal on write, Decimal -> Float on read)
def to_dynamo(obj):
    return json.loads(json.dumps(obj), parse_float=Decimal)

def from_dynamo(obj):
    class DecimalEncoder(json.JSONEncoder):
        def default(self, o):
            if isinstance(o, Decimal): return float(o)
            return super().default(o)
    return json.loads(json.dumps(obj, cls=DecimalEncoder))

# ── COMPANY OPERATIONS ────────────────────────────────────────────────────────

def get_company(company_id: str):
    res = companies_table.get_item(Key={"company_id": company_id})
    return from_dynamo(res.get("Item"))

def save_company(company_data: dict):
    companies_table.put_item(Item=to_dynamo(company_data))

def get_all_companies():
    """Returns all companies. Used mainly for login/scan across all members."""
    res = companies_table.scan()
    return from_dynamo(res.get("Items", []))

# ── INVITE OPERATIONS ─────────────────────────────────────────────────────────

def get_invite(token: str):
    res = invites_table.get_item(Key={"token": token})
    return from_dynamo(res.get("Item"))

def save_invite(invite_data: dict):
    invites_table.put_item(Item=to_dynamo(invite_data))

