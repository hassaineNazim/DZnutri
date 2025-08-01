from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from . import models , schemas


async def getProduitByBarcode(db: AsyncSession, barcode: str):
    """Récupère un produit officiel par son code-barres de manière asynchrone."""
    
    result = await db.execute(select(models.Product).where(models.Product.barcode == barcode))
    return result.scalars().first()

async def add_product_submissions(db: AsyncSession, submission: schemas.SubmissionCreate, user_id: int):
    """
    Crée une nouvelle soumission de produit.
    """
    db_submission = models.Submission(
        **submission.dict(),
        submitted_by_user_id=user_id
    )
    db.add(db_submission)
    await db.commit()
    await db.refresh(db_submission)
    return db_submission



