"""
Servicio de generación de PDFs para contratos
Usa WeasyPrint para convertir HTML a PDF con estilos completos
"""

from pathlib import Path
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
import hashlib
import os
import logging
import asyncio

# Configurar Jinja2
TEMPLATES_DIR = Path(__file__).parent.parent.parent / "templates"
jinja_env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))


class PDFContractService:
    """Servicio para generar PDFs de contratos"""

    @staticmethod
    def _prepare_template_data(legal_info: dict, signature_data: dict = None) -> str:
        # Cargar template
        template = jinja_env.get_template("contrato_mandato.html")

        # Preparar datos para el template
        template_data = {
            # Información del mandante
            "person_type": legal_info.get("person_type", "natural"),
            "full_legal_name": legal_info.get("full_legal_name", ""),
            "id_type": legal_info.get("id_type", "CC"),
            "id_number": legal_info.get("id_number", ""),
            "business_name": legal_info.get("business_name", ""),
            "nit": legal_info.get("nit", ""),
            "legal_rep_name": legal_info.get("legal_rep_name", ""),
            "legal_rep_id": legal_info.get("legal_rep_id", ""),
            # Ubicación
            "address": legal_info.get("address", ""),
            "city": legal_info.get("city", ""),
            "department": legal_info.get("department", ""),
            "phone": legal_info.get("phone", ""),
            # Información bancaria
            "bank_name": legal_info.get("bank_name", ""),
            "account_type": legal_info.get("account_type", "ahorros"),
            "account_number": legal_info.get("account_number", ""),
            "account_holder_name": legal_info.get("account_holder_name", ""),
            # Versión del contrato
            "contract_version": legal_info.get("contract_version", "1.0"),
        }

        # Si hay datos de firma, agregarlos
        if signature_data:
            template_data.update(
                {
                    "signature_date": signature_data.get(
                        "signature_date", datetime.utcnow()
                    ),
                    "signature_code": signature_data.get("signature_code", ""),
                    "telegram_user_id": signature_data.get("telegram_user_id", ""),
                    "ip_address": signature_data.get("ip_address", ""),
                    "document_hash": signature_data.get("document_hash", ""),
                    "blockchain_tx_hash": signature_data.get("blockchain_tx_hash", ""),
                    "blockchain_network": signature_data.get(
                        "blockchain_network", "polygon"
                    ),
                    "contract_id": signature_data.get("contract_id", ""),
                }
            )
        else:
            # Preview mode - datos de ejemplo
            template_data.update(
                {
                    "signature_date": datetime.utcnow(),
                    "signature_code": "PREVIEW",
                    "telegram_user_id": "N/A",
                    "ip_address": "PREVIEW",
                    "document_hash": "PREVIEW - Se generará al firmar",
                    "blockchain_tx_hash": None,
                    "blockchain_network": "polygon",
                    "contract_id": "PREVIEW",
                }
            )

        # Renderizar HTML
        return template.render(**template_data)

    @staticmethod
    def generate_contract_html(legal_info: dict, signature_data: dict = None) -> str:
        """Genera solo el HTML del contrato (útil para debug o fallback)"""
        return PDFContractService._prepare_template_data(legal_info, signature_data)

    @staticmethod
    async def generate_contract_pdf_async(
        legal_info: dict, signature_data: dict = None
    ) -> bytes:
        """
        Versión asíncrona de generación de PDF para no bloquear el event loop
        """
        return await asyncio.to_thread(
            PDFContractService.generate_contract_pdf, legal_info, signature_data
        )

    @staticmethod
    def generate_contract_pdf(legal_info: dict, signature_data: dict = None) -> bytes:
        """
        Genera PDF del contrato de mandato (Síncrono)
        """
        html_content = PDFContractService._prepare_template_data(
            legal_info, signature_data
        )

        try:
            # FIX PARA MACOS (Silicon/M1/M2/M3)
            # Cargar librerías manualmente si estamos en Darwin (macOS)
            import sys

            if sys.platform == "darwin":
                try:
                    from ctypes import CDLL
                    from ctypes.util import find_library

                    paths = ["/opt/homebrew/lib", "/usr/local/lib", "/usr/lib"]
                    libs = [
                        "libpango-1.0.0.dylib",
                        "libpangoft2-1.0.0.dylib",
                        "libgobject-2.0.0.dylib",
                        "libglib-2.0.0.dylib",
                        "libfontconfig.1.dylib",
                    ]

                    for lib in libs:
                        found = False
                        for path in paths:
                            lib_path = os.path.join(path, lib)
                            if os.path.exists(lib_path):
                                try:
                                    CDLL(lib_path)
                                    found = True
                                    break
                                except:
                                    pass
                        if not found:
                            lib_name = lib.split(".")[0].replace("lib", "")
                            l = find_library(lib_name)
                            if l:
                                CDLL(l)
                except Exception as e:
                    logging.warning(f"MacOS library loading warning: {e}")

            from weasyprint import HTML

            # Generar PDF
            pdf_bytes = HTML(string=html_content).write_pdf()
            return pdf_bytes
        except ImportError:
            logging.error("WeasyPrint not installed or missing dependencies")
            raise
        except Exception as e:
            logging.error(f"Error making PDF: {e}")
            raise

    @staticmethod
    def calculate_pdf_hash(pdf_bytes: bytes) -> str:
        """Calcula el hash SHA-256 de un PDF"""
        hash_obj = hashlib.sha256(pdf_bytes)
        hash_hex = hash_obj.hexdigest()
        return f"0x{hash_hex}"

    @staticmethod
    async def generate_preview_pdf_async(legal_info: dict) -> bytes:
        """Genera un PDF de preview (asíncrono)"""
        return await PDFContractService.generate_contract_pdf_async(
            legal_info, signature_data=None
        )

    @staticmethod
    async def generate_signed_pdf_async(
        legal_info: dict, signature_data: dict
    ) -> tuple[bytes, str]:
        """Genera el PDF final firmado (asíncrono)"""
        pdf_bytes = await PDFContractService.generate_contract_pdf_async(
            legal_info, signature_data
        )
        pdf_hash = PDFContractService.calculate_pdf_hash(pdf_bytes)
        return pdf_bytes, pdf_hash

    # Retrocompatibilidad
    @staticmethod
    def generate_preview_pdf(legal_info: dict) -> bytes:
        return PDFContractService.generate_contract_pdf(legal_info, signature_data=None)

    @staticmethod
    def generate_signed_pdf(
        legal_info: dict, signature_data: dict
    ) -> tuple[bytes, str]:
        pdf_bytes = PDFContractService.generate_contract_pdf(legal_info, signature_data)
        pdf_hash = PDFContractService.calculate_pdf_hash(pdf_bytes)
        return pdf_bytes, pdf_hash
