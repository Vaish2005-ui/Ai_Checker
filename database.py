"""
database.py — DynamoDB data access layer
=========================================
Uses shared AWS config from aws_config.py.
Includes GSI-based email lookup to avoid full table scans.
"""

import json
import logging
from decimal import Decimal

from aws_config import dynamodb

logger = logging.getLogger("database")

# ── Table References ──────────────────────────────────────────────────────────

companies_table = dynamodb.Table("startup_companies")
invites_table   = dynamodb.Table("startup_invites")


# ── Decimal ↔ Float Conversion ────────────────────────────────────────────────
# DynamoDB uses Decimal; our app uses float. Convert on read/write boundaries.

def to_dynamo(obj):
    """Convert Python floats → Decimal for DynamoDB writes."""
    return json.loads(json.dumps(obj), parse_float=Decimal)

def from_dynamo(obj):
    """Convert DynamoDB Decimals → Python floats for app reads."""
    class DecimalEncoder(json.JSONEncoder):
        def default(self, o):
            if isinstance(o, Decimal): return float(o)
            return super().default(o)
    return json.loads(json.dumps(obj, cls=DecimalEncoder))


# ── COMPANY OPERATIONS ────────────────────────────────────────────────────────

def get_company(company_id: str):
    """Fetch a single company by its primary key."""
    try:
        res = companies_table.get_item(Key={"company_id": company_id})
        item = res.get("Item")
        if item:
            logger.debug("Fetched company: %s", company_id)
            return from_dynamo(item)
        return None
    except Exception as e:
        logger.error("Failed to get company %s: %s", company_id, e,
                     extra={"event": "db_error", "company_id": company_id})
        raise

def save_company(company_data: dict):
    """Write (create or update) a company record."""
    try:
        companies_table.put_item(Item=to_dynamo(company_data))
        logger.info("Saved company: %s", company_data.get("company_id", "?"),
                    extra={"event": "company_saved", "company_id": company_data.get("company_id")})
    except Exception as e:
        logger.error("Failed to save company: %s", e,
                     extra={"event": "db_error"})
        raise

def get_all_companies():
    """
    Returns all companies. Used for login scan across all members.
    
    NOTE: This is a full table scan — expensive at scale.
    Prefer get_company_by_email() with GSI for login lookups.
    """
    try:
        res = companies_table.scan()
        items = res.get("Items", [])
        # Handle pagination for large tables
        while "LastEvaluatedKey" in res:
            res = companies_table.scan(ExclusiveStartKey=res["LastEvaluatedKey"])
            items.extend(res.get("Items", []))
        logger.debug("Scanned all companies: %d results", len(items))
        return from_dynamo(items)
    except Exception as e:
        logger.error("Failed to scan companies: %s", e, extra={"event": "db_error"})
        raise

def get_company_by_email(email: str):
    """
    Look up a company + member by email using GSI (email-index).
    Falls back to full table scan if the GSI doesn't exist yet.
    
    Returns: (company_data, member_data) or (None, None)
    """
    try:
        # Try GSI first
        res = companies_table.query(
            IndexName="email-index",
            KeyConditionExpression="member_email = :email",
            ExpressionAttributeValues={":email": email},
        )
        items = res.get("Items", [])
        if items:
            comp = from_dynamo(items[0])
            for m in comp.get("members", []):
                if m["email"] == email:
                    logger.debug("GSI lookup found: %s in company %s", email, comp.get("company_id"))
                    return comp, m
    except Exception as e:
        # GSI might not exist yet — fall back to scan
        logger.debug("GSI lookup failed (%s), falling back to scan", e)

    # Fallback: scan all companies (existing behavior)
    for cdata in get_all_companies():
        for m in cdata.get("members", []):
            if m["email"] == email:
                return cdata, m
    return None, None


# ── INVITE OPERATIONS ─────────────────────────────────────────────────────────

def get_invite(token: str):
    """Fetch an invite by its token (primary key)."""
    try:
        res = invites_table.get_item(Key={"token": token})
        item = res.get("Item")
        if item:
            logger.debug("Fetched invite: %s", token[:8])
            return from_dynamo(item)
        return None
    except Exception as e:
        logger.error("Failed to get invite %s: %s", token[:8], e,
                     extra={"event": "db_error"})
        raise

def save_invite(invite_data: dict):
    """Write (create or update) an invite record."""
    try:
        invites_table.put_item(Item=to_dynamo(invite_data))
        logger.info("Saved invite for: %s", invite_data.get("email", "?"),
                    extra={"event": "invite_saved"})
    except Exception as e:
        logger.error("Failed to save invite: %s", e, extra={"event": "db_error"})
        raise

def get_invites_for_company(company_id: str):
    """Get all invites for a specific company (scan with filter)."""
    try:
        res = invites_table.scan(
            FilterExpression="company_id = :cid",
            ExpressionAttributeValues={":cid": company_id},
        )
        return from_dynamo(res.get("Items", []))
    except Exception as e:
        logger.error("Failed to get invites for %s: %s", company_id, e)
        return []
