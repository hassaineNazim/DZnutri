import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_rate_product_upsert_and_summary(client: AsyncClient):
    """Workflow notes : register -> noter -> re-noter (upsert) -> résumé.

    Tourne sur SQLite (conftest) : garantit que l'upsert des notes reste
    portable (pas de dépendance au dialecte PostgreSQL).
    """
    # 1. Un utilisateur authentifié
    register = await client.post("/auth/register", json={
        "email": "rater@example.com",
        "username": "rater",
        "password": "testpassword123",
    })
    assert register.status_code == 200
    headers = {"Authorization": f"Bearer {register.json()['access_token']}"}

    # 2. Produit encore jamais noté -> résumé vide
    empty = await client.get("/api/product/619000000001/ratings", headers=headers)
    assert empty.status_code == 200
    assert empty.json() == {
        "average": None, "count": 0, "my_rating": None, "my_comment": None, "ratings": [],
    }

    # 3. Première note
    first = await client.post(
        "/api/product/619000000001/ratings",
        json={"rating": 4, "comment": "Bon produit"},
        headers=headers,
    )
    assert first.status_code == 200
    data = first.json()
    assert data["average"] == 4 and data["count"] == 1
    assert data["my_rating"] == 4 and data["my_comment"] == "Bon produit"
    assert data["ratings"][0]["username"] == "rater"

    # 4. Re-noter = UPSERT (pas de doublon, valeurs mises à jour)
    second = await client.post(
        "/api/product/619000000001/ratings",
        json={"rating": 2, "comment": "Déçu finalement"},
        headers=headers,
    )
    assert second.status_code == 200
    data = second.json()
    assert data["count"] == 1, "re-noter ne doit pas créer une 2e ligne"
    assert data["average"] == 2 and data["my_rating"] == 2

    # 5. Note hors bornes -> 422 (validation Pydantic)
    invalid = await client.post(
        "/api/product/619000000001/ratings", json={"rating": 6}, headers=headers,
    )
    assert invalid.status_code == 422

    # 6. Sans authentification -> 401
    anonymous = await client.get("/api/product/619000000001/ratings")
    assert anonymous.status_code == 401
