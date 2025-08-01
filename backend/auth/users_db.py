from .password import hash_password
from sqlalchemy.future import select
from database import AsyncSessionLocal
from .models import UserTable


async def get_user(username: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(UserTable).where(UserTable.username == username))
        user = result.scalars().first()
        return user

async def add_user(user: any):
    async with AsyncSessionLocal() as session:
        session.add(user)
        await session.commit()


