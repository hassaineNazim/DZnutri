import asyncio
import os
import sys
from sqlalchemy.future import select
import traceback
from datetime import datetime

# --- AJOUTEZ CE BLOC AU TOUT DÉBUT ---
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, project_root)
# ------------------------------------

from database import AsyncSessionLocal, engine
from auth import models as auth_models
from bdproduitdz import models, scoring

async def main():
    print("Démarrage du script de mise à jour des scores...")

    async with AsyncSessionLocal() as db:
        # --- Étape 1 : Charger la bibliothèque d’additifs ---
        result_additifs = await db.execute(select(models.Additif))
        known_additives_list = result_additifs.scalars().all()

        additives_map = {
            str(add.e_number).strip().upper(): add
            for add in known_additives_list if add.e_number
        }
        print(f"{len(additives_map)} additifs chargés en mémoire.")

        # --- Étape 2 : Récupérer tous les produits ---
        result_products = await db.execute(select(models.Product))
        products_to_update = result_products.scalars().all()

        if not products_to_update:
            print("Aucun produit à mettre à jour.")
            return

        print(f"Mise à jour de {len(products_to_update)} produits...")
        updated_count = 0
        BATCH = 100

        # --- Étape 3 : Boucle principale ---
        for product in products_to_update:
            barcode = getattr(product, "barcode", None)
            prod_id = getattr(product, "id", None)

            try:
                product_data = {
                    "nutriments": product.nutriments,
                    "nova_group": product.nova_group,
                    "additives_tags": product.additives_tags,
                    "ecoscore_grade": product.ecoscore_grade,
                    "nutriscore_grade": product.nutri_score,
                }

                with db.no_autoflush:
                    score_result = await scoring.calculate_score(db, product_data)

                product.custom_score = score_result.get("score")
                product.detail_custom_score = score_result.get("details")
                product.updated_at = datetime.utcnow()

                db.add(product)
                updated_count += 1

                # Commit par lot
                if updated_count % BATCH == 0:
                    await db.commit()
                    print(f"Lot de {BATCH} produits sauvegardé...")

            except Exception as e:
                # --- CORRECTION ICI ---
                # On ne fait PAS de rollback. On se contente d'afficher l'erreur
                # et de passer au produit suivant. La transaction principale reste active.
                print(f"ERREUR: Impossible de mettre à jour le produit id={prod_id} barcode={barcode} — {e}")
                traceback.print_exc()

        # --- Étape 4 : Sauvegarder les changements restants ---
        try:
            await db.commit()
            print("Sauvegarde du dernier lot...")
        except Exception as e:
            print(f"ERREUR lors du commit final: {e}")
            await db.rollback() # Un rollback ici est correct, s'il y a une erreur finale.

    await engine.dispose()
    print(f"\nTerminé ! {updated_count} produits ont été mis à jour avec succès.") 


if __name__ == "__main__":
    asyncio.run(main())