"""Vérification autonome de scoring.py sans dépendances lourdes.

On stube sqlalchemy et bdproduitdz.crud dans sys.modules pour pouvoir importer
le module de scoring dans un venv minimal, puis on teste des cas connus.
Lancé manuellement : python tests/_quick_scoring_check.py
"""
import asyncio
import os
import sys
import types

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

# --- Stub sqlalchemy.ext.asyncio.AsyncSession ---
sa = types.ModuleType("sqlalchemy")
sa_ext = types.ModuleType("sqlalchemy.ext")
sa_async = types.ModuleType("sqlalchemy.ext.asyncio")
sa_async.AsyncSession = object
sys.modules["sqlalchemy"] = sa
sys.modules["sqlalchemy.ext"] = sa_ext
sys.modules["sqlalchemy.ext.asyncio"] = sa_async

# --- Stub bdproduitdz.crud (async) ---
pkg = types.ModuleType("bdproduitdz")
pkg.__path__ = [os.path.join(ROOT, "bdproduitdz")]
sys.modules["bdproduitdz"] = pkg

crud_stub = types.ModuleType("bdproduitdz.crud")
async def get_additifs_penalty(db):
    # e330 (acide citrique) faible, e951 (aspartame) modéré, e102 élevé
    return {"e330": 1, "e951": 2, "e102": 3}
async def store_or_increment_pending_additifs(db, unknown):
    return None
crud_stub.get_additifs_penalty = get_additifs_penalty
crud_stub.store_or_increment_pending_additifs = store_or_increment_pending_additifs
sys.modules["bdproduitdz.crud"] = crud_stub

from bdproduitdz import scoring  # noqa: E402


def check(name, cond, extra=""):
    print(f"[{'OK ' if cond else 'FAIL'}] {name} {extra}")
    return cond


async def main():
    ok = True

    # 1. Sel : le bug historique. 1g de sel/100g (sodium 400mg) doit donner
    #    n_salt = 4 points (entre 360 et 450), PAS 10.
    salty = {"nutriments": {"salt_100g": 1.0}, "category": "solid"}
    res = await scoring.calculate_score(None, salty)
    n_salt = res["details"]["nutrition_details"]["components"]["sodium"]
    ok &= check("Sel 1g -> 4 pts sodium", n_salt == 4, f"(obtenu {n_salt})")

    # 2. Clés underscore (parser OCR) : énergie + graisses saturées doivent
    #    être prises en compte (bug historique : lues à 0).
    junk_underscore = {
        "nutriments": {
            "energy_kcal_100g": 540,
            "saturated_fat_100g": 12,
            "sugars_100g": 55,
            "salt_100g": 0.2,
        },
        "category": "solid",
    }
    res2 = await scoring.calculate_score(None, junk_underscore)
    comp = res2["details"]["nutrition_details"]["components"]
    ok &= check("Underscore: énergie comptée", comp["energy"] > 0, f"(energy={comp['energy']})")
    ok &= check("Underscore: AG saturés comptés", comp["saturated_fat"] > 0, f"(satfat={comp['saturated_fat']})")
    ok &= check("Junk food -> Nutri-Score e", res2["nutri_score"] == "e", f"(grade={res2['nutri_score']}, score={res2['score']})")

    # 3. Même produit en clés OpenFoodFacts (tirets) -> doit donner le même résultat.
    junk_hyphen = {
        "nutriments": {
            "energy-kcal_100g": 540,
            "saturated-fat_100g": 12,
            "sugars_100g": 55,
            "salt_100g": 0.2,
        },
        "category": "solid",
    }
    res3 = await scoring.calculate_score(None, junk_hyphen)
    ok &= check("Parité underscore/tiret", res2["score"] == res3["score"], f"({res2['score']} vs {res3['score']})")

    # 4. Produit sain (légumes) -> bon score, Nutri-Score a/b.
    healthy = {
        "nutriments": {
            "energy-kcal_100g": 40,
            "saturated-fat_100g": 0.1,
            "sugars_100g": 3,
            "salt_100g": 0.05,
            "fiber_100g": 4,
            "proteins_100g": 3,
        },
        "category": "solid",
        "fruits_percent": 90,
    }
    res4 = await scoring.calculate_score(None, healthy)
    ok &= check("Produit sain -> a/b", res4["nutri_score"] in ("a", "b"), f"(grade={res4['nutri_score']}, score={res4['score']})")

    # 5. Eau -> 100 / a
    water = {"category": "eau minérale", "nutriments": {}}
    res5 = await scoring.calculate_score(None, water)
    ok &= check("Eau -> 100 / a", res5["score"] == 100 and res5["nutri_score"] == "a")

    # 6. Boisson sucrée (soda) -> mauvais, Nutri-Score d/e
    soda = {"nutriments": {"energy-kcal_100g": 42, "sugars_100g": 10.6}, "category": "soda"}
    res6 = await scoring.calculate_score(None, soda)
    ok &= check("Soda -> d/e", res6["nutri_score"] in ("d", "e"), f"(grade={res6['nutri_score']}, score={res6['score']})")

    # 7. Additif à risque élevé -> score additifs = 0
    with_bad_add = {"nutriments": {"sugars_100g": 5}, "category": "solid", "additives_tags": ["en:e102"]}
    res7 = await scoring.calculate_score(None, with_bad_add)
    add_score = res7["details"]["additives_score"]
    ok &= check("Additif risque élevé -> additifs 0", add_score == 0, f"(add_score={add_score})")

    # 8. Additif inconnu remonté
    with_unknown = {"nutriments": {}, "category": "solid", "additives_tags": ["en:e999"]}
    res8 = await scoring.calculate_score(None, with_unknown)
    ok &= check("Additif inconnu détecté", "e999" in res8["unknown_additifs"])

    print("\nRESULT:", "ALL_PASS" if ok else "SOME_FAILED")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
