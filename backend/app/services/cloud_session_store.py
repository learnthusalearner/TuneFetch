import time
import random
import string
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger("cloud_session_store")

# In-memory dictionary for active cloud sessions
# { session_code: { "playlist_name": str, "image": str, "tracks": list, "total_tracks": int, "created_at": float } }
_sessions: Dict[str, Dict[str, Any]] = {}
EXPIRY_SECONDS = 86400  # 24 hours

class CloudSessionStore:
    @staticmethod
    def _clean_expired():
        now = time.time()
        expired_keys = [k for k, v in _sessions.items() if now - v.get("created_at", 0) > EXPIRY_SECONDS]
        for k in expired_keys:
            _sessions.pop(k, None)

    @classmethod
    def create_session(
        cls,
        playlist_name: str,
        tracks: List[Dict[str, Any]],
        image: Optional[str] = "",
    ) -> str:
        cls._clean_expired()
        
        # Generate a short 4-digit code: TF-XXXX
        # e.g., TF-4821 or TF-9034
        digits = "".join(random.choices(string.digits, k=4))
        code = f"TF-{digits}"
        
        # If collision occurs, add random letter
        while code in _sessions:
            suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
            code = f"TF-{suffix}"

        _sessions[code] = {
            "session_code": code,
            "playlist_name": playlist_name or "Spotify Playlist",
            "image": image or "",
            "total_tracks": len(tracks),
            "tracks": tracks,
            "created_at": time.time(),
        }
        logger.info(f"Created cloud download session '{code}' for playlist '{playlist_name}' ({len(tracks)} tracks).")
        return code

    @classmethod
    def get_session(cls, code: str) -> Optional[Dict[str, Any]]:
        cls._clean_expired()
        clean_code = (code or "").strip().upper()
        if not clean_code.startswith("TF-") and len(clean_code) == 4 and clean_code.isdigit():
            clean_code = f"TF-{clean_code}"
            
        session = _sessions.get(clean_code)
        if not session:
            # Check without case or prefix
            for k, v in _sessions.items():
                if k.upper() == clean_code or k.replace("TF-", "") == clean_code.replace("TF-", ""):
                    return v
            return None
        return session
