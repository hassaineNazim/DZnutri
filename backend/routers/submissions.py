import logging
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any
import cloudinary
import cloudinary.uploader
from functools import partial
import asyncio

logger = logging.getLogger("dznutri.submissions")

# Assurez-vous que ces imports correspondent à votre structure de dossiers
from database import get_db
from auth import models as auth_models
from auth import security as auth_security
from bdproduitdz import crud as bd_crud
from bdproduitdz import schemas as bd_schemas
from bdproduitdz import ocr as bd_ocr
from bdproduitdz import parser as bd_parser
from bdproduitdz import additives_parser as bd_additives 

router = APIRouter(tags=["Submissions"])

# Garde-fous sur les images uploadées : on borne le type MIME et la taille AVANT
# d'envoyer quoi que ce soit à Cloudinary (anti-abus / anti-DoS).
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 Mo
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif",
}


def _validate_image(upload: Optional[UploadFile], field: str) -> None:
    if upload is None:
        return
    if upload.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"{field}: type non supporté ({upload.content_type}). "
                   "Formats acceptés : JPEG, PNG, WebP, HEIC.",
        )
    size = getattr(upload, "size", None)
    if size is not None and size > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"{field}: image trop volumineuse (max {MAX_IMAGE_BYTES // (1024 * 1024)} Mo).",
        )


@router.post("/api/submission", response_model=bd_schemas.SubmissionResponse)
async def create_product_submission(
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user),
    barcode: str = Form(..., max_length=50),
    typeProduct: str = Form(..., max_length=100),
    productName: str = Form(None, max_length=200),
    brand: str = Form(None, max_length=200),
    typeSpecifique: str = Form(None, max_length=100),
    image_front: UploadFile = File(...),
    image_ingredients: Optional[UploadFile] = File(None),
    image_nutrition: Optional[UploadFile] = File(None) 
):
    """
    Endpoint pour la soumission d'un produit.
    Gère l'upload parallèle de 3 images et l'OCR ciblé.
    """
    loop = asyncio.get_running_loop()

    logger.info(
        "Soumission reçue: barcode=%s type=%s/%s nom=%s marque=%s",
        barcode, typeProduct, typeSpecifique, productName, brand,
    )

    # Validation des fichiers AVANT tout upload (type MIME + taille).
    _validate_image(image_front, "image_front")
    _validate_image(image_ingredients, "image_ingredients")
    _validate_image(image_nutrition, "image_nutrition")

    # ==============================================================================
    # 1. UPLOAD DES IMAGES SUR CLOUDINARY (PARALLÈLE)
    # ==============================================================================
    # On utilise une liste fixe de 3 tâches pour garantir l'ordre des résultats :
    # [0]: Front, [1]: Ingrédients, [2]: Nutrition
    tasks_upload = []
    
    # A. Front (Toujours présent)
    tasks_upload.append(loop.run_in_executor(None, partial(cloudinary.uploader.upload, file=image_front.file)))
    
    # B. Ingrédients (Si absent, on ajoute une tâche vide qui retourne None immédiatement)
    if image_ingredients:
        tasks_upload.append(loop.run_in_executor(None, partial(cloudinary.uploader.upload, file=image_ingredients.file)))
    else:
        tasks_upload.append(asyncio.sleep(0)) # Renverra None
    
    # C. Nutrition (Idem)
    if image_nutrition:
        tasks_upload.append(loop.run_in_executor(None, partial(cloudinary.uploader.upload, file=image_nutrition.file)))
    else:
        tasks_upload.append(asyncio.sleep(0)) # Renverra None

    # Exécution simultanée
    results_upload = await asyncio.gather(*tasks_upload)

    # Récupération sécurisée des URLs (on vérifie si le résultat est un dictionnaire Cloudinary)
    front_data = results_upload[0]
    ing_data = results_upload[1] if isinstance(results_upload[1], dict) else None
    nut_data = results_upload[2] if isinstance(results_upload[2], dict) else None

    front_image_url = front_data.get('secure_url') if front_data else None
    ingredients_image_url = ing_data.get('secure_url') if ing_data else None
    nutrition_image_url = nut_data.get('secure_url') if nut_data else None


    # ==============================================================================
    # 2. ANALYSE OCR CIBLÉE (PARALLÈLE)
    # ==============================================================================
    ocr_tasks = []
    
    # Tâche A : OCR Ingrédients
    if ingredients_image_url:
        ocr_tasks.append(loop.run_in_executor(None, bd_ocr.detect_text_from_url, ingredients_image_url))
    else:
        ocr_tasks.append(asyncio.sleep(0))

    # Tâche B : OCR Nutrition
    if nutrition_image_url:
        ocr_tasks.append(loop.run_in_executor(None, bd_ocr.detect_text_from_url, nutrition_image_url))
    else:
        ocr_tasks.append(asyncio.sleep(0))

    # Exécution simultanée
    ocr_results = await asyncio.gather(*ocr_tasks)
    
    ocr_text_ingredients = ocr_results[0] if ocr_results[0] else ""
    ocr_text_nutrition = ocr_results[1] if ocr_results[1] else ""


    # ==============================================================================
    # 3. PARSING SPÉCIALISÉ (LOGIQUE SÉPARÉE)
    # ==============================================================================
    
    parsed_nutriments = {}
    found_additives_for_db = []

    # A. Analyse des Nutriments
    # On utilise le texte du tableau nutritionnel en priorité. 
    # S'il n'y a pas de photo nutrition, on essaie de lire sur la photo ingrédients.
    text_for_nutriments = ocr_text_nutrition if ocr_text_nutrition else ocr_text_ingredients
    
    if text_for_nutriments:
        # Votre fonction de parsing améliorée
        parsed_nutriments = bd_parser.parse_nutritional_info_improved(text_for_nutriments)

    # B. Analyse des Additifs
    # Les additifs ne se trouvent QUE dans la liste des ingrédients.
    # On n'utilise PAS le texte du tableau nutritionnel pour ça (trop de faux positifs).
    if ocr_text_ingredients:
        found_additives_objects = await bd_additives.find_additives_in_text(db, ocr_text_ingredients)
        found_additives_for_db = [
            {"e_number": add.e_number, "name": add.name, "danger_level": add.danger_level} 
            for add in found_additives_objects
        ]


    # ==============================================================================
    # 4. SAUVEGARDE
    # ==============================================================================
    
    # On combine les textes OCR pour garder une trace complète dans la BD pour l'admin
    full_ocr_text = ""
    if ocr_text_ingredients:
        full_ocr_text += f"--- INGRÉDIENTS ---\n{ocr_text_ingredients}\n\n"
    if ocr_text_nutrition:
        full_ocr_text += f"--- NUTRITION ---\n{ocr_text_nutrition}"

    submission_data = bd_schemas.SubmissionCreate(
        barcode=barcode,
        typeProduct=typeProduct, 
        productName=productName, 
        brand=brand,
        typeSpecifique=typeSpecifique, # Sauvegarde du type spécifique (boissons, fromages...)
        
        image_front_url=front_image_url,
        image_ingredients_url=ingredients_image_url,
        image_nutrition_url=nutrition_image_url,
        
        ocr_ingredients_text=full_ocr_text.strip(), 
        parsed_nutriments=parsed_nutriments,
        found_additives=found_additives_for_db
    )
    
    new_submission = await bd_crud.add_product_submissions(
        db=db,
        submission=submission_data,
        user_id=current_user.id
    )
    
    return new_submission