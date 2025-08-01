from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession


from database import get_db
from . import users_db , schemas


# --- Configuration du Token ---
# CES VALEURS DOIVENT ÊTRE EXACTEMENT LES MÊMES QUE CELLES UTILISÉES POUR CRÉER LE TOKEN
SECRET_KEY = "super-secret-key"
ALGORITHM = "HS256"

# Crée un "schéma" qui dit à FastAPI d'aller chercher le token dans l'en-tête Authorization
# tokenUrl="login" indique que l'endpoint pour obtenir le token est "/login"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


async def get_current_user(
    token: str = Depends(oauth2_scheme), 
    db: AsyncSession = Depends(get_db)
) -> schemas.User:
    """
    Dépendance pour obtenir l'utilisateur actuel à partir d'un token JWT.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 1. Décoder le token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
        
    # 2. Récupérer l'utilisateur dans la base de données
    user = await users_db.get_user(db, username=username)
    if user is None:
        raise credentials_exception
        
    # 3. Retourner l'utilisateur sous forme de schéma Pydantic sécurisé
    return schemas.User(id=user.id, username=user.username)