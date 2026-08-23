"""Client minimal et sécurisé pour Sign in with Apple.

Le code d'autorisation reçu par l'application est échangé contre un refresh
token. Ce token est chiffré avant stockage et sert uniquement à révoquer
l'autorisation Apple lors de la suppression du compte.
"""

from __future__ import annotations

import base64
import hashlib
import logging
import os
import time
from dataclasses import dataclass

import httpx
from cryptography.fernet import Fernet, InvalidToken
from jose import jwt
from jose.exceptions import JOSEError


logger = logging.getLogger("remoscan.auth.apple")

APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token"
APPLE_REVOKE_URL = "https://appleid.apple.com/auth/revoke"


class AppleAuthError(RuntimeError):
    """Erreur Apple présentable comme indisponibilité temporaire au client."""


class AppleConfigurationError(AppleAuthError):
    """Configuration serveur Apple absente ou invalide."""


@dataclass(frozen=True)
class AppleTokenSet:
    refresh_token: str
    identity_token: str


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise AppleConfigurationError(f"Variable serveur {name} manquante")
    return value


def _client_id() -> str:
    return os.getenv("APPLE_CLIENT_ID", "com.nazim.dznutri").strip()


def _private_key() -> str:
    # Railway peut conserver les retours à la ligne sous forme littérale \n.
    value = _required_env("APPLE_PRIVATE_KEY").replace("\\n", "\n")
    if "BEGIN PRIVATE KEY" not in value:
        raise AppleConfigurationError("APPLE_PRIVATE_KEY n'est pas une clé privée Apple valide")
    return value


def _client_secret() -> str:
    now = int(time.time())
    try:
        return jwt.encode(
            {
                "iss": _required_env("APPLE_TEAM_ID"),
                "iat": now,
                # Secret court : limite l'impact d'une éventuelle fuite.
                "exp": now + 300,
                "aud": "https://appleid.apple.com",
                "sub": _client_id(),
            },
            _private_key(),
            algorithm="ES256",
            headers={"kid": _required_env("APPLE_KEY_ID")},
        )
    except (JOSEError, ValueError, TypeError) as exc:
        raise AppleConfigurationError("Impossible de signer le client secret Apple") from exc


def _fernet() -> Fernet:
    secret = _required_env("APPLE_TOKEN_ENCRYPTION_KEY")
    if len(secret) < 32:
        raise AppleConfigurationError("APPLE_TOKEN_ENCRYPTION_KEY doit contenir au moins 32 caractères")
    key = base64.urlsafe_b64encode(hashlib.sha256(secret.encode("utf-8")).digest())
    return Fernet(key)


def encrypt_refresh_token(refresh_token: str) -> str:
    if not refresh_token:
        raise AppleAuthError("Refresh token Apple absent")
    return _fernet().encrypt(refresh_token.encode("utf-8")).decode("ascii")


def decrypt_refresh_token(encrypted_token: str) -> str:
    try:
        return _fernet().decrypt(encrypted_token.encode("ascii")).decode("utf-8")
    except (InvalidToken, UnicodeError, ValueError) as exc:
        raise AppleConfigurationError("Le refresh token Apple stocké ne peut pas être déchiffré") from exc


async def exchange_authorization_code(authorization_code: str) -> AppleTokenSet:
    """Échange le code à usage unique contre le refresh token révocable."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                APPLE_TOKEN_URL,
                data={
                    "client_id": _client_id(),
                    "client_secret": _client_secret(),
                    "code": authorization_code,
                    "grant_type": "authorization_code",
                },
                timeout=15,
            )
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("Échange du code Apple inaccessible: %s", exc)
        raise AppleAuthError("Service Apple temporairement indisponible") from exc

    refresh_token = payload.get("refresh_token") if isinstance(payload, dict) else None
    identity_token = payload.get("id_token") if isinstance(payload, dict) else None
    if response.status_code != 200 or not refresh_token or not identity_token:
        error = payload.get("error", "refresh_token_absent") if isinstance(payload, dict) else "réponse_invalide"
        logger.warning("Échange du code Apple refusé: %s", error)
        raise AppleAuthError("Le code d'autorisation Apple a été refusé")
    return AppleTokenSet(refresh_token=refresh_token, identity_token=identity_token)


async def revoke_stored_refresh_token(encrypted_token: str) -> None:
    """Révoque chez Apple un refresh token précédemment chiffré."""
    refresh_token = decrypt_refresh_token(encrypted_token)
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                APPLE_REVOKE_URL,
                data={
                    "client_id": _client_id(),
                    "client_secret": _client_secret(),
                    "token": refresh_token,
                    "token_type_hint": "refresh_token",
                },
                timeout=15,
            )
    except httpx.HTTPError as exc:
        logger.warning("Révocation Apple inaccessible: %s", exc)
        raise AppleAuthError("Service Apple temporairement indisponible") from exc

    if response.status_code != 200:
        logger.warning("Révocation Apple refusée avec le statut %s", response.status_code)
        raise AppleAuthError("Apple n'a pas confirmé la révocation du compte")
