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

**TuneFetch** is the fastest and easiest way to download your Spotify playlists directly onto your computer in pristine **320 kbps MP3** format with high-resolution album artwork embedded — completely free, with zero ads, and without needing shady browser extensions.

> 🌐 **Live Web App:** [tune-fetch-tan.vercel.app](https://tune-fetch-tan.vercel.app)

---

## ⚡ Quick Start (Ready in 60 Seconds)

### 1. Clone the repository
```bash
git clone https://github.com/learnthusalearner/TuneFetch.git
cd TuneFetch
```

### 2. Run the 1-Command Setup
```bash
python install_cli.py
```
*(Or `python setup.py`)*

This automatically:
- ✅ Installs all necessary audio processing dependencies.
- ✅ Registers the `tunefetch` command globally on your system.

### 3. Download Any Playlist!
Open **ANY** terminal window and run:
```bash
tunefetch TF-XXXX
```
*(Replace `TF-XXXX` with your session code from the website).*

---

## 🎵 How to Download Any Spotify Playlist (Step-by-Step)

```mermaid
graph LR
    A[1. Open TuneFetch Website] --> B[2. Select Any Playlist]
    B --> C[3. Get Session Code TF-XXXX]
    C --> D[4. Run: tunefetch TF-XXXX]
    D --> E[5. Saved to Downloads Folder!]
```

1. **Open the Web App**: Go to [tune-fetch-tan.vercel.app](https://tune-fetch-tan.vercel.app).
2. **Connect Spotify**: Click **Connect Spotify** to browse your public, private, and collaborative playlists.
3. **Generate Code**: Click **"Download on My PC"** on any playlist to get your unique session code (e.g. `TF-4847`).
4. **Run in Terminal**: Open your terminal (PowerShell, Command Prompt, or Terminal) and run:
   ```bash
   tunefetch TF-4847
   ```
5. **Enjoy Your Music**: Watch the real-time download progress bar and transfer speed. All tracks are automatically saved and organized!

---

## 📁 Where Are Downloaded Songs Saved?

All songs are downloaded directly to your official Downloads folder:

```
Downloads/
└── Thanks for downloading/
    └── <Playlist_Name>/
        ├── 01 - Artist - Song Title.mp3
        ├── 02 - Artist - Another Song.mp3
        └── ...
```

- 💎 **320 kbps CBR MP3** maximum audio quality.
- 🖼️ **Embedded Album Artwork** on every single track.
- 🏷️ **Proper ID3 Metadata** (Artist, Title, Album, Track Number).
- 📂 **Zero ZIP files**: No extracting needed — ready to play immediately in VLC, Apple Music, Windows Media Player, or car stereo.

---

## 💡 CLI Usage & Options

You can run `tunefetch` from any directory:

| Command | Description |
| :--- | :--- |
| `tunefetch TF-XXXX` | Download tracks for a specific session code |
| `tunefetch` | Interactive prompt — paste your code when prompted |
| `tunefetch --help` | Show usage options and current download folder |
| `python download.py TF-XXXX` | Direct script execution fallback |

### Live Terminal Downloader Preview
```
$ tunefetch TF-8429

============================================================
             TuneFetch CLI Engine v1.3.0
   Spotify Playlist & High-Fidelity Audio Downloader
============================================================

[+] Contacting Neon Cloud Session API for code: TF-8429...
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
- ⚡ **1-Command Setup**: `python install_cli.py` handles everything in seconds.
- 📊 **Real-Time Visual Download Reporting**:
  - Live progress bar: `[████████░░] 78%`
  - Real-time download speed (`MB/s`) and dynamic ETA.
  - Per-track completion stamps (`[COMPLETED ✓]`).
- 🐘 **Global Neon PostgreSQL Song Cache**: Songs are indexed and cached in PostgreSQL for instant `< 5ms` candidate stream resolution.
- 📜 **Large Playlist Pagination Engine**: Handles playlists containing **10, 100, 500, or 1,400+ tracks** without freezing or dropping songs.
- 🛠️ **Embedded Audio Conversion**: Uses `imageio-ffmpeg` to ensure zero-configuration MP3 conversion without manual FFmpeg setup.
- 🛡️ **Zero Tracking & No Adware**: 100% transparent, open-source Python engine.

---

## ❓ Troubleshooting & FAQs

### ❌ `tunefetch: command not found`
- **Cause**: Your terminal environment variables haven't refreshed after setup.
- **Solution**:
  1. Open a **new** Command Prompt or PowerShell window and try again.
  2. Or run the fallback command from the project directory:
     ```bash
     python download.py TF-XXXX
     ```
  3. Re-run `python install_cli.py` if needed.

### ❌ `Python was not found` or `python: command not found`
- **Solution**: Install Python 3.10+ from [python.org](https://www.python.org/downloads/). During installation on Windows, make sure to check the box: **"Add python.exe to PATH"**.

### ❌ `Session code was not found or has expired`
- **Solution**: Session codes are temporary. Simply click **"Download on My PC"** on the website to generate a fresh session code.

### ❌ Does this work on macOS and Linux?
- **Solution**: Yes! Run `python install_cli.py`. On Unix systems, it automatically links `tunefetch` into `~/.local/bin/tunefetch`.

---

## 🛠️ Developer & Self-Hosting Guide

If you want to run the full stack locally (FastAPI backend + React frontend):

### 1. Prerequisites
- **Python**: 3.10+
- **Node.js**: 18.0.0+ & `npm`
- **Git**

### 2. Spotify Developer Setup
1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Create an App and set the **Redirect URI** to:
   ```
   http://127.0.0.1:8000/spotify/callback
   ```
3. Copy your **Client ID** and **Client Secret**.

### 3. Backend Setup
Create `backend/.env`:
```ini
# Neon PostgreSQL Connection
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

Start the backend:
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate      # Windows (or source venv/bin/activate on Mac/Linux)
pip install -r requirements.txt
python run.py
```
Backend runs at `http://127.0.0.1:8000` (interactive API docs at `/docs`).

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📂 Project Structure

```
TuneFetch/
├── download.py                           # Global CLI downloader entrypoint
├── install_cli.py                        # 1-Command installer & PATH setup script
├── setup.py                              # Alias for install_cli.py
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py                 # Global settings & DB connection
│   │   │   ├── database.py               # SQLAlchemy database session
│   │   │   └── rate_limiter.py           # In-memory sliding-window rate limiter
│   │   ├── models/
│   │   │   ├── db_models.py              # Database models (ResolvedSong, etc.)
│   │   │   └── schemas.py                # Pydantic schemas
│   │   ├── routes/
│   │   │   ├── health.py                 # Health check endpoint
│   │   │   ├── media.py                  # Audio streaming & status routes
│   │   │   └── spotify.py                # Spotify PKCE auth, playlists & sessions
│   │   ├── services/
│   │   │   ├── downloader.py             # yt-dlp downloader engine
│   │   │   ├── local_batch_downloader.py # Batch downloader with progress reporting
│   │   │   ├── spotify_service.py        # PKCE OAuth & 1,400+ track pagination
│   │   │   └── serper_service.py         # Serper search & PostgreSQL cache
│   │   ├── utils/
│   │   │   ├── auth_helper.py            # Fernet token encryption
│   │   │   └── ffmpeg_helper.py          # Embedded FFmpeg binary locator
│   │   ├── main.py                       # FastAPI application entrypoint
│   │   └── __init__.py
│   ├── launcher.py                       # Core terminal CLI engine
│   ├── requirements.txt                  # Python dependencies
│   └── run.py                            # Backend server launcher
│
├── frontend/
│   ├── src/
│   │   ├── components/                   # Modular React UI components
│   │   │   ├── landing/                  # Landing page sections
│   │   │   ├── Spotify/                  # Spotify connect & playlist modal
│   │   │   └── terminal/                 # Terminal downloader UI replica
│   │   ├── pages/                        # Dashboard & Landing pages
│   │   └── services/api.js               # Frontend API client
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🧪 Automated Testing

Run the test suite:
```bash
pytest backend/tests/test_spotify_pipeline.py backend/tests/test_rate_limiter.py -v
```

---

## 📄 License

Distributed under the **MIT License**. Free for personal and educational use.

<p align="center">
  <strong>Made with ❤️ • High-Fidelity Music Extraction Made Effortless</strong>
</p>
