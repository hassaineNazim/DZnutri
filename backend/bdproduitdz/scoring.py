import logging
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Optional, List, Set
import math

# Import du CRUD pour les opérations sur les additifs
from . import crud
# Import des modèles pour le typage
from . import models

# ---
# 1. FONCTIONS HELPERS (Outils généraux)
# ---

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
    """Extrait le groupe NOVA, peu importe la clé utilisée."""
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
    """Convertit le niveau de danger numérique (ex: 1, 2, 3) en étiquette textuelle."""
    try:
        v = int(d)
    except Exception:
        v = 0
    if v >= 3:
        return "high" # Risque élevé (Rouge chez Yuka)
    if v == 2:
        return "moderate" # Risque modéré (Orange/Jaune chez Yuka)
    return "low" # Risque faible ou nul (Vert chez Yuka)

def normalize_additive_tag(tag: str) -> str:
    """Nettoie un tag d'additif (ex: "en:e330") pour ne garder que le code ("e330")."""
    if not tag:
        return ""
    # "en:e330" -> "e330", "fr:sin330" -> "sin330"
    return str(tag).split(':')[-1].lower()

def get_points_from_thresholds(value: float, thresholds: List[float]) -> int:
    """
    Attribue des points de 0 à 10 en fonction de seuils fixes (non-linéaire).
    Les 'thresholds' (ex: [1.6, 3.2, 4.8, 6.4, 8.0]) sont les minimums
    pour obtenir 1, 2, 3, 4, ou 5 points.
    """
    # Itère en descendant (de 5 pts à 1 pt)
    for i in range(len(thresholds) - 1, -1, -1):
        if value >= thresholds[i]:
            return i + 1 # Retourne 5, 4, 3, 2, ou 1
    return 0 # Si en dessous du seuil minimum

# ---
# 2. CONSTANTES DE SCORING (Seuils Nutri-Score officiels)
# ---

# Catégories pour le routage
CAT_BEVERAGES = ["boissons", "soda", "jus", "boissons non-sucrées"]
CAT_FATS = ["huiles", "matières grasses"]
CAT_CHEESE = ["fromages"]

# Seuils pour les POINTS NÉGATIFS (N) - SOLIDES
# Chaque liste contient le seuil MINIMUM pour 1pt, 2pts, 3pts... 10pts
ENERGY_KJ_THRESHOLDS_SOLIDS = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]
SATFAT_G_THRESHOLDS_SOLIDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
SUGARS_G_THRESHOLDS_SOLIDS = [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45]
SALT_MG_THRESHOLDS_SOLIDS = [90, 180, 270, 360, 450, 540, 630, 720, 810, 900]

# Seuils pour les POINTS POSITIFS (P) - SOLIDES
# Chaque liste contient le seuil MINIMUM pour 1pt, 2pts, 3pts, 4pts, 5pts
FIBER_G_THRESHOLDS_SOLIDS = [0.9, 1.9, 2.8, 3.7, 4.7]
PROTEIN_G_THRESHOLDS_SOLIDS = [1.6, 3.2, 4.8, 6.4, 8.0]
FRUITS_PCT_THRESHOLDS_SOLIDS = [40, 60, 80, 80, 80] # (min 40% = 1pt, min 60% = 2pts, min 80% = 5pts)

# Seuils pour les BOISSONS (beaucoup plus stricts)
ENERGY_KJ_THRESHOLDS_BEVERAGES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270]
SUGARS_G_THRESHOLDS_BEVERAGES = [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5, 12, 13.5]

# ---
# 3. LES MOTEURS DE CALCUL (60% / 30% / 10%)
# Ces fonctions sont "pures" et synchrones. Elles ne parlent pas à la base de données.
# ---

def _calculate_nutrition_score(
    product_data: Dict[str, Any], 
    category: str
) -> Dict[str, Any]:
    """
    Calcule le score nutritionnel sur 60 points, en imitant la logique Nutri-Score.
    C'est la composante de 60% du score final.
    """
    details: Dict[str, Any] = {}
    nutriments = product_data.get("nutriments", {}) or {}

    # --- 1. Définir les bons seuils (Solide ou Boisson) ---
    if category in CAT_BEVERAGES:
        ENERGY_THRESHOLDS = ENERGY_KJ_THRESHOLDS_BEVERAGES
        SUGAR_THRESHOLDS = SUGARS_G_THRESHOLDS_BEVERAGES
        SATFAT_THRESHOLDS = [10] * 10 # Les graisses ne comptent pas pour les boissons
    else:
        ENERGY_THRESHOLDS = ENERGY_KJ_THRESHOLDS_SOLIDS
        SUGAR_THRESHOLDS = SUGARS_G_THRESHOLDS_SOLIDS
        SATFAT_THRESHOLDS = SATFAT_G_THRESHOLDS_SOLIDS

    # --- 2. Calcul des Points Négatifs (N) ---
    energy_kj = get_nutriment(nutriments, "energy-kcal_100g") * 4.184 or get_nutriment(nutriments, "energy-kj_100g")
    satfat = get_nutriment(nutriments, "saturated-fat_100g")
    sugars = get_nutriment(nutriments, "sugars_100g")
    salt_mg = (get_nutriment(nutriments, "salt_100g") * 1000) or (get_nutriment(nutriments, "sodium_100g") * 2.5 * 1000)

    n_energy = get_points_from_thresholds(energy_kj, ENERGY_THRESHOLDS)
    n_sat = get_points_from_thresholds(satfat, SATFAT_THRESHOLDS)
    n_sug = get_points_from_thresholds(sugars, SUGAR_THRESHOLDS)
    n_salt = get_points_from_thresholds(salt_mg, SALT_MG_THRESHOLDS_SOLIDS)
    
    N = n_energy + n_sat + n_sug + n_salt

    # --- 3. Calcul des Points Positifs (P) ---
    fiber = get_nutriment(nutriments, "fiber_100g")
    protein = get_nutriment(nutriments, "proteins_100g")
    fruits_pct = to_float_safe(product_data.get("fruits_percent", 0.0))

    p_fiber = get_points_from_thresholds(fiber, FIBER_G_THRESHOLDS_SOLIDS)
    p_protein = get_points_from_thresholds(protein, PROTEIN_G_THRESHOLDS_SOLIDS)
    p_fruits = get_points_from_thresholds(fruits_pct, FRUITS_PCT_THRESHOLDS_SOLIDS)
    
    P = p_fiber + p_protein + p_fruits
    
    # --- 4. Calcul du score final (N - P) avec exceptions ---
    if N >= 11 and category not in CAT_CHEESE and p_fruits < 5:
        # Si le score N est élevé, on ne compte que les fibres et les fruits
        nutri_value = N - p_fiber - p_fruits
    else:
        # Cas normal
        nutri_value = N - P

    # --- 5. Conversion en score de 0 à 60 points ---
    # Le Nutri-Score va de -15 (meilleur) à +40 (pire). Plage totale de 55.
    MIN_NUTRI, MAX_NUTRI = -15.0, 40.0
    
    # On normalise de 0 (pire) à 1 (meilleur)
    norm = (nutri_value - MIN_NUTRI) / (MAX_NUTRI - MIN_NUTRI)
    
    # On inverse (1-norm) et on met sur 60 points
    score_nutritionnel = (1.0 - norm) * 60.0
    score_nutritionnel = max(0.0, min(60.0, score_nutritionnel)) # Clamp 0-60

    details = {
        "N_total": N,
        "P_total": P,
        "nutri_value_raw": nutri_value,
        "base_score_60": round(score_nutritionnel, 2)
    }
    return {"score": score_nutritionnel, "details": details}

def _calculate_additives_score(
    product_data: Dict[str, Any], 
    additifs_penalty_map: Dict[str, float]
) -> Dict[str, Any]:
    """
    Calcule le score des additifs sur 30 points.
    Logique basée sur des malus discrets (non-multiplicatifs).
    C'est la composante de 30% du score final.
    """
    # On commence avec le score maximum (30 points)
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
            danger_level_num = additifs_penalty_map[add_code]
            level_str = danger_level_to_level(danger_level_num)
            matched_add[add_code] = {"danger": danger_level_num, "level": level_str}
            add_counts[level_str] += 1
        elif add_code:
            unknown_additifs.append(add_code)

    # --- Logique de Pénalité (discrète, non-multiplicative) ---
    malus = 0.0
    if add_counts["high"] > 0:
        # Règle "Couperet" de Yuka : 1 additif rouge -> malus max.
        malus = 30.0 
        details["additives_malus"] = "Additif(s) à risque élevé (malus -30pts)"
    
    elif normalize_nova(product_data) == 4:
        # Malus pour ultra-transformation (NOVA 4)
        malus = 10.0
        details["additives_malus"] = "Produit ultra-transformé (NOVA 4) (malus -10pts)"
        if add_counts["moderate"] > 0:
            malus += 10.0 # Pénalité combinée
            details["additives_malus"] = "NOVA 4 + Additifs modérés (malus -20pts)"
            
    elif add_counts["moderate"] >= 2:
        malus = 15.0
        details["additives_malus"] = "Multiples additifs à risque modéré (malus -15pts)"
    elif add_counts["moderate"] == 1:
        malus = 10.0
        details["additives_malus"] = "Un additif à risque modéré (malus -10pts)"
    elif add_counts["low"] > 0:
        malus = 5.0
        details["additives_malus"] = "Additifs à faible risque (malus -5pts)"

    score_additifs = max(0.0, 30.0 - malus)
    
    details["matched"] = matched_add
    details["counts"] = add_counts
    
    return {"score": score_additifs, "details": details, "unknown": unknown_additifs}

def _calculate_bio_score(product_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calcule le score "Bio" sur 10 points.
    C'est la composante de 10% du score final.
    """
    labels = set(product_data.get("labels_tags", []) or [])
    is_bio = "en:organic" in labels or "organic" in labels
    
    score_bio = 10.0 if is_bio else 0.0
    details = {"is_bio": is_bio}
    
    return {"score": score_bio, "details": details}

# ---
# 5. LE "ROUTEUR" PUBLIC (La seule fonction appelée par l'extérieur)
# ---

async def calculate_score(db: AsyncSession, product_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fonction "routeur" publique asynchrone.
    
    Elle va :
    1. Pré-charger le dictionnaire des pénalités d'additifs (un seul appel DB).
    2. Déterminer la catégorie du produit (Solide ou Boisson).
    3. Appeler les moteurs de calcul (purs et synchrones).
    4. Gérer le stockage des additifs inconnus (un seul appel DB).
    5. Assembler le score final 60 + 30 + 10.
    """
    
    # 1. Sécurité : Gérer le cas où product_data est vide
    if not product_data:
        return {"score": 0, "details": {"reason": "no product data"}}

    # 2. Pré-charger le dictionnaire de pénalités d'additifs (I/O)
    try:
        additifs_penalty_map = await crud.get_additifs_penalty(db)
    except Exception as e:
        logging.error(f"Impossible de charger le dictionnaire des additifs: {e}")
        additifs_penalty_map = {} # Continuer avec un dictionnaire vide en cas d'erreur

    # 3. Déterminer la catégorie du produit
    category = (product_data.get("category") or "").lower().strip()
    
    # 4. Calculer les 3 composantes du score (logique pure, synchrone)
    nutrition_result = _calculate_nutrition_score(product_data, category)
    additives_result = _calculate_additives_score(product_data, additifs_penalty_map)
    bio_result = _calculate_bio_score(product_data)
    
    # 5. Gérer le post-traitement (I/O)
    # On sauvegarde les additifs inconnus trouvés par le moteur
    unknown_additifs = additives_result.get("unknown", [])
    if unknown_additifs:
       await crud.store_or_increment_pending_additifs(db, unknown_additifs)

    # 6. Assembler le score final (60 + 30 + 10 = 100)
    final_score = (
        nutrition_result["score"] + 
        additives_result["score"] + 
        bio_result["score"]
    )
    
    # 7. Assembler le résultat complet
    return {
        "score": int(round(final_score)),
        "details": {
            # On stocke les scores partiels pour l'affichage
            "nutrition_score": round(nutrition_result["score"], 1), # sur 60
            "additives_score": round(additives_result["score"], 1), # sur 30
            "bio_score": round(bio_result["score"], 1),       # sur 10
            # On stocke les détails de chaque calcul
            "nutrition_details": nutrition_result["details"],
            "additives_details": additives_result["details"],
            "bio_details": bio_result["details"],
            # On stocke les infos annexes qui n'influencent pas le score
            "nova_group": normalize_nova(product_data),
            "ecoscore_grade": (product_data.get("ecoscore_grade") or "").lower() or "non-disponible"
        },
        "unknown_additifs": unknown_additifs # Pour info
    }