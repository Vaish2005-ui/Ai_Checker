"""
upload_models.py — Upload ML models and data to S3
===================================================
Run once to seed your S3 buckets with model artifacts and training data.

Usage:
    python upload_models.py              # Upload everything
    python upload_models.py --dry-run    # Preview what would be uploaded
    python upload_models.py --models     # Upload models only
    python upload_models.py --data       # Upload data only
"""

import os
import sys
import argparse
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("upload_models")

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATA_DIR = os.path.join(BASE_DIR, "data")


def get_files_to_upload(include_models=True, include_data=True):
    """Gather all files to upload with their S3 keys."""
    files = []

    if include_models:
        for filename in os.listdir(MODELS_DIR):
            if filename.endswith(".pkl"):
                files.append({
                    "local_path": os.path.join(MODELS_DIR, filename),
                    "bucket_type": "models",
                    "s3_key": f"models/{filename}",
                    "size": os.path.getsize(os.path.join(MODELS_DIR, filename)),
                })

    if include_data:
        for root, dirs, filenames in os.walk(DATA_DIR):
            for filename in filenames:
                local_path = os.path.join(root, filename)
                # Create S3 key relative to BASE_DIR
                rel_path = os.path.relpath(local_path, BASE_DIR).replace("\\", "/")
                files.append({
                    "local_path": local_path,
                    "bucket_type": "data",
                    "s3_key": rel_path,
                    "size": os.path.getsize(local_path),
                })

    return files


def upload_to_s3(files, dry_run=False):
    """Upload files to their respective S3 buckets."""
    from aws_config import s3_client, S3_MODELS_BUCKET, S3_DATA_BUCKET

    if s3_client is None:
        logger.error("❌ S3 client not available. Check your AWS credentials.")
        sys.exit(1)

    bucket_map = {
        "models": S3_MODELS_BUCKET,
        "data": S3_DATA_BUCKET,
    }

    total_size = 0
    uploaded = 0

    for f in files:
        bucket = bucket_map[f["bucket_type"]]
        size_kb = f["size"] / 1024
        total_size += f["size"]

        if dry_run:
            logger.info("  [DRY RUN] %s → s3://%s/%s (%.1f KB)",
                       os.path.basename(f["local_path"]), bucket, f["s3_key"], size_kb)
        else:
            try:
                s3_client.upload_file(f["local_path"], bucket, f["s3_key"])
                logger.info("  ✅ %s → s3://%s/%s (%.1f KB)",
                           os.path.basename(f["local_path"]), bucket, f["s3_key"], size_kb)
                uploaded += 1
            except Exception as e:
                logger.error("  ❌ Failed to upload %s: %s", f["local_path"], e)

    logger.info("")
    if dry_run:
        logger.info("📋 Would upload %d files (%.1f MB total)", len(files), total_size / 1024 / 1024)
    else:
        logger.info("✅ Uploaded %d/%d files (%.1f MB total)", uploaded, len(files), total_size / 1024 / 1024)


def main():
    parser = argparse.ArgumentParser(description="Upload ML models and data to S3")
    parser.add_argument("--dry-run", action="store_true", help="Preview without uploading")
    parser.add_argument("--models", action="store_true", help="Upload models only")
    parser.add_argument("--data", action="store_true", help="Upload data only")
    args = parser.parse_args()

    # Default: upload both
    include_models = args.models or (not args.models and not args.data)
    include_data = args.data or (not args.models and not args.data)

    logger.info("🚀 AI Checker — S3 Upload Utility")
    logger.info("=" * 50)

    files = get_files_to_upload(include_models, include_data)

    if not files:
        logger.warning("No files found to upload!")
        return

    logger.info("Found %d files to upload:", len(files))
    upload_to_s3(files, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
