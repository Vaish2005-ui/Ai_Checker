import requests
import json

API = "https://dj5sgnzw43nd1.cloudfront.net"

# Test invite
res = requests.post(f"{API}/company/invite", json={
    "company_id": "test",  # we'll get the real one
    "department": "hr",
    "email": "kaushaltri2004@gmail.com",
    "role": "team_leader"
})
print(f"Status: {res.status_code}")
print(f"Response: {res.text}")
