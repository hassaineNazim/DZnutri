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

# --- Clé de service Google Vision (OCR) -------------------------------------
# Sur une plateforme managée (Railway, Render...), on ne peut pas monter de
# fichier : la clé arrive par variable d'environnement. On la matérialise ici en
# fichier car bdproduitdz/ocr.py lit un CHEMIN (GOOGLE_APPLICATION_CREDENTIALS).
#   - GOOGLE_CREDENTIALS_JSON      : le JSON collé tel quel
#   - GOOGLE_CREDENTIALS_JSON_B64  : le même, encodé en base64 (repli si
#     l'interface de la plateforme abîme les retours à la ligne)
# En Docker Compose la clé est montée en volume : ces variables sont vides et ce
# bloc ne fait rien. BEST-EFFORT : un échec ici ne bloque jamais le démarrage,
# l'application tourne sans OCR.
VISION_KEY_TARGET="${VISION_KEY_TARGET:-/tmp/google-vision-key.json}"
if [ -n "${GOOGLE_CREDENTIALS_JSON_B64:-}${GOOGLE_CREDENTIALS_JSON:-}" ]; then
  vision_ok=0
  # Écriture DANS un `if` : sous `set -e`, une commande qui échoue en position
  # de condition n'interrompt pas le script (c'est exactement ce qu'on veut ici).
  if [ -n "${GOOGLE_CREDENTIALS_JSON_B64:-}" ]; then
    if printf '%s' "$GOOGLE_CREDENTIALS_JSON_B64" | base64 -d > "$VISION_KEY_TARGET"; then vision_ok=1; fi
  else
    if printf '%s' "$GOOGLE_CREDENTIALS_JSON" > "$VISION_KEY_TARGET"; then vision_ok=1; fi
  fi
  # Un JSON tronqué ferait échouer le client Vision au premier appel, pas au
  # démarrage : on vérifie donc tout de suite qu'il est lisible et complet.
  if [ "$vision_ok" = "1" ] && python -c "import json,sys; json.load(open(sys.argv[1]))['private_key']" "$VISION_KEY_TARGET" 2>/dev/null; then
    chmod 600 "$VISION_KEY_TARGET"
    export GOOGLE_APPLICATION_CREDENTIALS="$VISION_KEY_TARGET"
    echo "[entrypoint] Clé Google Vision installée depuis l'environnement ($VISION_KEY_TARGET)."
  else
    rm -f "$VISION_KEY_TARGET"
    echo "[entrypoint] Avertissement : GOOGLE_CREDENTIALS_JSON invalide -> OCR désactivé." >&2
  fi
fi

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

echo "[entrypoint] Schéma prêt."

# Index de performance (trigram GIN pour la recherche ILIKE '%...%', tris par
# score, historique...). Idempotent (CREATE ... IF NOT EXISTS) et BEST-EFFORT :
# un échec ici ne doit PAS empêcher l'app de démarrer — elle fonctionne sans,
# juste avec une recherche plus lente. (CONCURRENTLY = pas de verrou bloquant.)
echo "[entrypoint] Création/vérification des index de performance..."
if python script/add_indexes.py; then
  echo "[entrypoint] Index de performance OK."
else
  echo "[entrypoint] Avertissement : création des index échouée (démarrage quand même)." >&2
fi

echo "[entrypoint] Démarrage de l'application : $*"
exec "$@"
