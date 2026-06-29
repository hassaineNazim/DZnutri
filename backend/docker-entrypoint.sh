#!/bin/sh
# Entrypoint du conteneur backend.
# 1) Attend que la base soit prête puis met le schéma à jour.
# 2) Lance la commande passée (uvicorn).
#
# MIGRATION_MODE pilote la mise à jour du schéma :
#   - "create_all" (défaut) : create_db.py — création idempotente des tables +
#     patches de colonnes. Sûr sur une base neuve comme existante.
#   - "alembic" : applique les migrations versionnées (alembic upgrade head).
#     À utiliser une fois le projet passé à un workflow Alembic (voir DOCKER.md).
set -e

MIGRATION_MODE="${MIGRATION_MODE:-create_all}"

if [ "$MIGRATION_MODE" = "alembic" ]; then
  schema_cmd="alembic upgrade head"
else
  schema_cmd="python create_db.py"
fi

echo "[entrypoint] Mise à jour du schéma (mode=$MIGRATION_MODE)..."
n=0
until $schema_cmd; do
  n=$((n + 1))
  if [ "$n" -ge 15 ]; then
    echo "[entrypoint] Échec de la mise à jour du schéma après 15 tentatives." >&2
    exit 1
  fi
  echo "[entrypoint] Base pas encore prête, nouvelle tentative dans 3s ($n/15)..."
  sleep 3
done

echo "[entrypoint] Schéma prêt. Démarrage de l'application : $*"
exec "$@"
