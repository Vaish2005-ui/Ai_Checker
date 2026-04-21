"""
logging_config.py — Structured logging with CloudWatch support
==============================================================
- Development: colored console output with JSON context
- Production:  sends logs to CloudWatch Logs via watchtower

Usage:
    from logging_config import setup_logging
    setup_logging()
    logger = logging.getLogger("api")
    logger.info("Request processed", extra={"path": "/predict", "latency_ms": 42})
"""

import os
import logging
import json
from datetime import datetime, timezone


# ── JSON Formatter ────────────────────────────────────────────────────────────

class JSONFormatter(logging.Formatter):
    """Structured JSON log formatter for CloudWatch."""

    def format(self, record):
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # Merge any extra fields passed via `extra={}`
        for key in ("path", "method", "status_code", "latency_ms",
                     "user_email", "company_id", "risk_score", "event",
                     "error", "detail"):
            value = getattr(record, key, None)
            if value is not None:
                log_entry[key] = value

        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


# ── Console Formatter (dev-friendly) ─────────────────────────────────────────

class ConsoleFormatter(logging.Formatter):
    """Colored console formatter for local development."""

    COLORS = {
        "DEBUG": "\033[36m",    # cyan
        "INFO": "\033[32m",     # green
        "WARNING": "\033[33m",  # yellow
        "ERROR": "\033[31m",    # red
        "CRITICAL": "\033[35m", # magenta
    }
    RESET = "\033[0m"

    def format(self, record):
        color = self.COLORS.get(record.levelname, self.RESET)
        timestamp = datetime.now().strftime("%H:%M:%S")
        base = f"{color}{timestamp} [{record.levelname:>7}]{self.RESET} {record.name}: {record.getMessage()}"

        # Append extra context if present
        extras = {}
        for key in ("path", "method", "status_code", "latency_ms",
                     "user_email", "company_id", "risk_score", "event"):
            value = getattr(record, key, None)
            if value is not None:
                extras[key] = value
        if extras:
            base += f"  {color}→ {extras}{self.RESET}"

        return base


# ── Setup Function ────────────────────────────────────────────────────────────

def setup_logging():
    """
    Configure logging based on environment.
    Call this once at app startup (before FastAPI runs).
    """
    from dotenv import load_dotenv
    load_dotenv()

    environment = os.getenv("ENVIRONMENT", "development")
    cw_enabled = os.getenv("CLOUDWATCH_ENABLED", "false").lower() == "true"
    log_group = os.getenv("CLOUDWATCH_LOG_GROUP", "/ai-checker/api")

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Clear existing handlers to avoid duplicates on reload
    root_logger.handlers.clear()

    if environment == "production" and cw_enabled:
        # ── CloudWatch handler ────────────────────────────────────────
        try:
            import watchtower
            from aws_config import get_cloudwatch_client

            cw_handler = watchtower.CloudWatchLogHandler(
                log_group_name=log_group,
                boto3_client=get_cloudwatch_client(),
                create_log_group=True,
            )
            cw_handler.setFormatter(JSONFormatter())
            root_logger.addHandler(cw_handler)
            logging.getLogger("setup").info(
                "☁️  CloudWatch logging enabled → %s", log_group
            )
        except Exception as e:
            # Fall back to console if CloudWatch setup fails
            console = logging.StreamHandler()
            console.setFormatter(ConsoleFormatter())
            root_logger.addHandler(console)
            logging.getLogger("setup").warning(
                "⚠️  CloudWatch unavailable, using console: %s", e
            )
    else:
        # ── Console handler (development) ─────────────────────────────
        console = logging.StreamHandler()
        console.setFormatter(ConsoleFormatter())
        root_logger.addHandler(console)

    # Always add console in production too (for Docker logs)
    if environment == "production":
        console = logging.StreamHandler()
        console.setFormatter(JSONFormatter())
        root_logger.addHandler(console)

    # Suppress noisy boto3/botocore logs
    logging.getLogger("boto3").setLevel(logging.WARNING)
    logging.getLogger("botocore").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)

    logging.getLogger("setup").info(
        "📋 Logging configured (env=%s, cloudwatch=%s)", environment, cw_enabled
    )
