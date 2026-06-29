"""Pipeline OCR (Google Vision) durci pour la production.

Objectifs de robustesse :
- Client Vision instancié une seule fois (singleton paresseux, thread-safe) :
  l'ancienne version recréait un client à chaque appel, coûteux en CPU/mémoire.
- Timeout réseau borné + retries avec back-off : un appel lent ne bloque pas
  indéfiniment le thread du pool d'exécuteurs.
- Aucune exception ne remonte : la fonction renvoie toujours une chaîne. En cas
  d'échec, un message ``Erreur OCR : ...`` exploitable côté admin.
- Chaque appel alimente les métriques (taux de succès OCR du dashboard).

La fonction reste **synchrone** : elle est appelée via ``run_in_executor`` dans
le routeur des soumissions, donc hors du thread principal de l'event loop.
"""

from __future__ import annotations

import logging
import os
import threading
import time

from google.api_core import exceptions as gax_exceptions
from google.cloud import vision

try:
    # Import "best effort" : si l'observabilité n'est pas disponible (tests
    # isolés), l'OCR continue de fonctionner sans métriques.
    from observability import metrics
except Exception:  # noqa: BLE001
    metrics = None

logger = logging.getLogger("dznutri.ocr")

# Chemin de la clé de service : configurable, avec valeur par défaut historique.
KEY_FILENAME = os.getenv("VISION_KEY_FILENAME", "dznutri-632fbb70c039.json")
KEY_PATH = os.getenv(
    "GOOGLE_APPLICATION_CREDENTIALS",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), KEY_FILENAME),
)

OCR_TIMEOUT = float(os.getenv("OCR_TIMEOUT_SECONDS", "15"))
OCR_MAX_RETRIES = int(os.getenv("OCR_MAX_RETRIES", "2"))

_client: vision.ImageAnnotatorClient | None = None
_client_lock = threading.Lock()


def _get_client() -> vision.ImageAnnotatorClient:
    """Retourne le client Vision partagé (instancié à la première demande)."""
    global _client
    if _client is None:
        with _client_lock:
            if _client is None:
                _client = vision.ImageAnnotatorClient.from_service_account_json(KEY_PATH)
                logger.info("Client Google Vision initialisé.")
    return _client


def detect_text_from_url(image_url: str) -> str:
    """Extrait le texte d'une image distante via Google Vision.

    Renvoie le texte détecté (chaîne vide si l'image ne contient pas de texte),
    ou un message ``Erreur OCR : ...`` en cas d'échec définitif. Ne lève jamais.
    """
    if not image_url:
        return ""

    if not os.path.exists(KEY_PATH):
        msg = f"Clé de service Vision introuvable ({KEY_PATH})."
        logger.error(msg)
        if metrics:
            metrics.record_ocr(success=False)
        return f"Erreur OCR : {msg}"

    image = vision.Image()
    image.source.image_uri = image_url

    last_error: Exception | None = None
    start = time.perf_counter()

    for attempt in range(1, OCR_MAX_RETRIES + 1):
        try:
            client = _get_client()
            response = client.text_detection(image=image, timeout=OCR_TIMEOUT)

            if response.error.message:
                # Erreur applicative renvoyée par l'API (image illisible, etc.).
                raise RuntimeError(response.error.message)

            text = (
                response.text_annotations[0].description
                if response.text_annotations
                else ""
            )
            duration_ms = (time.perf_counter() - start) * 1000
            logger.info(
                "OCR réussi (%.0f ms, tentative %d, %d caractères)",
                duration_ms,
                attempt,
                len(text),
            )
            if metrics:
                metrics.record_ocr(success=True, duration_ms=duration_ms)
            return text

        except (gax_exceptions.GoogleAPICallError, gax_exceptions.RetryError) as exc:
            # Erreurs réseau/serveur : on retente avec un back-off court.
            last_error = exc
            logger.warning("OCR tentative %d/%d échouée: %s", attempt, OCR_MAX_RETRIES, exc)
            if attempt < OCR_MAX_RETRIES:
                time.sleep(0.5 * attempt)
        except Exception as exc:  # noqa: BLE001 - on ne propage jamais
            last_error = exc
            logger.error("OCR erreur non récupérable: %s", exc)
            break

    duration_ms = (time.perf_counter() - start) * 1000
    if metrics:
        metrics.record_ocr(success=False, duration_ms=duration_ms)
    logger.error("OCR définitivement en échec pour %s : %s", image_url, last_error)
    return f"Erreur OCR : {last_error}"
