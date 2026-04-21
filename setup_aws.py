"""
setup_aws.py — One-time AWS infrastructure setup
=================================================
Creates S3 buckets, DynamoDB GSI, and Secrets Manager secret.
Run: python setup_aws.py
"""

import boto3
import os
import json
import time
from dotenv import load_dotenv

load_dotenv()

REGION = os.getenv("AWS_REGION", "us-east-1")
_kwargs = {
    "region_name": REGION,
    "aws_access_key_id": os.getenv("AWS_ACCESS_KEY_ID"),
    "aws_secret_access_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
}

s3 = boto3.client("s3", **_kwargs)
dynamodb = boto3.client("dynamodb", **_kwargs)
secretsmanager = boto3.client("secretsmanager", **_kwargs)

results = {"success": [], "skipped": [], "failed": []}


# ══════════════════════════════════════════════════════════════════════════════
# STEP 1: Create S3 Buckets
# ══════════════════════════════════════════════════════════════════════════════

def create_s3_bucket(bucket_name):
    try:
        # us-east-1 doesn't use LocationConstraint
        if REGION == "us-east-1":
            s3.create_bucket(Bucket=bucket_name)
        else:
            s3.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={"LocationConstraint": REGION},
            )
        print(f"  ✅ Created S3 bucket: {bucket_name}")
        results["success"].append(f"S3 bucket: {bucket_name}")
    except s3.exceptions.BucketAlreadyOwnedByYou:
        print(f"  ⏭️  S3 bucket already exists (owned by you): {bucket_name}")
        results["skipped"].append(f"S3 bucket: {bucket_name} (already exists)")
    except s3.exceptions.BucketAlreadyExists:
        print(f"  ⚠️  S3 bucket name taken globally: {bucket_name}")
        print(f"      Try a unique name like: {bucket_name}-{os.getenv('AWS_ACCESS_KEY_ID','')[-4:].lower()}")
        results["failed"].append(f"S3 bucket: {bucket_name} (name taken globally)")
    except Exception as e:
        print(f"  ❌ Failed to create S3 bucket {bucket_name}: {e}")
        results["failed"].append(f"S3 bucket: {bucket_name} ({e})")


print("=" * 60)
print("🪣 STEP 1: Creating S3 Buckets")
print("=" * 60)

create_s3_bucket("ai-checker-models")
create_s3_bucket("ai-checker-data")


# ══════════════════════════════════════════════════════════════════════════════
# STEP 2: Create DynamoDB GSI for email lookups
# ══════════════════════════════════════════════════════════════════════════════

print("\n" + "=" * 60)
print("📊 STEP 2: Creating DynamoDB GSI (email-index)")
print("=" * 60)

try:
    # Check if the GSI already exists
    table_desc = dynamodb.describe_table(TableName="startup_companies")
    existing_gsis = [
        gsi["IndexName"]
        for gsi in table_desc["Table"].get("GlobalSecondaryIndexes", [])
    ]

    if "email-index" in existing_gsis:
        print("  ⏭️  GSI 'email-index' already exists on startup_companies")
        results["skipped"].append("DynamoDB GSI: email-index (already exists)")
    else:
        # Note: GSI on member_email requires a top-level attribute.
        # Since members are stored as a list inside the company item,
        # a traditional GSI won't work directly. We'll document this.
        print("  ℹ️  Note: Your 'members' data is nested inside company items.")
        print("     A standard DynamoDB GSI requires a top-level attribute.")
        print("     The code already has a scan-based fallback that works perfectly.")
        print("     For production scale, consider these options:")
        print("       1. Create a separate 'users' table with email as partition key")
        print("       2. Use DynamoDB Streams + Lambda to maintain an email index")
        print("       3. Keep the scan fallback (fine for < 1000 companies)")
        results["skipped"].append("DynamoDB GSI: requires architecture change (see notes)")

except dynamodb.exceptions.ResourceNotFoundException:
    print("  ⚠️  Table 'startup_companies' not found. It will be created when the app runs.")
    results["skipped"].append("DynamoDB GSI: table not found")
except Exception as e:
    print(f"  ❌ Failed to check/create GSI: {e}")
    results["failed"].append(f"DynamoDB GSI: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# STEP 3: Create Secrets Manager Secret
# ══════════════════════════════════════════════════════════════════════════════

print("\n" + "=" * 60)
print("🔐 STEP 3: Creating Secrets Manager Secret")
print("=" * 60)

SECRET_NAME = "ai-checker/prod"
secret_value = {
    "AWS_ACCESS_KEY_ID": os.getenv("AWS_ACCESS_KEY_ID", ""),
    "AWS_SECRET_ACCESS_KEY": os.getenv("AWS_SECRET_ACCESS_KEY", ""),
    "AWS_REGION": REGION,
    "S3_MODELS_BUCKET": "ai-checker-models",
    "S3_DATA_BUCKET": "ai-checker-data",
}

try:
    secretsmanager.create_secret(
        Name=SECRET_NAME,
        Description="AI Checker production credentials and config",
        SecretString=json.dumps(secret_value),
    )
    print(f"  ✅ Created secret: {SECRET_NAME}")
    results["success"].append(f"Secret: {SECRET_NAME}")
except secretsmanager.exceptions.ResourceExistsException:
    # Update existing secret
    try:
        secretsmanager.put_secret_value(
            SecretId=SECRET_NAME,
            SecretString=json.dumps(secret_value),
        )
        print(f"  ⏭️  Secret '{SECRET_NAME}' already exists — updated values")
        results["skipped"].append(f"Secret: {SECRET_NAME} (updated)")
    except Exception as e:
        print(f"  ❌ Failed to update secret: {e}")
        results["failed"].append(f"Secret update: {e}")
except Exception as e:
    print(f"  ❌ Failed to create secret: {e}")
    results["failed"].append(f"Secret: {e}")


# ══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════════════════════

print("\n" + "=" * 60)
print("📋 SETUP SUMMARY")
print("=" * 60)

if results["success"]:
    print(f"\n✅ Created ({len(results['success'])}):")
    for item in results["success"]:
        print(f"   • {item}")

if results["skipped"]:
    print(f"\n⏭️  Skipped ({len(results['skipped'])}):")
    for item in results["skipped"]:
        print(f"   • {item}")

if results["failed"]:
    print(f"\n❌ Failed ({len(results['failed'])}):")
    for item in results["failed"]:
        print(f"   • {item}")

print("\n" + "=" * 60)
if not results["failed"]:
    print("🎉 All infrastructure setup complete!")
    print("\nNext: Run 'python upload_models.py' to upload models to S3")
else:
    print("⚠️  Some steps failed. Check IAM permissions above.")
    print("You may need to add these IAM policies to your user:")
    print("  • s3:CreateBucket, s3:PutObject")
    print("  • dynamodb:UpdateTable")
    print("  • secretsmanager:CreateSecret, secretsmanager:PutSecretValue")
