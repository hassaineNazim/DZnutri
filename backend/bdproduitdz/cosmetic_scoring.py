"""Scoring cosmétique façon Yuka : note 0-100 basée sur les ingrédients à risque.

Principe (parallèle aux additifs alimentaires) :
- On charge le référentiel `cosmetic_ingredients` (petit, mis en cache mémoire).
- On repère, dans la liste INCI du produit, les ingrédients à risque présents.
- Chaque ingrédient applique une pénalité selon son `danger_level`.
- Score = 100 - somme des pénalités (borné à [0, 100]).

Si la liste d'ingrédients est inconnue, le score vaut None (« analyse
indisponible ») plutôt qu'une note trompeuse.
"""

import logging
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from bdproduitdz import models

logger = logging.getLogger("dznutri.cosmetic_scoring")

# Pénalité par niveau de danger (1 faible, 2 modéré, 3 élevé).
_PENALTY = {1: 6, 2: 14, 3: 28}

# Cache mémoire du référentiel (rarement modifié ; invalidé après édition admin).
_reference_cache: list | None = None


def invalidate_cache() -> None:
    """À appeler après une modification du référentiel d'ingrédients."""
    global _reference_cache
    _reference_cache = None


async def _load_reference(db: AsyncSession) -> list:
    global _reference_cache
    if _reference_cache is None:
        rows = (await db.execute(select(models.CosmeticIngredient))).scalars().all()
        _reference_cache = []
        for r in rows:
            name = (r.name or "").lower().strip()
            if not name:
                continue
            # Matching par FRONTIÈRE DE MOT (\b) et non par sous-chaîne : évite
            # que "ethylparaben" soit faussement détecté dans "methylparaben".
            pattern = re.compile(r"\b" + re.escape(name) + r"\b")
            _reference_cache.append((pattern, name, int(r.danger_level or 1), r.concern))
    return _reference_cache


def _grade(score: int) -> str:
    if score >= 75:
        return "excellent"
    if score >= 50:
        return "bon"
    if score >= 25:
        return "mediocre"
    return "mauvais"


async def calculate_cosmetic_score(db: AsyncSession, ingredients_text: str | None) -> dict:
    """Calcule le score d'un cosmétique à partir de sa liste INCI.

    Renvoie {"score": int|None, "risky_ingredients": [...], "details": {...}}.
    """
    text = (ingredients_text or "").lower()
    risky: list[dict] = []

    if text:
        for pattern, name, level, concern in await _load_reference(db):
            if pattern.search(text):
                risky.append({"name": name, "danger_level": level, "concern": concern})

    penalty = sum(_PENALTY.get(r["danger_level"], 6) for r in risky)
    score = max(0, 100 - penalty) if text else None

    details = {
        "analyzed": bool(text),
        "risky_count": len(risky),
        "penalty": penalty,
        "grade": _grade(score) if score is not None else None,
    }
    return {"score": score, "risky_ingredients": risky, "details": details}
