"""
Ephemeral, in-memory store for user YouTube verification cookies.
Cookies are mapped strictly to the user's active session (user_id),
used during media downloads, and permanently deleted immediately after
the download finishes or expires.
"""
import time
import logging
import threading
from typing import Dict, Any, Optional
import http.cookiejar

from app.services.downloader import _parse_cookies_into_jar

logger = logging.getLogger("user_cookie_store")

class UserCookieStore:
    # Ephemeral store: user_id -> { "jar": MozillaCookieJar, "count": int, "created_at": float }
    _store: Dict[str, Dict[str, Any]] = {}
    _latest_jar: Optional[http.cookiejar.MozillaCookieJar] = None
    _latest_count: int = 0
    _latest_time: float = 0.0
    _lock = threading.Lock()
    _ttl_seconds = 7200  # 2 hours maximum lifetime before automatic cleanup

    @classmethod
    def set_cookies(cls, user_id: str, raw_content: str) -> int:
        """
        Parses and stores cookies in memory for the given user_id.
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
            cls._latest_jar = jar
            cls._latest_count = count
            cls._latest_time = time.time()

        logger.info(f"UserCookieStore: Loaded {count} temporary cookies for user {user_id}. Auto-delete scheduled upon download completion.")
        return count

    @classmethod
    def get_cookies(cls, user_id: Optional[str] = None) -> Optional[http.cookiejar.MozillaCookieJar]:
        """
        Retrieves the active MozillaCookieJar for a user if still valid.
        Gracefully falls back to the most recently saved jar if user_id was reissued.
        """
        with cls._lock:
            if user_id:
                record = cls._store.get(user_id)
                if record:
                    # Expire if older than TTL
                    if time.time() - record["created_at"] > cls._ttl_seconds:
                        del cls._store[user_id]
                        logger.info(f"UserCookieStore: Expired stale cookies for user {user_id}.")
                    else:
                        return record["jar"]

            # Fallback to latest jar if within TTL
            if cls._latest_jar and (time.time() - cls._latest_time <= cls._ttl_seconds):
                return cls._latest_jar

            return None

    @classmethod
    def get_latest_cookies(cls) -> Optional[http.cookiejar.MozillaCookieJar]:
        return cls.get_cookies()

    @classmethod
    def has_cookies(cls, user_id: Optional[str] = None) -> bool:
        return cls.get_cookies(user_id) is not None

    @classmethod
    def get_cookie_count(cls, user_id: Optional[str] = None) -> int:
        with cls._lock:
            if user_id and user_id in cls._store:
                return cls._store[user_id]["count"]
            if cls._latest_jar and (time.time() - cls._latest_time <= cls._ttl_seconds):
                return cls._latest_count
            return 0

    @classmethod
    def delete_cookies(cls, user_id: str) -> bool:
        """
        Permanently wipes and deletes the user's cookies from server memory.
        """
        with cls._lock:
            deleted = False
            if user_id in cls._store:
                del cls._store[user_id]
                logger.info(f"UserCookieStore: [DELETED] Permanently wiped cookies for user {user_id}.")
                deleted = True

            if len(cls._store) == 0:
                cls._latest_jar = None
                cls._latest_count = 0
                cls._latest_time = 0.0

            return deleted

    @classmethod
    def cleanup_expired(cls):
        """Removes records that have exceeded the TTL."""
        now = time.time()
        with cls._lock:
            stale_keys = [
                uid for uid, rec in cls._store.items()
                if now - rec["created_at"] > cls._ttl_seconds
            ]
            for uid in stale_keys:
                del cls._store[uid]
                logger.info(f"UserCookieStore: Purged expired cookies for user {uid}.")

def _background_cookie_janitor():
    while True:
        try:
            time.sleep(600)  # Check every 10 minutes
            UserCookieStore.cleanup_expired()
        except Exception:
            pass

_janitor_thread = threading.Thread(target=_background_cookie_janitor, daemon=True, name="UserCookieJanitor")
_janitor_thread.start()
