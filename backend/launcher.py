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
    clean_code = code.strip().upper()
    if not clean_code.startswith("TF-"):
        clean_code = f"TF-{clean_code}"

    print(f"\n======================================================================")
    print(f"                  TuneFetch Terminal Downloader                       ")
    print(f"======================================================================\n")
    print(f"[*] Fetching playlist session '{clean_code}' from cloud server...")

    cloud_url = f"https://tunefetch-t5mp.onrender.com/api/cloud-session/{clean_code}"
    try:
        req = urllib.request.Request(cloud_url, headers={"User-Agent": "TuneFetch-CLI"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            session = data.get("session", {})
    except Exception as e:
        print(f"[!] Could not fetch session code '{clean_code}': {e}")
        sys.exit(1)

    playlist_name = session.get("playlist_name", "Spotify Playlist")
    tracks = session.get("tracks", [])
    if not tracks:
        print(f"[!] No tracks found for session code '{clean_code}'.")
        sys.exit(1)

    print(f"[+] Playlist:      {playlist_name} ({len(tracks)} tracks)")
    print(f"[+] Target Folder: {USER_DOWNLOADS}\n")

    from app.services.local_batch_downloader import LocalBatchDownloader
    batch_id = LocalBatchDownloader.start_batch(playlist_name=playlist_name, tracks=tracks)

    while True:
        status = LocalBatchDownloader.get_batch_status(batch_id)
        if not status:
            time.sleep(0.4)
            continue

        b_status = status.get("status")
        total = status.get("total_tracks", len(tracks))
        completed = status.get("completed_tracks", 0)
        cur_title = status.get("current_track_title", "Downloading...")
        cur_prog = float(status.get("current_track_progress", 0.0) or 0.0)
        cur_speed = str(status.get("current_track_speed", "0 KB/s"))
        eta_sec = int(status.get("estimated_remaining_seconds", 0) or 0)
        elapsed_sec = int(status.get("elapsed_seconds", 0) or 0)

        # Print terminal progress line
        bar_len = 25
        filled = int((cur_prog / 100.0) * bar_len)
        bar = "=" * filled + ">" + " " * max(0, bar_len - filled - 1)

        mm = int(elapsed_sec // 60)
        ss = int(elapsed_sec % 60)
        eta_m = int(eta_sec // 60)
        eta_s = int(eta_sec % 60)

        title_trunc = (cur_title[:28] + "..") if len(cur_title) > 30 else cur_title
        sys.stdout.write(f"\r[{completed}/{total}] {title_trunc:<30} [{bar}] {int(cur_prog):>3}% | {cur_speed:>9} | ETA: {eta_m:02d}:{eta_s:02d}")
        sys.stdout.flush()

        if b_status == "COMPLETED":
            print(f"\n\n======================================================================")
            print(f"  ✓ All {completed} songs downloaded into:")
            print(f"    {USER_DOWNLOADS}\\{playlist_name}")
            print(f"  ⏱ Time taken: {mm:02d}:{ss:02d}")
            print(f"======================================================================\n")
            break

        time.sleep(0.4)

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
