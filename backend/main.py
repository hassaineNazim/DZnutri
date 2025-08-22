from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
import httpx
from google.oauth2 import id_token 
from google.auth.transport import requests
from sqlalchemy.ext.asyncio import AsyncSession
from auth import models as auth_models
from auth import schemas as auth_schemas
from auth import security as auth_security
from auth import crud as auth_crud
from auth import jwt as auth_jwt
from bdproduitdz import crud as bd_crud
from database import get_db
from bdproduitdz import schemas as bd_schemas
import shutil
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from typing import Optional
from bdproduitdz import ocr as bd_ocr


Path("uploads").mkdir(exist_ok=True)


app = FastAPI(
    title="DZnutri API",
    description="API for DZnutri product management system",
    version="1.0.0"
)

# Toute URL commençant par /uploads cherchera un fichier dans le dossier "uploads".
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS configuration for frontend
app.add_middleware( 
    CORSMiddleware,
    allow_origins=["*"], #allow all origins 
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
    Cet endpoint recherche un produit par son code-barres.
    Il cherche d'abord sur Open Food Facts, puis il cherche dans notre propre base de données.
    """
    
    # 1. Définir l'URL de l'API d'Open Food Facts
    off_api_url = f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
    
    # 2. Appeler l'API d'Open Food Facts de manière asynchrone
    async with httpx.AsyncClient() as prod:
        try:
            # On fait la requête GET 500
            response = await prod.get(off_api_url)
            print("sssss")
            
        except httpx.RequestError as exc:
            # Si la connexion à l'API d'Open Food Facts échoue
            raise HTTPException(status_code=503, detail=f"Erreur lors de l'appel à l'API externe: {exc}")

    # 3. Analyser la réponse
    data = response.json()
    print(f"Réponse de l'API Open Food Facts pour le code-barres {barcode}: {data}")
    # Open Food Facts renvoie status=1 si le produit est trouvé
    if data.get("status") == 1:
        print(f"Produit {barcode} trouvé sur Open Food Facts.")
        # On renvoie l'objet 'product' qui contient toutes les informations
        return {"source": "openfoodfacts", "product": data.get("product")}

    # 4. Logique de fallback (si non trouvé sur Open Food Facts)
    else:
        print(f"Produit {barcode} non trouvé sur Open Food Facts. Recherche locale...")
        db_product = await bd_crud.getProduitByBarcode(db, barcode=barcode)
        
        if db_product:
            print(f"Produit {barcode} trouvé dans la base de données locale.")
            # On retourne une réponse cohérente
            return {"source": "BDGlobal", "product": db_product}
        
        print(f"Produit {barcode} non trouvé meme en local.")
        raise HTTPException(status_code=404, detail="Produit non trouvé meme en local")


@app.post("/api/submission", response_model=bd_schemas.Submission)
async def create_product_submission(
    # On ne reçoit plus un seul objet JSON, mais des champs de formulaire séparés
    db: AsyncSession = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_security.get_current_user),
    barcode: str = Form(...),
    typeProduct: str = Form(...),
    productName: str = Form(...),
    brand: str = Form(...),
    # On attend un fichier nommé "image_front"
    image_front: UploadFile = File(...),
    # On attend un deuxième fichier optionnel nommé "image_ingredients"
    image_ingredients: Optional[UploadFile] = File(None)
):

    """
    Permet à un utilisateur connecté de soumettre un nouveau produit avec des photos.
    """
    # 1. Sauvegarder la première image
    # On crée un nom de fichier unique pour éviter les conflits
    front_image_path = f"uploads/front_{barcode}_{image_front.filename}"
    try:
        with open(front_image_path, "wb") as buffer:
            shutil.copyfileobj(image_front.file, buffer)
    finally:
        image_front.file.close()

    # 2. Sauvegarder la deuxième image si elle existe
    ingredients_image_path = None
    if image_ingredients:
        ingredients_image_path = f"uploads/ingredients_{barcode}_{image_ingredients.filename}"
        try:
            with open(ingredients_image_path, "wb") as buffer:
                shutil.copyfileobj(image_ingredients.file, buffer)
        finally:
            image_ingredients.file.close()

    ocr_text = ""
    if ingredients_image_path:
        # On lance l'analyse OCR sur l'image des ingrédients
        ocr_text = bd_ocr.detect_text_with_tesseract(ingredients_image_path)
    
    # On crée un objet Pydantic avec les données du formulaire et les chemins des images
    submission_data = bd_schemas.SubmissionCreate(
        barcode=barcode,
        typeProduct=typeProduct,
        productName=productName, # Assurez-vous que ce champ existe dans votre schéma
        brand=brand,             # Assurez-vous que ce champ existe dans votre schéma
        image_front_url=front_image_path,
        image_ingredients_url=ingredients_image_path,
        ocr_ingredients_text=ocr_text
    )
    

   

    # 4. Appeler la fonction CRUD (cette partie ne change pas)
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
):
    """
    Endpoint pour récupérer toutes les soumissions de produits pour l'admin.
    Par défaut, récupère les soumissions en attente.
    """
    
    try:
        submissions = await bd_crud.get_all_submissions(db, status=status)
        return {"submissions": submissions, "count": len(submissions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des soumissions: {str(e)}")

@app.post("/api/admin/submissions/{submission_id}/approve")
async def approve_product_submission(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_admin)
):
    """
    Endpoint pour approuver une soumission et la transférer vers la table des produits.
    """

    
    try:
        approved_product = await bd_crud.approve_submission(db, submission_id, current_user.id)
        return {
            "message": "Soumission approuvée avec succès",
            "product": approved_product
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'approbation: {str(e)}")

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