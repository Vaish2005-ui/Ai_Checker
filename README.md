# AI Startup Failure Prediction System

## Project structure

```
AI_Failure_Detection_System_COMPLETE/
│
├── api.py                  ← FastAPI backend (run this first)
├── requirements.txt        ← Python dependencies
│
├── src/
│   ├── preprocess.py       ← Data loading & feature definitions
│   ├── simulation.py       ← What-if simulation engine
│   ├── predict.py          ← Single prediction wrapper
│   └── train_model.py      ← Retrain the model
│
├── dashboard/              ← Next.js frontend
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx    ← Main dashboard UI
│   │   │   └── layout.tsx
│   │   └── lib/
│   │       └── api.ts      ← API client
│   └── ...config files
│
├── models/
│   ├── rf_model.pkl        ← Trained Random Forest
│   └── xgb_model.pkl       ← Trained XGBoost
│
├── data/
│   ├── raw/
│   └── processed/
│       └── final_dataset.csv
│
└── notebooks/
    ├── data_exploration.ipynb
    └── shap_analysis.ipynb
```

---

## How to run

You need **2 terminals open at the same time**.

### Terminal 1 — Python API backend
```bash
# From the root project folder
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```
You should see: `Uvicorn running on http://127.0.0.1:8000`

### Terminal 2 — Next.js frontend
```bash
# From the dashboard/ folder
cd dashboard
npm install
npm run dev
```
Open http://localhost:3000 in your browser.

---

## Retrain the model
```bash
cd src
python train_model.py
```

---

## Features (15 risk factors)

| Feature | Range | Impact |
|---------|-------|--------|
| Competition | 0–2 | Very high (+0.96 corr) |
| Platform Dependency | 0–2 | Very high (+0.98 corr) |
| Giants | 0–2 | High (+0.71 corr) |
| Toxicity/Trust Issues | 0–2 | Medium (+0.34 corr) |
| Execution Flaws | 0–2 | Medium (+0.28 corr) |
| Poor Market Fit | 0–2 | Medium (+0.20 corr) |
| How Much They Raised | 0–1200 ($M) | Low (+0.06 corr) |
| Monetization Failure | 0–2 | Negative (−0.49 corr) |

---

## Requirements
- Python 3.9+
- Node.js 18+ (https://nodejs.org)
