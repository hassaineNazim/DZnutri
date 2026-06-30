"""Convertit (idempotent) les colonnes JSON en JSONB sur une base EXISTANTE.

    cd backend
    .venv\\Scripts\\python.exe script\\migrate_json_to_jsonb.py

JSONB est binaire : plus rapide, moins volumineux, et indexable (GIN) si l'on
filtre un jour dans les nutriments/additifs. Les bases NEUVES sont déjà en JSONB
via le modèle ; ce script ne sert qu'à convertir une base déjà remplie.

Idempotent : ne convertit QUE les colonnes encore en type 'json' (vérifié via
information_schema) -> ré-exécutable sans refaire le travail.

ATTENTION : ALTER COLUMN ... TYPE jsonb réécrit la table et pose un verrou
ACCESS EXCLUSIVE le temps de l'opération. Sur une grande table, lancer pendant
une fenêtre de maintenance.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text  # noqa: E402
from database import engine  # noqa: E402

# (table, colonne) à convertir si encore en 'json'.
TARGETS = [
    ("produits", "nutriments"),
    ("produits", "additives_tags"),
    ("produits", "detail_custom_score"),
    ("submissions", "parsed_nutriments"),
    ("submissions", "found_additives"),
]


async def main() -> None:
    async with engine.begin() as conn:
        for table, col in TARGETS:
            current = await conn.scalar(
                text(
                    "SELECT data_type FROM information_schema.columns "
                    "WHERE table_name = :t AND column_name = :c"
                ),
                {"t": table, "c": col},
            )
            if current is None:
                print(f"-- {table}.{col} : colonne absente, ignorée")
                continue
            if current == "jsonb":
                print(f"-- {table}.{col} : déjà JSONB, ignorée")
                continue
            stmt = f"ALTER TABLE {table} ALTER COLUMN {col} TYPE jsonb USING {col}::jsonb"
            print(f"-> {stmt}")
            await conn.execute(text(stmt))
    await engine.dispose()
    print("Migration JSON -> JSONB terminée.")


if __name__ == "__main__":
    asyncio.run(main())
