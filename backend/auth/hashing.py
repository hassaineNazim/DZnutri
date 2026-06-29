import bcrypt
from fastapi.concurrency import run_in_threadpool

# bcrypt ne prend en compte que les 72 premiers octets : on tronque explicitement
# (comme le faisait passlib) pour un comportement constant et pour éviter une
# erreur sur les mots de passe longs. Les hashes $2b$ existants restent valides.
_BCRYPT_MAX_BYTES = 72


def _hash(password: str) -> str:
    pw = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


def _verify(plain_password: str, hashed_password: str) -> bool:
    pw = plain_password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    try:
        return bcrypt.checkpw(pw, hashed_password.encode("utf-8"))
    except (ValueError, TypeError):
        # Hash mal formé / vide : on échoue proprement plutôt que de lever.
        return False


async def hash_password(password: str) -> str:
    """Prend un mot de passe en clair et retourne son hash bcrypt (async)."""
    return await run_in_threadpool(_hash, password)


async def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compare un mot de passe en clair avec un hash bcrypt (async)."""
    return await run_in_threadpool(_verify, plain_password, hashed_password)
