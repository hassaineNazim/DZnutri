from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#func hash_password
def hash_password(password: str) -> str:
    """Prend un mot de passe en clair et retourne son hash."""
    return pwd_context.hash(password)

#func verify_password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compare un mot de passe en clair avec un hash."""
    return pwd_context.verify(plain_password, hashed_password)
