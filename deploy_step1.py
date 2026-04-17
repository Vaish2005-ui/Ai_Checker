"""Deploy Step 1: Create DynamoDB tables and S3 buckets"""
import boto3, os
from dotenv import load_dotenv
load_dotenv()

key = os.getenv("AWS_ACCESS_KEY_ID")
secret = os.getenv("AWS_SECRET_ACCESS_KEY")
region = "us-east-1"

# DynamoDB
print("=== Creating DynamoDB Tables ===")
db = boto3.client("dynamodb", region_name=region, aws_access_key_id=key, aws_secret_access_key=secret)

tables = {
    "startup_companies": "company_id",
    "startup_users": "email",
    "startup_invites": "token",
    "startup_departments": "department_id",
}

for name, pk in tables.items():
    try:
        db.create_table(
            TableName=name,
            KeySchema=[{"AttributeName": pk, "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": pk, "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST"
        )
        print(f"  Created: {name}")
    except Exception as e:
        if "ResourceInUseException" in str(e):
            print(f"  Exists: {name}")
        else:
            print(f"  Error: {e}")

# S3
print("\n=== Creating S3 Buckets ===")
s3 = boto3.client("s3", region_name=region, aws_access_key_id=key, aws_secret_access_key=secret)

for bucket in ["ai-checker-models-v2", "ai-checker-data-v2", "ai-checker-frontend-v2"]:
    try:
        s3.create_bucket(Bucket=bucket)
        print(f"  Created: {bucket}")
    except Exception as e:
        if "BucketAlreadyOwnedByYou" in str(e):
            print(f"  Exists: {bucket}")
        else:
            print(f"  Error: {e}")

# Enable static hosting on frontend bucket
s3.put_public_access_block(
    Bucket="ai-checker-frontend-v2",
    PublicAccessBlockConfiguration={
        "BlockPublicAcls": False, "IgnorePublicAcls": False,
        "BlockPublicPolicy": False, "RestrictPublicBuckets": False
    }
)
s3.put_bucket_website(
    Bucket="ai-checker-frontend-v2",
    WebsiteConfiguration={
        "IndexDocument": {"Suffix": "index.html"},
        "ErrorDocument": {"Key": "index.html"}
    }
)

import json
policy = json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "PublicRead", "Effect": "Allow",
        "Principal": "*", "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::ai-checker-frontend-v2/*"
    }]
})
s3.put_bucket_policy(Bucket="ai-checker-frontend-v2", Policy=policy)
print("  Frontend bucket: static hosting enabled + public")

print("\n=== Step 1 Complete ===")
print("Frontend URL: http://ai-checker-frontend-v2.s3-website-us-east-1.amazonaws.com")
