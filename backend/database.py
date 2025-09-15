import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import AsyncGenerator
import re # On importe le module pour les expressions régulières

# On charge les variables du fichier .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL is None:
    raise ValueError("La variable d'environnement DATABASE_URL n'est pas définie !")

# --- CORRECTION ICI ---
# On prépare un dictionnaire pour les arguments de connexion supplémentaires
connect_args = {}
# On vérifie si l'URL contient sslmode=require (ce qui est le cas pour Neon)
if "sslmode=require" in DATABASE_URL:
    # Si oui, on ajoute l'argument 'ssl' que 'asyncpg' comprend
    connect_args["ssl"] = "require"
    # On nettoie l'URL pour enlever le paramètre que SQLAlchemy ne comprend pas
    DATABASE_URL = re.sub(r"\?sslmode=require$", "", DATABASE_URL)
# --------------------

# On passe les arguments de connexion supplémentaires lors de la création du moteur
engine = create_async_engine(DATABASE_URL, echo=True, connect_args=connect_args)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session