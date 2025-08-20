import sys
import os

# Ajoute le dossier courant au chemin de Python pour qu'il trouve vos modules
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

print("--- Début du test de découverte des modèles ---")

try:
    # On essaie d'importer la Base centrale
    from database import Base
    print("✅ La Base a été trouvée dans database.py.")

    # On essaie d'importer les modèles
    from auth import models as auth_models
    print("✅ Le module auth.models a été importé.")
    
    from bdproduitdz import models as produit_models
    print("✅ Le module produit.models a été importé.")

    # Le test ultime : on regarde ce que SQLAlchemy a découvert
    print("\n--- Tables découvertes par SQLAlchemy ---")
    if not Base.metadata.tables:
        print("❌ AUCUNE TABLE DÉCOUVERTE. Problème de lien entre les modèles et la Base.")
    else:
        for table_name in Base.metadata.tables.keys():
            print(f"✔️ Table trouvée : {table_name}")

except ImportError as e:
    print(f"\n❌ ERREUR D'IMPORTATION : {e}")
    print("Le problème est un chemin d'import incorrect. Vérifiez les noms de vos dossiers.")
except Exception as e:
    print(f"\n❌ UNE ERREUR INATTENDUE S'EST PRODUITE : {e}")