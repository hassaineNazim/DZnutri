"""Détection d'additifs dans un texte OCR, avec référentiel mis en cache.

La table `additifs` est un RÉFÉRENTIEL qui change très rarement. L'ancienne
version la rechargeait ENTIÈREMENT à chaque soumission (`SELECT * additifs`)
puis recompilait une regex par nom d'additif — coûteux et inutile à chaque OCR.

On met désormais en cache, par processus, les structures de matching dérivées
(map des codes normalisés + regex de noms précompilées). Le cache est invalidé
via `invalidate_additifs_cache()`, elle-même appelée par
`crud.invalidate_additifs_cache()` (rescoring / mise à jour du référentiel).
"""
from __future__ import annotations

import re
from collections import namedtuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from . import models

# Vue immuable d'un additif : données pures, NON liées à une session SQLAlchemy
# (indispensable pour un cache partagé entre requêtes/sessions).
_Additif = namedtuple("_Additif", ["id", "e_number", "name", "danger_level"])

# Pattern des codes E / SIN / INS : constant -> compilé une seule fois.
# Ex : "SIN 503", "E-330", "INS407a".
_CODE_PATTERN = re.compile(
    r"\b(?:E|SIN|INS|SIN\.|INS\.)\s*[-]?\s*(\d{3,4}[a-z]?)\b",
    re.IGNORECASE,
)

# Cache par processus : {"code_map": {code: _Additif}, "names": [(_Additif, regex)]}.
_cache: dict | None = None


def invalidate_additifs_cache() -> None:
    """Vide le cache du référentiel (après modification des additifs)."""
    global _cache
    _cache = None


async def _load_reference(db: AsyncSession) -> dict:
    """Charge (une seule fois) le référentiel et prépare le matching.

    - `code_map` : E322 / SIN322 / INS322 -> additif, pour un lookup O(1).
    - `names`    : liste (additif, regex de nom précompilée) pour le repli par nom.
    """
    global _cache
    if _cache is None:
        rows = (await db.execute(select(models.Additif))).scalars().all()
        code_map: dict[str, _Additif] = {}
        names: list[tuple[_Additif, "re.Pattern[str]"]] = []
        for add in rows:
            item = _Additif(add.id, add.e_number, add.name, add.danger_level)
            if add.name:
                names.append(
                    (item, re.compile(r"\b" + re.escape(add.name) + r"\b", re.IGNORECASE))
                )
            # e_number est nullable : on ne mappe par code que s'il existe.
            if not add.e_number:
                continue
            code = str(add.e_number).upper()
            number_part = code[1:] if code.startswith("E") else code
            code_map[code] = item
            code_map[f"SIN{number_part}"] = item
            code_map[f"INS{number_part}"] = item
        _cache = {"code_map": code_map, "names": names}
    return _cache


async def find_additives_in_text(db: AsyncSession, ocr_text: str):
    """Cherche des additifs dans un texte (codes E/SIN/INS puis noms).

    Renvoie une liste d'objets légers exposant `.e_number`, `.name`,
    `.danger_level` (et `.id`), consommés tels quels par l'appelant.
    """
    if not ocr_text:
        return []

    ref = await _load_reference(db)
    code_map: dict = ref["code_map"]
    names: list = ref["names"]

    found = []
    found_ids: set[int] = set()

    # 1) Recherche par CODE (E330, SIN 503, INS407a...).
    for match in _CODE_PATTERN.finditer(ocr_text):
        number_part = match.group(1).upper()
        for key in (f"E{number_part}", f"SIN{number_part}", f"INS{number_part}"):
            item = code_map.get(key)
            if item and item.id not in found_ids:
                found.append(item)
                found_ids.add(item.id)
                break

    # 2) Recherche par NOM (complément : "Gomme Xanthane" sans code).
    for item, pattern in names:
        if item.id in found_ids:
            continue
        if pattern.search(ocr_text):
            found.append(item)
            found_ids.add(item.id)

    return found
