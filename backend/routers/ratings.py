"""Notes des utilisateurs sur les produits (moyenne + noter).

- GET  /api/product/{barcode}/ratings : moyenne, nombre, ma note, avis récents.
- POST /api/product/{barcode}/ratings : (re)noter le produit (upsert, 1 par user).

Clé par code-barres : fonctionne pour l'alimentaire comme le cosmétique.
"""

import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from rate_limit import limiter
from auth import models as auth_models
from auth import security as auth_security
from bdproduitdz import schemas as bd_schemas
from bdproduitdz.models import ProductRating

logger = logging.getLogger("dznutri.ratings")

router = APIRouter(tags=["Ratings"])


async def _build_summary(db: AsyncSession, barcode: str, user_id: int) -> dict:
    # Moyenne + nombre (un seul row, toujours présent).
    avg, count = (
        await db.execute(
            select(func.avg(ProductRating.rating), func.count(ProductRating.id)).where(
                ProductRating.barcode == barcode
            )
        )
    ).one()

    # La note de l'utilisateur courant (le cas échéant).
    mine = (
        await db.execute(
            select(ProductRating).where(
                ProductRating.barcode == barcode,
                ProductRating.user_id == user_id,
            )
        )
    ).scalars().first()

    # Avis récents (avec le nom d'utilisateur).
    rows = await db.execute(
        select(
            ProductRating.rating,
            ProductRating.comment,
            ProductRating.created_at,
            auth_models.UserTable.username,
        )
        .join(auth_models.UserTable, auth_models.UserTable.id == ProductRating.user_id)
        .where(ProductRating.barcode == barcode)
        .order_by(ProductRating.created_at.desc())
        .limit(20)
    )
    ratings = [
        {"rating": r, "comment": c, "created_at": ts, "username": u}
        for r, c, ts, u in rows
    ]

    return {
        "average": round(float(avg), 2) if avg is not None else None,
        "count": count or 0,
        "my_rating": mine.rating if mine else None,
        "my_comment": mine.comment if mine else None,
        "ratings": ratings,
    }


@router.get("/api/product/{barcode}/ratings", response_model=bd_schemas.RatingsSummary)
async def get_ratings(
    barcode: str,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user),
):
    """Résumé des notes d'un produit + la note de l'utilisateur courant."""
    return await _build_summary(db, barcode, current_user.id)


@router.post("/api/product/{barcode}/ratings", response_model=bd_schemas.RatingsSummary)
@limiter.limit("20/minute")  # écriture légère mais on évite le spam d'avis
async def rate_product(
    request: Request,
    barcode: str,
    payload: bd_schemas.RatingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user),
):
    """(Re)note un produit : upsert sur (user, barcode), puis renvoie le résumé."""
    stmt = pg_insert(ProductRating).values(
        barcode=barcode,
        user_id=current_user.id,
        rating=payload.rating,
        comment=payload.comment,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["user_id", "barcode"],
        set_={"rating": payload.rating, "comment": payload.comment, "updated_at": func.now()},
    )
    await db.execute(stmt)
    await db.commit()
    return await _build_summary(db, barcode, current_user.id)
