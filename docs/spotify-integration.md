# 🎵 Spotify OAuth & Playlist Integration Guide

This guide explains the architecture, security model, environment configuration, database caching, and end-to-end operational pipeline of the Spotify OAuth integration in **TuneFetch**.

---

## 📑 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Spotify Developer Dashboard Setup](#spotify-developer-dashboard-setup)
3. [Environment Configuration](#environment-configuration)
4. [Authentication & Multi-User Isolation (PKCE)](#authentication--multi-user-isolation-pkce)
5. [Token Encryption at Rest (PostgreSQL & Fernet)](#token-encryption-at-rest-postgresql--fernet)
6. [Playlist Extraction & Large Playlist Pagination (1,400+ Tracks)](#playlist-extraction--large-playlist-pagination-1400-tracks)
7. [Global PostgreSQL Song Resolution Cache (`ResolvedSong`)](#global-postgresql-song-resolution-cache-resolvedsong)
8. [Serper Candidate URL Resolution & Fallback](#serper-candidate-url-resolution--fallback)
9. [Handoff to Existing yt-dlp Downloader Pipeline](#handoff-to-existing-yt-dlp-downloader-pipeline)
10. [Direct PC Folder Saving (File System Access API)](#direct-pc-folder-saving-file-system-access-api)
11. [API Endpoints Reference](#api-endpoints-reference)
12. [Troubleshooting & Gotchas](#troubleshooting--gotchas)

---

## 1. Architecture Overview

TuneFetch places the Spotify Web API, multi-user isolation, database resolution cache, and candidate search resolution **upstream** of the existing, unmodified `yt-dlp` download engine:

```
+-----------------------------------------------------------------------------------+
|                                  USER / BROWSER                                    |
+-----------------------------------------------------------------------------------+
       |                                      ^                          |
       | 1. GET /spotify/auth                 | 3. Redirect /?spotify=connected
       v                                      |                          v
+------------------+                 +------------------+       +-------------------+
|  Spotify OAuth   | --> 2. User --> |  TuneFetch API   |       | Select Playlist & |
|  Authorize Page  |    Consents     | /spotify/callback|       | Inspect Songs     |
+------------------+                 +------------------+       +-------------------+
                                              |                           |
                                              | Encrypt & Save            | 4. POST /download
                                              v                           v
                                     +------------------+       +-------------------+
                                     |  Neon PostgreSQL |       | Playlist Pipeline |
                                     |  Encrypted Tokens|       | (Background Task) |
                                     +------------------+       +-------------------+
                                                                          |
                                                                          | 5. Check cache first
                                                                          v
                                                                +-------------------+
                                                                |   ResolvedSong    |  Cache Hit (<5ms)
                                                                |   (Neon DB Table) | ==================> [ Candidate URL ]
                                                                +-------------------+                          |
                                                                          | Cache Miss                         |
                                                                          v                                    |
                                                                +-------------------+                          |
                                                                |   Serper API      |                          |
                                                                | (Candidate Search)| -------------------------+
                                                                +-------------------+                          |
                                                                          |                                    |
                                                                          | 6. Resolved candidate URL         |
                                                                          v                                    v
                                                                +--------------------------------------------------+
                                                                |            UNMODIFIED yt-dlp Engine              |
                                                                |                 DownloadManager                  |
                                                                +--------------------------------------------------+
                                                                          |
                                                                          | 7. Archive & Direct Folder Save
                                                                          v
                                                                +--------------------------------------------------+
                                                                |    Direct PC Folder Delivery (folderSaver.js)    |
                                                                |   window.showDirectoryPicker() -> /Thanks_...    |
                                                                +--------------------------------------------------+
```

---

## 2. Spotify Developer Dashboard Setup

To allow TuneFetch to interact with Spotify:

1. Log into the **[Spotify Developer Dashboard](https://developer.spotify.com/dashboard)**.
2. Click **"Create App"**.
3. Fill in the App Details:
   - **App Name**: `TuneFetch`
   - **App Description**: `High-fidelity audio extractor and playlist downloader.`
   - **Redirect URIs**: Add the exact callback URL:
     ```
     http://localhost:8000/spotify/callback
     ```
     *(Also add your production domain if deploying, e.g., `https://your-domain.com/spotify/callback`)*
   - **Which API/SDKs are you planning to use?**: Select **Web API**.
4. Save the app settings and open the app's **Settings** tab.
5. Copy your **Client ID** and **Client Secret**.

---

## 3. Environment Configuration

In `backend/.env` (and root `.env.example`), configure the following variables:

```ini
# PostgreSQL (Neon Database URL)
DATABASE_URL=postgresql://neondb_owner:your_password@your-neon-endpoint.us-east-1.aws.neon.tech/neondb?sslmode=require

# Encryption Key for Spotify Tokens (Fernet 32-byte urlsafe base64)
# Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
ENCRYPTION_KEY=D704Q8l-s_gQ9Yj6uX2kO1Kz3-h1x9jL0yA5m8B_yFw=

# Signed Session Cookie Secret
SESSION_SECRET_KEY=tunefetch-secure-cookie-session-secret-key-32chars

# Spotify Developer API Credentials
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://localhost:8000/spotify/callback

# Serper API Key (for high-speed Google/YouTube search candidate resolution)
SERPER_API_KEY=your_serper_api_key_here

# Application Base URL
FRONTEND_URL=http://localhost:5173
```

---

## 4. Authentication & Multi-User Isolation (PKCE)

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

### Strict Multi-User Isolation
- Every database row in `spotify_accounts` and `playlist_download_jobs` contains `user_id = user.id`.
- Every incoming request identifies the caller using the signed HTTP-Only session cookie.
- **User A can never read or trigger downloads on User B's Spotify accounts or jobs.**

---

## 5. Token Encryption at Rest (PostgreSQL & Fernet)

Spotify access tokens and refresh tokens are **never stored as raw plaintext in the database**.

- Tokens are encrypted using symmetric authenticated cryptography (**AES-128-CBC with HMAC-SHA256 via Fernet**).
- When Spotify API calls are made, the service automatically checks if the `access_token` has expired:
   - If expired or expiring within 60 seconds, the `refresh_token` is decrypted and sent to `https://accounts.spotify.com/api/token`.
   - The newly received access token is re-encrypted with Fernet and updated in PostgreSQL.

---

## 6. Playlist Extraction & Large Playlist Pagination (1,400+ Tracks)

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

## 7. Global PostgreSQL Song Resolution Cache (`ResolvedSong`)

When downloading music, popular songs are downloaded repeatedly across different users. To prevent redundant external search calls and minimize API quota usage:

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

## 8. Serper Candidate URL Resolution & Fallback

Once track names and artists are extracted (and after cache check):

1. Builds precise search query: `"{Title} {Artists} audio"`
2. Queries the **Serper API** (`https://google.serper.dev/videos` or `https://google.serper.dev/search`).
3. Filters for valid media domain links (e.g. `youtube.com/watch?v=...` or `music.youtube.com/...`).
4. **Fallback Mode**: If `SERPER_API_KEY` is not provided or quota is exceeded, seamlessly returns `ytsearch1:{query}`.

---

## 9. Handoff to Existing yt-dlp Downloader Pipeline

TuneFetch **preserves and reuses the existing download infrastructure without modification**.

In `backend/app/services/playlist_pipeline.py`:
```python
# Calls the EXISTING DownloadManager directly:
task_id = await download_manager.create_download_task(
    url=candidate_url,
    format_type=audio_format,
    custom_title=track["title"],
    custom_artist=track["artists"],
    custom_thumbnail=track.get("thumbnail")
)
```

The pipeline:
- Processes songs sequentially with background non-blocking loops.
- Updates Neon PostgreSQL job records (`processed_tracks`, `successful_tracks`, `failed_tracks`, `track_results`).
- If an individual track fails to resolve or download, it is marked as failed, and the pipeline continues to the next track without stopping the batch.

---

## 10. Direct PC Folder Saving (File System Access API)

Rather than forcing users to download a compressed archive file and manually unzip it, TuneFetch provides direct PC folder delivery via the browser's native File System Access API (`window.showDirectoryPicker()`):

1. **User Folder Picker**: When the user clicks **"Save Playlist to Folder"**, the browser prompts the user to select their desired destination directory (e.g., `C:\Users\...\Music`).
2. **Directory Creation**: The utility (`frontend/src/utils/folderSaver.js`) creates a dedicated directory named `Thanks_for_downloading` inside the chosen location.
3. **In-Memory Unpack**: The client fetches the playlist ZIP stream from `/spotify/jobs/{job_id}/archive`, parses it using `JSZip`, and writes each audio file with its sanitized name (`{Artist} - {Song Title}.mp3`) directly onto disk.
4. **Fallback Handling**: If the browser does not support the File System Access API, it falls back to a direct standard file download.

---

## 11. API Endpoints Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/spotify/auth` | `GET` | Initiates Spotify OAuth login with PKCE and sets session cookie. |
| `/spotify/callback` | `GET` | Spotify OAuth redirect handler; verifies PKCE & saves encrypted tokens. |
| `/spotify/status` | `GET` | Returns connection status & Spotify profile for the current user. |
| `/spotify/disconnect` | `POST` | Unlinks Spotify account and removes tokens. |
| `/spotify/playlists` | `GET` | Returns all playlists owned/followed by the Spotify user. |
| `/spotify/playlists/{id}/tracks` | `GET` | Returns full list of tracks for a playlist with pagination. |
| `/spotify/playlists/{id}/download` | `POST` | Starts a background batch download job for the playlist. |
| `/spotify/jobs/{job_id}` | `GET` | Returns real-time progress and logs for a batch download job. |
| `/spotify/jobs/{job_id}/archive` | `GET` | Streams a ZIP archive of all completed MP3 files for direct folder saving. |

---

## 12. Troubleshooting & Gotchas

1. **`INVALID_CLIENT: Invalid redirect URI`**:
   - Ensure `http://localhost:8000/spotify/callback` is added word-for-word in the Spotify Developer Dashboard App settings under **Redirect URIs**.
2. **PostgreSQL SSL connection issues**:
   - Always append `?sslmode=require` to the Neon connection string in `DATABASE_URL`.
3. **Missing Serper API Key**:
   - If no Serper key is present, the app automatically switches to `ytsearch1:` fallback.
4. **Session Cookie in Cross-Origin environments**:
   - Ensure frontend Vite proxy routes `/spotify` and `/api` to the backend server with `credentials: 'include'`.
