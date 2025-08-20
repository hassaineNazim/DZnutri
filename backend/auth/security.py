from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

# Vos imports de projet
from database import get_db
from auth import crud as auth_crud
from auth import schemas as auth_schemas
from .jwt import verify_token

# "tokenUrl" est un paramètre formel, même si on ne l'utilise pas directement ici
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/google")

async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
) -> auth_schemas.User:
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
        
    user = await auth_crud.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
        
    return auth_schemas.User(id=user.id, username=user.username, email=user.email)