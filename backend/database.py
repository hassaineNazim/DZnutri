import ssl
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import AsyncGenerator
import os
from dotenv import load_dotenv


load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

def _normalize_database_url(raw: str | None) -> str | None:
    """Accepte la chaîne de connexion telle que la fournit Neon/Railway.

    - supprime les blancs et sauts de ligne parasites (un copier-coller depuis
      un champ qui revient à la ligne a déjà rendu l'hôte introuvable en prod) ;
    - force le pilote async : `postgresql://` -> `postgresql+asyncpg://` ;
    - retire `sslmode` / `channel_binding` : asyncpg les refuse en paramètres
      d'URL, le SSL est déjà géré via `connect_args` ci-dessous.
    """
    if not raw:
        return raw
    url = "".join(raw.split())
    for prefix in ("postgresql://", "postgres://"):
        if url.startswith(prefix):
            url = "postgresql+asyncpg://" + url[len(prefix):]
            break
    if "?" in url:
        base, query = url.split("?", 1)
        kept = [p for p in query.split("&") if p and p.split("=", 1)[0] not in ("sslmode", "channel_binding")]
        url = base + ("?" + "&".join(kept) if kept else "")
    return url


DATABASE_URL = _normalize_database_url(os.getenv("DATABASE_URL"))


def _should_use_ssl(url: str) -> bool:
    """Détermine s'il faut activer SSL pour la connexion à la base.

    - Neon (et autres bases managées distantes) exigent SSL.
    - Un Postgres local / en conteneur Docker (hôte `db`, `localhost`...) n'a
      généralement pas SSL : forcer SSL ferait échouer la connexion.

    Pilotable explicitement via la variable d'env DB_SSL (true/false), sinon
    auto-détection à partir de l'hôte.
    """
    explicit = os.getenv("DB_SSL")
    if explicit is not None:
        return explicit.strip().lower() in ("1", "true", "yes")
    local_markers = ("@localhost", "@127.0.0.1", "@db:", "@db/", "@postgres", "@redis")
    return not any(marker in (url or "") for marker in local_markers)


# echo=True logue chaque requête SQL : très coûteux et bruyant en production.
# On l'active uniquement via la variable d'env SQL_ECHO=true pour le debug.
DB_ECHO = os.getenv("SQL_ECHO", "false").lower() in ("1", "true", "yes")

# SSL conditionnel : activé pour Neon/distant, désactivé pour Postgres local.
connect_args: dict = {}
if _should_use_ssl(DATABASE_URL):
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = True
    ssl_context.verify_mode = ssl.CERT_REQUIRED
    connect_args["ssl"] = ssl_context

# Pool de connexions réutilisables : évite de refaire un handshake complet
# vers la base à CHAQUE requête (ce que faisait NullPool). pool_pre_ping vérifie
# que la connexion est vivante (Neon ferme les connexions inactives) et
# pool_recycle les renouvelle régulièrement.
engine = create_async_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=DB_ECHO,
    pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
    max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
    pool_pre_ping=True,
    pool_recycle=int(os.getenv("DB_POOL_RECYCLE", "1800")),  # 30 min
)

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
