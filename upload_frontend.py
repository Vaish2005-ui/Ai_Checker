"""Upload built frontend to S3"""
import boto3, os, mimetypes
from dotenv import load_dotenv
load_dotenv()

s3 = boto3.client("s3", region_name="us-east-1",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"))

bucket = "ai-checker-frontend-v2"
out_dir = os.path.join(os.path.dirname(__file__), "dashboard", "out")

count = 0
for root, dirs, files in os.walk(out_dir):
    for fname in files:
        local = os.path.join(root, fname)
        key = os.path.relpath(local, out_dir).replace("\\", "/")
        
        content_type, _ = mimetypes.guess_type(local)
        if not content_type:
            content_type = "application/octet-stream"
        if fname.endswith(".html"):
            content_type = "text/html"
        elif fname.endswith(".js"):
            content_type = "application/javascript"
        elif fname.endswith(".css"):
            content_type = "text/css"
        elif fname.endswith(".json"):
            content_type = "application/json"
        elif fname.endswith(".svg"):
            content_type = "image/svg+xml"
        
        s3.upload_file(local, bucket, key,
            ExtraArgs={"ContentType": content_type})
        count += 1
        if count % 20 == 0:
            print(f"  Uploaded {count} files...")

print(f"\nDone! Uploaded {count} files to s3://{bucket}")
print(f"URL: http://{bucket}.s3-website-us-east-1.amazonaws.com")
