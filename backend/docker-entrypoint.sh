#!/bin/sh
# Entrypoint du conteneur backend.
# 1) Attend que la base soit prête et crée le schéma (idempotent).
# 2) Lance la commande passée (uvicorn).
set -e

echo "[entrypoint] Initialisation du schéma de base de données..."
n=0
until python create_db.py; do
  n=$((n + 1))
  if [ "$n" -ge 15 ]; then
    echo "[entrypoint] Échec de l'initialisation du schéma après 15 tentatives." >&2
    exit 1
  fi
  echo "[entrypoint] Base pas encore prête, nouvelle tentative dans 3s ($n/15)..."
  sleep 3
done

echo "[entrypoint] Schéma prêt. Démarrage de l'application : $*"
exec "$@"
