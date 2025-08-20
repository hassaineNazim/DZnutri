from fastapi import FastAPI, HTTPException, Depends
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
    allow_origins=["*"],  
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
    submission: bd_schemas.SubmissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_security.get_current_user)
):
    """
    Permet à un utilisateur connecté de soumettre un nouveau produit
    pour validation par un admin.
    """
    # On appelle la fonction CRUD que vous avez créée
    new_submission = await bd_crud.add_product_submissions(
        db=db, 
        submission=submission, 
        user_id=current_user.id
    )
    
    
    
    return new_submission

@app.get("/api/admin/submissions")
async def get_submissions_for_admin(
    status: str = "pending",
    db: AsyncSession = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_security.get_current_user)
):
    """
    Endpoint pour récupérer toutes les soumissions de produits pour l'admin.
    Par défaut, récupère les soumissions en attente.
    """
    # Vérification que l'utilisateur est admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès refusé. Admin requis.")
    
    try:
        submissions = await bd_crud.get_all_submissions(db, status=status)
        return {"submissions": submissions, "count": len(submissions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des soumissions: {str(e)}")

@app.post("/api/admin/submissions/{submission_id}/approve")
async def approve_product_submission(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: auth_schemas.User = Depends(auth_security.get_current_user)
):
    """
    Endpoint pour approuver une soumission et la transférer vers la table des produits.
    """
    # Vérification que l'utilisateur est admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès refusé. Admin requis.")
    
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
    current_user: auth_schemas.User = Depends(auth_security.get_current_user)
):
    """
    Endpoint pour rejeter une soumission.
    """
    # Vérification que l'utilisateur est admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès refusé. Admin requis.")
    
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

@app.get("/api/admin/profile")
async def get_admin_profile(current_user: auth_schemas.User = Depends(auth_security.get_current_user)):
    """
    Endpoint pour récupérer le profil de l'admin connecté.
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Accès refusé. Admin requis.")
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "is_admin": current_user.is_admin
    }


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