import os
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse

from app.core.config import AUTO_DELETE_ON_DOWNLOAD
from app.services.downloader import DownloadManager
from app.models.schemas import InfoRequest, DownloadRequest
from app.utils.sanitizer import build_content_disposition_header

router = APIRouter(prefix="/api", tags=["Media"])

@router.post("/info")
def fetch_info(req: InfoRequest):
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

@router.post("/download")
def start_download(req: DownloadRequest):
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
            custom_thumbnail=req.thumbnail
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
        
    final_filename = requested_filename if (requested_filename and "." in requested_filename) else actual_filename
    ext = os.path.splitext(actual_filename)[1].lower() or ".mp3"
    
    content_disposition, media_type = build_content_disposition_header(final_filename, ext)

    # Schedule immediate post-delivery disk purge
    if AUTO_DELETE_ON_DOWNLOAD:
        background_tasks.add_task(DownloadManager.delete_task_file_safely, task_id, 3.0)

    return FileResponse(
        path=filepath,
        filename=final_filename,
        media_type=media_type,
        headers={
            "Content-Disposition": content_disposition,
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
