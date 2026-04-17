import boto3, os
from dotenv import load_dotenv
load_dotenv()

ses = boto3.client("ses", region_name="us-east-1",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"))

ses.send_email(
    Source="vaishnavifalle1@gmail.com",
    Destination={"ToAddresses": ["kaushaltri2004@gmail.com"]},
    Message={
        "Subject": {"Data": "You're Invited to AI Checker!"},
        "Body": {
            "Text": {"Data": (
                "Hi there!\n\n"
                "You've been invited to join AI Checker as a team leader.\n\n"
                "Click here to accept: https://main.d2nubdrvkwvv8s.amplifyapp.com/join\n\n"
                "-- AI Checker Platform"
            )},
            "Html": {"Data": (
                "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'>"
                "<div style='background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px;border-radius:16px 16px 0 0;text-align:center;'>"
                "<h1 style='color:white;margin:0;font-size:24px;'>You're Invited!</h1></div>"
                "<div style='background:#fff;padding:32px;border:1px solid #e2e8f0;border-radius:0 0 16px 16px;'>"
                "<p style='font-size:16px;color:#334155;'>You've been invited to join <strong>AI Checker</strong> as a <strong>team leader</strong>.</p>"
                "<a href='https://main.d2nubdrvkwvv8s.amplifyapp.com/join' style='display:inline-block;background:#6366f1;color:white;padding:14px 32px;"
                "border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;margin:20px 0;'>Accept Invitation</a>"
                "<p style='font-size:13px;color:#94a3b8;margin-top:24px;'>AI Checker Platform</p>"
                "</div></div>"
            )},
        },
    },
)
print("Email sent successfully to kaushaltri2004@gmail.com!")
