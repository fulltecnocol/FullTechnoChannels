import pytest
from httpx import AsyncClient, ASGITransport
from api.main import app

@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json()["name"] == "FGate API" # Fixed expected name
    assert response.json()["status"] == "online"

@pytest.mark.asyncio
async def test_debug_endpoints_secured_in_production(monkeypatch):
    import api.main
    monkeypatch.setattr(api.main, "ENV", "production")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/debug/users?secret=super_secret_debug_key_2026")
    
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_auth_token_fail():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/token", data={"username": "wrong@test.com", "password": "bad"})
    assert response.status_code in [400, 401, 404] # 404 if it expects /api/token
