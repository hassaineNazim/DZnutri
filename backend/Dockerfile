# ---- Image backend DZnutri (production) ----
FROM python:3.11-slim

# Logs non bufferisés + pas de .pyc : meilleur comportement en conteneur.
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# curl : utilisé par le HEALTHCHECK. (psycopg2-binary embarque libpq, pas besoin de libpq-dev.)
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# 1) Dépendances (couche cachée tant que requirements.txt ne change pas)
COPY requirements.txt .
RUN pip install -r requirements.txt

# 2) Code applicatif
COPY . .

# Entrypoint exécutable + dossier uploads possédé par l'utilisateur non-root.
# (Un volume nommé monté sur /app/uploads héritera de ces permissions.)
RUN chmod +x docker-entrypoint.sh \
    && mkdir -p /app/uploads \
    && useradd -m appuser \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# Vérifie que l'API répond ; Docker/Compose marque le conteneur "healthy".
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
# 2 workers Uvicorn par défaut (ajuster selon les CPU). Le cache partagé est Redis.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
