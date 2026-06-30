"""Crée (idempotent) les index de performance, dont les index trigram pour la
recherche texte (ILIKE '%...%').

    cd backend
    .venv\\Scripts\\python.exe script\\add_indexes.py

- CREATE EXTENSION pg_trgm : requis pour les index GIN trigram (recherche
  substring/ILIKE sans scan séquentiel).
- CREATE INDEX CONCURRENTLY IF NOT EXISTS : pas de verrou bloquant en écriture
  (sûr sur une grande table en service) et ré-exécutable sans risque.

Note : si un CREATE INDEX CONCURRENTLY est interrompu, il peut laisser un index
"invalid" ; le supprimer (DROP INDEX <nom>) puis relancer le script.
"""
import asyncio
import os
import sys

# Permet d'importer database.py quand on lance le script depuis n'importe où.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text  # noqa: E402
from database import engine  # noqa: E402

EXTENSIONS = [
    "CREATE EXTENSION IF NOT EXISTS pg_trgm",
]

# Instructions complètes (CONCURRENTLY impose l'autocommit).
INDEXES = [
    # --- Recherche texte (ILIKE '%q%') : index GIN trigram ---
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_products_name_trgm ON produits USING gin (product_name gin_trgm_ops)",
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_products_brand_trgm ON produits USING gin (brand gin_trgm_ops)",
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_products_barcode_trgm ON produits USING gin (barcode gin_trgm_ops)",
    # --- Tri global par score (recherche/navigation sans filtre catégorie) ---
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_products_custom_score ON produits (custom_score)",
    # --- Navigation par catégorie triée par score ---
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_products_category_score ON produits (category, custom_score)",
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_products_subcategory_score ON produits (subcategory, custom_score)",
    # --- Historique ---
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_scan_history_user_scanned ON scan_history (user_id, scanned_at)",
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_scan_history_user_product ON scan_history (user_id, product_id)",
    # --- Favoris ---
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_favorites_user_product ON favorites (user_id, product_id)",
    # --- Notifications ---
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_notifications_user_created ON notifications (user_id, created_at)",
    "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_notifications_user_read ON notifications (user_id, read)",
]


async def main() -> None:
    # AUTOCOMMIT obligatoire : CREATE INDEX CONCURRENTLY ne peut pas s'exécuter
    # dans une transaction.
    ac_engine = engine.execution_options(isolation_level="AUTOCOMMIT")
    async with ac_engine.connect() as conn:
        for stmt in EXTENSIONS + INDEXES:
            print(f"-> {stmt}")
            await conn.execute(text(stmt))
    await engine.dispose()
    print("Extensions et index créés / vérifiés avec succès.")


if __name__ == "__main__":
    asyncio.run(main())
