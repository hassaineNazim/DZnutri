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

async def get_all_submissions(db: AsyncSession, status: str = "pending"):
    """
    Récupère toutes les soumissions de produits pour l'admin.
    Par défaut, récupère les soumissions en attente.
    """
    result = await db.execute(
        select(models.Submission)
        .where(models.Submission.status == status)
        .order_by(models.Submission.submitted_at.desc())
    )
    return result.scalars().all()

async def approve_submission(db: AsyncSession, submission_id: int, admin_user_id: int):
    """
    Approuve une soumission et la transfère vers la table des produits.
    La soumission est supprimée après l'approbation.
    """
    # Récupérer la soumission
    result = await db.execute(
        select(models.Submission).where(models.Submission.id == submission_id)
    )
    submission = result.scalars().first()
    
    if not submission:
        raise ValueError("Soumission non trouvée")
    
    if submission.status != "pending":
        raise ValueError("Cette soumission a déjà été traitée")
    
    # Créer un nouveau produit à partir de la soumission
    new_product = models.Product(
        barcode=submission.barcode,
        product_name=f"Produit {submission.barcode}",  # Nom par défaut, peut être modifié plus tard
        brand=None,
        nutriments={},
        ingredients_text="",
        user_id=submission.submitted_by_user_id,
        is_verified=True,
        image_url=submission.image_front_url,
        quantily="",
        category=submission.typeProduct,
        additives_tags={},
        custom_score=None
    )
    
    # Ajouter le produit à la base de données
    db.add(new_product)
    
    # Supprimer la soumission de la base de données
    await db.delete(submission)
    
    # Sauvegarder les changements
    await db.commit()
    await db.refresh(new_product)
    
    return new_product

async def reject_submission(db: AsyncSession, submission_id: int):
    """
    Rejette une soumission.
    """
    result = await db.execute(
        select(models.Submission).where(models.Submission.id == submission_id)
    )
    submission = result.scalars().first()
    
    if not submission:
        raise ValueError("Soumission non trouvée")
    
    if submission.status != "pending":
        raise ValueError("Cette soumission a déjà été traitée")
    
    # Mettre à jour le statut de la soumission
    submission.status = "rejected"
    
    # Sauvegarder les changements
    await db.commit()
    await db.refresh(submission)
    
    return submission



