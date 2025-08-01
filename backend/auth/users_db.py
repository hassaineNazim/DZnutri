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

async def add_user(db: AsyncSession, user: UserTable):
    """
    Ajoute un nouvel utilisateur à la base de données.
    """    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

