"""Univers cosmétique : scan (local puis Open Beauty Facts) + soumission photo.

Calque exactement le fonctionnement alimentaire (routers/products.py +
routers/submissions.py), mais pour les cosmétiques :
- score fondé sur les ingrédients à risque (cosmetic_scoring) ;
- source de repli = Open Beauty Facts (sibling cosmétique d'Open Food Facts) ;
- soumission = photo avant + photo dos (liste INCI, lue par OCR).
"""

import asyncio
import logging
from functools import partial
from typing import List, Optional

import cloudinary
import cloudinary.uploader
import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from fastapi_cache.decorator import cache
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from rate_limit import limiter
from auth import models as auth_models
from auth import security as auth_security
from bdproduitdz import cosmetic_crud, cosmetic_scoring
from bdproduitdz import schemas as bd_schemas
from bdproduitdz import ocr as bd_ocr
from routers.products import get_off_client  # client httpx partagé (OFF/OBF)

logger = logging.getLogger("dznutri.cosmetics")

router = APIRouter(tags=["Cosmetics"])

OBF_URL = "https://world.openbeautyfacts.org/api/v2/product/{barcode}.json"

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 Mo
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"}


def _validate_image(upload: Optional[UploadFile], field: str) -> None:
    if upload is None:
        return
    if upload.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"{field}: type non supporté ({upload.content_type}). "
                   "Formats acceptés : JPEG, PNG, WebP, HEIC.",
        )
    size = getattr(upload, "size", None)
    if size is not None and size > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"{field}: image trop volumineuse (max {MAX_IMAGE_BYTES // (1024 * 1024)} Mo).",
        )


@router.get("/api/cosmetic/{barcode}")
@cache(expire=86400)  # Cache 24h (comme l'alimentaire)
async def get_cosmetic_by_barcode(barcode: str, db: AsyncSession = Depends(get_db)):
    """Cherche un cosmétique : d'abord en local, sinon sur Open Beauty Facts.

    Si trouvé sur OBF : calcule le score (ingrédients à risque), sauvegarde et
    retourne. Sinon 404 (le mobile proposera alors la soumission photo).
    """
    db_product = await cosmetic_crud.get_cosmetic_by_barcode(db, barcode)
    if db_product:
        return {"source": "local_db", "product": db_product}

    client = get_off_client()
    try:
        response = await client.get(OBF_URL.format(barcode=barcode))
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Erreur de communication avec Open Beauty Facts")

    data = response.json()
    if data.get("status") == 1:
        p = data.get("product") or {}
        ingredients = p.get("ingredients_text_fr") or p.get("ingredients_text") or ""
        scoring = await cosmetic_scoring.calculate_cosmetic_score(db, ingredients)

        categories = p.get("categories") or ""
        product_to_create = bd_schemas.CosmeticProductCreate(
            barcode=p.get("code") or barcode,
            product_name=(p.get("product_name_fr") or p.get("product_name") or barcode),
            brand=p.get("brands"),
            image_url=p.get("image_url"),
            ingredients_text=ingredients or None,
            category=(categories.split(",")[0].strip() or None) if categories else None,
            cosmetic_score=scoring["score"],
            score_detail=scoring["details"],
            risky_ingredients=scoring["risky_ingredients"],
        )
        created = await cosmetic_crud.create_cosmetic(db, product_to_create)
        return {"source": "openbeautyfacts_saved", "product": created}

    raise HTTPException(status_code=404, detail="Produit cosmétique non trouvé")


@router.get("/api/cosmetics", response_model=List[bd_schemas.CosmeticSearchResult])
async def search_cosmetics(
    q: Optional[str] = Query(None, description="Nom, marque ou code-barres"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Recherche de cosmétiques (schéma allégé, comme la recherche alimentaire)."""
    return await cosmetic_crud.search_cosmetics(db, q=q, limit=limit, offset=offset)


@router.post("/api/cosmetic/submission", response_model=bd_schemas.CosmeticSubmissionResponse)
@limiter.limit("5/minute")  # uploads Cloudinary + OCR : coûteux, on borne le débit
async def create_cosmetic_submission(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user),
    barcode: str = Form(..., max_length=50),
    productName: str = Form(None, max_length=300),
    brand: str = Form(None, max_length=200),
    category: str = Form(None, max_length=200),
    image_front: UploadFile = File(...),
    image_back: Optional[UploadFile] = File(None),
):
    """Soumission d'un cosmétique absent : photo avant + dos (liste INCI).

    Upload Cloudinary (parallèle) puis OCR de la photo dos pour pré-remplir les
    ingrédients ; la soumission part en revue admin.
    """
    loop = asyncio.get_running_loop()
    _validate_image(image_front, "image_front")
    _validate_image(image_back, "image_back")

    tasks = [loop.run_in_executor(None, partial(cloudinary.uploader.upload, file=image_front.file))]
    if image_back:
        tasks.append(loop.run_in_executor(None, partial(cloudinary.uploader.upload, file=image_back.file)))
    else:
        tasks.append(asyncio.sleep(0))

    try:
        results = await asyncio.gather(*tasks)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Upload Cloudinary (cosmétique) échoué: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="Impossible d'héberger les images (fichier invalide ou service indisponible).",
        )

    front = results[0]
    back = results[1] if isinstance(results[1], dict) else None
    front_url = front.get("secure_url") if front else None
    back_url = back.get("secure_url") if back else None

    ocr_text = ""
    if back_url:
        ocr_text = await loop.run_in_executor(None, bd_ocr.detect_text_from_url, back_url) or ""

    submission = await cosmetic_crud.add_cosmetic_submission(
        db,
        {
            "barcode": barcode,
            "product_name": productName,
            "brand": brand,
            "category": category,
            "image_front_url": front_url,
            "image_back_url": back_url,
            "ocr_ingredients_text": ocr_text.strip() or None,
        },
        current_user.id,
    )
    return submission
