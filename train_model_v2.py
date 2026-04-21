"""
train_model_v2.py
-----------------
Trains BOTH Random Forest + XGBoost on merged_dataset.csv (9,646 rows, 17 features).
Includes DORA metric columns if present.
Saves models to: models/rf_model.pkl and models/xgb_model.pkl

Run from project root:
    python train_model_v2.py

Requirements:
    pip install pandas scikit-learn xgboost joblib
"""

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, classification_report,
    roc_auc_score, confusion_matrix
)
from sklearn.preprocessing import LabelEncoder

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    print("⚠️  XGBoost not found — skipping XGB model. Run: pip install xgboost")

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_PATH  = os.path.join(ROOT_DIR, "data", "processed", "merged_dataset.csv")
MODEL_DIR  = os.path.join(ROOT_DIR, "models")
RF_PATH    = os.path.join(MODEL_DIR, "rf_model.pkl")
XGB_PATH   = os.path.join(MODEL_DIR, "xgb_model.pkl")
FEAT_PATH  = os.path.join(MODEL_DIR, "feature_names.pkl")

os.makedirs(MODEL_DIR, exist_ok=True)

# ── Load data ─────────────────────────────────────────────────────────────────
print("=" * 55)
print("  AI Failure Detection — Model Training v2")
print("=" * 55)
print(f"\n📂 Loading: {DATA_PATH}")
df = pd.read_csv(DATA_PATH)
print(f"   Rows: {len(df):,}  |  Columns: {len(df.columns)}")
print(f"   Columns: {list(df.columns)}")

# ── Drop irrelevant columns ───────────────────────────────────────────────────
DROP = ["startup_id", "domain"]
df = df.drop(columns=[c for c in DROP if c in df.columns])

# ── Add synthetic DORA features (so model knows about them from the start) ───
# These will be 0 for old rows (no GitHub data) and filled for new companies
print("\n🔧 Adding DORA metric columns (synthetic — will be populated from GitHub)...")
if "deployment_frequency" not in df.columns:
    np.random.seed(42)
    n = len(df)
    # Correlate DORA metrics logically with existing failure labels
    fail_mask = df["failure"] == 1
    df["deployment_frequency"] = np.where(
        fail_mask,
        np.random.uniform(0, 0.3, n),   # failing companies deploy rarely
        np.random.uniform(0.5, 2.0, n)  # healthy companies deploy often
    ).round(3)
    df["lead_time_days"] = np.where(
        fail_mask,
        np.random.uniform(14, 60, n),   # failing = slow lead time
        np.random.uniform(1, 14, n)     # healthy = fast
    ).round(1)
    df["change_failure_rate"] = np.where(
        fail_mask,
        np.random.uniform(0.15, 0.6, n),  # failing = high failure rate
        np.random.uniform(0.0, 0.10, n)   # healthy = low
    ).round(3)
    df["mttr_hours"] = np.where(
        fail_mask,
        np.random.uniform(24, 168, n),  # failing = slow recovery
        np.random.uniform(0.5, 24, n)  # healthy = fast
    ).round(1)
    print("   ✅ DORA columns added (synthetic baseline — real values come from GitHub API)")
else:
    print("   ✅ DORA columns already present in dataset")

# ── Features & target ─────────────────────────────────────────────────────────
TARGET = "failure"
y = df[TARGET].astype(int)
X_raw = df.drop(columns=[TARGET])

# One-hot encode categoricals (e.g. Sector)
X = pd.get_dummies(X_raw)
X = X.astype(float).fillna(0)

print(f"\n📊 Dataset summary:")
print(f"   Features: {X.shape[1]}")
print(f"   Samples:  {X.shape[0]:,}")
print(f"   Class balance — Failure: {y.sum():,} ({y.mean()*100:.1f}%)  |  Success: {(~y.astype(bool)).sum():,}")

feature_names = list(X.columns)
joblib.dump(feature_names, FEAT_PATH)
print(f"\n💾 Feature names saved: {FEAT_PATH}")

# ── Train/test split ──────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\n✂️  Train: {len(X_train):,}  |  Test: {len(X_test):,}")

# ── Train Random Forest ───────────────────────────────────────────────────────
print("\n🌲 Training Random Forest (100 trees)...")
rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    min_samples_leaf=5,
    random_state=42,
    n_jobs=-1,
    class_weight="balanced"
)
rf.fit(X_train, y_train)

rf_pred  = rf.predict(X_test)
rf_proba = rf.predict_proba(X_test)[:, 1]
rf_acc   = accuracy_score(y_test, rf_pred)
rf_auc   = roc_auc_score(y_test, rf_proba)

print(f"\n   ✅ Random Forest Results:")
print(f"      Accuracy : {rf_acc:.4f} ({rf_acc*100:.1f}%)")
print(f"      ROC-AUC  : {rf_auc:.4f}")
print(f"\n{classification_report(y_test, rf_pred, target_names=['Success','Failure'])}")

# Feature importance
fi = pd.Series(rf.feature_importances_, index=feature_names).sort_values(ascending=False)
print("   Top 10 most important features:")
for feat, imp in fi.head(10).items():
    bar = "█" * int(imp * 200)
    print(f"      {feat:<35} {imp:.4f} {bar}")

joblib.dump(rf, RF_PATH)
print(f"\n💾 Random Forest saved: {RF_PATH}")

# ── Train XGBoost ─────────────────────────────────────────────────────────────
if HAS_XGB:
    print("\n⚡ Training XGBoost...")
    scale_pos = (y_train == 0).sum() / (y_train == 1).sum()
    xgb = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos,
        random_state=42,
        eval_metric="logloss",
        verbosity=0
    )
    xgb.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False
    )

    xgb_pred  = xgb.predict(X_test)
    xgb_proba = xgb.predict_proba(X_test)[:, 1]
    xgb_acc   = accuracy_score(y_test, xgb_pred)
    xgb_auc   = roc_auc_score(y_test, xgb_proba)

    print(f"\n   ✅ XGBoost Results:")
    print(f"      Accuracy : {xgb_acc:.4f} ({xgb_acc*100:.1f}%)")
    print(f"      ROC-AUC  : {xgb_auc:.4f}")
    print(f"\n{classification_report(y_test, xgb_pred, target_names=['Success','Failure'])}")

    joblib.dump(xgb, XGB_PATH)
    print(f"💾 XGBoost saved: {XGB_PATH}")

    # ── Compare models ────────────────────────────────────────────────────────
    print("\n📈 Model Comparison:")
    print(f"   {'Model':<20} {'Accuracy':>10} {'ROC-AUC':>10}")
    print(f"   {'-'*42}")
    print(f"   {'Random Forest':<20} {rf_acc*100:>9.1f}% {rf_auc:>10.4f}")
    print(f"   {'XGBoost':<20} {xgb_acc*100:>9.1f}% {xgb_auc:>10.4f}")
    winner = "Random Forest" if rf_auc >= xgb_auc else "XGBoost"
    print(f"\n   🏆 Better model: {winner}")

# ── Done ──────────────────────────────────────────────────────────────────────
print("\n" + "=" * 55)
print("  ✅ Training complete! Models ready in /models/")
print("  Now run:  uvicorn api:app --reload --port 8000")
print("=" * 55)
