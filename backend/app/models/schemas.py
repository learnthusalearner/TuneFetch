from typing import Optional, List, Any
from pydantic import BaseModel, Field

class InfoRequest(BaseModel):
    url: str = Field(..., description="Target media URL (Spotify, YouTube, SoundCloud, etc.)")

class DownloadRequest(BaseModel):
    url: str = Field(..., description="Target media URL or query")
    format: Optional[str] = Field("mp3-320", description="Audio format: mp3-320, mp3-256, mp3-128, or best-audio")
    title: Optional[str] = Field(None, description="Custom track title")
    artist: Optional[str] = Field(None, description="Custom artist/uploader name")
    thumbnail: Optional[str] = Field(None, description="Custom artwork thumbnail URL")

class TrackItem(BaseModel):
    id: int
    title: str
    artist: Optional[str] = ""
    duration: Optional[int] = 0
    thumbnail: Optional[str] = ""
    url: Optional[str] = None
    search_query: Optional[str] = None

class MediaInfoResponse(BaseModel):
    is_playlist: bool
    platform: str
    title: str
    artist: Optional[str] = None
    thumbnail: Optional[str] = None
    duration: Optional[int] = None
    track_count: Optional[int] = None
    tracks: Optional[List[TrackItem]] = None
    original_url: str
    search_query: Optional[str] = None
    formats: Optional[List[str]] = None

class TaskStatusResponse(BaseModel):
    id: str
    url: str
    title: str
    artist: str
    thumbnail: str
    status: str
    progress: float
    speed: str
    eta: str
    file_id: Optional[str] = None
    filename: Optional[str] = None
    filesize: Optional[int] = 0
    error: Optional[str] = None
    created_at: float

class HealthResponse(BaseModel):
    status: str
    ffmpeg_available: bool
    ffmpeg_path: str
    version: str
