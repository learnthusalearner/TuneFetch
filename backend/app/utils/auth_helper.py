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
    is_secure = FRONTEND_URL.startswith("https") or os.getenv("ENVIRONMENT", "").lower() == "production"
    signed_cookie = sign_session_id(user_id)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=signed_cookie,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=60 * 60 * 24 * 365,  # 1 year persistence
        path="/"
    )

def get_current_user(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency that identifies the application user via signed HTTP-only session cookie.
    If no valid session exists, initializes an isolated new User record.
    """
    raw_cookie = request.cookies.get(SESSION_COOKIE_NAME)
    user_id = None

    if raw_cookie:
        user_id = unsign_session_id(raw_cookie)

    user: Optional[User] = None
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()

    if not user:
        # Create new isolated User record
        user = User()
        db.add(user)
        db.commit()
        db.refresh(user)

        # Set secure HTTP-only cookie
        set_session_cookie(response, user.id)
    else:
        # Update last seen timestamp
        user.last_seen_at = datetime.now(timezone.utc)
        db.commit()

    return user

