import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "dznutri-api"}

@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    # 1. Register a new user
    user_data = {
        "email": "testuser_workflow@example.com",
        "username": "testuser_workflow",
        "password": "testpassword123",
        "confirm_password": "testpassword123"
    }
    register_response = await client.post("/auth/register", json=user_data)
    
    # Check if registration is successful (200 or 201)
    assert register_response.status_code in [200, 201]

    # 2. Login
    login_data = {
        "email": "testuser_workflow@example.com",
        "password": "testpassword123"
    }
    login_response = await client.post("/auth/login", json=login_data)
    
    assert login_response.status_code == 200
    data = login_response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_user_can_delete_own_account(client: AsyncClient):
    email = "delete-me@example.com"
    register_response = await client.post(
        "/auth/register",
        json={"email": email, "username": "delete_me", "password": "testpassword123"},
    )
    assert register_response.status_code == 200
    token = register_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    delete_response = await client.delete("/auth/account", headers=headers)
    assert delete_response.status_code == 200

    login_response = await client.post(
        "/auth/login",
        json={"email": email, "password": "testpassword123"},
    )
    assert login_response.status_code == 401
