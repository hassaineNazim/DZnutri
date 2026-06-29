"""Limiteur de débit (rate limiting) partagé par toute l'application.

Protège surtout les endpoints d'authentification contre la force brute et le
spam (login, register, reset password, OAuth).

- Clé = IP source. Derrière un reverse-proxy (nginx, etc.), on lit le premier
  élément de ``X-Forwarded-For`` ; sinon l'IP directe.
- Stockage : mémoire par défaut. Pour un déploiement MULTI-INSTANCES / multi-
  workers, définir ``RATELIMIT_STORAGE_URI=redis://redis:6379`` afin que la
  limite soit partagée entre les process.
"""

import os

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def _client_key(request: Request) -> str:
    """Identifie le client par son IP (en tenant compte d'un éventuel proxy)."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(
    key_func=_client_key,
    storage_uri=os.getenv("RATELIMIT_STORAGE_URI"),  # None -> stockage mémoire
)
