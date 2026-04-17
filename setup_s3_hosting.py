import boto3, os, json
from dotenv import load_dotenv
load_dotenv()

key = os.getenv("AWS_ACCESS_KEY_ID")
secret = os.getenv("AWS_SECRET_ACCESS_KEY")
s3 = boto3.client("s3", region_name="us-east-1", aws_access_key_id=key, aws_secret_access_key=secret)

bucket = "ai-checker-frontend"

# Create bucket
try:
    s3.create_bucket(Bucket=bucket)
    print(f"Created bucket: {bucket}")
except Exception as e:
    if "BucketAlreadyOwnedByYou" in str(e):
        print(f"Bucket already exists: {bucket}")
    else:
        print(f"Error: {e}")

# Disable block public access first
s3.put_public_access_block(
    Bucket=bucket,
    PublicAccessBlockConfiguration={
        "BlockPublicAcls": False,
        "IgnorePublicAcls": False,
        "BlockPublicPolicy": False,
        "RestrictPublicBuckets": False
    }
)
print("Public access block disabled")

# Enable static website hosting
s3.put_bucket_website(
    Bucket=bucket,
    WebsiteConfiguration={
        "IndexDocument": {"Suffix": "index.html"},
        "ErrorDocument": {"Key": "index.html"}
    }
)
print("Static hosting enabled")

# Make bucket public readable
policy = json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "PublicRead",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": f"arn:aws:s3:::{bucket}/*"
    }]
})
s3.put_bucket_policy(Bucket=bucket, Policy=policy)
print("Public access policy set")

print(f"\nWebsite URL: http://{bucket}.s3-website-us-east-1.amazonaws.com")
print("Now upload the built frontend files!")
