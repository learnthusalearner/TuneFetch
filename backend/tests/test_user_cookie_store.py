import pytest
from app.services.user_cookie_store import UserCookieStore
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_user_cookie_store_lifecycle():
    user_id = "test-user-cookie-123"

    # Initially empty
    assert not UserCookieStore.has_cookies(user_id)
    assert UserCookieStore.get_cookie_count(user_id) == 0

    # Save cookies (Netscape format)
    raw = "# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t2147483647\tLOGIN_INFO\tabc123xyz\n"
    count = UserCookieStore.set_cookies(user_id, raw)
    assert count == 1
    assert UserCookieStore.has_cookies(user_id)
    assert UserCookieStore.get_cookie_count(user_id) == 1

    # Retrieve jar
    jar = UserCookieStore.get_cookies(user_id)
    assert jar is not None
    assert len(list(jar)) == 1

    # Delete cookies
    deleted = UserCookieStore.delete_cookies(user_id)
    assert deleted is True
    assert not UserCookieStore.has_cookies(user_id)
    assert UserCookieStore.get_cookie_count(user_id) == 0

def test_api_user_cookies_endpoints():
    # 1. Set cookies via API
    resp = client.post("/api/user-cookies", json={"cookies": ".youtube.com\tTRUE\t/\tTRUE\t2147483647\tSID\tsome_sid\n"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["count"] >= 1

    # 2. Check status via API
    resp_status = client.get("/api/user-cookies/status")
    assert resp_status.status_code == 200
    assert resp_status.json()["has_cookies"] is True
    assert resp_status.json()["count"] >= 1

    # 3. Delete cookies via API
    resp_del = client.delete("/api/user-cookies")
    assert resp_del.status_code == 200
    assert resp_del.json()["deleted"] is True

    # 4. Confirm status is now false
    resp_status_after = client.get("/api/user-cookies/status")
    assert resp_status_after.status_code == 200
    assert resp_status_after.json()["has_cookies"] is False
    assert resp_status_after.json()["count"] == 0
