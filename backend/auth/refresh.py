"""Gestion des refresh tokens (opaques, hachés, à rotation, table bornée).

- Le refresh token est une chaîne aléatoire opaque (pas un JWT). On ne stocke en
  base que son hash SHA-256 : une fuite de la base ne donne aucun token utilisable.
- Durée de vie longue (365 j par défaut), **renouvelée à chaque rafraîchissement**
  (rotation) : un utilisateur actif ne se reconnecte jamais.
- À chaque rotation (et au logout), l'ancien token est **supprimé** : un token
  réutilisé devient introuvable -> rejeté. On purge aussi les tokens expirés de
  l'utilisateur, de sorte que la table reste bornée sans tâche planifiée.
"""

import hashlib
import os
import secrets
from datetime import datetime, timedelta

from sqlalchemy import delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.models import RefreshToken

REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "365"))


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _new_expiry() -> datetime:
    return datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)


async def _purge_expired(db: AsyncSession, user_id: int) -> None:
    """Supprime les refresh tokens expirés de l'utilisateur (borne la table)."""
    await db.execute(
        delete(RefreshToken)
        .where(
            RefreshToken.user_id == user_id,
            RefreshToken.expires_at < datetime.utcnow(),
        )
        .execution_options(synchronize_session=False)
    )


async def create_refresh_token(db: AsyncSession, user_id: int) -> str:
    """Crée un refresh token pour l'utilisateur et renvoie sa valeur en clair."""
    raw = secrets.token_urlsafe(48)
    await _purge_expired(db, user_id)
    db.add(
        RefreshToken(
            user_id=user_id,
            token_hash=_hash_token(raw),
            expires_at=_new_expiry(),
        )
    )
    await db.commit()
    return raw


async def _get_valid(db: AsyncSession, token: str) -> RefreshToken | None:
    row = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == _hash_token(token))
    )
    rt = row.scalars().first()
    if not rt or rt.expires_at < datetime.utcnow():
        return None
    return rt


async def rotate_refresh_token(db: AsyncSession, token: str) -> tuple[int, str] | None:
    """Valide puis fait tourner le token : supprime l'ancien, en émet un nouveau.

    Renvoie (user_id, nouveau_refresh_token) ou None si le token est invalide.
    """
    rt = await _get_valid(db, token)
    if rt is None:
        return None

    user_id = rt.user_id
    # Supprime l'ancien token + purge les tokens expirés de l'utilisateur.
    await db.execute(
        delete(RefreshToken)
        .where(
            RefreshToken.user_id == user_id,
            or_(RefreshToken.id == rt.id, RefreshToken.expires_at < datetime.utcnow()),
        )
        .execution_options(synchronize_session=False)
    )

    raw = secrets.token_urlsafe(48)
    db.add(
        RefreshToken(
            user_id=user_id,
            token_hash=_hash_token(raw),
            expires_at=_new_expiry(),
        )
    )
    await db.commit()
    return user_id, raw


async def revoke_refresh_token(db: AsyncSession, token: str) -> None:
    """Supprime un refresh token (déconnexion). Sans effet s'il n'existe pas."""
    await db.execute(
        delete(RefreshToken)
        .where(RefreshToken.token_hash == _hash_token(token))
        .execution_options(synchronize_session=False)
    )
    await db.commit()
