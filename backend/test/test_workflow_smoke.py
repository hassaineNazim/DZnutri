"""Smoke test end-to-end des workflows utilisateur sur le serveur lancé.

Lance le serveur (uvicorn) puis :
    .venv\\Scripts\\python.exe test\\test_workflow_smoke.py

Crée un utilisateur de test, déroule historique/favoris/notifications, puis
SUPPRIME l'utilisateur de test et ses lignes liées pour ne pas polluer la base.
"""
import asyncio
import os
import sys
import time

import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE = "http://127.0.0.1:8000"
TEST_USERNAME = f"smoke_test_{int(time.time())}"
TEST_EMAIL = f"{TEST_USERNAME}@dznutri-test.com"
TEST_PASSWORD = "SmokeTest123!"
BARCODE = "3017620422003"  # déjà en base locale (Nutella)

results = []


def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(f"[{'OK ' if ok else 'FAIL'}] {name} {detail}")


async def cleanup_user():
    """Supprime l'utilisateur de test et ses lignes dépendantes."""
    from sqlalchemy import text
    from database import engine
    async with engine.begin() as conn:
        row = await conn.execute(
            text("SELECT id FROM users WHERE username = :u"), {"u": TEST_USERNAME}
        )
        uid = row.scalar()
        if uid is not None:
            for tbl in ("scan_history", "favorites", "notifications"):
                await conn.execute(text(f"DELETE FROM {tbl} WHERE user_id = :id"), {"id": uid})
            await conn.execute(text("DELETE FROM users WHERE id = :id"), {"id": uid})
    await engine.dispose()


async def main():
    async with httpx.AsyncClient(base_url=BASE, timeout=30) as c:
        # 1. Register
        r = await c.post("/auth/register", json={
            "username": TEST_USERNAME, "email": TEST_EMAIL, "password": TEST_PASSWORD,
        })
        check("register", r.status_code == 200, f"({r.status_code})")
        token = r.json().get("access_token") if r.status_code == 200 else None
        if not token:
            check("token obtenu", False, r.text[:120]); return
        h = {"Authorization": f"Bearer {token}"}

        # 2. /auth/me
        r = await c.get("/auth/me", headers=h)
        check("auth/me", r.status_code == 200, f"({r.status_code})")

        # 3. Récupérer l'id produit local
        r = await c.get(f"/api/product/{BARCODE}")
        pid = r.json().get("product", {}).get("id") if r.status_code == 200 else None
        check("product lookup", pid is not None, f"id={pid}")

        # 4. Historique : ajout, liste, stats
        if pid:
            r = await c.post(f"/api/history/{pid}", headers=h)
            check("history add", r.status_code == 200, f"({r.status_code})")
            r = await c.get("/api/history", headers=h)
            check("history list", r.status_code == 200 and len(r.json()) >= 1, f"n={len(r.json()) if r.status_code==200 else '?'}")
            r = await c.get("/api/history/stats", headers=h)
            check("history stats", r.status_code == 200, str(r.json())[:80])

        # 5. Favoris : toggle on, check, liste, toggle off
        r = await c.post(f"/api/favorites/{BARCODE}", headers=h)
        check("favorite add", r.status_code == 200 and r.json().get("is_favorite") is True, f"({r.status_code})")
        r = await c.get(f"/api/favorites_check/{BARCODE}", headers=h)
        check("favorite check", r.status_code == 200 and r.json().get("is_favorite") is True, f"({r.status_code})")
        r = await c.get("/api/favorites", headers=h)
        check("favorite list", r.status_code == 200 and len(r.json()) >= 1, f"n={len(r.json()) if r.status_code==200 else '?'}")
        r = await c.post(f"/api/favorites/{BARCODE}", headers=h)
        check("favorite remove", r.status_code == 200 and r.json().get("is_favorite") is False, f"({r.status_code})")

        # 6. Notifications
        r = await c.get("/api/notifications?unread_only=true", headers=h)
        check("notifications", r.status_code == 200, f"({r.status_code})")

        # 7. Auth négatif (pas de token => 401)
        r = await c.get("/api/history")
        check("auth requise (401 sans token)", r.status_code == 401, f"({r.status_code})")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    finally:
        print("--- nettoyage de l'utilisateur de test ---")
        asyncio.run(cleanup_user())
        passed = sum(1 for _, ok, _ in results if ok)
        print(f"\n=== {passed}/{len(results)} checks OK ===")
        sys.exit(0 if passed == len(results) else 1)
