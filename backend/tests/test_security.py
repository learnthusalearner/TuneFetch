import os
import pytest
from fastapi import Response
from app.core import config
from app.utils.auth_helper import set_session_cookie, encrypt_token, decrypt_token, sign_session_id, unsign_session_id, SESSION_COOKIE_NAME

def test_cors_security_not_wildcard():
    """Verify CORS_ORIGINS does not default to insecure wildcard with credentials."""
    assert "*" not in config.CORS_ORIGINS, "CORS_ORIGINS must not contain wildcard '*' when allow_credentials=True"
    assert config.FRONTEND_URL in config.CORS_ORIGINS

def test_no_hardcoded_database_passwords_in_config():
    """Verify that config.py doesn't contain hardcoded neon passwords."""
    with open(config.__file__, "r", encoding="utf-8") as f:
        content = f.read()
    assert "npg_" not in content, "Database password prefix 'npg_' found hardcoded in config.py!"
    assert "neondb_owner" not in content, "Hardcoded database user found in config.py!"

def test_session_cookie_attributes():
    """Verify that set_session_cookie applies HttpOnly and SameSite (lax locally, none in production)."""
    response = Response()
    set_session_cookie(response, "test-user-id-456")
    cookie_header = response.headers.get("set-cookie")
    assert cookie_header is not None
    assert f"{SESSION_COOKIE_NAME}=" in cookie_header
    assert "HttpOnly" in cookie_header or "httponly" in cookie_header
    assert "SameSite=lax" in cookie_header or "samesite=lax" in cookie_header or "SameSite=none" in cookie_header or "samesite=none" in cookie_header

    # Test production/secure cross-site mode
    prod_response = Response()
    with pytest.MonkeyPatch.context() as m:
        m.setenv("ENVIRONMENT", "production")
        set_session_cookie(prod_response, "prod-user-123")
    prod_header = prod_response.headers.get("set-cookie").lower()
    assert "samesite=none" in prod_header
    assert "secure" in prod_header

def test_cryptographic_signing_tamper_detection():
    """Verify that unsigned or tampered session IDs are rejected."""
    raw_id = "authentic_user_id"
    signed = sign_session_id(raw_id)
    assert unsign_session_id(signed) == raw_id

    # Tampering should fail
    tampered = signed[:-3] + "xyz"
    assert unsign_session_id(tampered) is None

def test_token_encryption_roundtrip():
    """Verify sensitive OAuth tokens are encrypted and decrypted correctly."""
    sample_token = "spotify_access_token_secret_123456789"
    encrypted = encrypt_token(sample_token)
    assert encrypted != sample_token
    decrypted = decrypt_token(encrypted)
    assert decrypted == sample_token
