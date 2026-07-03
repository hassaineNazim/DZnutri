"""Moteur de scoring DZnutri — méthode « façon Yuka » sur Nutri-Score 2023.

Le score final est un score santé sur 100 composé, comme chez Yuka, de :
  - Qualité nutritionnelle : 0-60  (Nutri-Score 2023, barèmes officiels —
    validés composante par composante contre le calcul d'Open Food Facts)
  - Additifs               : 0-30  (le PIRE additif présent détermine la note,
    échelle DZnutri 1=risque limité, 2=modéré, 3=élevé)
  - Bio                    : 0-10  (bonus label bio officiel)

Règle « couperet » Yuka : la présence d'un additif à risque élevé (niveau 3)
plafonne la note globale à 49/100, quel que soit le reste.

En plus du score sur 100, on renvoie la **lettre Nutri-Score** (A-E) officielle
2023, dérivée du score de profilage (N - P), pour l'afficher dans l'app.

Principales différences avec l'ancien algorithme (Nutri-Score 2017) :
  - Sel noté en g (20 seuils) au lieu du sodium en mg (10 seuils) ;
  - Sucres : 15 seuils (plus sévère) ;
  - Protéines : 7 seuils, plus exigeants ; toujours comptées pour les boissons
    et fromages ; plafonnées à 2 points pour la viande rouge ;
  - Boissons : +4 points de malus si édulcorants ; le lait et les boissons
    végétales sont notés comme des boissons ; grille fruits dédiée (6 pts) ;
  - Matières grasses/oléagineux : énergie DES ACIDES GRAS SATURÉS (satfat x 37
    kJ/g) + ratio AGS/lipides ; grille de lettres décalée (A <= -6) ;
  - Le NOVA n'entre plus dans le score (Yuka ne l'utilise pas) mais reste
    renvoyé dans les détails pour l'affichage.

Points de robustesse conservés :
  - Normalisation des clés de nutriments (OpenFoodFacts utilise des tirets,
    le parser OCR maison des underscores) via ``_get_nutriment`` ;
  - Conversion sel/sodium correcte (sel_g = sodium_g x 2.5) ;
  - Échec du chargement des additifs ou de la persistance des additifs
    inconnus : le score reste calculable (dégradation douce).
"""

import logging
import re
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
    # Estimation % fruits/légumes/légumineuses (clés OFF, plusieurs générations)
    "fruits_pct": [
        "fruits-vegetables-legumes-estimate-from-ingredients_100g",
        "fruits-vegetables-nuts-estimate-from-ingredients_100g",
        "fruits-vegetables-nuts-estimate_100g",
        "fruits-vegetables-nuts_100g",
    ],
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


def _salt_g(nutriments: Dict[str, Any]) -> float:
    """Sel en g (le Nutri-Score 2023 note le SEL). Dérivé du sodium au besoin."""
    salt = _get_nutriment(nutriments, "salt")
    if salt is not None:
        return salt
    sodium = _get_nutriment(nutriments, "sodium")
    if sodium is not None:
        return sodium * 2.5  # sel = sodium x 2.5
    return 0.0


def _fruits_pct(product_data: Dict[str, Any], nutriments: Dict[str, Any]) -> float:
    """% de fruits/légumes/légumineuses : champ dédié ou estimation OFF."""
    explicit = product_data.get("fruits_percent")
    if explicit is not None:
        return to_float_safe(explicit)
    pct = _get_nutriment(nutriments, "fruits_pct")
    return pct if pct is not None else 0.0


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
    """Convertit un niveau de danger numérique (1-3) en libellé textuel."""
    try:
        v = int(d)
    except (ValueError, TypeError):
        v = 0
    if v >= 3:
        return "high"
    if v == 2:
        return "moderate"
    if v == 1:
        return "limited"
    return "none"


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
# 2. CONSTANTES ET SEUILS (Nutri-Score 2023)
# =============================================================================

# --- Détection de catégories spéciales (recherche par mots-clés) ---
CAT_WATER = ["eau", "water", "eau de source", "eau minérale", "mineral water", "spring water"]
CAT_BEVERAGES = [
    "boisson", "soda", "jus", "beverage", "tea", "thé", "coffee", "café",
    "nectar", "limonade", "lait", "milk", "smoothie", "drink",
]
# 2023 : la catégorie couvre matières grasses, huiles, NOIX et GRAINES.
CAT_FATS = [
    "huile", "matière grasse", "matières grasses", "fat", "mayonnaise",
    "beurre", "butter", "oil", "margarine", "noix", "nuts", "graines",
    "seeds", "amande", "almond", "cacahuète", "peanut", "noisette",
    "hazelnut", "pistache", "pistachio",
]
CAT_CHEESE = ["fromage", "cheese"]
# 2023 : produits à base de viande rouge (points protéines plafonnés à 2).
CAT_RED_MEAT = [
    "boeuf", "bœuf", "beef", "veau", "veal", "agneau", "lamb", "mouton",
    "mutton", "porc", "pork", "charcuterie", "saucisson", "jambon",
    "merguez", "cachir", "viande rouge", "red meat", "steak", "kefta",
    "chèvre (viande)", "gibier", "game meat", "cheval", "horse meat",
]

# --- Seuils ALIMENTS GÉNÉRAUX (composantes négatives N) ---
ENERGY_KJ_THRESHOLDS_SOLIDS = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]
SATFAT_G_THRESHOLDS_SOLIDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
SUGARS_G_THRESHOLDS_SOLIDS = [3.4, 6.8, 10, 14, 17, 20, 24, 27, 31, 34, 37, 41, 44, 48, 51]
SALT_G_THRESHOLDS = [
    0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0,
    2.2, 2.4, 2.6, 2.8, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0,
]

# --- Seuils ALIMENTS GÉNÉRAUX (composantes positives P) ---
FIBER_G_THRESHOLDS = [3.0, 4.1, 5.2, 6.3, 7.4]
PROTEIN_G_THRESHOLDS_SOLIDS = [2.4, 4.8, 7.2, 9.6, 12, 14, 17]
# Grille fruits/légumes/légumineuses (0,1,2,5) encodée en seuils répétés à 80.
FRUITS_PCT_THRESHOLDS_SOLIDS = [40, 60, 80, 80, 80]

# --- Seuils BOISSONS ---
ENERGY_KJ_THRESHOLDS_BEVERAGES = [30, 90, 150, 210, 240, 270, 300, 330, 360, 390]
SUGARS_G_THRESHOLDS_BEVERAGES = [0.5, 2, 3.5, 5, 6, 7, 8, 9, 10, 11]
PROTEIN_G_THRESHOLDS_BEVERAGES = [1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.0]
# Grille fruits boissons (0,2,4,6) encodée en seuils répétés.
FRUITS_PCT_THRESHOLDS_BEVERAGES = [40, 40, 60, 60, 80, 80]
SWEETENER_POINTS = 4  # malus fixe si édulcorants dans une boisson

# Édulcorants « non nutritifs » déclenchant le malus boissons (codes E).
NON_NUTRITIVE_SWEETENERS = {
    "e950", "e951", "e952", "e954", "e955", "e957", "e959",
    "e960", "e960a", "e960b", "e960c", "e960d", "e961", "e962", "e969",
}

# --- Seuils MATIÈRES GRASSES / OLÉAGINEUX ---
# Énergie provenant des acides gras saturés (satfat_g x 37 kJ/g).
ENERGY_FROM_SATFAT_KJ_THRESHOLDS = [120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200]
# Ratio AGS / lipides totaux, en %.
SATFAT_RATIO_THRESHOLDS = [10, 16, 22, 28, 34, 40, 46, 52, 58, 64]
KJ_PER_G_FAT = 37.0

# --- Grilles de notation (lettre A-E) à partir du score de profilage ---
# (seuil_max_inclus, lettre) ; première lettre dont le score est <= seuil.
NUTRISCORE_GRADES_SOLID = [(0, "a"), (2, "b"), (10, "c"), (18, "d"), (float("inf"), "e")]
NUTRISCORE_GRADES_BEVERAGE = [(2, "b"), (6, "c"), (9, "d"), (float("inf"), "e")]  # "a" = eau uniquement
NUTRISCORE_GRADES_FAT = [(-6, "a"), (2, "b"), (10, "c"), (18, "d"), (float("inf"), "e")]

# --- Conversion score de profilage -> sous-score nutrition /60 ---
# Interpolation linéaire par morceaux ANCRÉE SUR LES FRONTIÈRES DE LETTRES :
# le sous-score /60 reste ainsi toujours cohérent avec la lettre affichée
# (A ~ 48-60, B ~ 36-48, C ~ 24-36, D ~ 12-24, E ~ 0-12), comme chez Yuka où
# la jauge nutrition suit le Nutri-Score.
_SUB60_ANCHORS = {
    "solid": ([-17, 0, 2, 10, 18, 55], [60.0, 48.0, 36.0, 24.0, 12.0, 0.0]),
    "fat": ([-17, -6, 2, 10, 18, 55], [60.0, 48.0, 36.0, 24.0, 12.0, 0.0]),
    # Boissons : seule l'eau atteint 60 ; la meilleure boisson notée plafonne
    # en haut de la bande B.
    "beverage": ([-18, 2, 6, 9, 24], [54.0, 48.0, 36.0, 24.0, 0.0]),
}


def _fsa_to_grade(score: float, category: str) -> str:
    """Lettre Nutri-Score 2023 (a-e) à partir du score de profilage."""
    if category == "boissons":
        grid = NUTRISCORE_GRADES_BEVERAGE
    elif category == "matières grasses":
        grid = NUTRISCORE_GRADES_FAT
    else:
        grid = NUTRISCORE_GRADES_SOLID
    for ceiling, letter in grid:
        if score <= ceiling:
            return letter
    return "e"


def _fsa_to_sub60(score: float, category: str) -> float:
    """Sous-score nutrition /60 par interpolation ancrée sur les lettres."""
    if category == "boissons":
        xs, ys = _SUB60_ANCHORS["beverage"]
    elif category == "matières grasses":
        xs, ys = _SUB60_ANCHORS["fat"]
    else:
        xs, ys = _SUB60_ANCHORS["solid"]
    if score <= xs[0]:
        return ys[0]
    if score >= xs[-1]:
        return ys[-1]
    for i in range(1, len(xs)):
        if score <= xs[i]:
            frac = (score - xs[i - 1]) / (xs[i] - xs[i - 1])
            return ys[i - 1] + frac * (ys[i] - ys[i - 1])
    return ys[-1]


def _has_sweetener(product_data: Dict[str, Any]) -> bool:
    """Détecte la présence d'édulcorants (tags d'additifs ou texte ingrédients)."""
    additives = {
        normalize_additive_tag(a)
        for a in product_data.get("additives_tags", []) or []
    }
    if additives & NON_NUTRITIVE_SWEETENERS:
        return True
    ingredients = str(
        product_data.get("ingredients_text")
        or product_data.get("ocr_ingredients_text")
        or ""
    ).lower()
    return "édulcorant" in ingredients or "edulcorant" in ingredients or "sweetener" in ingredients


# =============================================================================
# 3. MOTEURS DE CALCUL
# =============================================================================


def _calculate_nutrition_score(
    product_data: Dict[str, Any], category: str, is_red_meat: bool
) -> Dict[str, Any]:
    """Calcule le score nutritionnel (0-60) + la lettre Nutri-Score 2023.

    Gère les 4 familles : aliments généraux, boissons, matières grasses /
    oléagineux, fromages (+ règle viande rouge sur les protéines).
    """
    details: Dict[str, Any] = {}
    nutriments = product_data.get("nutriments", {}) or {}

    is_beverage = category == "boissons"
    is_fat = category == "matières grasses"
    is_cheese = category == "fromages"

    # --- Composante énergie ---
    if is_fat:
        # 2023 : pour les matières grasses, on note l'énergie DES AGS.
        satfat_g = _get_nutriment(nutriments, "saturated_fat") or 0.0
        energy_value = satfat_g * KJ_PER_G_FAT
        n_energy = get_points_from_thresholds(energy_value, ENERGY_FROM_SATFAT_KJ_THRESHOLDS)
        details["energy_from_saturated_fat_kj"] = round(energy_value, 1)
    else:
        energy_value = _energy_kj(nutriments)
        thresholds = ENERGY_KJ_THRESHOLDS_BEVERAGES if is_beverage else ENERGY_KJ_THRESHOLDS_SOLIDS
        n_energy = get_points_from_thresholds(energy_value, thresholds)

    # --- Composante graisses saturées ---
    if is_fat:
        # Ratio AGS / lipides totaux.
        val_sat = _get_nutriment(nutriments, "saturated_fat") or 0.0
        val_lipids = _get_nutriment(nutriments, "fat") or 0.0
        ratio = (val_sat / val_lipids) * 100 if val_lipids > 0 else 0.0
        n_sat = get_points_from_thresholds(ratio, SATFAT_RATIO_THRESHOLDS)
        details["fat_ratio"] = round(ratio, 1)
    else:
        val_sat = _get_nutriment(nutriments, "saturated_fat") or 0.0
        n_sat = get_points_from_thresholds(val_sat, SATFAT_G_THRESHOLDS_SOLIDS)

    # --- Sucres ---
    sugars = _get_nutriment(nutriments, "sugars") or 0.0
    sugar_thresholds = SUGARS_G_THRESHOLDS_BEVERAGES if is_beverage else SUGARS_G_THRESHOLDS_SOLIDS
    n_sug = get_points_from_thresholds(sugars, sugar_thresholds)

    # --- Sel (en g, 2023) ---
    salt = _salt_g(nutriments)
    n_salt = get_points_from_thresholds(salt, SALT_G_THRESHOLDS)

    # --- Édulcorants (boissons uniquement, 2023) ---
    n_sweeteners = 0
    if is_beverage and _has_sweetener(product_data):
        n_sweeteners = SWEETENER_POINTS

    N = n_energy + n_sat + n_sug + n_salt + n_sweeteners

    # --- Composantes positives ---
    fiber = _get_nutriment(nutriments, "fiber") or 0.0
    protein = _get_nutriment(nutriments, "proteins") or 0.0
    fruits_pct = _fruits_pct(product_data, nutriments)

    p_fiber = get_points_from_thresholds(fiber, FIBER_G_THRESHOLDS)
    if is_beverage:
        p_protein = get_points_from_thresholds(protein, PROTEIN_G_THRESHOLDS_BEVERAGES)
        p_fruits = get_points_from_thresholds(fruits_pct, FRUITS_PCT_THRESHOLDS_BEVERAGES)
    else:
        p_protein = get_points_from_thresholds(protein, PROTEIN_G_THRESHOLDS_SOLIDS)
        p_fruits = get_points_from_thresholds(fruits_pct, FRUITS_PCT_THRESHOLDS_SOLIDS)

    # Règle 2023 : viande rouge -> points protéines plafonnés à 2.
    if is_red_meat and p_protein > 2:
        p_protein = 2
        details["red_meat_protein_cap"] = True

    # --- Règle 2023 de comptage des protéines ---
    # Toujours comptées pour les boissons et les fromages ; sinon exclues quand
    # les points négatifs atteignent 11 (aliments) ou 7 (matières grasses).
    if is_beverage or is_cheese:
        count_proteins = True
    elif is_fat:
        count_proteins = N < 7
    else:
        count_proteins = N < 11

    P = p_fiber + p_fruits + (p_protein if count_proteins else 0)
    fsa_value = N - P

    grade = _fsa_to_grade(fsa_value, category)
    score_nutritionnel = _fsa_to_sub60(fsa_value, category)

    details.update(
        {
            "algorithm": "nutriscore-2023",
            "N_total": N,
            "P_total": P,
            "fsa_value": fsa_value,
            "count_proteins": count_proteins,
            "components": {
                "energy": n_energy,
                "saturated_fat": n_sat,
                "sugars": n_sug,
                "salt": n_salt,
                "sweeteners": n_sweeteners,
                "fiber": p_fiber,
                "proteins": p_protein,
                "fruits": p_fruits,
            },
            "grade": grade,
            "is_beverage": is_beverage,
            "is_fat": is_fat,
            "is_cheese": is_cheese,
            "is_red_meat": is_red_meat,
        }
    )
    return {"score": score_nutritionnel, "grade": grade, "details": details}


def _calculate_additives_score(
    product_data: Dict[str, Any], additifs_penalty_map: Dict[str, float]
) -> Dict[str, Any]:
    """Calcule le score additifs (0-30), logique Yuka : le pire additif prime.

    - risque élevé (3)   : 0/30 + plafonnement de la note globale à 49 ;
    - risque modéré (2)  : 12/30 (un seul) ou 6/30 (plusieurs) ;
    - risque limité (1)  : 24/30 (un seul) ou 18/30 (plusieurs) ;
    - aucun additif à risque : 30/30.
    """
    details: Dict[str, Any] = {}

    additives_from_product = {
        normalize_additive_tag(a)
        for a in product_data.get("additives_tags", []) or []
    }

    matched_add: Dict[str, Dict[str, Any]] = {}
    unknown_additifs: List[str] = []
    add_counts = {"none": 0, "limited": 0, "moderate": 0, "high": 0}

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

    caps_global_score = False
    if add_counts["high"] > 0:
        score_additifs = 0.0
        caps_global_score = True
        malus_reason = "Additif(s) à risque élevé (note plafonnée à 49)"
    elif add_counts["moderate"] >= 2:
        score_additifs = 6.0
        malus_reason = "Plusieurs additifs à risque modéré"
    elif add_counts["moderate"] == 1:
        score_additifs = 12.0
        malus_reason = "Un additif à risque modéré"
    elif add_counts["limited"] >= 2:
        score_additifs = 18.0
        malus_reason = "Plusieurs additifs à risque limité"
    elif add_counts["limited"] == 1:
        score_additifs = 24.0
        malus_reason = "Un additif à risque limité"
    else:
        score_additifs = 30.0
        malus_reason = "Aucun additif à risque"

    details.update(
        {
            "matched": matched_add,
            "counts": add_counts,
            "malus_reason": malus_reason,
            "caps_global_score": caps_global_score,
        }
    )
    return {
        "score": score_additifs,
        "details": details,
        "unknown": unknown_additifs,
        "caps_global_score": caps_global_score,
    }


def _calculate_bio_score(product_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calcule le score bio (0 ou 10) selon les labels officiels."""
    labels = {str(l).lower() for l in (product_data.get("labels_tags", []) or [])}
    bio_markers = {"en:organic", "organic", "bio", "fr:bio", "en:eu-organic", "fr:ab-agriculture-biologique"}
    is_bio = bool(labels & bio_markers) or any(
        "organic" in label or "biologique" in label for label in labels
    )
    return {"score": 10.0 if is_bio else 0.0, "details": {"is_bio": is_bio}}


# =============================================================================
# 4. DÉTECTION DE CATÉGORIE
# =============================================================================


def _keywords_regex(keywords: List[str]) -> "re.Pattern[str]":
    """Compile une liste de mots-clés en regex à LIMITES DE MOTS.

    Indispensable : une recherche en sous-chaîne faisait matcher « eau » dans
    « gâteau » -> n'importe quel gâteau était détecté comme de l'eau (100/100).
    Un pluriel simple (s/x final) reste accepté : « boissons », « eaux »...
    """
    alternatives = "|".join(re.escape(k) for k in keywords)
    return re.compile(rf"\b(?:{alternatives})(?:s|x)?\b")


_RE_WATER = _keywords_regex(CAT_WATER)
_RE_FATS = _keywords_regex(CAT_FATS)
_RE_CHEESE = _keywords_regex(CAT_CHEESE)
_RE_BEVERAGES = _keywords_regex(CAT_BEVERAGES)
_RE_RED_MEAT = _keywords_regex(CAT_RED_MEAT)


def _detect_category(product_data: Dict[str, Any]) -> Tuple[bool, str, bool]:
    """Retourne (is_water, super_catégorie_technique, is_red_meat).

    Agrège toutes les sources de catégorie (texte libre, tags, catégorie admin)
    en une chaîne de recherche unique, puis applique des mots-clés entiers.
    """
    cat_string = str(product_data.get("categories", "") or "")
    cat_tags = product_data.get("categories_tags", []) or []
    main_cat = str(product_data.get("category", "") or "")
    type_specifique = str(product_data.get("typeSpecifique", "") or "")

    full_text = (
        cat_string + " " + " ".join(str(t) for t in cat_tags) + " " + main_cat + " " + type_specifique
    ).lower().replace(":", " ").replace("-", " ")

    is_red_meat = bool(_RE_RED_MEAT.search(full_text))

    if _RE_WATER.search(full_text):
        # Garde-fou : une « eau » qui contient sucres ou additifs (eau aromatisée
        # sucrée...) n'est pas de l'eau pure -> notée comme une boisson normale.
        nutriments = product_data.get("nutriments", {}) or {}
        sugars = _get_nutriment(nutriments, "sugars") or 0.0
        has_additives = bool(product_data.get("additives_tags"))
        if sugars <= 0 and not has_additives:
            return True, "boissons", False
        return False, "boissons", is_red_meat

    if _RE_FATS.search(full_text):
        return False, "matières grasses", is_red_meat
    if _RE_CHEESE.search(full_text):
        return False, "fromages", is_red_meat
    if _RE_BEVERAGES.search(full_text):
        return False, "boissons", is_red_meat
    return False, "solid", is_red_meat


# =============================================================================
# 5. FONCTION PRINCIPALE
# =============================================================================


async def calculate_score(db: AsyncSession, product_data: Dict[str, Any]) -> Dict[str, Any]:
    """Calcule le score santé global (0-100) + la lettre Nutri-Score 2023.

    Renvoie un dict : ``score`` (int 0-100), ``nutri_score`` (lettre a-e ou None),
    ``details`` et ``unknown_additifs``.
    """
    if not product_data:
        return {"score": 0, "nutri_score": None, "details": {"reason": "no product data"}, "unknown_additifs": []}

    is_water, category_technical, is_red_meat = _detect_category(product_data)

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

    nutrition_res = _calculate_nutrition_score(product_data, category_technical, is_red_meat)
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

    # Règle « couperet » Yuka : un additif à risque élevé plafonne la note à 49.
    score_capped = False
    if additives_res.get("caps_global_score") and final_score > 49:
        final_score = 49.0
        score_capped = True

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
            "score_capped_at_49": score_capped,
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
