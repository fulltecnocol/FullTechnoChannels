from sqlalchemy import create_engine, text

# Supabase URL directly
DATABASE_URL = "postgresql://postgres:KJvNk1AF1LmxHhtK@db.oavgufpxufhwcznucbaf.supabase.co:5432/postgres"


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
