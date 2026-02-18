from application.controllers import (
    auth_controller as auth,
    owner_controller as owner,
    admin_controller as admin,
    legal_controller as legal,
    payment_controller as payments,
    call_controller as calls,
    public_controller as public,
    availability_controller as availability,
    affiliate_controller as affiliate,
    profile_controller as profiles,
)

__all__ = [
    "auth",
    "owner",
    "admin",
    "legal",
    "payments",
    "calls",
    "public",
    "availability",
    "affiliate",
    "profiles",
]
