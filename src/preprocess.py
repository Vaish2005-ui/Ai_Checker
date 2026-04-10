"""
preprocess.py — updated for multi-domain dataset (v2)
Now includes Security Risk and Tech Debt features.
Covers: Financial + Operational + Technical + Security domains.
"""

import pandas as pd
import numpy as np

TARGET_COL = "failure"
DROP_COLS  = ["startup_id", "domain"]

def load_and_prepare(csv_path: str):
    df = pd.read_csv(csv_path)
    df = df.drop(columns=[c for c in DROP_COLS if c in df.columns])
    y = df[TARGET_COL].astype(int)
    X_raw = df.drop(columns=[TARGET_COL])
    X = pd.get_dummies(X_raw)
    X = X.astype(float).fillna(0)
    return X, y, list(X.columns)

def prepare_single(input_dict: dict, feature_names: list) -> pd.DataFrame:
    row = pd.DataFrame([input_dict])
    row = pd.get_dummies(row)
    row = row.astype(float).fillna(0)
    row = row.reindex(columns=feature_names, fill_value=0)
    return row

# ── Feature metadata — now 17 features (added Security Risk + Tech Debt) ─────

FEATURE_META = {
    "Years of Operation":    {"label": "Years of operation",          "min": 0,    "max": 20,   "step": 0.5},
    "How Much They Raised":  {"label": "Total funding raised ($M)",   "min": 0,    "max": 1200, "step": 10},
    "Giants":                {"label": "Giant competitor pressure",   "min": 0,    "max": 2,    "step": 0.1},
    "No Budget":             {"label": "No budget risk",              "min": 0,    "max": 2,    "step": 0.1},
    "Competition":           {"label": "Competition intensity",       "min": 0,    "max": 2,    "step": 0.1},
    "Poor Market Fit":       {"label": "Poor market fit",             "min": 0,    "max": 2,    "step": 0.05},
    "Acquisition Stagnation":{"label": "Acquisition stagnation",     "min": 0,    "max": 2,    "step": 0.05},
    "Platform Dependency":   {"label": "Platform dependency",        "min": 0,    "max": 2,    "step": 0.05},
    "Monetization Failure":  {"label": "Monetization failure",       "min": 0,    "max": 2,    "step": 0.05},
    "Niche Limits":          {"label": "Niche market limits",        "min": 0,    "max": 2,    "step": 0.05},
    "Execution Flaws":       {"label": "Execution flaws",            "min": 0,    "max": 2,    "step": 0.05},
    "Trend Shifts":          {"label": "Market trend shifts",        "min": 0,    "max": 2,    "step": 0.05},
    "Toxicity/Trust Issues": {"label": "Toxicity / trust issues",    "min": 0,    "max": 2,    "step": 0.05},
    "Regulatory Pressure":   {"label": "Regulatory pressure",       "min": 0,    "max": 2,    "step": 0.05},
    "Overhype":              {"label": "Overhype risk",              "min": 0,    "max": 2,    "step": 0.05},
    "Security Risk":         {"label": "Security vulnerability risk","min": 0,    "max": 2,    "step": 0.05},
    "Tech Debt":             {"label": "Technical debt level",       "min": 0,    "max": 2,    "step": 0.05},
    "week":                  {"label": "Monitoring week",            "min": 1,    "max": 12,   "step": 1},
}

DEFAULT_PROFILE = {
    "Years of Operation":     5.0,
    "How Much They Raised":   12.0,
    "Giants":                 0.5,
    "No Budget":              0.3,
    "Competition":            0.8,
    "Poor Market Fit":        0.2,
    "Acquisition Stagnation": 0.2,
    "Platform Dependency":    0.2,
    "Monetization Failure":   0.2,
    "Niche Limits":           0.2,
    "Execution Flaws":        0.2,
    "Trend Shifts":           0.1,
    "Toxicity/Trust Issues":  0.0,
    "Regulatory Pressure":    0.1,
    "Overhype":               0.1,
    "Security Risk":          0.2,
    "Tech Debt":              0.2,
    "week":                   1,
    "Sector":                 "Technology",
}
