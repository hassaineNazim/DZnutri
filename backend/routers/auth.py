import logging
import os
import secrets

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from google.oauth2 import id_token 
from google.auth.transport import requests
import httpx
from jose import JWTError, jwt
from pydantic import BaseModel

from database import get_db
from auth import models as auth_models
from auth import schemas as auth_schemas
from auth import security as auth_security
from auth import crud as auth_crud
from auth import jwt as auth_jwt
from auth import refresh as auth_refresh
from auth import apple as apple_auth
from auth.email import send_password_reset_email
from auth import hashing as auth_hashing
from utils import generate_reset_code
from rate_limit import limiter
from datetime import datetime, timedelta

from bdproduitdz import crud as bd_crud
from bdproduitdz import models as bd_models
from auth.profile_models import UserProfile

logger = logging.getLogger("dznutri.auth")


router = APIRouter(tags=["Authentication"])

# Nombre maximum de tentatives sur un même code de réinitialisation avant
# invalidation (anti-brute-force du code à 6 chiffres).
MAX_RESET_ATTEMPTS = 5


async def _issue_tokens(db: AsyncSession, user) -> dict:
    """Émet la paire de tokens : access JWT court + refresh longue durée.

    Le `sub` du JWT est l'ID utilisateur (stable et unique). L'username ne l'est
    PAS (non unique en base : deux comptes Google au même nom d'affichage se
    retrouvaient avec le même sub -> confusion d'identité).
    """
    access_token = auth_jwt.create_access_token(data={"sub": str(user.id)})
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
APPLE_CLIENT_ID = os.getenv("APPLE_CLIENT_ID", "com.nazim.dznutri")

async def _verify_apple_identity_token(identity_token: str) -> dict:
    """Vérifie signature, émetteur et audience du JWT remis par Apple."""
    try:
        header = jwt.get_unverified_header(identity_token)
        kid = header.get("kid")
        if not kid or header.get("alg") != "RS256":
            raise JWTError("En-tête Apple invalide")
        async with httpx.AsyncClient() as client:
            response = await client.get("https://appleid.apple.com/auth/keys", timeout=10)
            response.raise_for_status()
        apple_key = next((key for key in response.json().get("keys", []) if key.get("kid") == kid), None)
        if not apple_key:
            raise JWTError("Clé Apple inconnue")
        return jwt.decode(
            identity_token,
            apple_key,
            algorithms=["RS256"],
            audience=APPLE_CLIENT_ID,
            issuer="https://appleid.apple.com",
        )
    except (JWTError, httpx.HTTPError, StopIteration, ValueError) as exc:
        logger.warning("Jeton Sign in with Apple rejeté: %s", exc)
        raise HTTPException(status_code=401, detail="Jeton Apple invalide") from exc

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

@router.post("/auth/apple")
@limiter.limit("20/minute")
async def auth_apple(request: Request, token: auth_schemas.AppleToken, db: AsyncSession = Depends(get_db)):
    claims = await _verify_apple_identity_token(token.identity_token)
    apple_id = claims.get("sub")
    email = claims.get("email")
    if not apple_id:
        raise HTTPException(status_code=401, detail="Identifiant Apple absent")

    # Le refresh token permet de respecter la révocation exigée par Apple lors
    # de la suppression du compte. Il est chiffré avant toute écriture en base.
    try:
        apple_token_set = await apple_auth.exchange_authorization_code(token.authorization_code)
        exchanged_claims = await _verify_apple_identity_token(apple_token_set.identity_token)
        if exchanged_claims.get("sub") != apple_id:
            raise apple_auth.AppleAuthError("Le code Apple ne correspond pas au jeton d'identité")
        encrypted_apple_token = apple_auth.encrypt_refresh_token(apple_token_set.refresh_token)
    except apple_auth.AppleAuthError as exc:
        logger.warning("Connexion Apple interrompue: %s", exc)
        raise HTTPException(status_code=503, detail="Connexion Apple temporairement indisponible") from exc

    user = await auth_crud.get_user_by_apple_id(db, apple_id)
    if not user and email:
        # Un compte e-mail/Google existant est relié au même utilisateur au
        # lieu de créer un doublon.
        user = await auth_crud.get_user_by_email(db, email)
        if user:
            user.apple_id = apple_id
            await db.commit()
            await db.refresh(user)
    if not user:
        if not email:
            raise HTTPException(
                status_code=400,
                detail="Apple n'a pas transmis d'adresse e-mail. Révoquez l'accès à Remo Scan dans vos réglages Apple puis réessayez.",
            )
        user = await auth_crud.create_user_from_apple(
            db,
            apple_id=apple_id,
            email=email,
            full_name=token.full_name,
        )
    user.apple_refresh_token_encrypted = encrypted_apple_token
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return await _issue_tokens(db, user)

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

@router.delete("/auth/account")
@limiter.limit("3/hour")
async def delete_own_account(
    request: Request,
    current_user: auth_models.UserTable = Depends(auth_security.get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Supprime les données privées et anonymise les contributions partagées."""
    user_id = current_user.id

    # La révocation distante doit réussir avant d'effacer les données locales.
    # Les anciens comptes Apple créés avant ce mécanisme n'ont aucun refresh
    # token serveur à révoquer et peuvent toujours être supprimés.
    if current_user.apple_refresh_token_encrypted:
        try:
            await apple_auth.revoke_stored_refresh_token(current_user.apple_refresh_token_encrypted)
        except apple_auth.AppleAuthError as exc:
            logger.warning("Suppression différée: révocation Apple impossible pour user %s: %s", user_id, exc)
            raise HTTPException(
                status_code=503,
                detail="Impossible de révoquer la connexion Apple pour le moment. Réessayez plus tard.",
            ) from exc

    # Contributions utiles à la base commune : conservation sans auteur.
    await db.execute(update(bd_models.Product).where(bd_models.Product.user_id == user_id).values(user_id=None))
    await db.execute(update(bd_models.Submission).where(bd_models.Submission.submitted_by_user_id == user_id).values(submitted_by_user_id=None))
    await db.execute(update(bd_models.CosmeticProduct).where(bd_models.CosmeticProduct.user_id == user_id).values(user_id=None))
    await db.execute(update(bd_models.CosmeticSubmission).where(bd_models.CosmeticSubmission.submitted_by_user_id == user_id).values(submitted_by_user_id=None))
    await db.execute(update(bd_models.Report).where(bd_models.Report.user_id == user_id).values(user_id=None))

    # Données strictement personnelles : suppression définitive.
    for model in (
        bd_models.ProductRating,
        bd_models.Favorite,
        bd_models.ScanHistory,
        bd_models.Notification,
        UserProfile,
        auth_models.RefreshToken,
    ):
        await db.execute(delete(model).where(model.user_id == user_id))
    await db.execute(delete(auth_models.UserTable).where(auth_models.UserTable.id == user_id))
    await db.commit()
    return {"message": "Compte supprimé définitivement"}

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
    
    try:
        await send_password_reset_email(user.email, reset_code)
    except Exception:
        # Un échec SMTP renvoyait un 500 UNIQUEMENT pour les emails existants :
        # cela révélait l'existence du compte (anti-énumération cassée) en plus
        # de casser le parcours. On journalise et on garde la réponse générique.
        logger.exception("Échec d'envoi de l'email de réinitialisation")
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

    access_token = auth_jwt.create_access_token(data={"sub": str(user.id)})
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
