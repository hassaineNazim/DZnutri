"""Moteur de scoring DZnutri.

Le score final est un score "santé" sur 100 (style Yuka), composé de :
  - Score nutritionnel  : 0-60  (basé sur l'algorithme Nutri-Score officiel 2017)
  - Score additifs       : 0-30  (malus selon le niveau de danger)
  - Score bio            : 0-10  (bonus label bio)

En plus du score sur 100, on calcule et on renvoie la **lettre Nutri-Score**
(A-E) officielle, dérivée du score FSA (N - P), pour l'afficher dans l'app.

Points de robustesse essentiels :
  - Normalisation des clés de nutriments : les deux sources de données utilisent
    des noms différents (OpenFoodFacts: ``saturated-fat_100g`` avec tirets ;
    parser OCR maison: ``saturated_fat_100g`` avec underscores). Toute lecture
    passe par ``_get_nutriment`` qui essaie tous les alias. Sans ça, l'énergie et
    les graisses saturées des produits soumis par les utilisateurs étaient lues à
    0 -> tous les produits gras paraissaient sains.
  - Conversion sel/sodium correcte : le Nutri-Score note le **sodium** (mg). On
    convertit proprement (sel_g x 400 = sodium_mg) au lieu de comparer des
    milligrammes de sel à des seuils de sodium.
"""

import logging
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

# Import du CRUD pour les opérations sur les additifs
from . import crud

logger = logging.getLogger("dznutri.scoring")

# =============================================================================
# 1. HELPERS (conversion, normalisation, lecture tolérante)
# =============================================================================


def to_float_safe(v: Any) -> float:
    """Convertit une valeur en float de manière sécurisée (None / virgule / texte)."""
    if v is None:
        return 0.0
    try:
        return float(str(v).replace(",", ".").strip())
    except (ValueError, TypeError):
        return 0.0


# Alias canoniques -> toutes les variantes possibles selon la source de données.
# On couvre : tirets (OpenFoodFacts), underscores (parser OCR maison), avec et
# sans suffixe `_100g`. Tout passe en minuscule pour une comparaison robuste.
_NUTRIMENT_ALIASES: Dict[str, List[str]] = {
    "energy_kcal": ["energy-kcal_100g", "energy_kcal_100g", "energy-kcal", "energy_kcal"],
    "energy_kj": ["energy-kj_100g", "energy_kj_100g", "energy-kj", "energy_kj", "energy_100g", "energy"],
    "fat": ["fat_100g", "fat"],
    "saturated_fat": ["saturated-fat_100g", "saturated_fat_100g", "saturated-fat", "saturated_fat"],
    "sugars": ["sugars_100g", "sugars"],
    "salt": ["salt_100g", "salt"],
    "sodium": ["sodium_100g", "sodium"],
    "fiber": ["fiber_100g", "fiber", "fibres_100g", "fibres"],
    "proteins": ["proteins_100g", "proteins", "proteines_100g", "proteines"],
}


def _get_nutriment(nutriments: Dict[str, Any], canonical: str) -> Optional[float]:
    """Lit un nutriment via tous ses alias connus. Renvoie None si absent.

    On distingue "absent" (None) de "zéro" (0.0) : utile pour les fallbacks
    (ex: utiliser le sodium seulement si le sel n'est pas renseigné).
    """
    aliases = _NUTRIMENT_ALIASES.get(canonical, [canonical])
    for key in aliases:
        if key in nutriments and nutriments[key] is not None:
            return to_float_safe(nutriments[key])
    return None


def _energy_kj(nutriments: Dict[str, Any]) -> float:
    """Énergie en kJ (le Nutri-Score raisonne en kJ).

    Priorité au kJ s'il est fourni, sinon conversion depuis les kcal (x4.184).
    """
    kj = _get_nutriment(nutriments, "energy_kj")
    if kj is not None and kj > 0:
        return kj
    kcal = _get_nutriment(nutriments, "energy_kcal")
    if kcal is not None:
        return kcal * 4.184
    return 0.0


def _sodium_mg(nutriments: Dict[str, Any]) -> float:
    """Sodium en mg. Dérivé du sodium si présent, sinon du sel (sel_g x 400)."""
    sodium = _get_nutriment(nutriments, "sodium")
    if sodium is not None:
        return sodium * 1000.0  # g -> mg
    salt = _get_nutriment(nutriments, "salt")
    if salt is not None:
        # sodium = sel / 2.5  -> sodium_mg = sel_g * 1000 / 2.5 = sel_g * 400
        return salt * 400.0
    return 0.0


def normalize_nova(product: Dict[str, Any]) -> Optional[int]:
    """Extrait le groupe NOVA (1-4) quelle que soit la clé / le type."""
    for k in ("nova_group", "nova_groups", "nova"):
        if k in product and product[k] is not None:
            try:
                return int(str(product[k]).strip())
            except (ValueError, TypeError):
                continue
    return None


def danger_level_to_level(d: Any) -> str:
    """Convertit un niveau de danger numérique en libellé textuel."""
    try:
        v = int(d)
    except (ValueError, TypeError):
        v = 0
    if v >= 3:
        return "high"
    if v == 2:
        return "moderate"
    return "low"


def normalize_additive_tag(tag: str) -> str:
    """Nettoie un tag d'additif (ex: 'en:e330' -> 'e330')."""
    if not tag:
        return ""
    return str(tag).split(":")[-1].strip().lower()


def get_points_from_thresholds(value: float, thresholds: List[float]) -> int:
    """Nombre de seuils strictement dépassés par ``value`` (logique Nutri-Score).

    Ex: thresholds=[4.5, 9, 13.5], value=10 -> dépasse 4.5 et 9 -> 2 points.
    Le résultat est borné par la longueur de la liste de seuils.
    """
    points = 0
    for threshold in thresholds:
        if value > threshold:
            points += 1
        else:
            break
    return points


# =============================================================================
# 2. CONSTANTES ET SEUILS (Nutri-Score 2017)
# =============================================================================

# --- Détection de catégories spéciales (recherche par mots-clés) ---
CAT_WATER = ["eau", "water", "eau de source", "eau minérale", "mineral water", "spring water"]
CAT_BEVERAGES = ["boisson", "soda", "jus", "beverage", "tea", "thé", "coffee", "café", "nectar", "limonade"]
CAT_FATS = ["huile", "matière grasse", "matières grasses", "fat", "mayonnaise", "beurre", "butter", "oil", "margarine"]
CAT_CHEESE = ["fromage", "cheese"]

# --- Seuils SOLIDES (composantes négatives N) ---
ENERGY_KJ_THRESHOLDS_SOLIDS = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]
SATFAT_G_THRESHOLDS_SOLIDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
SUGARS_G_THRESHOLDS_SOLIDS = [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45]
SODIUM_MG_THRESHOLDS = [90, 180, 270, 360, 450, 540, 630, 720, 810, 900]

# --- Seuils SOLIDES (composantes positives P) ---
FIBER_G_THRESHOLDS_SOLIDS = [0.9, 1.9, 2.8, 3.7, 4.7]
PROTEIN_G_THRESHOLDS_SOLIDS = [1.6, 3.2, 4.8, 6.4, 8.0]
# Encodage de la grille fruits/légumes (0,1,2,5) via des seuils répétés à 80.
FRUITS_PCT_THRESHOLDS_SOLIDS = [40, 60, 80, 80, 80]

# --- Seuils BOISSONS ---
ENERGY_KJ_THRESHOLDS_BEVERAGES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270]
SUGARS_G_THRESHOLDS_BEVERAGES = [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5, 12, 13.5]

# --- Seuils MATIÈRES GRASSES (ratio AG saturés / lipides totaux, en %) ---
RATIO_FAT_THRESHOLDS = [10, 16, 22, 28, 34, 40, 46, 52, 58, 64]

# --- Bornes de l'échelle FSA (score Nutri-Score brut) pour la normalisation ---
FSA_MIN, FSA_MAX = -15.0, 40.0

# --- Grilles de notation (lettre A-E) à partir du score FSA ---
# (seuil_max_inclus, lettre) ; on prend la première lettre dont le score est <= seuil.
NUTRISCORE_GRADES_SOLID = [(-1, "a"), (2, "b"), (10, "c"), (18, "d"), (float("inf"), "e")]
NUTRISCORE_GRADES_BEVERAGE = [(1, "b"), (5, "c"), (9, "d"), (float("inf"), "e")]


def _fsa_to_grade(fsa: float, is_beverage: bool) -> str:
    """Lettre Nutri-Score (a-e) à partir du score FSA brut."""
    grid = NUTRISCORE_GRADES_BEVERAGE if is_beverage else NUTRISCORE_GRADES_SOLID
    for ceiling, letter in grid:
        if fsa <= ceiling:
            return letter
    return "e"


# =============================================================================
# 3. MOTEURS DE CALCUL
# =============================================================================


def _calculate_nutrition_score(
    product_data: Dict[str, Any], category: str
) -> Dict[str, Any]:
    """Calcule le score nutritionnel (0-60) + la lettre Nutri-Score.

    Gère les 4 cas : solides, boissons, matières grasses, fromages.
    """
    details: Dict[str, Any] = {}
    nutriments = product_data.get("nutriments", {}) or {}

    is_beverage = category == "boissons"
    is_fat = category == "matières grasses"
    is_cheese = category == "fromages"

    # --- Sélection des grilles selon la catégorie ---
    if is_beverage:
        energy_thresholds = ENERGY_KJ_THRESHOLDS_BEVERAGES
        sugar_thresholds = SUGARS_G_THRESHOLDS_BEVERAGES
    else:
        energy_thresholds = ENERGY_KJ_THRESHOLDS_SOLIDS
        sugar_thresholds = SUGARS_G_THRESHOLDS_SOLIDS

    # --- Composante "graisses saturées" ---
    if is_fat:
        # Cas spécial matières grasses : on note le ratio AG saturés / lipides.
        val_sat = _get_nutriment(nutriments, "saturated_fat") or 0.0
        val_lipids = _get_nutriment(nutriments, "fat") or 0.0
        ratio = (val_sat / val_lipids) * 100 if val_lipids > 0 else 0.0
        n_sat = get_points_from_thresholds(ratio, RATIO_FAT_THRESHOLDS)
        details["fat_ratio"] = round(ratio, 1)
    elif is_beverage:
        # Les boissons ne notent pas les graisses saturées.
        n_sat = 0
    else:
        val_sat = _get_nutriment(nutriments, "saturated_fat") or 0.0
        n_sat = get_points_from_thresholds(val_sat, SATFAT_G_THRESHOLDS_SOLIDS)

    # --- Composantes négatives restantes ---
    energy_kj = _energy_kj(nutriments)
    n_energy = get_points_from_thresholds(energy_kj, energy_thresholds)

    sugars = _get_nutriment(nutriments, "sugars") or 0.0
    n_sug = get_points_from_thresholds(sugars, sugar_thresholds)

    sodium_mg = _sodium_mg(nutriments)
    n_salt = get_points_from_thresholds(sodium_mg, SODIUM_MG_THRESHOLDS)

    N = n_energy + n_sat + n_sug + n_salt  # 0 à 40

    # --- Composantes positives ---
    fiber = _get_nutriment(nutriments, "fiber") or 0.0
    protein = _get_nutriment(nutriments, "proteins") or 0.0
    fruits_pct = to_float_safe(product_data.get("fruits_percent", 0.0))

    p_fiber = get_points_from_thresholds(fiber, FIBER_G_THRESHOLDS_SOLIDS)
    p_protein = get_points_from_thresholds(protein, PROTEIN_G_THRESHOLDS_SOLIDS)
    p_fruits = get_points_from_thresholds(fruits_pct, FRUITS_PCT_THRESHOLDS_SOLIDS)
    P = p_fiber + p_protein + p_fruits  # 0 à 15

    # --- Règle d'exclusion des protéines (Nutri-Score officiel) ---
    # Si N >= 11 et que le produit n'est ni un fromage ni très riche en fruits
    # (>80%), les protéines ne comptent pas (évite de "racheter" un mauvais
    # produit très protéiné comme la charcuterie).
    if N >= 11 and not is_cheese and p_fruits < 5:
        fsa_value = N - (p_fiber + p_fruits)
    else:
        fsa_value = N - P

    grade = _fsa_to_grade(fsa_value, is_beverage)

    # --- Normalisation du score FSA sur 0-60 (plus c'est haut, mieux c'est) ---
    norm = (fsa_value - FSA_MIN) / (FSA_MAX - FSA_MIN)
    norm = max(0.0, min(1.0, norm))
    score_nutritionnel = (1.0 - norm) * 60.0

    details.update(
        {
            "N_total": N,
            "P_total": P,
            "fsa_value": fsa_value,
            "components": {
                "energy": n_energy,
                "saturated_fat": n_sat,
                "sugars": n_sug,
                "sodium": n_salt,
                "fiber": p_fiber,
                "proteins": p_protein,
                "fruits": p_fruits,
            },
            "grade": grade,
            "is_beverage": is_beverage,
            "is_fat": is_fat,
            "is_cheese": is_cheese,
        }
    )
    return {"score": score_nutritionnel, "grade": grade, "details": details}


def _calculate_additives_score(
    product_data: Dict[str, Any], additifs_penalty_map: Dict[str, float]
) -> Dict[str, Any]:
    """Calcule le score additifs (0-30) via un malus plafonné selon le danger."""
    details: Dict[str, Any] = {}

    additives_from_product = {
        normalize_additive_tag(a)
        for a in product_data.get("additives_tags", []) or []
    }

    matched_add: Dict[str, Dict[str, Any]] = {}
    unknown_additifs: List[str] = []
    add_counts = {"low": 0, "moderate": 0, "high": 0}

    for add_code in additives_from_product:
        if not add_code:
            continue
        if add_code in additifs_penalty_map:
            danger = additifs_penalty_map[add_code]
            level = danger_level_to_level(danger)
            matched_add[add_code] = {"danger": danger, "level": level}
            add_counts[level] += 1
        else:
            unknown_additifs.append(add_code)

    # Logique de pénalité "couperet" (du plus grave au moins grave).
    malus = 0.0
    malus_reason = "Aucun additif à risque"

    if add_counts["high"] > 0:
        malus = 30.0
        malus_reason = "Additif(s) à risque élevé"
    elif normalize_nova(product_data) == 4:
        malus = 10.0
        malus_reason = "Produit ultra-transformé (NOVA 4)"
        if add_counts["moderate"] > 0:
            malus += 10.0
            malus_reason = "NOVA 4 + additifs modérés"
    elif add_counts["moderate"] >= 2:
        malus = 15.0
        malus_reason = "Plusieurs additifs à risque modéré"
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
    """Calcule le score bio (0 ou 10) selon les labels."""
    labels = {str(l).lower() for l in (product_data.get("labels_tags", []) or [])}
    bio_markers = {"en:organic", "organic", "fr:bio", "en:eu-organic", "fr:ab-agriculture-biologique"}
    is_bio = bool(labels & bio_markers)
    return {"score": 10.0 if is_bio else 0.0, "details": {"is_bio": is_bio}}


# =============================================================================
# 4. DÉTECTION DE CATÉGORIE
# =============================================================================


def _detect_category(product_data: Dict[str, Any]) -> Tuple[bool, str]:
    """Retourne (is_water, super_catégorie_technique).

    Agrège toutes les sources de catégorie (texte libre, tags, catégorie admin)
    en une chaîne de recherche unique, puis applique des mots-clés.
    """
    cat_string = str(product_data.get("categories", "") or "")
    cat_tags = product_data.get("categories_tags", []) or []
    main_cat = str(product_data.get("category", "") or "")
    type_specifique = str(product_data.get("typeSpecifique", "") or "")

    full_text = (
        cat_string + " " + " ".join(str(t) for t in cat_tags) + " " + main_cat + " " + type_specifique
    ).lower()

    if any(keyword in full_text for keyword in CAT_WATER):
        return True, "boissons"

    if any(keyword in full_text for keyword in CAT_FATS):
        return False, "matières grasses"
    if any(keyword in full_text for keyword in CAT_CHEESE):
        return False, "fromages"
    if any(keyword in full_text for keyword in CAT_BEVERAGES):
        return False, "boissons"
    return False, "solid"


# =============================================================================
# 5. FONCTION PRINCIPALE
# =============================================================================


async def calculate_score(db: AsyncSession, product_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calcule le score santé global (0-100) + la lettre Nutri-Score.

    Renvoie un dict : ``score`` (int 0-100), ``nutri_score`` (lettre a-e ou None),
    ``details`` et ``unknown_additifs``.
    """
    if not product_data:
        return {"score": 0, "nutri_score": None, "details": {"reason": "no product data"}, "unknown_additifs": []}

    is_water, category_technical = _detect_category(product_data)

    # Cas particulier : l'eau est la seule boisson recommandée à volonté.
    if is_water:
        return {
            "score": 100,
            "nutri_score": "a",
            "details": {
                "info": "L'eau est la seule boisson recommandée à volonté.",
                "nutrition_score": 60,
                "additives_score": 30,
                "bio_score": 10,
                "nutri_score": "a",
                "is_beverage": True,
                "TypeSpecifique": "boissons",
            },
            "unknown_additifs": [],
        }

    # Chargement des pénalités additifs (résilient : un échec n'annule pas le score).
    try:
        additifs_penalty_map = await crud.get_additifs_penalty(db)
    except Exception as exc:  # noqa: BLE001
        logger.error("Erreur chargement pénalités additifs: %s", exc)
        additifs_penalty_map = {}

    nutrition_res = _calculate_nutrition_score(product_data, category_technical)
    additives_res = _calculate_additives_score(product_data, additifs_penalty_map)
    bio_res = _calculate_bio_score(product_data)

    # Persistance des additifs inconnus pour revue admin ultérieure.
    unknown = additives_res.get("unknown", [])
    if unknown:
        try:
            await crud.store_or_increment_pending_additifs(db, unknown)
        except Exception as exc:  # noqa: BLE001
            logger.error("Erreur sauvegarde additifs inconnus: %s", exc)

    final_score = nutrition_res["score"] + additives_res["score"] + bio_res["score"]
    final_score = int(round(max(0.0, min(100.0, final_score))))

    nutri_grade = nutrition_res.get("grade")
    ecoscore = (product_data.get("ecoscore_grade") or "").lower()

    return {
        "score": final_score,
        "nutri_score": nutri_grade,
        "details": {
            "nutrition_score": round(nutrition_res["score"], 1),
            "additives_score": round(additives_res["score"], 1),
            "bio_score": round(bio_res["score"], 1),
            "nutrition_details": nutrition_res["details"],
            "additives_details": additives_res["details"],
            "bio_details": bio_res["details"],
            "nutri_score": nutri_grade,
            "nova_group": normalize_nova(product_data),
            "ecoscore_grade": ecoscore or "non-disponible",
            "TypeSpecifique": category_technical,
        },
        "unknown_additifs": unknown,
    }
