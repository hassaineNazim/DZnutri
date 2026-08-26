import asyncio
import json
import logging
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi_cache import FastAPICache
from fastapi_cache.decorator import cache

from database import get_db, AsyncSessionLocal
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
from bdproduitdz import scoring as bd_scoring
from bdproduitdz import cosmetic_crud
from utils import send_expo_push

router = APIRouter(tags=["Admin"])


def _daily_series(rows, days: int) -> list:
    """Transforme des lignes (datetime_tronqué, count) en série continue de
    `days` jours (les jours sans donnée sont remplis à 0) — prêt à tracer."""
    counts = {}
    for day_value, count in rows:
        if day_value is None:
            continue
        d = day_value.date() if isinstance(day_value, datetime) else day_value
        counts[d] = count
    today = datetime.now(timezone.utc).date()
    return [
        {"date": (today - timedelta(days=offset)).isoformat(),
         "count": counts.get(today - timedelta(days=offset), 0)}
        for offset in range(days - 1, -1, -1)
    ]


@router.get("/api/admin/monitoring")
# Dashboard = ~20 requêtes d'agrégation. On sert un instantané caché 30 s :
# l'admin peut rafraîchir sans marteler la base à chaque chargement. L'auth
# (get_current_admin) reste évaluée à chaque requête ; la clé de cache ignore
# session/user -> tous les admins partagent le même instantané global. Toute
# écriture admin appelle FastAPICache.clear() -> le dashboard redevient frais.
@cache(expire=30)
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
    # Les colonnes DateTime sont stockées SANS fuseau (naïves, en UTC) :
    # asyncpg refuse de comparer un datetime aware avec elles (DataError).
    now_db = datetime.utcnow()
    last_24h = now_db - timedelta(hours=24)
    last_7d = now_db - timedelta(days=7)
    last_30d = now_db - timedelta(days=30)

    # --- Totaux de base (requêtes COUNT, pas de chargement de lignes) -------
    total_users = await db.scalar(select(func.count(auth_models.UserTable.id))) or 0
    total_products = await db.scalar(select(func.count(bd_models.Product.id))) or 0
    total_cosmetics = await db.scalar(select(func.count(bd_models.CosmeticProduct.id))) or 0
    off_imports_total = await db.scalar(
        select(func.count(bd_models.Product.id)).where(
            bd_models.Product.source == "openfoodfacts"
        )
    ) or 0
    off_imports_24h = await db.scalar(
        select(func.count(bd_models.Product.id)).where(
            bd_models.Product.source == "openfoodfacts",
            bd_models.Product.created_at >= last_24h,
        )
    ) or 0
    off_imports_7d = await db.scalar(
        select(func.count(bd_models.Product.id)).where(
            bd_models.Product.source == "openfoodfacts",
            bd_models.Product.created_at >= last_7d,
        )
    ) or 0
    scans_24h = await db.scalar(
        select(func.count(bd_models.ScanHistory.id)).where(
            bd_models.ScanHistory.scanned_at >= last_24h
        )
    ) or 0

    # --- Soumissions par statut (alimentaire + cosmétique) ------------------
    status_rows = await db.execute(
        select(bd_models.Submission.status, func.count(bd_models.Submission.id)).group_by(
            bd_models.Submission.status
        )
    )
    submissions_by_status = {status or "unknown": count for status, count in status_rows}

    cosmetic_status_rows = await db.execute(
        select(
            bd_models.CosmeticSubmission.status, func.count(bd_models.CosmeticSubmission.id)
        ).group_by(bd_models.CosmeticSubmission.status)
    )
    cosmetic_submissions_by_status = {
        status or "unknown": count for status, count in cosmetic_status_rows
    }

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

    # --- Top cosmétiques scannés (30 derniers jours) ------------------------
    top_cosmetic_rows = await db.execute(
        select(
            bd_models.CosmeticProduct.barcode,
            bd_models.CosmeticProduct.product_name,
            bd_models.CosmeticProduct.brand,
            bd_models.CosmeticProduct.image_url,
            func.count(bd_models.ScanHistory.id).label("scan_count"),
        )
        .join(bd_models.ScanHistory, bd_models.ScanHistory.cosmetic_id == bd_models.CosmeticProduct.id)
        .where(bd_models.ScanHistory.scanned_at >= last_30d)
        .group_by(
            bd_models.CosmeticProduct.id,
            bd_models.CosmeticProduct.barcode,
            bd_models.CosmeticProduct.product_name,
            bd_models.CosmeticProduct.brand,
            bd_models.CosmeticProduct.image_url,
        )
        .order_by(func.count(bd_models.ScanHistory.id).desc())
        .limit(10)
    )
    top_scanned_cosmetics = [
        {
            "barcode": barcode,
            "product_name": product_name,
            "brand": brand,
            "image_url": image_url,
            "scan_count": scan_count,
        }
        for barcode, product_name, brand, image_url, scan_count in top_cosmetic_rows
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

    # =========================================================================
    # Analytics avancées (utilisateurs, produits, scans, signalements)
    # Toutes les requêtes sont des agrégats (GROUP BY) : coût constant côté API.
    # =========================================================================
    last_14d = now_db - timedelta(days=14)

    # --- Utilisateurs : inscriptions / jour (14 j) + nouveaux sur 7 j ---------
    signup_day = func.date_trunc("day", auth_models.UserTable.created_at)
    signup_rows = await db.execute(
        select(signup_day, func.count(auth_models.UserTable.id))
        .where(auth_models.UserTable.created_at >= last_14d)
        .group_by(signup_day)
    )
    new_users_7d = await db.scalar(
        select(func.count(auth_models.UserTable.id)).where(
            auth_models.UserTable.created_at >= last_7d
        )
    ) or 0

    # --- Scans / jour (14 j) --------------------------------------------------
    scan_day = func.date_trunc("day", bd_models.ScanHistory.scanned_at)
    scan_rows = await db.execute(
        select(scan_day, func.count(bd_models.ScanHistory.id))
        .where(bd_models.ScanHistory.scanned_at >= last_14d)
        .group_by(scan_day)
    )

    # --- Produits : distribution des scores (bandes Yuka) ---------------------
    score_bucket = case(
        (bd_models.Product.custom_score >= 75, "excellent"),
        (bd_models.Product.custom_score >= 50, "bon"),
        (bd_models.Product.custom_score >= 25, "mediocre"),
        (bd_models.Product.custom_score.isnot(None), "mauvais"),
        else_="sans_score",
    )
    bucket_rows = await db.execute(
        select(score_bucket, func.count(bd_models.Product.id)).group_by(score_bucket)
    )
    score_distribution = {"excellent": 0, "bon": 0, "mediocre": 0, "mauvais": 0, "sans_score": 0}
    for bucket, count in bucket_rows:
        score_distribution[bucket] = count

    # --- Produits : distribution Nutri-Score (A-E) ----------------------------
    grade_rows = await db.execute(
        select(func.lower(bd_models.Product.nutri_score), func.count(bd_models.Product.id))
        .where(bd_models.Product.nutri_score.isnot(None))
        .group_by(func.lower(bd_models.Product.nutri_score))
    )
    nutriscore_distribution = {g: 0 for g in ("a", "b", "c", "d", "e")}
    for grade, count in grade_rows:
        if grade in nutriscore_distribution:
            nutriscore_distribution[grade] = count

    # --- Produits : top catégories (volume + score moyen) ---------------------
    cat_rows = await db.execute(
        select(
            bd_models.Product.category,
            func.count(bd_models.Product.id),
            func.avg(bd_models.Product.custom_score),
        )
        .where(bd_models.Product.category.isnot(None), bd_models.Product.category != "")
        .group_by(bd_models.Product.category)
        .order_by(func.count(bd_models.Product.id).desc())
        .limit(8)
    )
    top_categories = [
        {"category": cat, "count": count, "avg_score": round(avg) if avg is not None else None}
        for cat, count, avg in cat_rows
    ]

    # --- Produits : ajoutés / jour (14 j) + pires scores -----------------------
    product_day = func.date_trunc("day", bd_models.Product.created_at)
    product_rows = await db.execute(
        select(product_day, func.count(bd_models.Product.id))
        .where(bd_models.Product.created_at >= last_14d)
        .group_by(product_day)
    )
    worst_rows = await db.execute(
        select(
            bd_models.Product.barcode,
            bd_models.Product.product_name,
            bd_models.Product.custom_score,
            bd_models.Product.nutri_score,
        )
        .where(bd_models.Product.custom_score.isnot(None))
        .order_by(bd_models.Product.custom_score.asc())
        .limit(5)
    )
    worst_products = [
        {"barcode": b, "product_name": n, "custom_score": s, "nutri_score": g}
        for b, n, s, g in worst_rows
    ]

    # --- Cosmétiques : ajoutés / jour (14 j) + distribution des scores ---------
    cosmetic_day = func.date_trunc("day", bd_models.CosmeticProduct.created_at)
    cosmetic_added_rows = await db.execute(
        select(cosmetic_day, func.count(bd_models.CosmeticProduct.id))
        .where(bd_models.CosmeticProduct.created_at >= last_14d)
        .group_by(cosmetic_day)
    )

    cosmetic_score_bucket = case(
        (bd_models.CosmeticProduct.cosmetic_score >= 75, "excellent"),
        (bd_models.CosmeticProduct.cosmetic_score >= 50, "bon"),
        (bd_models.CosmeticProduct.cosmetic_score >= 25, "mediocre"),
        (bd_models.CosmeticProduct.cosmetic_score.isnot(None), "mauvais"),
        else_="sans_score",
    )
    cosmetic_bucket_rows = await db.execute(
        select(cosmetic_score_bucket, func.count(bd_models.CosmeticProduct.id)).group_by(
            cosmetic_score_bucket
        )
    )
    cosmetic_score_distribution = {
        "excellent": 0, "bon": 0, "mediocre": 0, "mauvais": 0, "sans_score": 0
    }
    for bucket, count in cosmetic_bucket_rows:
        cosmetic_score_distribution[bucket] = count

    worst_cosmetic_rows = await db.execute(
        select(
            bd_models.CosmeticProduct.barcode,
            bd_models.CosmeticProduct.product_name,
            bd_models.CosmeticProduct.cosmetic_score,
        )
        .where(bd_models.CosmeticProduct.cosmetic_score.isnot(None))
        .order_by(bd_models.CosmeticProduct.cosmetic_score.asc())
        .limit(5)
    )
    worst_cosmetics = [
        {"barcode": b, "product_name": n, "cosmetic_score": s}
        for b, n, s in worst_cosmetic_rows
    ]

    # --- Contributeurs les plus actifs (soumissions) ---------------------------
    contrib_rows = await db.execute(
        select(
            auth_models.UserTable.username,
            func.count(bd_models.Submission.id).label("submissions"),
        )
        .join(bd_models.Submission, bd_models.Submission.submitted_by_user_id == auth_models.UserTable.id)
        .group_by(auth_models.UserTable.id, auth_models.UserTable.username)
        .order_by(func.count(bd_models.Submission.id).desc())
        .limit(5)
    )
    top_contributors = [
        {"username": username, "submissions": count} for username, count in contrib_rows
    ]

    # --- Signalements par type et statut ---------------------------------------
    report_rows = await db.execute(
        select(bd_models.Report.type, bd_models.Report.status, func.count(bd_models.Report.id))
        .group_by(bd_models.Report.type, bd_models.Report.status)
    )
    reports_summary = {}
    for rtype, rstatus, count in report_rows:
        key = rtype.value if hasattr(rtype, "value") else str(rtype)
        reports_summary.setdefault(key, {})[rstatus or "unknown"] = count

    return {
        "generated_at": now.isoformat(),
        "analytics": {
            "users": {
                "new_last_7d": new_users_7d,
                "signups_per_day": _daily_series(signup_rows.all(), 14),
            },
            "scans_per_day": _daily_series(scan_rows.all(), 14),
            "products": {
                "added_per_day": _daily_series(product_rows.all(), 14),
                "score_distribution": score_distribution,
                "nutriscore_distribution": nutriscore_distribution,
                "top_categories": top_categories,
                "worst_products": worst_products,
            },
            "cosmetics": {
                "added_per_day": _daily_series(cosmetic_added_rows.all(), 14),
                "score_distribution": cosmetic_score_distribution,
                "worst_cosmetics": worst_cosmetics,
            },
            "top_contributors": top_contributors,
            "reports": reports_summary,
        },
        "totals": {
            "users": total_users,
            "products": total_products,
            "cosmetics": total_cosmetics,
            "openfoodfacts_imports": off_imports_total,
            "openfoodfacts_imports_last_24h": off_imports_24h,
            "openfoodfacts_imports_last_7d": off_imports_7d,
            "scans_last_24h": scans_24h,
            "submissions_by_status": submissions_by_status,
            "cosmetic_submissions_by_status": cosmetic_submissions_by_status,
        },
        "top_scanned_products": top_scanned,
        "top_scanned_cosmetics": top_scanned_cosmetics,
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
                    body = f"Merci ! Votre produit '{approved_product.product_name}' a été ajouté à Remo Scan."
                    
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


# =============================================================================
# Statut des signalements (résoudre / ignorer)
# =============================================================================


@router.put("/api/admin/reports/{report_id}/status")
async def update_report_status(
    report_id: int,
    payload: bd_schemas.ReportStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),
):
    """Change le statut d'un signalement (pending / resolved / ignored).

    Sans cet endpoint, les signalements restaient « pending » pour toujours :
    l'admin ne pouvait ni les clore après correction, ni les ignorer.
    """
    result = await db.execute(select(bd_models.Report).where(bd_models.Report.id == report_id))
    report = result.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Signalement non trouvé")

    report.status = payload.status
    await db.commit()
    return {"id": report.id, "status": report.status}


@router.get("/api/admin/pending-additives")
async def get_pending_additives(
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),
):
    """Additifs inconnus détectés lors des scans, à catégoriser par l'admin.

    Alimenté par `store_or_increment_pending_additifs` (moteur de scoring) quand
    un code E croisé sur un produit n'est pas encore dans la table `additifs`.
    Triés par fréquence d'apparition décroissante (les plus courants d'abord).
    """
    result = await db.execute(
        select(bd_models.AdditifPending).order_by(bd_models.AdditifPending.count.desc())
    )
    rows = result.scalars().all()
    return [
        {
            "code": a.e_code,
            "count": a.count,
            "status": "reviewed" if a.reviewed else "new",
            "source": a.source,
            "first_seen_at": a.first_seen_at.isoformat() if a.first_seen_at else None,
        }
        for a in rows
    ]


# =============================================================================
# Modération des avis utilisateurs (notes + commentaires)
# =============================================================================


@router.get("/api/admin/ratings")
async def get_ratings_admin(
    with_comments_only: bool = False,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),
):
    """Liste les avis récents pour modération (note, commentaire, auteur)."""
    limit = max(1, min(limit, 100))
    stmt = (
        select(bd_models.ProductRating, auth_models.UserTable.username)
        .join(auth_models.UserTable, auth_models.UserTable.id == bd_models.ProductRating.user_id)
        .order_by(bd_models.ProductRating.created_at.desc())
        .limit(limit)
        .offset(max(offset, 0))
    )
    if with_comments_only:
        stmt = stmt.where(
            bd_models.ProductRating.comment.isnot(None),
            bd_models.ProductRating.comment != "",
        )
    rows = await db.execute(stmt)
    ratings = [
        {
            "id": r.id,
            "barcode": r.barcode,
            "rating": r.rating,
            "comment": r.comment,
            "username": username,
            "user_id": r.user_id,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r, username in rows
    ]
    return {"ratings": ratings, "count": len(ratings)}


@router.delete("/api/admin/ratings/{rating_id}")
async def delete_rating_admin(
    rating_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),
):
    """Supprime un avis abusif (modération)."""
    result = await db.execute(
        select(bd_models.ProductRating).where(bd_models.ProductRating.id == rating_id)
    )
    rating = result.scalars().first()
    if not rating:
        raise HTTPException(status_code=404, detail="Avis non trouvé")
    await db.delete(rating)
    await db.commit()
    logger.info("Avis %s supprimé par l'admin %s", rating_id, current_user.username)
    return {"message": "Avis supprimé", "id": rating_id}


# =============================================================================
# Soumissions COSMÉTIQUES (revue admin, mirror de l'alimentaire)
# =============================================================================


@router.get("/api/admin/cosmetic-submissions")
async def get_cosmetic_submissions_admin(
    status: str = "pending",
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),
):
    """Liste les soumissions cosmétiques (par défaut : en attente)."""
    submissions = await cosmetic_crud.get_cosmetic_submissions(db, status=status)
    return {"submissions": submissions, "count": len(submissions)}


@router.post("/api/admin/cosmetic-submissions/{submission_id}/approve")
async def approve_cosmetic_submission_admin(
    submission_id: int,
    admin_data: bd_schemas.CosmeticApproval,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),
):
    """Approuve/corrige une soumission cosmétique -> crée le produit + score."""
    try:
        product, submitting_user_id = await cosmetic_crud.approve_cosmetic_submission(
            db, submission_id, admin_data
        )
        await _invalidate_product_cache()

        if submitting_user_id:
            try:
                user = await auth_crud.get_user_by_id(db, submitting_user_id)
                if user and getattr(user, "userPushToken", None):
                    background_tasks.add_task(
                        send_expo_push,
                        submitting_user_id,
                        user.userPushToken,
                        "✅ Cosmétique validé !",
                        f"Merci ! '{product.product_name}' a été ajouté à Remo Scan.",
                    )
            except Exception as e:  # noqa: BLE001
                logger.warning("Notification push cosmétique : %s", e)

        return {
            "message": "Soumission cosmétique approuvée avec succès",
            "product": product,
            "uploader_id": submitting_user_id,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Erreur interne lors de l'approbation cosmétique %s", submission_id)
        raise HTTPException(status_code=500, detail="Erreur interne lors de l'approbation.")


@router.post("/api/admin/cosmetic-submissions/{submission_id}/reject")
async def reject_cosmetic_submission_admin(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),
):
    """Rejette une soumission cosmétique."""
    try:
        submission = await cosmetic_crud.reject_cosmetic_submission(db, submission_id)
        return {"message": "Soumission cosmétique rejetée", "submission_id": submission.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        logger.exception("Erreur interne lors du rejet cosmétique %s", submission_id)
        raise HTTPException(status_code=500, detail="Erreur interne lors du rejet.")


@router.put("/api/admin/cosmetic/{barcode}")
async def update_cosmetic_admin(
    barcode: str,
    product_update: bd_schemas.CosmeticProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),
):
    """Corrige un cosmétique (Admin) et recalcule le score si les ingrédients changent."""
    updated = await cosmetic_crud.update_cosmetic(db, barcode, product_update)
    if not updated:
        raise HTTPException(status_code=404, detail="Cosmétique non trouvé")
    await _invalidate_product_cache()
    return updated


# =============================================================================
# Rescoring global de la base (à lancer après un changement d'algorithme)
# =============================================================================

# État partagé via le backend de cache (Redis en prod) : visible depuis tous
# les workers Uvicorn, contrairement à une variable de module.
_RESCORE_STATE_KEY = "dznutri:rescore-state"
# Verrou par worker : évite deux lancements simultanés depuis le même process.
_rescore_local_lock = asyncio.Lock()


async def _get_rescore_state() -> dict:
    try:
        raw = await FastAPICache.get_backend().get(_RESCORE_STATE_KEY)
    except Exception:  # noqa: BLE001 - cache indisponible = aucun rescoring connu
        return {"running": False}
    if not raw:
        return {"running": False}
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8")
    try:
        return json.loads(raw)
    except (ValueError, TypeError):
        return {"running": False}


async def _set_rescore_state(state: dict) -> None:
    try:
        await FastAPICache.get_backend().set(
            _RESCORE_STATE_KEY, json.dumps(state), expire=86400
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("Impossible de persister l'état du rescoring: %s", exc)


async def _run_full_rescore() -> None:
    """Recalcule le score de TOUS les produits (session dédiée, hors requête).

    Publie sa progression dans le cache pour que l'admin puisse la suivre.
    Utilisé après un changement d'algorithme de scoring.
    """
    state = {
        "running": True,
        "total": 0,
        "done": 0,
        "errors": 0,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "finished_at": None,
    }
    await _set_rescore_state(state)

    try:
        # Pénalités d'additifs rechargées depuis la base (pas le cache 5 min).
        bd_crud.invalidate_additifs_cache()

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(bd_models.Product))
            products = result.scalars().all()
            state["total"] = len(products)
            await _set_rescore_state(state)

            for i, product in enumerate(products, 1):
                try:
                    product_data = {
                        "nutriments": product.nutriments,
                        "nova_group": product.nova_group,
                        "additives_tags": product.additives_tags,
                        "ecoscore_grade": product.ecoscore_grade,
                        "ingredients_text": product.ingredients_text,
                        "category": product.category,
                        "subcategory": product.subcategory,
                    }
                    with db.no_autoflush:
                        score_result = await bd_scoring.calculate_score(db, product_data)

                    product.custom_score = score_result.get("score")
                    product.detail_custom_score = score_result.get("details")
                    if score_result.get("nutri_score"):
                        product.nutri_score = score_result.get("nutri_score")
                    product.updated_at = datetime.utcnow()
                except Exception:  # noqa: BLE001 - un produit cassé ne stoppe pas le lot
                    state["errors"] += 1
                    logger.exception("Rescoring impossible pour le produit id=%s", product.id)

                if i % 50 == 0:
                    await db.commit()
                    state["done"] = i
                    await _set_rescore_state(state)

            await db.commit()
            state["done"] = state["total"]

        # Les scores ont changé : on purge le cache des réponses produit.
        await _invalidate_product_cache()
        logger.info(
            "Rescoring global terminé : %s produits, %s erreurs.",
            state["total"], state["errors"],
        )
    except Exception:  # noqa: BLE001
        logger.exception("Rescoring global interrompu par une erreur")
        state["error_message"] = "Rescoring interrompu — voir les logs serveur."
    finally:
        state["running"] = False
        state["finished_at"] = datetime.now(timezone.utc).isoformat()
        await _set_rescore_state(state)


@router.post("/api/admin/rescore", status_code=202)
async def start_full_rescore(
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),
):
    """Lance le rescoring de toute la base en tâche de fond (202 Accepted).

    Suivre la progression via GET /api/admin/rescore/status.
    """
    async with _rescore_local_lock:
        state = await _get_rescore_state()
        if state.get("running"):
            raise HTTPException(status_code=409, detail="Un rescoring est déjà en cours.")
        # On marque tout de suite comme démarré pour fermer la fenêtre de course.
        await _set_rescore_state({"running": True, "total": 0, "done": 0, "errors": 0,
                                  "started_at": datetime.now(timezone.utc).isoformat(),
                                  "finished_at": None})
    asyncio.create_task(_run_full_rescore())
    logger.info("Rescoring global lancé par l'admin %s", current_user.username)
    return {"message": "Rescoring lancé", "status_url": "/api/admin/rescore/status"}


@router.get("/api/admin/rescore/status")
async def get_rescore_status(
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),
):
    """Progression du rescoring en cours (ou résultat du dernier lancé)."""
    return await _get_rescore_state()
