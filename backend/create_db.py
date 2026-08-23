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
from bdproduitdz.cosmetic_ingredients_seed import COSMETIC_INGREDIENTS


# Patches de colonnes ajoutées APRÈS la création initiale des tables.
# `create_all` ne modifie jamais une table existante : ces ALTER idempotents
# (ADD COLUMN IF NOT EXISTS) garantissent qu'une base déjà en service reçoit
# bien les nouvelles colonnes. Sûrs à rejouer à chaque démarrage.
_COLUMN_PATCHES = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_attempts INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_id VARCHAR UNIQUE",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_refresh_token_encrypted TEXT",
    # Date d'inscription (analytics admin). Les comptes existants sont
    # backfillés avec la date d'application du patch.
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now()",
    # Historique mixte aliments/cosmétiques : product_id devient optionnel et
    # cosmetic_id référence la table cosmetiques.
    "ALTER TABLE scan_history ADD COLUMN IF NOT EXISTS cosmetic_id INTEGER REFERENCES cosmetiques(id)",
    "ALTER TABLE scan_history ALTER COLUMN product_id DROP NOT NULL",
]


async def _seed_cosmetic_ingredients(conn) -> int:
    """Remplit le référentiel d'ingrédients cosmétiques à risque s'il est vide.

    Idempotent : ne fait rien si la table contient déjà des lignes.
    """
    count = await conn.scalar(text("SELECT count(*) FROM cosmetic_ingredients"))
    if count and count > 0:
        return 0
    for name, level, concern, description in COSMETIC_INGREDIENTS:
        await conn.execute(
            text(
                "INSERT INTO cosmetic_ingredients (name, danger_level, concern, description) "
                "VALUES (:n, :l, :c, :d) ON CONFLICT (name) DO NOTHING"
            ),
            {"n": name, "l": level, "c": concern, "d": description},
        )
    return len(COSMETIC_INGREDIENTS)


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for stmt in _COLUMN_PATCHES:
            await conn.execute(text(stmt))
        seeded = await _seed_cosmetic_ingredients(conn)
    await engine.dispose()
    print(
        f"Schéma créé/vérifié : {len(Base.metadata.tables)} tables, "
        f"{len(_COLUMN_PATCHES)} patch(es), {seeded} ingrédient(s) cosmétique(s) seedé(s)."
    )


if __name__ == "__main__":
    asyncio.run(create_tables())
