"""
aws_config.py — Centralized AWS service configuration
=====================================================
Provides shared boto3 clients for DynamoDB, S3, CloudWatch Logs,
and optionally loads secrets from AWS Secrets Manager.

Local dev: reads from .env file
Production: reads from Secrets Manager when USE_AWS_SECRETS=true
"""

import os
import json
import logging
import boto3
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("aws_config")

# ── Core Config ───────────────────────────────────────────────────────────────

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

# S3 bucket names
S3_MODELS_BUCKET = os.getenv("S3_MODELS_BUCKET", "ai-checker-models")
S3_DATA_BUCKET = os.getenv("S3_DATA_BUCKET", "ai-checker-data")
USE_S3_MODELS = os.getenv("USE_S3_MODELS", "true").lower() == "true"

# CloudWatch
CLOUDWATCH_LOG_GROUP = os.getenv("CLOUDWATCH_LOG_GROUP", "/ai-checker/api")
CLOUDWATCH_ENABLED = os.getenv("CLOUDWATCH_ENABLED", "false").lower() == "true"

# Secrets Manager
USE_AWS_SECRETS = os.getenv("USE_AWS_SECRETS", "false").lower() == "true"
AWS_SECRET_NAME = os.getenv("AWS_SECRET_NAME", "ai-checker/prod")


# ── Secrets Manager Integration ──────────────────────────────────────────────

def _load_secrets_from_manager():
    """
    Load credentials from AWS Secrets Manager (production only).
    Falls back to env vars if Secrets Manager is unavailable.
    """
    if not USE_AWS_SECRETS:
        return

    try:
        client = boto3.client("secretsmanager", region_name=AWS_REGION)
        response = client.get_secret_value(SecretId=AWS_SECRET_NAME)
        secrets = json.loads(response["SecretString"])

        # Inject secrets into environment (without overwriting existing)
        for key, value in secrets.items():
            if not os.getenv(key):
                os.environ[key] = str(value)

        logger.info("✅ Loaded secrets from AWS Secrets Manager: %s", AWS_SECRET_NAME)

    except Exception as e:
        logger.warning("⚠️  Could not load Secrets Manager (%s), using .env: %s", AWS_SECRET_NAME, e)


# Load secrets at import time if enabled
_load_secrets_from_manager()


# ── Shared Boto3 Clients ─────────────────────────────────────────────────────

_boto_kwargs = {
    "region_name": AWS_REGION,
}

# Only pass explicit keys if they exist in env (for local dev).
# In production on EC2/ECS/AppRunner, IAM roles provide creds automatically.
if os.getenv("AWS_ACCESS_KEY_ID") and ENVIRONMENT == "development":
    _boto_kwargs["aws_access_key_id"] = os.getenv("AWS_ACCESS_KEY_ID")
    _boto_kwargs["aws_secret_access_key"] = os.getenv("AWS_SECRET_ACCESS_KEY")


def get_dynamodb_resource():
    """Get shared DynamoDB resource."""
    return boto3.resource("dynamodb", **_boto_kwargs)


def get_s3_client():
    """Get shared S3 client."""
    return boto3.client("s3", **_boto_kwargs)


def get_cloudwatch_client():
    """Get shared CloudWatch Logs client."""
    return boto3.client("logs", **_boto_kwargs)


# ── Pre-built shared instances ────────────────────────────────────────────────
# These are created once at import time and reused across the app.

try:
    dynamodb = get_dynamodb_resource()
    s3_client = get_s3_client()
    logger.info("✅ AWS clients initialized (region=%s, env=%s)", AWS_REGION, ENVIRONMENT)
except Exception as e:
    logger.error("❌ Failed to initialize AWS clients: %s", e)
    dynamodb = None
    s3_client = None
