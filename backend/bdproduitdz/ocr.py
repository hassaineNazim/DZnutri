# Dans produit/ocr.py
import pytesseract
from PIL import Image

# AJOUTEZ CETTE LIGNE (adaptez le chemin si nécessaire)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def detect_text_with_tesseract(file_path: str) -> str:
    try:
        detected_text = pytesseract.image_to_string(Image.open(file_path), lang='fra+eng')
        print("--- Texte détecté par Tesseract ---")
        print(detected_text)
        print("---------------------------------")
        return detected_text
    except Exception as e:
        print(f"Erreur lors de l'analyse Tesseract : {e}")
        return ""