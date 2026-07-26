import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_report_upload_is_authenticated_and_validated(client: AsyncClient):
    payload = {
        "barcode": "GENERAL_ISSUE",
        "type": "userreportapp",
        "description": "Le scanner ne reconnaît pas ce produit.",
    }

    anonymous = await client.post("/api/reports/with-image", data=payload)
    assert anonymous.status_code == 401

    register = await client.post(
        "/auth/register",
        json={
            "email": "reporter@example.com",
            "username": "reporter",
            "password": "testpassword123",
        },
    )
    assert register.status_code == 200
    headers = {"Authorization": f"Bearer {register.json()['access_token']}"}

    invalid_type = await client.post(
        "/api/reports/with-image",
        data=payload,
        files={"image": ("evidence.txt", b"not an image", "text/plain")},
        headers=headers,
    )
    assert invalid_type.status_code == 415

    spoofed_image = await client.post(
        "/api/reports/with-image",
        data=payload,
        files={"image": ("fake.jpg", b"not really a jpeg", "image/jpeg")},
        headers=headers,
    )
    assert spoofed_image.status_code == 415

    without_image = await client.post(
        "/api/reports/with-image",
        data=payload,
        headers=headers,
    )
    assert without_image.status_code == 200
    assert without_image.json()["image_url"] is None
    assert without_image.json()["description"] == payload["description"]
