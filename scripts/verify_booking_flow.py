import asyncio
import os
import sys
import httpx
from datetime import datetime, timedelta

# Ensure we can import shared modules
sys.path.append(os.getcwd())

API_URL = "http://localhost:8000"

async def verify_booking_flow():
    print("🚀 Starting Booking Flow Verification...")
    
    try:
        async with httpx.AsyncClient(base_url=API_URL, timeout=10.0) as client:
            # 0. Register (New User)
            print("👤 Registering Test Owner...")
            timestamp = int(datetime.utcnow().timestamp())
            email = f"owner_{timestamp}@test.com"
            password = "TestPassword123!"
            
            reg_res = await client.post("/register", json={
                "email": email,
                "password": password,
                "full_name": "Test Owner",
                "referral_code": None
            })
            
            if reg_res.status_code not in [200, 201]:
                # Maybe already exists? Try login anyway
                print(f"⚠️ Registration response: {reg_res.status_code}")
            else:
                print("✅ Registered successfully")

            # 1. Login (Owner)
            print("🔑 Logging in as Owner...")
            login_res = await client.post("/token", data={"username": email, "password": password})
            if login_res.status_code != 200:
                print(f"❌ Login failed: {login_res.text}")
                return
            
            token = login_res.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("✅ Logged in")

            # 1.5 Get Profile to get Owner ID
            profile_res = await client.get("/owner/profile", headers=headers)
            if profile_res.status_code != 200:
                print(f"❌ Failed to get profile: {profile_res.text}")
                return
            owner_id = profile_res.json()["id"]
            print(f"👤 Owner ID: {owner_id}")

            # 2. Setup Call Service + Slot
            print("🛠 Creating Call Service...")
            
            # Get/Create Service
            # Note: Routes are at root /calls, not /api/calls
            res = await client.get("/calls/services", headers=headers)
            services = res.json()
            
            if services:
                service = services[0]
                print(f"✅ Found existing service ID: {service['id']}")
            else:
                print("   No service found, creating new one...")
                res = await client.post("/calls/services", json={
                    "description": "Test Consultation",
                    "duration_minutes": 30,
                    "price": 50.0,
                    "is_active": True,
                    "channel_id": None
                }, headers=headers)
                if res.status_code != 200:
                     print(f"❌ Failed creating service: {res.text}")
                     return
                service = res.json()
                print(f"✅ Service Created ID: {service['id']}")

            # Create Availability Range (recurring)
            tomorrow = datetime.utcnow() + timedelta(days=1)
            print("📅 Setting up Availability Range...")
            avail_res = await client.post("/availability/", json=[{
                "day_of_week": tomorrow.weekday(), 
                "start_time": "09:00",
                "end_time": "17:00",
                "is_recurring": True
            }], headers=headers)
            
            if avail_res.status_code == 200:
                print("✅ Availability Range Set")
            else:
                print(f"❌ Failed to set availability: {avail_res.text}")
                return

            # 3. Verify Availability (Public Endpoint)
            print("📅 Verifying Availability...")
            
            # Correct endpoint is /availability/slots?service_id=...
            avail_res = await client.get("/availability/slots", params={
                "service_id": service['id'],
                "from_date": tomorrow.date().isoformat(),
                "to_date": (tomorrow + timedelta(days=1)).date().isoformat()
            })
            
            if avail_res.status_code == 200:
                avail_slots = avail_res.json()
                # Check if our slot is in the list
                # Note: The response format is [{"start_time": iso, "end_time": iso, "available": bool}, ...]
                # We expect slots between 09:00 and 17:00
                if avail_slots:
                    first_slot = avail_slots[0]
                    print(f"✅ Found {len(avail_slots)} slots. First: {first_slot['start_time']}")
                else:
                    print("❌ No slots found in availability response")
                    # print(f"   Returned: {avail_slots}")
            else:
                 print(f"❌ Availability fetch failed: {avail_res.status_code} - {avail_res.text}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(verify_booking_flow())
