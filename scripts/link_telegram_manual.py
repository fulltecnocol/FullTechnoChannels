import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL not found. Please create a .env file with DATABASE_URL")


def link_telegram(email, telegram_id):
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Check user
        result = conn.execute(
            text("SELECT id, email, telegram_id FROM users WHERE email=:email"),
            {"email": email},
        ).fetchone()
        if not result:
            print(f"❌ User {email} not found.")
            return

        print(f"✅ User found: {result[0]} - {result[1]} (Current TG: {result[2]})")

        # Update details
        conn.execute(
            text(
                "UPDATE users SET telegram_id=:tg_id, is_owner=true WHERE email=:email"
            ),
            {"tg_id": telegram_id, "email": email},
        )
        conn.commit()
        print(f"✅ Linked {email} to Telegram ID: {telegram_id}")


if __name__ == "__main__":
    # ID from logs: 940376814
    link_telegram("fulltecnocol@gmail.com", 940376814)
