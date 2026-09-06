# 🏛️ TuneFetch - System Architecture & Technical Specification

This document provides an exhaustive reference of the architecture, file structures, functions, and cross-module interactions powering the **TuneFetch** platform.

---

## 🗺️ High-Level System Architecture

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

## 🔄 Spotify OAuth & Batch Playlist Sequence Diagram

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
    API->>API: Pack all tracks into Thanks_for_downloading folder archive
    API->>NeonDB: Mark Job COMPLETED

    %% 7. Direct Folder Delivery to PC
    User->>Frontend: Click "Save as Folder on PC"
    Frontend->>API: GET /spotify/jobs/{id}/zip
    API-->>Frontend: Stream playlist folder archive
    Frontend->>User: Prompt window.showDirectoryPicker()
    Frontend->>User: Write each MP3 into local folder "Thanks_for_downloading"
```

---

## 📂 File-by-File Technical Specification

### 1. Backend Layer (`backend/app/`)

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
- Function `encrypt_token(raw_token)`: Fernet symmetric encryption.
- Function `decrypt_token(cipher_token)`: Fernet symmetric decryption.
- Function `sign_session_id(user_id)` / `unsign_session_id(cookie)`: ItsDangerous cryptographic signing.
- Function `get_current_user(...)`: Resolves or provisions user from HTTP-Only cookie.

#### `services/spotify_service.py`
- PKCE OAuth URL generator, token exchange, and transparent token refresher.
- Pagination engine extracting full playlists up to 1,400+ tracks.
- Conflict-safe account reconnection handling duplicate Spotify user IDs across sessions.

#### `services/serper_service.py`
- Two-tier candidate resolution:
  1. Checks `resolved_songs` table for exact match on clean `song_name` and `artist_name`.
  2. If missing, queries Serper API (`site:youtube.com/watch "song" "artist"`), then saves to DB.
  3. Seamless `ytsearch1:` fallback if Serper is unconfigured.

#### `services/playlist_pipeline.py`
- Asynchronous batch worker thread sequentially processing tracks:
  - Updates live ETA estimates.
  - Passes candidate URLs into `DownloadManager`.
  - Packages all tracks into folder `Thanks_for_downloading/` within the job archive.

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
  - `GET /spotify/jobs/{id}/zip`: Delivers the packaged folder archive.

#### `run.py`
- Launcher script with **automatic virtual environment detection**: automatically executes with `backend\venv\Scripts\python.exe` if executed from global Python.

---

### 2. Frontend Layer (`frontend/src/`)

#### `App.jsx`
- Clean two-tab controller: **Home** & **Spotify Downloader**.
- Auto-restores completed or in-progress batch download cards via `/spotify/jobs/latest`.
- Handles modal state, single track preview playback, and notification toasts.

#### `components/Spotify/`
- **`SpotifyConnect.jsx`**: Spotify OAuth connection card (hidden automatically once linked).
- **`SpotifyPlaylists.jsx`**: Responsive grid of playlists with real-time search filtering.
- **`PlaylistTracksModal.jsx`**: Full track inspection modal with "Download All as Folder" action.
- **`BatchProgressCard.jsx`**: Real-time batch progress dashboard with live countdown timer and direct **"Save as Folder on PC"** button.

#### `utils/folderSaver.js`
- Implements `saveZipAsFolder()` using **File System Access API (`window.showDirectoryPicker`)** and **JSZip**.
- Extracts MP3 files from the server response and writes them directly into the Windows folder `Thanks_for_downloading` on the user's PC.

---

## 🔒 Security & Multi-User Isolation

1. **Encrypted Tokens at Rest**: All access and refresh tokens are encrypted using **Fernet AES-128-CBC + HMAC-SHA256**.
2. **Server-Side API Keys**: Spotify Client Secret and Serper API key never touch client code.
3. **User Isolation**: Jobs and accounts are strictly partitioned by `user_id`.
4. **Signed HTTP-Only Session Cookies**: Prevents cross-site scripting (XSS) token exfiltration.
