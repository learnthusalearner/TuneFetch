# 🎧 TuneFetch - High-Fidelity Audio & MP3 Extractor

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/React-19+-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5+-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/yt--dlp-Latest-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="yt-dlp" />
  <img src="https://img.shields.io/badge/FFmpeg-Embedded-0078D7?style=for-the-badge&logo=windows&logoColor=white" alt="FFmpeg" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License" />
</p>

---

## 📖 Overview

**TuneFetch** is a full-stack audio extraction and conversion platform. It features an asynchronous **Python (FastAPI + `yt-dlp`)** backend engine and a modern, responsive **React (Vite)** frontend with dark glassmorphism styling.

TuneFetch seamlessly downloads audio streams from **YouTube, YouTube Music, Spotify tracks/playlists, SoundCloud**, and generic web media, automatically converting them into high-bitrate **.MP3** files (`320 kbps`, `256 kbps`, `128 kbps`) or preserving the original lossless direct audio stream.

---

## ✨ Key Features

- 🚀 **Asynchronous Audio Pipeline**: Non-blocking download and post-processing workers managed with thread-safe task pools.
- 🛠️ **Embedded FFmpeg Engine**: Powered by `imageio-ffmpeg` to ensure zero-configuration MP3 conversion on Windows and cross-platform systems without requiring global PATH edits.
- 🟢 **Spotify Track & Playlist Resolution**: Automatically resolves Spotify metadata (track names, artists, album artwork) via Spotify oEmbed and lightweight scrapers, seamlessly querying `ytsearch` to find and extract the highest-quality audio match.
- 📊 **Real-Time Progress Streaming**: Animated progress bar tracking download percentage, transfer speed (MB/s), and estimated time of arrival (ETA).
- 🎵 **Built-in HTML5 Audio Preview**: Play and scrub through downloaded audio files in the browser before or after saving them to disk.
- 💾 **Safe Named File Downloads**: Dual standard `Content-Disposition` headers guaranteeing proper `Artist - Title.mp3` file naming across all browsers.
- 🕒 **Persistent History**: Stores recent downloads in `localStorage` with single-click re-download and audio playback.
- 🎨 **Modern Cyber-Glassmorphism UI**: Built with responsive layouts, ambient glowing backgrounds, Lucide icons, and interactive micro-animations.

---

## 🏗️ Project Architecture

```
TuneFetch/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── config.py            # Global settings, paths, timeouts, CORS
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic schemas for data validation
│   │   ├── routes/
│   │   │   ├── health.py            # /api/health endpoint
│   │   │   └── media.py             # /api/info, /api/download, /api/file, /api/stream
│   │   ├── services/
│   │   │   ├── downloader.py        # yt-dlp manager with thread pools & progress hooks
│   │   │   └── spotify_resolver.py  # Spotify track & playlist metadata resolver
│   │   ├── utils/
│   │   │   ├── ffmpeg_helper.py     # Embedded/system FFmpeg binary locator
│   │   │   └── sanitizer.py         # Filename sanitization & Content-Disposition builder
│   │   ├── __init__.py
│   │   └── main.py                  # FastAPI application entrypoint
│   ├── downloads/                   # Temporary directory for converted audio files
│   ├── requirements.txt             # Python backend dependencies
│   └── run.py                       # Backend server launcher
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # Top navigation bar & backend health badge
│   │   │   ├── UrlInput.jsx         # Input bar with auto-platform detection & paste
│   │   │   ├── MediaCard.jsx        # Track preview card & bitrate quality selector
│   │   │   ├── PlaylistCard.jsx     # Playlist overview & track-by-track download
│   │   │   ├── ProgressCard.jsx     # Animated progress bar & direct file download
│   │   │   ├── AudioPlayer.jsx      # In-browser audio player with scrub & volume controls
│   │   │   └── HistoryDrawer.jsx    # Download history drawer
│   │   ├── constants/
│   │   │   └── index.js             # Formats, platforms, and storage keys
│   │   ├── hooks/
│   │   │   ├── useLocalStorage.js   # Persistent local storage state hook
│   │   │   └── useDownloadTask.js   # Task polling and lifecycle hook
│   │   ├── services/
│   │   │   └── api.js               # Frontend API client
│   │   ├── utils/
│   │   │   └── formatters.js        # Duration, file size, and timestamp helpers
│   │   ├── App.jsx                  # Main application controller
│   │   ├── index.css                # Dark glassmorphism styling
│   │   └── main.jsx                 # React root mount
│   ├── package.json
│   ├── vite.config.js               # Proxy setup (/api -> backend:8000)
│   └── index.html
│
├── start.bat                        # Windows 1-Click Launcher (CMD)
├── start.ps1                        # PowerShell 1-Click Launcher
├── ARCHITECTURE.md                  # Comprehensive architectural specification
└── README.md                        # Documentation
```

---

## ⚡ Quickstart Guide

### Prerequisites
- **Python**: `3.10` or higher
- **Node.js**: `18.x` or higher

### Option 1: One-Click Launch (Windows)
Double-click **`start.bat`** or execute **`start.ps1`** in PowerShell. This automatically launches both the backend and frontend servers in separate windows.

---

### Option 2: Manual Setup

#### 1. Setup & Launch Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
> The backend server starts at **`http://127.0.0.1:8000`**.  
> Interactive Swagger API documentation is available at **`http://127.0.0.1:8000/docs`**.

#### 2. Setup & Launch Frontend
Open a new terminal window:
```powershell
cd frontend
npm install
npm run dev
```
> The React development server starts at **`http://localhost:5173`**.

---

## 📡 API Reference

### Health Check
```http
GET /api/health
```
**Response (200 OK):**
```json
{
  "status": "healthy",
  "ffmpeg_available": true,
  "ffmpeg_path": "C:\\...\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v7.1.exe",
  "version": "1.0.0"
}
```

---

### Extract Media Metadata
```http
POST /api/info
Content-Type: application/json

{
  "url": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "is_playlist": false,
    "platform": "spotify",
    "title": "Never Gonna Give You Up",
    "artist": "Rick Astley",
    "thumbnail": "https://i.scdn.co/image/...",
    "duration": 213,
    "search_query": "Rick Astley - Never Gonna Give You Up audio",
    "original_url": "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
    "formats": ["mp3-320", "mp3-256", "mp3-128", "best-audio"]
  }
}
```

---

### Initiate Audio Download
```http
POST /api/download
Content-Type: application/json

{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "format": "mp3-320",
  "title": "Never Gonna Give You Up",
  "artist": "Rick Astley"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "task_id": "da34c918-63c4-42df-b986-0c55b0ad1c45"
}
```

---

### Check Download Progress
```http
GET /api/status/{task_id}
```
**Response (200 OK):**
```json
{
  "success": true,
  "task": {
    "id": "da34c918-63c4-42df-b986-0c55b0ad1c45",
    "status": "completed",
    "progress": 100.0,
    "speed": "3.8MB/s",
    "eta": "00:00",
    "file_id": "da34c918-63c4-42df-b986-0c55b0ad1c45",
    "filename": "Rick Astley - Never Gonna Give You Up.mp3",
    "filesize": 8523884
  }
}
```

---

### Download Extracted File
```http
GET /api/file/{task_id}
GET /api/file/{task_id}/{filename}
```
Returns a streaming audio file response with `Content-Disposition: attachment; filename="Rick_Astley_-_Never_Gonna_Give_You_Up.mp3"` and MIME type `audio/mpeg`.

---

### Stream Audio Preview
```http
GET /api/stream/{task_id}
```
Streams audio for in-browser HTML5 `<audio>` player preview.

---

## 🔒 Security & Optimization

- **Filename Sanitization**: Cleans illegal file characters across Windows, Linux, and macOS.
- **Dual-Standard Content-Disposition**: Provides both ASCII fallback and RFC 5987 UTF-8 encoded names.
- **Automated Lifecycle Cleanup**: Background cleanup threads purge temporary audio files older than 1 hour to prevent disk bloat.
- **CORS Configuration**: Restricts and exposes appropriate header specifications for modern browser download integrity.

---

## 📄 License

This project is licensed under the **MIT License**.
