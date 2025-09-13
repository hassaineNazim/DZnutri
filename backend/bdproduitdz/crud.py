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

async def approve_submission(db: AsyncSession, submission_id: int, admin_data: schemas.AdminProductApproval):
    """
    Approuve une soumission en utilisant les données validées par l'admin.
    """
    result = await db.execute(select(models.Submission).where(models.Submission.id == submission_id))
    submission = result.scalars().first()
    
    if not submission or submission.status != "pending":
        raise ValueError("Soumission non trouvée ou déjà traitée")
    full_product_data_for_scoring = {
        **admin_data.model_dump(),
        "barcode": submission.barcode
    }
    
    score_result = scoring.calculate_score(full_product_data_for_scoring)
    
    product_to_create = schemas.ProductCreate(
        **admin_data.model_dump(),
        barcode=submission.barcode,
        image_url=submission.image_front_url,
        custom_score=score_result.get('score')
    )

    created_product = await create_product(db, product=product_to_create)
    
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
    
   
    submission.status = "rejected"
    

    await db.commit()
    await db.refresh(submission)
    
    return submission

async def create_product(db: AsyncSession, product: schemas.ProductCreate) -> models.Product:
    """
    Crée un nouveau produit dans la base de données à partir d'un schéma Pydantic.
    """
    db_product = models.Product(**product.model_dump())

    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    
    return db_product


async def add_scan_to_history(db: AsyncSession, user_id: int, product_id: int):
    # (Optionnel) Vérifier si le dernier scan pour cet utilisateur est le même produit
    # pour éviter les doublons rapides.
    new_scan = models.ScanHistory(user_id=user_id, product_id=product_id)
    db.add(new_scan)
    await db.commit()
    return new_scan

async def get_user_history(db: AsyncSession, user_id: int):
    # Récupère les scans et les produits associés
    result = await db.execute(
        select(models.Product)
        .join(models.ScanHistory, models.Product.id == models.ScanHistory.product_id)
        .where(models.ScanHistory.user_id == user_id)
        .order_by(models.ScanHistory.scanned_at.desc())
        .limit(50) # On limite aux 50 derniers scans par exemple
    )
    return result.scalars().all()

async def delete_scan_from_history(db: AsyncSession, user_id: int, product_id: int):
    """
    Supprime un élément spécifique de l'historique d'un utilisateur.
    Vérifie que l'élément appartient bien à l'utilisateur avant de le supprimer.
    """
    
    # 1. On cherche l'entrée dans l'historique qui correspond à la fois à l'ID de l'historique
    #    ET à l'ID de l'utilisateur. C'est la partie sécurité.
    result = await db.execute(
        select(models.ScanHistory).where(
            models.ScanHistory.product_id == product_id,
            models.ScanHistory.user_id == user_id
            ).order_by(models.ScanHistory.scanned_at.desc())
    )
    
    history_item = result.scalars().first()
    
    # 2. Si on ne trouve rien (soit l'historique n'existe pas, soit il n'appartient pas au bon utilisateur),
    #    on lève une erreur.
    if not history_item:
        raise ValueError("Élément d'historique non trouvé ou non autorisé")
        
    # 3. Si l'élément est trouvé, on le supprime
    await db.delete(history_item)
    await db.commit()
    
    return True 


