"""Tests du moteur de scoring (Nutri-Score 2023 + logique Yuka).

Les produits de référence (Nutella, huile d'olive, Coca...) sont validés
contre le calcul officiel d'Open Food Facts : les points par composante et la
lettre attendue proviennent de leurs données réelles (algorithme 2023).
"""

import pytest

from bdproduitdz import scoring


@pytest.fixture(autouse=True)
def stub_crud(monkeypatch):
    """Isole le scoring de la base : pénalités d'additifs injectées en dur."""

    async def fake_penalties(db):
        return {
            "e330": 1,   # acide citrique — risque limité
            "e202": 1,   # sorbate de potassium — risque limité
            "e322": 1,   # lécithines — risque limité
            "e471": 2,   # mono/diglycérides — risque modéré
            "e150d": 2,  # caramel au sulfite d'ammonium — risque modéré
            "e951": 3,   # aspartame — risque élevé
            "e250": 3,   # nitrite de sodium — risque élevé
        }

    async def fake_store(db, codes):
        return None

    monkeypatch.setattr(scoring.crud, "get_additifs_penalty", fake_penalties)
    monkeypatch.setattr(scoring.crud, "store_or_increment_pending_additifs", fake_store)


# ---------------------------------------------------------------------------
# Cas particuliers
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_water_is_100():
    res = await scoring.calculate_score(None, {"category": "eau minérale", "nutriments": {}})
    assert res["score"] == 100
    assert res["nutri_score"] == "a"


@pytest.mark.asyncio
async def test_empty_product():
    res = await scoring.calculate_score(None, {})
    assert res["score"] == 0


@pytest.mark.asyncio
async def test_cake_is_not_water():
    """Régression : « gâteau » contient « eau » — il ne doit PAS être scoré 100."""
    product = {
        "category": "gâteaux",
        "nutriments": {"energy-kj_100g": 1800, "sugars_100g": 35, "saturated-fat_100g": 8},
    }
    res = await scoring.calculate_score(None, product)
    assert res["score"] < 100
    assert res["details"]["nutrition_details"]["is_beverage"] is False


@pytest.mark.asyncio
async def test_sweetened_water_is_not_pure_water():
    """Une « eau aromatisée » sucrée est notée comme une boisson, pas 100/100."""
    product = {
        "category": "eau aromatisée",
        "nutriments": {"energy-kj_100g": 100, "sugars_100g": 4.5},
    }
    res = await scoring.calculate_score(None, product)
    assert res["score"] < 100
    assert res["details"]["nutrition_details"]["is_beverage"] is True


@pytest.mark.asyncio
async def test_plural_category_detection():
    """Les pluriels restent détectés (« boissons » -> algorithme boissons)."""
    product = {"category": "boissons", "nutriments": {"sugars_100g": 9}}
    res = await scoring.calculate_score(None, product)
    assert res["details"]["nutrition_details"]["is_beverage"] is True


# ---------------------------------------------------------------------------
# Nutri-Score 2023 — produits de référence (points vérifiés contre OFF)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_nutella_grade_e():
    """Nutella (OFF 3017620422003) : N=31, P=1 (protéines exclues), score 30 -> E."""
    product = {
        "category": "pâte à tartiner",
        "nutriments": {
            "energy-kj_100g": 2252,
            "sugars_100g": 56.3,
            "saturated-fat_100g": 10.6,
            "salt_100g": 0.107,
            "fiber_100g": 3.68,
            "proteins_100g": 6.3,
        },
        "additives_tags": ["en:e322"],
    }
    res = await scoring.calculate_score(None, product)
    comp = res["details"]["nutrition_details"]["components"]
    assert comp["energy"] == 6
    assert comp["sugars"] == 15
    assert comp["saturated_fat"] == 10
    assert comp["salt"] == 0
    assert comp["fiber"] == 1
    assert res["details"]["nutrition_details"]["count_proteins"] is False
    assert res["details"]["nutrition_details"]["fsa_value"] == 30
    assert res["nutri_score"] == "e"
    assert res["score"] < 50


@pytest.mark.asyncio
async def test_olive_oil_grade_b():
    """Huile d'olive (validée OFF) : énergie AGS 444 kJ -> 3 pts, ratio 13% -> 1 pt,
    fruits 100% -> 5 pts, score -1 -> B (le 2017 la classait C)."""
    product = {
        "category": "huile d'olive vierge extra",
        "nutriments": {
            "fat_100g": 92,
            "saturated-fat_100g": 12,
            "sugars_100g": 0,
            "salt_100g": 0,
            "proteins_100g": 0,
            "fruits-vegetables-nuts-estimate-from-ingredients_100g": 100,
        },
    }
    res = await scoring.calculate_score(None, product)
    nd = res["details"]["nutrition_details"]
    assert nd["is_fat"] is True
    assert nd["components"]["energy"] == 3          # 444 kJ d'AGS
    assert nd["components"]["saturated_fat"] == 1   # ratio 13%
    assert nd["components"]["fruits"] == 5
    assert nd["fsa_value"] == -1
    assert res["nutri_score"] == "b"


@pytest.mark.asyncio
async def test_coca_cola_grade_e():
    """Coca-Cola (180 kJ, 10.6 g sucres /100ml) : N=12 -> E en 2023."""
    product = {
        "category": "soda",
        "nutriments": {"energy-kj_100g": 180, "sugars_100g": 10.6, "salt_100g": 0},
        "additives_tags": ["en:e150d", "en:e338"],
    }
    res = await scoring.calculate_score(None, product)
    nd = res["details"]["nutrition_details"]
    assert nd["is_beverage"] is True
    assert nd["components"]["energy"] == 3
    assert nd["components"]["sugars"] == 9
    assert nd["fsa_value"] == 12
    assert res["nutri_score"] == "e"


@pytest.mark.asyncio
async def test_diet_soda_sweetener_malus():
    """Soda light : quasi 0 kcal mais +4 pts édulcorants -> C (nouveauté 2023),
    et aspartame = additif risque élevé -> note globale plafonnée."""
    product = {
        "category": "soda light",
        "nutriments": {"energy-kj_100g": 1, "sugars_100g": 0, "salt_100g": 0.02},
        "additives_tags": ["en:e951", "en:e950"],
    }
    res = await scoring.calculate_score(None, product)
    nd = res["details"]["nutrition_details"]
    assert nd["components"]["sweeteners"] == 4
    assert nd["fsa_value"] == 4
    assert res["nutri_score"] == "c"
    assert res["details"]["additives_score"] == 0
    assert res["details"]["score_capped_at_49"] in (True, False)  # plafonné seulement si > 49
    assert res["score"] <= 49


@pytest.mark.asyncio
async def test_beverage_grade_a_reserved_to_water():
    """Une boisson parfaite (0 partout) ne peut pas dépasser B : A = eau."""
    product = {"category": "boisson", "nutriments": {"energy-kj_100g": 0, "sugars_100g": 0}}
    res = await scoring.calculate_score(None, product)
    assert res["nutri_score"] == "b"


@pytest.mark.asyncio
async def test_red_meat_protein_cap():
    """Viande rouge : points protéines plafonnés à 2 (règle 2023)."""
    product = {
        "category": "boeuf haché",
        "nutriments": {
            "energy-kj_100g": 700,
            "saturated-fat_100g": 3,
            "sugars_100g": 0,
            "salt_100g": 0.1,
            "proteins_100g": 26,   # donnerait 7 pts sans plafond
        },
    }
    res = await scoring.calculate_score(None, product)
    nd = res["details"]["nutrition_details"]
    assert nd["is_red_meat"] is True
    assert nd["components"]["proteins"] == 2
    assert nd.get("red_meat_protein_cap") is True


@pytest.mark.asyncio
async def test_salt_2023_more_severe():
    """Sel 2023 : 20 seuils en g. 4 g de sel -> 19 pts (2017 : 10 pts max)."""
    product = {"category": "plat", "nutriments": {"salt_100g": 4.0}}
    res = await scoring.calculate_score(None, product)
    assert res["details"]["nutrition_details"]["components"]["salt"] == 19


# ---------------------------------------------------------------------------
# Additifs — logique Yuka (pire additif + plafond 49)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_high_risk_additive_caps_score_at_49():
    """Un produit nutritionnellement parfait + additif risque élevé <= 49."""
    product = {
        "category": "légumes",
        "nutriments": {"fiber_100g": 8, "proteins_100g": 5},
        "fruits_percent": 100,
        "labels_tags": ["en:organic"],   # même bio, le plafond s'applique
        "additives_tags": ["en:e250"],
    }
    res = await scoring.calculate_score(None, product)
    assert res["details"]["additives_score"] == 0
    assert res["details"]["score_capped_at_49"] is True
    assert res["score"] == 49


@pytest.mark.asyncio
async def test_moderate_additive_penalty():
    product = {"category": "biscuits", "nutriments": {}, "additives_tags": ["en:e471"]}
    res = await scoring.calculate_score(None, product)
    assert res["details"]["additives_score"] == 12.0


@pytest.mark.asyncio
async def test_limited_additive_penalty():
    product = {"category": "conserve", "nutriments": {}, "additives_tags": ["en:e330"]}
    res = await scoring.calculate_score(None, product)
    assert res["details"]["additives_score"] == 24.0


@pytest.mark.asyncio
async def test_no_additives_full_score():
    product = {"category": "légumes", "nutriments": {}, "additives_tags": []}
    res = await scoring.calculate_score(None, product)
    assert res["details"]["additives_score"] == 30.0


@pytest.mark.asyncio
async def test_unknown_additives_reported():
    product = {"category": "plat", "nutriments": {}, "additives_tags": ["en:e999"]}
    res = await scoring.calculate_score(None, product)
    assert res["unknown_additifs"] == ["e999"]


# ---------------------------------------------------------------------------
# Bio
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_bio_bonus():
    product = {"category": "céréales", "nutriments": {}, "labels_tags": ["fr:ab-agriculture-biologique"]}
    res = await scoring.calculate_score(None, product)
    assert res["details"]["bio_score"] == 10.0


@pytest.mark.asyncio
async def test_no_bio_no_bonus():
    product = {"category": "céréales", "nutriments": {}, "labels_tags": ["en:vegetarian"]}
    res = await scoring.calculate_score(None, product)
    assert res["details"]["bio_score"] == 0.0


# ---------------------------------------------------------------------------
# Robustesse (clés OCR avec underscores, sodium seul, kcal seul)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_ocr_underscore_keys_are_read():
    """Le parser OCR maison produit des clés underscore : elles doivent compter."""
    product = {
        "category": "snack",
        "nutriments": {"energy_kcal_100g": 550, "saturated_fat_100g": 12, "sugars_100g": 40},
    }
    res = await scoring.calculate_score(None, product)
    comp = res["details"]["nutrition_details"]["components"]
    assert comp["energy"] > 0
    assert comp["saturated_fat"] == 10
    assert comp["sugars"] > 0


@pytest.mark.asyncio
async def test_sodium_fallback_to_salt():
    """Sodium 0.4 g -> sel 1.0 g -> 4 points (seuils 2023)."""
    product = {"category": "plat", "nutriments": {"sodium_100g": 0.4}}
    res = await scoring.calculate_score(None, product)
    assert res["details"]["nutrition_details"]["components"]["salt"] == 4
