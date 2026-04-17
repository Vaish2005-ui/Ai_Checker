"""Check all remaining AWS resources"""
import boto3, os
from dotenv import load_dotenv
load_dotenv()

key = os.getenv("AWS_ACCESS_KEY_ID")
secret = os.getenv("AWS_SECRET_ACCESS_KEY")
region = "us-east-1"

print("=" * 50)
print("CHECKING REMAINING AWS RESOURCES")
print("=" * 50)

# 1. EC2
print("\n1. EC2 Instances:")
try:
    ec2 = boto3.client("ec2", region_name=region, aws_access_key_id=key, aws_secret_access_key=secret)
    r = ec2.describe_instances()
    for res in r["Reservations"]:
        for inst in res["Instances"]:
            state = inst["State"]["Name"]
            if state != "terminated":
                print(f"   ACTIVE: {inst['InstanceId']} - {state} - {inst.get('PublicIpAddress','no IP')}")
            else:
                print(f"   terminated: {inst['InstanceId']}")
except Exception as e:
    print(f"   Error: {e}")

# 2. DynamoDB
print("\n2. DynamoDB Tables:")
try:
    db = boto3.client("dynamodb", region_name=region, aws_access_key_id=key, aws_secret_access_key=secret)
    tables = db.list_tables()["TableNames"]
    if tables:
        for t in tables:
            print(f"   EXISTS: {t}")
    else:
        print("   None - all deleted")
except Exception as e:
    print(f"   Error: {e}")

# 3. S3
print("\n3. S3 Buckets:")
try:
    s3 = boto3.client("s3", region_name=region, aws_access_key_id=key, aws_secret_access_key=secret)
    buckets = s3.list_buckets()["Buckets"]
    if buckets:
        for b in buckets:
            print(f"   EXISTS: {b['Name']}")
    else:
        print("   None - all deleted")
except Exception as e:
    print(f"   No permission to list (check console)")

# 4. CloudFront
print("\n4. CloudFront Distributions:")
try:
    cf = boto3.client("cloudfront", region_name=region, aws_access_key_id=key, aws_secret_access_key=secret)
    dists = cf.list_distributions()
    items = dists.get("DistributionList", {}).get("Items", [])
    if items:
        for d in items:
            print(f"   EXISTS: {d['Id']} - {d['DomainName']} - Enabled={d['Enabled']}")
    else:
        print("   None - all deleted")
except Exception as e:
    print(f"   No permission to list (check console)")

# 5. SNS
print("\n5. SNS Topics:")
try:
    sns = boto3.client("sns", region_name=region, aws_access_key_id=key, aws_secret_access_key=secret)
    topics = sns.list_topics()["Topics"]
    if topics:
        for t in topics:
            print(f"   EXISTS: {t['TopicArn']}")
    else:
        print("   None - all deleted")
except Exception as e:
    print(f"   Error: {e}")

# 6. Amplify
print("\n6. Amplify Apps:")
try:
    amp = boto3.client("amplify", region_name=region, aws_access_key_id=key, aws_secret_access_key=secret)
    apps = amp.list_apps()["apps"]
    if apps:
        for a in apps:
            print(f"   EXISTS: {a['name']} - {a['appId']}")
    else:
        print("   None - all deleted")
except Exception as e:
    print(f"   No permission to list (check console)")

print("\n" + "=" * 50)
