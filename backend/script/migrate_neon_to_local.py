"""Migration des données Neon -> Postgres local (dockerisé).

Copie le schéma + toutes les données de la base source (Neon) vers la base
cible (le Postgres du docker-compose). Indépendant de la version de Postgres
(passe par SQLAlchemy, pas par pg_dump).

Pré-requis : la stack docker doit tourner (au moins le service `db`), avec le
port 5432 exposé sur l'hôte.

Utilisation (depuis backend/, venv activé) :

    # SOURCE = DATABASE_URL du .env (Neon) par défaut
    # CIBLE  = TARGET_DATABASE_URL (défaut = Postgres docker exposé en local)
    set TARGET_DATABASE_URL=postgresql+asyncpg://dznutri:dznutri_dev_secret@localhost:5432/dznutri
    .venv\\Scripts\\python.exe script\\migrate_neon_to_local.py

Le script VIDE d'abord les tables cibles puis recopie tout (ré-exécutable).
Refuse d'écrire si la cible ressemble à une base Neon (sécurité).
"""
import asyncio
import os
import ssl
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv  # noqa: E402
from sqlalchemy import text  # noqa: E402
from sqlalchemy.ext.asyncio import create_async_engine  # noqa: E402

load_dotenv()

# Importer tous les modèles pour peupler Base.metadata
import auth.models  # noqa: E402,F401
import auth.profile_models  # noqa: E402,F401
import bdproduitdz.models  # noqa: E402,F401
from database import Base  # noqa: E402

SOURCE_URL = os.getenv("SOURCE_DATABASE_URL") or os.getenv("DATABASE_URL")
TARGET_URL = os.getenv(
    "TARGET_DATABASE_URL",
    "postgresql+asyncpg://dznutri:dznutri_dev_secret@localhost:5432/dznutri",
)


def _ssl_args(url: str) -> dict:
    """SSL pour les hôtes distants (Neon), pas pour localhost/conteneur."""
    local = ("@localhost", "@127.0.0.1", "@db:", "@db/", "@postgres")
    if any(m in url for m in local):
        return {}
    ctx = ssl.create_default_context()
    return {"ssl": ctx}


async def main() -> None:
    if not SOURCE_URL:
        print("ERREUR: SOURCE_DATABASE_URL / DATABASE_URL manquant.")
        sys.exit(1)
    if "neon.tech" in TARGET_URL:
        print("ERREUR: la cible ressemble à Neon. Migration annulée par sécurité.")
        sys.exit(1)

    print(f"SOURCE : {SOURCE_URL.split('@')[-1]}")
    print(f"CIBLE  : {TARGET_URL.split('@')[-1]}")

    source = create_async_engine(SOURCE_URL, connect_args=_ssl_args(SOURCE_URL))
    target = create_async_engine(TARGET_URL, connect_args=_ssl_args(TARGET_URL))

    # 1. Créer le schéma sur la cible (idempotent)
    async with target.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Schéma cible créé/vérifié.")

    tables = Base.metadata.sorted_tables  # ordre respectant les clés étrangères

    # 2. Vider les tables cibles (ordre inverse pour les FK)
    async with target.begin() as conn:
        for table in reversed(tables):
            await conn.execute(table.delete())
    print("Tables cibles vidées.")

    # 3. Copier les données table par table
    total = 0
    async with source.connect() as src, target.begin() as tgt:
        for table in tables:
            rows = (await src.execute(table.select())).mappings().all()
            if rows:
                await tgt.execute(table.insert(), [dict(r) for r in rows])
            print(f"  {table.name}: {len(rows)} lignes")
            total += len(rows)

    # 4. Réinitialiser les séquences d'auto-incrément (colonnes 'id')
    async with target.begin() as conn:
        for table in tables:
            if "id" in table.c:
                await conn.execute(text(
                    f"SELECT setval(pg_get_serial_sequence('{table.name}', 'id'), "
                    f"COALESCE((SELECT MAX(id) FROM {table.name}), 1), "
                    f"(SELECT MAX(id) FROM {table.name}) IS NOT NULL)"
                ))
    print("Séquences réinitialisées.")

    await source.dispose()
    await target.dispose()
    print(f"\nMigration terminée : {total} lignes copiées.")


if __name__ == "__main__":
    asyncio.run(main())
