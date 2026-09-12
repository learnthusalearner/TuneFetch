import os
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.core.config import AUTO_DELETE_ON_DOWNLOAD
from app.services.downloader import DownloadManager
from app.models.schemas import InfoRequest, DownloadRequest
from app.models.db_models import User
from app.utils.auth_helper import get_current_user
from app.utils.sanitizer import build_content_disposition_header

router = APIRouter(prefix="/api", tags=["Media"])

class UserCookiePayload(BaseModel):
    cookies: str

@router.post("/user-cookies")
def set_user_cookies(
    payload: UserCookiePayload,
    current_user: User = Depends(get_current_user)
):
    """
    Saves user-provided YouTube verification cookies in ephemeral server memory.
    Cookies are held ONLY while downloads are processed and deleted once all songs are downloaded.
    """
    raw_cookies = payload.cookies or ""
    if not raw_cookies.strip():
        raise HTTPException(status_code=400, detail="Cookies content cannot be empty.")

    from app.services.user_cookie_store import UserCookieStore
    count = UserCookieStore.set_cookies(current_user.id, raw_cookies)
    if count == 0:
        raise HTTPException(status_code=400, detail="Could not parse any valid cookies. Please verify the format.")

    return {
        "success": True,
        "count": count,
        "message": f"Successfully loaded {count} cookies. They will be automatically deleted once your downloads finish."
    }

@router.get("/user-cookies/status")
def get_user_cookies_status(
    current_user: User = Depends(get_current_user)
):
    """
    Returns whether the current user has active ephemeral cookies in memory.
    """
    from app.services.user_cookie_store import UserCookieStore
    has_cookies = UserCookieStore.has_cookies(current_user.id)
    count = UserCookieStore.get_cookie_count(current_user.id)
    return {
        "has_cookies": has_cookies,
        "count": count
    }

@router.delete("/user-cookies")
def delete_user_cookies(
    current_user: User = Depends(get_current_user)
):
    """
    Manually purges the user's cookies from server memory.
    """
    from app.services.user_cookie_store import UserCookieStore
    deleted = UserCookieStore.delete_cookies(current_user.id)
    return {
        "success": True,
        "deleted": deleted
    }

@router.post("/info")
def fetch_info(
    req: InfoRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Extracts metadata, durations, thumbnails, and tracks for single media or playlists.
    """
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    try:
        data = DownloadManager.get_info(req.url.strip())
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/stream-url")
def get_stream_url(req: InfoRequest):
    """
    Resolves direct audio stream URL and metadata for client-side / distributed fetching.
    Allows clients or browsers to fetch audio streams straight from GoogleVideo servers.
    """
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    try:
        data = DownloadManager.get_direct_stream_url(req.url.strip())
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/download")
def start_download(
    req: DownloadRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Spawns an asynchronous background download & conversion worker within a bounded thread pool.
    """
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    try:
        task_id = DownloadManager.create_download_task(
            url=req.url.strip(),
            format_type=req.format or "mp3-320",
            custom_title=req.title,
            custom_artist=req.artist,
            custom_thumbnail=req.thumbnail,
            user_id=current_user.id,
            is_single_download=True
        )
        return {"success": True, "task_id": task_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{task_id}")
def check_status(task_id: str):
    """
    Retrieves the real-time progress, speed, ETA, and state of a download task.
    """
    task = DownloadManager.get_task_status(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"success": True, "task": task}

@router.get("/file/{task_id}")
@router.get("/file/{task_id}/{requested_filename}")
def download_file(
    task_id: str,
    background_tasks: BackgroundTasks,
    requested_filename: Optional[str] = None
):
    """
    Serves the audio file with dual Content-Disposition headers and automatically
    deletes the physical file immediately after client delivery to guarantee zero disk accumulation.
    """
    filepath = DownloadManager.get_task_filepath(task_id)
    if not filepath or not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Audio file not found or already cleaned up from server.")
    
    actual_filename = os.path.basename(filepath)
    if f"{task_id}_" in actual_filename:
        actual_filename = actual_filename.split(f"{task_id}_", 1)[-1]
        
    ext = os.path.splitext(actual_filename)[1].lower() or ".mp3"
    final_filename = requested_filename if (requested_filename and "." in requested_filename) else actual_filename
    if not final_filename.lower().endswith(ext):
        final_filename = f"{final_filename}{ext}"
    
    content_disposition, media_type = build_content_disposition_header(final_filename, ext)

    # Schedule immediate post-delivery disk purge
    if AUTO_DELETE_ON_DOWNLOAD:
        background_tasks.add_task(DownloadManager.delete_task_file_safely, task_id, 3.0)

    return FileResponse(
        path=filepath,
        filename=final_filename,
        media_type=media_type,
        headers={
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@router.get("/stream/{task_id}")
def stream_audio(task_id: str):
    """
    Streams the audio file for in-browser HTML5 player previewing.
    """
    filepath = DownloadManager.get_task_filepath(task_id)
    if not filepath or not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Audio file not found or expired.")
    
    filename = os.path.basename(filepath)
    ext = os.path.splitext(filename)[1].lower()
    media_type = "audio/mpeg" if ext == ".mp3" else ("audio/mp4" if ext == ".m4a" else "audio/webm")

    return FileResponse(path=filepath, media_type=media_type)

@router.delete("/file/{task_id}")
def delete_file_explicitly(task_id: str):
    """
    Allows clients to explicitly trigger immediate file cleanup.
    """
    DownloadManager.delete_task_file_safely(task_id, delay_seconds=0.0)
    return {"success": True, "message": f"File cleanup initiated for {task_id}"}
