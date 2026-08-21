"""Pages légales publiques de Remo Scan.

Ces pages décrivent les traitements réellement utilisés par l'application et
sont accessibles sans compte pour les fiches App Store / Google Play.
"""
from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["Legal"])

CONTACT_EMAIL = "Dznutriment@gmail.com"
APP_NAME = "Remo Scan"
LAST_UPDATED = "17 août 2026"

_STYLE = """
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         max-width: 780px; margin: 0 auto; padding: 32px 20px 80px; color: #1e1712;
         line-height: 1.65; background: #F4EAD6; }
  h1 { color: #59121F; font-size: 29px; line-height: 1.2; margin-bottom: 4px; }
  h2 { color: #59121F; font-size: 19px; margin-top: 32px; }
  .updated { color: #8b8073; font-size: 13px; margin-bottom: 32px; }
  .notice { background: #fffaf0; border-left: 4px solid #F2C22E; padding: 12px 15px; }
  a { color: #59121F; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th, td { text-align: left; vertical-align: top; padding: 8px 10px; border-bottom: 1px solid #e7ddc9; font-size: 14px; }
  th { color: #8b8073; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  ul { padding-left: 20px; }
  li { margin-bottom: 7px; }
  @media (max-width: 620px) { table, tbody, tr, th, td { display: block; } th { margin-top: 12px; } }
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

<p>{APP_NAME} est une application indépendante et à but non lucratif, développée par deux
étudiants en informatique. Elle aide les consommateurs algériens à comprendre les produits
alimentaires et cosmétiques. La présente politique explique les données traitées, leurs
finalités et les moyens d'exercer vos droits.</p>

<h2>1. Responsable du traitement et contact</h2>
<p>Le traitement est assuré par l'équipe {APP_NAME}. Pour toute question, demande relative
à vos données ou demande de suppression de compte :
<a href="mailto:{CONTACT_EMAIL}">contacter l'équipe Remo Scan</a>.</p>

<h2>2. Données traitées et finalités</h2>
<table>
<tr><th>Catégorie</th><th>Données</th><th>Finalité</th></tr>
<tr><td>Compte</td><td>Nom d'utilisateur, adresse email, mot de passe haché, ou identifiant transmis par Google/Facebook lorsque cette option est choisie</td><td>Créer, authentifier et sécuriser le compte</td></tr>
<tr><td>Profil santé facultatif</td><td>Taille, poids, date de naissance, genre, activité, allergies, conditions médicales, régime alimentaire et ingrédients évités</td><td>Personnaliser les alertes et informations nutritionnelles</td></tr>
<tr><td>Utilisation</td><td>Historique des scans, favoris, notes et commentaires sur les produits</td><td>Fournir les fonctions demandées et le bilan personnel</td></tr>
<tr><td>Contributions</td><td>Photos de produits, informations saisies et descriptions ou photos jointes à un signalement</td><td>Identifier les produits, effectuer l'OCR, enrichir la base et traiter les signalements</td></tr>
<tr><td>Notifications</td><td>Jeton technique de notification Expo</td><td>Envoyer les notifications liées au compte et aux contributions</td></tr>
</table>

<h2>3. Fondement et choix de l'utilisateur</h2>
<p>Le compte et les fonctions demandées sont traités pour fournir le service. Les informations
du profil santé sont sensibles, entièrement facultatives et renseignées volontairement. Vous
pouvez les modifier ou les retirer dans l'application. Lorsque le consentement est le fondement
du traitement, il peut être retiré à tout moment, sans remettre en cause les traitements déjà
effectués licitement.</p>

<h2>4. Prestataires et transferts</h2>
<ul>
<li><strong>Railway</strong> — hébergement de l'API et de la base de données ;</li>
<li><strong>Cloudinary</strong> — hébergement des photos soumises ;</li>
<li><strong>Google Cloud Vision</strong> — lecture OCR des étiquettes envoyées ;</li>
<li><strong>Google Sign-In, Sign in with Apple et Facebook Login</strong> — authentification uniquement si vous choisissez ces options ;</li>
<li><strong>Expo</strong> — acheminement des notifications push ;</li>
<li><strong>Gmail/SMTP</strong> — emails de réinitialisation du mot de passe ;</li>
<li><strong>Open Food Facts</strong> — consultation d'informations produit à partir d'un code-barres, sans transmission de votre profil santé.</li>
</ul>
<p>Certains prestataires peuvent traiter des données hors d'Algérie. Ces transferts doivent être
encadrés conformément à la loi algérienne applicable et, lorsque cela est requis, par votre
consentement exprès et/ou l'autorisation de l'Autorité nationale de protection des données à
caractère personnel (ANPDP).</p>

<h2>5. Conservation</h2>
<p>Les données du compte sont conservées pendant l'utilisation du service. Après une demande
de suppression, les données rattachées au compte sont supprimées ou anonymisées dans les
délais techniquement nécessaires, sous réserve des obligations légales et de sécurité. Les
contributions produit utiles à la base commune peuvent être conservées après anonymisation.
Les données ne doivent jamais être conservées au-delà de la durée nécessaire à leur finalité.</p>

<h2>6. Vos droits</h2>
<p>Conformément à la loi n° 18-07 du 10 juin 2018, modifiée et complétée notamment par la loi
n° 25-11 du 24 juillet 2025, vous pouvez demander l'information sur un traitement, l'accès à
vos données, leur rectification et, pour un motif légitime, vous opposer à un traitement. Vous
pouvez aussi demander la suppression de votre compte et le retrait des données facultatives.</p>
<p>Vous pouvez supprimer votre compte directement depuis <strong>Réglages → Compte → Supprimer mon compte</strong>,
ou écrire à <a href="mailto:{CONTACT_EMAIL}">l'équipe Remo Scan</a> depuis l'adresse associée au
compte. Vous pouvez également introduire une réclamation auprès
de l'ANPDP.</p>

<h2>7. Sécurité et incidents</h2>
<p>Les mots de passe sont hachés avec bcrypt et les communications de production utilisent
HTTPS. L'accès aux données est limité aux besoins du service. En cas de violation susceptible
de porter atteinte à la vie privée, les notifications requises seront adressées à l'ANPDP et aux
personnes concernées.</p>

<h2>8. Publicité et décisions automatisées</h2>
<p>Nous ne vendons aucune donnée personnelle, n'utilisons pas le profil santé à des fins
publicitaires et n'affichons pas de publicité ciblée. Les scores sont automatisés à partir des
données produit ; ils ne produisent aucun effet juridique et restent des informations d'aide à
la compréhension.</p>

<p class="notice"><strong>Important :</strong> {APP_NAME} ne remplace pas l'étiquette officielle
du produit ni l'avis d'un professionnel de santé.</p>
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

<p>En créant un compte ou en utilisant {APP_NAME}, vous acceptez les présentes conditions.</p>

<h2>1. Objet du service</h2>
<p>{APP_NAME} est un projet indépendant et à but non lucratif. Il permet de scanner des
produits alimentaires et cosmétiques pour afficher des informations nutritionnelles, des
analyses d'ingrédients et d'additifs, des alertes personnalisées et un historique. Les données
peuvent provenir de sources publiques, de calculs automatisés et de contributions d'utilisateurs.</p>

<h2>2. Information, pas conseil médical</h2>
<p><strong>{APP_NAME} ne fournit pas de diagnostic ni de conseil médical.</strong> Les scores,
alertes allergènes et alternatives sont indicatifs. Vérifiez toujours l'étiquette et les traces
d'allergènes sur l'emballage. En cas d'allergie, de maladie ou de doute, consultez un
professionnel de santé.</p>

<h2>3. Compte</h2>
<p>Vous devez fournir des informations exactes, préserver la confidentialité de vos identifiants
et nous signaler tout accès non autorisé. Vous êtes responsable de l'activité effectuée depuis
votre compte. L'utilisation par un mineur doit se faire avec l'accord et sous la responsabilité
de son représentant légal.</p>

<h2>4. Contributions</h2>
<p>Vous ne devez envoyer que des contenus exacts à votre connaissance, licites et que vous êtes
autorisé à partager. En soumettant une fiche, une photo, une note ou un signalement, vous nous
accordez l'autorisation non exclusive d'utiliser, corriger et présenter ce contenu pour exploiter
et améliorer le service. Les contributions peuvent être modérées, refusées ou supprimées.</p>

<h2>5. Usages interdits</h2>
<ul>
<li>contourner la sécurité, perturber le service ou automatiser des requêtes abusives ;</li>
<li>transmettre un contenu frauduleux, illicite, trompeur ou portant atteinte aux droits d'autrui ;</li>
<li>utiliser les informations affichées pour présenter {APP_NAME} comme un service médical ;</li>
<li>extraire ou republier massivement la base sans autorisation.</li>
</ul>

<h2>6. Exactitude et disponibilité</h2>
<p>Malgré nos vérifications, une information peut être incomplète, obsolète ou erronée, notamment
en raison d'une modification de recette, d'une contribution ou de l'OCR. Le service peut aussi
être interrompu pour maintenance ou pour une cause extérieure. Utilisez le signalement intégré
pour nous aider à corriger une fiche.</p>

<h2>7. Alternatives et classements</h2>
<p>Les alternatives sont proposées automatiquement à partir des produits disponibles et de leurs
scores. Elles ne constituent ni une publicité, ni une recommandation médicale, ni la garantie
qu'un produit convient à votre situation personnelle.</p>

<h2>8. Suspension et suppression</h2>
<p>Nous pouvons limiter ou suspendre un compte en cas de fraude, d'abus, d'atteinte à la sécurité
ou de violation répétée de ces conditions. Vous pouvez supprimer votre compte et ses données
privées depuis l'application ou suivre la <a href="/legal/account-deletion">procédure publique de suppression</a>.</p>

<h2>9. Responsabilité</h2>
<p>Dans les limites permises par la loi, {APP_NAME} est fourni « en l'état ». L'équipe ne peut
être tenue responsable d'une décision prise uniquement sur la base d'une information affichée
sans vérification de l'étiquette ou avis professionnel lorsque celui-ci est nécessaire.</p>

<h2>10. Évolution des conditions</h2>
<p>Ces conditions peuvent évoluer pour refléter le service ou le droit applicable. La date de
mise à jour figure en haut de la page. Une modification importante sera signalée par un moyen
approprié.</p>

<h2>11. Droit applicable et contact</h2>
<p>Ces conditions sont régies par le droit algérien. Pour toute question :
<a href="mailto:{CONTACT_EMAIL}">contacter l'équipe Remo Scan</a>.</p>
</body></html>"""


@router.get("/legal/account-deletion", response_class=HTMLResponse)
async def account_deletion():
    return f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Suppression de compte — {APP_NAME}</title>{_STYLE}</head><body>
<h1>Supprimer votre compte {APP_NAME}</h1>
<p class="updated">Dernière mise à jour : {LAST_UPDATED}</p>
<h2>Depuis l'application</h2>
<ol>
<li>Ouvrez <strong>Réglages</strong>, puis <strong>Compte</strong>.</li>
<li>Appuyez sur <strong>Supprimer mon compte</strong>.</li>
<li>Confirmez la suppression. La session est immédiatement fermée.</li>
</ol>
<h2>Si vous n'avez plus accès à l'application</h2>
<p>Envoyez un e-mail à <a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a> depuis l'adresse
associée au compte, avec l'objet « Suppression de mon compte Remo Scan ».</p>
<h2>Données supprimées</h2>
<p>Le compte, le profil santé, l'historique, les favoris, les notifications, les notes et les
jetons de session sont supprimés définitivement. Les fiches produit, photos, contributions et
signalements utiles à la base commune peuvent être conservés après suppression de tout lien avec
votre identité.</p>
<p class="notice">Cette action est irréversible.</p>
</body></html>"""


@router.get("/support", response_class=HTMLResponse)
async def support_page():
    return f"""<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Assistance — {APP_NAME}</title>{_STYLE}</head><body>
<h1>Assistance {APP_NAME}</h1>
<p>Pour un problème de compte, de scan ou une question sur vos données, écrivez à
<a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a>.</p>
<p>Pour corriger une information produit, utilisez en priorité le bouton de signalement dans
l'application et indiquez le code-barres concerné.</p>
<h2>Liens utiles</h2>
<ul><li><a href="/legal/privacy">Politique de confidentialité</a></li>
<li><a href="/legal/terms">Conditions d'utilisation</a></li>
<li><a href="/legal/account-deletion">Suppression de compte</a></li></ul>
</body></html>"""
