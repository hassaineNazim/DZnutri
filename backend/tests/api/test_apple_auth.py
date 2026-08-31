import pytest
from httpx import AsyncClient

from auth import apple as apple_auth
from routers import auth as auth_router


def test_apple_refresh_token_encryption_round_trip(monkeypatch):
    monkeypatch.setenv("APPLE_TOKEN_ENCRYPTION_KEY", "test-secret-that-is-longer-than-thirty-two-characters")
    encrypted = apple_auth.encrypt_refresh_token("apple-refresh-token")

    assert encrypted != "apple-refresh-token"
    assert apple_auth.decrypt_refresh_token(encrypted) == "apple-refresh-token"


@pytest.mark.asyncio
async def test_apple_login_stores_revocable_token_and_deletes_account(
    client: AsyncClient,
    monkeypatch,
):
    monkeypatch.setenv("APPLE_TOKEN_ENCRYPTION_KEY", "test-secret-that-is-longer-than-thirty-two-characters")

    verify_calls = []

    async def fake_verify(_identity_token: str, *, access_token: str | None = None) -> dict:
        verify_calls.append((_identity_token, access_token))
        return {"sub": "apple-user-123", "email": "apple-user@example.com"}

    async def fake_exchange(_authorization_code: str) -> apple_auth.AppleTokenSet:
        return apple_auth.AppleTokenSet(
            refresh_token="apple-refresh-token",
            identity_token="identity-token-returned-by-apple",
            access_token="apple-access-token",
        )

    revoked = []

    async def fake_revoke(encrypted_token: str) -> None:
        revoked.append(apple_auth.decrypt_refresh_token(encrypted_token))

    monkeypatch.setattr(auth_router, "_verify_apple_identity_token", fake_verify)
    monkeypatch.setattr(apple_auth, "exchange_authorization_code", fake_exchange)
    monkeypatch.setattr(apple_auth, "revoke_stored_refresh_token", fake_revoke)

    login_response = await client.post(
        "/auth/apple",
        json={
            "identity_token": "identity-token-for-tests",
            "authorization_code": "authorization-code-for-tests",
            "full_name": "Utilisateur Apple",
        },
    )
    assert login_response.status_code == 200
    assert verify_calls == [
        ("identity-token-for-tests", None),
        ("identity-token-returned-by-apple", "apple-access-token"),
    ]

    access_token = login_response.json()["access_token"]
    delete_response = await client.delete(
        "/auth/account",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert delete_response.status_code == 200
    assert revoked == ["apple-refresh-token"]


@pytest.mark.asyncio
async def test_apple_login_requires_authorization_code(client: AsyncClient):
    response = await client.post(
        "/auth/apple",
        json={"identity_token": "identity-token-for-tests"},
    )
    assert response.status_code == 422
