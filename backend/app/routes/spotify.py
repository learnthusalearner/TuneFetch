import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import FRONTEND_URL
from app.core.database import get_db
from app.models.db_models import User, SpotifyAccount
from app.utils.auth_helper import get_current_user
from app.services.spotify_service import SpotifyService
from app.services.playlist_pipeline import PlaylistPipeline

logger = logging.getLogger("spotify_route")

router = APIRouter(prefix="/spotify", tags=["Spotify"])

class PlaylistDownloadRequest(BaseModel):
    format: Optional[str] = "mp3-320"

@router.get("/auth")
def spotify_auth_start(
    request: Request,
    response: Response,
    redirect: bool = Query(True, description="Whether to redirect immediately (302) or return JSON"),
    current_user: User = Depends(get_current_user)
):
    """
    Initiates the Spotify PKCE OAuth flow with state protection.
    """
    auth_url = SpotifyService.create_auth_url(user_id=current_user.id)
    if redirect:
        return RedirectResponse(url=auth_url)
    return {"success": True, "auth_url": auth_url}

@router.get("/callback")
async def spotify_auth_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Handles the Spotify authorization code redirect. Exchanges code for tokens and persists connection.
    """
    if error:
        logger.warning(f"Spotify OAuth error received: {error}")
        return RedirectResponse(url=f"{FRONTEND_URL}/?spotify_error={error}")

    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing authorization code or state parameter.")

    try:
        await SpotifyService.exchange_code_for_tokens(
            user_id=current_user.id,
            code=code,
            state=state,
            db=db
        )
        return RedirectResponse(url=f"{FRONTEND_URL}/?spotify=connected")
    except Exception as e:
        logger.error(f"Callback token exchange error: {e}")
        return RedirectResponse(url=f"{FRONTEND_URL}/?spotify_error={str(e)}")

@router.get("/status")
def get_spotify_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns whether the current user has linked their Spotify account.
    """
    account = db.query(SpotifyAccount).filter(SpotifyAccount.user_id == current_user.id).first()
    if not account:
        return {"connected": False, "spotify_user": None}

    return {
        "connected": True,
        "spotify_user": {
            "id": account.spotify_user_id,
            "display_name": account.display_name,
            "email": account.email
        }
    }

@router.post("/disconnect")
def disconnect_spotify_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Unlinks the Spotify account from the current user.
    """
    success = SpotifyService.disconnect(user_id=current_user.id, db=db)
    return {"success": success}

@router.get("/playlists")
async def list_user_playlists(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all playlists belonging to or followed by the user with full pagination.
    """
    playlists = await SpotifyService.get_user_playlists(user_id=current_user.id, db=db)
    return {"success": True, "playlists": playlists}

@router.get("/playlists/{playlist_id}/tracks")
async def list_playlist_tracks(
    playlist_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves and normalizes ALL tracks in a playlist (supporting 1400+ songs) without downloading.
    """
    playlist_data = await SpotifyService.get_playlist_tracks(
        user_id=current_user.id,
        playlist_id=playlist_id,
        db=db
    )
    return {"success": True, "data": playlist_data}

@router.post("/playlists/{playlist_id}/download")
async def trigger_playlist_download(
    playlist_id: str,
    req: PlaylistDownloadRequest = PlaylistDownloadRequest(),
    current_user: User = Depends(get_current_user)
):
    """
    Initiates asynchronous batch download pipeline:
    Spotify Track -> Serper API -> Candidate URL -> EXISTING yt-dlp Downloader.
    """
    job_id = await PlaylistPipeline.create_and_start_job(
        user_id=current_user.id,
        playlist_id=playlist_id,
        format_type=req.format or "mp3-320"
    )
    return {"success": True, "job_id": job_id}

@router.get("/jobs/{job_id}")
def check_playlist_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Polls real-time progress for an asynchronous playlist download batch.
    """
    status = PlaylistPipeline.get_job_status(job_id=job_id, user_id=current_user.id, db=db)
    if not status:
        raise HTTPException(status_code=404, detail="Playlist job not found.")
    return {"success": True, "job": status}
