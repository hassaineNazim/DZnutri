from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import httpx
import certifi

from database import get_db
from bdproduitdz import crud as bd_crud
from bdproduitdz import schemas as bd_schemas
from bdproduitdz import scoring as bd_scoring
from bdproduitdz import models as bd_models

router = APIRouter(tags=["Products"])

from sqlalchemy import select


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
async def get_product_by_barcode(barcode: str, db: AsyncSession = Depends(get_db)):
    """
    Cherche un produit. D'abord en local, sinon sur Open Food Facts.
    Si trouvé sur OFF : Calcule le score, signale à l'admin si incomplet, sauvegarde et retourne.
    """
    
    # 1. On cherche D'ABORD dans la base de données locale
    db_product = await bd_crud.getProduitByBarcode(db, barcode=barcode)
    
    if db_product:
        print(f"Produit {barcode} trouvé dans la base de données locale.")
        return {"source": "local_db", "product": db_product}

    # 2. Si non trouvé, on cherche sur Open Food Facts
    print(f"Produit non trouvé localement, recherche sur Open Food Facts pour {barcode}...")
    off_api_url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
    
    async with httpx.AsyncClient(verify=certifi.where()) as client:
        try:
            response = await client.get(off_api_url)
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Erreur de communication avec Open Food Facts")

    data = response.json()
    
    if data.get("status") == 1:
        print("Produit trouvé sur Open Food Facts.")
        off_product_data = data.get("product")
        
        # 3. On calcule le score
        scoringGlobal = await bd_scoring.calculate_score(db, off_product_data)
        custom_score = scoringGlobal.get('score')
        detail_custom_score = scoringGlobal.get('details')
        print(f"Score calculé : {custom_score}")
        
        # --- SIGNALEMENT AUTOMATIQUE (VERSION TABLE REPORTS) ---
        if is_product_suspicious(off_product_data):
            print(f"--- ALERTE : Produit {barcode} suspect. Création Report Automatique... ---")
            
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
            product_name=off_product_data.get('product_name_fr', off_product_data.get('product_name')),
            brand=off_product_data.get('brands'),
            nutriments=off_product_data.get('nutriments'),
            image_url=off_product_data.get('image_url'),
            ingredients_text=off_product_data.get('ingredients_text'),

            nutriscore_grade=off_product_data.get('nutriscore_grade'),
            nova_group=off_product_data.get('nova_group'),
            additives_tags=off_product_data.get('additives_tags', []),
            ecoscore_grade=off_product_data.get('ecoscore_grade'),
            
            custom_score=custom_score,
            detail_custom_score=detail_custom_score
        )
        
        # 6. On appelle le CRUD pour créer le produit dans notre base de données
        created_product = await bd_crud.create_product(db, product=product_to_create)
        
        return {"source": "openfoodfacts_saved", "product": created_product}

    # 7. Si le produit n'est trouvé nulle part
    raise HTTPException(status_code=404, detail="Produit non trouvé")

@router.put("/testapi") #Juste pour voir la structure de l'API d'OpenFoodFacts
async def test_api(barcode: str):
    print(f"Produit non trouvé localement, recherche sur Open Food Facts pour {barcode}...")
    off_api_url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
    
    async with httpx.AsyncClient(verify=certifi.where()) as client:
        try:
            response = await client.get(off_api_url)
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Erreur de communication avec Open Food Facts")

    data = response.json()
    return {"message": data}
