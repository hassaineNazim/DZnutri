from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from . import models , schemas, scoring
from . import additives_parser
from sqlalchemy.orm import load_only
from typing import Dict, Tuple


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
    Approuve une soumission, analyse les additifs, calcule le score,
    crée le produit final, et met à jour le statut de la soumission.
    """
    # Étape 1 : Récupérer la soumission originale pour le barcode et les images
    result = await db.execute(select(models.Submission).where(models.Submission.id == submission_id))
    submission = result.scalars().first()
    
    if not submission or submission.status != "pending":
        raise ValueError("Soumission non trouvée ou déjà traitée")

    # Étape 2 : Analyser le texte des ingrédients validé par l'admin
    found_additives = await additives_parser.find_additives_in_text(db, admin_data.ingredients_text)
    
    # On prépare une simple liste des codes additifs pour la sauvegarde
    additives_tags_for_db = [add.e_number for add in found_additives]

    # Étape 3 : Préparer toutes les données pour le scoring
    # On combine les données du formulaire de l'admin avec la liste des additifs trouvés.
    data_for_scoring = {
        **admin_data.model_dump(),
        "additives_tags": additives_tags_for_db 
    }
    
    # Étape 4 : Calculer le score final
    # On passe les données complètes ET la liste des objets additifs (avec leur niveau de danger)
    score_result = scoring.calculate_score(data_for_scoring, found_additives)
    
    # Étape 5 : Préparer les données pour la création du produit final dans la table 'produits'
    product_to_create = schemas.ProductCreate(
        **admin_data.model_dump(), # On utilise les données validées par l'admin
        barcode=submission.barcode,
        image_url=submission.image_front_url,
        additives_tags=additives_tags_for_db,
        custom_score=score_result.get('score'),
        detail_custom_score=score_result.get('details')
    )

    # On appelle la fonction CRUD pour créer le produit
    created_product = await create_product(db, product=product_to_create)
    
    # Étape 6 : Mettre à jour le statut de la soumission
    submission.status = "approved"
    db.add(submission)
    await db.commit() # Sauvegarde les changements (la création du produit et la mise à jour du statut)
    
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

async def get_user_history_stats(db: AsyncSession, user_id: int):
    """
    Récupère tous les scores de l'historique d'un utilisateur et calcule des statistiques.
    """
    # On fait une requête pour récupérer uniquement la colonne custom_score
    result = await db.execute(
        select(models.Product.custom_score)
        .join(models.ScanHistory, models.Product.id == models.ScanHistory.product_id)
        .where(models.ScanHistory.user_id == user_id)
    )
    scores = result.scalars().all()

    if not scores:
        return {
            "total_scans": 0,
            "average_score": 0,
            "distribution": {"excellent": 0, "bon": 0, "mediocre": 0, "mauvais": 0}
        }

    total_scans = len(scores)
    average_score = round(sum(scores) / total_scans)
    
    distribution = {"excellent": 0, "bon": 0, "mediocre": 0, "mauvais": 0}
    for score in scores:
        if score >= 75:
            distribution["excellent"] += 1
        elif score >= 50:
            distribution["bon"] += 1
        elif score >= 25:
            distribution["mediocre"] += 1
        else:
            distribution["mauvais"] += 1
            
    return {
        "total_scans": total_scans,
        "average_score": average_score,
        "distribution": distribution
    }


async def get_additifs_penalty(db: AsyncSession) -> Dict[str, float]:
    query = select(models.Additif.e_number, models.Additif.danger_level)
    result = await db.execute(query)
    rows = result.all()  # liste de tuples (e_number, danger_level)
    return {str(r[0]).strip().lower(): float(r[1] or 0.0) for r in rows if r[0]}





"""
async def get_penalties_for_additives(db: AsyncSession, additive_codes: list[str]):
    if not additive_codes:
        return {}

    query = (
        select(models.Additif)
        .options(load_only(models.Additif.e_number, models.Additif.danger_level))
        .where(models.Additif.e_number.in_(additive_codes))
    )
    result = await db.execute(query)
    penalties = result.scalars().all()
    return {a.code.lower(): a.penalty for a in penalties}

"""




