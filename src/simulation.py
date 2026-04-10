"""
simulation.py
-------------
What-if analysis engine — fixed and complete.
Wired to the actual model and feature names from your dataset.
"""

import pandas as pd
import joblib
import os
import sys
from copy import deepcopy

sys.path.insert(0, os.path.dirname(__file__))
from preprocess import load_and_prepare, prepare_single, FEATURE_META, DEFAULT_PROFILE

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/rf_model.pkl")
DATA_PATH  = os.path.join(os.path.dirname(__file__), "../data/processed/merged_dataset.csv")


class SimulationEngine:
    """c
    Loads the trained Random Forest model and exposes:
      predict_risk(input_dict)
      simulate_change(input_dict, feature, new_value)
      simulate_all(input_dict, pct=0.20)
      run_scenario(input_dict, changes_dict)
      top_improvements(input_dict, n=5)
    """

    def __init__(self):
        self.model = joblib.load(MODEL_PATH)
        FEAT_PATH = os.path.join(os.path.dirname(MODEL_PATH), "feature_names.pkl")
        self.feature_names = joblib.load(FEAT_PATH)

    def predict_risk(self, input_dict: dict) -> float:
        row = prepare_single(input_dict, self.feature_names)
        return round(float(self.model.predict_proba(row)[0][1]), 4)

    def simulate_change(self, input_dict: dict, feature: str, new_value: float) -> dict:
        risk_before = self.predict_risk(input_dict)
        modified = deepcopy(input_dict)
        old_value = modified.get(feature)
        modified[feature] = new_value
        risk_after = self.predict_risk(modified)
        delta = round(risk_after - risk_before, 4)
        return {
            "feature":     feature,
            "label":       FEATURE_META.get(feature, {}).get("label", feature),
            "old_value":   old_value,
            "new_value":   new_value,
            "risk_before": risk_before,
            "risk_after":  risk_after,
            "risk_delta":  delta,
            "impact":      "positive" if delta < 0 else "negative" if delta > 0 else "neutral",
        }

    def simulate_all(self, input_dict: dict, pct: float = 0.20) -> pd.DataFrame:
        base_risk = self.predict_risk(input_dict)
        rows = []
        for feat, meta in FEATURE_META.items():
            if feat == "week":
                continue
            current = input_dict.get(feat, DEFAULT_PROFILE.get(feat, 0))
            delta_abs = abs(current * pct) if current != 0 else meta["step"]
            for direction, new_val_raw in [("+20%", current + delta_abs),
                                           ("-20%", current - delta_abs)]:
                new_val = max(meta["min"], min(meta["max"], new_val_raw))
                new_risk = self.predict_risk({**input_dict, feat: new_val})
                rows.append({
                    "feature":    feat,
                    "label":      meta["label"],
                    "direction":  direction,
                    "old_value":  round(current, 3),
                    "new_value":  round(new_val, 3),
                    "base_risk":  base_risk,
                    "new_risk":   new_risk,
                    "risk_delta": round(new_risk - base_risk, 4),
                })
        return pd.DataFrame(rows).sort_values("risk_delta")

    def run_scenario(self, input_dict: dict, changes: dict) -> dict:
        risk_before = self.predict_risk(input_dict)
        modified = deepcopy(input_dict)
        modified.update(changes)
        risk_after = self.predict_risk(modified)
        delta = round(risk_after - risk_before, 4)
        direction = "reduced" if delta < 0 else "increased"
        return {
            "risk_before":     risk_before,
            "risk_after":      risk_after,
            "risk_delta":      delta,
            "changes_applied": changes,
            "summary": f"Risk {direction} from {risk_before*100:.1f}% → {risk_after*100:.1f}% ({delta*100:+.1f} pp)",
        }

    def top_improvements(self, input_dict: dict, n: int = 5) -> list:
        df = self.simulate_all(input_dict)
        best = df[df["risk_delta"] < 0].head(n)
        return best.to_dict("records")

    def risk_over_weeks(self, input_dict: dict, weeks: int = 12) -> pd.DataFrame:
        """Predict risk week by week for a startup's time-series."""
        rows = []
        for w in range(1, weeks + 1):
            profile = deepcopy(input_dict)
            profile["week"] = w
            rows.append({"week": w, "risk": self.predict_risk(profile)})
        return pd.DataFrame(rows)


# ── Quick CLI test ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    engine = SimulationEngine()

    profile = deepcopy(DEFAULT_PROFILE)
    profile["Competition"] = 1.4
    profile["Poor Market Fit"] = 0.8
    profile["How Much They Raised"] = 5.0

    print("=== Current Risk ===")
    print(f"  {engine.predict_risk(profile)*100:.1f}%")

    print("\n=== Single Change: reduce Competition 1.4 → 0.5 ===")
    r = engine.simulate_change(profile, "Competition", 0.5)
    print(f"  {r['risk_before']*100:.1f}% → {r['risk_after']*100:.1f}% ({r['risk_delta']*100:+.1f} pp)")

    print("\n=== Top 5 Improvements ===")
    for i, imp in enumerate(engine.top_improvements(profile), 1):
        print(f"  {i}. {imp['label']} ({imp['direction']}): {imp['risk_delta']*100:+.1f} pp")

    print("\n=== Multi-change Scenario ===")
    s = engine.run_scenario(profile, {"Competition": 0.5, "Poor Market Fit": 0.1, "How Much They Raised": 200})
    print(f"  {s['summary']}")
