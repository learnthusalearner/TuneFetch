# 🎧 TuneFetch - High-Fidelity Spotify Playlist & Audio Extractor

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/React-19+-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5+-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-00E599?style=for-the-badge&logo=postgresql&logoColor=black" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Spotify-OAuth%20PKCE-1DB954?style=for-the-badge&logo=spotify&logoColor=white" alt="Spotify" />
  <img src="https://img.shields.io/badge/yt--dlp-Latest-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="yt-dlp" />
  <img src="https://img.shields.io/badge/FFmpeg-Embedded-0078D7?style=for-the-badge&logo=windows&logoColor=white" alt="FFmpeg" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License" />
</p>

---

## 📖 Overview

**TuneFetch** is an audio extraction, conversion, and Spotify playlist downloading platform. It features an asynchronous **Python (FastAPI + `yt-dlp`)** backend engine, **Neon PostgreSQL** with Fernet token encryption for multi-user Spotify OAuth, and a modern, responsive **React (Vite)** frontend with dark glassmorphism styling.

TuneFetch connects directly with Spotify via OAuth 2.0 PKCE, retrieves public, private, and collaborative playlists (supporting 10, 100, 500, 1,400+ songs with full pagination), resolves tracks to high-fidelity audio streams via Serper Google Video search, and queues them through the high-throughput `yt-dlp` download engine.

Once converted, playlists can be saved **directly into a real Windows folder on your PC** (`Thanks_for_downloading`) containing all `{Artist} - {Song Title}.mp3` files, eliminating the need to manually unzip archives!

---

## ✨ Key Features

- 🟢 **Spotify OAuth 2.0 with PKCE**: Full multi-user authorization flow allowing users to inspect and download their own private, collaborative, and public Spotify playlists.
- 📁 **Direct Windows Folder Saving on PC**: Leverages the browser's native **File System Access API (`window.showDirectoryPicker`)** and **JSZip** to unpack all MP3 songs directly into a local Windows folder (`Thanks_for_downloading`) on your computer.
- 🐘 **Neon PostgreSQL Global Caching (`resolved_songs`)**: Every song URL discovered is permanently cached in PostgreSQL, matching by both cleaned `song_name` and `artist_name`. Repeated downloads across any user completely bypass Serper API calls.
- ⏱️ **Live ETA Countdown & Job Persistence**: Calculates real-time completion countdown. Users can close the page, do other tasks, and return later; the session automatically reconnects to their active or completed folder.
- 📜 **Full Pagination Engine**: Effortlessly extracts playlists containing **10, 100, 500, or 1,400+ tracks** without memory bottlenecks or missing tracks.
- 🔍 **Serper Candidate Resolution**: Automated high-speed search resolution using Serper API (`Song + Artist audio`) to find the best candidate audio stream, with seamless `ytsearch1:` fallback.
- 🛡️ **Zero-Disk-Accumulation Architecture**: Once a user downloads an audio file, it is automatically purged from the server via FastAPI `BackgroundTasks` to guarantee zero persistent server disk usage.
- ⚡ **High-Throughput Concurrency Throttling**: Employs a bounded worker pool (`ThreadPoolExecutor`) to smoothly handle concurrent download requests without CPU, bandwidth, or memory exhaustion.
- 🔄 **Continuous Background Garbage Collector (GC)**: An autonomous background daemon sweeps temporary files and purges abandoned or un-downloaded files older than 2 hours.
- 🛠️ **Embedded FFmpeg Engine**: Powered by `imageio-ffmpeg` to ensure zero-configuration MP3 conversion on Windows and cross-platform systems without requiring global PATH edits.
- 🐍 **Automatic Venv Detection (`run.py`)**: Automatically detects and executes inside the project's virtual environment even if executed from global Python.
- 💾 **Reliable Named File Downloads**: Dual standard `Content-Disposition` headers and in-memory blob triggers guarantee proper `Artist - Title.mp3` file naming across all browsers without bare UUID downloads.

---

## 🏗️ Project Architecture

```
TuneFetch/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py            # Global settings, DB connection string, secrets
│   │   │   └── database.py          # SQLAlchemy engine, session maker & init_db
│   │   ├── models/
│   │   │   ├── db_models.py         # User, SpotifyAccount, PlaylistDownloadJob, ResolvedSong
│   │   │   └── schemas.py           # Pydantic schemas for data validation
│   │   ├── routes/
│   │   │   ├── health.py            # /api/health endpoint
│   │   │   ├── media.py             # /api/file, /api/stream, /api/status
│   │   │   └── spotify.py           # /spotify/auth, /callback, /playlists, /download, /jobs
│   │   ├── services/
│   │   │   ├── downloader.py        # Core yt-dlp download engine
│   │   │   ├── spotify_service.py   # PKCE OAuth, token refresh & 1,400+ track pagination
│   │   │   ├── serper_service.py    # Serper candidate search & DB caching
│   │   │   ├── playlist_pipeline.py # Background batch worker bridging Spotify -> yt-dlp
│   │   │   └── spotify_resolver.py  # Spotify URL format helpers
│   │   ├── utils/
│   │   │   ├── auth_helper.py       # Fernet token encryption & signed session cookies
│   │   │   ├── ffmpeg_helper.py     # Embedded/system FFmpeg binary locator
│   │   │   └── sanitizer.py         # Filename sanitization & Content-Disposition builder
│   │   ├── main.py                  # FastAPI app entrypoint with DB lifespan
│   │   └── __init__.py
│   ├── downloads/                   # Temporary directory for converted audio files
│   ├── tests/
│   │   └── test_spotify_pipeline.py # 9 automated tests for the full pipeline
│   ├── requirements.txt             # Python backend dependencies
│   └── run.py                       # Backend server launcher with auto-venv detection
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # Top navigation bar & backend health badge
│   │   │   ├── ProgressCard.jsx     # Animated progress bar & single track download
│   │   │   ├── AudioPlayer.jsx      # In-browser audio player with scrub & volume controls
│   │   │   ├── HistoryDrawer.jsx    # Download history drawer
│   │   │   └── Spotify/
│   │   │       ├── SpotifyConnect.jsx      # Spotify OAuth authorization status card
│   │   │       ├── SpotifyPlaylists.jsx    # Grid of user playlists with search filter
│   │   │       ├── PlaylistTracksModal.jsx # Full tracklist preview & batch download
│   │   │       └── BatchProgressCard.jsx   # Live batch job progress & Save to Folder
│   │   ├── constants/
│   │   │   └── index.js             # Formats, platforms, and storage keys
│   │   ├── hooks/
│   │   │   ├── useLocalStorage.js   # Persistent local storage state hook
│   │   │   └── useDownloadTask.js   # Task polling and lifecycle hook
│   │   ├── services/
│   │   │   └── api.js               # API client with Spotify endpoints
│   │   ├── utils/
│   │   │   ├── folderSaver.js       # File System Access API direct folder unpacker
│   │   │   └── formatters.js        # Duration, file size, and timestamp helpers
│   │   ├── App.jsx                  # Main application controller
│   │   ├── index.css                # Dark glassmorphism styling
│   │   └── main.jsx                 # React root mount
│   ├── package.json
│   ├── vite.config.js               # Proxy setup (/api, /spotify -> backend:8000)
│   └── index.html
│
├── docs/
│   ├── ARCHITECTURE.md              # Comprehensive architectural specification
│   ├── run.md                       # Complete run & setup walkthrough
│   └── spotify-integration.md       # Spotify OAuth & Playlist Architecture Guide
├── start.bat                        # Windows 1-Click Launcher (CMD)
├── start.ps1                        # PowerShell 1-Click Launcher
└── README.md                        # Project documentation
```

---

## ⚡ Quickstart Guide

### 1. Configure Environment Variables
Create a `backend/.env` file:
```ini
DATABASE_URL=postgresql://neondb_owner:npg_Ft4NsXkSvh5f@ep-jolly-truth-avnf7grx-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require
ENCRYPTION_KEY=D704Q8l-s_gQ9Yj6uX2kO1Kz3-h1x9jL0yA5m8B_yFw=
SESSION_SECRET_KEY=tunefetch-secure-cookie-session-secret-key-32chars
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:8000/spotify/callback
SERPER_API_KEY=your_serper_api_key
```

### 2. Launching with 1-Click Scripts
On Windows, double-click:
```bash
start.bat
```
Or run in PowerShell:
```powershell
.\start.ps1
```

### 3. Manual Launch

**Backend:**
```bash
cd backend
python run.py
```
*(The script automatically detects and runs inside `backend\venv` if present).*

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Testing

Run the automated test suite covering Spotify PKCE, token encryption at rest, automatic token refreshing, 1,400+ playlist pagination, database caching, and multi-user isolation:

```bash
cd backend
venv\Scripts\pytest tests\test_spotify_pipeline.py
```

---

## 📄 License
Distributed under the MIT License.
