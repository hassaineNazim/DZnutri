from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from . import models
import re

async def find_additives_in_text(db: AsyncSession, ocr_text: str):
    """
    Cherche des additifs dans un texte en se basant sur la table des additifs.
    """
    # 1. Récupérer tous les additifs connus de la base de données
    result = await db.execute(select(models.Additif))
    known_additives = result.scalars().all()
    
    found_additives = []
    
    # 2. Chercher chaque additif dans le texte
    for additif in known_additives:
        # On cherche le code (ex: E951) ou le nom (ex: Aspartame)
        # re.IGNORECASE rend la recherche insensible à la casse
        # \b garantit qu'on cherche des mots entiers
        if re.search(r'\b' + re.escape(additif.e_number) + r'\b', ocr_text, re.IGNORECASE) or \
           re.search(r'\b' + re.escape(additif.name) + r'\b', ocr_text, re.IGNORECASE):
            
            found_additives.append(additif)
            
    return found_additives