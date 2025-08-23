# Dans produit/ocr.py
from google.cloud import vision
import os

def detect_text_from_image(file_path: str) -> str:
    """Analyse une image locale avec Google Vision AI et retourne le texte détecté."""
    
    # Vérifie si le chemin du fichier de clé est bien configuré
    if not os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        print("ERREUR: La variable d'environnement GOOGLE_APPLICATION_CREDENTIALS n'est pas définie.")
        return "Erreur de configuration du serveur OCR."

    try:
        client = vision.ImageAnnotatorClient()

        with open(file_path, "rb") as image_file:
            content = image_file.read()

        image = vision.Image(content=content)
        
        response = client.text_detection(image=image)
        
        if response.error.message:
            raise Exception(response.error.message)

        texts = response.text_annotations
        if texts:
            return texts[0].description
        return ""
    except Exception as e:
        print(f"Erreur lors de l'appel à Google Vision API : {e}")
        return f"Erreur OCR : {e}"