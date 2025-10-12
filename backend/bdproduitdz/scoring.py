import logging
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from . import crud
from typing import Dict, Any, Set


def to_float_safe(v):
    try:
        return float(v)
    except Exception:
        return 0.0

def get_nutriment(n: Dict[str, Any], *keys):
    """Retourne la première clé existante convertie en float, sinon 0."""
    for k in keys:
        if k in n and n[k] is not None:
            return to_float_safe(n[k])
    return 0.0

def normalize_nova(product: Dict[str, Any]):
    # peut être 'nova_group', 'nova_groups' ou 'nova'
    for k in ("nova_group", "nova_groups", "nova"):
        if k in product:
            val = product[k]
            try:
                return int(val)
            except Exception:
                # parfois c'est une string "4"
                try:
                    return int(str(val).strip())
                except Exception:
                    return None
    return None

async def calculate_score(db: AsyncSession, product_data: Dict[str, Any]) -> Dict[str, Any]:

    """
    Retourne dict {'score': int, 'details': {...}}.
    Score sur 0..100, 100 = "meilleur".
    """
    if not product_data:
        return {"score": 0, "details": {"reason": "no product data"}}

    details = {}
    score = 100

    nutriments = product_data.get("nutriments", {})

    # énergie : preférer kcal (OFF peut renvoyer energy-kcal_100g ou energy-kj_100g)
    energy_kcal = get_nutriment(nutriments, "energy-kcal_100g", "energy-kcal_value")
    if energy_kcal == 0:
        # si seulement kJ présent -> convertir
        energy_kj = get_nutriment(nutriments, "energy-kj_100g", "energy-kj_value")
        if energy_kj:
            energy_kcal = energy_kj / 4.184

    if energy_kcal > 350:
        details.setdefault("energy", []).append(f"high energy ({energy_kcal:.1f} kcal)")
        score -= 10

    satfat = get_nutriment(nutriments, "saturated-fat_100g", "saturated_fat_100g")
    if satfat > 5:
        details.setdefault("satfat", []).append(f">5g")
        score -= 15
    elif satfat > 3:
        details.setdefault("satfat", []).append(f">3g")
        score -= 10

    sugars = get_nutriment(nutriments, "sugars_100g", "sugar_100g")
    if sugars > 15:
        details.setdefault("sugars", []).append(f">15g")
        score -= 20
    elif sugars > 5:
        details.setdefault("sugars", []).append(f">5g")
        score -= 10

    # sel : tenter salt_100g sinon sodium_100g -> salt = sodium * 2.5
    salt = get_nutriment(nutriments, "salt_100g")
    if salt == 0:
        sodium = get_nutriment(nutriments, "sodium_100g")
        if sodium:
            salt = sodium * 2.5
    if salt > 1.5:
        details.setdefault("salt", []).append(f">1.5g")
        score -= 15

    # Additifs : récupérer la liste et intersection avec le mapping
    additives = set([a.lower() for a in product_data.get("additives_tags", []) or []])
    additifs_penalty = crud.get_additifs_penalty(db)
    matched_add = {}

    for add in additives:
        if add in additifs_penalty:
            penalty = additifs_penalty[add]
            matched_add[add] = penalty
            score -= penalty * 2 # a ajuster dans le futur

    if matched_add:
        details["additives"] = matched_add

    # NOVA
    nova = normalize_nova(product_data)
    if nova == 4:
        details.setdefault("nova", []).append("ultra-processed (4)")
        score -= 20
    elif nova == 3:
        details.setdefault("nova", []).append("processed (3)")
        score -= 10

    # labels / bonus
    labels = set(product_data.get("labels_tags", []) or [])
    if "en:organic" in labels or "organic" in labels:
        details.setdefault("labels", []).append("organic")
        score += 10

    fiber = get_nutriment(nutriments, "fiber_100g", "fibres_100g")
    if fiber > 3:
        details.setdefault("fiber", []).append(f">{3}g")
        score += 5

    protein = get_nutriment(nutriments, "proteins_100g", "protein_100g")
    if protein > 10:
        details.setdefault("protein", []).append(f">{10}g")
        score += 5

    # clamp
    score = max(0, min(100, int(round(score))))

    return {"score": score, "details": details}
