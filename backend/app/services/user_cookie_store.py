"""
Ephemeral and database-backed session store for user YouTube verification cookies.
Cookies are mapped strictly to the user's active session (user_id),
used during media downloads, and safely cleared when the user disconnects,
requests manual deletion, or after the session TTL expires.
"""
import os
import time
import logging
import threading
from typing import Dict, Any, Optional
import http.cookiejar

from app.core.config import DOWNLOADS_DIR
from app.services.downloader import _parse_cookies_into_jar

logger = logging.getLogger("user_cookie_store")

class UserCookieStore:
    # Ephemeral in-memory store: user_id -> { "jar": MozillaCookieJar, "count": int, "created_at": float }
    _store: Dict[str, Dict[str, Any]] = {}
    _latest_user_id: Optional[str] = None
    _latest_jar: Optional[http.cookiejar.MozillaCookieJar] = None
    _latest_count: int = 0
    _latest_time: float = 0.0
    _lock = threading.Lock()
    _ttl_seconds = 86400  # 24 hours session lifetime

    @classmethod
    def set_cookies(cls, user_id: str, raw_content: str) -> int:
        """
        Parses, caches in memory, and safely persists encrypted cookies for user_id.
        Returns the number of valid cookies parsed.
        """
        jar = _parse_cookies_into_jar(raw_content)
        count = len(list(jar))
        if count == 0:
            return 0

        with cls._lock:
            cls._store[user_id] = {
                "jar": jar,
                "count": count,
                "created_at": time.time()
            }
            cls._latest_user_id = user_id
            cls._latest_jar = jar
            cls._latest_count = count
            cls._latest_time = time.time()

        # Save active copy to disk for urllib file-based fallbacks
        try:
            target_path = os.path.join(DOWNLOADS_DIR, "youtube_cookies.txt")
            jar.save(target_path, ignore_discard=True, ignore_expires=True)
        except Exception as e:
            logger.debug(f"UserCookieStore: Could not save disk mirror: {e}")

        # Persist encrypted copy in Neon PostgreSQL database so cookies survive container restarts
        if user_id:
            try:
                from app.core.database import SessionLocal
                from app.models.db_models import User
                from app.utils.auth_helper import encrypt_token
                db = SessionLocal()
                try:
                    user = db.query(User).filter(User.id == user_id).first()
                    if user:
                        user.cookies_encrypted = encrypt_token(raw_content)
                        db.commit()
                        logger.info(f"UserCookieStore: Persisted encrypted cookies to DB for user {user_id}.")
                finally:
                    db.close()
            except Exception as db_err:
                logger.warning(f"UserCookieStore: Failed writing cookies to DB: {db_err}")

        logger.info(f"UserCookieStore: Loaded {count} cookies for user {user_id}.")
        return count

    @classmethod
    def get_cookies(cls, user_id: Optional[str] = None) -> Optional[http.cookiejar.MozillaCookieJar]:
        """
        Retrieves active MozillaCookieJar for a user.
        If user_id is provided, checks strictly for that user's session in memory or encrypted DB.
        If user_id is None, falls back to latest active jar or server disk cookies.
        """
        if user_id:
            with cls._lock:
                record = cls._store.get(user_id)
                if record:
                    if time.time() - record["created_at"] <= cls._ttl_seconds:
                        return record["jar"]
                    else:
                        del cls._store[user_id]

            # In-memory miss or container restart: check database for encrypted session cookies
            try:
                from app.core.database import SessionLocal
                from app.models.db_models import User
                from app.utils.auth_helper import decrypt_token
                db = SessionLocal()
                try:
                    user = db.query(User).filter(User.id == user_id).first()
                    if user and user.cookies_encrypted:
                        plain_cookies = decrypt_token(user.cookies_encrypted)
                        if plain_cookies and len(plain_cookies.strip()) > 10:
                            jar = _parse_cookies_into_jar(plain_cookies)
                            count = len(list(jar))
                            if count > 0:
                                with cls._lock:
                                    cls._store[user_id] = {
                                        "jar": jar,
                                        "count": count,
                                        "created_at": time.time()
                                    }
                                return jar
                finally:
                    db.close()
            except Exception as db_read_err:
                logger.debug(f"UserCookieStore: DB read fallback skipped: {db_read_err}")

            return None

        # When user_id is None, allow fallback to latest active jar or server disk cookies
        with cls._lock:
            if cls._latest_jar and (time.time() - cls._latest_time <= cls._ttl_seconds):
                return cls._latest_jar

        try:
            target_path = os.path.join(DOWNLOADS_DIR, "youtube_cookies.txt")
            if os.path.isfile(target_path) and os.path.getsize(target_path) > 10:
                jar = http.cookiejar.MozillaCookieJar(target_path)
                jar.load(ignore_discard=True, ignore_expires=True)
                if len(list(jar)) > 0:
                    return jar
        except Exception:
            pass

        return None

    @classmethod
    def get_latest_cookies(cls) -> Optional[http.cookiejar.MozillaCookieJar]:
        return cls.get_cookies()

    @classmethod
    def has_cookies(cls, user_id: Optional[str] = None) -> bool:
        return cls.get_cookies(user_id) is not None

    @classmethod
    def get_cookie_count(cls, user_id: Optional[str] = None) -> int:
        jar = cls.get_cookies(user_id)
        if jar:
            return len(list(jar))
        return 0

    @classmethod
    def delete_cookies(cls, user_id: str) -> bool:
        """
        Wipes user's cookies from both in-memory cache and PostgreSQL database.
        """
        with cls._lock:
            if user_id in cls._store:
                del cls._store[user_id]

            if cls._latest_user_id == user_id or len(cls._store) == 0:
                cls._latest_jar = None
                cls._latest_user_id = None
                cls._latest_count = 0
                cls._latest_time = 0.0

        if user_id:
            try:
                from app.core.database import SessionLocal
                from app.models.db_models import User
                db = SessionLocal()
                try:
                    user = db.query(User).filter(User.id == user_id).first()
                    if user and user.cookies_encrypted:
                        user.cookies_encrypted = None
                        db.commit()
                        logger.info(f"UserCookieStore: [DELETED] Removed DB cookies for user {user_id}.")
                finally:
                    db.close()
            except Exception as e:
                logger.warning(f"UserCookieStore: Error removing DB cookies: {e}")

        return True

    @classmethod
    def cleanup_expired(cls):
        """Removes in-memory records that have exceeded the TTL."""
        now = time.time()
        with cls._lock:
            stale_keys = [
                uid for uid, rec in cls._store.items()
                if now - rec["created_at"] > cls._ttl_seconds
            ]
            for uid in stale_keys:
                del cls._store[uid]

def _background_cookie_janitor():
    while True:
        try:
            time.sleep(600)  # Check every 10 minutes
            UserCookieStore.cleanup_expired()
        except Exception:
            pass

_janitor_thread = threading.Thread(target=_background_cookie_janitor, daemon=True, name="UserCookieJanitor")
_janitor_thread.start()
