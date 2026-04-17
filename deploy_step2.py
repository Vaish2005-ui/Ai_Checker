"""Deploy Step 2: Create EC2 instance with security group and key pair"""
import boto3, os, time
from dotenv import load_dotenv
load_dotenv()

key = os.getenv("AWS_ACCESS_KEY_ID")
secret = os.getenv("AWS_SECRET_ACCESS_KEY")
region = "us-east-1"

ec2 = boto3.client("ec2", region_name=region, aws_access_key_id=key, aws_secret_access_key=secret)

# 1. Create security group
print("=== Creating Security Group ===")
try:
    sg = ec2.create_security_group(
        GroupName="ai-checker-sg",
        Description="AI Checker backend security group"
    )
    sg_id = sg["GroupId"]
    print(f"  Created: {sg_id}")
    
    # Allow SSH, HTTP, HTTPS, and API port
    ec2.authorize_security_group_ingress(
        GroupId=sg_id,
        IpPermissions=[
            {"IpProtocol": "tcp", "FromPort": 22, "ToPort": 22, "IpRanges": [{"CidrIp": "0.0.0.0/0"}]},
            {"IpProtocol": "tcp", "FromPort": 80, "ToPort": 80, "IpRanges": [{"CidrIp": "0.0.0.0/0"}]},
            {"IpProtocol": "tcp", "FromPort": 443, "ToPort": 443, "IpRanges": [{"CidrIp": "0.0.0.0/0"}]},
            {"IpProtocol": "tcp", "FromPort": 8000, "ToPort": 8000, "IpRanges": [{"CidrIp": "0.0.0.0/0"}]},
        ]
    )
    print("  Ingress rules added")
except Exception as e:
    if "Duplicate" in str(e):
        sgs = ec2.describe_security_groups(GroupNames=["ai-checker-sg"])
        sg_id = sgs["SecurityGroups"][0]["GroupId"]
        print(f"  Exists: {sg_id}")
    else:
        print(f"  Error: {e}")
        sg_id = None

# 2. Create key pair
print("\n=== Creating Key Pair ===")
key_file = os.path.join(os.path.dirname(__file__), "ai-checker-key-v2.pem")
try:
    kp = ec2.create_key_pair(KeyName="ai-checker-key-v2")
    with open(key_file, "w") as f:
        f.write(kp["KeyMaterial"])
    os.chmod(key_file, 0o400)
    print(f"  Created: ai-checker-key-v2 -> {key_file}")
except Exception as e:
    if "Duplicate" in str(e):
        print(f"  Exists: ai-checker-key-v2")
    else:
        print(f"  Error: {e}")

# 3. Launch EC2 instance (Amazon Linux 2023 free tier)
print("\n=== Launching EC2 Instance ===")
try:
    # Get latest Amazon Linux 2023 AMI
    amis = ec2.describe_images(
        Owners=["amazon"],
        Filters=[
            {"Name": "name", "Values": ["al2023-ami-2023*-x86_64"]},
            {"Name": "state", "Values": ["available"]},
        ]
    )
    ami_id = sorted(amis["Images"], key=lambda x: x["CreationDate"], reverse=True)[0]["ImageId"]
    print(f"  AMI: {ami_id}")
    
    user_data = """#!/bin/bash
yum update -y
yum install -y python3.11 python3.11-pip nginx git
pip3.11 install fastapi uvicorn boto3 python-dotenv bcrypt pyjwt requests python-multipart
mkdir -p /opt/ai-checker
"""
    
    instance = ec2.run_instances(
        ImageId=ami_id,
        InstanceType="t2.micro",
        KeyName="ai-checker-key-v2",
        SecurityGroupIds=[sg_id],
        MinCount=1, MaxCount=1,
        UserData=user_data,
        TagSpecifications=[{
            "ResourceType": "instance",
            "Tags": [{"Key": "Name", "Value": "AI-Checker-Backend"}]
        }]
    )
    instance_id = instance["Instances"][0]["InstanceId"]
    print(f"  Launched: {instance_id}")
    
    # Wait for running
    print("  Waiting for instance to start...")
    waiter = ec2.get_waiter("instance_running")
    waiter.wait(InstanceIds=[instance_id])
    
    # Get public IP
    desc = ec2.describe_instances(InstanceIds=[instance_id])
    public_ip = desc["Reservations"][0]["Instances"][0]["PublicIpAddress"]
    print(f"  Public IP: {public_ip}")
    
    # Save for next steps
    with open("ec2_info.txt", "w") as f:
        f.write(f"INSTANCE_ID={instance_id}\n")
        f.write(f"PUBLIC_IP={public_ip}\n")
    
    print(f"\n=== Step 2 Complete ===")
    print(f"Instance: {instance_id}")
    print(f"IP: {public_ip}")
    print(f"Key: {key_file}")
    print("Wait 2-3 minutes for user_data to finish installing packages")
    
except Exception as e:
    print(f"  Error: {e}")
