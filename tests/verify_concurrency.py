import asyncio
import httpx
import random
import string
import time

# Target the deployed backend
# Target the deployed backend
API_URL = "https://membership-backend-dhtw77aq7a-uc.a.run.app/api"
# API_URL = "http://localhost:8000/api" # Uncomment for local testing

async def register_user(client, email, password, full_name, request_id):
    """
    Attempts to register a user.
    """
    try:
        start_time = time.time()
        response = await client.post(
            f"{API_URL}/register",
            json={
                "email": email,
                "password": password,
                "full_name": full_name,
                "referral_code": None
            },
            timeout=10.0
        )
        duration = time.time() - start_time
        return {
            "id": request_id,
            "status": response.status_code,
            "data": response.json() if response.status_code != 500 else response.text,
            "duration": duration
        }
    except Exception as e:
        return {
            "id": request_id,
            "status": "error",
            "error": str(e),
            "duration": 0
        }

async def run_test():
    # 1. Generate random user credentials
    rand_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
    email = f"test_racer_{rand_suffix}@example.com"
    password = "SafePassword123!"
    full_name = f"Test Racer {rand_suffix}"

    print(f"🚦 STARTING CONCURRENCY TEST")
    print(f"🎯 Target: {API_URL}")
    print(f"👤 User: {email}")
    print(f"🚀 Launching 3 concurrent registration requests...")

    async with httpx.AsyncClient() as client:
        # Create 3 concurrent tasks
        tasks = [
            register_user(client, email, password, full_name, 1),
            register_user(client, email, password, full_name, 2),
            register_user(client, email, password, full_name, 3)
        ]
        
        # Run them in parallel
        results = await asyncio.gather(*tasks)

    # Analyze results
    success_count = 0
    fail_400_count = 0
    fail_other_count = 0

    print("\n📊 RESULTS:")
    sorted_results = sorted(results, key=lambda x: x['id'])
    
    for res in sorted_results:
        print(f"   Request #{res['id']}: Status {res['status']} ({res['duration']:.2f}s)")
        if res['status'] == 200:
            success_count += 1
            print(f"      ✅ SUCCESS: Token received")
        elif res['status'] == 400:
            fail_400_count += 1
            print(f"      🛡️ BLOCKED: {res.get('data', {}).get('detail')}")
        else:
            fail_other_count += 1
            print(f"      ❌ FAILED: {res.get('data') or res.get('error')}")

    print("\n📝 CONCLUSION:")
    if success_count == 1 and fail_400_count >= 1:
        print("✅ PASSED: Race condition handled correctly.")
        print("   - Exactly 1 request succeeded.")
        print("   - Duplicates were rejected with 400 Bad Request.")
    elif success_count > 1:
        print("❌ FAILED: Multiple registrations succeeded (Double Registration still exists!).")
    elif success_count == 0:
        print("❌ FAILED: All requests failed.")
    else:
        print(f"⚠️ INDETERMINATE: Success={success_count}, 400s={fail_400_count}, Others={fail_other_count}")

if __name__ == "__main__":
    asyncio.run(run_test())
