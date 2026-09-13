# 🎧 TuneFetch - High-Fidelity Spotify Playlist Downloader

<p align="center">
  <img src="https://img.shields.io/badge/Audio-320_kbps_MP3-1DB954?style=for-the-badge&logo=spotify&logoColor=white" alt="320 kbps" />
  <img src="https://img.shields.io/badge/Setup-1--Command_CLI-0078D7?style=for-the-badge&logo=windows-terminal&logoColor=white" alt="1-Command CLI" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-19+-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License" />
</p>

---

## 📖 What is TuneFetch?

**TuneFetch** is the fastest and easiest way to download your Spotify playlists directly onto your computer in pristine **320 kbps MP3** format with high-resolution album artwork embedded — completely free, zero ads, and without needing browser extensions.

> 🌐 **Live Web App:** [tune-fetch-tan.vercel.app](https://tune-fetch-tan.vercel.app)

Choose your setup path:
- 🚀 **[Path A: CLI Quickstart (60 Seconds)](#-path-a-cli-quickstart-ready-in-60-seconds)** — Download music right now using the live web app and the global CLI.
- 🛠️ **[Path B: Self-Hosting & Local Development](#-path-b-self-hosting--local-development-guide)** — Run your own backend + frontend locally with `.env`.

---

## ⚡ Path A: CLI Quickstart (Ready in 60 Seconds)

If you just want to download playlists using the official live cloud service:

### 1. Clone & Install
```bash
git clone https://github.com/learnthusalearner/TuneFetch.git
cd TuneFetch
python install_cli.py
```
*(On Windows, macOS, or Linux, this automatically installs dependencies and registers `tunefetch` globally in your PATH).*

### 2. Get Your Code & Download!
1. Open [tune-fetch-tan.vercel.app](https://tune-fetch-tan.vercel.app).
2. Connect your Spotify account and click **"Download on My PC"** on any playlist to get your session code (e.g. `TF-4847`).
3. Open **ANY terminal window** and run:
   ```bash
   tunefetch TF-4847
   ```
4. All songs are saved directly into `Downloads/Thanks for downloading/<Playlist Name>/` in 320 kbps MP3 format with album covers and ID3 metadata!

---

## 🛠️ Path B: Self-Hosting & Local Development Guide

Want to run the complete stack locally (FastAPI backend + React frontend) on your own machine? You can clone this repository, configure `.env`, and have everything running in minutes.

### 1. Prerequisites
- **Python**: 3.10+ (make sure Python is added to your system `PATH`)
- **Node.js**: 18+ and `npm`
- **Git**

---

### 2. Clone the Repository
```bash
git clone https://github.com/learnthusalearner/TuneFetch.git
cd TuneFetch
```

---

### 3. Configure Environment Variables (`.env`)

Copy the provided example file to `.env`:
```bash
cp .env.example .env
```
*(TuneFetch automatically supports loading `.env` from either the repository root or the `backend/` directory).*

Open `.env` in your code editor and configure your credentials:

```ini
# ============================================================
# TuneFetch Environment Configuration
# ============================================================

# Database Configuration
# Leave commented out to use zero-setup local SQLite (tunefetch_dev.db):
# DATABASE_URL=postgresql://user:password@your-neon-host.neon.tech/neondb?sslmode=require

# Spotify Developer Credentials (REQUIRED)
# 1. Go to https://developer.spotify.com/dashboard
# 2. Create an App
# 3. Add Redirect URI: http://127.0.0.1:8000/spotify/callback
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/spotify/callback

# Serper Search API Key (REQUIRED for YouTube audio stream resolution)
# Get 2,500 free queries on sign-up: https://serper.dev
SERPER_API_KEY=your_serper_api_key_here

# Security & Frontend URL
SESSION_SECRET_KEY=change_this_to_a_secure_random_string_at_least_32_chars
FRONTEND_URL=http://localhost:5173
```

#### 🔑 Where to get each key:
| Variable | Required? | Description |
| :--- | :---: | :--- |
| `SPOTIFY_CLIENT_ID`<br/>`SPOTIFY_CLIENT_SECRET` | **YES** | From [Spotify Developer Dashboard](https://developer.spotify.com/dashboard). **Crucial**: in your Spotify app settings, add `http://127.0.0.1:8000/spotify/callback` to the **Redirect URIs**. |
| `SERPER_API_KEY` | **YES** | From [serper.dev](https://serper.dev) (free 2,500 queries upon signup). Used to accurately match track metadata to audio streams. |
| `DATABASE_URL` | *Optional* | If left commented out, TuneFetch will **automatically use a local SQLite database** (`tunefetch_dev.db`) with zero setup needed! For production, provide a Neon or PostgreSQL connection string. |
| `SESSION_SECRET_KEY` | *Optional* | Any secure random string (minimum 32 characters) used to cryptographically sign session cookies. |
| `FRONTEND_URL` | *Optional* | Defaults to `http://localhost:5173` for local development. |

---

### 4. Install Dependencies

#### Python Backend:
```bash
pip install -r requirements.txt
```
*(Or run `python install_cli.py` to also register the `tunefetch` CLI command globally).*

#### React Frontend:
```bash
cd frontend
npm install
cd ..
```

---

### 5. Run the Local Stack

Run the backend and frontend in two separate terminals:

#### Terminal 1 — Backend (FastAPI):
```bash
python run.py
```
- API will start on: **`http://127.0.0.1:8000`**
- Interactive Swagger documentation: **`http://127.0.0.1:8000/docs`**

#### Terminal 2 — Frontend (React + Vite):
```bash
cd frontend
npm run dev
```
- Web UI will start on: **`http://localhost:5173`**

Open **`http://localhost:5173`** in your browser, connect Spotify, select any playlist, and enjoy!

---

## 🎵 How It Works (Step-by-Step)

```mermaid
graph LR
    A[1. Open TuneFetch Web UI] --> B[2. Connect Spotify]
    B --> C[3. Click 'Download on My PC']
    C --> D[4. Copy Session Code TF-XXXX]
    D --> E[5. Run: tunefetch TF-XXXX]
    E --> F[6. Saved to Downloads Folder!]
```

1. **Connect Spotify**: Click **Connect Spotify** to browse your public, private, and collaborative playlists via secure OAuth 2.0 PKCE.
2. **Generate Session Code**: Click **"Download on My PC"** on any playlist to get a temporary session code (e.g. `TF-4847`).
3. **Execute in Terminal**: Open your terminal (PowerShell, Command Prompt, or bash) and run:
   ```bash
   tunefetch TF-4847
   ```
4. **Local or Cloud**: The CLI automatically checks both your local running server (`http://127.0.0.1:8000`) and the cloud API.
5. **Real-Time Download**: Songs are downloaded in parallel with real-time transfer speeds and live progress bars.

---

## 📁 Where Are Downloaded Songs Saved?

All tracks are automatically organized into your standard system Downloads folder:

```
Downloads/
└── Thanks for downloading/
    └── <Playlist_Name>/
        ├── 01 - Artist - Song Title.mp3
        ├── 02 - Artist - Another Song.mp3
        └── ...
```

- 💎 **320 kbps CBR MP3** maximum audio fidelity.
- 🖼️ **Embedded Album Artwork** on every single track.
- 🏷️ **Proper ID3 Metadata** (Artist, Title, Album, Track Number).
- 📂 **No ZIP extraction required**: Ready to play immediately in VLC, Apple Music, Windows Media Player, or car stereos.

---

## 💡 CLI Commands & Options

You can run `tunefetch` from any folder or terminal:

| Command | Description |
| :--- | :--- |
| `tunefetch TF-XXXX` | Download tracks for a specific session code |
| `tunefetch` | Interactive prompt — paste code when prompted |
| `tunefetch --help` | Show usage options and current download folder |
| `python download.py TF-XXXX` | Direct script execution fallback |

### Live Terminal Downloader Preview
```
$ tunefetch TF-8429

============================================================
             TuneFetch CLI Engine v1.3.0
   Spotify Playlist & High-Fidelity Audio Downloader
============================================================

[+] Resolving download session for code: TF-8429...
[✓] Session Verified: "Late Night Lo-Fi Chillout" (24 Tracks Verified)
[+] Destination Folder: Downloads/Thanks for downloading/Late Night Lo-Fi Chillout

[+] [1/24] Petit Biscuit - Sunset Lover                     [COMPLETED ✓]
    ↳ 320 kbps CBR MP3 · Album Art Embedded · Saved
[+] [2/24] M83 - Midnight City                              [COMPLETED ✓]
    ↳ 320 kbps CBR MP3 · Album Art Embedded · Saved
[+] [3/24] The Weeknd - Blinding Lights         92% |  9.4 MB/s | ETA: 00:01
[██████████████████████████████████░░░░] 92%

[✓] 24 of 24 tracks converted successfully at 320 kbps!
Total Time: 01:14 · Destination: Downloads/Thanks for downloading/Late Night Lo-Fi Chillout
```

---

## ✨ Key Features

- 🟢 **Spotify OAuth 2.0 with PKCE**: Inspect and download your own private, collaborative, and public Spotify playlists with 100% privacy.
- ⚡ **1-Command Setup**: `python install_cli.py` handles dependencies and PATH setup globally.
- 📊 **Real-Time Visual Download Reporting**: Live progress bars (`[████████░░] 78%`), speeds in `MB/s`, and dynamic ETA calculation.
- 🐘 **Zero-Config Database or Cloud Neon**: Works out-of-the-box with local SQLite (`tunefetch_dev.db`) or high-concurrency Neon PostgreSQL with song caching.
- 📜 **Large Playlist Pagination**: Handles playlists containing **10, 100, 500, or 1,400+ tracks** without freezing or dropping songs.
- 🛠️ **Embedded Audio Conversion**: Uses `imageio-ffmpeg` to ensure zero-configuration MP3 conversion without manual FFmpeg installation.
- 🛡️ **Zero Tracking & No Adware**: 100% open-source, inspectable Python engine.

---

## 📂 Project Structure

```
TuneFetch/
├── .env.example                          # Environment variable template
├── download.py                           # CLI downloader entrypoint
├── install_cli.py                        # 1-Command installer & PATH setup
├── requirements.txt                      # Root Python dependencies
├── run.py                                # Root backend launcher
├── backend/
│   ├── .env.example                      # Backend-specific env template
│   ├── launcher.py                       # CLI downloader core engine
│   ├── requirements.txt                  # Backend dependencies
│   ├── run.py                            # Backend server launcher
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py                 # Settings & env loader (root & backend)
│   │   │   ├── database.py               # SQLAlchemy (PostgreSQL / SQLite)
│   │   │   └── rate_limiter.py           # In-memory sliding-window rate limiter
│   │   ├── models/
│   │   │   ├── db_models.py              # User, SpotifyAccount, ResolvedSong
│   │   │   └── schemas.py                # Pydantic schemas
│   │   ├── routes/
│   │   │   ├── health.py                 # Health check
│   │   │   ├── media.py                  # Audio stream & download jobs
│   │   │   ├── spotify.py                # Spotify OAuth, playlists & sessions
│   │   │   └── cloud_session.py          # Session code resolution API
│   │   ├── services/
│   │   │   ├── downloader.py             # Audio extraction engine
│   │   │   ├── local_batch_downloader.py # Batch CLI downloader with progress
│   │   │   ├── spotify_service.py        # PKCE OAuth & 1,400+ track pagination
│   │   │   └── serper_service.py         # Serper search & stream cache
│   │   └── utils/
│   │       ├── auth_helper.py            # Token encryption & session cookies
│   │       └── ffmpeg_helper.py          # Embedded FFmpeg binary locator
│   └── tests/                            # Automated test suite
│
├── frontend/
│   ├── .env.example                      # Frontend environment template
│   ├── package.json                      # React & Vite dependencies
│   ├── vite.config.js                    # Vite config with API proxy
│   └── src/
│       ├── components/                   # UI components (Spotify, Terminal, etc.)
│       ├── pages/                        # Landing & Dashboard pages
│       └── services/api.js               # Frontend API client
└── README.md
```

---

## 🧪 Automated Testing

Run the test suite with pytest:
```bash
pytest backend/tests/test_spotify_pipeline.py backend/tests/test_rate_limiter.py -v
```

---

## ❓ Troubleshooting & FAQs

### ❌ `tunefetch: command not found`
- **Cause**: Terminal environment variables have not reloaded after running `install_cli.py`.
- **Solution**: Open a **new** terminal window and run `tunefetch TF-XXXX`. Or run `python download.py TF-XXXX`.

### ❌ Spotify Login Error: `INVALID_CLIENT: Invalid redirect URI`
- **Cause**: The Redirect URI has not been added to your Spotify Developer App settings.
- **Solution**: Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) -> Select your App -> Settings -> Add `http://127.0.0.1:8000/spotify/callback` to **Redirect URIs** and save.

### ❌ `ValueError: Serper API key is missing`
- **Cause**: `SERPER_API_KEY` is not set in `.env`.
- **Solution**: Create a free account at [serper.dev](https://serper.dev) (takes 30 seconds), copy your API key, and paste it into `.env`.

### ❌ `Session code was not found or has expired`
- **Cause**: Session codes expire after 24 hours.
- **Solution**: Click **"Download on My PC"** again on the web app to generate a fresh 4-digit code.

---

## 📄 License

Distributed under the **MIT License**. Free for personal and educational use.

<p align="center">
  <strong>Made with ❤️ • High-Fidelity Music Extraction Made Effortless</strong>
</p>
