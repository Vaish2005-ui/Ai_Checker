"""
setup_sns.py — Create SNS topic and subscribe your email
=========================================================
Run: python setup_sns.py your-email@gmail.com
"""

import sys
import os
from dotenv import load_dotenv
from sns_notifications import setup_sns_topic, subscribe_email

load_dotenv()


def main():
    if len(sys.argv) < 2:
        print("Usage: python setup_sns.py <your-email>")
        print("  Example: python setup_sns.py admin@mycompany.com")
        sys.exit(1)

    email = sys.argv[1]

    print("=" * 50)
    print("📧 AWS SNS Notification Setup")
    print("=" * 50)

    # Create topic
    arn = setup_sns_topic()
    if not arn:
        print("\n❌ Failed to create SNS topic. Check IAM permissions.")
        sys.exit(1)

    print(f"\n✅ Topic ARN: {arn}")

    # Subscribe email
    subscribe_email(arn, email)
    print(f"\n📧 Subscription request sent to: {email}")
    print("   → Check your email and CONFIRM the subscription!")

    # Show env vars to set
    print(f"\n📝 Add these to your EC2 .env file:")
    print(f"   SNS_TOPIC_ARN={arn}")
    print(f"   SNS_ENABLED=true")

    # Update local .env
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            content = f.read()
        if "SNS_TOPIC_ARN" not in content:
            with open(env_path, "a") as f:
                f.write(f"\nSNS_TOPIC_ARN={arn}\n")
                f.write("SNS_ENABLED=true\n")
            print("\n✅ Updated local .env file")
    
    print("\n🎉 Done! You'll receive email notifications for:")
    print("   • Login attempts (success & failure)")
    print("   • High risk detections (>70%)")
    print("   • New company registrations")
    print("   • Department changes")
    print("   • Team invites")


if __name__ == "__main__":
    main()
