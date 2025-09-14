import re
from typing import Dict, Any, Optional

# synonyms pour chaque clé
LABELS = {
    "energy_kcal_100g": [r"énergie", r"kcal", r"énergie/100g"],
    "fat_100g": [r"matières grasses", r"lipides"],
    "saturated_fat_100g": [r"dont satur.{1,3}es", r"acides gras satur.{0,10}"],
    "carbohydrates_100g": [r"glucides", r"hydrates de carbone"],
    "sugars_100g": [r"dont sucres", r"sucres"],
    "proteins_100g": [r"protéines", r"proteines"],
    "fiber_100g": [r"fibres", r"fibre"],
    "salt_100g": [r"sel\b", r"salt\b"],
    "sodium_100g": [r"sodium"],
}

# helpers
def to_float(s: str) -> Optional[float]:
    try:
        return float(s.replace(",", "."))
    except Exception:
        return None

def find_energy(text: str) -> Optional[float]:
    # cas: "2217 kJ/530 kcal" ou "530 kcal"
    m = re.search(r"(\d{2,5})\s*kJ\s*/\s*(\d{2,4})\s*kcal", text, re.I)
    if m:
        return to_float(m.group(2))
    m2 = re.search(r"(\d{2,4})\s*kcal", text, re.I)
    if m2:
        return to_float(m2.group(1))
    # parfois kJ seul -> convertir kJ -> kcal
    m3 = re.search(r"(\d{3,5})\s*kJ", text, re.I)
    if m3:
        kj = to_float(m3.group(1))
        if kj:
            return kj / 4.184
    return None

def regex_search_near_label(text: str, patterns: list) -> Optional[float]:
    """
    Cherche une occurrence label ... nombre (unit g/mg/kcal) n'importe où dans le texte.
    """
    for label_pat in patterns:
        # cherche "label ... number unit" sur le texte entier
        pat = rf"{label_pat}[^0-9\r\n]{{0,40}}?(\d+[\d.,]*)\s*(mg|g|kcal|kj)?"
        m = re.search(pat, text, re.I | re.UNICODE)
        if m:
            val = to_float(m.group(1))
            unit = (m.group(2) or "").lower()
            # normaliser mg -> g
            if unit == "mg" and val is not None:
                val = val / 1000.0
            return val
    return None

def parse_nutritional_info_improved(ocr_text: str) -> Dict[str, Any]:
    """
    Retourne dict de nutriments normalisés (valeurs en g pour masse, kcal pour énergie).
    """
    # normalisation simple
    text = ocr_text.replace("\xa0", " ").replace("\u200b", "").strip()
    # garder também uma versão "one-line" pour regex globales
    flat = " ".join([ln.strip() for ln in text.splitlines() if ln.strip()])

    results: Dict[str, Any] = {}

    # énergie
    energy = find_energy(flat)
    if energy is not None:
        results["energy_kcal_100g"] = round(energy, 2)

    # pour chaque nutriment tenter recherche globale
    for key, patterns in LABELS.items():
        if key == "sodium_100g" or key == "salt_100g":
            # on laisse pour la suite
            pass
        val = regex_search_near_label(flat, patterns)
        if val is not None:
            # normaliser noms et unités
            results_key = key
            results[results_key] = round(val, 3) if isinstance(val, float) else val

    # tentatives ligne-by-line pour rattraper "label" sur une ligne et "value" sur la suivante
    if any(k not in results for k in ["fat_100g","saturated_fat_100g","carbohydrates_100g","sugars_100g","proteins_100g","fiber_100g","salt_100g"]):
        for i, line in enumerate(text.splitlines()):
            line = line.strip()
            # si la ligne contient un label mais pas de valeur, chercher la valeur sur la ligne suivante
            for key, patterns in LABELS.items():
                if key in results:
                    continue
                for pat in patterns:
                    if re.search(pat, line, re.I):
                        # chercher nombre sur la même ligne
                        m = re.search(r"(\d+[\d.,]*)\s*(mg|g|kcal|kj)?", line)
                        if m:
                            val = to_float(m.group(1))
                            unit = (m.group(2) or "").lower()
                            if unit == "mg" and val is not None:
                                val = val / 1000.0
                            results[key] = val
                        else:
                            # regarder la ligne suivante si existe
                            if i+1 < len(text.splitlines()):
                                nxt = text.splitlines()[i+1]
                                m2 = re.search(r"(\d+[\d.,]*)\s*(mg|g|kcal|kj)?", nxt)
                                if m2:
                                    val2 = to_float(m2.group(1))
                                    unit2 = (m2.group(2) or "").lower()
                                    if unit2 == "mg" and val2 is not None:
                                        val2 = val2 / 1000.0
                                    results[key] = val2

    # si salt absent, tenter récupérer sodium et convertir Na->salt
    if "salt_100g" not in results:
        sodium_val = regex_search_near_label(flat, LABELS.get("sodium_100g", []))
        if sodium_val is not None:
            # sodium_val est en g si mg converti précédemment; mais si regex a trouvé mg, on a converti
            # Si on a sodium en g -> salt = sodium * 2.5
            results["sodium_100g"] = round(sodium_val, 4)
            results["salt_100g"] = round(sodium_val * 2.5, 4)

    # convert keys to expected output names and tidy
    # assurer unités: énergie en kcal, masses en g
    return results
