import os
import time
import base64
import hashlib
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional, Tuple

import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import (
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
    SPOTIFY_REDIRECT_URI,
    SPOTIFY_SCOPES
)
from app.models.db_models import SpotifyAccount, User
from app.utils.auth_helper import encrypt_token, decrypt_token

logger = logging.getLogger("spotify_service")

import json
import urllib.parse

# In-memory transient store for PKCE verifiers keyed by state (fallback)
_pkce_store: Dict[str, Dict[str, Any]] = {}

def _generate_pkce_pair() -> Tuple[str, str]:
    """Generates a high-entropy PKCE code_verifier and S256 code_challenge."""
    code_verifier = secrets.token_urlsafe(64)
    hashed = hashlib.sha256(code_verifier.encode("ascii")).digest()
    code_challenge = base64.urlsafe_b64encode(hashed).decode("ascii").rstrip("=")
    return code_verifier, code_challenge

def clean_pkce_store():
    """Removes expired OAuth states older than 15 minutes."""
    now = time.time()
    expired = [k for k, v in _pkce_store.items() if now - v.get("timestamp", 0) > 900]
    for k in expired:
        _pkce_store.pop(k, None)

def resolve_redirect_uri(request: Optional[Any] = None) -> str:
    """
    Dynamically determines the correct Spotify Redirect URI.
    1. If request is provided, reconstruct from incoming headers (reverse proxy aware).
    2. If explicit production SPOTIFY_REDIRECT_URI is set, use it.
    3. If running on Render or production, default to https://tunefetch-t5mp.onrender.com/spotify/callback.
    4. Fallback to SPOTIFY_REDIRECT_URI or http://127.0.0.1:8000/spotify/callback.
    """
    if request is not None:
        try:
            proto = request.headers.get("x-forwarded-proto", getattr(request.url, "scheme", "https"))
            host = request.headers.get("x-forwarded-host", request.headers.get("host", getattr(request.url, "netloc", "")))
            if host:
                host_clean = host.split(":")[0] if "onrender.com" in host else host
                return f"{proto}://{host_clean}/spotify/callback"
        except Exception:
            pass

    env_uri = os.getenv("SPOTIFY_REDIRECT_URI", "")
    if env_uri and "127.0.0.1" not in env_uri and "localhost" not in env_uri:
        return env_uri

    if bool(os.getenv("RENDER")) or os.getenv("ENVIRONMENT") == "production":
        render_url = os.getenv("RENDER_EXTERNAL_URL", "https://tunefetch-t5mp.onrender.com").rstrip("/")
        return f"{render_url}/spotify/callback"

    return SPOTIFY_REDIRECT_URI or "http://127.0.0.1:8000/spotify/callback"

def _encode_oauth_state(user_id: str, code_verifier: str, redirect_uri: str = "", frontend_url: str = "") -> str:
    """Generates a clean URL-safe OAuth state token and stores parameters in memory store."""
    state = secrets.token_urlsafe(32)
    _pkce_store[state] = {
        "user_id": user_id,
        "code_verifier": code_verifier,
        "redirect_uri": redirect_uri,
        "frontend_url": frontend_url,
        "timestamp": time.time()
    }
    return state

def _decode_oauth_state(state: str) -> Tuple[Optional[str], Optional[str], Optional[str], Optional[str]]:
    """Decodes OAuth state string. Returns (user_id, code_verifier, redirect_uri, frontend_url)."""
    stored = _pkce_store.get(state)
    if stored and time.time() - stored.get("timestamp", 0) <= 900:
        return stored.get("user_id"), stored.get("code_verifier"), stored.get("redirect_uri"), stored.get("frontend_url")

    try:
        raw = decrypt_token(state)
        data = json.loads(raw)
        if time.time() - data.get("t", 0) <= 900:
            return data.get("u"), data.get("v"), data.get("r"), data.get("f")
    except Exception:
        pass
    return None, None, None, None

class SpotifyService:
    @staticmethod
    def create_auth_url(user_id: str, request: Optional[Any] = None, frontend_url: str = "") -> str:
        """
        Constructs the Spotify authorization URL with PKCE and encrypted state protection.
        """
        if not SPOTIFY_CLIENT_ID:
            raise HTTPException(
                status_code=500,
                detail="SPOTIFY_CLIENT_ID is not configured in backend environment (.env)."
            )

        clean_pkce_store()
        code_verifier, code_challenge = _generate_pkce_pair()
        redirect_uri = resolve_redirect_uri(request)
        state = _encode_oauth_state(user_id, code_verifier, redirect_uri, frontend_url)

        params = {
            "client_id": SPOTIFY_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "state": state,
            "scope": SPOTIFY_SCOPES,
            "code_challenge_method": "S256",
            "code_challenge": code_challenge,
            "show_dialog": "true"
        }

        query_string = urllib.parse.urlencode(params)
        return f"https://accounts.spotify.com/authorize?{query_string}"

    @staticmethod
    async def exchange_code_for_tokens(
        user_id: str,
        code: str,
        state: str,
        db: Session,
        request: Optional[Any] = None
    ) -> Tuple[SpotifyAccount, str]:
        """
        Validates state and exchanges the authorization code for access & refresh tokens.
        Returns (SpotifyAccount, target_user_id).
        """
        clean_pkce_store()
        target_user_id = user_id
        code_verifier = None
        redirect_uri = ""

        # 1. First attempt to decrypt state token
        decoded = _decode_oauth_state(state)
        decoded_user_id = decoded[0] if len(decoded) > 0 else None
        decoded_verifier = decoded[1] if len(decoded) > 1 else None
        state_redirect_uri = decoded[2] if len(decoded) > 2 else ""
        if decoded_verifier:
            code_verifier = decoded_verifier
            if decoded_user_id:
                target_user_id = decoded_user_id
            if state_redirect_uri:
                redirect_uri = state_redirect_uri
        else:
            # 2. Fallback to memory store if state was plain
            stored_data = _pkce_store.pop(state, None)
            if stored_data:
                code_verifier = stored_data.get("code_verifier")
                target_user_id = stored_data.get("user_id", user_id)
                redirect_uri = stored_data.get("redirect_uri", "")

        if not code_verifier:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired OAuth state parameter. Please restart authorization."
            )

        if not redirect_uri:
            redirect_uri = resolve_redirect_uri(request)

        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
            "client_id": SPOTIFY_CLIENT_ID,
            "code_verifier": code_verifier
        }

        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        auth = None
        if SPOTIFY_CLIENT_SECRET:
            auth = (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET)

        async with httpx.AsyncClient(timeout=15.0) as client:
            token_resp = await client.post(
                "https://accounts.spotify.com/api/token",
                data=data,
                headers=headers,
                auth=auth
            )

            if token_resp.status_code != 200:
                logger.error(f"Spotify token exchange error: {token_resp.text}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to exchange code with Spotify: {token_resp.text}"
                )

            tokens = token_resp.json()
            access_token = tokens["access_token"]
            refresh_token = tokens.get("refresh_token", "")
            expires_in = tokens.get("expires_in", 3600)
            scope = tokens.get("scope", SPOTIFY_SCOPES)
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

            # Retrieve Spotify User Profile
            profile_resp = await client.get(
                "https://api.spotify.com/v1/me",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if profile_resp.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail="Failed to fetch user profile from Spotify."
                )

            profile = profile_resp.json()
            spotify_user_id = profile["id"]
            display_name = profile.get("display_name") or spotify_user_id
            email = profile.get("email")

        # Persist or update SpotifyAccount for target_user_id
        user_record = db.query(User).filter(User.id == target_user_id).first()
        if not user_record:
            user_record = User(id=target_user_id)
            db.add(user_record)
            db.commit()

        # 1. Check if an account already exists with this spotify_user_id
        account = db.query(SpotifyAccount).filter(SpotifyAccount.spotify_user_id == spotify_user_id).first()

        if account:
            # If it belonged to a previous session/user_id, reassign to current target_user_id
            if account.user_id != target_user_id:
                # Remove any other Spotify account that target_user_id might currently have
                db.query(SpotifyAccount).filter(SpotifyAccount.user_id == target_user_id).delete()
                account.user_id = target_user_id
        else:
            # 2. Check if current target_user_id has an existing account record
            account = db.query(SpotifyAccount).filter(SpotifyAccount.user_id == target_user_id).first()
            if not account:
                account = SpotifyAccount(user_id=target_user_id, spotify_user_id=spotify_user_id)
                db.add(account)
            else:
                account.spotify_user_id = spotify_user_id

        account.spotify_user_id = spotify_user_id
        account.display_name = display_name
        account.email = email
        account.access_token = encrypt_token(access_token)
        if refresh_token:
            account.refresh_token = encrypt_token(refresh_token)
        account.expires_at = expires_at
        account.scope = scope
        account.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(account)
        logger.info(f"Successfully linked Spotify account '{display_name}' for user '{target_user_id}'.")
        return account, target_user_id

    @staticmethod
    async def get_valid_access_token(user_id: str, db: Session) -> str:
        """
        Retrieves a valid Spotify access token, automatically refreshing it if expired.
        """
        account = db.query(SpotifyAccount).filter(SpotifyAccount.user_id == user_id).first()
        if not account:
            raise HTTPException(
                status_code=401,
                detail="Spotify is not connected for this account. Please authorize Spotify first."
            )

        now = datetime.now(timezone.utc)
        expires_at = account.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        # Check if token is valid with a 60-second buffer
        if expires_at > (now + timedelta(seconds=60)):
            return decrypt_token(account.access_token)

        # Refresh token
        refresh_token_plain = decrypt_token(account.refresh_token)
        if not refresh_token_plain:
            db.delete(account)
            db.commit()
            raise HTTPException(
                status_code=401,
                detail="No refresh token available. Please reconnect your Spotify account."
            )

        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token_plain,
            "client_id": SPOTIFY_CLIENT_ID
        }
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        auth = None
        if SPOTIFY_CLIENT_SECRET:
            auth = (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET)

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://accounts.spotify.com/api/token",
                data=data,
                headers=headers,
                auth=auth
            )

            if resp.status_code != 200:
                logger.warning(f"Spotify refresh token failed: {resp.text}. Revoking connection.")
                db.delete(account)
                db.commit()
                raise HTTPException(
                    status_code=401,
                    detail="Spotify session expired or revoked. Please reconnect your account."
                )

            tokens = resp.json()
            new_access_token = tokens["access_token"]
            expires_in = tokens.get("expires_in", 3600)
            new_refresh_token = tokens.get("refresh_token")

            account.access_token = encrypt_token(new_access_token)
            if new_refresh_token:
                account.refresh_token = encrypt_token(new_refresh_token)
            account.expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
            account.updated_at = datetime.now(timezone.utc)
            db.commit()

            return new_access_token

    @staticmethod
    async def get_user_playlists(user_id: str, db: Session) -> List[Dict[str, Any]]:
        """
        Retrieves all playlists belonging to or followed by the user using full pagination.
        """
        token = await SpotifyService.get_valid_access_token(user_id, db)
        playlists: List[Dict[str, Any]] = []
        url = "https://api.spotify.com/v1/me/playlists?limit=50"

        async with httpx.AsyncClient(timeout=20.0) as client:
            while url:
                resp = await client.get(url, headers={"Authorization": f"Bearer {token}"})
                if resp.status_code == 401:
                    # Token might have expired during long pagination
                    token = await SpotifyService.get_valid_access_token(user_id, db)
                    resp = await client.get(url, headers={"Authorization": f"Bearer {token}"})

                if resp.status_code != 200:
                    logger.error(f"Error fetching user playlists: {resp.text}")
                    break

                data = resp.json()
                items = data.get("items", [])
                for item in items:
                    if not item:
                        continue
                    images = item.get("images", [])
                    image_url = images[0]["url"] if images else ""
                    tracks_info = item.get("items") or item.get("tracks") or {}
                    playlists.append({
                        "id": item.get("id"),
                        "name": item.get("name", "Untitled Playlist"),
                        "description": item.get("description", ""),
                        "image": image_url,
                        "tracks_total": tracks_info.get("total", 0),
                        "owner": item.get("owner", {}).get("display_name", "Spotify User"),
                        "public": item.get("public", False)
                    })

                url = data.get("next")

        return playlists

    @staticmethod
    async def get_playlist_tracks(user_id: str, playlist_id: str, db: Session) -> Dict[str, Any]:
        """
        Retrieves ALL tracks from a playlist, handling pagination for 10, 100, 500, 1400+ tracks.
        Supports both modern /items and legacy /tracks endpoints, extracting normalized metadata.
        """
        token = await SpotifyService.get_valid_access_token(user_id, db)
        playlist_name = "Spotify Playlist"
        playlist_image = ""
        tracks: List[Dict[str, Any]] = []

        async with httpx.AsyncClient(timeout=30.0) as client:
            # 1. Fetch playlist metadata
            meta_resp = await client.get(
                f"https://api.spotify.com/v1/playlists/{playlist_id}?fields=id,name,images,items.total,tracks.total",
                headers={"Authorization": f"Bearer {token}"}
            )
            if meta_resp.status_code == 200:
                meta = meta_resp.json()
                playlist_name = meta.get("name", playlist_name)
                images = meta.get("images", [])
                playlist_image = images[0]["url"] if images else ""

            # 2. Paginate over all tracks (attempt modern /items first, fallback to /tracks)
            url = f"https://api.spotify.com/v1/playlists/{playlist_id}/items?limit=100"
            track_index = 0

            # Test primary URL
            resp = await client.get(url, headers={"Authorization": f"Bearer {token}"})
            if resp.status_code in [403, 404]:
                url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks?limit=100"
                resp = await client.get(url, headers={"Authorization": f"Bearer {token}"})

            while url:
                if resp.status_code == 401:
                    token = await SpotifyService.get_valid_access_token(user_id, db)
                    resp = await client.get(url, headers={"Authorization": f"Bearer {token}"})

                if resp.status_code != 200:
                    logger.error(f"Error fetching playlist tracks from {url}: {resp.text}")
                    break

                data = resp.json()
                items = data.get("items", [])

                for item in items:
                    if not item:
                        continue
                    track_obj = item.get("item") or item.get("track") or item
                    # Handle invalid, null, removed, or non-track items
                    if not track_obj or not track_obj.get("name"):
                        continue
                    if track_obj.get("type") and track_obj.get("type") not in ["track"]:
                        continue

                    track_name = track_obj.get("name", "").strip()
                    artists_list = [a["name"].strip() for a in track_obj.get("artists", []) if a.get("name")]
                    artist_str = ", ".join(artists_list) if artists_list else "Unknown Artist"

                    # Album artwork
                    album_images = track_obj.get("album", {}).get("images", [])
                    track_thumb = album_images[0]["url"] if album_images else playlist_image

                    # Duration
                    duration_ms = track_obj.get("duration_ms", 0)
                    duration_sec = int(duration_ms / 1000) if duration_ms else 0

                    # Search query for Serper
                    search_query = f"{track_name} {' '.join(artists_list)} audio".strip()

                    tracks.append({
                        "id": track_index,
                        "spotifyTrackId": track_obj.get("id") or f"local-{track_index}",
                        "name": track_name,
                        "title": track_name,
                        "song_name": track_name,
                        "artists": artists_list,
                        "artist": artist_str,
                        "artist_name": artist_str,
                        "duration": duration_sec,
                        "duration_ms": duration_ms,
                        "thumbnail": track_thumb,
                        "search_query": search_query,
                        "candidate_url": None,
                        "status": "PENDING"
                    })
                    track_index += 1

                url = data.get("next")
                if url:
                    resp = await client.get(url, headers={"Authorization": f"Bearer {token}"})

        return {
            "playlist_id": playlist_id,
            "name": playlist_name,
            "image": playlist_image,
            "total_tracks": len(tracks),
            "tracks": tracks
        }

    @staticmethod
    def disconnect(user_id: str, db: Session) -> bool:
        """Unlinks the Spotify account for the given user."""
        account = db.query(SpotifyAccount).filter(SpotifyAccount.user_id == user_id).first()
        if account:
            db.delete(account)
            db.commit()
            return True
        return False
