from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from auth.password import pwd_context, verify_password
from auth.models import User, UserTable
from auth.users_db import get_user, add_user
from auth.jwtokentest import c

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
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user_in_db = await get_user(form_data.username)
    if not user_in_db:
        raise HTTPException(status_code=401, detail="Incorrect username")
    
    if not verify_password(form_data.password, user_in_db.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect password")

    user = User(id=user_in_db.id, username=user_in_db.username)

    access_token = c(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/signup") 
async def signup(form_data: OAuth2PasswordRequestForm = Depends()):
    user_in_db = await get_user(form_data.username)
    if user_in_db: 
        raise HTTPException(status_code=401, detail="User existe deja")
    
    # Hasher le mot de passe
    hashed_password = pwd_context.hash(form_data.password)
    
    # Créer un nouvel utilisateur (UserTable pour SQLite)
    new_user = UserTable(
        username=form_data.username,
        hashed_password=hashed_password
    )

    await add_user(new_user)
    print(f"Compte créé avec succès pour l'utilisateur : {form_data.username}")
    return {"message": "Utilisateur créé avec succès"}

     