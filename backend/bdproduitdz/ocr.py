from google.cloud import vision
import os

KEY_FILENAME = "dznutri-632fbb70c039.json"
KEY_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), KEY_FILENAME)

def detect_text_from_image(file_path: str) -> str:
    print(f"[OCR DEBUG] La fonction a été appelée avec le chemin : {file_path}")

    # VÉRIFICATION 1 : Le fichier de clé existe-t-il ?
    if not os.path.exists(KEY_PATH):
        error_msg = f"ERREUR: Le fichier de clé '{KEY_FILENAME}' est introuvable au chemin calculé : {KEY_PATH}"
        print(error_msg)
        return error_msg

    # VÉRIFICATION 2 : L'image à analyser existe-t-elle ?
    if not os.path.exists(file_path):
        error_msg = f"ERREUR: Le fichier image '{file_path}' est introuvable."
        print(error_msg)
        return error_msg

    try:
        client = vision.ImageAnnotatorClient.from_service_account_json(KEY_PATH)
        with open(file_path, "rb") as image_file:
            content = image_file.read()

        image = vision.Image(content=content)

        response = client.document_text_detection(image=image)

        if response.error.message:
            raise Exception(response.error.message)

        # fullTextAnnotation contient tout le texte structuré
        full_text = response.full_text_annotation.text if response.full_text_annotation.text else ""
        print(f"[OCR DEBUG] Texte détecté : {full_text[:200]}...")  # juste un aperçu
        return full_text

    except Exception as e:
        print(f"[OCR ERREUR] Erreur lors de l'appel à Google Vision API : {e}")
        return f"Erreur OCR : {e}"
