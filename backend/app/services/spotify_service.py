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
from app.models.db_models import SpotifyAccount
from app.utils.auth_helper import encrypt_token, decrypt_token

logger = logging.getLogger("spotify_service")

# In-memory transient store for PKCE verifiers keyed by state (with TTL)
_pkce_store: Dict[str, Dict[str, Any]] = {}

def _generate_pkce_pair() -> Tuple[str, str]:
    """Generates a high-entropy PKCE code_verifier and S256 code_challenge."""
    code_verifier = secrets.token_urlsafe(64)
    hashed = hashlib.sha256(code_verifier.encode("ascii")).digest()
    code_challenge = base64.urlsafe_b64encode(hashed).decode("ascii").rstrip("=")
    return code_verifier, code_challenge

def clean_pkce_store():
    """Removes expired OAuth states older than 10 minutes."""
    now = time.time()
    expired = [k for k, v in _pkce_store.items() if now - v.get("timestamp", 0) > 600]
    for k in expired:
        _pkce_store.pop(k, None)

class SpotifyService:
    @staticmethod
    def create_auth_url(user_id: str) -> str:
        """
        Constructs the Spotify authorization URL with PKCE and state protection.
        """
        if not SPOTIFY_CLIENT_ID:
            raise HTTPException(
                status_code=500,
                detail="SPOTIFY_CLIENT_ID is not configured in backend environment (.env)."
            )

        clean_pkce_store()
        state = secrets.token_urlsafe(32)
        code_verifier, code_challenge = _generate_pkce_pair()

        # Store verifier tied to state and user
        _pkce_store[state] = {
            "user_id": user_id,
            "code_verifier": code_verifier,
            "timestamp": time.time()
        }

        params = {
            "client_id": SPOTIFY_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": SPOTIFY_REDIRECT_URI,
            "state": state,
            "scope": SPOTIFY_SCOPES,
            "code_challenge_method": "S256",
            "code_challenge": code_challenge,
            "show_dialog": "true"
        }

        import urllib.parse
        query_string = urllib.parse.urlencode(params)
        return f"https://accounts.spotify.com/authorize?{query_string}"

    @staticmethod
    async def exchange_code_for_tokens(
        user_id: str,
        code: str,
        state: str,
        db: Session
    ) -> SpotifyAccount:
        """
        Validates state and exchanges the authorization code for access & refresh tokens.
        """
        clean_pkce_store()
        stored_data = _pkce_store.pop(state, None)
        if not stored_data or stored_data.get("user_id") != user_id:
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired OAuth state parameter. Please restart authorization."
            )

        code_verifier = stored_data["code_verifier"]

        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": SPOTIFY_REDIRECT_URI,
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

        # Persist or update SpotifyAccount for current user
        account = db.query(SpotifyAccount).filter(SpotifyAccount.user_id == user_id).first()
        if not account:
            account = SpotifyAccount(user_id=user_id, spotify_user_id=spotify_user_id)
            db.add(account)

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
        logger.info(f"Successfully linked Spotify account '{display_name}' for user '{user_id}'.")
        return account

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
                    tracks_info = item.get("tracks", {})
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
        Filters out null/unavailable tracks and extracts normalized metadata.
        """
        token = await SpotifyService.get_valid_access_token(user_id, db)
        playlist_name = "Spotify Playlist"
        playlist_image = ""
        tracks: List[Dict[str, Any]] = []

        async with httpx.AsyncClient(timeout=30.0) as client:
            # 1. Fetch playlist metadata
            meta_resp = await client.get(
                f"https://api.spotify.com/v1/playlists/{playlist_id}?fields=id,name,images,tracks.total",
                headers={"Authorization": f"Bearer {token}"}
            )
            if meta_resp.status_code == 200:
                meta = meta_resp.json()
                playlist_name = meta.get("name", playlist_name)
                images = meta.get("images", [])
                playlist_image = images[0]["url"] if images else ""

            # 2. Paginate over all tracks
            url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks?limit=100"
            track_index = 0

            while url:
                resp = await client.get(url, headers={"Authorization": f"Bearer {token}"})
                if resp.status_code == 401:
                    token = await SpotifyService.get_valid_access_token(user_id, db)
                    resp = await client.get(url, headers={"Authorization": f"Bearer {token}"})

                if resp.status_code != 200:
                    logger.error(f"Error fetching playlist tracks: {resp.text}")
                    break

                data = resp.json()
                items = data.get("items", [])

                for item in items:
                    if not item:
                        continue
                    track_obj = item.get("track")
                    # Handle invalid, null, removed, or episode items
                    if not track_obj or not track_obj.get("name") or track_obj.get("type") != "track":
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
                        "artists": artists_list,
                        "artist": artist_str,
                        "duration": duration_sec,
                        "thumbnail": track_thumb,
                        "search_query": search_query,
                        "status": "PENDING"
                    })
                    track_index += 1

                url = data.get("next")

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
