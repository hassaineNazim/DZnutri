from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from . import models
import re

async def find_additives_in_text(db: AsyncSession, ocr_text: str):
    """
    Cherche des additifs dans un texte en se basant sur la table des additifs.
    Amélioré pour détecter SIN/INS et les e-numbers avec espaces.
    """
    if not ocr_text:
        return []

    # 1. Récupérer tous les additifs connus de la base de données
    result = await db.execute(select(models.Additif))
    known_additives = result.scalars().all()
    
    found_additives = []
    
    # Prétraitement de la map des codes connus pour un lookup rapide
    # On mappe E322 -> Additif(E322), SIN322 -> Additif(E322), etc.
    code_map = {}
    name_check_list = []

    for add in known_additives:
        # Standard E-number (ex: E322)
        code = add.e_number.upper()
        code_map[code] = add
        
        # Variations standard (SIN322, INS322)
        number_part = code[1:] if code.startswith("E") else code
        code_map[f"SIN{number_part}"] = add
        code_map[f"INS{number_part}"] = add
        
        # Pour les noms, on garde la liste pour regex plus tard
        if add.name:
            name_check_list.append(add)

    # 2. STRATÉGIE 1 : RECHERCHE PAR PATTERN INTELLIGENT (Codes)
    # On cherche (E ou SIN ou INS) suivi éventuellement d'espace ou tiret, suivi de 3 ou 4 chiffres, suivi optionnellement d'une lettre
    # Ex: "SIN 503", "E-330", "INS407a"
    pattern = r'\b(?:E|SIN|INS|SIN\.|INS\.)\s*[-]?\s*(\d{3,4}[a-z]?)\b'
    
    matches = re.finditer(pattern, ocr_text, re.IGNORECASE)
    
    found_ids = set()
    
    for match in matches:
        number_part = match.group(1).upper() # ex: "503"
        # On reconstitue un code standard "E"+number (ex: E503) pour chercher dans la DB
        # Ou on cherche via nos clés simulées
        potential_keys = [f"E{number_part}", f"SIN{number_part}", f"INS{number_part}"]
        
        for key in potential_keys:
            if key in code_map:
                additif = code_map[key]
                if additif.id not in found_ids:
                    found_additives.append(additif)
                    found_ids.add(additif.id)
                break # On a trouvé l'additif pour ce match

    # 3. STRATÉGIE 2 : RECHERCHE PAR NOM (Fallback et Complément)
    # Utile si le code est manquant mais le nom est écrit "Gomme Xanthane"
    # On ne le fait que si on n'a pas déjà trouvé l'additif par code (optimisation optionnelle, mais ici on veut tout trouver)
    
    # Pour optimisation, on pourrait ne chercher que ceux pas encore trouvés
    # Mais un texte peut contenir le nom ET le code, c'est pas grave.
    
    for additif in name_check_list:
        if additif.id in found_ids:
            continue
            
        # Regex simple pour le nom complet
        if re.search(r'\b' + re.escape(additif.name) + r'\b', ocr_text, re.IGNORECASE):
            found_additives.append(additif)
            found_ids.add(additif.id)
            
    return found_additives