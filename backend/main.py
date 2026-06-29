import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

import cloudinary
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

from routers import auth, products, submissions, admin, history, report, profile, search, favorites, notifications

load_dotenv()

# --- Logging centralisé ---
# Un seul point de configuration. Niveau pilotable via LOG_LEVEL (INFO par défaut).
# En production on évite DEBUG (trop verbeux/coûteux sous charge).
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("dznutri")

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)


Path("uploads").mkdir(exist_ok=True)


async def _init_cache():
    """Initialise le cache applicatif.

    Stratégie résiliente : on tente Redis (cache partagé entre workers, idéal en
    production multi-instances). Si Redis est injoignable (ex. dev local sans
    Docker), on bascule automatiquement sur un cache en mémoire pour que l'API
    reste 100% fonctionnelle. Retourne le client Redis (à fermer au shutdown) ou
    None si on est en mode mémoire.
    """
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    try:
        from fastapi_cache.backends.redis import RedisBackend
        from redis import asyncio as aioredis

        redis = aioredis.from_url(
            redis_url,
            encoding="utf8",
            decode_responses=True,
            socket_connect_timeout=2,
        )
        # On vérifie que Redis répond réellement avant de l'adopter.
        await redis.ping()
        FastAPICache.init(RedisBackend(redis), prefix="dznutri-cache")
        logger.info("Cache: Redis connecté (%s)", redis_url)
        return redis
    except Exception as exc:  # noqa: BLE001 - on veut un fallback sur toute erreur
        logger.warning(
            "Cache: Redis indisponible (%s) -> fallback cache mémoire. Détail: %s",
            redis_url, exc,
        )
        FastAPICache.init(InMemoryBackend(), prefix="dznutri-cache")
        return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Démarrage
    redis = await _init_cache()
    yield
    # Arrêt : on libère proprement les ressources réseau.
    await products.close_off_client()
    if redis is not None:
        try:
            await redis.aclose()
        except AttributeError:  # redis-py < 5 expose close() au lieu d'aclose()
            await redis.close()


app = FastAPI(
    title="DZnutri API",
    description="API for DZnutri product management system",
    version="1.0.0",
    lifespan=lifespan,
)

# Compression GZip : réduit fortement la taille des réponses JSON volumineuses
# (listes de produits, nutriments, historique) -> moins de bande passante et
# des temps de chargement plus rapides côté mobile.
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Toute URL commençant par /uploads cherchera un fichier dans le dossier "uploads".
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS configuration for frontend
# TODO: In production, replace ["*"] with specific origins
origins = [
    "http://localhost:3000",   # React default
    "http://localhost:8081",   # Expo default
    "http://localhost:19000",  # Expo default
    "http://localhost:19006",  # Expo web
    # Add your production domains here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if os.getenv("ENVIRONMENT") == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "DZnutri API is running", "status": "healthy"}


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "service": "dznutri-api"}


# Include Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(submissions.router)
app.include_router(admin.router)
app.include_router(history.router)
app.include_router(report.router)
app.include_router(profile.router)
app.include_router(search.router)
app.include_router(favorites.router)
app.include_router(notifications.router)
