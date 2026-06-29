# backend/create_db.py
"""Crée toutes les tables (et leurs index) dans la base configurée.

Idempotent : `create_all` ne recrée pas ce qui existe déjà. Utilisé au démarrage
du conteneur (entrypoint) et pour initialiser un Postgres neuf.
"""
import asyncio

from database import engine, Base

# IMPORTANT : importer TOUS les modules de modèles pour que Base.metadata
# contienne l'ensemble des tables. Sinon create_all ne crée que les tables
# des modèles déjà importés.
import auth.models  # noqa: F401
import auth.profile_models  # noqa: F401
import bdproduitdz.models  # noqa: F401


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    print(f"Schéma créé/vérifié : {len(Base.metadata.tables)} tables.")


if __name__ == "__main__":
    asyncio.run(create_tables())
