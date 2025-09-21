from google.cloud import vision
import os

# Assurez-vous que le nom de votre fichier de clé est correct
KEY_FILENAME = "dznutri-632fbb70c039.json" 
KEY_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), KEY_FILENAME)

def detect_text_from_url(image_url: str) -> str:
    """Analyse une image depuis une URL avec Google Vision AI."""
    
    # On vérifie si le fichier de clé existe physiquement
    if not os.path.exists(KEY_PATH):
        error_msg = f"ERREUR: Le fichier de clé '{KEY_FILENAME}' est introuvable."
        print(error_msg)
        return error_msg

    try:
        # L'initialisation et l'utilisation du client sont dans le même bloc
        client = vision.ImageAnnotatorClient.from_service_account_json(KEY_PATH)

        image = vision.Image()
        image.source.image_uri = image_url
        
        response = client.text_detection(image=image)
        
        if response.error.message:
            raise Exception(f"Erreur de l'API Google : {response.error.message}")

        return response.text_annotations[0].description if response.text_annotations else ""
        
    except Exception as e:
        print(f"Erreur lors du processus OCR : {e}")
        # On retourne un message d'erreur clair qui sera stocké dans la base de données
        return f"Erreur OCR : {e}"