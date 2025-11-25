import os
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from exponent_server_sdk import (
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
    PushTicketError,
)

# Helper to send Expo push notifications using exponent_server_sdk in a thread
async def send_expo_push(db: AsyncSession, user_id: int, to_token: str, title: str, body: str, data: dict | None = None):
    """
    Envoie une notification push en utilisant la SDK Expo dans un thread séparé
    avec un timeout et des logs de débogage clairs.
    """
    
    # --- 1. Imports à l'intérieur pour éviter le blocage au démarrage ---
    # (Already imported at top level, but keeping structure if needed for specific reasons, 
    # though top level is better for standard python modules)
    
    def _publish():
        """La fonction synchrone (bloquante) qui s'exécutera dans un thread."""
        print(f"--- [PID {os.getpid()}] _publish: Création du client et du message...", flush=True)
        client = PushClient()
        message = PushMessage(to=to_token, title=title, body=body, data=data, sound="default", priority='high')
        print(f"------------------- [############# you sent this : {message} ############. ------------------------", flush=True)
        
        print(f"--- [PID {os.getpid()}] _publish: Envoi vers Expo (c'est l'étape lente)... ---", flush=True)
        
        # C'est l'appel réseau bloquant
        response = client.publish(message) 
        
        print(f"--- [PID {os.getpid()}] _publish: Réponse reçue d'Expo. ---", flush=True)
        return response
    
    
    # --- Début du bloc Try/Except principal ---
    try:
        print(f"--- send_expo_push: Préparation de l'envoi pour user {user_id}...", flush=True)
        
        # Création de la tâche à exécuter dans le thread
        tache_thread = asyncio.to_thread(_publish)
        
        # --- 2. On attend la tâche avec un TIMEOUT DE 30 SECONDES --- 
        response = await asyncio.wait_for(tache_thread, timeout=30.0)
        
        print(f"--- send_expo_push: Tâche terminée. Validation de la réponse...", flush=True) 

        # --- 3. Validation de la réponse (sans 'await') ---
        try:
            response.validate_response()
            print(f"--- send_expo_push: SUCCÈS. Notification envoyée. ---", flush=True)
            return True
            
        except DeviceNotRegisteredError:
            print(f"--- send_expo_push: ERREUR: DeviceNotRegisteredError. Le token {to_token} est invalide.", flush=True)
            # (Votre code pour effacer le token ira ici)
            return False
            
        except PushTicketError as exc:
            print(f"--- send_expo_push: ERREUR: PushTicketError: {exc.push_response}", flush=True)
            return False

    # --- 4. Gestion des erreurs, Y COMPRIS LE TIMEOUT ---
    except asyncio.TimeoutError:
        print(f"--- send_expo_push: ERREUR: TIMEOUT après 30 secondes. La requête a été annulée.", flush=True)
        return False
    
    except PushServerError as exc:
        print(f"--- send_expo_push: ERREUR: PushServerError: {exc.errors} {exc.response_data}", flush=True)
        return False
        
    except Exception as e:
        print(f"--- send_expo_push: ERREUR CRITIQUE INATTENDUE: {e}", flush=True)
        return False
