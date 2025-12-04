from fastapi import APIRouter, Depends, File, UploadFile, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import cloudinary
import cloudinary.uploader
from functools import partial
import asyncio

from database import get_db
from auth import models as auth_models
from auth import security as auth_security
from bdproduitdz import crud as bd_crud
from bdproduitdz import schemas as bd_schemas
from bdproduitdz import ocr as bd_ocr
from bdproduitdz import parser as bd_parser
from bdproduitdz import additives_parser as bd_additives 

router = APIRouter(tags=["Submissions"])

@router.post("/api/submission", response_model=bd_schemas.SubmissionResponse) 
async def create_product_submission(
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user),
    barcode: str = Form(...),
    typeProduct: str = Form(...),
    productName: str = Form(None),
    brand: str = Form(None),
    typeSpecifique: str = Form(None),
    image_front: UploadFile = File(...),
    image_ingredients: Optional[UploadFile] = File(None),
    # --- AJOUT : Nouvelle image ---
    image_nutrition: Optional[UploadFile] = File(None) 
):
    """
    Endpoint pour la soumission d'un produit.
    Gère l'upload de 3 images max et l'OCR ciblé.
    """
    loop = asyncio.get_running_loop()

    # --- 1. Upload des images sur Cloudinary (En parallèle si possible) ---
    # On prépare les fonctions d'upload
    tasks_upload = []
    
    # Front (Toujours là)
    tasks_upload.append(loop.run_in_executor(None, partial(cloudinary.uploader.upload, file=image_front.file)))
    
    # Ingrédients (Optionnel)
    if image_ingredients:
        tasks_upload.append(loop.run_in_executor(None, partial(cloudinary.uploader.upload, file=image_ingredients.file)))
    
    # Nutrition (Optionnel)
    if image_nutrition:
        tasks_upload.append(loop.run_in_executor(None, partial(cloudinary.uploader.upload, file=image_nutrition.file)))

    # On exécute tous les uploads
    results_upload = await asyncio.gather(*tasks_upload)

    # On récupère les URLs dans l'ordre
    front_image_url = results_upload[0].get('secure_url')
    
    # Gestion des index dynamiques selon la présence des fichiers optionnels
    current_idx = 1
    ingredients_image_url = None
    if image_ingredients:
        ingredients_image_url = results_upload[current_idx].get('secure_url')
        current_idx += 1
        
    nutrition_image_url = None
    if image_nutrition:
        nutrition_image_url = results_upload[current_idx].get('secure_url')


    # --- 2. Analyse OCR Ciblée (En parallèle) ---
    ocr_text_ingredients = ""
    ocr_text_nutrition = ""
    
    # On prépare les tâches OCR
    ocr_tasks = []
    
    # Tâche 1 : OCR Ingrédients (si image existe)
    if ingredients_image_url:
        ocr_tasks.append(loop.run_in_executor(None, bd_ocr.detect_text_from_url, ingredients_image_url))
    else:
        ocr_tasks.append(asyncio.sleep(0)) # Tâche vide pour garder l'ordre

    # Tâche 2 : OCR Nutrition (si image existe)
    if nutrition_image_url:
        ocr_tasks.append(loop.run_in_executor(None, bd_ocr.detect_text_from_url, nutrition_image_url))
    else:
        ocr_tasks.append(asyncio.sleep(0)) # Tâche vide

    # Exécution parallèle
    ocr_results = await asyncio.gather(*ocr_tasks)
    
    # Récupération des textes (si l'OCR a retourné un résultat, sinon vide)
    ocr_text_ingredients = ocr_results[0] if ocr_results[0] else ""
    ocr_text_nutrition = ocr_results[1] if ocr_results[1] else ""


    # --- 3. Parsing Spécialisé ---
    
    parsed_nutriments = {}
    found_additives_for_db = []

    # A. Analyse des Nutriments (Priorité à la photo Nutrition, sinon fallback sur Ingrédients)
    text_for_nutriments = ocr_text_nutrition if ocr_text_nutrition else ocr_text_ingredients
    if text_for_nutriments:
        # Votre fonction de parsing améliorée
        parsed_nutriments = bd_parser.parse_nutritional_info_improved(text_for_nutriments)

    # B. Analyse des Additifs (Priorité à la photo Ingrédients)
    # Les additifs ne sont QUE dans la liste des ingrédients
    if ocr_text_ingredients:
        found_additives_objects = await bd_additives.find_additives_in_text(db, ocr_text_ingredients)
        found_additives_for_db = [
            {"e_number": add.e_number, "name": add.name, "danger_level": add.danger_level} 
            for add in found_additives_objects
        ]

    # --- 4. Sauvegarde ---
    
    # On combine les textes OCR pour garder une trace complète dans la BD
    full_ocr_text = f"--- INGRÉDIENTS ---\n{ocr_text_ingredients}\n\n--- NUTRITION ---\n{ocr_text_nutrition}"

    submission_data = bd_schemas.SubmissionCreate(
        barcode=barcode,
        typeProduct=typeProduct, # ou category selon votre schéma
        productName=productName, 
        brand=brand,
        typeSpecifique=typeSpecifique,
        image_front_url=front_image_url,
        image_ingredients_url=ingredients_image_url,
        image_nutrition_url=nutrition_image_url, # Nouveau champ
        
        ocr_ingredients_text=full_ocr_text, # On sauvegarde tout le texte lu
        parsed_nutriments=parsed_nutriments,
        found_additives=found_additives_for_db
    )
    
    new_submission = await bd_crud.add_product_submissions(
        db=db,
        submission=submission_data,
        user_id=current_user.id
    )
    
    return new_submission