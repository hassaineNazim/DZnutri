
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List

from database import get_db
from bdproduitdz import models, schemas, crud
from auth.security import get_current_user
from auth import models as auth_models

router = APIRouter(tags=["Favorites"])

@router.post("/api/favorites/{barcode}")
async def toggle_favorite(
    barcode: str,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(get_current_user)
):
    """
    Toggle favorite status for a product.
    If it exists, remove it. If not, add it.
    """
    # 1. Find product
    product = await crud.getProduitByBarcode(db, barcode)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 2. Check if already favorite
    stmt = select(models.Favorite).where(
        models.Favorite.user_id == current_user.id,
        models.Favorite.product_id == product.id
    )
    result = await db.execute(stmt)
    favorite = result.scalars().first()

    if favorite:
        # Remove
        await db.delete(favorite)
        await db.commit()
        return {"status": "removed", "is_favorite": False}
    else:
        # Add
        new_favorite = models.Favorite(user_id=current_user.id, product_id=product.id)
        db.add(new_favorite)
        await db.commit()
        return {"status": "added", "is_favorite": True}

@router.get("/api/favorites_check/{barcode}")
async def check_favorite(
    barcode: str,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(get_current_user)
):
    """Check if a product is in favorites."""
    product = await crud.getProduitByBarcode(db, barcode)
    if not product:
        return {"is_favorite": False}

    stmt = select(models.Favorite).where(
        models.Favorite.user_id == current_user.id,
        models.Favorite.product_id == product.id
    )
    result = await db.execute(stmt)
    favorite = result.scalars().first()
    return {"is_favorite": bool(favorite)}

@router.get("/api/favorites", response_model=List[schemas.Product])
async def get_favorites(
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(get_current_user)
):
    """List all favorite products."""
    stmt = (
        select(models.Product)
        .join(models.Favorite, models.Favorite.product_id == models.Product.id)
        .where(models.Favorite.user_id == current_user.id)
        .order_by(models.Favorite.saved_at.desc())
    )
    result = await db.execute(stmt)
    products = result.scalars().all()
    return products
