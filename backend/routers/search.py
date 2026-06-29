
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc, func, distinct
from typing import List, Optional

from fastapi_cache.decorator import cache

from database import get_db
from bdproduitdz import models, schemas

router = APIRouter(tags=["Search"])

@router.get("/api/search", response_model=List[schemas.Product])
async def search_products(
    q: Optional[str] = Query(None, description="Search term (product name, brand, barcode)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    subcategory: Optional[str] = Query(None, description="Filter by subcategory"),
    min_score: Optional[int] = Query(None, description="Minimum score"),
    max_score: Optional[int] = Query(None, description="Maximum score"),
    verified_only: bool = Query(False, description="Show only verified products"),
    limit: int = Query(20, ge=1, le=100, description="Nombre de résultats (max 100)"),
    offset: int = Query(0, ge=0, description="Décalage de pagination"),
    db: AsyncSession = Depends(get_db)
):
    """
    Advanced search with filters.
    """
    stmt = select(models.Product)

    # 1. Text Search
    if q:
        search_term = f"%{q}%"
        stmt = stmt.where(
            or_(
                models.Product.product_name.ilike(search_term),
                models.Product.brand.ilike(search_term),
                models.Product.barcode.ilike(search_term)
            )
        )

    # 2. Filters
    if category:
        stmt = stmt.where(models.Product.category == category)
    
    if subcategory:
        stmt = stmt.where(models.Product.subcategory == subcategory)

    if min_score is not None:
        stmt = stmt.where(models.Product.custom_score >= min_score)
    
    if max_score is not None:
        stmt = stmt.where(models.Product.custom_score <= max_score)

    if verified_only:
        stmt = stmt.where(models.Product.is_verified == True)

    # 3. Sorting (Default by Score DESC)
    stmt = stmt.order_by(desc(models.Product.custom_score))

    # 4. Pagination
    stmt = stmt.limit(limit).offset(offset)

    result = await db.execute(stmt)
    products = result.scalars().all()

    return products

@router.get("/api/categories")
@cache(expire=3600)  # Les catégories changent rarement : cache 1h (purgé sur écriture admin)
async def get_categories(db: AsyncSession = Depends(get_db)):
    """
    Get all categories and their subcategories.
    Returns: { "CategoryName": ["Subcat1", "Subcat2"], ... }
    """
    # Récupérer les paires distinctes (category, subcategory)
    stmt = select(models.Product.category, models.Product.subcategory).where(
        models.Product.category.isnot(None),
        models.Product.category != ""
    ).distinct()
    
    result = await db.execute(stmt)
    rows = result.all()
    
    categories_map = {}
    for cat, sub in rows:
        if cat not in categories_map:
            categories_map[cat] = set()
        if sub:
            categories_map[cat].add(sub)
            
    # Convert sets to sorted lists
    response = {
        cat: sorted(list(subs))
        for cat, subs in categories_map.items()
    }
    
    return response
