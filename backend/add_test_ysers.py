import asyncio
from auth.models import UserTable
from auth.users_db import add_user
from auth.password import hash_password

async def add_test_users():
    # Créer alice
    alice = UserTable(
        username="alice",
        hashed_password=hash_password("motdepasse1")
    )
    await add_user(alice)
    print("alice est bien la !")

    # Créer bob
    bob = UserTable(
        username="bob", 
        hashed_password=hash_password("motdepasse2")
    )
    await add_user(bob)
    print("bob est dans la place ")

if __name__ == "__main__":
    asyncio.run(add_test_users())