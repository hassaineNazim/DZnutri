# Sécurité — Procédure de rotation des secrets

> ⚠️ **À TRAITER EN PRIORITÉ AVANT TOUTE MISE EN PRODUCTION.**
>
> Des secrets réels ont été committés dans le dépôt git (fichiers `backend/.env`
> et `backend/doc_2025-10-15_19-57-38.env`). Ils doivent être considérés comme
> **compromis** : toute personne ayant eu accès au dépôt ou à son historique a pu
> les lire. Il faut les **faire tourner (rotation)** puis **purger l'historique**.

## 1. Secrets à faire tourner immédiatement

| Secret | Où | Action |
|--------|-----|--------|
| Mot de passe base Neon | `DATABASE_URL` | Réinitialiser le mot de passe du rôle dans la console Neon, puis mettre à jour `.env`. |
| Clés Cloudinary | `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Régénérer la paire de clés API dans le dashboard Cloudinary (Settings → Security → Access Keys). |
| Clé JWT | `JWT_SECRET_KEY` | Générer une nouvelle clé forte (commande ci-dessous). ⚠️ Tous les utilisateurs seront déconnectés (tokens invalidés) — comportement attendu. |
| Mot de passe Gmail | `MAIL_PASSWORD` | Révoquer le mot de passe d'application dans le compte Google (Sécurité → Mots de passe d'application) et en créer un nouveau. |

### Générer une clé JWT forte

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

Coller le résultat dans `JWT_SECRET_KEY` du fichier `.env`. En production, l'API
**refuse désormais de démarrer** si cette clé est absente ou laissée à la valeur
par défaut (voir `backend/auth/jwt.py`).

## 2. Purger l'historique git

Retirer le fichier du suivi (déjà fait) ne suffit pas : le contenu reste dans
l'historique. Pour le supprimer définitivement :

### Option A — git filter-repo (recommandé)

```bash
pip install git-filter-repo
git filter-repo --invert-paths \
  --path backend/.env \
  --path backend/doc_2025-10-15_19-57-38.env
```

### Option B — BFG Repo-Cleaner

```bash
bfg --delete-files "{.env,doc_2025-10-15_19-57-38.env}"
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

Puis forcer la mise à jour du dépôt distant (⚠️ réécrit l'historique, prévenir
l'équipe — tous les clones devront être refaits) :

```bash
git push --force --all
git push --force --tags
```

> ℹ️ Même après purge, considérez que les secrets ont fui : la rotation de
> l'étape 1 reste **obligatoire**.

## 3. Bonnes pratiques en place

- `.gitignore` et `backend/.dockerignore` excluent désormais tout `*.env`.
- `backend/.env.example` documente les variables sans valeurs sensibles.
- Le fichier `backend/doc_2025-10-15_19-57-38.env` local peut être supprimé
  (c'est un doublon de `.env`).
