import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DOWNLOADS_DIR = os.path.join(BASE_DIR, "downloads")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)

# Load environment variables from .env
load_dotenv(os.path.join(BASE_DIR, ".env"))

# Application metadata
APP_TITLE = "TuneFetch Audio Engine"
APP_DESCRIPTION = "High-performance, resource-capped backend powered by yt-dlp to extract high-fidelity MP3 and raw audio streams."
APP_VERSION = "1.2.0"

# Database Configuration (Neon PostgreSQL or SQLite fallback)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{os.path.join(BASE_DIR, 'tunefetch_dev.db')}"
)

# Spotify OAuth Configuration
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI", "http://127.0.0.1:8000/spotify/callback")
SPOTIFY_SCOPES = "playlist-read-private playlist-read-collaborative"

# Serper Search API
SERPER_API_KEY = os.getenv("SERPER_API_KEY", "")

# Security & Session Secrets
SESSION_SECRET_KEY = os.getenv("SESSION_SECRET_KEY", "tunefetch_dev_secret_key_change_in_production")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Concurrency and Server Load Throttling
MAX_CONCURRENT_DOWNLOADS = 4   # Max parallel yt-dlp threads to prevent CPU/RAM exhaustion
MAX_TASK_HISTORY = 300         # Maximum number of task records kept in memory

# Storage and Lifecycle
AUTO_DELETE_ON_DOWNLOAD = True # Automatically delete the file immediately after user downloads
MAX_FILE_AGE_SECONDS = 7200    # 2 hours threshold: allows large playlist downloads and users returning later
CLEANUP_INTERVAL_SECONDS = 60  # Sweeper interval for garbage collection daemon

# Audio settings
DEFAULT_BITRATE = "320"        # 320 kbps MP3 quality default
ALLOWED_FORMATS = ["mp3-320", "mp3-256", "mp3-128", "best-audio"]

# CORS configuration: strict allowed origins with credentials support
cors_env = os.getenv("CORS_ORIGINS", "")
if cors_env:
    CORS_ORIGINS = [orig.strip() for orig in cors_env.split(",") if orig.strip()]
else:
    CORS_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://tune-fetch-tan.vercel.app",
        "https://tunefetch-t5mp.onrender.com",
    ]
if FRONTEND_URL and FRONTEND_URL not in CORS_ORIGINS:
    CORS_ORIGINS.append(FRONTEND_URL)
if "https://tune-fetch-tan.vercel.app" not in CORS_ORIGINS:
    CORS_ORIGINS.append("https://tune-fetch-tan.vercel.app")
CORS_ORIGINS = list(dict.fromkeys(CORS_ORIGINS))


