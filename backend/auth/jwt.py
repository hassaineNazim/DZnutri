import logging
import os
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt

logger = logging.getLogger("dznutri.auth")

# Le secret de signature des JWT NE DOIT JAMAIS être en dur dans le code : tout
# détenteur du code pourrait forger des tokens admin. On le lit dans l'env.
_DEFAULT_INSECURE_SECRET = "super-secret-key"
# Valeurs connues comme faibles ou ayant fuité : interdites en production.
_KNOWN_WEAK_SECRETS = {
    _DEFAULT_INSECURE_SECRET,
    "votre_super_cle_secrete_difficile_a_deviner",
    "",
}
_MIN_SECRET_LENGTH = 32

SECRET_KEY = os.getenv("JWT_SECRET_KEY", _DEFAULT_INSECURE_SECRET)
_IS_PRODUCTION = os.getenv("ENVIRONMENT", "").strip().lower() == "production"

if _IS_PRODUCTION:
    # En production, on REFUSE de démarrer avec une clé absente, connue ou trop
    # courte : c'est la seule garantie qu'aucun token (y compris admin) ne peut
    # être forgé. L'erreur est levée à l'import, donc l'app ne démarre pas.
    if SECRET_KEY in _KNOWN_WEAK_SECRETS or len(SECRET_KEY) < _MIN_SECRET_LENGTH:
        raise RuntimeError(
            "JWT_SECRET_KEY invalide en production : définissez une clé forte "
            f"(>= {_MIN_SECRET_LENGTH} caractères, jamais la valeur par défaut). "
            'Générez-la avec : python -c "import secrets; print(secrets.token_urlsafe(64))"'
        )
elif SECRET_KEY in _KNOWN_WEAK_SECRETS:
    logger.warning(
        "JWT_SECRET_KEY non défini : clé de DÉVELOPPEMENT non sécurisée utilisée. "
        "Définissez JWT_SECRET_KEY avant tout déploiement."
    )

ALGORITHM = "HS256"
# Access token COURT : la session longue est assurée par le refresh token
# (auth/refresh.py), renouvelé silencieusement. Réduit la fenêtre d'exploitation
# d'un token volé.
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

def create_access_token(data: dict, expires_delta: int | None = None):
    """
    crée un token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + timedelta(minutes=expires_delta)
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """verfie le token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
