"""
deploy_aws.py — Deploy Ai_Checker to AWS (EC2 + Amplify)
=========================================================
1. Packages backend code → uploads to S3
2. Launches EC2 t2.micro with auto-setup via user data
3. Creates Amplify app for the Next.js frontend

Usage: python deploy_aws.py
"""

import boto3
import os
import json
import time
import zipfile
import io
from dotenv import load_dotenv

load_dotenv()

REGION = os.getenv("AWS_REGION", "us-east-1")
_kwargs = {
    "region_name": REGION,
    "aws_access_key_id": os.getenv("AWS_ACCESS_KEY_ID"),
    "aws_secret_access_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
}

ec2_client = boto3.client("ec2", **_kwargs)
ec2_resource = boto3.resource("ec2", **_kwargs)
s3 = boto3.client("s3", **_kwargs)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
S3_BUCKET = os.getenv("S3_DATA_BUCKET", "ai-checker-data")


# ══════════════════════════════════════════════════════════════════════════════
# STEP 1: Package and upload backend code to S3
# ══════════════════════════════════════════════════════════════════════════════

def package_backend():
    """Zip the backend code and upload to S3."""
    print("=" * 60)
    print("📦 STEP 1: Packaging backend code")
    print("=" * 60)

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
                print(f"  + {fname}")

        for dname in include_dirs:
            dpath = os.path.join(BASE_DIR, dname)
            if os.path.isdir(dpath):
                for root, dirs, files in os.walk(dpath):
                    # Skip __pycache__
                    dirs[:] = [d for d in dirs if d != "__pycache__"]
                    for f in files:
                        full = os.path.join(root, f)
                        arcname = os.path.relpath(full, BASE_DIR)
                        zf.write(full, arcname)
                        print(f"  + {arcname}")

    zip_buffer.seek(0)
    s3_key = "deploy/backend.zip"
    s3.put_object(Bucket=S3_BUCKET, Key=s3_key, Body=zip_buffer.getvalue())
    print(f"\n  Uploaded to s3://{S3_BUCKET}/{s3_key} ({len(zip_buffer.getvalue()) / 1024:.0f} KB)")
    return f"s3://{S3_BUCKET}/{s3_key}"


# ══════════════════════════════════════════════════════════════════════════════
# STEP 2: Create Security Group
# ══════════════════════════════════════════════════════════════════════════════

def create_security_group():
    """Create a security group allowing HTTP, HTTPS, SSH, and API traffic."""
    print("\n" + "=" * 60)
    print("🔒 STEP 2: Creating Security Group")
    print("=" * 60)

    sg_name = "ai-checker-api-sg"

    # Check if it already exists
    try:
        existing = ec2_client.describe_security_groups(
            Filters=[{"Name": "group-name", "Values": [sg_name]}]
        )
        if existing["SecurityGroups"]:
            sg_id = existing["SecurityGroups"][0]["GroupId"]
            print(f"  Security group already exists: {sg_id}")
            return sg_id
    except Exception:
        pass

    try:
        response = ec2_client.create_security_group(
            GroupName=sg_name,
            Description="AI Checker API - allows HTTP, HTTPS, SSH, API port",
        )
        sg_id = response["GroupId"]

        # Add inbound rules
        ec2_client.authorize_security_group_ingress(
            GroupId=sg_id,
            IpPermissions=[
                # SSH
                {"IpProtocol": "tcp", "FromPort": 22, "ToPort": 22,
                 "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "SSH"}]},
                # HTTP
                {"IpProtocol": "tcp", "FromPort": 80, "ToPort": 80,
                 "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "HTTP"}]},
                # HTTPS
                {"IpProtocol": "tcp", "FromPort": 443, "ToPort": 443,
                 "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "HTTPS"}]},
                # API port
                {"IpProtocol": "tcp", "FromPort": 8000, "ToPort": 8000,
                 "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "FastAPI"}]},
            ],
        )
        print(f"  Created security group: {sg_id}")
        return sg_id
    except Exception as e:
        print(f"  Error creating security group: {e}")
        raise


# ══════════════════════════════════════════════════════════════════════════════
# STEP 3: Create Key Pair
# ══════════════════════════════════════════════════════════════════════════════

def create_key_pair():
    """Create an EC2 key pair for SSH access."""
    print("\n" + "=" * 60)
    print("🔑 STEP 3: Creating Key Pair")
    print("=" * 60)

    key_name = "ai-checker-key"
    key_path = os.path.join(BASE_DIR, f"{key_name}.pem")

    # Check if key already exists
    try:
        ec2_client.describe_key_pairs(KeyNames=[key_name])
        print(f"  Key pair '{key_name}' already exists")
        if os.path.exists(key_path):
            print(f"  PEM file found: {key_path}")
        else:
            print(f"  ⚠️  PEM file not found locally. You'll need to use EC2 Instance Connect for SSH.")
        return key_name
    except ec2_client.exceptions.ClientError:
        pass

    try:
        response = ec2_client.create_key_pair(KeyName=key_name)
        with open(key_path, "w") as f:
            f.write(response["KeyMaterial"])
        # Set permissions (on Windows, just inform the user)
        print(f"  Created key pair: {key_name}")
        print(f"  PEM saved to: {key_path}")
        print(f"  ⚠️  Keep this file safe! You need it for SSH access.")
        return key_name
    except Exception as e:
        print(f"  Error: {e}")
        raise


# ══════════════════════════════════════════════════════════════════════════════
# STEP 4: Launch EC2 Instance
# ══════════════════════════════════════════════════════════════════════════════

def launch_ec2(sg_id, key_name, s3_zip_path):
    """Launch a t3.micro EC2 instance with the backend auto-configured."""
    print("\n" + "=" * 60)
    print("🖥️  STEP 4: Launching EC2 Instance (t3.micro)")
    print("=" * 60)

    # Check for existing instance with our tag
    existing = ec2_client.describe_instances(
        Filters=[
            {"Name": "tag:Name", "Values": ["ai-checker-api"]},
            {"Name": "instance-state-name", "Values": ["running", "pending"]},
        ]
    )
    for reservation in existing.get("Reservations", []):
        for inst in reservation.get("Instances", []):
            inst_id = inst["InstanceId"]
            public_ip = inst.get("PublicIpAddress", "pending...")
            print(f"  Instance already running: {inst_id} ({public_ip})")
            return inst_id, public_ip

    # User data script — runs on first boot
    user_data = f"""#!/bin/bash
set -ex

# Log everything
exec > /var/log/ai-checker-setup.log 2>&1

echo "===== AI Checker EC2 Setup ====="
date

# Update system
yum update -y
yum install -y python3.11 python3.11-pip unzip

# Create app directory
mkdir -p /opt/ai-checker
cd /opt/ai-checker

# Download backend code from S3
aws s3 cp s3://{S3_BUCKET}/deploy/backend.zip ./backend.zip
unzip -o backend.zip

# Install Python dependencies
pip3.11 install --no-cache-dir -r requirements.txt

# Create environment file
cat > .env << 'ENVFILE'
AWS_ACCESS_KEY_ID={os.getenv('AWS_ACCESS_KEY_ID')}
AWS_SECRET_ACCESS_KEY={os.getenv('AWS_SECRET_ACCESS_KEY')}
AWS_REGION={REGION}
S3_MODELS_BUCKET=ai-checker-models
S3_DATA_BUCKET=ai-checker-data
USE_S3_MODELS=true
USE_AWS_SECRETS=false
CLOUDWATCH_ENABLED=true
CLOUDWATCH_LOG_GROUP=/ai-checker/api
ENVIRONMENT=production
API_PORT=8000
ENVFILE

# Create systemd service
cat > /etc/systemd/system/ai-checker.service << 'SERVICEFILE'
[Unit]
Description=AI Checker FastAPI Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ai-checker
ExecStart=/usr/bin/python3.11 -m uvicorn api:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
SERVICEFILE

# Start service
systemctl daemon-reload
systemctl enable ai-checker
systemctl start ai-checker

echo "===== Setup Complete ====="
date
"""

    # Find latest Amazon Linux 2023 AMI
    images = ec2_client.describe_images(
        Owners=["amazon"],
        Filters=[
            {"Name": "name", "Values": ["al2023-ami-2023*-x86_64"]},
            {"Name": "state", "Values": ["available"]},
        ],
    )
    ami_id = sorted(images["Images"], key=lambda x: x["CreationDate"], reverse=True)[0]["ImageId"]
    print(f"  Using AMI: {ami_id} (Amazon Linux 2023)")

    # Launch instance
    instances = ec2_resource.create_instances(
        ImageId=ami_id,
        InstanceType="t3.micro",
        KeyName=key_name,
        MinCount=1,
        MaxCount=1,
        UserData=user_data,
        TagSpecifications=[{
            "ResourceType": "instance",
            "Tags": [
                {"Key": "Name", "Value": "ai-checker-api"},
                {"Key": "Project", "Value": "ai-checker"},
            ],
        }],
        # Ensure the instance gets a public IP
        NetworkInterfaces=[{
            "DeviceIndex": 0,
            "AssociatePublicIpAddress": True,
            "Groups": [sg_id],
        }],
    )

    instance = instances[0]
    print(f"  Launched instance: {instance.id}")
    print("  Waiting for instance to be running...")

    instance.wait_until_running()
    instance.reload()
    public_ip = instance.public_ip_address

    print(f"  ✅ Instance running!")
    print(f"  Public IP: {public_ip}")
    print(f"  API URL:   http://{public_ip}:8000")
    print(f"  SSH:       ssh -i {key_name}.pem ec2-user@{public_ip}")
    print(f"\n  ⏳ The API will be ready in ~3-5 minutes (installing dependencies)")

    return instance.id, public_ip


# ══════════════════════════════════════════════════════════════════════════════
# STEP 5: Create Amplify App for Frontend
# ══════════════════════════════════════════════════════════════════════════════

def setup_amplify_info(api_url):
    """Print instructions for Amplify setup."""
    print("\n" + "=" * 60)
    print("🌐 STEP 5: Frontend Deployment (AWS Amplify)")
    print("=" * 60)

    # Create .env.production for the frontend
    env_prod_path = os.path.join(BASE_DIR, "dashboard", ".env.production")
    with open(env_prod_path, "w") as f:
        f.write(f"NEXT_PUBLIC_API_URL={api_url}\n")
    print(f"  Created: dashboard/.env.production")
    print(f"  API_URL = {api_url}")

    print(f"""
  To deploy the frontend on AWS Amplify:

  1. Go to: https://console.aws.amazon.com/amplify
  2. Click "New app" → "Host web app"
  3. Connect your GitHub repo: Vaish2005-ui/Ai_Checker
  4. Set the app root to: dashboard
  5. Add environment variable:
     NEXT_PUBLIC_API_URL = {api_url}
  6. Use these build settings:

     version: 1
     frontend:
       phases:
         preBuild:
           commands:
             - npm ci
         build:
           commands:
             - npm run build
       artifacts:
         baseDirectory: .next
         files:
           - '**/*'
       cache:
         paths:
           - node_modules/**/*
           - .next/cache/**/*

  Amplify Free Tier: 1000 build min/month + 15GB served/month
""")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

def main():
    print("🚀 AI Checker — AWS Deployment")
    print("Backend: EC2 t2.micro (Free Tier)")
    print("Frontend: AWS Amplify (Free Tier)")
    print("=" * 60)

    # Step 1: Package backend
    s3_path = package_backend()

    # Step 2: Security group
    sg_id = create_security_group()

    # Step 3: Key pair
    key_name = create_key_pair()

    # Step 4: Launch EC2
    instance_id, public_ip = launch_ec2(sg_id, key_name, s3_path)

    # Step 5: Amplify setup info
    api_url = f"http://{public_ip}:8000"
    setup_amplify_info(api_url)

    # Summary
    print("=" * 60)
    print("📋 DEPLOYMENT SUMMARY")
    print("=" * 60)
    print(f"  EC2 Instance:  {instance_id}")
    print(f"  Public IP:     {public_ip}")
    print(f"  API URL:       {api_url}")
    print(f"  Health Check:  {api_url}/health")
    print(f"  SSH Key:       {key_name}.pem")
    print(f"  Frontend Env:  dashboard/.env.production")
    print()
    print("  ⏳ API takes ~3-5 min to come online (installing dependencies)")
    print(f"  💡 Test with: curl {api_url}/health")


if __name__ == "__main__":
    main()
