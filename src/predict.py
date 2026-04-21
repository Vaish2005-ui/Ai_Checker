"""
predict.py
----------
Thin wrapper to load the model and predict risk for a startup.
Models load from S3 first, with local filesystem fallback.
"""

import joblib
import pandas as pd
import sys
import os
import logging
import tempfile

sys.path.insert(0, os.path.dirname(__file__))
from preprocess import load_and_prepare, prepare_single, DEFAULT_PROFILE

logger = logging.getLogger("predict")

MODEL_DIR = os.path.join(os.path.dirname(__file__), "../models")
MODEL_PATH  = os.path.join(MODEL_DIR, "rf_model.pkl")
DATA_PATH   = os.path.join(os.path.dirname(__file__), "../data/processed/final_dataset.csv")


def _load_model_from_s3_or_local(filename: str):
    """
    Load a .pkl file with S3 → local fallback.
    Caches S3 downloads to temp directory.
    """
    # 1. Check temp cache
    cache_dir = os.path.join(tempfile.gettempdir(), "ai_checker_models")
    cached_path = os.path.join(cache_dir, filename)
    if os.path.exists(cached_path):
        return joblib.load(cached_path)

    # 2. Try S3
    try:
        from aws_config import s3_client, S3_MODELS_BUCKET, USE_S3_MODELS
        if USE_S3_MODELS and s3_client is not None:
            os.makedirs(cache_dir, exist_ok=True)
            s3_client.download_file(S3_MODELS_BUCKET, f"models/{filename}", cached_path)
            logger.info("Loaded %s from S3", filename)
            return joblib.load(cached_path)
    except Exception as e:
        logger.debug("S3 load failed for %s: %s", filename, e)

    # 3. Local fallback
    local_path = os.path.join(MODEL_DIR, filename)
    if os.path.exists(local_path):
        logger.info("Loaded %s from local", filename)
        return joblib.load(local_path)

    raise FileNotFoundError(f"Model '{filename}' not found in S3 or {local_path}")


def load_model_and_features():
    model = _load_model_from_s3_or_local("rf_model.pkl")
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
