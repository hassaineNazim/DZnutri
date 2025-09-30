from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

# Vos imports de projet
from database import get_db
from auth import crud as auth_crud
from auth import schemas as auth_schemas
from auth import models as auth_models
from .jwt import verify_token

# "tokenUrl" est un paramètre formel, même si on ne l'utilise pas directement ici
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/google")

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
) -> auth_models.UserTable:
    """
    Dépendance pour obtenir l'utilisateur actuel à partir d'un token JWT.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
        
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
        
    user_in_db = await auth_crud.get_user_by_username(db, username=username)
    if user_in_db is None:
        raise credentials_exception
        
    return user_in_db


async def get_current_admin(
    # On réutilise la dépendance get_current_user pour obtenir l'utilisateur de la base de données
    current_user: auth_models.UserTable = Depends(get_current_user)
) -> auth_models.UserTable:
    """
    Dépendance qui vérifie que l'utilisateur courant est bien un administrateur.
    Retourne l'objet utilisateur complet de la base de données s'il est admin,
    sinon lève une erreur 403.
    """
    # On vérifie la propriété is_admin sur l'objet de la base de données
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé. Les droits d'administrateur sont requis."
        )
    
    # Si la vérification passe, on retourne l'utilisateur
    return current_user



# 1. On crée un "contexte" de hachage
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 2. On crée la fonction de hachage
def hash_password(password: str) -> str:
    """Prend un mot de passe en clair et retourne son hash."""
    return pwd_context.hash(password)

# 3. On ajoute aussi la fonction de vérification
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compare un mot de passe en clair avec un hash."""
    return pwd_context.verify(plain_password, hashed_password)