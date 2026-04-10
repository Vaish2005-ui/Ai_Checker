"""
predict.py
----------
Thin wrapper to load the model and predict risk for a startup.
"""

import joblib
import pandas as pd
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from preprocess import load_and_prepare, prepare_single, DEFAULT_PROFILE

MODEL_PATH  = os.path.join(os.path.dirname(__file__), "../models/rf_model.pkl")
DATA_PATH   = os.path.join(os.path.dirname(__file__), "../data/processed/final_dataset.csv")


def load_model_and_features():
    model = joblib.load(MODEL_PATH)
    _, _, feature_names = load_and_prepare(DATA_PATH)
    return model, feature_names


def predict_risk(input_dict: dict, model=None, feature_names=None) -> float:
    """
    Return failure probability (0.0–1.0) for a startup described by input_dict.
    If model/feature_names are None, loads them fresh (slower but convenient).
    """
    if model is None or feature_names is None:
        model, feature_names = load_model_and_features()
    row = prepare_single(input_dict, feature_names)
    return round(float(model.predict_proba(row)[0][1]), 4)


if __name__ == "__main__":
    model, feature_names = load_model_and_features()
    risk = predict_risk(DEFAULT_PROFILE, model, feature_names)
    print(f"Default startup profile → failure risk: {risk*100:.1f}%")
