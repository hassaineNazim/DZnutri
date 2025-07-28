
from .models import UserInDB
from .password import hash_password
from sqlalchemy.future import select
from database import AsyncSessionLocal
from auth.models import UserTable

fake_users_db = {
    "alice": {
        "id": 1,
        "username": "alice",
        "hashed_password": hash_password("motdepasse1")
    },
    "bob": {
        "id": 2,
        "username": "bob",
        "hashed_password": hash_password("motdepasse2")
    }
} 

async def get_user(username: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(UserTable).where(UserTable.username == username))
        user = result.scalars().first()
        return user

async def add_user(user: UserTable):
    async with AsyncSessionLocal() as session:
        session.add(user)
        await session.commit()
