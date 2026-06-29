import logging
import secrets

from fastapi import APIRouter, HTTPException, Depends, Request
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
from auth import refresh as auth_refresh
from auth.email import send_password_reset_email
from auth import hashing as auth_hashing
from utils import generate_reset_code
from rate_limit import limiter
from datetime import datetime, timedelta

from bdproduitdz import crud as bd_crud

logger = logging.getLogger("dznutri.auth")


router = APIRouter(tags=["Authentication"])

# Nombre maximum de tentatives sur un même code de réinitialisation avant
# invalidation (anti-brute-force du code à 6 chiffres).
MAX_RESET_ATTEMPTS = 5


async def _issue_tokens(db: AsyncSession, user) -> dict:
    """Émet la paire de tokens : access JWT court + refresh longue durée."""
    access_token = auth_jwt.create_access_token(data={"sub": user.username})
    refresh_token = await auth_refresh.create_refresh_token(db, user.id)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

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
@limiter.limit("20/minute")
async def auth_google(request: Request, token: auth_schemas.GoogleToken, db: AsyncSession = Depends(get_db)):
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
        
        # 3. On génère la paire de tokens (access + refresh)
        return await _issue_tokens(db, user)

    except ValueError:
        raise HTTPException(status_code=401, detail="Token Google invalide")

@router.post("/auth/facebook")
@limiter.limit("20/minute")
async def auth_facebook(request: Request, token: auth_schemas.FacebookToken, db: AsyncSession = Depends(get_db)):
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

    return await _issue_tokens(db, user)

@router.get("/auth/me")
async def get_me(current_user: auth_schemas.User = Depends(auth_security.get_current_user)):
    """Return the current authenticated user; used by clients to validate tokens."""
    return current_user

@router.post("/auth/login-admin")
@limiter.limit("10/minute")
async def login_admin(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    # On cherche l'utilisateur par son nom d'utilisateur
    user_in_db = await auth_crud.get_user_by_username(db, username=form_data.username)
    
    # On vérifie si l'utilisateur existe, s'il est admin et s'il a un mot de passe
    if not user_in_db or not user_in_db.is_admin or not user_in_db.hashed_password:
        raise HTTPException(status_code=403, detail="Accès refusé ou identifiants incorrects")
    
    # On vérifie le mot de passe
    if not await auth_hashing.verify_password(form_data.password, user_in_db.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")


    # Si tout est bon, on génère la paire de tokens
    return await _issue_tokens(db, user_in_db)

@router.post("/auth/register")
@limiter.limit("5/minute")
async def register(request: Request, user: auth_schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    db_user = await auth_crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    db_user_by_name = await auth_crud.get_user_by_username(db, username=user.username)
    if db_user_by_name:
        raise HTTPException(status_code=400, detail="Nom d'utilisateur déjà utilisé")
        
    new_user = await auth_crud.create_user(db, user.model_dump())

    return await _issue_tokens(db, new_user)

@router.post("/auth/login")
@limiter.limit("10/minute")
async def login(request: Request, user: auth_schemas.UserLogin, db: AsyncSession = Depends(get_db)):
    db_user = await auth_crud.get_user_by_email(db, email=user.email)
    if not db_user or not db_user.hashed_password:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
        
    if not await auth_hashing.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    return await _issue_tokens(db, db_user)

@router.post("/auth/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(request: Request, payload: auth_schemas.ForgotPassword, db: AsyncSession = Depends(get_db)):
    user = await auth_crud.get_user_by_email(db, email=payload.email)
    if not user:
        return {"message": "Si cet email existe, un code de réinitialisation a été envoyé."}
    
    # Générer un code à 6 chiffres (remet le compteur de tentatives à zéro)
    reset_code = generate_reset_code()
    user.reset_code = reset_code
    user.reset_code_expires_at = datetime.utcnow() + timedelta(minutes=15)
    user.reset_code_attempts = 0
    db.add(user)
    await db.commit()
    
    await send_password_reset_email(user.email, reset_code)
    return {"message": "Si cet email existe, un code de réinitialisation a été envoyé."}

@router.post("/auth/reset-password")
@limiter.limit("10/minute")
async def reset_password(request: Request, payload: auth_schemas.ResetPassword, db: AsyncSession = Depends(get_db)):
    # Message d'échec générique et identique partout (anti-énumération).
    invalid = HTTPException(status_code=400, detail="Code invalide ou expiré")
    try:
        user = await auth_crud.get_user_by_email(db, email=payload.email)
        if not user or not user.reset_code or not user.reset_code_expires_at:
            raise invalid

        # Code expiré : on le purge.
        if user.reset_code_expires_at < datetime.utcnow():
            user.reset_code = None
            user.reset_code_expires_at = None
            user.reset_code_attempts = 0
            db.add(user)
            await db.commit()
            raise invalid

        # Trop de tentatives échouées : on invalide le code (anti-brute-force).
        if (user.reset_code_attempts or 0) >= MAX_RESET_ATTEMPTS:
            user.reset_code = None
            user.reset_code_expires_at = None
            user.reset_code_attempts = 0
            db.add(user)
            await db.commit()
            raise invalid

        # Comparaison à temps constant (anti-timing attack). Code incorrect ->
        # on incrémente le compteur et on rejette.
        if not secrets.compare_digest(str(user.reset_code), str(payload.token)):
            user.reset_code_attempts = (user.reset_code_attempts or 0) + 1
            db.add(user)
            await db.commit()
            raise invalid

        # Succès : nouveau mot de passe + invalidation du code (usage unique).
        user.hashed_password = await auth_hashing.hash_password(payload.new_password)
        user.reset_code = None
        user.reset_code_expires_at = None
        user.reset_code_attempts = 0
        db.add(user)
        await db.commit()

        return {"message": "Mot de passe réinitialisé avec succès"}

    except HTTPException:
        # On laisse passer les erreurs métier déjà formatées (ne pas les masquer).
        raise
    except Exception:
        # Seules les erreurs réellement inattendues sont journalisées et génériques.
        logger.exception("Erreur inattendue lors de la réinitialisation du mot de passe")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Erreur lors de la réinitialisation.")


@router.post("/auth/refresh")
@limiter.limit("60/minute")
async def refresh_tokens(
    request: Request,
    payload: auth_schemas.RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """Échange un refresh token valide contre une nouvelle paire (rotation)."""
    result = await auth_refresh.rotate_refresh_token(db, payload.refresh_token)
    if result is None:
        raise HTTPException(status_code=401, detail="Refresh token invalide ou expiré")

    user_id, new_refresh = result
    user = await auth_crud.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")

    access_token = auth_jwt.create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "refresh_token": new_refresh,
        "token_type": "bearer",
    }


@router.post("/auth/logout")
async def logout(payload: auth_schemas.RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Révoque le refresh token (déconnexion)."""
    await auth_refresh.revoke_refresh_token(db, payload.refresh_token)
    return {"message": "Déconnecté"}


@router.post("/api/me/push-token")
async def push_token(
    payload: PushToken,
    db: AsyncSession = Depends(get_db),
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user)
):
   
    try:
        await bd_crud.save_user_push_token(db, current_user.id, payload.expo_push_token)
        return {"message": "Token poussé avec succès"}
    except Exception:
        # On journalise le détail mais on ne l'expose jamais au client.
        logger.exception("Échec d'enregistrement du push token (user %s)", current_user.id)
        await db.rollback()
        raise HTTPException(status_code=500, detail="Erreur lors de l'enregistrement du token.")
