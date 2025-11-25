from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from google.oauth2 import id_token 
from google.auth.transport import requests
import httpx
from pydantic import BaseModel

from database import get_db
from auth import models as auth_models
from auth import schemas as auth_schemas
from auth import security as auth_security
from auth import crud as auth_crud
from auth import jwt as auth_jwt
from bdproduitdz import crud as bd_crud

router = APIRouter(tags=["Authentication"])

GOOGLE_CLIENT_IDS = {
    # web
    "899058288095-137a1fct9pf5hql01n3ofqaa25dirnst.apps.googleusercontent.com",
    # ios
    "899058288095-sav0ru4ncgbluoj3juvsk7bproklf21h.apps.googleusercontent.com",
    # android
    "899058288095-f6dhdtvfo45vqg2ffveqk584li5ilq2e.apps.googleusercontent.com",
}

class PushToken(BaseModel):
    expo_push_token: str

@router.post("/auth/google")
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

@router.post("/auth/facebook")
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

@router.get("/auth/me")
async def get_me(current_user: auth_schemas.User = Depends(auth_security.get_current_user)):
    """Return the current authenticated user; used by clients to validate tokens."""
    return current_user

@router.post("/auth/login-admin")
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

@router.post("/api/me/push-token")
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
