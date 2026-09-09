import os
import logging
import urllib.parse
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, Response, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.config import FRONTEND_URL, SERPER_API_KEY
from app.core.database import get_db
from app.models.db_models import User, SpotifyAccount, PlaylistDownloadJob
from app.utils.auth_helper import get_current_user, set_session_cookie
from app.services.spotify_service import SpotifyService, _decode_oauth_state
from app.services.playlist_pipeline import PlaylistPipeline
from app.services.serper_service import SerperService
from app.services.downloader import DownloadManager

logger = logging.getLogger("spotify_route")

router = APIRouter(prefix="/spotify", tags=["Spotify"])

class PlaylistDownloadRequest(BaseModel):
    format: Optional[str] = "mp3-320"
    track_ids: Optional[List[str]] = None

class SingleTrackDownloadRequest(BaseModel):
    song_name: str
    artist_name: str
    thumbnail: Optional[str] = None
    format: Optional[str] = "mp3-320"

def get_frontend_url(request: Request, state: Optional[str] = None) -> str:
    """
    Determines the correct frontend origin to redirect the user back to.
    Never defaults to localhost if accessed from a deployed domain.
    """
    if state:
        try:
            decoded = _decode_oauth_state(state)
            if len(decoded) > 3 and decoded[3]:
                return decoded[3].rstrip("/")
        except Exception:
            pass

    referer = request.headers.get("referer") or request.headers.get("origin")
    if referer:
        try:
            parsed = urllib.parse.urlparse(referer)
            if parsed.netloc and ("localhost" not in parsed.netloc and "127.0.0.1" not in parsed.netloc):
                return f"{parsed.scheme}://{parsed.netloc}"
        except Exception:
            pass

    host = request.headers.get("x-forwarded-host", request.headers.get("host", ""))
    if "onrender.com" in host or bool(os.getenv("RENDER")) or os.getenv("ENVIRONMENT") == "production":
        return "https://tune-fetch-tan.vercel.app"

    env_url = os.getenv("FRONTEND_URL", "")
    if env_url and "localhost" not in env_url and "127.0.0.1" not in env_url:
        return env_url.rstrip("/")

    return FRONTEND_URL or "https://tune-fetch-tan.vercel.app"

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
    frontend_url = get_frontend_url(request)
    auth_url = SpotifyService.create_auth_url(user_id=current_user.id, request=request, frontend_url=frontend_url)
    if redirect:
        resp = RedirectResponse(url=auth_url)
        set_session_cookie(resp, current_user.id)
        return resp
    return {"success": True, "auth_url": auth_url}

@router.get("/callback")
async def spotify_auth_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Handles the Spotify authorization code redirect. Exchanges code for tokens and persists connection.
    """
    target_frontend = get_frontend_url(request, state)
    if error:
        logger.warning(f"Spotify OAuth error received: {error}")
        safe_error = urllib.parse.quote_plus(str(error))
        return RedirectResponse(url=f"{target_frontend}/?spotify_error={safe_error}")

    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing authorization code or state parameter.")

    try:
        account, resolved_user_id = await SpotifyService.exchange_code_for_tokens(
            user_id=current_user.id,
            code=code,
            state=state,
            db=db,
            request=request
        )
        resp = RedirectResponse(url=f"{target_frontend}/?spotify=connected")
        set_session_cookie(resp, resolved_user_id)
        return resp
    except Exception as e:
        logger.error(f"Callback token exchange error: {e}")
        safe_error = urllib.parse.quote_plus(str(e))
        return RedirectResponse(url=f"{target_frontend}/?spotify_error={safe_error}")

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
    if not SERPER_API_KEY or not SERPER_API_KEY.strip():
        raise HTTPException(
            status_code=400,
            detail="Serper API key is missing and will not be able to proceed further. Sorry, please provide me one."
        )

    job_id = await PlaylistPipeline.create_and_start_job(
        user_id=current_user.id,
        playlist_id=playlist_id,
        format_type=req.format or "mp3-320",
        track_ids=req.track_ids
    )
    return {"success": True, "job_id": job_id}

@router.post("/track/download")
async def download_single_spotify_track(
    req: SingleTrackDownloadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Downloads an individual song from a Spotify playlist:
    1. Checks database cache (matching BOTH song_name and artist_name).
       If found, Serper API is completely bypassed.
    2. If not found, calls Serper API and caches resolved candidate in PostgreSQL.
    3. Initiates single download via existing DownloadManager.
    """
    try:
        candidate_url = await SerperService.find_best_audio_url(
            song_name=req.song_name,
            artists=req.artist_name,
            db=db
        )
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not resolve track: {exc}")

    task_id = DownloadManager.create_download_task(
        url=candidate_url,
        format_type=req.format or "mp3-320",
        custom_title=req.song_name,
        custom_artist=req.artist_name,
        custom_thumbnail=req.thumbnail or ""
    )
    return {
        "success": True,
        "task_id": task_id,
        "candidate_url": candidate_url,
        "title": req.song_name,
        "artist": req.artist_name
    }

@router.get("/jobs/latest")
def get_latest_playlist_job(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the most recent playlist download batch job for the current user.
    """
    job = db.query(PlaylistDownloadJob).filter(
        PlaylistDownloadJob.user_id == current_user.id
    ).order_by(PlaylistDownloadJob.created_at.desc()).first()

    if not job:
        return {"success": True, "job": None}

    status = PlaylistPipeline.get_job_status(job_id=job.id, user_id=current_user.id, db=db)
    return {"success": True, "job": status}

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

@router.get("/jobs/{job_id}/zip")
def download_playlist_zip(
    job_id: str,
    db: Session = Depends(get_db)
):
    """
    Streams the packaged ZIP folder containing all downloaded tracks for the playlist.
    """
    job = db.query(PlaylistDownloadJob).filter(
        PlaylistDownloadJob.id == job_id
    ).first()

    if not job:
        raise HTTPException(status_code=404, detail="Playlist job not found.")

    if job.status != "COMPLETED":
        raise HTTPException(status_code=400, detail=f"Playlist download is still processing ({job.status}).")

    if not job.zip_path or not os.path.exists(job.zip_path):
        raise HTTPException(status_code=404, detail="ZIP archive not found or has expired.")

    from fastapi.responses import FileResponse

    download_name = job.zip_filename or "Thanks_for_downloading.zip"
    if not download_name.lower().endswith(".zip"):
        download_name = f"{download_name}.zip"

    return FileResponse(
        path=job.zip_path,
        filename=download_name,
        media_type="application/zip",
        headers={
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
