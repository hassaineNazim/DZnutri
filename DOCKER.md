# DZnutri — Déploiement Docker (mise en production)

Stack conteneurisée : **API FastAPI + PostgreSQL + Redis + Admin (nginx)**.
Remplace la base Neon par un PostgreSQL auto-hébergé.

> Tous les fichiers Docker sont dans `backend/`. Lancer les commandes depuis `backend/`.

## 1. Pré-requis
- Docker Desktop / Docker Engine + Compose v2
- Un fichier `backend/.env` (voir `backend/.env.example`) avec **au minimum** :
  - les secrets applicatifs (`CLOUDINARY_*`, `JWT_SECRET_KEY`, `MAIL_*`)
  - `POSTGRES_PASSWORD` (mot de passe de la base locale)

> `DATABASE_URL`, `REDIS_URL`, `DB_SSL` n'ont pas besoin d'être réglés pour Docker :
> le `docker-compose.yml` les fournit (ils pointent vers les services `db` et `redis`).

## 2. Lancer la stack
```bash
cd backend
docker compose up -d --build
```
Services et ports :
| Service  | Port hôte | Rôle |
|----------|-----------|------|
| backend  | 8000      | API FastAPI (2 workers Uvicorn) |
| admin    | 3000      | Interface admin (nginx + reverse-proxy API) |
| db       | 5432      | PostgreSQL 16 (volume `postgres_data`) |
| redis    | —         | Cache (interne, volume `redis_data`) |

- API : http://localhost:8000/health
- Admin : http://localhost:3000

Au démarrage, le backend **met à jour le schéma** (création idempotente des
tables + index + patches de colonnes), sur une base vide comme existante.

### Stratégie de migration
- Par défaut (`MIGRATION_MODE=create_all`), `create_db.py` synchronise le schéma
  de façon idempotente : il crée les tables manquantes et applique les ajouts de
  colonnes (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`). Sûr et sans état.
- Pour les évolutions de schéma complexes (renommages, contraintes, suppressions),
  passer à Alembic : `MIGRATION_MODE=alembic` fait `alembic upgrade head` au
  démarrage. Alembic lit `DATABASE_URL` automatiquement. Sur une base déjà créée
  par `create_all`, faire d'abord un `alembic stamp head` (une fois) pour aligner
  l'historique avant le premier `upgrade`.

## 3. Migrer les données depuis Neon (une fois)
La base Docker démarre vide. Pour y copier les données existantes de Neon :

```bash
# Récupère l'URL Neon depuis .env (gère les guillemets) et lance la migration
# DANS le conteneur (réseau Docker fiable vers db, internet vers Neon).
NEON_URL=$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d "\"'" | tr -d "\r")

docker compose exec -T \
  -e SOURCE_DATABASE_URL="$NEON_URL" \
  -e TARGET_DATABASE_URL="postgresql+asyncpg://dznutri:${POSTGRES_PASSWORD:-dznutri_dev_secret}@db:5432/dznutri" \
  backend python script/migrate_neon_to_local.py
```
Le script copie schéma + données et réinitialise les séquences. Ré-exécutable
(il vide d'abord les tables cibles). Refuse d'écrire si la cible est Neon.

> ⚠️ Sous Windows, lancer la migration **depuis le conteneur** (comme ci-dessus) :
> l'accès hôte → `localhost:5432` peut être instable (proxy Docker Desktop).

## 4. Commandes utiles
```bash
docker compose ps                 # état des services
docker compose logs -f backend    # logs API
docker compose down               # arrêter (garde les données)
docker compose down -v            # arrêter + SUPPRIMER les volumes (données !)
docker compose exec db psql -U dznutri -d dznutri   # console SQL
```

## 5. Notes production
- **Changer `POSTGRES_PASSWORD`** et `JWT_SECRET_KEY` (clé forte obligatoire :
  l'API refuse de démarrer en production avec une clé faible/par défaut).
- Mettre `ENVIRONMENT=production` puis définir **`ALLOWED_ORIGINS`** (origines
  CORS autorisées, séparées par des virgules — ex. `https://admin.dznutri.com`).
- Ajuster le nombre de workers (`--workers` dans le `Dockerfile`) selon les CPU.
- En multi-workers, définir `RATELIMIT_STORAGE_URI=redis://redis:6379` pour que
  le rate limiting soit partagé entre les process.
- Sauvegardes Postgres : `docker compose exec db pg_dump -U dznutri dznutri > backup.sql`.
- OCR (Google Vision) : placer la clé de compte de service au chemin `VISION_KEY_FILE`
  (défaut `backend/dznutri-632fbb70c039.json`) ; elle est montée automatiquement
  en lecture seule dans le conteneur (`GOOGLE_APPLICATION_CREDENTIALS`).
- Le cache Redis est partagé entre les workers (indispensable en multi-workers).
