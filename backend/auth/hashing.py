from passlib.context import CryptContext
from fastapi.concurrency import run_in_threadpool

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#func hash_password
async def hash_password(password: str) -> str:
    """Prend un mot de passe en clair et retourne son hash de manière asynchrone."""
    return await run_in_threadpool(pwd_context.hash, password)

#func verify_password
async def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compare un mot de passe en clair avec un hash de manière asynchrone."""
    return await run_in_threadpool(pwd_context.verify, plain_password, hashed_password)
