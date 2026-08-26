import asyncio
import os

# Script manuel historique, pas un test pytest automatisé.
__test__ = False

async def main():
    """
    Script de test pour la fonction OCR de Google Vision.
    """
    # 1. Définissez le chemin vers votre clé de service
    # Remplacez "votre-fichier-cle.json" par le nom exact de votre fichier
    key_path = "dznutri-632fbb70c039.json" 
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = key_path
    
    # Le pipeline de production travaille désormais avec une URL Cloudinary.
    image_url = os.getenv("TEST_OCR_IMAGE_URL")
    if not image_url:
        raise RuntimeError("Définissez TEST_OCR_IMAGE_URL avant de lancer ce script.")

    from bdproduitdz.ocr import detect_text_from_url

    print(f"Analyse de l'image : {image_url}")
    print("------------------------------------------")

    # 3. Appelez votre fonction OCR
    detected_text = detect_text_from_url(image_url)

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
