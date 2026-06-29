# DZnutri — Optimisations & Propositions

> Session d'optimisation backend/frontend. Objectif : rendre l'API fluide et
> capable de supporter un grand nombre d'utilisateurs.

---

## 1. Ce qui a été optimisé (et vérifié)

### Backend (priorité)

| # | Optimisation | Fichier | Impact |
|---|--------------|---------|--------|
| 1 | **Cache résilient Redis → mémoire** : si Redis est injoignable (dev local sans Docker), l'API bascule automatiquement sur un cache en mémoire au lieu de planter. Défaut `REDIS_URL` corrigé (`localhost` au lieu du hostname Docker `redis`). | `main.py` | **Bloquant levé** : l'API ne démarrait plus (dépendance `fastapi_cache` non installée + Redis injoignable). |
| 2 | **Compression GZip** des réponses JSON | `main.py` | Mesuré : recherche **28 211 → 6 681 octets (−76 %)**. Moins de bande passante, chargement mobile plus rapide. |
| 3 | **Index DB composites** sur les requêtes fréquentes | `models.py` + `script/add_indexes.py` (exécuté sur Neon) | Requêtes historique / favoris / notifications / recherche par catégorie qui restent rapides quand les tables grossissent. |
| 4 | **Logging structuré** à la place de `print()` (≈ 30 `print` retirés des chemins chauds) | tous les routers/CRUD | `print()` = I/O bloquante synchrone, coûteuse sous charge. Niveau pilotable via `LOG_LEVEL`. |
| 5 | **Invalidation de cache produit** après écriture admin (approve / update) | `routers/admin.py` | Les utilisateurs voient les données à jour immédiatement (sinon 24 h de cache périmé). |
| 6 | **Route notifications sans redirection 307** | `routers/notifications.py` | Le front poll `/api/notifications` (sans `/`) → avant : redirection 307 à **chaque** sondage (15 s/utilisateur). Supprimé. |
| 7 | **Cache 1 h sur `/api/categories`** | `routers/search.py` | Donnée quasi statique, appelée à l'ouverture de la recherche. |
| 8 | **`requirements.txt` régénéré** (était en UTF-16, désynchronisé du venv) + ajout `fastapi-cache2`, `redis`, `alembic`, `psycopg2-binary`. | `requirements.txt` | Reproductibilité du déploiement. |

> Déjà en place avant la session (conservé) : pool de connexions SQLAlchemy
> (`database.py`), client HTTP partagé pour Open Food Facts, cache mémoire de la
> table des additifs (TTL 5 min).

### Frontend (utilisateur + admin)

- **0 erreur TypeScript** (9 corrigées : `Dropdown.tsx`, `ScoreGauge.tsx`, `useAllergenCheck.ts`).
- **ESLint** : 0 erreur. **Admin** : `Compiled successfully`.
- Polling notifications déjà optimisé (15 s, seulement app active, `unread_only=true`).

### Vérifications exécutées

- Backend démarré (uvicorn) → fallback cache mémoire OK, aucun crash.
- **Smoke test end-to-end 12/12** (`backend/test/test_workflow_smoke.py`) :
  register → /auth/me → produit → historique (add/list/stats) → favoris
  (add/check/list/remove) → notifications → 401 sans token. Utilisateur de test
  supprimé automatiquement après le test.

---

## 2. Lancement (rappel + nouveautés)

```bash
# Backend
cd backend
.venv\Scripts\activate
python script\add_indexes.py          # une fois, crée les index (idempotent)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Frontend utilisateur
npx expo start

# Admin
cd admin-frontend && npm start
```

Variables d'env utiles (backend `.env`) : `REDIS_URL`, `LOG_LEVEL` (INFO par
défaut), `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `SQL_ECHO`.

---

## 3. Pour passer réellement à l'échelle (production)

1. **Plusieurs workers Uvicorn/Gunicorn** : `gunicorn -k uvicorn.workers.UvicornWorker -w 4 main:app`.
   ⚠️ Avec plusieurs workers, le cache **mémoire** n'est plus partagé → **activer Redis** (sinon chaque worker a son propre cache).
2. **Redis géré** (Upstash, Redis Cloud) en prod ; définir `REDIS_URL`.
3. **Rate limiting** (ex. `slowapi`) pour protéger `/api/product` et l'auth.
4. **CORS** : passer `ENVIRONMENT=production` et lister les domaines réels.
5. **Neon** : surveiller le pool ; augmenter `DB_POOL_SIZE` selon le nombre de workers.
6. **Monitoring** : Sentry (erreurs) + endpoint `/health` déjà prêt pour un load balancer.

---

## 4. Propositions de fonctionnalités

### 🥇 Fort impact / effort raisonnable
- **Comparateur de produits** : scanner/choisir 2-3 produits et comparer scores, additifs, nutriments côte à côte.
- **Alternatives plus saines déjà dans l'API** (`/alternatives`) → la mettre en avant systématiquement sur la fiche produit (« Mieux pour vous »).
- **Alerte allergènes personnalisée** : `useAllergenCheck` existe déjà → bannière rouge bloquante si un allergène du profil est détecté.
- **Mode hors-ligne** : cache local des derniers produits scannés (React Query persiste déjà) → consultation sans réseau.
- **Score adapté au profil santé** : pondérer le score selon objectifs (diabète → poids du sucre, hypertension → sel).

### 🥈 Engagement / rétention
- **Gamification** : badges (« 10 produits sains », « 1 semaine sans NOVA 4 »), score hebdo moyen.
- **Tableau de bord nutritionnel** : tendances dans le temps (déjà des stats → ajouter graphes d'évolution).
- **Listes / collections** : « À acheter », « Mes produits sains », partageables.
- **Notifications intelligentes** : « Un meilleur produit existe pour X que tu scannes souvent ».

### 🥉 Spécifique contexte algérien
- **Base de produits locaux** : prioriser/enrichir les produits algériens (OFF est pauvre dessus) → la soumission utilisateur + OCR existe déjà, ajouter un **classement des contributeurs**.
- **Équivalences halal / labels locaux**.
- **Recherche par magasin / disponibilité locale**.

### ⚙️ Technique / qualité
- **Endpoint `pending-additives`** (admin) : le front admin l'appelle déjà mais il **n'existe pas encore** côté backend (validation des additifs inconnus collectés automatiquement).
- **Recherche full-text Postgres** (`tsvector`) au lieu de `ILIKE %q%` quand le catalogue grossit.
- **Tests automatisés** : étendre `backend/tests/` (pytest) à partir du smoke test fourni.
