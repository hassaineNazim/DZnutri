# Dans auth/crud.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from . import models
from .hashing import hash_password

async def get_user_by_email(db: AsyncSession, email: str):
    """Récupère un utilisateur par son email."""
    result = await db.execute(select(models.UserTable).where(models.UserTable.email == email))
    return result.scalars().first()

async def get_user_by_apple_id(db: AsyncSession, apple_id: str):
    result = await db.execute(select(models.UserTable).where(models.UserTable.apple_id == apple_id))
    return result.scalars().first()

async def create_user_from_apple(db: AsyncSession, *, apple_id: str, email: str, full_name: str | None):
    db_user = models.UserTable(
        email=email,
        username=(full_name or email.split("@", 1)[0] or "Utilisateur Apple")[:100],
        apple_id=apple_id,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

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


async def get_user_by_id(db: AsyncSession, user_id: int):
    """Récupère un utilisateur par son ID."""
    result = await db.execute(select(models.UserTable).where(models.UserTable.id == user_id))
    return result.scalars().first()

async def create_user(db: AsyncSession, user: dict):
    """Crée un nouvel utilisateur avec email et mot de passe."""
    hashed_pwd = await hash_password(user['password'])
    db_user = models.UserTable(
        email=user['email'],
        username=user['username'],
        hashed_password=hashed_pwd
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user
