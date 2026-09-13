# 🎧 TuneFetch - High-Fidelity Spotify Playlist Downloader

<p align="center">
  <img src="https://img.shields.io/badge/Audio-320_kbps_MP3-1DB954?style=for-the-badge&logo=spotify&logoColor=white" alt="320 kbps" />
  <img src="https://img.shields.io/badge/Security-OAuth_2.0_PKCE-10b981?style=for-the-badge&logo=auth0&logoColor=white" alt="PKCE OAuth" />
  <img src="https://img.shields.io/badge/CLI-One--Line_Engine-0078D7?style=for-the-badge&logo=windows-terminal&logoColor=white" alt="One-Line CLI" />
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-19+-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License" />
</p>

---

## ⚡ What is TuneFetch?

**TuneFetch** is a modern, high-fidelity Spotify playlist downloader. It combines the comfort of a sleek web dashboard with the multi-threaded power of your local machine.

- 🎵 **Studio-Quality Audio**: High-speed conversion to pristine **320 kbps Constant Bitrate (CBR) MP3**.
- 🖼️ **Full Artwork & Metadata**: Embeds high-resolution album covers, track titles, artists, and album tags automatically.
- 🛡️ **Zero Tracking, Zero Ads**: 100% private. Authenticates directly with Spotify via **PKCE OAuth 2.0**.
- 🚀 **No Browser Bottlenecks**: Avoids browser tab crashes and download size limits by handing batch conversions over to a lightweight native CLI engine (`tunefetch TF-XXXX`).
- 🐘 **Zero-Config Database**: Runs out-of-the-box with auto-created SQLite (`tunefetch_dev.db`) or high-concurrency cloud PostgreSQL (Neon).

---

## 🚀 Quick Navigation

1. [⚡ 60-Second Quickstart (CLI Only)](#-60-second-quickstart-cli-only)
2. [🛠️ Complete Setup Guide (Clone & Run Locally)](#️-complete-setup-guide-clone--run-locally)
   - [Step 1: Clone the Repository](#step-1-clone-the-repository)
   - [Step 2: Environment Configuration (`.env`)](#step-2-environment-configuration-env)
   - [Step 3: Start the Backend API](#step-3-start-the-backend-api)
   - [Step 4: Start the Frontend UI](#step-4-start-the-frontend-ui)
   - [Step 5: Install the Global CLI](#step-5-install-the-global-cli)
3. [🔄 How the Full System Works (End-to-End Architecture)](#-how-the-full-system-works-end-to-end-architecture)
4. [🖥️ Live Terminal Downloader Experience](#️-live-terminal-downloader-experience)
5. [📁 File Organization & Metadata](#-file-organization--metadata)
6. [💡 CLI Commands & Options](#-cli-commands--options)
7. [📂 Project Structure](#-project-structure)
8. [❓ Troubleshooting & Common Solutions](#-troubleshooting--common-solutions)

---

## ⚡ 60-Second Quickstart (CLI Only)

If you already have a 4-digit session code (e.g. `TF-8429`) from the TuneFetch dashboard:

```bash
# 1. Clone the repository
git clone https://github.com/learnthusalearner/TuneFetch.git
cd TuneFetch

# 2. Register the global CLI command (Windows, macOS, or Linux)
python install_cli.py

# 3. Download your playlist in pristine 320 kbps MP3
tunefetch TF-8429
```

All tracks will be transcoded and saved directly into your system `Downloads/Thanks for downloading/<Playlist Name>/` directory.

---

## 🛠️ Complete Setup Guide (Clone & Run Locally)

Follow these clear, step-by-step instructions to run the entire stack (FastAPI Backend + React Frontend + CLI Engine) on your local machine.

### Prerequisites

Ensure you have the following installed:
- **Python**: `3.10` or newer ([Download Python](https://www.python.org/downloads/)) — *Make sure "Add Python to PATH" is checked during installation.*
- **Node.js**: `18.0` or newer with `npm` ([Download Node.js](https://nodejs.org/))
- **Git**: ([Download Git](https://git-scm.com/))

---

### Step 1: Clone the Repository

Open your terminal or command prompt:

```bash
git clone https://github.com/learnthusalearner/TuneFetch.git
cd TuneFetch
```

---

### Step 2: Environment Configuration (`.env`)

TuneFetch requires only two API keys to run with full functionality: **Spotify Developer** and **Serper API**.

1. Copy the example environment template to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(On Windows Command Prompt, run: `copy .env.example .env`)*

2. Open `.env` in any text editor:
   ```ini
   # ============================================================
   # TuneFetch Environment Configuration
   # ============================================================

   # 1. Database (Optional)
   # Leave blank or commented out to use zero-setup local SQLite (tunefetch_dev.db)
   # DATABASE_URL=postgresql://user:password@your-neon-host.neon.tech/neondb?sslmode=require

   # 2. Spotify Developer Credentials (REQUIRED)
   # Dashboard: https://developer.spotify.com/dashboard
   # Crucial: Add Redirect URI: http://127.0.0.1:8000/spotify/callback
   SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/spotify/callback

   # 3. Serper Search API Key (REQUIRED for audio stream discovery)
   # Free 2,500 queries upon signup: https://serper.dev
   SERPER_API_KEY=your_serper_api_key_here

   # 4. App Security & Frontend Origin
   SESSION_SECRET_KEY=change_this_to_a_secure_random_string_at_least_32_chars
   FRONTEND_URL=http://localhost:5173
   ```

#### 🔑 Where to get your keys (Takes 2 minutes):

| Service | Free Tier | Setup Steps |
| :--- | :---: | :--- |
| **Spotify Developer** | Free | 1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) and log in.<br/>2. Click **Create App**.<br/>3. In App Settings, add Redirect URI: **`http://127.0.0.1:8000/spotify/callback`** and save.<br/>4. Copy **Client ID** and **Client Secret** into your `.env`. |
| **Serper API** | 2,500 Free Searches | 1. Go to [serper.dev](https://serper.dev) and sign up with Google or GitHub.<br/>2. Copy your **API Key** from the dashboard and paste it into `SERPER_API_KEY`. |
| **Database** | Built-in SQLite | **Zero setup required!** By default, TuneFetch automatically initializes a local SQLite database (`tunefetch_dev.db`) on startup. |

---

### Step 3: Start the Backend API

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Start the FastAPI server:
   ```bash
   python run.py
   ```

The backend server is now running:
- **API Server**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

---

### Step 4: Start the Frontend UI

Open a **second terminal window** and run:

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser and visit: **`http://localhost:5173`**

---

### Step 5: Install the Global CLI

In either terminal, run:

```bash
python install_cli.py
```

This single command:
1. Installs all required audio transcoding packages (`imageio-ffmpeg`, `mutagen`, `requests`, `yt-dlp`).
2. Registers `tunefetch` globally in your system's PATH.
3. Allows you to open **any** terminal and run `tunefetch TF-XXXX`.

---

## 🔄 How the Full System Works (End-to-End Architecture)

Here is a visual breakdown of the architecture when you download a playlist:

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
    User->>Web: 1. Clicks "Launch Web App Dashboard"
    Web->>API: 2. GET /spotify/auth (PKCE SHA-256 challenge generated)
    API->>Spotify: 3. User logs in & grants playlist read access
    Spotify->>API: 4. Redirects to /spotify/callback with auth code
    API->>Spotify: 5. Exchanges code for encrypted access & refresh tokens
    API->>DB: 6. Stores encrypted tokens & sets HTTP-only session cookie
    Web->>API: 7. GET /spotify/playlists (Sliding-window pagination, up to 1,400+ tracks)
    API-->>Web: 8. Returns playlists with track metadata and album art

    Note over Web, Engine: Phase 2: Session Key Generation
    User->>Web: 9. Clicks "Download on My PC" on chosen playlist
    Web->>API: 10. POST /spotify/playlist/session
    API-->>Web: 11. Returns 4-digit session code (e.g. TF-8429)

    Note over Engine, Disk: Phase 3: High-Fidelity Audio Conversion
    User->>Engine: 12. Runs: tunefetch TF-8429 in any terminal
    Engine->>API: 13. Resolves playlist tracks from local backend (or cloud fallback)
    API-->>Engine: 14. Returns full track list metadata
    loop For Every Song in Playlist
        Engine->>DB: 15. Check resolved_songs cache for (Title + Artist)
        alt Cache Hit (< 5ms)
            DB-->>Engine: 16a. Reuses cached stream URL instantly
        else Cache Miss
            Engine->>Serper: 16b. Queries: site:youtube.com/watch "Song" "Artist"
            Serper-->>Engine: 17b. Returns verified YouTube audio candidate
            Engine->>DB: 18b. Caches stream into DB for future instant downloads
        end
        Engine->>Engine: 19. Streams audio & converts to 320 kbps CBR MP3 via embedded FFmpeg
        Engine->>Engine: 20. Injects Spotify ID3 tags & embeds high-res album artwork
        Engine->>Disk: 21. Writes to Downloads/Thanks for downloading/<Playlist Name>/
    end
    Engine-->>User: 22. [✓] All tracks converted and ready to play!
```

---

## 🖥️ Live Terminal Downloader Experience

When you run `tunefetch TF-8429`, the engine displays live Unicode progress indicators, real-time download speeds, and completion metrics:

```text
$ tunefetch TF-8429

 ╭────────────────────────────────────────────────────────────╮
 │  ♫ TuneFetch CLI Engine v1.3.0                             │
 │  High-Fidelity Spotify Playlist & 320 kbps MP3 Downloader  │
 ╰────────────────────────────────────────────────────────────╯

 [•] Resolving download session: TF-8429...
 [✓] Session Verified: "Late Night Lo-Fi Chillout" (24 Tracks Verified)
 [→] Destination: Downloads/Thanks for downloading/Late Night Lo-Fi Chillout

 [+] [1/24] Petit Biscuit - Sunset Lover              [✓ COMPLETED]
     ↳ 320 kbps CBR MP3 · 8.4 MB · Album Art Embedded · Saved
 [+] [2/24] M83 - Midnight City                       [✓ COMPLETED]
     ↳ 320 kbps CBR MP3 · 9.8 MB · Album Art Embedded · Saved
 [↓] [3/24] The Weeknd - Starboy           92% | 11.2 MB/s | ETA: 00:01
     [██████████████████████████████████░░] 92%

 ╭────────────────────────────────────────────────────────────╮
 │  ✓ All 24 of 24 tracks converted successfully at 320 kbps! │
 │  ⏱  Total Time: 01:14 · Bitrate: 320 kbps CBR              │
 │  📂 Saved To: Downloads/Thanks for downloading/...         │
 ╰────────────────────────────────────────────────────────────╯
```

---

## 📁 File Organization & Metadata

All downloaded songs are automatically organized in your system's default `Downloads` folder:

```
Downloads/
└── Thanks for downloading/
    └── <Playlist_Name>/
        ├── 01 - Petit Biscuit - Sunset Lover.mp3
        ├── 02 - M83 - Midnight City.mp3
        ├── 03 - The Weeknd - Starboy.mp3
        └── ...
```

### Every track includes:
- **Max Bitrate**: 320 kbps Constant Bitrate (CBR) stereo audio.
- **Embedded Cover Art**: High-resolution Spotify artwork injected into the MP3's APIC frame.
- **ID3 Metadata**: Title, Artist, Album, and Track Number.
- **Ready to Play**: Drag and drop into Apple Music, VLC, Rekordbox, USB drives, or offline media players with zero extraction needed.

---

## 💡 CLI Commands & Options

You can run `tunefetch` from any command prompt, PowerShell, or terminal:

| Command | Action |
| :--- | :--- |
| `tunefetch TF-XXXX` | Download tracks for a specific session code |
| `tunefetch` | Interactive mode — prompts you to enter your session code |
| `tunefetch --help` | Show usage options, version, and download folder path |
| `python download.py TF-XXXX` | Direct script execution (alternative if PATH is not updated) |

---

## 📂 Project Structure

```
TuneFetch/
├── .env.example                          # Environment variable configuration template
├── download.py                           # CLI downloader root entrypoint
├── install_cli.py                        # 1-Command CLI installer and PATH setup
├── requirements.txt                      # Root Python dependencies
├── run.py                                # Root backend launcher script
├── backend/
│   ├── .env.example                      # Backend-specific template
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
│       ├── pages/                        # Dashboard and Landing pages
│       └── services/api.js               # Frontend API client
└── README.md
```

---

## 🧪 Automated Testing

Verify your setup with the backend test suite:

```bash
# Run all automated tests
pytest backend/tests/test_spotify_pipeline.py backend/tests/test_rate_limiter.py -v
```

---

## ❓ Troubleshooting & Common Solutions

### 1. `tunefetch: command not found` (or not recognized)
- **Cause**: The terminal has not reloaded system environment variables after running `python install_cli.py`.
- **Solution**: Close and reopen your terminal or command prompt. Alternatively, you can always run:
  ```bash
  python download.py TF-XXXX
  ```

### 2. Spotify Login: `INVALID_CLIENT: Invalid redirect URI`
- **Cause**: The redirect URI in your `.env` does not match the Spotify Developer Dashboard settings.
- **Solution**:
  1. Open [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard).
  2. Click on your app and go to **Settings**.
  3. Under **Redirect URIs**, ensure `http://127.0.0.1:8000/spotify/callback` is added and saved.

### 3. `ValueError: Serper API key is missing`
- **Cause**: `SERPER_API_KEY` is not set in `.env`.
- **Solution**: Sign up at [serper.dev](https://serper.dev) for a free API key (2,500 free queries, no credit card required) and add it to your `.env`.

### 4. `Session code was not found or has expired`
- **Cause**: Session keys expire after 24 hours for privacy and cache hygiene.
- **Solution**: Go back to the web dashboard (`http://localhost:5173`) and click **"Download on My PC"** again to generate a fresh 4-digit code.

---

## 📄 License

TuneFetch is released under the **MIT License**. Free for personal and educational use.

<p align="center">
  <strong>Crafted with ❤️ • Convert & Preserve Your Music in Studio Quality</strong>
</p>
