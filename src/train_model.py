"""
train_model.py
--------------
Trains the Random Forest model on final_dataset.csv and saves it.
Run from the src/ folder: python train_model.py
"""

import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# ── Paths (works regardless of where you run the script from) ─────────────────
SRC_DIR   = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR  = os.path.join(SRC_DIR, "..")
DATA_PATH = os.path.join(ROOT_DIR, "data", "processed", "final_dataset.csv")
MODEL_DIR = os.path.join(ROOT_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "rf_model.pkl")

# ── Load dataset ──────────────────────────────────────────────────────────────
print("Loading dataset...")
df = pd.read_csv(DATA_PATH)
print(f"  Rows: {len(df)}, Columns: {list(df.columns)}")

# ── Preprocessing ─────────────────────────────────────────────────────────────
X = df.drop(columns=["failure", "startup_id"])
y = df["failure"]
X = pd.get_dummies(X)
X = X.astype(float).fillna(0)

print(f"  Features after encoding: {X.shape[1]}")
print(f"  Class balance: {y.value_counts().to_dict()}")

# ── Train/test split ──────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ── Train model ───────────────────────────────────────────────────────────────
print("\nTraining Random Forest...")
model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# ── Evaluate ──────────────────────────────────────────────────────────────────
pred = model.predict(X_test)
print(f"\nAccuracy: {accuracy_score(y_test, pred):.4f}")
print(classification_report(y_test, pred))

# ── Save model ────────────────────────────────────────────────────────────────
os.makedirs(MODEL_DIR, exist_ok=True)
joblib.dump(model, MODEL_PATH)
print(f"\nModel saved to: {MODEL_PATH}")
