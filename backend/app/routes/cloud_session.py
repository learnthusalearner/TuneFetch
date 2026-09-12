import os
import logging
import httpx
from typing import Optional, List, Dict, Any
from pathlib import Path
from fastapi import APIRouter, HTTPException, Response, Request
from pydantic import BaseModel

from app.services.cloud_session_store import CloudSessionStore
from app.services.local_batch_downloader import LocalBatchDownloader

logger = logging.getLogger("cloud_session_route")

router = APIRouter(tags=["Cloud Session & Local Downloader"])

CLOUD_BACKEND_URL = os.getenv("RENDER_EXTERNAL_URL", "https://tunefetch-t5mp.onrender.com").rstrip("/")

class CreateSessionRequest(BaseModel):
    playlist_name: str
    tracks: List[Dict[str, Any]]
    image: Optional[str] = ""

class LocalDownloadRequest(BaseModel):
    playlist_name: str
    tracks: List[Dict[str, Any]]
    format: Optional[str] = "mp3-320"

class ImportSessionRequest(BaseModel):
    session_code: str
    format: Optional[str] = "mp3-320"

# ----------------- CLOUD SESSION ENDPOINTS (RUNS ON CLOUD / LOCAL) -----------------

@router.post("/api/cloud-session")
def create_cloud_session(req: CreateSessionRequest):
    """
    Called by Web App: Takes the songs JSON extracted via Spotify OAuth,
    and returns a short 4-digit code (e.g. TF-4982) valid for 24h.
    """
    if not req.tracks or len(req.tracks) == 0:
        raise HTTPException(status_code=400, detail="Cannot create session with empty tracks list.")

    code = CloudSessionStore.create_session(
        playlist_name=req.playlist_name,
        tracks=req.tracks,
        image=req.image
    )
    return {
        "success": True,
        "session_code": code,
        "total_tracks": len(req.tracks),
        "playlist_name": req.playlist_name,
        "expires_in_hours": 24
    }

@router.get("/api/cloud-session/{code}")
def get_cloud_session(code: str):
    """
    Retrieves songs JSON by session code.
    """
    session = CloudSessionStore.get_session(code)
    if not session:
        raise HTTPException(status_code=404, detail=f"Download session '{code}' not found or has expired.")

    return {
        "success": True,
        "session": session
    }

# ----------------- LOCAL DESKTOP APP ENDPOINTS -----------------

@router.options("/api/local/{path:path}")
def local_options(path: str, response: Response):
    """Handles CORS and Private Network Access preflights from web browser to local app."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    return Response(status_code=200)

@router.get("/api/local/status")
def get_local_desktop_status(response: Response):
    """
    Allows web app to detect if user has TuneFetch Desktop open on localhost:8000.
    """
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Private-Network"] = "true"

    downloads_dir = os.environ.get("DOWNLOADS_DIR", str(Path.home() / "Downloads" / "TuneFetch"))
    return {
        "status": "online",
        "mode": "desktop",
        "version": "1.3.0",
        "downloads_dir": downloads_dir,
    }

@router.post("/api/local/download")
def start_local_download_batch(req: LocalDownloadRequest, response: Response):
    """
    1-Click direct download: Receives songs JSON from web browser or desktop UI,
    and downloads audio files directly onto the local PC.
    """
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Private-Network"] = "true"

    if not req.tracks:
        raise HTTPException(status_code=400, detail="No tracks provided for download.")

    batch_id = LocalBatchDownloader.start_batch(
        playlist_name=req.playlist_name,
        tracks=req.tracks,
        format_type=req.format or "mp3-320",
    )

    return {
        "success": True,
        "batch_id": batch_id,
        "playlist_name": req.playlist_name,
        "total_tracks": len(req.tracks),
    }

@router.get("/api/local/progress/{batch_id}")
def get_local_batch_progress(batch_id: str, response: Response):
    """
    Polls the progress of an ongoing local playlist download batch.
    """
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Private-Network"] = "true"

    status = LocalBatchDownloader.get_batch_status(batch_id)
    if not status:
        raise HTTPException(status_code=404, detail="Batch job not found.")

    return {
        "success": True,
        "batch": status
    }

@router.post("/api/local/import-session")
async def import_session_and_download(req: ImportSessionRequest, response: Response):
    """
    Fetches the playlist songs JSON from the cloud backend by session code,
    and initiates the local batch download immediately.
    """
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Private-Network"] = "true"

    code = (req.session_code or "").strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Please enter a valid session code.")

    # 1. Try local session store first
    session = CloudSessionStore.get_session(code)

    # 2. If not in local memory, fetch from cloud backend API
    if not session:
        cloud_url = f"{CLOUD_BACKEND_URL}/api/cloud-session/{code}"
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(cloud_url)
                if res.status_code == 200:
                    data = res.json()
                    session = data.get("session")
                else:
                    raise HTTPException(status_code=404, detail=f"Code '{code}' not found on cloud server.")
        except HTTPException:
            raise
        except Exception as err:
            logger.error(f"Error fetching session '{code}' from cloud backend: {err}")
            raise HTTPException(status_code=500, detail=f"Could not reach cloud server: {err}")

    if not session or not session.get("tracks"):
        raise HTTPException(status_code=404, detail=f"No tracks found for session code '{code}'.")

    # 3. Start local batch download
    batch_id = LocalBatchDownloader.start_batch(
        playlist_name=session.get("playlist_name", "Spotify Playlist"),
        tracks=session.get("tracks", []),
        format_type=req.format or "mp3-320",
    )

    return {
        "success": True,
        "batch_id": batch_id,
        "playlist_name": session.get("playlist_name"),
        "total_tracks": len(session.get("tracks", [])),
    }
