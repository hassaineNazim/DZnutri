import logging
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Optional, List, Set
import math

# Import du CRUD pour les opérations sur les additifs
from . import crud
# Import des modèles pour le typage
from . import models

# =============================================================================
# 1. FONCTIONS HELPERS (Outils généraux)
# =============================================================================

def to_float_safe(v: Any) -> float:
    """Convertit une valeur en float de manière sécurisée."""
    if v is None:
        return 0.0
    try:
        return float(str(v).replace(",", "."))
    except (ValueError, TypeError):
        return 0.0

def get_nutriment(n: Dict[str, Any], *keys: str) -> float:
    """Retourne la première clé de nutriment existante convertie en float."""
    for k in keys:
        if k in n and n[k] is not None:
            return to_float_safe(n[k])
    return 0.0

def normalize_nova(product: Dict[str, Any]) -> Optional[int]:
    """Extrait le groupe NOVA."""
    for k in ("nova_group", "nova_groups", "nova"):
        if k in product:
            val = product[k]
            try:
                return int(val)
            except (ValueError, TypeError, AttributeError):
                try:
                    return int(str(val).strip())
                except (ValueError, TypeError):
                    continue
    return None

def danger_level_to_level(d: float) -> str:
    """Convertit le niveau de danger numérique (1, 2, 3) en texte."""
    try:
        v = int(d)
    except Exception:
        v = 0
    if v >= 3: return "high"
    if v == 2: return "moderate"
    return "low"

def normalize_additive_tag(tag: str) -> str:
    """Nettoie un tag d'additif (ex: 'en:e330' -> 'e330')."""
    if not tag: return ""
    return str(tag).split(':')[-1].lower()

def get_points_from_thresholds(value: float, thresholds: List[float]) -> int:
    """
    Attribue des points (0 à 10) en comparant une valeur à une liste de seuils.
    """
    for i in range(len(thresholds) - 1, -1, -1):
        if value > thresholds[i]:
            return i + 1
    if value > thresholds[0]: # Cas limite bas
        return 1
    return 0

# =============================================================================
# 2. CONSTANTES ET SEUILS (Règles du Nutri-Score)
# =============================================================================

# --- Catégories Spéciales ---
CAT_WATER = ["eau", "water", "eau de source", "eau minérale", "mineral water", "spring water"]
CAT_BEVERAGES = ["boissons", "soda", "jus", "boissons non-sucrées", "beverages", "tea", "coffee"]
CAT_FATS = ["huiles", "matières grasses", "fats", "mayonnaise", "beurre", "butter", "oil", "margarine", "crème"]
CAT_CHEESE = ["fromages", "cheeses", "cheese", "fromage"]

# --- Seuils SOLIDES (Cas Général) ---
ENERGY_KJ_THRESHOLDS_SOLIDS = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]
SATFAT_G_THRESHOLDS_SOLIDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
SUGARS_G_THRESHOLDS_SOLIDS = [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45]
SALT_MG_THRESHOLDS_SOLIDS = [90, 180, 270, 360, 450, 540, 630, 720, 810, 900]

FIBER_G_THRESHOLDS_SOLIDS = [0.9, 1.9, 2.8, 3.7, 4.7]
PROTEIN_G_THRESHOLDS_SOLIDS = [1.6, 3.2, 4.8, 6.4, 8.0]
FRUITS_PCT_THRESHOLDS_SOLIDS = [40, 60, 80, 80, 80]

# --- Seuils BOISSONS ---
ENERGY_KJ_THRESHOLDS_BEVERAGES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270]
SUGARS_G_THRESHOLDS_BEVERAGES = [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5, 12, 13.5]

# --- Seuils MATIÈRES GRASSES (Ratio Saturées / Lipides Totaux en %) ---
RATIO_FAT_THRESHOLDS = [10, 16, 22, 28, 34, 40, 46, 52, 58, 64]

# --- Facteurs de Malus ---
ADD_PENALTY_FACTORS = {"low": 0.98, "moderate": 0.90, "high": 0.70}
ECOSCORE_BONUS = {"a": 5, "b": 3, "c": 0, "d": -3, "e": -5}


# =============================================================================
# 3. MOTEURS DE CALCUL (Synchrones)
# =============================================================================

def _calculate_nutrition_score(
    product_data: Dict[str, Any], 
    category: str
) -> Dict[str, Any]:
    """
    Calcule le score nutritionnel sur 60 points.
    Gère les 4 cas : Solides, Boissons, Graisses, Fromages.
    """
    details: Dict[str, Any] = {}
    nutriments = product_data.get("nutriments", {}) or {}

    # --- A. Détection des cas spéciaux ---
    # Note : "category" est maintenant un mot-clé technique (boissons, matières grasses, etc.)
    is_beverage = category == "boissons"
    is_fat = category == "matières grasses"
    is_cheese = category == "fromages"

    # --- B. Configuration des Seuils Négatifs (N) ---
    
    if is_beverage:
        ENERGY_THRESHOLDS = ENERGY_KJ_THRESHOLDS_BEVERAGES
        SUGAR_THRESHOLDS = SUGARS_G_THRESHOLDS_BEVERAGES
        n_sat = 0 # Les boissons ne notent pas le gras saturé
    
    elif is_fat:
        # Cas Matières Grasses : Seuils standards pour Energie/Sucre
        ENERGY_THRESHOLDS = ENERGY_KJ_THRESHOLDS_SOLIDS
        SUGAR_THRESHOLDS = SUGARS_G_THRESHOLDS_SOLIDS
        
        # SPÉCIAL : Calcul du ratio pour les graisses saturées
        val_sat = get_nutriment(nutriments, "saturated-fat_100g", "saturated-fat")
        val_lipids = get_nutriment(nutriments, "fat_100g", "fat")
        
        if val_lipids > 0:
            ratio = (val_sat / val_lipids) * 100
        else:
            ratio = 0
        # On utilise la grille spéciale RATIO
        n_sat = get_points_from_thresholds(ratio, RATIO_FAT_THRESHOLDS)
        details["fat_ratio"] = round(ratio, 1)

    else:
        # Cas Général (Solides, Fromages, Chocolat...)
        ENERGY_THRESHOLDS = ENERGY_KJ_THRESHOLDS_SOLIDS
        SUGAR_THRESHOLDS = SUGARS_G_THRESHOLDS_SOLIDS
        val_sat = get_nutriment(nutriments, "saturated-fat_100g", "saturated-fat")
        n_sat = get_points_from_thresholds(val_sat, SATFAT_G_THRESHOLDS_SOLIDS)

    # --- C. Calcul des Points N (sauf n_sat qui est géré au-dessus) ---
    
    energy_kj = get_nutriment(nutriments, "energy-kcal_100g") * 4.184 or get_nutriment(nutriments, "energy-kj_100g")
    n_energy = get_points_from_thresholds(energy_kj, ENERGY_THRESHOLDS)
    
    sugars = get_nutriment(nutriments, "sugars_100g", "sugars")
    n_sug = get_points_from_thresholds(sugars, SUGAR_THRESHOLDS)
    
    salt_mg = (get_nutriment(nutriments, "salt_100g", "salt") * 1000) or (get_nutriment(nutriments, "sodium_100g", "sodium") * 2.5 * 1000)
    n_salt = get_points_from_thresholds(salt_mg, SALT_MG_THRESHOLDS_SOLIDS)
    
    N = n_energy + n_sat + n_sug + n_salt # Total Négatif (0 à 40)

    # --- D. Calcul des Points Positifs (P) ---
    
    fiber = get_nutriment(nutriments, "fiber_100g", "fiber")
    protein = get_nutriment(nutriments, "proteins_100g", "proteins")
    fruits_pct = to_float_safe(product_data.get("fruits_percent", 0.0))

    p_fiber = get_points_from_thresholds(fiber, FIBER_G_THRESHOLDS_SOLIDS)
    p_protein = get_points_from_thresholds(protein, PROTEIN_G_THRESHOLDS_SOLIDS)
    p_fruits = get_points_from_thresholds(fruits_pct, FRUITS_PCT_THRESHOLDS_SOLIDS)
    
    P = p_fiber + p_protein + p_fruits # Total Positif (0 à 15)
    
    # --- E. Calcul Final (N - P) avec Règles d'Exclusion ---
    
    if N >= 11 and not is_cheese and p_fruits < 5:
        # Cas "Mauvais produit" : On perd le bonus protéines
        nutri_value = N - (p_fiber + p_fruits)
    else:
        # Cas "Bon produit" OU Fromage : On garde tout
        nutri_value = N - P

    # --- F. Normalisation sur 60 points ---
    MIN_NUTRI, MAX_NUTRI = -15.0, 40.0
    norm = (nutri_value - MIN_NUTRI) / (MAX_NUTRI - MIN_NUTRI)
    score_nutritionnel = (1.0 - norm) * 60.0
    score_nutritionnel = max(0.0, min(60.0, score_nutritionnel))

    details.update({
        "N_total": N, "P_total": P, "nutri_value_raw": nutri_value,
        "is_beverage": is_beverage, "is_fat": is_fat, "is_cheese": is_cheese
    })
    return {"score": score_nutritionnel, "details": details}


def _calculate_additives_score(
    product_data: Dict[str, Any], 
    additifs_penalty_map: Dict[str, float]
) -> Dict[str, Any]:
    """
    Calcule le score Additifs sur 30 points (Malus discret et plafonné).
    """
    score_additifs = 30.0
    details: Dict[str, Any] = {}

    additives_from_product = {
        normalize_additive_tag(a) 
        for a in product_data.get("additives_tags", []) or []
    }
    
    matched_add = {}
    unknown_additifs = []
    add_counts = {"low": 0, "moderate": 0, "high": 0}

    for add_code in additives_from_product:
        if add_code in additifs_penalty_map:
            danger = additifs_penalty_map[add_code]
            level = danger_level_to_level(danger)
            matched_add[add_code] = {"danger": danger, "level": level}
            add_counts[level] += 1
        elif add_code:
            unknown_additifs.append(add_code)

    # Logique de pénalité "Couperet"
    malus = 0.0
    malus_reason = ""

    if add_counts["high"] > 0:
        malus = 30.0 
        malus_reason = "Additif(s) à risque élevé"
    elif normalize_nova(product_data) == 4:
        malus = 10.0
        malus_reason = "Produit ultra-transformé (NOVA 4)"
        if add_counts["moderate"] > 0:
            malus += 10.0 
            malus_reason = "NOVA 4 + Additifs modérés"
    elif add_counts["moderate"] >= 2:
        malus = 15.0
        malus_reason = "Multiples additifs à risque modéré"
    elif add_counts["moderate"] == 1:
        malus = 10.0
        malus_reason = "Un additif à risque modéré"
    elif add_counts["low"] > 0:
        malus = 5.0
        malus_reason = "Additifs à faible risque"

    score_additifs = max(0.0, 30.0 - malus)
    
    details.update({"matched": matched_add, "counts": add_counts, "malus_reason": malus_reason})
    return {"score": score_additifs, "details": details, "unknown": unknown_additifs}


def _calculate_bio_score(product_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calcule le score Bio sur 10 points."""
    labels = set(product_data.get("labels_tags", []) or [])
    is_bio = "en:organic" in labels or "organic" in labels or "fr:bio" in labels
    return {"score": 10.0 if is_bio else 0.0, "details": {"is_bio": is_bio}}


# =============================================================================
# 4. FONCTION PRINCIPALE (ROUTEUR)
# =============================================================================

async def calculate_score(db: AsyncSession, product_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fonction principale appelée par le backend.
    """
    if not product_data:
        return {"score": 0, "details": {"reason": "no product data"}, "unknown_additifs": []}

    # --- DÉBUT DEBUG ET NETTOYAGE CATÉGORIES ---
    
    # 1. On récupère TOUTES les sources possibles de catégories
    cat_string = str(product_data.get("categories", "") or "")
    cat_tags = product_data.get("categories_tags", []) or []
    main_cat = str(product_data.get("category", "") or "")
    
    # 2. On crée une "méga-chaîne" de texte en minuscule pour la recherche
    # Cela regroupe "Boissons", "en:beverages", "Eaux", etc.
    full_category_text = (cat_string + " " + " ".join(cat_tags) + " " + main_cat).lower()
    
    print(f"\n[DEBUG SCORING] Produit : {product_data.get('product_name')}")
    print(f"[DEBUG SCORING] Texte des catégories analysé : {full_category_text[:100]}...") # On affiche les 100 premiers caractères

    # 3. Détection EAU
    # On cherche si l'un des mots-clés de l'eau est DANS la méga-chaîne
    is_water = any(keyword in full_category_text for keyword in CAT_WATER)
    
    print(f"[DEBUG SCORING] Est-ce de l'eau ? {is_water}")

    if is_water:
        print("[DEBUG SCORING] -> STOP. Note forcée à 100.")
        return {
            "score": 100,
            "details": {
                "info": "L'eau est la seule boisson recommandée à volonté.",
                "nutrition_score": 60, "additives_score": 30, "bio_score": 10,
                "is_beverage": True
            },
            "unknown_additifs": []
        }

    # --- FIN DEBUG ---
    # 2. Charger les pénalités additifs
    try:
        additifs_penalty_map = await crud.get_additifs_penalty(db)
    except Exception as e:
        logging.error(f"Erreur chargement additifs: {e}")
        additifs_penalty_map = {}

    # 3. Déterminer la "Super-Catégorie" pour le calcul nutritionnel
    category_technical = "solid" # Par défaut
    
    if any(keyword in full_category_text for keyword in CAT_BEVERAGES):
        category_technical = "boissons" 
    elif any(keyword in full_category_text for keyword in CAT_FATS):
        category_technical = "matières grasses"
    elif any(keyword in full_category_text for keyword in CAT_CHEESE):
        category_technical = "fromages"
    
    # 4. Lancer les calculs
    nutrition_res = _calculate_nutrition_score(product_data, category_technical)
    additives_res = _calculate_additives_score(product_data, additifs_penalty_map)
    bio_res = _calculate_bio_score(product_data)
    
    # 5. Sauvegarde des additifs inconnus (Async)
    unknown = additives_res.get("unknown", [])
    if unknown:
        try:
            await crud.store_or_increment_pending_additifs(db, unknown)
        except Exception as e:
            logging.error(f"Erreur sauvegarde additifs inconnus: {e}")

    # 6. Score Final
    final_score = nutrition_res["score"] + additives_res["score"] + bio_res["score"]
    
    # Info Eco-Score
    ecoscore = (product_data.get("ecoscore_grade") or "").lower()

    return {
        "score": int(round(final_score)),
        "details": {
            "nutrition_score": round(nutrition_res["score"], 1),
            "additives_score": round(additives_res["score"], 1),
            "bio_score": round(bio_res["score"], 1),
            "nutrition_details": nutrition_res["details"],
            "additives_details": additives_res["details"],
            "bio_details": bio_res["details"],
            "nova_group": normalize_nova(product_data),
            "ecoscore_grade": ecoscore or "non-disponible",
            "TypeSpecifique": category_technical or "non-disponible"
        },
        "unknown_additifs": unknown
    }