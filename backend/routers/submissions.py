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

@router.post("/api/submission", response_model=bd_schemas.Submission)
async def create_product_submission(
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user),
    barcode: str = Form(...),
    typeProduct: str = Form(...),
    productName: str = Form(...),
    brand: str = Form(...),
    image_front: UploadFile = File(...),
    image_ingredients: Optional[UploadFile] = File(None)
):
    """
    Endpoint pour la soumission d'un produit par un utilisateur.
    Il sauvegarde les images, analyse le texte, et enregistre la soumission.
    """
    # --- 1. Upload des images sur Cloudinary ---
    loop = asyncio.get_running_loop()
    upload_func_front = partial(cloudinary.uploader.upload, file=image_front.file)
    upload_result_front = await loop.run_in_executor(None, upload_func_front)
    front_image_url = upload_result_front.get('secure_url')

    ingredients_image_url = None
    if image_ingredients:
        upload_func_ing = partial(cloudinary.uploader.upload, file=image_ingredients.file)
        upload_result_ing = await loop.run_in_executor(None, upload_func_ing)
        ingredients_image_url = upload_result_ing.get('secure_url')

    # --- 2. Analyse OCR et Parsing ---
    ocr_text = ""
    parsed_nutriments = {}
    found_additives_for_db = []
    if ingredients_image_url:
        ocr_text = bd_ocr.detect_text_from_url(ingredients_image_url)
        parsed_nutriments = bd_parser.parse_nutritional_info_improved(ocr_text)
        
        found_additives_objects = await bd_additives.find_additives_in_text(db, ocr_text)
        found_additives_for_db = [
            {"e_number": add.e_number, "name": add.name, "danger_level": add.danger_level} 
            for add in found_additives_objects
        ]

    # --- 3. Sauvegarde dans la table 'submissions' ---
    submission_data = bd_schemas.SubmissionCreate(
        barcode=barcode,
        typeProduct=typeProduct, 
        productName=productName, 
        brand=brand,
        image_front_url=front_image_url,
        image_ingredients_url=ingredients_image_url,
        ocr_ingredients_text=ocr_text,
        parsed_nutriments=parsed_nutriments,
        found_additives=found_additives_for_db
    )
    
    new_submission = await bd_crud.add_product_submissions(
        db=db,
        submission=submission_data,
        user_id=current_user.id
    )
    
    return new_submission
