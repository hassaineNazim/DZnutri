"""Crée (de façon idempotente) les index composites de performance.

À lancer une fois après mise à jour du code :

    cd backend
    .venv\\Scripts\\python.exe script\\add_indexes.py

Chaque index utilise CREATE INDEX IF NOT EXISTS : le script peut être relancé
sans risque. Ces index accélèrent les requêtes les plus fréquentes (historique,
favoris, notifications, recherche par catégorie) quand le nombre d'utilisateurs
et de produits augmente.
"""
import asyncio
import os
import sys

# Permet d'importer database.py quand on lance le script depuis n'importe où.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text  # noqa: E402
from database import engine  # noqa: E402

INDEXES = [
    # produits : recherche/alternatives par catégorie triées par score
    ("ix_products_category_score", "produits", "(category, custom_score)"),
    ("ix_products_subcategory_score", "produits", "(subcategory, custom_score)"),
    # scan_history : liste de l'historique + upsert/suppression
    ("ix_scan_history_user_scanned", "scan_history", "(user_id, scanned_at)"),
    ("ix_scan_history_user_product", "scan_history", "(user_id, product_id)"),
    # favorites : toggle/check/liste
    ("ix_favorites_user_product", "favorites", "(user_id, product_id)"),
    # notifications : liste + compteur de non-lues
    ("ix_notifications_user_created", "notifications", "(user_id, created_at)"),
    ("ix_notifications_user_read", "notifications", "(user_id, read)"),
]


async def main() -> None:
    async with engine.begin() as conn:
        for name, table, cols in INDEXES:
            stmt = f"CREATE INDEX IF NOT EXISTS {name} ON {table} {cols}"
            print(f"-> {stmt}")
            await conn.execute(text(stmt))
    await engine.dispose()
    print("Index créés / vérifiés avec succès.")


if __name__ == "__main__":
    asyncio.run(main())
