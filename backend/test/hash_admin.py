import os
import sys

# 1. On détermine le chemin vers le dossier parent (la racine "backend")
project_root = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

# 2. On l'ajoute au chemin de recherche de Python
sys.path.insert(0, project_root)

# 3. On utilise un import absolu depuis cette racine
from auth.security import hash_password

# Le reste de votre code ne change pas
password_admin1 = "mot_de_passe_pour_admin1"
password_admin2 = "mot_de_passe_pour_admin2"

hashed1 = hash_password(password_admin1)
hashed2 = hash_password(password_admin2)

print("--- Hashes à copier ---")
print(f"Admin 1 ('admin'): {hashed1}")
print(f"Admin 2 ('superadmin'): {hashed2}")
print("--- Fin des hashes ---")