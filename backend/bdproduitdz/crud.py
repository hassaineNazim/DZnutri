from sqlalchemy.ext.asyncio import AsyncSession
from . import models , schemas, scoring
from auth import models as auth_models
from . import additives_parser
from sqlalchemy.orm import load_only
from typing import Dict, Tuple, List
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from datetime import datetime
import logging
from sqlalchemy import func


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

# Dans backend/bdproduitdz/crud.py

async def approve_submission(db: AsyncSession, submission_id: int, admin_data: schemas.AdminProductApproval):
    """
    Approuve une soumission : Calcule le score final et crée le produit.
    """
    # 1. Récupérer la soumission originale
    result = await db.execute(select(models.Submission).where(models.Submission.id == submission_id))
    submission = result.scalars().first()
    
    if not submission or submission.status != "pending":
        raise ValueError("Soumission non trouvée ou déjà traitée")

    # 2. Préparer les données pour le scoring
    # On convertit les données de l'admin en dictionnaire.
    # Note : admin_data.category contient maintenant le "typeSpecifique" (ex: "boissons")
    data_for_scoring = admin_data.model_dump()
    
    # On s'assure que les tags d'additifs sont bien une liste pour le scoring
    if 'additives_tags' not in data_for_scoring or data_for_scoring['additives_tags'] is None:
        data_for_scoring['additives_tags'] = []

    print(f"--- Scoring pour approbation : {data_for_scoring.get('product_name')} (Type: {data_for_scoring.get('category')}) ---")

    # 3. Calculer le score final (Appel Asynchrone)
    # Le scoring va gérer tout seul les additifs inconnus grâce à votre nouveau code
    score_result = await scoring.calculate_score(db, data_for_scoring)
    
    print(f"--- Résultat Scoring : {score_result.get('score')}/100 ---")

    # 4. Créer le produit final
    product_to_create = schemas.ProductCreate(
        # On reprend toutes les données validées par l'admin
        **admin_data.model_dump(),
        
        # On ajoute les infos fixes venant de la soumission originale
        barcode=submission.barcode,
        image_url=submission.image_front_url, # L'image principale
        
        # On injecte les résultats du scoring
        custom_score=score_result.get('score'),
        detail_custom_score=score_result.get('details'),
        
        # On peut aussi sauvegarder le type spécifique si on veut le garder
        # (Assurez-vous que votre modèle Product a une colonne pour ça, sinon ignorez)
        # category=admin_data.category 
    )

    # 5. Sauvegarder le produit
    created_product = await create_product(db, product=product_to_create)
    
    # 6. Mettre à jour le statut de la soumission
    submission.status = "approved"
    db.add(submission)
    await db.commit()
    
    # 7. Retourner le tuple (produit, user_id) pour la notification
    return created_product, submission.submitted_by_user_id


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
    """
    Ajoute un scan à l'historique.
    Si le produit a déjà été scanné par cet utilisateur,
    met à jour le timestamp 'scanned_at' pour le faire remonter.
    Sinon, crée une nouvelle entrée.
    """
    
    # 1. On vérifie si une entrée existe déjà pour ce user ET ce produit
    result = await db.execute(
        select(models.ScanHistory).where(
            models.ScanHistory.user_id == user_id,
            models.ScanHistory.product_id == product_id
        )
    )
    existing_scan = result.scalars().first()

    if existing_scan:
        # 2. Si elle existe : on met à jour son timestamp à "maintenant"
        existing_scan.scanned_at = func.now()
        db.add(existing_scan)
    else:
        # 3. Si elle n'existe pas : on crée une nouvelle entrée
        new_scan = models.ScanHistory(user_id=user_id, product_id=product_id)
        db.add(new_scan)
    
    # 4. On sauvegarde les changements
    await db.commit()
    
    return existing_scan if existing_scan else new_scan

async def get_user_history(db: AsyncSession, user_id: int):
    # Récupère les scans et les produits associés en renvoyant un objet combiné
    # contenant les informations du produit et la date du scan (scanned_at).
    result = await db.execute(
        select(models.ScanHistory, models.Product)
        .join(models.Product, models.Product.id == models.ScanHistory.product_id)
        .where(models.ScanHistory.user_id == user_id)
        .order_by(models.ScanHistory.scanned_at.desc())
        .limit(50)
    )

    rows = result.all()
    history_list = []
    for scan, product in rows:
        try:
            scanned_at = scan.scanned_at.isoformat() if getattr(scan, 'scanned_at', None) else None
        except Exception:
            scanned_at = None

        history_list.append({
            'id': product.id,
            'barcode': product.barcode,
            'product_name': product.product_name,
            'brand': product.brand,
            'image_url': product.image_url,
            'custom_score': product.custom_score,
            'nutri_score': getattr(product, 'nutri_score', None),
            'scanned_at': scanned_at,
        })

    return history_list

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


def normalize_db_key(key: str) -> str:
    """Nettoie les clés de la base de données pour la comparaison."""
    if not key:
        return ""
    # "E330" -> "e330"
    # "SIN 330" -> "sin330"
    return str(key).strip().lower().replace(" ", "")

async def get_additifs_penalty(db: AsyncSession) -> Dict[str, float]:
    """
    Crée un dictionnaire de pénalités pour TOUS les identifiants d'additifs
    (E, SIN, INS), normalisés pour la recherche.
    ex: {"e330": 2.0, "sin330": 2.0, "ins330": 2.0, ...}
    """
    # 1. On sélectionne tous les identifiants et le niveau de danger
    query = select(
        models.Additif.e_number, 
        models.Additif.sin_number, 
        models.Additif.ins_number, 
        models.Additif.danger_level
    )
    result = await db.execute(query)
    
    penalty_map = {}
    
    # 2. On construit le dictionnaire de pénalités
    for row in result.all():
        e_number, sin_number, ins_number, danger_level = row
        penalty = float(danger_level or 0.0)

        # On crée une liste de toutes les clés valides pour cet additif
        keys_to_add = [
            normalize_db_key(e_number),
            normalize_db_key(sin_number),
            normalize_db_key(ins_number)
        ]

        # On ajoute chaque clé valide au dictionnaire
        for key in keys_to_add:
            if key:
                penalty_map[key] = penalty
                
    return penalty_map



def normalize_code(code: str) -> str:
    """Nettoie un tag d'additif pour ne garder que le code E."""
    if not code:
        return ""
    c = str(code).strip().upper() # Met en majuscules pour la cohérence
    if ":" in c:
        c = c.split(":")[-1]
    return c

async def save_user_push_token(db: AsyncSession, user_id: int, token: str):
    """Sauvegarde le token de notification push de l'utilisateur.

    Note: users are defined in the auth app (auth.models.UserTable), not in this module's
    local models module. Use auth_models.UserTable here.
    """
    result = await db.execute(select(auth_models.UserTable).where(auth_models.UserTable.id == user_id))
    user = result.scalars().first()
    if not user:
        raise ValueError("Utilisateur non trouvé")
    
    user.userPushToken = token
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def store_or_increment_pending_additifs(db: AsyncSession, additives: List[str]):
    """
    Insère de nouveaux additifs ou incrémente le compteur de ceux qui existent déjà,
    en une seule requête "upsert".
    """
    if not additives:
        return

    # Normalisation et dédoublonnage
    normalized_codes = {normalize_code(a) for a in additives if a}
    normalized_codes.discard("")  # Retire les chaînes vides
    if not normalized_codes:
        return

    # Préparer les données pour l'insertion
    insert_data = [
        {'e_code': code, 'count': 1, 'status': 'pending'}
        for code in normalized_codes
    ]

    # Créer la commande INSERT ... ON CONFLICT DO UPDATE
    stmt = insert(models.AdditifPending).values(insert_data)

    update_on_conflict_stmt = stmt.on_conflict_do_update(
        index_elements=['e_code'],  # colonne unique
        set_={
            'count': models.AdditifPending.count + 1  # incrémenter le compteur
        }
    )

    try:
        await db.execute(update_on_conflict_stmt)
        
    except Exception as e:
        print(f"Erreur lors de l'upsert des additifs : {e}")
        
        raise e    
  
async def get_user_by_submission(db: AsyncSession, submission_id: int) :
    
    result = await db.execute(
        select(models.Submission.submitted_by_user_id)
        .where(models.Submission.id == submission_id)
    )
    user = result.scalars()
    print(user)
    if user is None:
        raise ValueError("Soumission non trouvée")
    return user


def is_product_suspicious(product_data: dict) -> bool:
    """
    Renvoie True si le produit manque d'informations critiques pour le scoring.
    """
    # --- LIGNE DE TEST (Force le signalement) ---
    #print("!!! TEST : Signalement forcé pour ce produit !!!")
    #return True 
    # --------------------------------------------
    nutriments = product_data.get('nutriments', {})
    
    # 1. Vérifier les nutriments essentiels (s'ils sont à 0 ou inexistants)
    # Note: On accepte 0 pour le sel/sucre, mais 0 calories c'est rare sauf pour l'eau.
    energy = nutriments.get('energy-kcal_100g')
    if energy is None: 
        return True # Pas de calories = Suspect
        
    # 2. Vérifier les additifs
    # Si on a une liste d'ingrédients (texte) mais AUCUN tag d'additif, c'est louche.
    ingredients_text = product_data.get('ingredients_text', '')
    tags = product_data.get('additives_tags', [])
    
    if ingredients_text and len(ingredients_text) > 50 and not tags:
        return True # Texte long mais 0 additif détecté = Suspect (Parsing OFF échoué)

    return False


async def create_report(db: AsyncSession, report: schemas.ReportCreate, user_id: int = None):
    """Crée un nouveau signalement."""
    db_report = models.Report(
        barcode=report.barcode,
        type=report.type,
        description=report.description,
        image_url=report.image_url,
        user_id=user_id, # Peut être None si c'est automatique
        status="pending"
    )
    db.add(db_report)
    await db.commit()
    await db.refresh(db_report)
    return db_report

async def get_pending_reports(db: AsyncSession):
    """Récupère les signalements en attente pour l'admin."""
    result = await db.execute(
        select(models.Report)
        .where(models.Report.status == "pending")
        .order_by(models.Report.created_at.desc())
    )
    return result.scalars().all()


    
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





async def update_product(db: AsyncSession, barcode: str, product_update: schemas.ProductUpdate):
    """
    Met à jour un produit existant et recalcule son score.
    """
    # 1. Récupérer le produit existant
    result = await db.execute(select(models.Product).where(models.Product.barcode == barcode))
    db_product = result.scalars().first()
    
    if not db_product:
        return None

    # 2. Mettre à jour les champs du produit
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)

    # 3. Recalculer le score avec les nouvelles données
    # On reconstruit un dictionnaire complet pour le scoring
    data_for_scoring = product_update.model_dump()
    
    print(f"--- Recalcul du score pour {barcode} ---")
    score_result = await scoring.calculate_score(db, data_for_scoring)
    print(f"Nouveau score : {score_result.get('score')}")
    
    # 4. Mettre à jour le score dans le produit
    db_product.custom_score = score_result.get('score')
    db_product.detail_custom_score = score_result.get('details')

    # 5. Sauvegarder
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    
    return db_product


