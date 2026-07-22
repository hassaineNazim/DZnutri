"""Pages légales publiques (politique de confidentialité, CGU).

Servies en HTML directement par l'API (pas de service séparé à héberger) :
Google Play / App Store exigent un LIEN public vers ces documents lors de la
soumission, et l'app mobile y renvoie l'utilisateur via son navigateur.
"""
from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["Legal"])

CONTACT_EMAIL = "Dznutriment@gmail.com"
APP_NAME = "Remo Scan (DZnutri)"
LAST_UPDATED = "22 juillet 2026"

_STYLE = """
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         max-width: 760px; margin: 0 auto; padding: 32px 20px 80px; color: #1e1712;
         line-height: 1.6; background: #F4EAD6; }
  h1 { color: #59121F; font-size: 28px; margin-bottom: 4px; }
  h2 { color: #59121F; font-size: 19px; margin-top: 32px; }
  .updated { color: #8b8073; font-size: 13px; margin-bottom: 32px; }
  a { color: #59121F; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e7ddc9; font-size: 14px; }
  th { color: #8b8073; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  ul { padding-left: 20px; }
  li { margin-bottom: 6px; }
</style>
"""


@router.get("/legal/privacy", response_class=HTMLResponse)
async def privacy_policy():
    return f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Politique de confidentialité — {APP_NAME}</title>
{_STYLE}
</head><body>
<h1>Politique de confidentialité</h1>
<p class="updated">Dernière mise à jour : {LAST_UPDATED}</p>

<p>{APP_NAME} (« l'application », « nous ») aide ses utilisateurs à analyser des produits
alimentaires et cosmétiques par scan de code-barres. Cette page explique quelles données
nous collectons, pourquoi, et comment les utilisateurs peuvent les contrôler.</p>

<h2>1. Données que nous collectons</h2>
<table>
<tr><th>Catégorie</th><th>Détail</th><th>Finalité</th></tr>
<tr><td>Compte</td><td>Nom d'utilisateur, email, mot de passe (chiffré) — ou identifiant fourni par Google/Facebook si vous utilisez ces connexions</td><td>Créer et sécuriser votre compte</td></tr>
<tr><td>Profil santé (optionnel)</td><td>Taille, poids, date de naissance, genre, niveau d'activité, allergies, conditions médicales, régime alimentaire, ingrédients évités</td><td>Personnaliser les alertes et recommandations nutritionnelles</td></tr>
<tr><td>Usage de l'app</td><td>Historique des codes-barres scannés, produits favoris, notes laissées sur des produits</td><td>Afficher votre historique et votre bilan personnel</td></tr>
<tr><td>Contenus soumis</td><td>Photos de produits et descriptions envoyées lors d'un ajout de produit ou d'un signalement</td><td>Enrichir la base de données et traiter vos signalements</td></tr>
<tr><td>Notifications</td><td>Jeton de notification push (Expo)</td><td>Vous envoyer des notifications liées à votre activité</td></tr>
</table>

<h2>2. Services tiers utilisés</h2>
<ul>
<li><strong>Google Sign-In / Facebook Login</strong> — authentification, si vous choisissez ces méthodes de connexion.</li>
<li><strong>Cloudinary</strong> — hébergement des photos de produits que vous soumettez.</li>
<li><strong>Google Cloud Vision</strong> — lecture automatique (OCR) des informations nutritionnelles sur les photos, lorsque cette fonctionnalité est active.</li>
<li><strong>OpenFoodFacts</strong> — base de données publique consultée pour compléter les informations produit (aucune donnée personnelle n'y est transmise).</li>
<li><strong>Gmail (SMTP)</strong> — envoi des emails de réinitialisation de mot de passe.</li>
</ul>
<p>Le suivi publicitaire entre applications (App Tracking Transparency / IDFA) et la collecte
d'événements par le SDK Facebook sont <strong>désactivés</strong> dans l'application.</p>

<h2>3. Ce que nous ne faisons pas</h2>
<ul>
<li>Nous ne vendons aucune donnée personnelle à des tiers.</li>
<li>Nous n'utilisons pas vos données de profil santé à des fins publicitaires.</li>
</ul>

<h2>4. Conservation et suppression</h2>
<p>Vos données sont conservées tant que votre compte existe. Vous pouvez demander la
suppression de votre compte et de l'ensemble de vos données à tout moment en écrivant à
<a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a>.</p>

<h2>5. Sécurité</h2>
<p>Les mots de passe sont stockés sous forme chiffrée (bcrypt). Les communications entre
l'application et nos serveurs sont chiffrées (HTTPS). L'accès aux données est limité au
strict nécessaire pour faire fonctionner le service.</p>

<h2>6. Vos droits</h2>
<p>Vous pouvez à tout moment demander l'accès, la correction ou la suppression de vos
données personnelles en nous contactant à <a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a>.</p>

<h2>7. Contact</h2>
<p>Pour toute question relative à cette politique : <a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a></p>
</body></html>"""


@router.get("/legal/terms", response_class=HTMLResponse)
async def terms_of_service():
    return f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Conditions d'utilisation — {APP_NAME}</title>
{_STYLE}
</head><body>
<h1>Conditions d'utilisation</h1>
<p class="updated">Dernière mise à jour : {LAST_UPDATED}</p>

<p>En utilisant {APP_NAME}, vous acceptez les conditions suivantes.</p>

<h2>1. Description du service</h2>
<p>{APP_NAME} permet de scanner des codes-barres de produits alimentaires et cosmétiques
pour obtenir une évaluation nutritionnelle, une analyse des additifs, et un historique de
consommation. Les informations affichées proviennent de bases de données publiques
(OpenFoodFacts) et de contributions d'utilisateurs ; elles sont fournies à titre informatif.</p>

<h2>2. Avertissement santé</h2>
<p><strong>{APP_NAME} ne fournit pas de conseil médical.</strong> Les scores, alertes
allergènes et recommandations affichés sont des outils d'aide à la décision et ne
remplacent pas l'avis d'un professionnel de santé. En cas de doute sur un produit ou une
allergie, consultez l'emballage officiel et/ou un professionnel de santé.</p>

<h2>3. Compte utilisateur</h2>
<p>Vous êtes responsable de la confidentialité de vos identifiants. Vous devez fournir des
informations exactes lors de la création de votre compte.</p>

<h2>4. Contenu soumis par les utilisateurs</h2>
<p>En soumettant un produit, une photo ou un signalement, vous garantissez que ce contenu
est exact à votre connaissance et vous nous autorisez à l'utiliser pour améliorer la base
de données de l'application. Nous nous réservons le droit de modérer ou supprimer tout
contenu inexact, inapproprié ou frauduleux.</p>

<h2>5. Exactitude des informations</h2>
<p>Malgré nos efforts, les informations nutritionnelles et les scores peuvent contenir des
erreurs ou être incomplètes (base communautaire, OCR automatique). Signalez toute erreur
via la fonction de signalement intégrée à l'application.</p>

<h2>6. Limitation de responsabilité</h2>
<p>L'application est fournie « en l'état ». Nous ne pourrons être tenus responsables des
dommages résultant d'une utilisation du service ou d'une décision prise sur la base des
informations affichées.</p>

<h2>7. Modification des conditions</h2>
<p>Ces conditions peuvent être mises à jour ; la date de dernière mise à jour est indiquée
en haut de cette page. L'utilisation continue de l'application après une modification vaut
acceptation des nouvelles conditions.</p>

<h2>8. Contact</h2>
<p>Pour toute question : <a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a></p>
</body></html>"""
