"""Redeploy backend to EC2 — re-upload code to S3 and restart the service."""
import boto3
import os
import io
import zipfile
from dotenv import load_dotenv

load_dotenv()

REGION = os.getenv("AWS_REGION", "us-east-1")
_kwargs = {
    "region_name": REGION,
    "aws_access_key_id": os.getenv("AWS_ACCESS_KEY_ID"),
    "aws_secret_access_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
}
s3 = boto3.client("s3", **_kwargs)
ssm = boto3.client("ssm", **_kwargs)
ec2 = boto3.client("ec2", **_kwargs)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
S3_BUCKET = "ai-checker-data"
INSTANCE_ID = "i-0cac7b9cb969370c6"


def package_and_upload():
    print("1. Packaging backend code...")
    zip_buffer = io.BytesIO()
    include_files = [
        "api.py", "database.py", "aws_config.py", "logging_config.py",
        "requirements.txt",
    ]
    include_dirs = ["src", "models", "data/processed"]

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for fname in include_files:
            fpath = os.path.join(BASE_DIR, fname)
            if os.path.exists(fpath):
                zf.write(fpath, fname)
        for dname in include_dirs:
            dpath = os.path.join(BASE_DIR, dname)
            if os.path.isdir(dpath):
                for root, dirs, files in os.walk(dpath):
                    dirs[:] = [d for d in dirs if d != "__pycache__"]
                    for f in files:
                        full = os.path.join(root, f)
                        arcname = os.path.relpath(full, BASE_DIR)
                        zf.write(full, arcname)

    zip_buffer.seek(0)
    s3.put_object(Bucket=S3_BUCKET, Key="deploy/backend.zip", Body=zip_buffer.getvalue())
    print(f"   Uploaded to s3://{S3_BUCKET}/deploy/backend.zip ({len(zip_buffer.getvalue()) / 1024:.0f} KB)")


def restart_service():
    print("2. Restarting service on EC2...")
    print(f"   Instance: {INSTANCE_ID}")
    
    # Use SSM to send command to the EC2 instance
    try:
        response = ssm.send_command(
            InstanceIds=[INSTANCE_ID],
            DocumentName="AWS-RunShellScript",
            Parameters={
                "commands": [
                    "cd /opt/ai-checker",
                    "aws s3 cp s3://ai-checker-data/deploy/backend.zip ./backend.zip",
                    "unzip -o backend.zip",
                    "systemctl restart ai-checker",
                    "echo 'Service restarted successfully'",
                ],
            },
        )
        cmd_id = response["Command"]["CommandId"]
        print(f"   SSM Command sent: {cmd_id}")
        print("   Service will restart in ~10 seconds")
    except Exception as e:
        print(f"   SSM not available: {e}")
        print(f"\n   MANUAL RESTART: SSH into EC2 and run:")
        print(f"   ssh -i ai-checker-key.pem ec2-user@54.158.35.106")
        print(f"   cd /opt/ai-checker && aws s3 cp s3://ai-checker-data/deploy/backend.zip . && unzip -o backend.zip && sudo systemctl restart ai-checker")


if __name__ == "__main__":
    package_and_upload()
    restart_service()
    print("\n Done! API will be live in ~10 seconds.")
