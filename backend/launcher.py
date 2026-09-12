"""
TuneFetch Standalone Desktop Launcher.
Embeds the FastAPI backend and pre-compiled React frontend into a unified local server,
automatically launches your default browser, and enables unlimited high-speed downloads.
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

def main():
    target_port = PORT
    if is_port_in_use(target_port):
        # Find next available port if 8000 is occupied
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

  Enjoy your music! Keep this window running while downloading.
  (Press Ctrl+C anytime to close)
======================================================================
"""
    print(banner, flush=True)

    # Launch browser in a background thread
    threading.Thread(target=open_browser_delayed, args=(app_url,), daemon=True).start()

    # Run Uvicorn server (blocks until interrupted)
    # log_config=None prevents crash in PyInstaller --windowed mode where sys.stdout is None
    try:
        uvicorn.run(app, host=HOST, port=target_port, log_level="warning", log_config=None)
    except KeyboardInterrupt:
        print("\n[*] Shutting down TuneFetch Engine cleanly. Goodbye!")
        sys.exit(0)

if __name__ == "__main__":
    main()
