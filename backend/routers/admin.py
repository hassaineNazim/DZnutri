import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_cache import FastAPICache

from database import get_db
from observability import metrics

logger = logging.getLogger("dznutri.admin")


async def _invalidate_product_cache() -> None:
    """Purge le cache produit après une écriture admin.

    Les réponses produit sont mises en cache 24h. Quand un admin approuve ou
    modifie un produit, on vide le cache pour que les utilisateurs voient
    immédiatement les données à jour. On protège l'appel : un souci de cache ne
    doit jamais faire échouer l'action admin.
    """
    try:
        await FastAPICache.clear()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Invalidation du cache produit impossible: %s", exc)
from auth import models as auth_models
from auth import schemas as auth_schemas
from auth import security as auth_security
from auth import crud as auth_crud
from bdproduitdz import crud as bd_crud
from bdproduitdz import models as bd_models
from bdproduitdz import schemas as bd_schemas
from utils import send_expo_push

router = APIRouter(tags=["Admin"])


@router.get("/api/admin/monitoring")
async def get_monitoring_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),
):
    """Agrège les métriques du dashboard "Statistiques & Monitoring".

    Combine deux sources :
    - les métriques **temps réel** en mémoire (trafic, latence, OCR runtime,
      utilisateurs actifs, alertes) issues du middleware d'observabilité ;
    - des agrégats **durables** lus en base (totaux, top des produits scannés,
      taux de succès OCR historique des soumissions).

    Toute la lecture base se fait en requêtes agrégées (COUNT/GROUP BY) pour
    rester légère même avec un gros volume de données.
    """
    now = datetime.now(timezone.utc)
    last_24h = now - timedelta(hours=24)
    last_30d = now - timedelta(days=30)

    # --- Totaux de base (requêtes COUNT, pas de chargement de lignes) -------
    total_users = await db.scalar(select(func.count(auth_models.UserTable.id))) or 0
    total_products = await db.scalar(select(func.count(bd_models.Product.id))) or 0
    scans_24h = await db.scalar(
        select(func.count(bd_models.ScanHistory.id)).where(
            bd_models.ScanHistory.scanned_at >= last_24h
        )
    ) or 0

    # --- Soumissions par statut --------------------------------------------
    status_rows = await db.execute(
        select(bd_models.Submission.status, func.count(bd_models.Submission.id)).group_by(
            bd_models.Submission.status
        )
    )
    submissions_by_status = {status or "unknown": count for status, count in status_rows}

    # --- Top produits scannés (30 derniers jours) --------------------------
    top_rows = await db.execute(
        select(
            bd_models.Product.barcode,
            bd_models.Product.product_name,
            bd_models.Product.brand,
            bd_models.Product.image_url,
            func.count(bd_models.ScanHistory.id).label("scan_count"),
        )
        .join(bd_models.ScanHistory, bd_models.ScanHistory.product_id == bd_models.Product.id)
        .where(bd_models.ScanHistory.scanned_at >= last_30d)
        .group_by(
            bd_models.Product.id,
            bd_models.Product.barcode,
            bd_models.Product.product_name,
            bd_models.Product.brand,
            bd_models.Product.image_url,
        )
        .order_by(func.count(bd_models.ScanHistory.id).desc())
        .limit(10)
    )
    top_scanned = [
        {
            "barcode": barcode,
            "product_name": product_name,
            "brand": brand,
            "image_url": image_url,
            "scan_count": scan_count,
        }
        for barcode, product_name, brand, image_url, scan_count in top_rows
    ]

    # --- Taux de succès OCR historique (sur les soumissions) ---------------
    # Une soumission est "OCR en échec" si son texte contient le marqueur d'erreur.
    ocr_attempted = await db.scalar(
        select(func.count(bd_models.Submission.id)).where(
            bd_models.Submission.ocr_ingredients_text.isnot(None),
            bd_models.Submission.ocr_ingredients_text != "",
        )
    ) or 0
    ocr_failed = await db.scalar(
        select(func.count(bd_models.Submission.id)).where(
            bd_models.Submission.ocr_ingredients_text.ilike("%Erreur OCR%")
        )
    ) or 0
    ocr_success = max(ocr_attempted - ocr_failed, 0)
    ocr_success_rate = round(ocr_success / ocr_attempted, 4) if ocr_attempted else None

    return {
        "generated_at": now.isoformat(),
        "totals": {
            "users": total_users,
            "products": total_products,
            "scans_last_24h": scans_24h,
            "submissions_by_status": submissions_by_status,
        },
        "top_scanned_products": top_scanned,
        "ocr_history": {
            "attempted": ocr_attempted,
            "success": ocr_success,
            "failure": ocr_failed,
            "success_rate": ocr_success_rate,
        },
        "runtime": metrics.snapshot(),
    }

@router.get("/api/admin/submissions")
async def get_submissions_for_admin(
    status: str = "pending",
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin)
):
    """
    Endpoint sécurisé pour que l'admin récupère les soumissions.
    """
    submissions = await bd_crud.get_all_submissions(db, status=status)
    return {"submissions": submissions, "count": len(submissions)}

@router.post("/api/admin/submissions/{submission_id}/approve")
async def approve_product_submission(
    submission_id: int,
    admin_data: bd_schemas.AdminProductApproval, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),
):
    """
    Approuve une soumission.
    Prend en compte le 'category' (typeSpecifique) envoyé par le front pour le scoring.
    """
    try:
        # L'appel au CRUD modifié ci-dessus
        result = await bd_crud.approve_submission(db, submission_id, admin_data)
        
        # Gestion du retour (Tuple ou Objet simple)
        if isinstance(result, tuple):
            approved_product, submitting_user_id = result
        else:
            approved_product = result
            submitting_user_id = None

        logger.info("Produit approuvé et créé : %s", approved_product.product_name)
        await _invalidate_product_cache()

        # --- NOTIFICATION PUSH ---
        if submitting_user_id:
            # On lance la notification en tâche de fond (background task) ou directement ici
            # pour ne pas bloquer si ça échoue.
            try:
                submitting_user = await auth_crud.get_user_by_id(db, submitting_user_id)
                if submitting_user and getattr(submitting_user, 'userPushToken', None):
                    token = submitting_user.userPushToken
                    title = "✅ Produit Validé !"
                    body = f"Merci ! Votre produit '{approved_product.product_name}' a été ajouté à DZnutri."
                    
                    # Appel de votre fonction de push en tâche de fond
                    background_tasks.add_task(send_expo_push, submitting_user_id, token, title, body)
                    logger.info("Notification planifiée pour l'utilisateur %s", submitting_user_id)
            except Exception as e:
                logger.warning("Erreur notification push : %s", e)
        # -------------------------

        return {
            "message": "Soumission approuvée avec succès",
            "product": approved_product,
            "uploader_id": submitting_user_id
        }

    except ValueError as e:
        # Gestion propre des erreurs métier (ex: soumission déjà traitée)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        # Erreurs imprévues : on journalise le détail mais on ne l'expose pas au client.
        logger.exception("Erreur interne lors de l'approbation de la soumission %s", submission_id)
        raise HTTPException(status_code=500, detail="Erreur interne lors de l'approbation.")
          

@router.post("/api/admin/submissions/{submission_id}/reject")
async def reject_product_submission(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),
):
    """
    Endpoint pour rejeter une soumission.
    """
    
    try:
        rejected_submission = await bd_crud.reject_submission(db, submission_id)
        return {
            "message": "Soumission rejetée avec succès",
            "submission": rejected_submission
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Erreur interne lors du rejet de la soumission %s", submission_id)
        raise HTTPException(status_code=500, detail="Erreur interne lors du rejet.")

@router.get("/api/admin/profile", response_model=auth_schemas.AdminUser)
async def get_admin_profile(
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin)
):
    """
    Endpoint sécurisé qui retourne le profil de l'admin actuellement connecté.
    """
    return current_user

@router.put("/api/admin/product/{barcode}")
async def update_product_admin(
    barcode: str, 
    product_update: bd_schemas.ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: auth_models.UserTable = Depends(auth_security.get_current_admin)
):
    """
    Met à jour un produit (Admin seulement) et recalcule le score.
    """
    updated_product = await bd_crud.update_product(db, barcode, product_update)

    if not updated_product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    await _invalidate_product_cache()
    return updated_product
