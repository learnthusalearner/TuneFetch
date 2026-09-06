# 🎧 TuneFetch - High-Fidelity Audio, MP3 & Spotify Playlist Extractor

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

TuneFetch seamlessly handles:
1. **Direct Single Tracks & Playlists**: Direct extraction from YouTube, YouTube Music, SoundCloud, and web media.
2. **Spotify OAuth & Batch Playlist Downloader**: Connects your Spotify account via OAuth 2.0 PKCE, retrieves public, private, and collaborative playlists (supporting 10, 100, 500, 1,400+ songs with full pagination), resolves tracks to high-fidelity audio streams via Serper Google Video search, and queues them through the high-throughput `yt-dlp` download engine.

---

## ✨ Key Features

- 🟢 **Spotify OAuth 2.0 with PKCE**: Full multi-user authorization flow allowing users to inspect and download their own private, collaborative, and public Spotify playlists.
- 🐘 **Neon PostgreSQL & Encrypted Tokens**: User sessions and Spotify tokens stored securely with symmetric authenticated encryption (**Fernet AES-128-CBC + HMAC-SHA256**) at rest.
- 📜 **Full Pagination Engine**: Effortlessly extracts playlists containing **10, 100, 500, or 1,400+ tracks** without memory bottlenecks or missing tracks.
- 🔍 **Serper Candidate Resolution**: Automated high-speed search resolution using Serper API (`Song + Artist audio`) to find the best candidate audio stream, with seamless `ytsearch1:` fallback.
- 🛡️ **Zero-Disk-Accumulation Architecture**: Once a user downloads an audio file, it is automatically purged from the server via FastAPI `BackgroundTasks` to guarantee zero persistent server disk usage.
- ⚡ **High-Throughput Concurrency Throttling**: Employs a bounded worker pool (`ThreadPoolExecutor`) to smoothly handle thousands of concurrent download requests without CPU, bandwidth, or memory exhaustion.
- 🔄 **Continuous Background Garbage Collector (GC)**: An autonomous background daemon sweeps temporary files and purges abandoned or un-downloaded files older than 5 minutes.
- 🛠️ **Embedded FFmpeg Engine**: Powered by `imageio-ffmpeg` to ensure zero-configuration MP3 conversion on Windows and cross-platform systems without requiring global PATH edits.
- 📊 **Real-Time Batch Progress Tracking**: Live dashboard monitoring batch jobs with percentage progress, active song status, success/failure counts, and in-browser playback.
- 🎵 **Built-in HTML5 Audio Preview**: Play and scrub through downloaded audio files in the browser before or after saving them to disk.
- 💾 **Safe Named File Downloads**: Dual standard `Content-Disposition` headers guaranteeing proper `Artist - Title.mp3` file naming across all browsers.

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
│   │   │   ├── db_models.py         # User, SpotifyAccount, PlaylistDownloadJob
│   │   │   └── schemas.py           # Pydantic schemas for data validation
│   │   ├── routes/
│   │   │   ├── health.py            # /api/health endpoint
│   │   │   ├── media.py             # /api/info, /api/download, /api/file, /api/stream
│   │   │   └── spotify.py           # /spotify/auth, /callback, /playlists, /download
│   │   ├── services/
│   │   │   ├── downloader.py        # UNTOUCHED core yt-dlp download engine
│   │   │   ├── spotify_service.py   # PKCE OAuth, token refresh & 1,400+ track pagination
│   │   │   ├── serper_service.py    # Serper candidate search & ytsearch fallback
│   │   │   ├── playlist_pipeline.py # Background batch worker bridging Spotify -> yt-dlp
│   │   │   └── spotify_resolver.py  # Direct single-URL Spotify oEmbed resolver
│   │   ├── utils/
│   │   │   ├── auth_helper.py       # Fernet token encryption & signed session cookies
│   │   │   ├── ffmpeg_helper.py     # Embedded/system FFmpeg binary locator
│   │   │   └── sanitizer.py         # Filename sanitization & Content-Disposition builder
│   │   ├── main.py                  # FastAPI app entrypoint with DB lifespan
│   │   └── __init__.py
│   ├── downloads/                   # Temporary directory for converted audio files
│   ├── tests/
│   │   └── test_spotify_pipeline.py # Automated test suite for Spotify pipeline
│   ├── requirements.txt             # Python backend dependencies
│   └── run.py                       # Backend server launcher
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # Top navigation bar & backend health badge
│   │   │   ├── UrlInput.jsx         # Input bar with auto-platform detection & paste
│   │   │   ├── MediaCard.jsx        # Track preview card & bitrate quality selector
│   │   │   ├── PlaylistCard.jsx     # Direct URL playlist overview & track downloader
│   │   │   ├── ProgressCard.jsx     # Animated progress bar & direct file download
│   │   │   ├── AudioPlayer.jsx      # In-browser audio player with scrub & volume controls
│   │   │   ├── HistoryDrawer.jsx    # Download history drawer
│   │   │   └── Spotify/
│   │   │       ├── SpotifyConnect.jsx    # Spotify OAuth authorization status badge
│   │   │       ├── SpotifyPlaylists.jsx  # Grid of user playlists with search filter
│   │   │       ├── PlaylistTracksModal.jsx # Full tracklist preview & format selector
│   │   │       └── BatchProgressCard.jsx # Live batch job progress dashboard
│   │   ├── constants/
│   │   │   └── index.js             # Formats, platforms, and storage keys
│   │   ├── hooks/
│   │   │   ├── useLocalStorage.js   # Persistent local storage state hook
│   │   │   └── useDownloadTask.js   # Task polling and lifecycle hook
│   │   ├── services/
│   │   │   └── api.js               # API client with Spotify endpoints
│   │   ├── utils/
│   │   │   └── formatters.js        # Duration, file size, and timestamp helpers
│   │   ├── App.jsx                  # Tabbed controller (Direct URL vs Spotify)
│   │   ├── index.css                # Dark glassmorphism styling
│   │   └── main.jsx                 # React root mount
│   ├── package.json
│   ├── vite.config.js               # Proxy setup (/api, /spotify -> backend:8000)
│   └── index.html
│
├── docs/
│   └── spotify-integration.md       # Full Spotify OAuth & Playlist Architecture Guide
├── start.bat                        # Windows 1-Click Launcher (CMD)
├── start.ps1                        # PowerShell 1-Click Launcher
├── ARCHITECTURE.md                  # Comprehensive architectural specification
└── README.md                        # Documentation
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
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Testing

Run the automated test suite covering Spotify PKCE, token encryption at rest, automatic token refreshing, 1,400+ playlist pagination, and multi-user isolation:

```bash
backend\venv\Scripts\pytest backend\tests\test_spotify_pipeline.py
```

---

## 📄 License
Distributed under the MIT License.
