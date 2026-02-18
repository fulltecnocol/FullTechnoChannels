import os
import bcrypt
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

# Load environment variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL not found. Please create a .env file with DATABASE_URL")


def get_hashed_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def reset_password(email, new_password):
    engine = create_engine(DATABASE_URL)
    hashed = get_hashed_password(new_password)

    with engine.connect() as conn:
        # Check user
        result = conn.execute(
            text("SELECT id, email FROM users WHERE email=:email"), {"email": email}
        ).fetchone()
        if not result:
            print(f"❌ User {email} not found.")
            return

        print(f"✅ User found: {result[0]} - {result[1]}")

        # Update password
        conn.execute(
            text("UPDATE users SET hashed_password=:pwd WHERE email=:email"),
            {"pwd": hashed, "email": email},
        )
        conn.commit()
        print(f"✅ Password for {email} reset to: {new_password}")


if __name__ == "__main__":
    reset_password("fulltecnocol@gmail.com", "12345678")
