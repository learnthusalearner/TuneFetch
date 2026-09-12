import os
import base64
import hashlib
from datetime import datetime, timezone
from typing import Optional
from fastapi import Request, Response, Depends, HTTPException
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet
from itsdangerous import Signer, BadSignature

from app.core.config import SESSION_SECRET_KEY
from app.core.database import get_db
from app.models.db_models import User

SESSION_COOKIE_NAME = "tunefetch_session"

# Derive 32-byte Fernet key from SESSION_SECRET_KEY
def _get_fernet_key() -> bytes:
    h = hashlib.sha256(SESSION_SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(h)

_cipher = Fernet(_get_fernet_key())
_signer = Signer(SESSION_SECRET_KEY)

def encrypt_token(plain_token: str) -> str:
    """Encrypts a sensitive OAuth token string for secure database storage."""
    if not plain_token:
        return ""
    return _cipher.encrypt(plain_token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    """Decrypts a stored OAuth token string."""
    if not encrypted_token:
        return ""
    try:
        return _cipher.decrypt(encrypted_token.encode()).decode()
    except Exception:
        # If already unencrypted (fallback migration), return as is
        return encrypted_token

def sign_session_id(user_id: str) -> str:
    """Cryptographically signs the user ID for the session cookie."""
    return _signer.sign(user_id.encode()).decode()

def unsign_session_id(signed_value: str) -> Optional[str]:
    """Validates the cryptographic signature of the session cookie."""
    try:
        unsigned = _signer.unsign(signed_value.encode()).decode()
        return unsigned
    except (BadSignature, Exception):
        return None

def set_session_cookie(response: Response, user_id: str):
    """Sets a cryptographically signed, HTTP-only session cookie."""
    from app.core.config import FRONTEND_URL
    is_secure = FRONTEND_URL.startswith("https") or os.getenv("ENVIRONMENT", "").lower() == "production" or bool(os.getenv("RENDER"))
    signed_cookie = sign_session_id(user_id)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=signed_cookie,
        httponly=True,
        secure=is_secure,
        samesite="none" if is_secure else "lax",
        max_age=60 * 60 * 24 * 365,  # 1 year persistence
        path="/"
    )

def get_current_user(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency that identifies the application user via:
    1. X-User-Id header (cross-origin resilient for Vercel <-> Render)
    2. Authorization Bearer header
    3. user_id query parameter
    4. Signed HTTP-only session cookie fallback
    """
    user_id = None

    # 1. Check X-User-Id header (crucial when third-party cookies are blocked)
    header_user_id = request.headers.get("x-user-id") or request.headers.get("X-User-Id")
    if header_user_id and len(header_user_id.strip()) >= 5:
        user_id = header_user_id.strip()

    # 2. Check Authorization header
    if not user_id:
        auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth_header and auth_header.lower().startswith("bearer "):
            token = auth_header[7:].strip()
            if len(token) >= 5:
                user_id = token

    # 3. Check query param
    if not user_id:
        param_user_id = request.query_params.get("user_id")
        if param_user_id and len(param_user_id.strip()) >= 5:
            user_id = param_user_id.strip()

    # 4. Check signed session cookie fallback
    if not user_id:
        raw_cookie = request.cookies.get(SESSION_COOKIE_NAME)
        if raw_cookie:
            user_id = unsign_session_id(raw_cookie)

    user: Optional[User] = None
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()

    if not user:
        if user_id and len(user_id) >= 5:
            user = User(id=user_id)
        else:
            user = User()
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.last_seen_at = datetime.now(timezone.utc)
        db.commit()

    # Expose and attach X-User-Id header on response
    try:
        response.headers["X-User-Id"] = user.id
        response.headers["Access-Control-Expose-Headers"] = "X-User-Id, Content-Disposition"
    except Exception:
        pass

    set_session_cookie(response, user.id)
    return user

