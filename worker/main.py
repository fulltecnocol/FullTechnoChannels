import os
import sys
import base64
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional

# Add project root to sys.path to allow imports from shared/api
# This assumes the worker is run from the project root or the docker context sends the whole repo
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.services.pdf_service import PDFContractService

# Configure logging
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="TeleGate Worker Service")

class PreviewRequest(BaseModel):
    legal_data: Dict[str, Any]

class SignRequest(BaseModel):
    legal_data: Dict[str, Any]
    signature_data: Dict[str, Any]

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "worker"}

@app.post("/generate-preview")
async def generate_preview(request: PreviewRequest):
    """Generates a preview PDF for reading before signing."""
    try:
        logging.info("Generating preview PDF...")
        pdf_bytes = await PDFContractService.generate_preview_pdf_async(request.legal_data)
        # Return as base64 string
        return {"pdf_base64": base64.b64encode(pdf_bytes).decode("utf-8")}
    except Exception as e:
        logging.error(f"Error generating preview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sign-contract")
async def sign_contract(request: SignRequest):
    """Generates the final signed PDF."""
    try:
        logging.info("Generating signed PDF...")
        pdf_bytes, _ = await PDFContractService.generate_signed_pdf_async(
            request.legal_data, request.signature_data
        )
        return {"pdf_base64": base64.b64encode(pdf_bytes).decode("utf-8")}
    except Exception as e:
        logging.error(f"Error generating signed PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))
