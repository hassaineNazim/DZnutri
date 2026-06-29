import asyncio
import logging
import secrets
import string

from exponent_server_sdk import (
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
    PushTicketError,
)

logger = logging.getLogger("dznutri.push")

def generate_reset_code(length=6):
    """Génère un code numérique cryptographiquement sûr (module secrets)."""
    return ''.join(secrets.choice(string.digits) for _ in range(length))


# Helper to send Expo push notifications using exponent_server_sdk in a thread
async def send_expo_push(user_id: int, to_token: str, title: str, body: str, data: dict | None = None):
    """
    Envoie une notification push en utilisant la SDK Expo dans un thread séparé
    avec un timeout et des logs de débogage clairs.
    """
    
    # --- 1. Imports à l'intérieur pour éviter le blocage au démarrage ---
    # (Already imported at top level, but keeping structure if needed for specific reasons, 
    # though top level is better for standard python modules)
    
    def _publish():
        """La fonction synchrone (bloquante) qui s'exécutera dans un thread."""
        client = PushClient()
        message = PushMessage(
            to=to_token, title=title, body=body, data=data, sound="default", priority="high"
        )
        return client.publish(message)  # appel réseau bloquant

    try:
        logger.info("Envoi d'une notification push à l'utilisateur %s", user_id)

        # Exécution dans un thread avec un timeout strict de 30 s pour ne jamais
        # bloquer l'event loop si Expo ne répond pas.
        response = await asyncio.wait_for(asyncio.to_thread(_publish), timeout=30.0)

        try:
            response.validate_response()
            logger.info("Notification push envoyée à l'utilisateur %s", user_id)
            return True

        except DeviceNotRegisteredError:
            logger.warning("Token push invalide (utilisateur %s) : appareil non enregistré", user_id)
            # TODO: effacer userPushToken en base pour cet utilisateur.
            return False

        except PushTicketError as exc:
            logger.warning("Échec ticket push (utilisateur %s) : %s", user_id, exc.push_response)
            return False

    except asyncio.TimeoutError:
        logger.error("Timeout (30s) lors de l'envoi push à l'utilisateur %s", user_id)
        return False

    except PushServerError as exc:
        logger.error("Erreur serveur Expo (utilisateur %s) : %s", user_id, exc.errors)
        return False

    except Exception:
        logger.exception("Erreur inattendue lors de l'envoi push à l'utilisateur %s", user_id)
        return False

def calculate_daily_goals(weight: float, height: float, age: int, gender: str, activity_level: str):
    """
    Calculate daily calories (TDEE) and protein needs using Mifflin-St Jeor Equation.
    """
    if not all([weight, height, age, gender, activity_level]):
        return None, None

    # 1. BMR Calculation
    bmr = (10 * weight) + (6.25 * height) - (5 * age)
    if gender.lower() == 'male':
        bmr += 5
    else:
        bmr -= 161

    # 2. Activity Multiplier
    multipliers = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very_active': 1.9
    }
    multiplier = multipliers.get(activity_level.lower(), 1.2)
    tdee = int(bmr * multiplier)

    # 3. Protein Calculation (g/kg body weight)
    protein_multipliers = {
        'sedentary': 1.0,
        'light': 1.2,
        'moderate': 1.4,
        'active': 1.6,
        'very_active': 1.8
    }
    protein_mult = protein_multipliers.get(activity_level.lower(), 1.0)
    daily_protein = int(weight * protein_mult)

    return tdee, daily_protein
