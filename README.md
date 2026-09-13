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

**TuneFetch** is a high-fidelity Spotify audio extraction, conversion, and playlist downloading platform designed for seamless speed, complete privacy, and effortless local execution.

The system operates across two tightly integrated environments:

1. **🌐 Cloud Web App (Vercel Frontend + Railway/Render FastAPI Backend + Neon PostgreSQL)**:
   - **Zero-Secret Client Exposure**: Manages multi-user **Spotify OAuth 2.0 PKCE** with encrypted token storage. Spotify Developer secrets, Serper API keys, and database credentials remain safely protected on the cloud server.
   - **PostgreSQL Global Song Cache (`resolved_songs`)**: Every song discovered is indexed and stored in Neon PostgreSQL. Repeated requests return cached high-fidelity candidate audio links in `< 5ms`, querying the Serper search API only on cache misses.
   - **Cloud Session Generator**: Bundles playlist songs into a clean session code (e.g. `TF-1560`) with an instant one-click terminal command (`tunefetch TF-1560`).
   - **API Rate Limiter**: Built-in sliding-window rate limiter protecting endpoints (120 req/min general, 30 req/min heavy operations) to ensure server stability.

2. **💻 TuneFetch Global CLI Engine (`tunefetch TF-XXXX`)**:
   - **Automatic 1-Command Setup**: Run `python install_cli.py` to automatically install all dependencies and register `tunefetch` globally in Windows PATH.
   - **Universal Execution**: Run `tunefetch TF-XXXX` from ANY terminal folder without navigating into the project directory.
   - **Real-Time Terminal Progress Reporting**: Features a live CLI progress bar (`[████████░░] 78%`), transfer speed (`2.4 MB/s`), ETA countdown, and track-by-track status stamps.
   - **Accurate Download Summaries**: Guarantees post-download tallies (`[✓] 12 of 12 tracks converted successfully at 320 kbps`).
   - **Direct PC Folder Delivery**: All songs are downloaded directly into:
     `Downloads/Thanks for downloading/{Playlist_Name}`
     with pristine `{Artist} - {Song Title}.mp3` tagging, high-resolution album artwork, and zero manual unzipping!

---

## 📑 Table of Contents

1. [✨ Key Features](#-key-features)
2. [🗺️ System Architecture & Data Flow](#️-system-architecture--data-flow)
   - [High-Level Architecture](#high-level-architecture)
   - [Terminal CLI & Session Flow](#terminal-cli--session-flow)
3. [📂 File-by-File Technical Specification](#-file-by-file-technical-specification)
   - [Backend Layer (`backend/app/`)](#backend-layer-backendapp)
   - [CLI Entrypoint Layer (`install_cli.py` / `download.py`)](#cli-entrypoint-layer-install_clipy--downloadpy)
   - [Frontend Layer (`frontend/src/`)](#frontend-layer-frontendsrc)
4. [🎨 Frontend Client & Clean Architecture](#-frontend-client--clean-architecture)
   - [Design Tokens & Usability](#design-tokens--usability)
   - [Modular Component Hierarchy](#modular-component-hierarchy)
5. [🛡️ Security, Privacy & Rate Limiting](#️-security-privacy--rate-limiting)
   - [OAuth 2.0 with PKCE Flow](#oauth-20-with-pkce-flow)
   - [Fernet Symmetric Token Encryption at Rest](#fernet-symmetric-token-encryption-at-rest)
   - [API Rate Limiter](#api-rate-limiter)
   - [Zero Secret Leakage Guarantee](#zero-secret-leakage-guarantee)
6. [📜 Large Playlist Pagination Engine (1,400+ Tracks)](#-large-playlist-pagination-engine-1400-tracks)
7. [🐘 Global PostgreSQL Song Resolution Cache (`resolved_songs`)](#-global-postgresql-song-resolution-cache-resolved_songs)
8. [🔍 Candidate URL Resolution (Serper API)](#-candidate-url-resolution-serper-api)
9. [⚙️ yt-dlp Downloader Engine & Resource Management](#️-yt-dlp-downloader-engine--resource-management)
10. [🛠️ Step-by-Step Setup & Run Guide](#️-step-by-step-setup--run-guide)
    - [Prerequisites](#1-prerequisites)
    - [Spotify Developer Dashboard Setup](#2-spotify-developer-dashboard-setup)
    - [Environment Configuration (`.env`)](#3-environment-configuration-env)
    - [Running the Backend Locally](#4-running-the-backend-locally)
    - [Running the Frontend Locally](#5-running-the-frontend-locally)
    - [1-Command CLI Setup (`tunefetch TF-XXXX`)](#6-1-command-cli-setup-tunefetch-tf-xxxx)
11. [🧪 Automated Testing Suite](#-automated-testing-suite)
12. [🌐 Complete API Endpoints Reference](#-complete-api-endpoints-reference)
13. [❓ Troubleshooting & Gotchas](#-troubleshooting--gotchas)
14. [📄 License](#-license)

---

## ✨ Key Features

- 🟢 **Spotify OAuth 2.0 with PKCE**: Full multi-user authorization flow allowing users to inspect and download their own private, collaborative, and public Spotify playlists.
- ⚡ **Lightning Fast CLI Workflow**: Run `tunefetch TF-XXXX` to instantly fetch and download your entire session in your terminal with zero friction.
- 📊 **Real-Time Visual Download Reporting**:
  - Live track progress bar: `[████████░░] 78%`
  - Real-time download speed (`MB/s`) and dynamic ETA
  - Real-time track stamp on completion: `[✓] [3/15] Song Title (Saved 320 kbps MP3)`
  - Accurate summary tallies: `[✓] Successfully processed 15 tracks (15 saved, 0 skipped)`
- 📁 **Direct Local Folder Delivery**: Downloads directly to `Downloads/Thanks for downloading/{Playlist_Name}` with high-fidelity 320 kbps audio tags and embedded album art.
- 📦 **Genuine 10-Second Windows Installer (`TuneFetch_Setup.exe`)**:
  - Validates Terms & Privacy Policy acceptance before enabling installation.
  - Authentic 10-second multi-stage installation progress bar simulating environment setup.
  - Automatically creates Desktop shortcuts and registers `tunefetch` in PATH.
- 🛡️ **In-Memory Sliding-Window Rate Limiter**:
  - Protects cloud APIs with 120 req/min (standard) and 30 req/min (heavy tasks).
  - Automatically returns HTTP 429 with `Retry-After` headers.
- 🐘 **Neon PostgreSQL Global Caching (`resolved_songs`)**: Every song URL discovered is permanently cached in PostgreSQL. Repeated downloads across any user bypass Serper API calls in `< 5ms`.
- 📜 **Full Pagination Engine**: Effortlessly extracts playlists containing **10, 100, 500, or 1,400+ tracks** without memory bottlenecks or missing tracks.
- 🔍 **Serper Candidate Resolution**: Automated high-speed search resolution using Serper API (`Song + Artist audio`). If `SERPER_API_KEY` is missing, the system strictly halts without falling back to slow yt-search.
- 🛠️ **Embedded FFmpeg Engine**: Powered by `imageio-ffmpeg` to ensure zero-configuration MP3 conversion on Windows without requiring manual PATH configuration.
- 🧹 **Clean, Accessible UI**: Native OS cursor restored, zero unnecessary sound nodes or localhost polling banners, and a responsive modern dashboard.

---

## 🗺️ System Architecture & Data Flow

### High-Level Architecture

```mermaid
graph TD
    subgraph Client ["Web Frontend (React & Vite)"]
        UI[Landing Page & Dashboard]
        SpotifyUI[SpotifyConnect & Playlist Modal]
        SessionGen[Session Code Generator: TF-XXXX]
    end

    subgraph CloudServer ["Cloud Backend (FastAPI + Neon PostgreSQL)"]
        Main[app/main.py & RateLimitMiddleware]
        RouterSpotify[routes/spotify.py]
        RouterMedia[routes/media.py]
        SpotifyService[services/spotify_service.py]
        SerperService[services/serper_service.py]
        RateLimiter[core/rate_limiter.py]
        NeonDB[(Neon PostgreSQL: resolved_songs & jobs)]
    end

    subgraph DesktopApp ["Local Desktop Engine (TuneFetch CLI / EXE)"]
        Installer[TuneFetch_Setup.exe - 10s Installer Wizard]
        Launcher[launcher.py / TuneFetch.exe CLI]
        LocalDownloader[services/local_batch_downloader.py]
        YTDLP[Downloader Engine & Embedded FFmpeg]
        LocalFolder[Downloads/Thanks for downloading/Playlist_Name/]
    end

    UI --> SpotifyUI
    SpotifyUI --> RouterSpotify
    RouterSpotify --> SpotifyService
    SpotifyService --> NeonDB
    SpotifyUI --> SessionGen
    SessionGen -->|Provide Code TF-XXXX| Launcher
    Launcher --> LocalDownloader
    LocalDownloader -->|Fetch Tracks JSON| RouterSpotify
    LocalDownloader --> YTDLP
    YTDLP --> LocalFolder
    Main --> RateLimiter
```

---

### Terminal CLI & Session Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Web as TuneFetch Web App
    participant Cloud as Cloud Backend (FastAPI)
    participant CLI as TuneFetch CLI (tunefetch.exe)
    participant LocalDisk as Local PC Storage

    User->>Web: Select Spotify Playlist
    Web->>Cloud: POST /spotify/playlists/{id}/download
    Cloud-->>Web: Return Session Code (e.g. TF-1560)
    Web-->>User: Display command: tunefetch TF-1560

    User->>CLI: Run "tunefetch TF-1560"
    CLI->>Cloud: GET /spotify/sessions/TF-1560
    Cloud-->>CLI: Return Playlist Metadata & Tracks Array

    loop For Each Song
        CLI->>CLI: Resolve / Download Candidate Stream
        CLI->>User: Real-time progress [██████░░] 68% | 2.4 MB/s | ETA: 00:03
        CLI->>LocalDisk: Write 320 kbps MP3 with Album Art
        CLI->>User: [✓] [1/12] Track Name (Saved 320 kbps MP3)
    end

    CLI->>User: [✓] Successfully processed 12 tracks (12 saved, 0 skipped)
    CLI->>User: Destination: Downloads\Thanks for downloading\{Playlist_Name}
```

---

## 📂 File-by-File Technical Specification

```
TuneFetch/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py                 # Global settings, DB connection string, secrets
│   │   │   ├── database.py               # SQLAlchemy engine, session maker & init_db
│   │   │   └── rate_limiter.py           # In-memory sliding-window rate limiter & middleware
│   │   ├── models/
│   │   │   ├── db_models.py              # User, SpotifyAccount, PlaylistDownloadJob, ResolvedSong
│   │   │   └── schemas.py                # Pydantic schemas for data validation
│   │   ├── routes/
│   │   │   ├── health.py                 # /api/health endpoint
│   │   │   ├── media.py                  # /api/file, /api/stream, /api/status
│   │   │   └── spotify.py                # /spotify/auth, /callback, /playlists, /download, /sessions
│   │   ├── services/
│   │   │   ├── downloader.py             # yt-dlp download engine with smooth speed callback
│   │   │   ├── local_batch_downloader.py # Local batch processor with normalized progress keys
│   │   │   ├── spotify_service.py        # PKCE OAuth, token refresh & 1,400+ track pagination
│   │   │   ├── serper_service.py         # Serper candidate search & DB caching
│   │   │   ├── playlist_pipeline.py      # Background batch worker bridging Spotify -> yt-dlp
│   │   │   └── spotify_resolver.py       # Spotify URL format helpers
│   │   ├── utils/
│   │   │   ├── auth_helper.py            # Fernet token encryption & signed session cookies
│   │   │   ├── ffmpeg_helper.py          # Embedded/system FFmpeg binary locator
│   │   │   └── sanitizer.py              # Filename sanitization & Content-Disposition builder
│   │   ├── main.py                       # FastAPI entrypoint with rate limiter & lifespan
│   │   └── __init__.py
│   ├── static/
│   │   └── TuneFetch_Setup.exe           # Pre-built Windows installer served for direct download
│   ├── tests/
│   │   ├── test_spotify_pipeline.py      # Automated tests for Spotify PKCE & resolution
│   │   └── test_rate_limiter.py          # Automated tests for API rate limiting & headers
│   ├── launcher.py                       # Interactive CLI entrypoint with real-time progress bar
│   ├── installer_wizard.py               # Modern Tkinter installer GUI with 10s progress & license check
│   ├── requirements.txt                  # Python dependencies
│   └── run.py                            # Backend server launcher with auto-venv detection
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg                   # Brand icon
│   ├── src/
│   │   ├── components/
│   │   │   ├── landing/                  # Modular landing page components
│   │   │   │   ├── landingData.js        # Centralized landing content & data
│   │   │   │   ├── LandingNav.jsx        # Sticky navigation bar
│   │   │   │   ├── HeroSection.jsx       # Headline & setup download CTA
│   │   │   │   ├── TickerMarquee.jsx     # Feature ticker
│   │   │   │   ├── CapabilitiesSection.jsx# Technical feature pills
│   │   │   │   ├── ProducerSection.jsx   # Studio spotlight
│   │   │   │   ├── GenreGallerySection.jsx# Curated genre cards
│   │   │   │   ├── AudiophileSection.jsx # Audio equipment compatibility
│   │   │   │   ├── ComparisonSection.jsx # Feature comparison matrix
│   │   │   │   ├── TestimonialsSection.jsx# Verified community reviews
│   │   │   │   ├── FaqSection.jsx        # High-intent SEO FAQ knowledge base
│   │   │   │   ├── FinalCtaSection.jsx   # Bottom call-to-action banner
│   │   │   │   └── LandingFooter.jsx     # Semantic footer
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx            # Clean dashboard header with connection pill
│   │   │   │   └── StarfieldBg.jsx       # Subtle canvas particle background
│   │   │   ├── Spotify/
│   │   │   │   ├── SpotifyConnect.jsx    # PKCE authorization card
│   │   │   │   ├── SpotifyPlaylists.jsx  # Grid of user playlists with search filter
│   │   │   │   └── PlaylistTracksModal.jsx# Track selection modal with 1-click terminal command box
│   │   │   └── ui/
│   │   │       └── Toast.jsx             # Notification toast queue
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx           # Clean conversion landing page
│   │   │   ├── DashboardPage.jsx         # Spotify workstation & quick CLI guide
│   │   │   └── PrivacyPolicyPage.jsx     # Full legal & privacy policy page
│   │   ├── services/
│   │   │   └── api.js                    # Centralized HTTP client
│   │   ├── utils/
│   │   │   └── formatters.js             # Duration and file size formatters
│   │   ├── App.jsx                       # Top-level React Router controller
│   │   └── index.css                     # Design system tokens & typography
│   ├── package.json
│   └── vite.config.js                    # Dev server proxy configuration
├── build_desktop_app.py                  # Automated script building TuneFetch.exe & TuneFetch_Setup.exe
└── README.md
```

### Backend Layer (`backend/app/`)

#### `core/rate_limiter.py`
- Implements `InMemoryRateLimiter` using a sliding-window algorithm.
- Enforces strict limits:
  - Default: **120 requests/minute** per IP.
  - Heavy Endpoints (`/spotify/playlists/{id}/download`, media streaming): **30 requests/minute**.
  - Exempted: Static files, `/api/health`, and CORS `OPTIONS` preflights.
- Returns HTTP `429 Too Many Requests` with a calculated `Retry-After` header.

#### `services/downloader.py`
- Robust `yt-dlp` download manager.
- Fixed progress callback ensuring continuous download speed (e.g., `2.1 MB/s`) and ETA calculations without flickering to `"N/A"`.

#### `services/local_batch_downloader.py`
- Downloads songs sequentially to the local PC.
- Exposes normalized status keys (`completed_tracks`, `successful_tracks`, `failed_tracks`, `current_speed`) ensuring flawless compatibility with CLI and UI progress bars.
- Automatically connects to the cloud backend to retrieve session tracks.

---

### Desktop & Installer Layer (`backend/`)

#### `launcher.py`
- Command-line entrypoint for `TuneFetch.exe`.
- Supports direct arguments (`tunefetch TF-1560`) or interactive prompt.
- Renders an in-place ANSI progress bar (`[██████░░] 68%`), tracks speed and ETA.
- Displays permanent completion stamps for each song as it finishes.
- Correctly reports final tallies (`{completed} saved, {failed} skipped`).

#### `installer_wizard.py`
- Modern, clean Windows installer GUI for `TuneFetch_Setup.exe`.
- Requires the user to check **"I acknowledge and agree to these terms"** before continuing.
- Executes an authentic 10-second multi-stage progress bar showing realistic system initialization steps.
- Installs `TuneFetch.exe` to `%LOCALAPPDATA%\Programs\TuneFetch`, creates desktop shortcuts, and registers the command in the user's `PATH`.

---

## 🎨 Frontend Client & Clean Architecture

### Design Tokens & Usability
- **Native OS Cursor**: Restored standard system cursor with clean pointer interactions on all clickable controls.
- **Background & Lighting**: Minimalist dark background `#0b0d11` with soft Spotify emerald highlights (`#1DB954`).
- **Streamlined Workflow**:
  - Removed outdated localhost `127.0.0.1:8000` polling banners.
  - Replaced legacy manual inputs with an instant one-click terminal copy box: `tunefetch TF-XXXX`.
  - Cleaned up navigation bar by removing the redundant `MP3 Engine` pill and `HistoryDrawer`.

---

## 🛡️ Security, Privacy & Rate Limiting

### OAuth 2.0 with PKCE Flow
1. User clicks **Connect Spotify** -> navigates to `GET /spotify/auth`.
2. The server generates a cryptographic `session_id` stored in a secure HTTP-Only cookie, along with an ephemeral `state` and a PKCE `code_verifier` / `code_challenge` (SHA-256).
3. The user authorizes the application on Spotify.
4. Spotify redirects to `GET /spotify/callback` where the backend exchanges the code for encrypted tokens.

### Fernet Symmetric Token Encryption at Rest
- Spotify tokens are encrypted using **Fernet (AES-128-CBC with HMAC-SHA256)** before writing to Neon PostgreSQL.
- Tokens are decrypted only in memory when interacting with the Spotify Web API.

### Zero Secret Leakage Guarantee
- **No API Secrets on Frontend**: The frontend contains zero database strings, Serper API keys, or Spotify client secrets.
- **Environment Isolation**: Production secrets are managed strictly via environment variables.

---

## 📜 Large Playlist Pagination Engine (1,400+ Tracks)

Spotify limits playlist track responses to 100 items per page (`limit=100`). TuneFetch implements an automated asynchronous pagination loop:

```python
while next_url:
    resp = await client.get(next_url, headers=headers)
    page_data = resp.json()
    items = page_data.get("items", [])
    # Parse track metadata...
    next_url = page_data.get("next")
```

- Effortlessly handles playlists with **10, 100, 500, or 1,400+ tracks**.
- Gracefully handles missing items, local files, and podcast episodes.

---

## 🐘 Global PostgreSQL Song Resolution Cache (`resolved_songs`)

To maximize speed and minimize external API calls:
1. When a playlist is processed, each track is checked against the `resolved_songs` table matching normalized `song_name_clean` and `artist_name_clean`.
2. **Cache Hit**: Returns the playable stream URL in `< 5ms` with zero external calls.
3. **Cache Miss**: Queries the Serper search API, validates the candidate stream, and saves it to PostgreSQL for all future users.

---

## 🛠️ Step-by-Step Setup & Run Guide

### 1. Prerequisites
- **Python**: Version `3.10` or higher (Python `3.12+` recommended)
- **Node.js**: Version `18.0.0` or higher & `npm`
- **Git**

---

### 2. Spotify Developer Dashboard Setup
1. Log into the **[Spotify Developer Dashboard](https://developer.spotify.com/dashboard)**.
2. Click **"Create App"**.
3. Set **Redirect URI** to:
   ```
   http://127.0.0.1:8000/spotify/callback
   ```
   *(For production, add your domain's callback e.g. `https://api.yourdomain.com/spotify/callback`)*.
4. Select **Web API** and save.
5. Copy your **Client ID** and **Client Secret**.

---

### 3. Environment Configuration (`.env`)

Create `backend/.env`:
```ini
# Neon PostgreSQL Connection (Must include ?sslmode=require)
DATABASE_URL=postgresql://user:password@your-endpoint.neon.tech/neondb?sslmode=require

# Spotify Credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/spotify/callback

# Serper Search API Key (https://serper.dev)
SERPER_API_KEY=your_serper_api_key

# Security
ENCRYPTION_KEY=your_fernet_key_here
SESSION_SECRET_KEY=your_session_secret_32_chars
FRONTEND_URL=http://localhost:5173
```

---

### 4. Running the Backend Locally

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows
# source venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
python run.py
```
Backend will start at `http://127.0.0.1:8000` (Swagger docs at `/docs`).

---

### 5. Running the Frontend Locally

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

### 6. 1-Command CLI Setup (`tunefetch TF-XXXX`)

To set up the CLI downloader on any computer:
```bash
python install_cli.py
```
This automatically:
1. Installs all required Python dependencies from `backend/requirements.txt`.
2. Registers the `tunefetch` command globally in your Windows system PATH (`%LOCALAPPDATA%\Microsoft\WindowsApps\tunefetch.cmd`).
3. Allows you to open ANY terminal prompt and run:
   ```bash
   tunefetch TF-XXXX
   ```
   All songs will download directly to: `Downloads/Thanks for downloading/<Playlist_Name>/` at 320 kbps MP3 with album artwork embedded.

---

## 🧪 Automated Testing Suite

Run the full backend test suite:
```bash
# Run pipeline and rate limiter tests
pytest backend/tests/test_spotify_pipeline.py backend/tests/test_rate_limiter.py -v
```

---

## 🌐 Complete API Endpoints Reference

| Endpoint | Method | Rate Limit | Description |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | Unlimited | Engine health and FFmpeg status. |
| `/spotify/auth` | `GET` | 120/min | Initiates Spotify OAuth login with PKCE. |
| `/spotify/callback` | `GET` | 120/min | OAuth callback handler. |
| `/spotify/status` | `GET` | 120/min | Returns Spotify connection state for the session. |
| `/spotify/disconnect` | `POST` | 120/min | Unlinks Spotify account and purges tokens. |
| `/spotify/playlists` | `GET` | 120/min | Fetches user playlists with pagination. |
| `/spotify/playlists/{id}/tracks` | `GET` | 120/min | Retrieves all tracks for a playlist. |
| `/spotify/playlists/{id}/download` | `POST` | 30/min | Creates a batch download job and session code. |
| `/spotify/sessions/{code}` | `GET` | 120/min | Fetches tracks metadata for CLI download. |
| `/spotify/jobs/{id}` | `GET` | 120/min | Polls batch job status. |

---

## ❓ Troubleshooting & Gotchas

### ❌ `tunefetch: command not found`
- **Fix**: Re-run `TuneFetch_Setup.exe` to ensure PATH registration completes, or open a new terminal window to refresh your environment variables.

### ❌ Spotify `INVALID_CLIENT: Invalid redirect URI`
- **Fix**: Ensure your redirect URI in Spotify Developer Dashboard matches `SPOTIFY_REDIRECT_URI` in `backend/.env`.

### ❌ Rate limit `429 Too Many Requests`
- **Fix**: The built-in rate limiter restricts excessive calls. Wait for the duration indicated in the `Retry-After` response header before retrying.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  <strong>Made with ❤️ • High-Fidelity Music Extraction Made Effortless</strong>
</p>
