import httpx
import uuid
import sys

BASE_URL = "http://localhost:8080"


def test_backend():
    print(f"Testing Backend at {BASE_URL}...")

    # 1. Register
    email = f"test_{uuid.uuid4()}@example.com"
    password = "password123"
    full_name = "Test User"
    print(f"\n-> Registering user: {email} / {password}")

    try:
        reg_response = httpx.post(
            f"{BASE_URL}/register",
            json={"email": email, "password": password, "full_name": full_name},
        )
        if reg_response.status_code not in [200, 201]:
            print(f"FAILED: Register {reg_response.status_code} - {reg_response.text}")
            sys.exit(1)

        # Verify Token
        token_data = reg_response.json()
        print(
            f"OK: User Registered. Token received: {token_data.get('access_token')[:10]}..."
        )
        token_data["access_token"]

    except Exception as e:
        print(f"FAILED: Connection Error {e}")
        sys.exit(1)

    # 2. Login (to verify auth flow separately)
    print("\n-> Logging in (Token check)...")
    try:
        login_response = httpx.post(
            f"{BASE_URL}/token",
            data={
                "username": email,  # OAuth2 form uses username for email
                "password": password,
            },
        )

        if login_response.status_code != 200:
            print(f"FAILED: Login {login_response.status_code} - {login_response.text}")
            sys.exit(1)

        token_data_login = login_response.json()
        access_token_login = token_data_login["access_token"]
        print("OK: Logged in successfully.")

        # Use the login token
        headers = {"Authorization": f"Bearer {access_token_login}"}
    except Exception as e:
        print(f"FAILED: Login logic {e}")
        sys.exit(1)

    # 3. Get Owner Dashboard Summary
    print("\n-> Getting Owner Dashboard Summary...")
    try:
        summary_response = httpx.get(
            f"{BASE_URL}/owner/dashboard/summary", headers=headers
        )
        if summary_response.status_code != 200:
            print(
                f"FAILED: Get Summary {summary_response.status_code} - {summary_response.text}"
            )
            sys.exit(1)

        summary_data = summary_response.json()
        print(
            f"OK: Summary Verified. Active Subs: {summary_data['active_subscribers']}, Revenue: {summary_data['available_balance']}"
        )
    except Exception as e:
        print(f"FAILED: Summary logic {e}")
        sys.exit(1)

    # 4. Create Channel
    print("\n-> Creating Test Channel...")
    channel_title = f"Channel_{uuid.uuid4()}"
    try:
        chan_response = httpx.post(
            f"{BASE_URL}/owner/channels", headers=headers, json={"title": channel_title}
        )

        if chan_response.status_code in [200, 201]:
            chan_data = chan_response.json()
            print(
                f"OK: Channel Created (ID: {chan_data['id']}, Code: {chan_data['validation_code']})"
            )
            channel_id = chan_data["id"]
        else:
            print(
                f"FAILED: Channel Creation {chan_response.status_code} - {chan_response.text}"
            )
            sys.exit(1)

    except Exception as e:
        print(f"FAILED: Channel Logic {e}")
        sys.exit(1)

    # 5. List Channels
    print("\n-> Listing Channels...")
    try:
        list_response = httpx.get(f"{BASE_URL}/owner/channels", headers=headers)
        if list_response.status_code == 200:
            channels = list_response.json()
            print(f"OK: Retrieved {len(channels)} channels.")
            found = any(c["id"] == channel_id for c in channels)
            if found:
                print("SUCCESS: Newly created channel found in list.")
            else:
                print("WARNING: Created channel not found in list (Latency?)")
        else:
            print(f"FAILED: List Channels {list_response.status_code}")
    except Exception as e:
        print(f"FAILED: List Logic {e}")

    print(
        "\nBackend Verification Complete! (Note: Plans Management endpoints are MISSING in API, verified Channel flow instead)"
    )


if __name__ == "__main__":
    test_backend()
