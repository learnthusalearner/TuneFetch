from fastapi.testclient import TestClient
from app.main import app

def test_root_endpoint_get_and_head():
    """Verify that root endpoint responds with 200 OK to both GET and HEAD requests for Render health checks."""
    client = TestClient(app)
    
    # GET request
    get_res = client.get("/")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data.get("status") == "online"
    
    # HEAD request (used by Render port scanning and health probes)
    head_res = client.head("/")
    assert head_res.status_code == 200
    assert head_res.content == b""

def test_health_endpoints_get_and_head():
    """Verify that /health and /api/health respond with 200 OK to both GET and HEAD requests."""
    client = TestClient(app)
    
    # /health root alias
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json().get("status") == "healthy"
    
    head_res = client.head("/health")
    assert head_res.status_code == 200

    # /api/health
    res_api = client.get("/api/health")
    assert res_api.status_code == 200
    assert res_api.json().get("status") == "healthy"

    head_api = client.head("/api/health")
    assert head_api.status_code == 200
