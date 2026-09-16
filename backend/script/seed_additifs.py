"""Script autonome pour peupler ou mettre à jour la table des additifs alimentaires.

Utilise le référentiel consolidé dans `bdproduitdz.additifs_seed.FOOD_ADDITIVES`.
Insère tous les additifs avec toutes leurs colonnes (e_number, sin_number, ins_number,
name, danger_level, description, source, category) de manière idempotente
(ON CONFLICT (e_number) DO UPDATE).

Utilisation (depuis backend/):
    python script/seed_additifs.py
    # Ou en ciblant une URL spécifique :
    python script/seed_additifs.py postgresql+asyncpg://user:pass@host/db
"""
import asyncio
import os
import ssl
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from bdproduitdz.additifs_seed import FOOD_ADDITIVES

load_dotenv()


def _should_use_ssl(url: str) -> bool:
    local_markers = ("@localhost", "@127.0.0.1", "@db:", "@db/", "@postgres")
    return not any(m in (url or "") for m in local_markers)


async def seed_database(db_url: str) -> None:
    connect_args = {}
    if _should_use_ssl(db_url):
        ctx = ssl.create_default_context()
        ctx.check_hostname = True
        ctx.verify_mode = ssl.CERT_REQUIRED
        connect_args["ssl"] = ctx

    engine = create_async_engine(db_url, connect_args=connect_args)

    async with engine.begin() as conn:
        initial_count = await conn.scalar(text("SELECT count(*) FROM additifs;"))
        print(f"Table 'additifs' avant peuplement : {initial_count} enregistrement(s).")
        print(f"Injection de {len(FOOD_ADDITIVES)} additifs alimentaires...")

        for item in FOOD_ADDITIVES:
            await conn.execute(
                text(
                    """
                    INSERT INTO additifs (e_number, sin_number, ins_number, name, danger_level, description, source, category)
                    VALUES (:e, :sin, :ins, :n, :d, :desc, :s, :cat)
                    ON CONFLICT (e_number) DO UPDATE SET
                        sin_number = EXCLUDED.sin_number,
                        ins_number = EXCLUDED.ins_number,
                        name = EXCLUDED.name,
                        danger_level = EXCLUDED.danger_level,
                        description = EXCLUDED.description,
                        source = EXCLUDED.source,
                        category = EXCLUDED.category
                    """
                ),
                {
                    "e": item["e_number"],
                    "sin": item["sin_number"],
                    "ins": item["ins_number"],
                    "n": item["name"],
                    "d": item["danger_level"],
                    "desc": item["description"],
                    "s": item["source"],
                    "cat": item["category"],
                },
            )

        final_count = await conn.scalar(text("SELECT count(*) FROM additifs;"))
        print(f"Succès ! Table 'additifs' contient désormais {final_count} enregistrement(s).")

    await engine.dispose()


def main():
    target_url = sys.argv[1] if len(sys.argv) > 1 else os.getenv("DATABASE_URL")
    if not target_url:
        print("ERREUR: DATABASE_URL manquant.")
        sys.exit(1)

    print(f"Cible : {target_url.split('@')[-1] if '@' in target_url else target_url}")
    asyncio.run(seed_database(target_url))


if __name__ == "__main__":
    main()
