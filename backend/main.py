from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select 
import httpx, certifi

import os
import requests
from requests.exceptions import ConnectionError, HTTPError
from google.oauth2 import id_token 
from google.auth.transport import requests
import asyncio
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from typing import Optional
from pydantic import BaseModel
import shutil
import cloudinary
import os
import cloudinary.uploader
from functools import partial
import asyncio
from dotenv import load_dotenv
from database import get_db
from auth import models as auth_models
from auth import schemas as auth_schemas
from auth import security as auth_security
from auth import crud as auth_crud
from auth import jwt as auth_jwt
from bdproduitdz import crud as bd_crud
from bdproduitdz import schemas as bd_schemas
from bdproduitdz import ocr as bd_ocr
from bdproduitdz import scoring as bd_scoring
from bdproduitdz import parser as bd_parser
from bdproduitdz import additives_parser as bd_additives 
import logging
from exponent_server_sdk import (
        DeviceNotRegisteredError,
        PushClient,
        PushMessage,
        PushServerError,
        PushTicketError,
    )

load_dotenv() 

cloudinary.config(
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key = os.getenv("CLOUDINARY_API_KEY"),
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
)


Path("uploads").mkdir(exist_ok=True)


app = FastAPI(
    title="DZnutri API",
    description="API for DZnutri product management system",
    version="1.0.0"
)


# NOTE: we no longer use a preconfigured requests.Session here; the PushClient
# will use its default transport. If you later want to enable an EXPO_TOKEN or
# custom session headers, re-add a session and pass it to PushClient().


# Helper to send Expo push notifications using exponent_server_sdk in a thread
async def send_expo_push(db: AsyncSession, user_id: int, to_token: str, title: str, body: str, data: dict | None = None):
    """
    Envoie une notification push en utilisant la SDK Expo dans un thread séparé
    avec un timeout et des logs de débogage clairs.
    """
    
    # --- 1. Imports à l'intérieur pour éviter le blocage au démarrage ---
    from exponent_server_sdk import (
        DeviceNotRegisteredError,
        PushClient,
        PushMessage,
        PushServerError,
        PushTicketError,
    )
    
    def _publish():
        """La fonction synchrone (bloquante) qui s'exécutera dans un thread."""
        print(f"--- [PID {os.getpid()}] _publish: Création du client et du message...", flush=True)
        client = PushClient()
        message = PushMessage(to=to_token, title=title, body=body, data=data, sound="default", priority='high')
        print(f"------------------- [############# you sent this : {message} ############. ------------------------", flush=True)
        
        print(f"--- [PID {os.getpid()}] _publish: Envoi vers Expo (c'est l'étape lente)... ---", flush=True)
        
        # C'est l'appel réseau bloquant
        response = client.publish(message) 
        
        print(f"--- [PID {os.getpid()}] _publish: Réponse reçue d'Expo. ---", flush=True)
        return response
    
    
    # --- Début du bloc Try/Except principal ---
    try:
        print(f"--- send_expo_push: Préparation de l'envoi pour user {user_id}...", flush=True)
        
        # Création de la tâche à exécuter dans le thread
        tache_thread = asyncio.to_thread(_publish)
        
        # --- 2. On attend la tâche avec un TIMEOUT DE 30 SECONDES --- 
        response = await asyncio.wait_for(tache_thread, timeout=30.0)
        
        print(f"--- send_expo_push: Tâche terminée. Validation de la réponse...", flush=True) 

        # --- 3. Validation de la réponse (sans 'await') ---
        try:
            response.validate_response()
            print(f"--- send_expo_push: SUCCÈS. Notification envoyée. ---", flush=True)
            return True
            
        except DeviceNotRegisteredError:
            print(f"--- send_expo_push: ERREUR: DeviceNotRegisteredError. Le token {to_token} est invalide.", flush=True)
            # (Votre code pour effacer le token ira ici)
            return False
            
        except PushTicketError as exc:
            print(f"--- send_expo_push: ERREUR: PushTicketError: {exc.push_response}", flush=True)
            return False

    # --- 4. Gestion des erreurs, Y COMPRIS LE TIMEOUT ---
    except asyncio.TimeoutError:
        print(f"--- send_expo_push: ERREUR: TIMEOUT après 30 secondes. La requête a été annulée.", flush=True)
        return False
    
    except PushServerError as exc:
        print(f"--- send_expo_push: ERREUR: PushServerError: {exc.errors} {exc.response_data}", flush=True)
        return False
        
    except Exception as e:
        print(f"--- send_expo_push: ERREUR CRITIQUE INATTENDUE: {e}", flush=True)
        return False
# Toute URL commençant par /uploads cherchera un fichier dans le dossier "uploads".
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads") 

# CORS configuration for frontend
app.add_middleware( 
    CORSMiddleware,
    allow_origins=["*"], #allow all origins only in dev mod for security
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

GOOGLE_CLIENT_IDS = {
    # web
    "899058288095-137a1fct9pf5hql01n3ofqaa25dirnst.apps.googleusercontent.com",
    # ios
    "899058288095-sav0ru4ncgbluoj3juvsk7bproklf21h.apps.googleusercontent.com",
    # android
    "899058288095-f6dhdtvfo45vqg2ffveqk584li5ilq2e.apps.googleusercontent.com",
}

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "DZnutri API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "service": "dznutri-api"}

@app.post("/auth/google")
async def auth_google(token: auth_schemas.GoogleToken, db: AsyncSession = Depends(get_db)):
    try:
        idinfo = None
        last_error = None
        for aud in GOOGLE_CLIENT_IDS:
            try:
                idinfo = id_token.verify_oauth2_token(token.id_token, requests.Request(), aud)
                break
            except Exception as e:
                last_error = e
                continue
        if idinfo is None:
            raise ValueError(str(last_error))
        
        # 1. On cherche d'abord l'utilisateur
        user = await auth_crud.get_user_by_email(db, email=idinfo['email'])
        
        # 2. S'il n'existe pas, on le crée
        if not user:
            user = await auth_crud.create_user_from_google(db, user_info=idinfo)
        
        # 3. On génère le token
        access_token = auth_jwt.create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}

    except ValueError:
        raise HTTPException(status_code=401, detail="Token Google invalide")

@app.post("/auth/facebook")
async def auth_facebook(token: auth_schemas.FacebookToken, db: AsyncSession = Depends(get_db)):
    graph_url = "https://graph.facebook.com/me"
    params = {"fields": "id,name,email", "access_token": token.access_token}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(graph_url, params=params, timeout=10)
            data = resp.json()
        except Exception:
            raise HTTPException(status_code=503, detail="Facebook Graph inaccessible")

    if resp.status_code != 200:
        detail = data.get("error", {}).get("message", "Token Facebook invalide")
        raise HTTPException(status_code=401, detail=detail)

    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email permission is required from Facebook")

    user = await auth_crud.get_user_by_email(db, email=email)
    if not user:
        user = await auth_crud.create_user_from_facebook(db, user_info=data)

    access_token = auth_jwt.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me")
async def get_me(current_user: auth_schemas.User = Depends(auth_security.get_current_user)):
    """Return the current authenticated user; used by clients to validate tokens."""
    return current_user

@app.get("/api/product/{barcode}")
async def get_product_by_barcode(barcode: str, db: AsyncSession = Depends(get_db)):
    """
    Cherche un produit. D'abord en local, sinon sur Open Food Facts,
    puis le score, le sauvegarde localement et le retourne.
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
        print("Produit trouvé sur Open Food Facts. Calcul du score et sauvegarde...")
        off_product_data = data.get("product")
        
        # 3. On calcule le score
        scoringGlobal = await bd_scoring.calculate_score(db, off_product_data)
        custom_score = scoringGlobal.get('score')
        detail_custom_score = scoringGlobal.get('details')
        print(f"Score calculé : {custom_score}")
        
        
        # 4. On prépare les données pour les sauvegarder dans notre table 'products' 
        product_to_create = bd_schemas.ProductCreate(
            barcode=off_product_data.get('code', barcode),
            product_name=off_product_data.get('product_name_fr', off_product_data.get('product_name')),
            brand=off_product_data.get('brands'),
            nutriments=off_product_data.get('nutriments'),
            image_url=off_product_data.get('image_url'),
            ingredients_text=off_product_data.get('ingredients_text'),

            nutri_score=off_product_data.get('nutriscore_grade'),
            nova_group=off_product_data.get('nova_group'),
            additives_tags=off_product_data.get('additives_tags', []),
            ecoscore_grade=off_product_data.get('ecoscore_grade'),
            
            custom_score = custom_score,
            detail_custom_score=detail_custom_score
        )
        
        # 5. On appelle le CRUD pour créer le produit dans notre base de données
        created_product = await bd_crud.create_product(db, product=product_to_create)
        
        return {"source": "openfoodfacts_saved", "product": created_product}

    # 6. Si le produit n'est trouvé nulle part
    raise HTTPException(status_code=404, detail="Produit non trouvé")


@app.post("/api/submission", response_model=bd_schemas.Submission)
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

@app.get("/api/admin/submissions")
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

class PushToken(BaseModel):
    expo_push_token: str


@app.post("/api/me/push-token")
async def push_token(
    payload: PushToken,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user)
):
   
    try:
        await bd_crud.save_user_push_token(db, current_user.id, payload.expo_push_token)
        return {"message": "Token poussé avec succès"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du push du token: {str(e)}")

@app.post("/api/admin/submissions/{submission_id}/approve")
async def approve_product_submission(
    submission_id: int,
    
    # On attend un corps de requête avec les données de l'admin
    admin_data: bd_schemas.AdminProductApproval, 
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin),

):

    """
    Endpoint pour approuver une soumission. Reçoit les données complètes de l'admin.
    """
    try:
        
        # approve_submission now returns (created_product, submitting_user_id)
        result = await bd_crud.approve_submission(db, submission_id, admin_data)
      
        if isinstance(result, tuple):
            approved_product, submitting_user_id = result
            print(f"--- Produit approuvé : {approved_product} ---", flush=True)
        else:
            approved_product = result
            submitting_user_id = None

        # Notify the submitting user if they have a stored Expo push token
        if submitting_user_id:
            try:
                submitting_user = await auth_crud.get_user_by_id(db, submitting_user_id)
                if submitting_user and getattr(submitting_user, 'userPushToken', None):
                    to_token = submitting_user.userPushToken 
                    
                    title = "Votre produit a été approuvé"
                    body = f"Le produit {getattr(approved_product, 'product_name', None) or getattr(approved_product, 'barcode', '')} a été ajouté."
                    await send_expo_push(db, submitting_user_id, to_token, title, body, data={"product_id": getattr(approved_product, 'id', None)})
                 
            except Exception as e:
                print(f"Erreur lors de l'envoi de la notification push: {e}")

        return {
            "message": "Soumission approuvée avec succès",
            "product": approved_product,
            "uploader_id": submitting_user_id
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    
    
    
    
    

@app.post("/api/admin/submissions/{submission_id}/reject")
async def reject_product_submission(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du rejet: {str(e)}")

@app.get("/api/admin/profile", response_model=auth_schemas.AdminUser)
async def get_admin_profile(
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin)
):
    """
    Endpoint sécurisé qui retourne le profil de l'admin actuellement connecté.
    """
    return current_user


@app.post("/auth/login-admin")
async def login_admin(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: AsyncSession = Depends(get_db)
):
    # On cherche l'utilisateur par son nom d'utilisateur
    user_in_db = await auth_crud.get_user_by_username(db, username=form_data.username)
    
    # On vérifie si l'utilisateur existe, s'il est admin et s'il a un mot de passe
    if not user_in_db or not user_in_db.is_admin or not user_in_db.hashed_password:
        raise HTTPException(status_code=403, detail="Accès refusé ou identifiants incorrects")
    
    # On vérifie le mot de passe
    if not auth_security.verify_password(form_data.password, user_in_db.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")

    # Si tout est bon, on génère un token
    access_token = auth_jwt.create_access_token(data={"sub": user_in_db.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/history/{product_id}")
async def save_scan_history(
    
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user)
):
    """
    Endpoint pour sauvegarder un scan dans l'historique."""
    await bd_crud.add_scan_to_history(db, user_id=current_user.id, product_id=product_id)
    return {"status": "success", "message": "Scan sauvegardé"}

@app.get("/api/history")
async def get_scan_history(
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user)
):
    """
    Endpoint sauvegardant l'historique de l'utilisateur.
    """
    history = await bd_crud.get_user_history(db, user_id=current_user.id)
    return history

@app.delete("/api/history/product/{product_id}") 
async def delete_history_item(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user)
):
    """
    Endpoint pour supprimer un produit de l'historique de l'utilisateur.
    """
    try:
        # On passe le product_id à la fonction CRUD
        await bd_crud.delete_scan_from_history(
            db, user_id=current_user.id, product_id=product_id
        )
        return {"status": "success", "message": "Historique supprimé"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    

@app.get("/api/history/stats")
async def get_history_stats(
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user)
):
    """
    Endpoint sécurisé pour récupérer les statistiques de l'historique de l'utilisateur.
    """
    stats = await bd_crud.get_user_history_stats(db, user_id=current_user.id)

    return stats

@app.put("/testapi") #Juste pour voir la structure de l'API d'OpenFoodFacts
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

"""

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
   
    user_in_db = await get_user(db, username=form_data.username)
    
    if not user_in_db:
        raise HTTPException(status_code=401, detail="Incorrect username")
    
    # --- Le print est placé ICI ---
    # À ce stade, on est certain que "user_in_db" n'est pas None.
    print("--- DÉBUT DÉBOGAGE LOGIN ---")
    print(f"Mot de passe reçu du frontend : '{form_data.password}'")
    print(f"Mot de passe hashé de la BD    : '{user_in_db.hashed_password}'")
    
    is_password_correct = verify_password(form_data.password, user_in_db.hashed_password)
    print(f"La vérification du mot de passe retourne : {is_password_correct}")
    print("--- FIN DÉBOGAGE LOGIN ---")
    # ------------------------------------
    
    if not is_password_correct:
        raise HTTPException(status_code=401, detail="Incorrect password")

    user = User(id=user_in_db.id, username=user_in_db.username)

    access_token = c(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/signup")
async def signup(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # L'appel à get_user est correct
    user_in_db = await get_user(db, username=form_data.username)
    if user_in_db: 
        raise HTTPException(status_code=400, detail="User existe deja")
    
    
    # Hasher le mot de passe
    hashed_password = hash_password(form_data.password)
    
    # Créer un nouvel utilisateur
    new_user = UserTable(
        username=form_data.username,
        hashed_password=hashed_password
    )

    # CORRECTION ICI : Passez "db" comme premier argument
    await add_user(db, new_user)
    
    print(f"Compte créé avec succès pour l'utilisateur : {form_data.username}")
    return {"message": "Utilisateur créé avec succès"}
"""