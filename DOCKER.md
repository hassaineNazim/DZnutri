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
| backend  | 127.0.0.1:8000 | API FastAPI (2 workers Uvicorn) |
| admin    | 127.0.0.1:3000 | Interface admin (nginx + reverse-proxy API) |
| db       | 127.0.0.1:5433 | PostgreSQL 16 (volume `postgres_data`) |
| redis    | —         | Cache (interne, volume `redis_data`) |
| caddy    | 80 / 443  | Reverse proxy TLS public (profil `proxy`, voir §5) |

- API : http://localhost:8000/health
- Admin : http://localhost:3000

> Par défaut, backend/admin/db ne sont liés qu'à `127.0.0.1` : rien n'est
> exposé publiquement tant que le profil `proxy` (HTTPS) n'est pas lancé.
> Pour des tests sur le réseau local : `BACKEND_HOST_BIND=0.0.0.0` dans `.env`.

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

`DATABASE_URL` pointe désormais vers le Postgres Docker : on passe donc l'URL Neon
**explicitement** comme source (elle est conservée commentée sous `NEON_SOURCE_URL`
dans `.env`). À lancer DANS le conteneur (réseau fiable vers `db`, internet vers Neon) :

```bash
docker compose exec -T \
  -e SOURCE_DATABASE_URL="postgresql+asyncpg://<NEON_USER>:<NEON_PASSWORD>@<NEON_HOST>/<NEON_DB>" \
  -e TARGET_DATABASE_URL="postgresql+asyncpg://dznutri:<POSTGRES_PASSWORD>@db:5432/dznutri" \
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

## 5. Mise en ligne HTTPS (reverse proxy Caddy)

L'app mobile **exige une URL HTTPS** en production. Le service `caddy`
(profil `proxy` du compose) fournit le TLS automatiquement (Let's Encrypt).

1. Acheter/configurer un domaine et créer deux entrées DNS **A** pointant vers
   l'IP publique du serveur : `api.<domaine>` et `admin.<domaine>`.
2. Ouvrir les ports **80 et 443** sur le serveur (firewall / groupe de sécurité).
3. Dans `backend/.env` :
   ```
   API_DOMAIN=api.<domaine>
   ADMIN_DOMAIN=admin.<domaine>
   ENVIRONMENT=production
   ALLOWED_ORIGINS=https://admin.<domaine>
   ```
4. Lancer la stack avec le proxy :
   ```bash
   docker compose --profile proxy up -d --build
   ```
5. Vérifier : `https://api.<domaine>/health` et `https://admin.<domaine>`.
6. Côté mobile : renseigner l'URL dans `app.json` (`expo.extra.apiUrl`) **ou**
   via la variable EAS `EXPO_PUBLIC_API_URL=https://api.<domaine>`, puis builder
   (`eas build --profile production`).

Les certificats sont stockés dans le volume `caddy_data` (ne pas le supprimer,
sous peine de re-demander des certificats à chaque redéploiement — Let's
Encrypt applique des quotas).

## 6. Notes production
- **Changer `POSTGRES_PASSWORD`** et `JWT_SECRET_KEY` (clé forte obligatoire :
  l'API refuse de démarrer en production avec une clé faible/par défaut).
- Mettre `ENVIRONMENT=production` puis définir **`ALLOWED_ORIGINS`** (origines
  CORS autorisées, séparées par des virgules — ex. `https://admin.dznutri.com`).
- Ajuster le nombre de workers (`--workers` dans le `Dockerfile`) selon les CPU.
- En multi-workers, définir `RATELIMIT_STORAGE_URI=redis://redis:6379` pour que
  le rate limiting soit partagé entre les process.
- **Index de performance** : après le premier remplissage, lancer
  `python script/add_indexes.py` (extension `pg_trgm` + index **trigram** pour la
  recherche texte `ILIKE` + index de tri par score, créés en `CONCURRENTLY`).
  Sur une base déjà remplie en type `json`, lancer aussi une fois
  `python script/migrate_json_to_jsonb.py` (conversion JSONB). Puis `ANALYZE produits;`.
- Sauvegardes Postgres : `docker compose exec db pg_dump -U dznutri dznutri > backup.sql`.
- OCR (Google Vision) : placer la clé de compte de service à
  `backend/dznutri-632fbb70c039.json` (ou `VISION_KEY_FILE`), puis **décommenter**
  le montage du volume + `GOOGLE_APPLICATION_CREDENTIALS` dans `docker-compose.yml`.
  Sans clé, l'OCR est inactif et l'application démarre normalement.
- Le cache Redis est partagé entre les workers (indispensable en multi-workers).
