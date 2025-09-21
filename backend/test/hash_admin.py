from auth.security import hash_password

# Choisissez des mots de passe forts pour vos admins
password_admin1 = "2232003"
password_admin2 = "8122002"

hashed1 = hash_password(password_admin1)
hashed2 = hash_password(password_admin2)

print("--- Hashes à copier ---")
print(f"Admin 1 ('Nazim'): {hashed1}")
print(f"Admin 2 ('Aymen Djalal'): {hashed2}")
