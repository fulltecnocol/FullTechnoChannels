# Importaciones de todos los modelos
# Esto asegura que SQLAlchemy conozca todas las tablas

from api.shared.models import (
    Base,
    User,
    SystemConfig,
    Channel,
    Plan,
    Subscription,
    Payment, 
    AffiliateEarning,
    Withdrawal,
    Promotion,
    SupportTicket,
    TicketMessage
)

from api.models.signature import (
    OwnerLegalInfo,
    SignatureCode,
    SignedContract
)

__all__ = [
    "Base",
    "User",
    "SystemConfig",
    "Channel",
    "Plan",
    "Subscription",
    "Payment",
    "AffiliateEarning",
    "Withdrawal",
    "Promotion",
    "SupportTicket",
    "TicketMessage",
    "OwnerLegalInfo",
    "SignatureCode",
    "SignedContract",
]
