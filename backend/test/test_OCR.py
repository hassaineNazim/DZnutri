import asyncio
import os
from bdproduitdz.ocr import detect_text_from_image # Importe votre fonction OCR

async def main():
    """
    Script de test pour la fonction OCR de Google Vision.
    """
    # 1. Définissez le chemin vers votre clé de service
    # Remplacez "votre-fichier-cle.json" par le nom exact de votre fichier
    key_path = "dznutri-632fbb70c039.json" 
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_path
    
    # 2. Définissez le chemin vers votre image de test
    image_path = "testOCR.png"

    print(f"Analyse de l'image : {image_path}")
    print("------------------------------------------")

    # 3. Appelez votre fonction OCR
    detected_text = detect_text_from_image(image_path)

    # 4. Affichez le résultat
    if detected_text:
        print("✅ Texte détecté :\n")
        print(detected_text)
    else:
        print("❌ Aucun texte n'a été détecté.")
    
    print("------------------------------------------")
    print("Test terminé.")

# Exécute le script
if __name__ == "__main__":
    asyncio.run(main())