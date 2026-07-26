import asyncio
import io
import logging
from functools import partial
from typing import List, Optional

import cloudinary.uploader
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

# Imports de la base de données
from database import get_db

# Imports de VOTRE logique produit
from bdproduitdz import crud as bd_crud
from bdproduitdz import schemas as bd_schemas

# --- CORRECTION DES IMPORTS AUTH ---
# On suppose que le dossier 'auth' est à la racine, au même niveau que 'bdproduitdz'
from auth import models as auth_models
from auth import security as auth_security
from rate_limit import limiter
# -----------------------------------

logger = logging.getLogger("dznutri.reports")
router = APIRouter(tags=["Reports"])
MAX_REPORT_IMAGE_BYTES = 8 * 1024 * 1024
ALLOWED_REPORT_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}


def _is_supported_image_content(content: bytes) -> bool:
    """Valide la signature du fichier sans faire confiance au MIME du mobile."""
    if content.startswith(b"\xff\xd8\xff"):
        return True
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return True
    if len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return True
    if len(content) >= 12 and content[4:8] == b"ftyp":
        return content[8:12] in {
            b"heic",
            b"heix",
            b"hevc",
            b"hevx",
            b"mif1",
            b"msf1",
        }
    return False


@router.post("/api/reports", response_model=bd_schemas.ReportResponse)
async def create_user_report(
    report: bd_schemas.ReportCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user)
):
    """
    Permet à un utilisateur de signaler une erreur (userreportapp ou scoringReport).
    """
    return await bd_crud.create_report(db, report, user_id=current_user.id)


@router.post("/api/reports/with-image", response_model=bd_schemas.ReportResponse)
@limiter.limit("10/minute")
async def create_user_report_with_image(
    request: Request,
    barcode: str = Form(..., max_length=50),
    type: bd_schemas.ReportTypeEnum = Form(...),
    description: Optional[str] = Form(None, max_length=2000),
    image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user),
):
    """Crée un signalement et héberge sa photo côté serveur.

    Le mobile n'expose plus de preset Cloudinary non signé. L'authentification,
    la limite de débit et les bornes de fichier s'appliquent avant l'upload.
    """
    image_url = None
    if image is not None:
        if image.content_type not in ALLOWED_REPORT_IMAGE_TYPES:
            raise HTTPException(status_code=415, detail="Format d'image non pris en charge.")
        image_bytes = await image.read(MAX_REPORT_IMAGE_BYTES + 1)
        if len(image_bytes) > MAX_REPORT_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail="Image trop volumineuse (8 Mo maximum).")
        if not _is_supported_image_content(image_bytes):
            raise HTTPException(status_code=415, detail="Contenu d'image invalide.")

        loop = asyncio.get_running_loop()
        try:
            uploaded = await loop.run_in_executor(
                None,
                partial(
                    cloudinary.uploader.upload,
                    file=io.BytesIO(image_bytes),
                    folder="dznutri/reports",
                    resource_type="image",
                ),
            )
            image_url = uploaded.get("secure_url")
        except Exception as exc:  # noqa: BLE001
            logger.warning("Upload d'une image de signalement échoué: %s", exc)
            raise HTTPException(
                status_code=502,
                detail="Impossible d'héberger l'image du signalement.",
            )

    report = bd_schemas.ReportCreate(
        barcode=barcode,
        type=type,
        description=description,
        image_url=image_url,
    )
    return await bd_crud.create_report(db, report, user_id=current_user.id)


@router.get("/api/admin/reports", response_model=List[bd_schemas.ReportResponse])
async def get_reports_for_admin(
    db: AsyncSession = Depends(get_db),
    # On sécurise avec get_current_admin pour que seul l'admin puisse voir les reports
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin)
):
    """
    Récupère la liste des signalements pour l'interface admin.
    """
    return await bd_crud.get_pending_reports(db)
