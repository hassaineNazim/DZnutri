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
