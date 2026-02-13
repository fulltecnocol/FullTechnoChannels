# Importaciones de todos los modelos Consolidados
# Esto asegura que SQLAlchemy conozca todas las tablas usando el mismo Base

from shared.models import (
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

from shared.signature_models import (
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
