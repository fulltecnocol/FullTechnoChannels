"""
API Endpoints para sistema de firma digital
Maneja todo el flujo: legal info → preview → firma → blockchain
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from typing import Optional
import secrets
import os

from shared.database import get_db
from shared.models import User
from shared.signature_models import OwnerLegalInfo, SignatureCode, SignedContract
from api.services.pdf_service import PDFContractService
from api.services.blockchain_service import get_blockchain_service
from api.deps import get_current_user

router = APIRouter(prefix="/legal", tags=["Legal & Signatures"])


class LegalInfoCreate(BaseModel):
    """Schema para crear información legal"""

    person_type: str = Field(..., pattern="^(natural|juridica)$")

    # Persona Natural
    full_legal_name: Optional[str] = None
    id_type: Optional[str] = None
    id_number: Optional[str] = None

    # Persona Jurídica
    business_name: Optional[str] = None
    nit: Optional[str] = None
    legal_rep_name: Optional[str] = None
    legal_rep_id: Optional[str] = None

    # Común
    address: str
    city: str
    department: str
    phone: str

    # Bancario
    bank_name: str
    account_type: str = Field(..., pattern="^(ahorros|corriente)$")
    account_number: str
    account_holder_name: str

    # Opcional
    has_rut: bool = False


class SignatureVerification(BaseModel):
    """Schema para verificar código de firma"""

    code: str = Field(..., min_length=6, max_length=6)


# ============================================================================
# ENDPOINTS
# ============================================================================


@router.post("/info")
async def submit_legal_info(
    data: LegalInfoCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Owner envía su información legal
    Paso 1 del proceso de firma
    """
    # Verificar que sea owner
    if not current_user.is_owner:
        raise HTTPException(400, "Only owners can submit legal info")

    # Verificar si ya existe info legal
    result = await db.execute(
        select(OwnerLegalInfo).where(OwnerLegalInfo.owner_id == current_user.id)
    )
    existing = result.scalar_one_or_none()

    if existing and existing.contract_signed:
        raise HTTPException(400, "Contract already signed")

    # Crear o actualizar
    if existing:
        # Actualizar
        for key, value in data.dict().items():
            setattr(existing, key, value)
        legal_info = existing
    else:
        # Crear nuevo
        legal_info = OwnerLegalInfo(owner_id=current_user.id, **data.dict())
        db.add(legal_info)

    # Actualizar status del user
    current_user.legal_verification_status = "info_submitted"

    await db.commit()
    await db.refresh(legal_info)

    return {
        "status": "success",
        "message": "Legal info saved successfully",
        "next_step": "preview_contract",
    }


@router.get("/contract/preview")
async def preview_contract(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Genera preview del contrato en PDF (sin firmar)
    Permite al owner revisar antes de firmar
    """
    # Obtener legal info
    result = await db.execute(
        select(OwnerLegalInfo).where(OwnerLegalInfo.owner_id == current_user.id)
    )
    legal_info = result.scalar_one_or_none()

    if not legal_info:
        raise HTTPException(400, "Legal info not found. Submit info first.")

    # Generar PDF preview
    pdf_bytes = PDFContractService.generate_preview_pdf(legal_info.__dict__)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=contract_preview.pdf"},
    )


@router.post("/request-signature")
async def request_signature(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Inicia proceso de firma:
    1. Genera código OTP
    2. Calcula hash del contrato
    3. Envía mensaje a Telegram
    """
    # Verificar legal info
    result = await db.execute(
        select(OwnerLegalInfo).where(OwnerLegalInfo.owner_id == current_user.id)
    )
    legal_info = result.scalar_one_or_none()

    if not legal_info:
        raise HTTPException(400, "Legal info not found")

    if legal_info.contract_signed:
        raise HTTPException(400, "Contract already signed")

    # Verificar que tenga telegram_id
    if not current_user.telegram_id:
        raise HTTPException(
            400, "Telegram ID not found. Link your Telegram account first."
        )

    # Generar código OTP de 6 dígitos
    otp_code = "".join([str(secrets.randbelow(10)) for _ in range(6)])

    # Generar PDF temporal para calcular hash
    pdf_bytes = PDFContractService.generate_preview_pdf(legal_info.__dict__)
    contract_hash = PDFContractService.calculate_pdf_hash(pdf_bytes)

    # Guardar código en DB
    signature_code = SignatureCode(
        owner_id=current_user.id,
        code=otp_code,
        contract_hash=contract_hash,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", ""),
    )
    db.add(signature_code)
    await db.commit()

    # TODO: Enviar mensaje a Telegram (implementar en DÍA 3)
    # await send_signature_request_telegram(current_user.telegram_id, otp_code)

    return {
        "status": "otp_sent",
        "message": "Signature code sent to your Telegram",
        "expires_at": signature_code.expires_at,
        "telegram_id": current_user.telegram_id,
        # Solo para desarrollo - ELIMINAR en producción
        "dev_code": otp_code if os.getenv("ENV") == "development" else None,
    }


@router.post("/verify-signature")
async def verify_signature(
    data: SignatureVerification,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Verifica código OTP y firma contrato:
    1. Valida código
    2. Genera PDF final
    3. Sube a blockchain
    4. Guarda en Cloud Storage
    5. Marca como firmado
    """
    # Buscar código válido
    result = await db.execute(
        select(SignatureCode)
        .where(
            SignatureCode.owner_id == current_user.id,
            SignatureCode.code == data.code,
            not SignatureCode.used,
            SignatureCode.expires_at > datetime.utcnow(),
        )
        .order_by(SignatureCode.created_at.desc())
    )
    signature_code = result.scalar_one_or_none()

    if not signature_code:
        raise HTTPException(400, "Invalid or expired signature code")

    # Marcar código como usado
    signature_code.used = True
    signature_code.used_at = datetime.utcnow()

    # Obtener legal info
    result = await db.execute(
        select(OwnerLegalInfo).where(OwnerLegalInfo.owner_id == current_user.id)
    )
    legal_info = result.scalar_one_or_none()

    # Preparar datos de firma
    signature_data = {
        "signature_date": datetime.utcnow(),
        "signature_code": data.code,
        "telegram_user_id": current_user.telegram_id,
        "ip_address": request.client.host,
        "document_hash": "",  # Se calcula después
        "blockchain_tx_hash": "",  # Se obtiene de blockchain
        "blockchain_network": "polygon",
        "contract_id": f"CTR-{current_user.id}-{int(datetime.utcnow().timestamp())}",
        "contract_version": "1.0",
    }

    # Generar PDF final
    pdf_bytes, pdf_hash = PDFContractService.generate_signed_pdf(
        legal_info.__dict__, signature_data
    )

    signature_data["document_hash"] = pdf_hash

    # Subir a blockchain
    blockchain = get_blockchain_service()
    blockchain_result = await blockchain.store_contract(pdf_hash, current_user.id)

    if not blockchain_result.get("success"):
        raise HTTPException(500, f"Blockchain error: {blockchain_result.get('error')}")

    signature_data["blockchain_tx_hash"] = blockchain_result["tx_hash"]

    # TODO: Subir PDF a Cloud Storage (implementar después)
    # pdf_url = await upload_to_cloud_storage(pdf_bytes, f"contracts/{current_user.id}/...")
    pdf_url = f"gs://temp/{signature_data['contract_id']}.pdf"  # Temporal

    # Guardar en DB
    signed_contract = SignedContract(
        owner_id=current_user.id,
        pdf_url=pdf_url,
        pdf_hash=pdf_hash,
        pdf_size_bytes=len(pdf_bytes),
        blockchain_network="polygon",
        blockchain_tx_hash=blockchain_result["tx_hash"],
        blockchain_confirmed=blockchain_result["confirmed"],
        blockchain_confirmed_at=datetime.utcnow(),
        blockchain_block_number=blockchain_result["block_number"],
        signature_method="telegram_otp",
        signature_code=data.code,
        signature_telegram_user_id=current_user.telegram_id,
        signature_ip_address=request.client.host,
        signature_user_agent=request.headers.get("user-agent", ""),
    )
    db.add(signed_contract)

    # Actualizar legal info
    legal_info.contract_signed = True
    legal_info.contract_signed_at = datetime.utcnow()
    legal_info.contract_pdf_url = pdf_url
    legal_info.contract_signature_method = "telegram_otp"

    # Actualizar user status
    current_user.legal_verification_status = "contract_signed"
    current_user.can_create_channels = True

    await db.commit()

    # TODO: Enviar notificación a Telegram
    # TODO: Enviar email con PDF

    return {
        "status": "signed",
        "message": "Contract signed successfully!",
        "contract_url": pdf_url,
        "blockchain_tx": blockchain_result["tx_hash"],
        "block_number": blockchain_result["block_number"],
        "verified": True,
        "can_create_channels": True,
    }


@router.get("/contract/download")
async def download_contract(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Descarga el contrato firmado"""
    result = await db.execute(
        select(SignedContract)
        .where(SignedContract.owner_id == current_user.id)
        .order_by(SignedContract.signed_at.desc())
    )
    contract = result.scalar_one_or_none()

    if not contract:
        raise HTTPException(404, "Signed contract not found")

    # TODO: Descargar de Cloud Storage
    # pdf_bytes = await download_from_cloud_storage(contract.pdf_url)

    return {
        "contract_url": contract.pdf_url,
        "pdf_hash": contract.pdf_hash,
        "signed_at": contract.signed_at,
        "blockchain_tx": contract.blockchain_tx_hash,
        "verified": contract.blockchain_confirmed,
    }


@router.get("/status")
async def get_legal_status(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """Obtiene el estado del proceso legal/firma"""
    result = await db.execute(
        select(OwnerLegalInfo).where(OwnerLegalInfo.owner_id == current_user.id)
    )
    legal_info = result.scalar_one_or_none()

    return {
        "user_id": current_user.id,
        "verification_status": current_user.legal_verification_status,
        "can_create_channels": current_user.can_create_channels,
        "has_legal_info": legal_info is not None,
        "contract_signed": legal_info.contract_signed if legal_info else False,
        "contract_signed_at": legal_info.contract_signed_at if legal_info else None,
        "next_step": _get_next_step(current_user.legal_verification_status, legal_info),
    }


def _get_next_step(status: str, legal_info: Optional[OwnerLegalInfo]) -> str:
    """Determina el siguiente paso en el proceso"""
    if status == "pending":
        return "submit_legal_info"
    elif status == "info_submitted" and not legal_info.contract_signed:
        return "preview_and_sign_contract"
    elif status == "contract_signed":
        return "create_channels"
    else:
        return "unknown"
