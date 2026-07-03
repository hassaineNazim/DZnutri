"""Opérations base de données de l'univers cosmétique (parallèle à crud.py)."""

import logging
from typing import Optional

from sqlalchemy import desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from bdproduitdz import cosmetic_scoring, models, schemas

logger = logging.getLogger("dznutri.cosmetic_crud")


async def get_cosmetic_by_barcode(db: AsyncSession, barcode: str):
    result = await db.execute(
        select(models.CosmeticProduct).where(models.CosmeticProduct.barcode == barcode)
    )
    return result.scalars().first()


async def create_cosmetic(db: AsyncSession, product: schemas.CosmeticProductCreate):
    obj = models.CosmeticProduct(**product.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def add_cosmetic_submission(db: AsyncSession, data: dict, user_id: int):
    obj = models.CosmeticSubmission(**data, submitted_by_user_id=user_id)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


async def get_cosmetic_submissions(db: AsyncSession, status: str = "pending"):
    result = await db.execute(
        select(models.CosmeticSubmission)
        .where(models.CosmeticSubmission.status == status)
        .order_by(models.CosmeticSubmission.submitted_at.desc())
    )
    return result.scalars().all()


async def approve_cosmetic_submission(
    db: AsyncSession, submission_id: int, admin_data: schemas.CosmeticApproval
):
    """Approuve une soumission : crée/complète le produit cosmétique + score.

    Renvoie (produit, id_utilisateur_soumetteur).
    """
    result = await db.execute(
        select(models.CosmeticSubmission).where(models.CosmeticSubmission.id == submission_id)
    )
    submission = result.scalars().first()
    if not submission or submission.status != "pending":
        raise ValueError("Soumission introuvable ou déjà traitée")

    # L'admin peut corriger la liste INCI ; sinon on prend celle de l'OCR.
    ingredients = admin_data.ingredients_text or submission.ocr_ingredients_text
    scoring = await cosmetic_scoring.calculate_cosmetic_score(db, ingredients)

    product = await get_cosmetic_by_barcode(db, submission.barcode)
    if product is None:
        product = models.CosmeticProduct(barcode=submission.barcode)
        db.add(product)

    product.product_name = admin_data.product_name
    product.brand = admin_data.brand
    product.category = admin_data.category
    product.ingredients_text = ingredients
    product.image_url = submission.image_front_url
    product.cosmetic_score = scoring["score"]
    product.score_detail = scoring["details"]
    product.risky_ingredients = scoring["risky_ingredients"]
    product.is_verified = True
    product.user_id = submission.submitted_by_user_id

    submission.status = "approved"
    await db.commit()
    await db.refresh(product)
    return product, submission.submitted_by_user_id


async def reject_cosmetic_submission(db: AsyncSession, submission_id: int):
    result = await db.execute(
        select(models.CosmeticSubmission).where(models.CosmeticSubmission.id == submission_id)
    )
    submission = result.scalars().first()
    if not submission:
        raise ValueError("Soumission introuvable")
    if submission.status != "pending":
        raise ValueError("Cette soumission a déjà été traitée")
    submission.status = "rejected"
    await db.commit()
    return submission


async def update_cosmetic(db: AsyncSession, barcode: str, upd: schemas.CosmeticProductUpdate):
    product = await get_cosmetic_by_barcode(db, barcode)
    if product is None:
        return None
    data = upd.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(product, key, value)
    # Si la liste d'ingrédients change, on recalcule le score.
    if "ingredients_text" in data:
        scoring = await cosmetic_scoring.calculate_cosmetic_score(db, product.ingredients_text)
        product.cosmetic_score = scoring["score"]
        product.score_detail = scoring["details"]
        product.risky_ingredients = scoring["risky_ingredients"]
    await db.commit()
    await db.refresh(product)
    return product


async def search_cosmetics(
    db: AsyncSession,
    q: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
):
    """Recherche allégée (mêmes principes que la recherche alimentaire)."""
    stmt = select(
        models.CosmeticProduct.id,
        models.CosmeticProduct.barcode,
        models.CosmeticProduct.product_name,
        models.CosmeticProduct.brand,
        models.CosmeticProduct.image_url,
        models.CosmeticProduct.category,
        models.CosmeticProduct.cosmetic_score,
        models.CosmeticProduct.is_verified,
    )
    if q:
        term = f"%{q}%"
        stmt = stmt.where(
            or_(
                models.CosmeticProduct.product_name.ilike(term),
                models.CosmeticProduct.brand.ilike(term),
                models.CosmeticProduct.barcode.ilike(term),
            )
        )
    stmt = stmt.order_by(desc(models.CosmeticProduct.cosmetic_score)).limit(limit).offset(offset)
    result = await db.execute(stmt)
    return [dict(row._mapping) for row in result.all()]
