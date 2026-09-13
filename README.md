# 🎧 TuneFetch — High-Fidelity Spotify Playlist Downloader

<p align="center">
  <img src="https://img.shields.io/badge/Audio-320_kbps_MP3-1DB954?style=for-the-badge&logo=spotify&logoColor=white" alt="320 kbps" />
  <img src="https://img.shields.io/badge/Security-OAuth_2.0_PKCE-10b981?style=for-the-badge&logo=auth0&logoColor=white" alt="PKCE OAuth" />
  <img src="https://img.shields.io/badge/CLI-One--Line_Engine-0078D7?style=for-the-badge&logo=windows-terminal&logoColor=white" alt="One-Line CLI" />
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-19+-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License" />
</p>

---

> [!IMPORTANT]
> ### 📢 Crucial Notice: Spotify Developer Web API Policy Changes
> **I originally built TuneFetch for everyone to use freely as a hosted online service.**
>
> However, **Spotify has updated their Developer Platform rules**:
> 1. **5-User Limit per Developer App**: Any application in Spotify "Development Mode" can now only be accessed by a maximum of **5 whitelisted users** added manually by the developer in their Spotify Developer Dashboard. Any 6th person trying to log in will be blocked by Spotify with a `User not registered on Developer Dashboard` error.
> 2. **Spotify Developer Web API Access Requires a Paid Subscription**: Spotify now mandates an active **paid Spotify subscription (e.g., at least a 1-month Spotify Premium plan)** on your account to register developer applications and access the Spotify Web API.
>
> ### 💡 The 100% Working Solution: Clone & Run Locally
> Because a single hosted web app cannot serve more than 5 accounts, **the intended way for everyone to use TuneFetch is to clone this repository, paste your own API keys following this README, and run it locally.**
>
> Once cloned on your machine, your own app has its own 5-slot quota for you and your friends, with zero rate limits, complete privacy, and full 320 kbps MP3 conversion power!

---

## ⚡ What is TuneFetch?

**TuneFetch** is a modern, high-fidelity Spotify playlist downloader. It combines the sleek aesthetic of a modern React web dashboard with the multi-threaded speed of a local Python transcoding engine.

- 🎵 **Studio-Quality Audio**: High-speed transcoding to pristine **320 kbps Constant Bitrate (CBR) MP3**.
- 🖼️ **Full Artwork & Metadata**: Injects high-resolution Spotify album covers, song titles, artists, and album tags directly into MP3 ID3 tags.
- 🛡️ **Zero Tracking, Zero Ads**: 100% private. Authenticates directly with Spotify via **PKCE OAuth 2.0**.
- 🚀 **No Browser Bottlenecks**: Avoids browser memory crashes and zip size caps by handing batch conversions over to a lightweight native CLI engine (`tunefetch TF-XXXX`).
- 🐘 **Zero-Config Database**: Runs out-of-the-box with auto-created SQLite (`tunefetch_dev.db`) or high-concurrency cloud PostgreSQL (Neon).

---

## 🚀 Quick Navigation

1. [📋 Prerequisites](#-prerequisites)
2. [🛠️ Step-by-Step Local Setup (End-to-End)](#️-step-by-step-local-setup-end-to-end)
   - [Step 1: Clone the Repository](#step-1-clone-the-repository)
   - [Step 2: Get Your Spotify Developer Credentials](#step-2-get-your-spotify-developer-credentials)
   - [Step 3: Get Your Free Serper API Key](#step-3-get-your-free-serper-api-key)
   - [Step 4: Configure Environment Variables (`.env`)](#step-4-configure-environment-variables-env)
   - [Step 5: Launch the Backend Server](#step-5-launch-the-backend-server)
   - [Step 6: Launch the Frontend Web App](#step-6-launch-the-frontend-web-app)
   - [Step 7: Install the Global CLI](#step-7-install-the-global-cli)
3. [🎧 How to Use TuneFetch](#-how-to-use-tunefetch)
4. [⚠️ Real Problems Faced & Complete Troubleshooting Guide](#️-real-problems-faced--complete-troubleshooting-guide)
5. [🔄 How the Full System Works (Architecture)](#-how-the-full-system-works-architecture)
6. [💡 CLI Commands & Options](#-cli-commands--options)
7. [📂 Project Structure](#-project-structure)
8. [🧪 Automated Testing](#-automated-testing)

---

## 📋 Prerequisites

Before starting, make sure you have the following installed on your machine:

| Tool | Minimum Version | Installation Link | Notes |
| :--- | :--- | :--- | :--- |
| **Python** | `3.10` or newer | [python.org/downloads](https://www.python.org/downloads/) | ⚠️ **Check "Add Python to PATH"** during installation! |
| **Node.js** | `18.0` or newer | [nodejs.org](https://nodejs.org/) | Includes `npm` |
| **Git** | Any modern version | [git-scm.com](https://git-scm.com/) | For cloning the repo |
| **Spotify Account** | Active Premium / 1-month sub | [spotify.com](https://www.spotify.com/) | Required by Spotify to create Developer Web API apps |

---

## 🛠️ Step-by-Step Local Setup (End-to-End)

Follow these clear, foolproof steps to get TuneFetch running locally in under 5 minutes:

### Step 1: Clone the Repository

Open your terminal (PowerShell, Command Prompt, or Terminal) and run:

```bash
git clone https://github.com/learnthusalearner/TuneFetch.git
cd TuneFetch
```

---

### Step 2: Get Your Spotify Developer Credentials

Spotify Web API requires developer credentials for OAuth login and playlist extraction:

1. Log in to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
   > **Note**: Your Spotify account must have an active paid subscription (e.g. 1 month Spotify Premium) to access the Developer API and create apps.
2. Click **Create App**.
3. Fill in the basic info:
   - **App Name**: `TuneFetch` (or anything you like)
   - **App Description**: `Local Spotify Playlist Downloader`
   - **Redirect URIs**: Add this exact URL:
     ```text
     http://127.0.0.1:8000/spotify/callback
     ```
   - Check the terms agreement and click **Save**.
4. Inside your new app's dashboard, click **Settings**:
   - Copy your **Client ID**.
   - Click **View client secret** and copy your **Client Secret**.
5. Under **User Management** in your app settings, ensure your Spotify account email is listed as an authorized user.

---

### Step 3: Get Your Free Serper API Key

> **Why is Serper needed?** Spotify's API only provides track metadata (song title, artist name, album art, ISRC); Spotify does **not** host raw audio download files. TuneFetch uses Serper's Google Search API to instantly resolve each Spotify song into its official YouTube audio candidate stream.

1. Go to [serper.dev](https://serper.dev) and sign up (takes 10 seconds with Google/GitHub).
2. You immediately get **2,500 free queries** (enough for hundreds of full playlists). No credit card required.
3. Copy your **API Key** from the Serper dashboard.

---

### Step 4: Configure Environment Variables (`.env`)

1. In the root directory of `TuneFetch`, create your `.env` file from the provided template:
   ```bash
   # On Windows PowerShell / Command Prompt:
   copy .env.example .env

   # On macOS / Linux:
   cp .env.example .env
   ```

2. Open `.env` in any text editor (VS Code, Notepad, etc.) and fill in your keys:

   ```ini
   # ============================================================
   # TuneFetch Environment Configuration
   # ============================================================

   BACKEND_URL=http://127.0.0.1:8000
   FRONTEND_URL=http://localhost:5173

   # Database (Leave commented out to use zero-setup local SQLite!)
   # DATABASE_URL=postgresql://user:password@your-neon-host.neon.tech/neondb?sslmode=require

   # Spotify Developer Credentials (From Step 2)
   SPOTIFY_CLIENT_ID=your_actual_spotify_client_id_here
   SPOTIFY_CLIENT_SECRET=your_actual_spotify_client_secret_here
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/spotify/callback

   # Serper Search API Key (From Step 3)
   SERPER_API_KEY=your_actual_serper_api_key_here

   # Session Security Key (Random string)
   SESSION_SECRET_KEY=tunefetch_secret_key_make_any_random_string_here
   ```

3. Save the file.

---

### Step 5: Launch the Backend Server

Open a terminal in the root `TuneFetch` directory:

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Start the FastAPI backend
python run.py
```

You will see:
```text
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```
- **Backend API**: `http://127.0.0.1:8000`
- **Interactive API Docs**: `http://127.0.0.1:8000/docs`

> [!TIP]
> Keep this terminal open and running in the background.

---

### Step 6: Launch the Frontend Web App

Open a **second terminal window** and navigate to the `frontend` folder:

```bash
# Navigate to frontend folder
cd frontend

# Install Node.js dependencies
npm install

# Start the Vite development server
npm run dev
```

You will see:
```text
  VITE v5.4.21  ready in 400 ms

  ➜  Local:   http://localhost:5173/
```

Open your browser and navigate to: **`http://localhost:5173`**!

---

### Step 7: Install the Global CLI

In either terminal, run:

```bash
python install_cli.py
```

This registers the `tunefetch` command globally on your machine so you can download playlists from any terminal.

---

## 🎧 How to Use TuneFetch

1. Open `http://localhost:5173` and click **"Launch Web App Dashboard"**.
2. Click **"Connect with Spotify"**.
   - An attractive glowing loader will guide you through the secure PKCE authorization.
   - You will be redirected to Spotify to log in and approve playlist reading.
   - You are automatically redirected back to TuneFetch, and all your personal playlists are displayed with cover artwork.
3. Select any playlist and click **"Download on My PC"**.
   - The web app generates a 4-digit session code (e.g., `TF-8429`).
4. In your terminal, run:
   ```bash
   tunefetch TF-8429
   ```
5. TuneFetch automatically converts all tracks to **320 kbps CBR MP3**, injects ID3 tags and album artwork, and saves them directly to your system `Downloads/Thanks for downloading/<Playlist Name>/` directory!

---

## ⚠️ Real Problems Faced & Complete Troubleshooting Guide

Here is every single real-world problem encountered during development and setup, along with the exact fix:

### 1. `INVALID_CLIENT: Invalid client` Error on Spotify Redirect
- **Problem**: When clicking "Connect with Spotify", Spotify opens a webpage saying `INVALID_CLIENT: Invalid client`.
- **Root Cause**: Your `.env` file still contains the placeholder `SPOTIFY_CLIENT_ID=your_spotify_client_id_here` instead of your real client ID from the Spotify Developer Dashboard.
- **Fix**: Open `.env` and replace `your_spotify_client_id_here` with your actual Spotify Client ID. Then **restart the backend** (`Ctrl+C` -> `python run.py`).

### 2. `INVALID_CLIENT: Invalid redirect URI` Error
- **Problem**: Spotify displays `Invalid redirect URI`.
- **Root Cause**: The redirect URI registered in Spotify Developer Dashboard does not **identically match** the one in your `.env`.
- **Fix**:
  1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) -> Your App -> **Settings**.
  2. Under **Redirect URIs**, make sure `http://127.0.0.1:8000/spotify/callback` is saved.
  3. Ensure there are no trailing slashes or accidental spaces.

### 3. `User not registered on Developer Dashboard` (5-User Quota Limit)
- **Problem**: Someone else tries to log in to your instance and Spotify shows an access denied error.
- **Root Cause**: Spotify's recent developer policy limits applications in **Development Mode** to **up to 5 whitelisted user accounts**.
- **Fix**: Go to Spotify Developer Dashboard -> Your App -> **User Management** -> Add the person's Spotify account email address and save. Or better yet, share this GitHub repository so they can clone it and run their own copy!

### 4. Spotify Developer Account Requires Paid Subscription
- **Problem**: Unable to create apps or access the Spotify Web API on the developer portal.
- **Root Cause**: Spotify introduced a requirement that developer accounts must have an active paid subscription (at least 1-month Spotify Premium) to access the Developer Web API.
- **Fix**: Subscribe to at least 1 month of Spotify Premium on the account you use for the Spotify Developer Dashboard.

### 5. Edited `.env` but Backend Still Shows Old Keys or Errors
- **Problem**: You updated `.env`, but the backend still behaves as if the old values are present.
- **Root Cause**: Python and FastAPI load `.env` environment variables into memory **only once at process startup**.
- **Fix**: You **must restart** the backend: Press `Ctrl + C` in the backend terminal running `python run.py`, then run `python run.py` again.

### 6. `ValueError: Serper API key is missing or invalid`
- **Problem**: Songs fail during stream resolution in the terminal or batch downloader.
- **Root Cause**: Spotify only provides track names and artist metadata—not raw MP3 files. Serper's Google Search API is required to find matching YouTube streams.
- **Fix**: Register for free at [serper.dev](https://serper.dev) (no credit card required), copy your API key, paste it into `SERPER_API_KEY=` in `.env`, and restart `python run.py`.

### 7. `tunefetch: command not found` or PowerShell Script Execution Error
- **Problem**: Running `tunefetch` in terminal says command not recognized, or PowerShell shows `PSSecurityException`.
- **Fix**:
  - Close and reopen your terminal after running `python install_cli.py`.
  - Alternatively, you can always run the downloader directly with Python:
    ```bash
    python download.py TF-XXXX
    ```

### 8. OAuth Takes a Few Seconds to Complete
- **Problem**: After approving Spotify login, there is a short delay before playlists appear.
- **What TuneFetch Does**: We built a dedicated, animated **Spotify OAuth Loader** that displays real-time progress checklist items ("PKCE OAuth Handshake Verified", "Token Exchange & Session Sync", "Import Playlists & Audio Library") so you always know exactly what is happening under the hood.

---

## 🔄 How the Full System Works (Architecture)

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Developer
    participant Web as React Web UI (:5173)
    participant API as FastAPI Backend (:8000)
    participant Spotify as Spotify Accounts API
    participant DB as SQLite / Neon PostgreSQL
    participant Serper as Google Serper API
    participant Engine as Native CLI Engine (tunefetch)
    participant Disk as Local Downloads Folder

    Note over User, Web: Phase 1: Authentication & Selection
    User->>Web: 1. Clicks "Connect with Spotify"
    Web->>API: 2. GET /spotify/auth (PKCE SHA-256 challenge generated)
    API->>Spotify: 3. User logs in & grants playlist-read access
    Spotify->>API: 4. Redirects to /spotify/callback with auth code
    API->>Spotify: 5. Exchanges code for encrypted access & refresh tokens
    API->>DB: 6. Stores encrypted tokens & sets HTTP-only session cookie
    Web->>API: 7. GET /spotify/playlists (Sliding-window pagination)
    API-->>Web: 8. Returns playlists with track metadata and album art

    Note over Web, Engine: Phase 2: Session Key Generation
    User->>Web: 9. Clicks "Download on My PC" on chosen playlist
    Web->>API: 10. POST /spotify/playlist/session
    API-->>Web: 11. Returns 4-digit session code (e.g. TF-8429)

    Note over Engine, Disk: Phase 3: High-Fidelity Audio Conversion
    User->>Engine: 12. Runs: tunefetch TF-8429 in any terminal
    Engine->>API: 13. Resolves playlist tracks from local backend
    API-->>Engine: 14. Returns full track list metadata
    loop For Every Song in Playlist
        Engine->>DB: 15. Check resolved_songs cache for (Title + Artist)
        alt Cache Hit (< 5ms)
            DB-->>Engine: 16a. Reuses cached stream URL instantly
        else Cache Miss
            Engine->>Serper: 16b. Queries: site:youtube.com/watch "Song" "Artist"
            Serper-->>Engine: 17b. Returns verified YouTube audio candidate
            Engine->>DB: 18b. Caches stream into DB for future downloads
        end
        Engine->>Engine: 19. Streams audio & converts to 320 kbps CBR MP3 via embedded FFmpeg
        Engine->>Engine: 20. Injects Spotify ID3 tags & embeds high-res album artwork
        Engine->>Disk: 21. Writes to Downloads/Thanks for downloading/<Playlist Name>/
    end
    Engine-->>User: 22. [✓] All tracks converted and ready to play!
```

---

## 💡 CLI Commands & Options

You can run `tunefetch` from any command prompt, PowerShell, or terminal:

| Command | Action |
| :--- | :--- |
| `tunefetch TF-XXXX` | Download tracks for a specific session code |
| `tunefetch` | Interactive mode — prompts you to enter your session code |
| `tunefetch --help` | Show usage options, version, and download folder path |
| `python download.py TF-XXXX` | Direct script execution (works without global PATH install) |

---

## 📂 Project Structure

```
TuneFetch/
├── .env.example                          # Root environment template (placeholders only)
├── download.py                           # CLI downloader root entrypoint
├── install_cli.py                        # 1-Command CLI installer and PATH setup
├── requirements.txt                      # Root Python dependencies
├── run.py                                # Root backend launcher script
├── backend/
│   ├── .env.example                      # Safe backend template
│   ├── launcher.py                       # CLI downloader core execution engine
│   ├── requirements.txt                  # FastAPI and audio conversion packages
│   ├── run.py                            # Backend server runner
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py                 # Multi-directory .env auto-loader
│   │   │   ├── database.py               # SQLAlchemy database engine (SQLite / Neon)
│   │   │   └── rate_limiter.py           # In-memory sliding-window request limiter
│   │   ├── models/
│   │   │   ├── db_models.py              # User, SpotifyAccount, ResolvedSong models
│   │   │   └── schemas.py                # Pydantic request and response schemas
│   │   ├── routes/
│   │   │   ├── health.py                 # System health and ping check
│   │   │   ├── media.py                  # Direct audio stream proxy endpoints
│   │   │   ├── spotify.py                # Spotify OAuth, playlists & sessions
│   │   │   └── cloud_session.py          # Session code resolution API
│   │   ├── services/
│   │   │   ├── downloader.py             # Audio conversion and stream pipeline
│   │   │   ├── local_batch_downloader.py # Multi-threaded terminal progress engine
│   │   │   ├── spotify_service.py        # PKCE OAuth & sliding-window pagination
│   │   │   └── serper_service.py         # Serper Google Search & stream cache
│   │   └── utils/
│   │       ├── auth_helper.py            # Fernet token encryption & session cookies
│   │       └── ffmpeg_helper.py          # Embedded FFmpeg binary locator
│   └── tests/                            # Automated pytest test suite
│
├── frontend/
│   ├── package.json                      # React, Vite, and Lucide dependencies
│   ├── vite.config.js                    # Vite configuration with API proxy
│   └── src/
│       ├── components/                   # UI components (Hero, Terminal, Spotify, etc.)
│       │   └── Spotify/
│       │       ├── SpotifyOAuthLoader.jsx# Glowing animated OAuth loading indicator
│       │       ├── SpotifyConnect.jsx    # Hero connect card with responsive states
│       │       └── SpotifyPlaylists.jsx  # Grid of user playlists
│       ├── pages/                        # Dashboard and Landing pages
│       └── services/api.js               # Frontend API client
└── README.md                             # Complete end-to-end documentation
```

---

## 🧪 Automated Testing

Verify your setup with the backend test suite:

```bash
python -m pytest backend/tests/test_spotify_pipeline.py backend/tests/test_rate_limiter.py -v
```

All tests verify PKCE authorization, token encryption at rest, automatic token refresh, sliding-window pagination, and Serper stream resolution.

---

## 📄 License

TuneFetch is released under the **MIT License**. Free for personal and educational use.

<p align="center">
  <strong>Crafted with ❤️ • Convert & Preserve Your Music in Studio Quality</strong>
</p>
