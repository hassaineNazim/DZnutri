import hashlib
import os
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import cloudinary
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from observability import metrics, setup_logging
from rate_limit import limiter
from routers import auth, products, submissions, admin, history, report, profile, search, favorites, notifications

load_dotenv()

# --- Logging centralisé (JSON + rotation) ---
# Configuration unique et structurée. Niveau pilotable via LOG_LEVEL (INFO par
# défaut). Voir observability.setup_logging pour le détail (rotation, JSON...).
logger = setup_logging()

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

# Rate limiting : on enregistre le limiteur et le handler 429 dédié (slowapi).
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Compression GZip : réduit fortement la taille des réponses JSON volumineuses
# (listes de produits, nutriments, historique) -> moins de bande passante et
# des temps de chargement plus rapides côté mobile.
app.add_middleware(GZipMiddleware, minimum_size=1000)


def _session_key(request: Request) -> str | None:
    """Clé de session anonyme pour compter les utilisateurs actifs.

    On ne décode pas le JWT (coûteux et inutile ici) : on hash le token porteur,
    sinon on retombe sur l'IP. Aucune donnée personnelle n'est stockée, juste un
    identifiant opaque servant à dédupliquer les utilisateurs sur une fenêtre.
    """
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header[7:]
        return hashlib.sha256(token.encode("utf-8")).hexdigest()[:16]
    client = request.client
    return client.host if client else None


@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    """Mesure chaque requête et garantit qu'aucune exception ne s'échappe nue.

    - Attribue un ``request_id` corrélant logs et réponse d'erreur.
    - Mesure la latence et alimente le magasin de métriques temps réel.
    - Filet de sécurité ultime : toute exception non gérée est journalisée et
      transformée en réponse 500 propre (le serveur ne crashe jamais en silence).
    """
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
    request.state.request_id = request_id
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception as exc:  # noqa: BLE001 - filet de sécurité global
        duration_ms = (time.perf_counter() - start) * 1000
        path = request.url.path
        logger.exception(
            "Exception non gérée sur %s %s",
            request.method,
            path,
            extra={"request_id": request_id, "path": path},
        )
        metrics.record_request(path, 500, duration_ms, _session_key(request))
        metrics.record_error(path, str(exc), request_id)
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Erreur interne du serveur.",
                "request_id": request_id,
            },
            headers={"X-Request-ID": request_id},
        )

    duration_ms = (time.perf_counter() - start) * 1000
    metrics.record_request(
        request.url.path, response.status_code, duration_ms, _session_key(request)
    )
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time-ms"] = f"{duration_ms:.1f}"
    return response

# Toute URL commençant par /uploads cherchera un fichier dans le dossier "uploads".
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS : en production, on n'autorise QUE les origines listées dans la variable
# d'env ALLOWED_ORIGINS (séparées par des virgules). En développement, on
# autorise tout pour faciliter le travail local.
# Note CORS : '*' est incompatible avec allow_credentials=True ; on désactive
# donc les credentials en dev (l'app mobile et l'admin utilisent un Bearer token,
# pas de cookies).
_env = os.getenv("ENVIRONMENT", "development").strip().lower()
if _env == "production":
    allowed_origins = [
        o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()
    ]
    if not allowed_origins:
        logger.warning(
            "ALLOWED_ORIGINS vide en production : aucune origine cross-site ne "
            "sera autorisée. Définissez vos domaines (ex: https://admin.dznutri.com)."
        )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
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


# --- Global error handling ---------------------------------------------------
# Ces handlers garantissent un format d'erreur homogène et l'inclusion du
# request_id pour le support, tout en évitant les fuites de stack trace au client.


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    request_id = getattr(request.state, "request_id", "")
    if exc.status_code >= 500:
        logger.error(
            "HTTP %s sur %s : %s",
            exc.status_code,
            request.url.path,
            exc.detail,
            extra={"request_id": request_id, "path": request.url.path},
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "request_id": request_id},
        headers={"X-Request-ID": request_id},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", "")
    logger.warning(
        "Validation échouée sur %s",
        request.url.path,
        extra={"request_id": request_id, "path": request.url.path},
    )
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "request_id": request_id},
        headers={"X-Request-ID": request_id},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Dernier rempart : aucune exception ne doit produire un crash silencieux."""
    request_id = getattr(request.state, "request_id", "")
    logger.exception(
        "Exception non gérée (handler global) sur %s",
        request.url.path,
        extra={"request_id": request_id, "path": request.url.path},
    )
    metrics.record_error(request.url.path, str(exc), request_id)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erreur interne du serveur.", "request_id": request_id},
        headers={"X-Request-ID": request_id},
    )


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
