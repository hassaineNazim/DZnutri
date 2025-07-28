import asyncio
from auth.models import UserTable
from auth.users_db import add_user, get_user

async def main():
    # Ajout d'un utilisateur
    user = UserTable(username="testuser", hashed_password="motdepassehashé")
    await add_user(user)
    print("Utilisateur ajouté.")

    # Lecture de l'utilisateur
    user_from_db = await get_user("testuser")
    if user_from_db:
        print("Utilisateur trouvé :", user_from_db.username, user_from_db.hashed_password)
    else:
        print("Utilisateur non trouvé.")

if __name__ == "__main__":
    asyncio.run(main())