from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from auth.password import hash_password, verify_password
from auth.models import UserTable
from auth.schemas import User
from auth.users_db import get_user, add_user 
from auth.crud import get_current_user
from auth.jwtokentest import c
from bdproduitdz.crud import getProduitByBarcode, add_product_submissions
from database import get_db
from bdproduitdz import schemas



app = FastAPI()

# Ajoute ceci juste après la création de app
app.add_middleware( 
    CORSMiddleware,
    allow_origins=["*"],  # Autorise toutes les origines (pour le développement)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """
    Cette fonction cherche dans la table userTable et retourne un token si le user existe.
    """
    user_in_db = await get_user(db, username=form_data.username)
    
    if not user_in_db:
        raise HTTPException(status_code=401, detail="Incorrect username")
    
    # --- Le print est placé ICI ---
    # À ce stade, on est certain que "user_in_db" n'est pas None.
    print("--- DÉBUT DÉBOGAGE LOGIN ---")
    print(f"Mot de passe reçu du frontend : '{hash_password(form_data.password)}'")
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
        db_product = await getProduitByBarcode(db, barcode=barcode)
        
        if db_product:
            print(f"Produit {barcode} trouvé dans la base de données locale.")
            # On retourne une réponse cohérente
            return {"source": "BDGlobal", "product": db_product}
        
        print(f"Produit {barcode} non trouvé meme en local.")
        raise HTTPException(status_code=404, detail="Produit non trouvé meme en local")


@app.post("/api/submission", response_model=schemas.Submission)
async def create_product_submission(
    submission: schemas.SubmissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Permet à un utilisateur connecté de soumettre un nouveau produit
    pour validation par un admin.
    """
    # On appelle la fonction CRUD que vous avez créée
    new_submission = await add_product_submissions(
        db=db, 
        submission=submission, 
        user_id=current_user.id
    )
    
    
    
    return new_submission