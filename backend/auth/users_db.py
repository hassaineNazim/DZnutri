from .password import hash_password
from sqlalchemy.future import select
from .models import UserTable
from sqlalchemy.ext.asyncio import AsyncSession


async def get_user(db: AsyncSession, username: str):
    """
    Récupère un utilisateur par son nom d'utilisateur en utilisant la session fournie.
    """
    result = await db.execute(select(UserTable).where(UserTable.username == username))
    user = result.scalars().first()
    return user

async def add_user(db: AsyncSession, user: any):
    """
    Ajoute un nouvel utilisateur à la base de données.
    """
    result = await db.execute(select(UserTable).where(UserTable.username == user.username))
    existing_user = result.scalars().first()
    if existing_user:
        return existing_user
    user.hashed_password = hash_password(user.hashed_password)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

