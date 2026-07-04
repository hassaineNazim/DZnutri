# Sécurité — Procédure de rotation des secrets

> ✅ **PURGE DE L'HISTORIQUE : EFFECTUÉE le 2026-07-04.**
> `git filter-repo` a supprimé `backend/.env` / `doc_*.env` de tout l'historique
> et remplacé les littéraux secrets (Neon, Cloudinary, Gmail) par `***REMOVED***`
> sur les 5 branches, puis force-push. Vérifié : 0 occurrence dans `git rev-list --all`.
>
> ⚠️ **LA ROTATION RESTE OBLIGATOIRE** (section 1) : les secrets ont été exposés
> publiquement avant la purge, et GitHub peut conserver quelque temps des objets
> orphelins (caches, forks éventuels). Considérez-les compromis tant qu'ils ne
> sont pas régénérés.
>
> ℹ️ Historique réécrit ⇒ tout autre clone local doit être **re-cloné**
> (`git clone`) — ne pas puller par-dessus un ancien clone.

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

## 2. Purger l'historique git — ✅ FAIT (2026-07-04)

Exécuté avec `git filter-repo` :
1. `--invert-paths --path backend/.env --path backend/doc_2025-10-15_19-57-38.env`
   (suppression des fichiers de secrets de tout l'historique) ;
2. `--replace-text` (mot de passe Neon, secret Cloudinary, mot de passe Gmail →
   `***REMOVED***`, y compris dans `alembic.ini` / anciens scripts) ;
3. `git push --force --all` + `--tags` sur les 5 branches.

Le fichier local `backend/.env` (non versionné) n'est pas affecté.

> ℹ️ Même après purge, considérez que les secrets ont fui : la rotation de
> l'étape 1 reste **obligatoire**.

## 3. Bonnes pratiques en place

- `.gitignore` et `backend/.dockerignore` excluent désormais tout `*.env`.
- `backend/.env.example` documente les variables sans valeurs sensibles.
- Le fichier `backend/doc_2025-10-15_19-57-38.env` local peut être supprimé
  (c'est un doublon de `.env`).
