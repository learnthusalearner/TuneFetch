"""
TuneFetch Standalone Desktop Launcher.
Embeds the FastAPI backend and pre-compiled React frontend into a unified local server,
supports Terminal CLI download mode via command line arguments (e.g. TuneFetch.exe TF-4982),
and enables unlimited high-speed downloads directly to Downloads/Thanks for downloading.
"""
import os
import sys
import time
import socket
import logging
import threading
import webbrowser
from pathlib import Path

# Ensure backend root is in sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Default environment for desktop mode
PORT = 8000
HOST = "127.0.0.1"
DEFAULT_URL = f"http://{HOST}:{PORT}"

# Setup local downloads folder in user's home Downloads
USER_DOWNLOADS = Path.home() / "Downloads" / "Thanks for downloading"
os.makedirs(USER_DOWNLOADS, exist_ok=True)
os.environ["DOWNLOADS_DIR"] = str(USER_DOWNLOADS)
os.environ["FRONTEND_URL"] = DEFAULT_URL
os.environ["SPOTIFY_REDIRECT_URI"] = f"{DEFAULT_URL}/spotify/callback"

import uvicorn
from app.main import app

def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0

def open_browser_delayed(url: str, delay: float = 1.5):
    time.sleep(delay)
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"[!] Could not open browser automatically: {e}")
        print(f"[+] Please open: {url}")

def run_cli_mode(code: str):
    import urllib.request
    import json
    import warnings

    # Suppress all internal logs and warnings so user sees only clean progress
    warnings.filterwarnings("ignore")
    logging.getLogger().setLevel(logging.ERROR)
    logging.getLogger("downloader").setLevel(logging.ERROR)
    logging.getLogger("local_batch_downloader").setLevel(logging.ERROR)

    clean_code = code.strip().upper()
    if not clean_code.startswith("TF-"):
        clean_code = f"TF-{clean_code}"

    print(f"\n======================================================================")
    print(f"               TuneFetch High-Fidelity Downloader v1.3                ")
    print(f"======================================================================\n")
    print(f"[*] Resolving playlist session '{clean_code}'...")

    session = None
    # 1. Try local in-memory session store first
    try:
        from app.services.cloud_session_store import CloudSessionStore
        session = CloudSessionStore.get_session(clean_code)
    except Exception:
        pass

    # 2. Try local HTTP endpoint & cloud HTTP endpoint
    if not session:
        endpoints = [
            f"http://127.0.0.1:8000/api/cloud-session/{clean_code}",
            f"https://tunefetch-t5mp.onrender.com/api/cloud-session/{clean_code}"
        ]
        for url_endpoint in endpoints:
            try:
                req = urllib.request.Request(url_endpoint, headers={"User-Agent": "TuneFetch-CLI"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    session = data.get("session")
                    if session and session.get("tracks"):
                        break
            except Exception:
                continue

    if not session or not session.get("tracks"):
        print(f"[!] Session code '{clean_code}' not found or has expired (valid for 24 hours).")
        print(f"    Please generate a fresh download session code on the website and try again.\n")
        sys.exit(1)

    playlist_name = session.get("playlist_name", "Spotify Playlist")
    tracks = session.get("tracks", [])
    if not tracks:
        print(f"[!] No tracks found for session code '{clean_code}'.")
        sys.exit(1)

    print(f"[+] Playlist:      {playlist_name} ({len(tracks)} tracks)")
    print(f"[+] Quality:       320 kbps Ultra HQ MP3")
    print(f"[+] Target Folder: {USER_DOWNLOADS}\\{playlist_name}\n")

    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

    from app.services.local_batch_downloader import LocalBatchDownloader
    batch_id = LocalBatchDownloader.start_batch(playlist_name=playlist_name, tracks=tracks)

    last_processed_count = 0

    while True:
        status = LocalBatchDownloader.get_batch_status(batch_id)
        if not status:
            time.sleep(0.3)
            continue

        b_status = status.get("status")
        total = status.get("total_tracks", len(tracks))
        completed = status.get("completed_tracks", 0)
        failed = status.get("failed_tracks", 0)
        processed = completed + failed

        cur_title = status.get("current_track_title", "Preparing stream...")
        cur_prog = float(status.get("current_track_progress", 0.0) or 0.0)
        cur_speed = str(status.get("current_track_speed", "0 KB/s"))
        eta_sec = int(status.get("estimated_remaining_seconds", 0) or 0)
        elapsed_sec = int(status.get("elapsed_seconds", 0) or 0)
        tracks_prog = status.get("tracks_progress", [])

        # Print line for finished or skipped songs
        if processed > last_processed_count:
            for c_idx in range(last_processed_count, processed):
                if c_idx < len(tracks_prog):
                    t_info = tracks_prog[c_idx]
                    t_name = f"{t_info.get('artist')} - {t_info.get('title')}" if t_info.get('artist') else t_info.get('title')
                    t_st = t_info.get("status")
                    if t_st == "COMPLETED":
                        sys.stdout.write(f"\r\033[K[✓] [{c_idx+1}/{total}] Saved: {t_name}\n")
                    else:
                        sys.stdout.write(f"\r\033[K[!] [{c_idx+1}/{total}] Skipped ({t_st}): {t_name}\n")
                    sys.stdout.flush()
            last_processed_count = processed

        # Print terminal progress line
        bar_len = 25
        filled = int((cur_prog / 100.0) * bar_len)
        bar = "=" * filled + ">" + " " * max(0, bar_len - filled - 1)

        mm = int(elapsed_sec // 60)
        ss = int(elapsed_sec % 60)
        eta_m = int(eta_sec // 60)
        eta_s = int(eta_sec % 60)

        title_trunc = (cur_title[:32] + "..") if len(cur_title) > 34 else cur_title
        if b_status == "DOWNLOADING":
            cur_idx = min(total, processed + 1)
            sys.stdout.write(f"\r\033[K[+] [{cur_idx}/{total}] {title_trunc:<34} [{bar}] {int(cur_prog):>3}% | {cur_speed:>9} | ETA: {eta_m:02d}:{eta_s:02d}")
            sys.stdout.flush()

        if b_status == "COMPLETED":
            sys.stdout.write("\r\033[K")
            print(f"\n======================================================================")
            print(f"  [✓] Processed {total} tracks ({completed} saved, {failed} skipped) into:")
            print(f"      {USER_DOWNLOADS}\\{playlist_name}")
            print(f"  [TIME] Total Time: {mm:02d}:{ss:02d}")
            print(f"======================================================================\n")
            break

        time.sleep(0.35)

def main():
    # If user passed session code via CLI argument: e.g. TuneFetch.exe TF-4982
    if len(sys.argv) > 1 and not sys.argv[1].startswith("-"):
        arg_val = sys.argv[1].strip()
        if arg_val.upper().startswith("TF-") or len(arg_val) in (4, 7):
            run_cli_mode(arg_val)
            return

    target_port = PORT
    if is_port_in_use(target_port):
        for p in range(8001, 8050):
            if not is_port_in_use(p):
                target_port = p
                break

    app_url = f"http://{HOST}:{target_port}"
    os.environ["FRONTEND_URL"] = app_url
    os.environ["SPOTIFY_REDIRECT_URI"] = f"{app_url}/spotify/callback"

    banner = f"""
======================================================================
                 TuneFetch Desktop Engine v1.3.0                     
         Spotify Playlist & High-Fidelity Audio Downloader            
======================================================================

  [+] Local Engine running at: {app_url}
  [+] Songs will save to:      {USER_DOWNLOADS}
  [+] Opening browser automatically...

  Tip: You can also run terminal mode directly:
       TuneFetch.exe TF-XXXX
======================================================================
"""
    print(banner, flush=True)

    # Launch browser in a background thread
    threading.Thread(target=open_browser_delayed, args=(app_url,), daemon=True).start()

    try:
        uvicorn.run(app, host=HOST, port=target_port, log_level="warning", log_config=None)
    except KeyboardInterrupt:
        print("\n[*] Shutting down TuneFetch Engine cleanly. Goodbye!")
        sys.exit(0)

if __name__ == "__main__":
    main()
