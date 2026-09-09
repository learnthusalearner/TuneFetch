from fastapi import APIRouter
from app.utils.ffmpeg_helper import get_ffmpeg_path
from app.models.schemas import HealthResponse
from app.core.config import APP_VERSION

router = APIRouter(prefix="/api", tags=["Health"])

@router.api_route("/health", methods=["GET", "HEAD"], response_model=HealthResponse)
def health_check():
    """
    Checks backend health, version, and FFmpeg engine availability.
    """
    ffmpeg_path = get_ffmpeg_path()
    return {
        "status": "healthy",
        "ffmpeg_available": bool(ffmpeg_path),
        "ffmpeg_path": ffmpeg_path or "Not found (direct stream extraction only)",
        "version": APP_VERSION
    }
