import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DOWNLOADS_DIR = os.path.join(BASE_DIR, "downloads")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# Application metadata
APP_TITLE = "TuneFetch Audio Engine"
APP_DESCRIPTION = "High-performance, resource-capped backend powered by yt-dlp to extract high-fidelity MP3 and raw audio streams."
APP_VERSION = "1.1.0"

# Concurrency and Server Load Throttling
MAX_CONCURRENT_DOWNLOADS = 4   # Max parallel yt-dlp threads to prevent CPU/RAM exhaustion
MAX_TASK_HISTORY = 300         # Maximum number of task records kept in memory to prevent leaks

# Storage and Lifecycle (Zero-Accumulation Architecture)
AUTO_DELETE_ON_DOWNLOAD = True # Automatically delete the file immediately after user downloads
MAX_FILE_AGE_SECONDS = 300     # 5 minutes threshold: deletes abandoned/un-downloaded files
CLEANUP_INTERVAL_SECONDS = 60  # Sweeper interval for garbage collection daemon

# Audio settings
DEFAULT_BITRATE = "320"        # 320 kbps MP3 quality default
ALLOWED_FORMATS = ["mp3-320", "mp3-256", "mp3-128", "best-audio"]

# CORS configuration
CORS_ORIGINS = ["*"]
