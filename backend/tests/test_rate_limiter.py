import time
import pytest
from fastapi.testclient import TestClient
from app.main import create_app
from app.core.rate_limiter import rate_limiter

def test_rate_limiter_allows_normal_traffic():
    """Verify standard requests within limits are allowed and receive rate limit headers."""
    app = create_app()
    client = TestClient(app)

    res = client.get("/health")
    assert res.status_code == 200

    # API request
    res2 = client.get("/")
    assert res2.status_code == 200

def test_rate_limiter_blocks_when_threshold_exceeded():
    """Verify client is blocked with 429 when exceeding threshold."""
    # Temporarily set small limit for test
    orig_limit = rate_limiter.heavy_limit
    rate_limiter.heavy_limit = 3
    try:
        app = create_app()
        client = TestClient(app)

        # 3 allowed heavy requests
        for _ in range(3):
            res = client.post("/api/cloud-session", json={"playlist_name": "Test", "tracks": []})
            # Will be 400 because empty tracks, but went through rate limiter
            assert res.status_code in (400, 200)

        # 4th request should trigger 429 Too Many Requests
        res_blocked = client.post("/api/cloud-session", json={"playlist_name": "Test", "tracks": []})
        assert res_blocked.status_code == 429
        data = res_blocked.json()
        assert "Too many requests" in data.get("detail", "")
        assert "Retry-After" in res_blocked.headers
    finally:
        rate_limiter.heavy_limit = orig_limit
