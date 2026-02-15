from sqlalchemy import create_engine, text

# Supabase URL directly
DATABASE_URL = "postgresql://postgres:KJvNk1AF1LmxHhtK@db.oavgufpxufhwcznucbaf.supabase.co:5432/postgres"


def fix_link(email, telegram_id):
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        print(f"🔍 Investigating conflict for TG ID: {telegram_id}...")

        # 1. Find ANY user with this Telegram ID
        conflict_user = conn.execute(
            text("SELECT id, email FROM users WHERE telegram_id=:tg_id"),
            {"tg_id": telegram_id},
        ).fetchone()

        if conflict_user:
            cid, cemail = conflict_user
            print(f"⚠️ Found existing user with this TG ID: ID={cid}, Email={cemail}")

            # If it's NOT our target email, delete it (as per user request)
            if cemail != email:
                print(f"🗑️ Deleting duplicate/orphan user ID {cid}...")
                conn.execute(text("DELETE FROM users WHERE id=:id"), {"id": cid})
                conn.commit()
                print("✅ Deleted.")
            else:
                print(
                    "✅ This is already the correct user. Proceeding to update flags."
                )

        # 2. Update the TARGET user
        print(f"🔗 Linking {email} as OWNER...")
        result = conn.execute(
            text("""
                UPDATE users 
                SET telegram_id=:tg_id, is_owner=true, is_admin=true 
                WHERE email=:email
                RETURNING id
            """),
            {"tg_id": telegram_id, "email": email},
        ).fetchone()

        if result:
            conn.commit()
            print(
                f"🎉 SUCCESS! User {email} (ID: {result[0]}) is now Owner & Admin linked to Telegram."
            )
        else:
            print(f"❌ Target user {email} not found in DB.")


if __name__ == "__main__":
    fix_link("fulltecnocol@gmail.com", 940376814)
