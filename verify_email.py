"""
Verify an email address in SES so you can send invite emails to them.
Usage: python verify_email.py someone@example.com
"""
import sys, boto3, os
from dotenv import load_dotenv
load_dotenv()

if len(sys.argv) < 2:
    print("Usage: python verify_email.py <email>")
    sys.exit(1)

email = sys.argv[1]
ses = boto3.client("ses", region_name="us-east-1",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"))

ses.verify_email_identity(EmailAddress=email)
print(f"Verification email sent to {email}")
print(f"They need to click the link in the email from AWS to get verified.")
print(f"After that, you can invite them from the dashboard.")
