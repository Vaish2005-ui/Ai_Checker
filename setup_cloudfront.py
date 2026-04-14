"""
setup_cloudfront.py — Create a CloudFront HTTPS proxy for the EC2 backend
==========================================================================
Solves: Mixed Content error (Amplify HTTPS → EC2 HTTP)
CloudFront gives us a free HTTPS URL that proxies to the HTTP backend.

Usage: python setup_cloudfront.py
"""

import boto3
import os
import json
import time
from dotenv import load_dotenv

load_dotenv()

REGION = os.getenv("AWS_REGION", "us-east-1")
EC2_PUBLIC_IP = "54.158.35.106"
EC2_PORT = 8000

cf = boto3.client("cloudfront",
    region_name=REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)


def check_existing():
    """Check if we already have a distribution for this EC2."""
    dists = cf.list_distributions()
    items = dists.get("DistributionList", {}).get("Items", [])
    for d in items:
        origins = d.get("Origins", {}).get("Items", [])
        for o in origins:
            if EC2_PUBLIC_IP in o.get("DomainName", ""):
                return d["Id"], d["DomainName"]
    return None, None


def create_distribution():
    """Create CloudFront distribution pointing to EC2 backend."""
    print("Creating CloudFront distribution...")
    print(f"  Origin: http://{EC2_PUBLIC_IP}:{EC2_PORT}")

    caller_ref = f"ai-checker-api-{int(time.time())}"

    config = {
        "CallerReference": caller_ref,
        "Comment": "AI Checker API - HTTPS proxy for EC2 backend",
        "Enabled": True,
        "Origins": {
            "Quantity": 1,
            "Items": [
                {
                    "Id": "ec2-api-origin",
                    "DomainName": EC2_PUBLIC_IP,
                    "CustomOriginConfig": {
                        "HTTPPort": EC2_PORT,
                        "HTTPSPort": 443,
                        "OriginProtocolPolicy": "http-only",
                        "OriginSslProtocols": {
                            "Quantity": 1,
                            "Items": ["TLSv1.2"],
                        },
                    },
                }
            ],
        },
        "DefaultCacheBehavior": {
            "TargetOriginId": "ec2-api-origin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "AllowedMethods": {
                "Quantity": 7,
                "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
                "CachedMethods": {
                    "Quantity": 2,
                    "Items": ["GET", "HEAD"],
                },
            },
            "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",  # CachingDisabled
            "OriginRequestPolicyId": "216adef6-5c7f-47e4-b989-5492eafa07d3",  # AllViewer
            "Compress": True,
            "ForwardedValues": {
                "QueryString": True,
                "Cookies": {"Forward": "all"},
                "Headers": {
                    "Quantity": 5,
                    "Items": [
                        "Content-Type",
                        "Authorization",
                        "Accept",
                        "Origin",
                        "Referer",
                    ],
                },
            },
            "MinTTL": 0,
            "DefaultTTL": 0,
            "MaxTTL": 0,
        },
        "PriceClass": "PriceClass_100",  # Cheapest: US/Canada/Europe only
        "ViewerCertificate": {
            "CloudFrontDefaultCertificate": True,
        },
    }

    try:
        response = cf.create_distribution(DistributionConfig=config)
        dist = response["Distribution"]
        dist_id = dist["Id"]
        domain = dist["DomainName"]

        print(f"\n  ✅ CloudFront Distribution Created!")
        print(f"  Distribution ID: {dist_id}")
        print(f"  HTTPS URL:       https://{domain}")
        print(f"  Status:          {dist['Status']}")
        print(f"\n  ⏳ Takes 5-10 minutes to fully deploy globally")
        print(f"\n  📝 UPDATE your Amplify env var:")
        print(f"     NEXT_PUBLIC_API_URL = https://{domain}")

        return dist_id, domain
    except Exception as e:
        print(f"  ❌ Error: {e}")
        raise


def main():
    print("=" * 60)
    print("🔒 CloudFront HTTPS Proxy Setup")
    print("   Fixes: Mixed Content (HTTPS frontend → HTTP backend)")
    print("=" * 60)

    # Check if already exists
    dist_id, domain = check_existing()
    if dist_id:
        print(f"\n  Distribution already exists!")
        print(f"  ID: {dist_id}")
        print(f"  HTTPS URL: https://{domain}")
        print(f"\n  📝 Set in Amplify:")
        print(f"     NEXT_PUBLIC_API_URL = https://{domain}")
        return

    dist_id, domain = create_distribution()

    # Update .env.production
    env_path = os.path.join(os.path.dirname(__file__), "dashboard", ".env.production")
    with open(env_path, "w") as f:
        f.write(f"NEXT_PUBLIC_API_URL=https://{domain}\n")
    print(f"\n  Updated dashboard/.env.production")


if __name__ == "__main__":
    main()
