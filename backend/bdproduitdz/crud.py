from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from . import models

async def getProduitByBarcode(db: AsyncSession, barcode: str):
    """Récupère un produit officiel par son code-barres de manière asynchrone."""
    
    result = await db.execute(select(models.Product).where(models.Product.barcode == barcode))
    return result.scalars().first()

