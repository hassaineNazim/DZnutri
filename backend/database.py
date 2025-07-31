from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base 
from typing import AsyncGenerator

DATABASE_URL = "sqlite+aiosqlite:///./BDGlobal.db"

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dépendance FastAPI pour obtenir une session de base de données.
    """
    async with AsyncSessionLocal() as session:
        yield session