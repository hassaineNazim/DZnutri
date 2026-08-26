import logging
import os
import re
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
import certifi

logger = logging.getLogger("dznutri.products")

from database import get_db
from bdproduitdz import crud as bd_crud
from bdproduitdz import schemas as bd_schemas
from bdproduitdz import scoring as bd_scoring
from bdproduitdz import models as bd_models

router = APIRouter(tags=["Products"])

from sqlalchemy import select
from fastapi_cache.decorator import cache


# --- Client HTTP partagé pour Open Food Facts ---
# Réutiliser un seul client (au lieu d'en créer un par requête) permet de
# garder les connexions ouvertes (keep-alive), de mutualiser le pool de
# sockets et la résolution DNS. On le ferme proprement au shutdown (main.py).
_off_client: httpx.AsyncClient | None = None

OFF_TIMEOUT = httpx.Timeout(10.0, connect=5.0)


def _clean_product_name(value) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = " ".join(value.split()).strip()
    return cleaned or None


def _is_barcode_name(value: str | None, barcode: str) -> bool:
    """Détecte les anciens noms de secours constitués d'un code-barres."""
    cleaned = _clean_product_name(value)
    if not cleaned:
        return True
    return (
        cleaned == barcode
        or cleaned.casefold() == "produit sans nom"
        or bool(re.fullmatch(r"\d{6,18}", cleaned))
    )


def resolve_off_product_name(product_data: dict, barcode: str) -> str:
    """Choisit le meilleur nom disponible dans la réponse multilingue OFF.

    OpenFoodFacts peut laisser ``product_name`` vide tout en fournissant une
    variante localisée. Le code-barres ne doit jamais devenir le titre visible.
    """
    priority_keys = (
        "product_name_fr",
        "product_name",
        "product_name_ar",
        "product_name_en",
        "abbreviated_product_name",
        "generic_name_fr",
        "generic_name",
    )
    candidates = [product_data.get(key) for key in priority_keys]
    candidates.extend(
        product_data.get(key)
        for key in sorted(product_data)
        if key.startswith("product_name_") and key not in priority_keys
    )
    for candidate in candidates:
        cleaned = _clean_product_name(candidate)
        if cleaned and not _is_barcode_name(cleaned, barcode):
            return cleaned

    brand = _clean_product_name(product_data.get("brands"))
    return f"Produit {brand}" if brand else "Produit sans nom"


def resolve_off_categories(product_data: dict) -> tuple[str | None, str | None]:
    """Normalise les catégories OFF, y compris quand les clés valent ``null``."""
    raw_categories = _clean_product_name(product_data.get("categories")) or ""
    category_parts = [part.strip() for part in raw_categories.split(",") if part.strip()]
    category = _clean_product_name(product_data.get("pnns_groups_1"))
    subcategory = _clean_product_name(product_data.get("pnns_groups_2"))
    return (
        category or (category_parts[0] if category_parts else None),
        subcategory or (category_parts[1] if len(category_parts) > 1 else None),
    )


async def _repair_local_product_name(db: AsyncSession, product, name: str | None = None):
    repaired_name = name or (f"Produit {product.brand}" if product.brand else "Produit sans nom")
    product.product_name = repaired_name
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


def get_off_client() -> httpx.AsyncClient:
    """Retourne le client HTTP partagé (créé à la première utilisation)."""
    global _off_client
    if _off_client is None or _off_client.is_closed:
        _off_client = httpx.AsyncClient(
            verify=certifi.where(),
            timeout=OFF_TIMEOUT,
            # Open Food Facts demande un User-Agent identifiant pour ne pas bloquer.
            headers={"User-Agent": f"RemoScan/2.0 ({os.getenv('CONTACT_EMAIL', 'contact@remoscan.app')})"},
        )
    return _off_client


async def close_off_client() -> None:
    """Ferme le client partagé (appelé au shutdown de l'app)."""
    global _off_client
    if _off_client is not None and not _off_client.is_closed:
        await _off_client.aclose()
    _off_client = None


# --- Fonction Helper pour détecter les produits incomplets ---
def is_product_suspicious(product_data: dict) -> bool:
    """
    Renvoie True si le produit manque d'informations critiques (Calories, Additifs suspect).
    """
    nutriments = product_data.get('nutriments', {})
    
    # 1. Vérifier les calories (Si absent ou 0, c'est louche, sauf pour l'eau)
    # On vérifie energy-kcal_100g
    if nutriments.get('energy-kcal_100g') is None:
        return True
        
    # 2. Vérifier la cohérence Ingrédients vs Additifs
    # Si on a une longue liste d'ingrédients mais AUCUN additif détecté par OFF, c'est souvent un échec de parsing.
    ingredients_text = product_data.get('ingredients_text', '')
    tags = product_data.get('additives_tags', [])
    
    if ingredients_text and len(ingredients_text) > 60 and not tags:
        return True 

    return False

# --- VOTRE ENDPOINT MIS À JOUR ---
@router.get("/api/product/{barcode}")
@cache(expire=86400, namespace="product-v2") # Cache de 24 heures
async def get_product_by_barcode(barcode: str, db: AsyncSession = Depends(get_db)):
    """
    Cherche un produit. D'abord en local, sinon sur Open Food Facts.
    Si trouvé sur OFF : Calcule le score, signale à l'admin si incomplet, sauvegarde et retourne.
    """
    
    # 1. On cherche D'ABORD dans la base de données locale
    db_product = await bd_crud.getProduitByBarcode(db, barcode=barcode)
    
    needs_name_repair = bool(db_product and _is_barcode_name(db_product.product_name, barcode))
    if db_product and not needs_name_repair:
        logger.debug("Produit %s trouvé en base locale.", barcode)
        return {"source": "local_db", "product": db_product}

    # 2. Si non trouvé, on cherche sur Open Food Facts
    logger.debug("Produit %s non trouvé localement, recherche Open Food Facts...", barcode)
    off_api_url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"

    client = get_off_client()
    try:
        response = await client.get(off_api_url)
    except httpx.RequestError:
        if db_product:
            repaired = await _repair_local_product_name(db, db_product)
            return {"source": "local_db_name_repaired", "product": repaired}
        raise HTTPException(status_code=503, detail="Erreur de communication avec Open Food Facts")

    data = response.json()

    if data.get("status") == 1:
        logger.debug("Produit %s trouvé sur Open Food Facts.", barcode)
        off_product_data = data.get("product") or {}
        product_name = resolve_off_product_name(off_product_data, barcode)
        category, subcategory = resolve_off_categories(off_product_data)

        # Les anciennes versions enregistraient parfois le code-barres comme
        # nom. Au prochain scan, on répare la ligne existante au lieu de créer
        # un doublon ou de continuer à afficher ce code dans l'historique.
        if db_product:
            repaired = await _repair_local_product_name(db, db_product, product_name)
            return {"source": "local_db_name_repaired", "product": repaired}

        # 3. On calcule le score
        scoringGlobal = await bd_scoring.calculate_score(db, off_product_data)
        custom_score = scoringGlobal.get('score')
        detail_custom_score = scoringGlobal.get('details')
        logger.debug("Score calculé pour %s : %s", barcode, custom_score)

        # --- SIGNALEMENT AUTOMATIQUE (VERSION TABLE REPORTS) ---
        if is_product_suspicious(off_product_data):
            logger.info("Produit %s suspect -> création d'un report automatique.", barcode)
            
            # Vérifier si un report existe déjà pour éviter les doublons
            existing_report = await db.execute(
                select(bd_models.Report).where(
                    bd_models.Report.barcode == barcode,
                    bd_models.Report.type == bd_models.ReportType.AUTO
                )
            )
            
            if not existing_report.scalars().first():
                # On crée le report via le modèle directement (plus rapide ici)
                auto_report = bd_models.Report(
                    barcode=barcode,
                    type=bd_models.ReportType.AUTO, # "automatiqueReport"
                    description="Données incomplètes ou suspectes détectées lors du scan (Calories/Additifs manquants).",
                    status="pending"
                )
                db.add(auto_report)
                await db.commit()
        # -------------------------------------------------------

        # 5. On prépare les données pour les sauvegarder dans notre table 'products' 
        product_to_create = bd_schemas.ProductCreate(
            barcode=off_product_data.get('code', barcode),
            # `or` (et non get(default)) : OFF renvoie parfois la clé avec une
            # valeur vide/None -> sans repli, la validation Pydantic échouait (500).
            product_name=product_name,
            brand=off_product_data.get('brands'),
            nutriments=off_product_data.get('nutriments'),
            image_url=off_product_data.get('image_url'),
            ingredients_text=off_product_data.get('ingredients_text'),

            # Lettre Nutri-Score : on privilégie celle calculée par notre moteur
            # (cohérente avec les produits soumis), avec repli sur celle d'OFF.
            nutri_score=scoringGlobal.get('nutri_score') or off_product_data.get('nutriscore_grade'),
            nova_group=off_product_data.get('nova_group'),
            additives_tags=off_product_data.get('additives_tags', []),
            ecoscore_grade=off_product_data.get('ecoscore_grade'),
            
            custom_score=custom_score,
            detail_custom_score=detail_custom_score,
            category=category,
            subcategory=subcategory,
            source="openfoodfacts",
        )
        
        # 6. On appelle le CRUD pour créer le produit dans notre base de données
        created_product = await bd_crud.create_product(db, product=product_to_create)
        
        return {"source": "openfoodfacts_saved", "product": created_product}

    if db_product:
        repaired = await _repair_local_product_name(db, db_product)
        return {"source": "local_db_name_repaired", "product": repaired}

    # 7. Si le produit n'est trouvé nulle part
    raise HTTPException(status_code=404, detail="Produit non trouvé")

@router.get("/api/product/{barcode}/alternatives")
@cache(expire=86400) # Cache de 24 heures pour les alternatives
async def get_product_alternatives(barcode: str, db: AsyncSession = Depends(get_db)):
    """
    Retourne une liste de produits alternatifs (meilleur score, même catégorie).
    """
    alternatives = await bd_crud.get_better_alternatives(db, barcode=barcode)
    return {"alternatives": alternatives}

