"""Delete all AI Checker resources from AWS"""
import boto3, os
from dotenv import load_dotenv
load_dotenv()

key = os.getenv("AWS_ACCESS_KEY_ID")
secret = os.getenv("AWS_SECRET_ACCESS_KEY")
region = "us-east-1"

print("=" * 50)
print("DELETING ALL AI CHECKER AWS RESOURCES")
print("=" * 50)

# 1. DynamoDB tables
print("\n1. DynamoDB tables...")
try:
    db = boto3.client("dynamodb", region_name=region, aws_access_key_id=key, aws_secret_access_key=secret)
    tables = db.list_tables()["TableNames"]
    for t in tables:
        db.delete_table(TableName=t)
        print(f"   Deleted: {t}")
    if not tables:
        print("   No tables found")
except Exception as e:
    print(f"   Error: {e}")

# 2. S3 buckets - empty and delete
print("\n2. S3 buckets...")
try:
    s3 = boto3.client("s3", region_name=region, aws_access_key_id=key, aws_secret_access_key=secret)
    buckets = s3.list_buckets()["Buckets"]
    for b in buckets:
        name = b["Name"]
        try:
            # Empty bucket first
            objs = s3.list_objects_v2(Bucket=name)
            if "Contents" in objs:
                for obj in objs["Contents"]:
                    s3.delete_object(Bucket=name, Key=obj["Key"])
            s3.delete_bucket(Bucket=name)
            print(f"   Deleted: {name}")
        except Exception as e:
            print(f"   {name}: {e}")
    if not buckets:
        print("   No buckets found")
except Exception as e:
    print(f"   Error: {e}")

# 3. SNS topics
print("\n3. SNS topics...")
try:
    sns = boto3.client("sns", region_name=region, aws_access_key_id=key, aws_secret_access_key=secret)
    topics = sns.list_topics()["Topics"]
    for t in topics:
        sns.delete_topic(TopicArn=t["TopicArn"])
        print(f"   Deleted: {t['TopicArn']}")
    if not topics:
        print("   No topics found")
except Exception as e:
    print(f"   Error: {e}")

# 4. SES identities
print("\n4. SES identities...")
try:
    ses = boto3.client("ses", region_name=region, aws_access_key_id=key, aws_secret_access_key=secret)
    ids = ses.list_identities()["Identities"]
    for i in ids:
        ses.delete_identity(Identity=i)
        print(f"   Deleted: {i}")
    if not ids:
        print("   No identities found")
except Exception as e:
    print(f"   Error: {e}")

print("\n" + "=" * 50)
print("DONE! Manual cleanup needed:")
print("=" * 50)
print("Go to AWS Console and delete:")
print("  - EC2: Terminate instance i-0cac7b9cb969370c6")
print("  - CloudFront: Disable & delete distribution")
print("  - Amplify: Delete app")
print("  - IAM: Delete user 'startup-risk-app' if not needed")
