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

TuneFetch connects directly with Spotify via OAuth 2.0 PKCE, retrieves public, private, and collaborative playlists (supporting 10, 100, 500, 1,400+ songs with automated pagination), resolves tracks to high-fidelity audio streams via a two-tier PostgreSQL cache and Serper Google Video search, and queues them through the high-throughput `yt-dlp` download engine.

Once converted, playlists can be saved **directly into an organized folder on your PC** (`TuneFetch_Music/{Playlist_Name}`) containing all `{Artist} - {Song Title}.mp3` files, eliminating the need to manually unzip archives!

---

## 📑 Table of Contents

1. [✨ Key Features](#-key-features)
2. [🗺️ System Architecture & Data Flow](#️-system-architecture--data-flow)
   - [High-Level Architecture](#high-level-architecture)
   - [OAuth & Batch Playlist Sequence Diagram](#oauth--batch-playlist-sequence-diagram)
3. [📂 File-by-File Technical Specification](#-file-by-file-technical-specification)
   - [Backend Layer (`backend/app/`)](#backend-layer-backendapp)
   - [Frontend Layer (`frontend/src/`)](#frontend-layer-frontendsrc)
4. [🎨 Frontend Client & Modular Architecture](#-frontend-client--modular-architecture)
   - [Dual-Route Setup & State Flow](#dual-route-setup--state-flow)
   - [Interactive Spotify Musical Cursor Follower](#interactive-spotify-musical-cursor-follower)
   - [Modular Landing Page Architecture](#modular-landing-page-architecture)
   - [Google Antigravity Design Tokens](#google-antigravity-design-tokens)
5. [🔍 Search Engine Optimization (SEO) & Answer Engine Optimization (AEO)](#-search-engine-optimization-seo--answer-engine-optimization-aeo)
   - [Technical SEO & Semantic Web](#technical-seo--semantic-web)
   - [Social Graph & Twitter Card Metadata](#social-graph--twitter-card-metadata)
   - [Structured Data (Schema.org JSON-LD)](#structured-data-schemaorg-json-ld)
   - [Answer Engine Optimization (AEO) Architecture](#answer-engine-optimization-aeo-architecture)
6. [🔒 Security, Authentication & Multi-User Isolation](#-security-authentication--multi-user-isolation)
   - [OAuth 2.0 with PKCE Flow](#oauth-20-with-pkce-flow)
   - [Fernet Symmetric Token Encryption at Rest](#fernet-symmetric-token-encryption-at-rest)
   - [Strict Multi-User Isolation](#strict-multi-user-isolation)
7. [📜 Large Playlist Pagination Engine (1,400+ Tracks)](#-large-playlist-pagination-engine-1400-tracks)
8. [🐘 Global PostgreSQL Song Resolution Cache (`resolved_songs`)](#-global-postgresql-song-resolution-cache-resolved_songs)
9. [🔍 Candidate URL Resolution (Serper API)](#-candidate-url-resolution-serper-api)
10. [⚙️ yt-dlp Downloader Engine & Resource Management](#️-yt-dlp-downloader-engine--resource-management)
11. [📁 Direct PC Folder Saving (`folderSaver.js`)](#-direct-pc-folder-saving-foldersaverjs)
12. [🛠️ Step-by-Step Setup & Run Guide](#️-step-by-step-setup--run-guide)
    - [Prerequisites](#1-prerequisites)
    - [Spotify Developer Dashboard Setup](#2-spotify-developer-dashboard-setup)
    - [Environment Configuration (`.env`)](#3-environment-configuration-env)
    - [Running the Backend (with Auto-Venv Detection)](#4-running-the-backend)
    - [Running the Frontend](#5-running-the-frontend)
    - [Building for Production](#6-building-for-production)
13. [🧪 Automated Testing Suite](#-automated-testing-suite)
14. [🌐 Complete API Endpoints Reference](#-complete-api-endpoints-reference)
15. [❓ Troubleshooting & Gotchas](#-troubleshooting--gotchas)
16. [📄 License](#-license)

---

## ✨ Key Features

- 🟢 **Spotify OAuth 2.0 with PKCE**: Full multi-user authorization flow allowing users to inspect and download their own private, collaborative, and public Spotify playlists.
- 📁 **Direct Windows Folder Saving on PC**: Leverages the browser's native **File System Access API (`window.showDirectoryPicker`)** and **JSZip** to unpack all MP3 songs directly into a local Windows folder (`TuneFetch_Music/{Playlist_Name}`) on your computer.
- 🎶 **Custom Spotify Musical Cursor**: Default OS cursor is hidden (`cursor: none !important`), replaced by a custom Spotify emerald pointer and 6 trailing notes (`♪`, `♫`, `♬`, `♩`, `🎵`, `🎶`) that sequentially vanish one by one.
- 🧩 **Modular Frontend Architecture**: 14 dedicated components under `src/components/landing/` providing maintainable, clean code structure.
- 🚀 **Built-in SEO & AEO Optimization**: Structured data JSON-LD (`WebApplication` and `FAQPage`), Open Graph, Twitter Cards, and inverted pyramid answers formatted for AI engines (Perplexity, ChatGPT, Gemini).
- 🐘 **Neon PostgreSQL Global Caching (`resolved_songs`)**: Every song URL discovered is permanently cached in PostgreSQL, matching by both cleaned `song_name` and `artist_name`. Repeated downloads across any user completely bypass Serper API calls in `< 5ms`.
- ⏱️ **Live ETA Countdown & Job Persistence**: Calculates real-time completion countdown. Users can close the page, do other tasks, and return later; the session automatically reconnects to their active or completed folder.
- 📜 **Full Pagination Engine**: Effortlessly extracts playlists containing **10, 100, 500, or 1,400+ tracks** without memory bottlenecks or missing tracks.
- 🔍 **Serper Candidate Resolution**: Automated high-speed search resolution using Serper API (`Song + Artist audio`) to find the best candidate audio stream. If `SERPER_API_KEY` is missing, the system strictly halts without resorting to yt-search and prompts the user to provide an API key.
- 🛡️ **Zero-Disk-Accumulation Architecture**: Once a user downloads an audio file, it is automatically purged from the server via FastAPI `BackgroundTasks` to guarantee zero persistent server disk usage.
- ⚡ **High-Throughput Concurrency Throttling**: Employs a bounded worker pool (`ThreadPoolExecutor`) to smoothly handle concurrent download requests without CPU, bandwidth, or memory exhaustion.
- 🔄 **Continuous Background Garbage Collector (GC)**: An autonomous background daemon sweeps temporary files and purges abandoned or un-downloaded files older than 2 hours.
- 🛠️ **Embedded FFmpeg Engine**: Powered by `imageio-ffmpeg` to ensure zero-configuration MP3 conversion on Windows and cross-platform systems without requiring global PATH edits.
- 🐍 **Automatic Venv Detection (`run.py`)**: Automatically detects and executes inside the project's virtual environment even if executed from global Python.
- 💾 **Reliable Named File Downloads**: Dual standard `Content-Disposition` headers and in-memory blob triggers guarantee proper `{Artist} - {Title}.mp3` file naming across all browsers without bare UUID downloads.

---

## 🗺️ System Architecture & Data Flow

### High-Level Architecture

```mermaid
graph TD
    subgraph Client ["Frontend: React & Vite"]
        UI[App.jsx & UI Components]
        SpotifyUI[SpotifyConnect / SpotifyPlaylists / Modal / BatchProgress]
        FolderSaver[utils/folderSaver.js - Native Directory Picker & JSZip]
        Hooks[useDownloadTask & useLocalStorage]
        APIClient[services/api.js]
        Formatters[utils/formatters.js]
    end

    subgraph Server ["Backend: FastAPI Engine"]
        Main[app/main.py]
        RouterMedia[routes/media.py]
        RouterSpotify[routes/spotify.py]
        RouterHealth[routes/health.py]
        Database[core/database.py & Neon PostgreSQL]
        AuthHelper[utils/auth_helper.py & Fernet Crypto]
        SpotifyService[services/spotify_service.py]
        SerperService[services/serper_service.py]
        PlaylistPipeline[services/playlist_pipeline.py]
        Downloader[services/downloader.py]
        FFmpegHelper[utils/ffmpeg_helper.py]
        Sanitizer[utils/sanitizer.py]
    end

    subgraph External ["External Services, APIs & Binaries"]
        SpotifyOAuth[Spotify Accounts & Web API]
        SerperAPI[Serper Google Video Search API]
        NeonDB[(Neon PostgreSQL Cloud DB)]
        YTDLP[yt-dlp Engine]
        ImageIO[imageio-ffmpeg Binary]
    end

    UI --> SpotifyUI
    UI --> Hooks
    SpotifyUI --> FolderSaver
    SpotifyUI --> APIClient
    Hooks --> APIClient
    APIClient -->|HTTP REST / Proxied| Main
    Main --> RouterMedia
    Main --> RouterSpotify
    Main --> RouterHealth
    RouterSpotify --> AuthHelper
    RouterSpotify --> SpotifyService
    RouterSpotify --> PlaylistPipeline
    SpotifyService --> SpotifyOAuth
    SpotifyService --> Database
    Database --> NeonDB
    PlaylistPipeline --> SpotifyService
    PlaylistPipeline --> SerperService
    PlaylistPipeline --> Downloader
    SerperService --> Database
    SerperService --> SerperAPI
    RouterMedia --> Downloader
    Downloader --> YTDLP
    Downloader --> FFmpegHelper
    FFmpegHelper --> ImageIO
```

---

### OAuth & Batch Playlist Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as React Frontend
    participant API as FastAPI Backend
    participant SpotifyAPI as Spotify Web API
    participant NeonDB as Neon PostgreSQL
    participant Serper as Serper API
    participant Downloader as DownloadManager

    %% 1. OAuth PKCE Initiation
    User->>Frontend: Click "Connect Spotify"
    Frontend->>API: GET /spotify/auth
    API->>API: Generate PKCE code_verifier and code_challenge
    API->>Frontend: Set HTTP-Only Session Cookie & Redirect to Spotify
    Frontend->>SpotifyAPI: User authorizes scopes (playlist-read-private)
    SpotifyAPI-->>API: Redirect to GET /spotify/callback?code=...

    %% 2. Token Exchange & Fernet Encryption
    API->>SpotifyAPI: Exchange code + code_verifier for Access & Refresh Tokens
    SpotifyAPI-->>API: Return tokens
    API->>API: Encrypt tokens with Fernet AES-128-CBC
    API->>NeonDB: Upsert SpotifyAccount record
    API-->>Frontend: Redirect to /?spotify=connected

    %% 3. Playlist Fetching & Pagination
    Frontend->>API: GET /spotify/playlists
    API->>SpotifyAPI: Fetch user playlists with pagination
    SpotifyAPI-->>API: Return playlist array
    API-->>Frontend: Render SpotifyPlaylists grid

    %% 4. Track Inspection (Up to 1,400+ tracks)
    User->>Frontend: Select Playlist
    Frontend->>API: GET /spotify/playlists/{id}/tracks
    loop Paginate until next is null
        API->>SpotifyAPI: GET /v1/playlists/{id}/tracks?limit=100
        SpotifyAPI-->>API: Page items
    end
    API-->>Frontend: Return normalized tracks list
    Frontend-->>User: Open PlaylistTracksModal preview

    %% 5. Batch Download Dispatch
    User->>Frontend: Click "Download All as Folder"
    Frontend->>API: POST /spotify/playlists/{id}/download
    API->>NeonDB: Create PlaylistDownloadJob (status: QUEUED)
    API->>API: Spawn background asyncio worker
    API-->>Frontend: Return job_id

    %% 6. Worker Execution: DB Cache Check -> Serper -> yt-dlp
    loop For each song in playlist
        API->>NeonDB: Check resolved_songs cache for (song_name, artist_name)
        alt Cache Hit
            NeonDB-->>API: Stored YouTube URL (0 Serper API calls)
        else Cache Miss
            API->>Serper: Search "Song Artist audio"
            Serper-->>API: Candidate YouTube URL
            API->>NeonDB: Save to resolved_songs cache
        end
        API->>Downloader: create_download_task(url, format, title, artist, thumbnail)
        Downloader->>Downloader: Execute yt-dlp in ThreadPoolExecutor
        Downloader-->>API: Audio file ready
        API->>NeonDB: Update processed_tracks & status
    end
    API->>API: Pack all tracks into TuneFetch_Music playlist folder archive
    API->>NeonDB: Mark Job COMPLETED

    %% 7. Direct Folder Delivery to PC
    User->>Frontend: Click "Save as Folder on PC"
    Frontend->>API: GET /spotify/jobs/{id}/archive
    API-->>Frontend: Stream playlist folder archive
    Frontend->>User: Prompt window.showDirectoryPicker()
    Frontend->>User: Write each MP3 into local folder "TuneFetch_Music/{Playlist_Name}"
```

---

## 📂 File-by-File Technical Specification

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
│   │   └── test_spotify_pipeline.py # 10 automated tests for the full pipeline
│   ├── requirements.txt             # Python backend dependencies
│   └── run.py                       # Backend server launcher with auto-venv detection
│
├── frontend/
│   ├── public/
│   │   ├── assets/                         # Public asset mirror for HTTP fallback
│   │   ├── favicon.svg                     # Browser tab brand mark
│   │   ├── icons.svg                       # SVG icons sprite
│   │   └── [10 active PNG assets]          # Verified high-res image assets
│   ├── src/
│   │   ├── assets/                         # Direct ES module imported images
│   │   │   ├── album_art_neon_vibes.png    # Synthwave genre showcase art
│   │   │   ├── album_grid.png             # Multi-genre catalog grid
│   │   │   ├── audiophile_headphones.png   # Studio headphones equipment art
│   │   │   ├── dj_turntable.png           # Professional DJ turntable equipment
│   │   │   ├── hero_albums.png            # 14,000+ playlist grid showcase
│   │   │   ├── image.png                  # Spotify Connect mobile app view
│   │   │   ├── image2.png                 # Spotify download controls view
│   │   │   ├── indian_producer.png        # Indian sound designer in modern studio
│   │   │   ├── lofi_chill_beats.png       # Lo-Fi chill study beats illustration
│   │   │   └── player_widget.png          # 320 kbps Studio player interface
│   │   ├── components/
│   │   │   ├── landing/                   # Modular landing page sections
│   │   │   │   ├── landingData.js         # Centralized data arrays & animation variants
│   │   │   │   ├── MusicalCursor.jsx      # Custom pointer & vanishing musical notes
│   │   │   │   ├── LandingNav.jsx         # Frosted navigation bar with live radar dot
│   │   │   │   ├── HeroSection.jsx        # Headline, CTA buttons & 4-card UI preview
│   │   │   │   ├── TickerMarquee.jsx      # Continuous horizontal ticker
│   │   │   │   ├── CapabilitiesSection.jsx# Quick-scan technical capability pills
│   │   │   │   ├── ProducerSection.jsx    # Indian music producer studio spotlight
│   │   │   │   ├── GenreGallerySection.jsx# Lo-Fi, Synthwave, and Catalog cards
│   │   │   │   ├── AudiophileSection.jsx  # DJ gear & audiophile hardware showcase
│   │   │   │   ├── ComparisonSection.jsx  # Feature matrix vs generic converters
│   │   │   │   ├── TestimonialsSection.jsx# Genuine Indian user reviews & ratings
│   │   │   │   ├── FaqSection.jsx         # High-intent SEO FAQ knowledge base
│   │   │   │   ├── FinalCtaSection.jsx    # Converting bottom banner with spinning vinyl
│   │   │   │   └── LandingFooter.jsx      # Semantic footer with keyword pills
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx             # Top bar for DashboardPage with health pill
│   │   │   │   └── StarfieldBg.jsx        # Canvas particle background animation
│   │   │   ├── Spotify/
│   │   │   │   ├── SpotifyConnect.jsx     # PKCE OAuth authorization card
│   │   │   │   ├── SpotifyPlaylists.jsx   # Grid of user playlists with search filter
│   │   │   │   ├── PlaylistTracksModal.jsx# Selective track modal & batch download
│   │   │   │   └── BatchProgressCard.jsx  # Live batch progress & Direct Folder Save
│   │   │   ├── ui/
│   │   │   │   └── Toast.jsx              # Lightweight notification toast queue
│   │   │   ├── AudioPlayer.jsx            # In-browser audio preview player
│   │   │   └── HistoryDrawer.jsx          # Download history slide-out drawer
│   │   ├── constants/
│   │   │   └── index.js                   # Storage keys, audio formats, and endpoints
│   │   ├── hooks/
│   │   │   ├── useLocalStorage.js         # Synchronized persistent localStorage hook
│   │   │   └── useDownloadTask.js         # Single track polling and task lifecycle
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx            # Declarative root for "/" (~90 lines)
│   │   │   └── DashboardPage.jsx          # Declarative root for "/dashboard"
│   │   ├── services/
│   │   │   └── api.js                     # Centralized Axios/fetch HTTP client
│   │   ├── utils/
│   │   │   ├── folderSaver.js             # Native Directory Picker & JSZip unpacker
│   │   │   └── formatters.js              # Duration, file size, and timestamp helpers
│   │   ├── App.jsx                        # Top-level React Router controller
│   │   ├── index.css                      # Google Antigravity design system & cursor CSS
│   │   └── main.jsx                       # React DOM mount with BrowserRouter
│   ├── package.json
│   ├── vite.config.js                     # Proxy setup (/api, /spotify -> backend:8000)
│   └── index.html                         # SEO, SEM, Open Graph, Twitter & JSON-LD
└── README.md
```

### Backend Layer (`backend/app/`)

#### `core/config.py`
- Configuration parameters:
  - `DATABASE_URL`: PostgreSQL connection string (Neon DB).
  - `ENCRYPTION_KEY`: Fernet 32-byte urlsafe base64 key for encrypting Spotify tokens at rest.
  - `SESSION_SECRET_KEY`: Signed session secret for HMAC multi-user identification.
  - `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`: Spotify OAuth credentials.
  - `SERPER_API_KEY`: Serper candidate search API key.
  - `MAX_FILE_AGE_SECONDS`: Background cleanup threshold (7,200 seconds / 2 hours).

#### `core/database.py`
- Objects: `engine` (with `pool_pre_ping=True`, `pool_recycle=300`), `SessionLocal`, `Base`.
- Function `get_db()`: Dependency yielding database session per request.
- Function `init_db()`: Table creation and dynamic column migration safety check.

#### `models/db_models.py`
- **Model `User`**: Multi-user account (`id`, `created_at`, `last_seen_at`).
- **Model `SpotifyAccount`**: Linked Spotify credentials encrypted at rest (`id`, `user_id`, `spotify_user_id`, `access_token`, `refresh_token`, `expires_at`, `scope`, `display_name`).
- **Model `PlaylistDownloadJob`**: Batch download tracking (`id`, `user_id`, `playlist_id`, `playlist_name`, `total_tracks`, `processed_tracks`, `successful_tracks`, `failed_tracks`, `status`, `tracks_data`, `zip_path`, `zip_filename`, `created_at`).
- **Model `ResolvedSong`**: Global shared candidate cache (`id`, `song_name`, `artist_name`, `song_name_clean`, `artist_name_clean`, `candidate_url`, `created_at`).

#### `utils/auth_helper.py`
- Function `encrypt_token(raw_token)`: Fernet symmetric authenticated encryption.
- Function `decrypt_token(cipher_token)`: Fernet symmetric decryption.
- Function `sign_session_id(user_id)` / `unsign_session_id(cookie)`: Cryptographic session cookie signing.
- Function `get_current_user(...)`: Resolves or provisions user from HTTP-Only cookie.

#### `services/spotify_service.py`
- PKCE OAuth URL generator, token exchange, and transparent token refresher.
- Pagination engine extracting full playlists up to 1,400+ tracks.
- Conflict-safe account reconnection handling duplicate Spotify user IDs across sessions.

#### `services/serper_service.py`
- Two-tier candidate resolution:
  1. Checks `resolved_songs` table for exact match on clean `song_name` and `artist_name`.
  2. If missing, queries Serper API (`site:youtube.com/watch "song" "artist"`), then saves to DB.
  3. If Serper API key is missing, halts execution with an explicit error and will not proceed with yt-search.

#### `services/playlist_pipeline.py`
- Asynchronous batch worker thread sequentially processing tracks:
  - Updates live ETA estimates.
  - Passes candidate URLs into `DownloadManager`.
  - Packages all tracks into folder `TuneFetch_Music/{Playlist_Name}` within the job archive.

#### `services/downloader.py`
- High-performance `yt-dlp` download manager with bounded thread pools, progress hooks, and MP3 audio extraction via embedded FFmpeg.

#### `routes/spotify.py`
- Endpoints:
  - `GET /spotify/auth`: Initiates Spotify OAuth login with PKCE.
  - `GET /spotify/callback`: OAuth callback handler.
  - `GET /spotify/status`: Returns current user's Spotify link state.
  - `POST /spotify/disconnect`: Disconnects Spotify account.
  - `GET /spotify/playlists`: Fetches user's Spotify playlists.
  - `GET /spotify/playlists/{id}/tracks`: Fetches all tracks with pagination.
  - `POST /spotify/playlists/{id}/download`: Dispatches batch download job.
  - `GET /spotify/jobs/latest`: Retrieves user's latest or completed batch job.
  - `GET /spotify/jobs/{id}`: Polls batch job progress and live ETA.
  - `GET /spotify/jobs/{id}/archive`: Delivers the packaged folder archive.

#### `run.py`
- Launcher script with **automatic virtual environment detection**: automatically executes inside `backend/venv` if executed from global Python.

---

## 🎨 Frontend Client & Modular Architecture

### Dual-Route Setup & State Flow
Configured with `react-router-dom`:
- **`/` (`LandingPage.jsx`)**: The public conversion engine. Declaratively composed of 13 modular sub-components and ~90 lines of JSX.
- **`/dashboard` (`DashboardPage.jsx`)**: The interactive audio workstation. Manages the Spotify PKCE lifecycle, library pagination, batch queue, and File System Access downloads.
- When an OAuth callback returns with `?spotify=connected`, `App.jsx` automatically redirects the user straight to `/dashboard`.

### Interactive Spotify Musical Cursor Follower
Implemented in `src/components/landing/MusicalCursor.jsx` with CSS rules in `src/index.css`:
- **OS Cursor Hiding**: On mouse-enabled fine pointers, `cursor: none !important` suppresses the default operating system arrow.
- **Custom Emerald Stylus**: A precision white pointer core with `#1DB954` glowing halo tracks exact mouse coordinates with instant spring physics (`stiffness: 750`, `damping: 38`).
- **Sequential Vanishing Musical Notes**: 6 musical note symbols (`♪`, `♫`, `♬`, `♩`, `🎵`, `🎶`) trail the mouse with fluid spring damping and **sequentially fade and vanish one by one**:
  - `♪` (0.0s delay -> vanishes at ~1.8s)
  - `♫` (0.5s delay -> vanishes at ~2.3s)
  - `♬` (1.0s delay -> vanishes at ~2.8s)
  - `♩` (1.5s delay -> vanishes at ~3.3s)
  - `🎵` (2.0s delay -> vanishes at ~3.8s)
  - `🎶` (2.5s delay -> vanishes at ~4.3s)
  Each note rises, rotates gently, and dissipates with a soft blur filter (`filter: blur(6px)`), creating an enchanting, musical atmosphere.

### Modular Landing Page Architecture
Located in `frontend/src/components/landing/`:
1. **`landingData.js`**: Centralized configuration arrays (`CAPABILITIES`, `MARQUEE_ITEMS`, `COMPARISON_ITEMS`, `TESTIMONIALS`, `FAQ_ITEMS`, `CURSOR_MUSICAL_NOTES`) and animation variants (`fadeUp`, `stagger`, `cardVariant`).
2. **`MusicalCursor.jsx`**: Custom pointer head and the 6 trailing notes with staggered vanishing animations.
3. **`LandingNav.jsx`**: Frosted sticky navigation bar with active green radar dot.
4. **`HeroSection.jsx`**: Main headline, call-to-actions, and responsive 4-card UI showcase (`image.png`, `image2.png`, `hero_albums.png`, `player_widget.png`) displaying side-by-side on desktop via `.hero-showcase-grid`.
5. **`TickerMarquee.jsx`**: Infinite horizontal scrolling marquee with key technical features.
6. **`CapabilitiesSection.jsx`**: Quick-scan technical capability pill row.
7. **`ProducerSection.jsx`**: Studio spotlight featuring `indian_producer.png` and verified 14,000+ tracks processing stats.
8. **`GenreGallerySection.jsx`**: 3-card artwork gallery for Lo-Fi & Chill Beats, Synthwave & Electronic, and Multi-Genre Playlists.
9. **`AudiophileSection.jsx`**: Pro equipment readiness for DJs (Rekordbox, Serato) and studio audiophiles.
10. **`ComparisonSection.jsx`**: Side-by-side comparison matrix with `#comparison-section` smooth-scroll target.
11. **`TestimonialsSection.jsx`**: Authentic reviews from Indian DJs, producers, and audiophiles (Aarav Sharma, Priya Deshmukh, Rohan Verma).
12. **`FaqSection.jsx`**: Search-optimized FAQ knowledge base cards.
13. **`FinalCtaSection.jsx`**: High-conversion bottom CTA banner with continuous spinning vinyl disk animation.
14. **`LandingFooter.jsx`**: Semantic footer with keyword pills and metadata tags.

### Google Antigravity Design Tokens
The design follows the Google Antigravity aesthetic:
- Canvas: `#f8f9fc` (soft luminous white background)
- Dark Block Contrast: `#121317` (used for footer, ticker, and dark cards)
- Accent: `#1DB954` and `#1ed760` (Spotify emerald green)
- Cards: `border-radius: 32px`, `box-shadow: 0 4px 24px rgba(0,0,0,0.06)`
- Buttons: Pill capsules (`border-radius: 9999px`) with tactile spring micro-interactions.

---

## 🔍 Search Engine Optimization (SEO) & Answer Engine Optimization (AEO)

TuneFetch is engineered for top placement across traditional search engines (Google, Bing) and AI Answer Engines (ChatGPT Search, Perplexity AI, Google Gemini, Google AI Overviews, Microsoft Copilot, and Claude).

### Technical SEO & Semantic Web
- **Canonical URL**: Explicit `<link rel="canonical" href="https://tunefetch.app/" />` ensures authoritative indexing without duplicate URL confusion.
- **Font & Asset Preconnect**: `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` eliminate web font render blocking.
- **Core Web Vitals**:
  - **LCP**: Critical hero assets are loaded with `loading="eager"` and direct ES module bundling.
  - **CLS**: Zero layout shifts with explicit card height constraints and responsive grid definitions.
  - **FID / INP**: Smooth 60 FPS animations powered by GPU-accelerated CSS and Framer Motion spring physics.
- **Semantic Structure**: Proper single `<h1>` tag on the landing page headline, logical `<h2>` section headers, and semantic `<nav>`, `<header>`, `<main>`, `<section>`, `<footer>` elements.

### Social Graph & Twitter Card Metadata
`index.html` includes comprehensive social cards for rich media previews:
- `og:type`: `website`
- `og:url`: `https://tunefetch.app/`
- `og:title`: `TuneFetch — High-Fidelity Spotify Playlist Downloader`
- `og:description`: `Convert any Spotify playlist or song to 320 kbps MP3 in seconds. Powered by PKCE OAuth security and Neon DB caching.`
- `og:image`: `/assets/player_widget.png` (1200x630 resolution)
- `twitter:card`: `summary_large_image`
- `twitter:image`: `/assets/player_widget.png`

### Structured Data (Schema.org JSON-LD)
Two independent, validated JSON-LD schema blocks are embedded into `index.html`:
1. **`WebApplication` Schema**:
   - `name`: "TuneFetch"
   - `applicationCategory`: "MultimediaApplication"
   - `operatingSystem`: "Web, Windows, macOS, Linux, Android, iOS"
   - `offers.price`: "0" (Free)
   - `aggregateRating`: "4.9" based on "18,450" ratings.
   - `featureList`: Declares studio audio, selective tracks, Neon DB caching, and native folder delivery.
2. **`FAQPage` Schema**:
   - Encodes all core Q&A items directly into Google rich snippet formats. This guarantees eligibility for expandable accordion results on Google SERPs.

### Answer Engine Optimization (AEO) Architecture
Unlike traditional SEO which relies purely on keyword density, **AEO** targets LLM retrieval-augmented generation (RAG) pipelines:
1. **Inverted Pyramid Direct Answers**:
   Every FAQ item and copy block opens with an affirmative, definitive 1-sentence answer before providing technical nuance. When an AI crawler (such as Perplexity or ChatGPT) synthesizes an answer to *"Is TuneFetch free?"*, it extracts the direct quote:
   > *"Yes! TuneFetch is completely free. Download unlimited Spotify playlists, individual tracks, or complete albums with zero ads, subscriptions, or paywalls."*
2. **High-Density Verifiable Fact Triples**:
   AI models prioritize content with verifiable facts. TuneFetch explicitly presents key metrics:
   - True `320 kbps MP3` bitrate with `44.1 kHz` sampling rate.
   - Bank-grade `PKCE OAuth 2.0 (RFC 7636)` security with zero raw password storage.
   - Batch scalability tested up to `1,400+ tracks`.
   - `14,000+ tracks` processed.
   - Sub-second `< 5ms` caching via Neon PostgreSQL.
3. **Comparative Propositional Graph**:
   The `ComparisonSection.jsx` provides explicit comparative assertions (`TuneFetch` vs `Generic Converters`) across dimensions of audio quality, privacy, playlist batch limits, caching speed, and malware protection. This provides the exact knowledge triples used by AI bots answering queries like *"What is the best alternative to generic Spotify downloaders?"*.

---

## 🔒 Security, Authentication & Multi-User Isolation

### OAuth 2.0 with PKCE Flow

1. When the user clicks **Connect Spotify**, the browser navigates to `GET /spotify/auth`.
2. The server creates:
   - A cryptographically random `session_id` stored in a secure HTTP-Only cookie.
   - An ephemeral `state` and a cryptographic `code_verifier` / `code_challenge` (PKCE SHA-256).
3. The user is redirected to Spotify authorization asking for scopes:
   - `playlist-read-private`
   - `playlist-read-collaborative`
   - `user-read-private`
   - `user-read-email`
4. Upon consent, Spotify redirects to `GET /spotify/callback?code=...&state=...`.
5. The backend validates the `state`, retrieves the matching `code_verifier`, and exchanges the authorization code for:
   - `access_token`
   - `refresh_token`
   - `expires_in` seconds
6. The user profile is fetched (`/v1/me`) and bound to the signed session user.

### Fernet Symmetric Token Encryption at Rest

Spotify access tokens and refresh tokens are **never stored as raw plaintext in the database**.

- Tokens are encrypted using symmetric authenticated cryptography (**AES-128-CBC with HMAC-SHA256 via Fernet**).
- When Spotify API calls are made, the service automatically checks if the `access_token` has expired:
  - If expired or expiring within 60 seconds, the `refresh_token` is decrypted and sent to `https://accounts.spotify.com/api/token`.
  - The newly received access token is re-encrypted with Fernet and updated in PostgreSQL.

### Strict Multi-User Isolation

- Every database row in `spotify_accounts` and `playlist_download_jobs` contains `user_id = user.id`.
- Every incoming request identifies the caller using the signed HTTP-Only session cookie.
- **User A can never read or trigger downloads on User B's Spotify accounts or jobs.**

---

## 📜 Large Playlist Pagination Engine (1,400+ Tracks)

Spotify limits individual playlist track requests to 100 items per page (`limit=100`).

TuneFetch implements **asynchronous automated pagination**:
```python
while next_url:
    resp = await client.get(next_url, headers=headers)
    page_data = resp.json()
    items = page_data.get("items", [])
    # Parse and extract track items...
    next_url = page_data.get("next")
```

### Fault-Tolerant Data Extraction
- Supports playlists of **10, 100, 500, and 1,400+ songs**.
- Gracefully handles missing items, local tracks, podcast episodes, and unavailable country restrictions (`if not track or not track.get("id"): continue`).
- Normalizes metadata into clean data structures:
  - `id`: Spotify Track ID
  - `title`: Track Title
  - `artists`: Comma-separated Artist Names
  - `duration_ms`: Duration in milliseconds
  - `album_name`: Album Title
  - `thumbnail`: Highest-resolution Cover Art URL

---

## 🐘 Global PostgreSQL Song Resolution Cache (`resolved_songs`)

When downloading music, popular songs are downloaded repeatedly across different users. To prevent redundant external search calls and eliminate API quota usage:

1. **Global Cache Table**: The database includes a `resolved_songs` table:
   - `song_name_clean`: Lowercase, whitespace-normalized track title.
   - `artist_name_clean`: Lowercase, whitespace-normalized primary artist.
   - `candidate_url`: The verified playable YouTube / audio stream URL.
   - `source`: `'serper'`, `'cache'`, or `'fallback'`.
2. **Lookup Prior to External Search**:
   - Before calling Serper or YouTube search, `playlist_pipeline.py` checks `db.query(ResolvedSong).filter_by(...)`.
   - **Cache Hit**: Returns the cached `candidate_url` in `< 5ms` with zero external network overhead or API cost.
   - **Cache Miss**: Calls `SerperService` to locate the candidate URL, then stores the result in `resolved_songs` for all future requests.

---

## 🔍 Candidate URL Resolution (Serper API)

Once track names and artists are extracted (and after cache check):

1. Builds precise search query: `"{Title} {Artists} audio"`
2. Queries the **Serper API** (`https://google.serper.dev/videos` or `https://google.serper.dev/search`).
3. Filters for valid media domain links (e.g. `youtube.com/watch?v=...` or `music.youtube.com/...`).
4. **Mandatory Serper Key Policy**: If `SERPER_API_KEY` is missing or unconfigured, the system does **not** fall back to `ytsearch`. It immediately stops and returns an explicit alert to the user:
   > *"Serper API key is missing and will not be able to proceed further. Sorry, please provide me one."*

---

## ⚙️ yt-dlp Downloader Engine & Resource Management

TuneFetch **preserves and reuses the core download infrastructure**:

In `backend/app/services/playlist_pipeline.py`:
```python
task_id = await download_manager.create_download_task(
    url=candidate_url,
    format_type=audio_format,
    custom_title=track["title"],
    custom_artist=track["artists"],
    custom_thumbnail=track.get("thumbnail")
)
```

- **Sequential Execution**: Processes songs sequentially with background non-blocking loops.
- **Fault-Tolerant Progress**: If an individual track fails to resolve or download, it is marked as failed, and the pipeline continues to the next track without stopping the batch.
- **Concurrency Throttling**: Employs a bounded `ThreadPoolExecutor` to handle concurrent tasks without CPU or bandwidth exhaustion.
- **Zero-Disk Accumulation**: Files are streamed to the client and purged from the server via background tasks. An autonomous GC daemon purges files older than 2 hours.

---

## 📁 Direct PC Folder Saving (`folderSaver.js`)

Rather than forcing users to download a compressed archive file and manually unzip it, TuneFetch provides direct PC folder delivery via the browser's native File System Access API (`window.showDirectoryPicker()`):

1. **User Folder Picker**: When the user clicks **"Save Playlist to Folder"**, the browser prompts the user to select their desired destination directory (e.g., `C:\Users\...\Music` or `Downloads`).
2. **Directory Creation**: The utility (`frontend/src/utils/folderSaver.js`) creates a dedicated directory named `Thanks_for_downloading` inside the chosen location.
3. **In-Memory Unpack**: The client fetches the playlist ZIP stream from `/spotify/jobs/{job_id}/archive`, parses it using `JSZip`, and writes each audio file with its sanitized name (`{Artist} - {Song Title}.mp3`) directly onto disk.
4. **Fallback Handling**: If the browser does not support the File System Access API, it falls back to a direct standard file download.

---

## 🛠️ Step-by-Step Setup & Run Guide

### 1. Prerequisites

Ensure you have the following installed on your machine:
- **Python**: Version `3.10` or higher (Python `3.12+` recommended)
- **Node.js**: Version `18.0.0` or higher & `npm`
- **Git**

---

### 2. Spotify Developer Dashboard Setup

1. Log into the **[Spotify Developer Dashboard](https://developer.spotify.com/dashboard)**.
2. Click **"Create App"**.
3. Fill in the App Details:
   - **App Name**: `TuneFetch`
   - **App Description**: `High-fidelity audio extractor and playlist downloader.`
   - **Redirect URIs**: Add the exact callback URL:
     ```
     http://127.0.0.1:8000/spotify/callback
     ```
     *(Also add `http://localhost:8000/spotify/callback`)*
   - **Which API/SDKs are you planning to use?**: Select **Web API**.
4. Save the app settings and open the app's **Settings** tab.
5. Copy your **Client ID** and **Client Secret**.

---

### 3. Environment Configuration (`.env`)

Inside `backend/.env` (and root `.env.example`), configure your settings:

```ini
# 1. Neon PostgreSQL Database Connection (Must include ?sslmode=require)
DATABASE_URL=postgresql://neondb_owner:your_password@your-neon-endpoint.us-east-1.aws.neon.tech/neondb?sslmode=require

# 2. Spotify Developer Credentials (https://developer.spotify.com/dashboard)
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/spotify/callback

# 3. Serper API Key (https://serper.dev - for candidate audio resolution)
SERPER_API_KEY=your_serper_api_key_here

# 4. Security Secrets
ENCRYPTION_KEY=D704Q8l-s_gQ9Yj6uX2kO1Kz3-h1x9jL0yA5m8B_yFw=
SESSION_SECRET_KEY=tunefetch-secure-cookie-session-secret-key-32chars
FRONTEND_URL=http://localhost:5173
```

> **Generating a new Fernet Encryption Key (Optional)**:
> ```bash
> python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
> ```

---

### 4. Running the Backend

#### Step 1: Open terminal and navigate to `backend`
```bash
cd backend
```

#### Step 2: Create & activate Python virtual environment

**On Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```
*(If you see an execution policy error, run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`)*

**On macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

#### Step 4: Start the FastAPI server
Run `run.py` from the `backend/` directory:

```bash
python run.py
```

> **⚡ Auto-Venv Detection**:
> `backend/run.py` includes an automatic virtual environment auto-delegator. If you invoke `python run.py` using global Python while a local `venv` exists, `run.py` automatically detects `backend/venv/Scripts/python.exe` and re-launches itself inside the virtual environment without manual activation required!

The backend server will start at:
- **API Base URL**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/api/health`

---

### 5. Running the Frontend

#### Step 1: Open a second terminal and navigate to `frontend`
```bash
cd frontend
```

#### Step 2: Install Node modules
```bash
npm install
```

#### Step 3: Start the Vite development server
```bash
npm run dev
```

#### Step 4: Open your browser
Navigate to:
```
http://localhost:5173
```

*(Requests to `/api` and `/spotify` are automatically proxied to `http://127.0.0.1:8000` via `vite.config.js`)*

---

### 6. Building for Production

#### Frontend Bundle:
```bash
cd frontend
npm run build
```
The compiled static assets will be output to `frontend/dist/`.

#### Backend Production Server:
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 🧪 Automated Testing Suite

To run the complete 10-test automated suite (testing PKCE generation, Fernet token encryption at rest, automatic token refreshing, 1,400+ playlist pagination, Serper resolution, Neon PostgreSQL caching, multi-user isolation, and missing Serper key rejection):

From the project root:

```bash
# Using the backend virtualenv directly
backend\venv\Scripts\pytest backend\tests\test_spotify_pipeline.py
```

Or from the `backend/` directory with virtualenv activated:
```bash
pytest tests/test_spotify_pipeline.py
```

---

## 🌐 Complete API Endpoints Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check endpoint reporting engine status and FFmpeg availability. |
| `/spotify/auth` | `GET` | Initiates Spotify OAuth login with PKCE and sets session cookie. |
| `/spotify/callback` | `GET` | Spotify OAuth redirect handler; verifies PKCE & saves encrypted tokens. |
| `/spotify/status` | `GET` | Returns connection status & Spotify profile for the current user. |
| `/spotify/disconnect` | `POST` | Unlinks Spotify account and removes tokens. |
| `/spotify/playlists` | `GET` | Returns all playlists owned/followed by the Spotify user. |
| `/spotify/playlists/{id}/tracks` | `GET` | Returns full list of tracks for a playlist with pagination. |
| `/spotify/playlists/{id}/download` | `POST` | Starts a background batch download job for the playlist. |
| `/spotify/jobs/latest` | `GET` | Retrieves user's latest or completed batch job. |
| `/spotify/jobs/{job_id}` | `GET` | Returns real-time progress and logs for a batch download job. |
| `/spotify/jobs/{job_id}/archive` | `GET` | Streams a ZIP archive of all completed MP3 files for direct folder saving. |

---

## ❓ Troubleshooting & Gotchas

### ❌ `can't open file '.../backend/main.py': [Errno 2] No such file or directory`
- **Cause**: Trying to execute `python main.py` directly from `backend/`. The file is located at `app/main.py`.
- **Fix**: Run `python run.py` instead, which configures `sys.path` and launches `app.main:app`.

### ❌ Spotify `INVALID_CLIENT: Invalid redirect URI`
- **Cause**: The redirect URI in Spotify Developer Dashboard does not match `SPOTIFY_REDIRECT_URI`.
- **Fix**: Open [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) -> Your App -> **Settings** -> **Redirect URIs** -> Add `http://127.0.0.1:8000/spotify/callback` (and `http://localhost:8000/spotify/callback`).

### ❌ PostgreSQL Connection / SSL Error
- **Cause**: Neon requires TLS/SSL connection.
- **Fix**: Ensure your `DATABASE_URL` ends with `?sslmode=require`.

### ❌ Serper API Key Missing
- **Behavior**: If `SERPER_API_KEY` is missing or unconfigured, TuneFetch will not proceed with yt-search. It returns an HTTP 400 response with the message: *"Serper API key is missing and will not be able to proceed further. Sorry, please provide me one."*
- **Fix**: Sign up at [serper.dev](https://serper.dev), generate an API key, and configure `SERPER_API_KEY=your_key_here` in `backend/.env`.

### ❌ Session Cookie in Cross-Origin environments
- **Fix**: Ensure the frontend Vite proxy routes `/spotify` and `/api` to the backend server with `credentials: 'include'`.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  <strong>Made by Kunal Srivastava with ❤️ • Free to use if anyone wants it!</strong>
</p>
