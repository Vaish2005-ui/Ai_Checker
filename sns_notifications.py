"""
sns_notifications.py — AWS SNS real-time notifications
=======================================================
Sends email/SMS alerts for:
  - User logins (success & failure)
  - High risk detections
  - New company registrations
  - Department changes
"""

import boto3
import os
import json
import logging
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("sns")

REGION = os.getenv("AWS_REGION", "us-east-1")
SNS_TOPIC_ARN = os.getenv("SNS_TOPIC_ARN", "")
SNS_ENABLED = os.getenv("SNS_ENABLED", "false").lower() == "true"

_sns_client = None


def _get_sns():
    global _sns_client
    if _sns_client is None:
        _sns_client = boto3.client(
            "sns",
            region_name=REGION,
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        )
    return _sns_client


def _publish(subject: str, message: str):
    """Publish a message to the SNS topic."""
    if not SNS_ENABLED or not SNS_TOPIC_ARN:
        logger.debug("SNS disabled or no topic ARN, skipping: %s", subject)
        return

    try:
        sns = _get_sns()
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject[:100],  # SNS subject max 100 chars
            Message=message,
        )
        logger.info("SNS notification sent: %s", subject)
    except Exception as e:
        logger.error("SNS notification failed: %s — %s", subject, str(e))


def notify_login(email: str, success: bool, company_id: str = "", ip: str = ""):
    """Send notification on login attempt."""
    status = "✅ SUCCESS" if success else "❌ FAILED"
    subject = f"[AI Checker] Login {status} — {email}"
    message = json.dumps({
        "event": "login",
        "status": "success" if success else "failed",
        "email": email,
        "company_id": company_id,
        "ip_address": ip,
        "timestamp": datetime.utcnow().isoformat(),
    }, indent=2)
    _publish(subject, message)


def notify_high_risk(company_id: str, risk_pct: float, department: str = "overall"):
    """Send alert when risk exceeds 70%."""
    if risk_pct < 70:
        return
    subject = f"[AI Checker] 🚨 HIGH RISK — {department} at {risk_pct:.0f}%"
    message = json.dumps({
        "event": "high_risk_alert",
        "company_id": company_id,
        "department": department,
        "risk_percentage": round(risk_pct, 1),
        "severity": "CRITICAL" if risk_pct >= 85 else "HIGH",
        "timestamp": datetime.utcnow().isoformat(),
    }, indent=2)
    _publish(subject, message)


def notify_new_company(company_name: str, admin_email: str, company_id: str):
    """Send notification when a new company is registered."""
    subject = f"[AI Checker] 🏢 New Company — {company_name}"
    message = json.dumps({
        "event": "company_registered",
        "company_name": company_name,
        "admin_email": admin_email,
        "company_id": company_id,
        "timestamp": datetime.utcnow().isoformat(),
    }, indent=2)
    _publish(subject, message)


def notify_department_change(company_id: str, department: str, action: str):
    """Send notification on department add/remove."""
    subject = f"[AI Checker] Department {action}: {department}"
    message = json.dumps({
        "event": "department_change",
        "company_id": company_id,
        "department": department,
        "action": action,
        "timestamp": datetime.utcnow().isoformat(),
    }, indent=2)
    _publish(subject, message)


def notify_invite(company_id: str, email: str, department: str):
    """Send notification when a team member is invited."""
    subject = f"[AI Checker] 📧 Invite Sent — {email}"
    message = json.dumps({
        "event": "invite_sent",
        "company_id": company_id,
        "invited_email": email,
        "department": department,
        "timestamp": datetime.utcnow().isoformat(),
    }, indent=2)
    _publish(subject, message)


def setup_sns_topic():
    """Create the SNS topic and return its ARN. Run once during setup."""
    try:
        sns = _get_sns()
        response = sns.create_topic(
            Name="ai-checker-notifications",
        )
        arn = response["TopicArn"]
        logger.info("SNS topic created/found: %s", arn)
        return arn
    except Exception as e:
        logger.error("Failed to create SNS topic: %s", str(e))
        return None


def subscribe_email(topic_arn: str, email: str):
    """Subscribe an email address to the SNS topic."""
    try:
        sns = _get_sns()
        sns.subscribe(
            TopicArn=topic_arn,
            Protocol="email",
            Endpoint=email,
        )
        logger.info("Subscription request sent to %s (check email to confirm)", email)
        return True
    except Exception as e:
        logger.error("Failed to subscribe %s: %s", email, str(e))
        return False
