# backend/create_db.py
"""Crée toutes les tables (et leurs index) dans la base configurée.

Idempotent : `create_all` ne recrée pas ce qui existe déjà. Utilisé au démarrage
du conteneur (entrypoint) et pour initialiser un Postgres neuf.
"""
import asyncio

from sqlalchemy import text

from database import engine, Base

# IMPORTANT : importer TOUS les modules de modèles pour que Base.metadata
# contienne l'ensemble des tables. Sinon create_all ne crée que les tables
# des modèles déjà importés.
import auth.models  # noqa: F401
import auth.profile_models  # noqa: F401
import bdproduitdz.models  # noqa: F401


# Patches de colonnes ajoutées APRÈS la création initiale des tables.
# `create_all` ne modifie jamais une table existante : ces ALTER idempotents
# (ADD COLUMN IF NOT EXISTS) garantissent qu'une base déjà en service reçoit
# bien les nouvelles colonnes. Sûrs à rejouer à chaque démarrage.
_COLUMN_PATCHES = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_attempts INTEGER NOT NULL DEFAULT 0",
]


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for stmt in _COLUMN_PATCHES:
            await conn.execute(text(stmt))
    await engine.dispose()
    print(
        f"Schéma créé/vérifié : {len(Base.metadata.tables)} tables, "
        f"{len(_COLUMN_PATCHES)} patch(es) de colonnes appliqué(s)."
    )


if __name__ == "__main__":
    asyncio.run(create_tables())
