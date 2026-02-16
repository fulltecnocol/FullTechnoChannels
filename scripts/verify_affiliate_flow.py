import asyncio
import os
import sys
import httpx
import hmac
import hashlib
import time
import json
from datetime import datetime

# Ensure we can import shared modules
sys.path.append(os.getcwd())

API_URL = "http://localhost:8000"
WEBHOOK_SECRET = "test_secret"

def generate_signature(payload: bytes, secret: str) -> str:
    timestamp = int(time.time())
    signed_payload = f"{timestamp}.".encode() + payload
    signature = hmac.new(secret.encode(), signed_payload, hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={signature}"

async def verify_affiliate_flow():
    print("🚀 Starting Affiliate Flow Verification...")
    
    try:
        async with httpx.AsyncClient(base_url=API_URL, timeout=10.0) as client:
            timestamp = int(time.time())
            
            # --- 1. Register Referrer (Grandpa) ---
            print("\n👤 Registering Referrer...")
            ref_email = f"referrer_{timestamp}@test.com"
            ref_pass = "TestPass123!"
            
            await client.post("/register", json={
                "email": ref_email,
                "password": ref_pass,
                "full_name": "Grandpa Referrer",
                "referral_code": None
            })
            
            login_res = await client.post("/token", data={"username": ref_email, "password": ref_pass})
            if login_res.status_code != 200:
                print(f"❌ Referrer Login Failed: {login_res.text}")
                return
            ref_token = login_res.json()["access_token"]
            ref_headers = {"Authorization": f"Bearer {ref_token}"}
            
            # Get Referral Code
            summary_res = await client.get("/owner/dashboard/summary", headers=ref_headers)
            referral_code = summary_res.json()["referral_code"]
            print(f"✅ Referrer Code: {referral_code}")

            # --- 2. Register Creator (Dad) with Referral Code ---
            print("\n👤 Registering Creator (Ref by Grandpa)...")
            creator_email = f"creator_{timestamp}@test.com"
            
            reg_res = await client.post("/register", json={
                "email": creator_email,
                "password": ref_pass,
                "full_name": "Dad Creator",
                "referral_code": referral_code
            })
            
            if reg_res.status_code != 200:
                print(f"❌ Creator Registration Failed: {reg_res.text}")
                return

            login_res = await client.post("/token", data={"username": creator_email, "password": ref_pass})
            creator_token = login_res.json()["access_token"]
            creator_headers = {"Authorization": f"Bearer {creator_token}"}
            print("✅ Creator Registered & Logged In")

            # --- 3. Create Channel & Plan ---
            print("\n📺 Creating Channel...")
            chan_res = await client.post("/owner/channels", json={"title": "Affiliate Income Stream"}, headers=creator_headers)
            if chan_res.status_code != 200:
                print(f"❌ Channel Creation Failed: {chan_res.text}")
                return
            channel = chan_res.json()
            channel_id = channel["id"]
            print(f"✅ Channel Created: ID {channel_id}")

            # Get Plan
            plans_res = await client.get(f"/owner/channels/{channel_id}/plans", headers=creator_headers)
            plans = plans_res.json()
            if not plans:
                print("❌ No plans found!")
                return
            plan = plans[0]
            plan_id = plan["id"]
            print(f"✅ Found Plan: ID {plan_id} (${plan['price']})")

            # --- 4. Register Subscriber (The Payer) ---
            print("\n👤 Registering Subscriber...")
            sub_email = f"subscriber_{timestamp}@test.com"
            
            # We register to get an ID in the system
            reg_res = await client.post("/register", json={
                "email": sub_email,
                "password": ref_pass,
                "full_name": "Rich Subscriber",
                "referral_code": None
            })
            # Login to get ID
            login_res = await client.post("/token", data={"username": sub_email, "password": ref_pass})
            sub_token = login_res.json()["access_token"]
            sub_headers = {"Authorization": f"Bearer {sub_token}"}
            
            profile_res = await client.get("/owner/profile", headers=sub_headers)
            subscriber_id = profile_res.json()["id"]
            print(f"✅ Subscriber ID: {subscriber_id}")

            # --- 5. Simulate Payment (Webhook) ---
            print("\n💸 Simulating Payment via Webhook...")
            
            webhook_payload = {
                "type": "checkout.session.completed",
                "data": {
                    "object": {
                        "id": f"ch_test_{timestamp}",
                        "metadata": {
                            "user_id": str(subscriber_id),
                            "plan_id": str(plan_id),
                            "promo_id": "None"
                        }
                    }
                }
            }
            payload_bytes = json.dumps(webhook_payload).encode()
            signature = generate_signature(payload_bytes, WEBHOOK_SECRET)
            
            wh_res = await client.post("/webhook/stripe", content=payload_bytes, headers={
                "Stripe-Signature": signature,
                "Content-Type": "application/json"
            })
            
            if wh_res.status_code == 200:
                print("✅ Webhook Processed Successfully")
            else:
                print(f"❌ Webhook Failed: {wh_res.status_code} - {wh_res.text}")
                return

            # --- 6. Verify Commissions ---
            print("\n💰 Verifying Commissions...")
            
            # Check Referrer Stats (Level 1 Commission)
            # wait a bit for async db update? (Should be atomic in one request)
            
            stats_res = await client.get("/affiliate/stats", headers=ref_headers)
            stats = stats_res.json()
            
            print(f"Referrer Stats: {json.dumps(stats, indent=2)}")
            
            if stats["total_earnings"] > 0:
                print("✅ Referrer earned commission!")
            else:
                print("❌ Referrer has NO earnings!")

            # Check Network Tree
            net_res = await client.get("/affiliate/network", headers=ref_headers)
            network = net_res.json()
            
            # Check if Creator is in children
            children = network["children"]
            found_creator = any(child["name"] == "Dad Creator" for child in children)
            
            if found_creator:
                print("✅ Creator found in Referrer's network tree")
            else:
                print("❌ Creator NOT found in network tree!")
                print(network)

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(verify_affiliate_flow())
