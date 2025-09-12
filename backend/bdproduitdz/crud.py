from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from . import models , schemas, scoring


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

# Dans produit/crud.py
from . import scoring

async def approve_submission(db: AsyncSession, submission_id: int, admin_data: schemas.AdminProductApproval):
    """
    Approuve une soumission en utilisant les données validées par l'admin.
    """
    # 1. Récupérer la soumission pour avoir le barcode et les images
    result = await db.execute(select(models.Submission).where(models.Submission.id == submission_id))
    submission = result.scalars().first()
    
    if not submission or submission.status != "pending":
        raise ValueError("Soumission non trouvée ou déjà traitée")

    # 2. Préparer les données complètes pour le scoring
    # On combine les données de l'admin avec le barcode de la soumission
    full_product_data_for_scoring = {
        **admin_data.model_dump(),
        "barcode": submission.barcode
    }
    
    # 3. Calculer le score
    score_result = scoring.calculate_score(full_product_data_for_scoring)
    
    # 4. Préparer les données pour la création du produit final
    product_to_create = schemas.ProductCreate(
        **admin_data.model_dump(),
        barcode=submission.barcode,
        image_url=submission.image_front_url,
        custom_score=score_result.get('score')
    )

    created_product = await create_product(db, product=product_to_create)
    
    # 5. Mettre à jour le statut de la soumission
    submission.status = "approved"
    db.add(submission)
    await db.commit()
    
    return created_product

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

async def create_product(db: AsyncSession, product: schemas.ProductCreate) -> models.Product:
    """
    Crée un nouveau produit dans la base de données à partir d'un schéma Pydantic.
    """

    # Crée un objet de base de données à partir des données du schéma
    db_product = models.Product(**product.model_dump())
    
    # Ajoute, sauvegarde et rafraîchit l'objet
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    
    return db_product



