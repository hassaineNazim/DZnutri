# Dans auth/crud.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from . import models

async def get_user_by_email(db: AsyncSession, email: str):
    """Récupère un utilisateur par son email."""
    result = await db.execute(select(models.UserTable).where(models.UserTable.email == email))
    return result.scalars().first()

async def create_user_from_google(db: AsyncSession, user_info: dict):
    """Crée un nouvel utilisateur à partir des informations Google."""
    db_user = models.UserTable(
        email=user_info['email'],
        username=user_info.get('name', user_info['email']),
        google_id=user_info.get('sub')
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def create_user_from_facebook(db: AsyncSession, user_info: dict):
    """Crée un nouvel utilisateur à partir des informations Facebook."""
    db_user = models.UserTable(
        email=user_info['email'],
        username=user_info.get('name', user_info['email']),
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def get_user_by_username(db: AsyncSession, username: str):
    """Récupère un utilisateur par son nom d'utilisateur."""
    result = await db.execute(select(models.UserTable).where(models.UserTable.username == username))
    return result.scalars().first()