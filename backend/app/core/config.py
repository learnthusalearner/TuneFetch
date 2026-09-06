import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DOWNLOADS_DIR = os.path.join(BASE_DIR, "downloads")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# Application metadata
APP_TITLE = "TuneFetch Audio Engine"
APP_DESCRIPTION = "High-performance backend powered by yt-dlp to extract high-fidelity MP3 and raw audio streams."
APP_VERSION = "1.0.0"

# Task and file lifecycle
MAX_FILE_AGE_SECONDS = 3600  # Clean up files older than 1 hour
DEFAULT_BITRATE = "320"      # 320 kbps MP3 quality default
ALLOWED_FORMATS = ["mp3-320", "mp3-256", "mp3-128", "best-audio"]

# CORS configuration
CORS_ORIGINS = ["*"]
