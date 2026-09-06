# 🎨 TuneFetch - Frontend Client

Modern, responsive React + Tailwind CSS client for **TuneFetch**, designed for effortless Spotify authentication, playlist exploration, batch downloading, and native direct PC folder saving.

---

## ⚡ Features

- **Spotify OAuth 2.0 Integration**: Seamless PKCE authentication flow with automatic session sync and connected account profile display.
- **Playlist Explorer**: Grid view of all user-owned and followed playlists with pagination and cover art.
- **Track Inspector**: Detailed preview of playlist tracks, including duration, artists, album information, and cover art.
- **Real-Time Batch Progress**: Live tracking of playlist downloads with real-time percentage indicators, per-track status badges, and failure recovery.
- **Native Direct PC Folder Delivery**: Uses the browser's native File System Access API (`window.showDirectoryPicker()`) to automatically unpack downloaded MP3s into a user-selected folder named `Thanks_for_downloading`, naming each file `{Artist} - {Song Title}.mp3`.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Compression & In-Memory Extraction**: [JSZip](https://stuk.github.io/jszip/)
- **Native Disk I/O**: HTML5 File System Access API (`window.showDirectoryPicker`)

---

## 📁 Key Components

| Component / Utility | Description |
| :--- | :--- |
| `src/App.jsx` | Main application view managing Spotify auth state, playlist selection, active download jobs, and history drawer. |
| `src/components/SpotifyLoginCard.jsx` | Authentication card displaying Spotify connection status, user profile, and disconnect action. |
| `src/components/SpotifyPlaylistSelector.jsx` | Responsive playlist grid showing thumbnails, track counts, and owner names. |
| `src/components/SpotifyTrackList.jsx` | Detailed track table with metadata badges, duration formatting, and batch download initiation. |
| `src/components/BatchProgressCard.jsx` | Real-time progress tracker with animated progress bars, live track status, and the direct folder download button. |
| `src/components/HistoryDrawer.jsx` | Side drawer allowing users to review past download jobs. |
| `src/utils/folderSaver.js` | Direct PC folder delivery engine using File System Access API and JSZip. |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

> **Note**: Vite's dev server includes a built-in reverse proxy (configured in `vite.config.js`) that forwards `/api` and `/spotify` requests to the FastAPI backend running at `http://127.0.0.1:8000`.

### 3. Build for Production
```bash
npm run build
```
The optimized production bundle will be generated in `dist/`.

### 4. Preview Production Build
```bash
npm run preview
```
