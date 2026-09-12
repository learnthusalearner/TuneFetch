"""
TuneFetch Terminal Downloader Engine
Lightweight CLI application for downloading Spotify playlists in 320 kbps MP3.

Usage:
    tunefetch TF-XXXX
    tunefetch (interactive prompt)
    tunefetch --help
"""

import os
import sys
import time
import json
import logging
import warnings
import urllib.request
from pathlib import Path

# ============================================================
# CONFIGURATION & PATH SETUP
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

APP_NAME = "TuneFetch"
APP_VERSION = "1.3.0"

# Cloud session backend
CLOUD_API_URL = os.environ.get(
    "TUNEFETCH_CLOUD_API_URL",
    "https://tunefetch-t5mp.onrender.com"
).rstrip("/")

# Downloads destination directory
USER_DOWNLOADS = Path.home() / "Downloads" / "Thanks for downloading"
USER_DOWNLOADS.mkdir(parents=True, exist_ok=True)
os.environ["DOWNLOADS_DIR"] = str(USER_DOWNLOADS)


# ============================================================
# TERMINAL DISPLAY UTILITIES
# ============================================================

def print_banner():
    print()
    print("=" * 60)
    print(f"           {APP_NAME} Desktop Engine v{APP_VERSION}")
    print("   Spotify Playlist & High-Fidelity Audio Downloader")
    print("=" * 60)
    print()


def print_help():
    print_banner()
    print("Usage:")
    print("  tunefetch <session-code>     Download tracks for a specific session code")
    print("  tunefetch                    Interactive terminal session prompt")
    print("  tunefetch --help             Show this help information")
    print()
    print("Examples:")
    print("  tunefetch TF-8429")
    print("  tunefetch 8429")
    print()
    print(f"[+] Download Location: {USER_DOWNLOADS}")
    print("=" * 70)
    print()


def format_progress_bar(progress_pct: float, width: int = 24) -> str:
    """Renders a smooth ASCII progress bar."""
    filled = int(width * (max(0.0, min(100.0, progress_pct)) / 100.0))
    return "█" * filled + "░" * (width - filled)


# ============================================================
# SESSION RESOLUTION
# ============================================================

def fetch_session_from_cloud(clean_code: str) -> dict:
    """Fetch session JSON from cloud Neon PostgreSQL API."""
    endpoint = f"{CLOUD_API_URL}/api/cloud-session/{clean_code}"
    try:
        req = urllib.request.Request(
            endpoint,
            headers={"User-Agent": f"TuneFetch-CLI/{APP_VERSION}"}
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("session") or {}
    except Exception as err:
        return {}


# ============================================================
# CLI DOWNLOAD RUNNER
# ============================================================

def run_cli_mode(code: str):
    """Executes the high-speed local batch downloader for a given session code."""
    warnings.filterwarnings("ignore")
    logging.getLogger().setLevel(logging.ERROR)
    logging.getLogger("downloader").setLevel(logging.ERROR)
    logging.getLogger("local_batch_downloader").setLevel(logging.ERROR)

    clean_code = code.strip().upper()
    if not clean_code.startswith("TF-"):
        clean_code = f"TF-{clean_code}"

    print_banner()
    print(f"[+] Contacting Neon Cloud Session API for code: {clean_code}...")

    session = None

    # 1. Check local session store (if running in backend context)
    try:
        from app.services.cloud_session_store import CloudSessionStore
        session = CloudSessionStore.get_session(clean_code)
    except Exception:
        session = None

    # 2. Fetch from cloud API
    if not session or not session.get("tracks"):
        session = fetch_session_from_cloud(clean_code)

    if not session or not session.get("tracks"):
        print(f"[!] Session code '{clean_code}' was not found or has expired.")
        print("[!] Please generate a new download session on the TuneFetch website:")
        print("    https://tune-fetch-tan.vercel.app")
        print()
        sys.exit(1)

    playlist_name = session.get("playlist_name", "Spotify Playlist")
    tracks = session.get("tracks", [])

    playlist_folder = USER_DOWNLOADS / playlist_name
    print(f"[✓] Session Verified: \"{playlist_name}\" ({len(tracks)} Tracks Verified)")
    print(f"[+] Destination Folder: {playlist_folder}")
    print()

    # Enable UTF-8 on Windows terminal if supported
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    # Launch local batch download worker
    from app.services.local_batch_downloader import LocalBatchDownloader

    batch_id = LocalBatchDownloader.start_batch(
        playlist_name=playlist_name,
        tracks=tracks
    )

    seen_completed_indices = set()
    start_time = time.time()

    while True:
        status = LocalBatchDownloader.get_batch_status(batch_id)
        if not status:
            time.sleep(0.2)
            continue

        b_status = status.get("status", "PENDING")
        total = status.get("total_tracks", len(tracks))
        completed = status.get("completed_tracks", status.get("successful_tracks", 0))
        failed = status.get("failed_tracks", 0)
        processed = completed + failed

        if status.get("target_folder"):
            playlist_folder = Path(status["target_folder"])

        current_title = status.get("current_track_title", "Downloading...")
        current_speed = status.get("current_track_speed", status.get("current_speed", "0 KB/s"))
        current_progress = float(status.get("current_track_progress", 0))

        elapsed = time.time() - start_time
        eta_seconds = 0
        if processed > 0:
            avg_per_track = elapsed / processed
            eta_seconds = max(0, int(avg_per_track * (total - processed)))

        eta_m, eta_s = divmod(eta_seconds, 60)
        elapsed_m, elapsed_s = divmod(int(elapsed), 60)

        # Print per-track permanent completion lines as each song completes
        track_list = status.get("tracks_progress") or status.get("tracks") or []
        for i, t in enumerate(track_list):
            t_status = t.get("status")
            if i not in seen_completed_indices and t_status in ("COMPLETED", "ERROR", "TIMEOUT"):
                seen_completed_indices.add(i)
                sys.stdout.write("\r\033[K")
                t_title = t.get("title", f"Track {i+1}")
                t_artist = t.get("artist", "")
                full_t = f"{t_artist} - {t_title}" if t_artist else t_title
                full_t_clean = (full_t[:46] + "..") if len(full_t) > 48 else full_t
                if t_status == "COMPLETED":
                    print(f"[+] [{i+1}/{total}] {full_t_clean:<48} [COMPLETED ✓]")
                    print(f"    ↳ 320 kbps CBR MP3 · Album Art Embedded · Saved")
                else:
                    print(f"[-] [{i+1}/{total}] {full_t_clean:<48} [SKIPPED]")
                sys.stdout.flush()

        # Active progress bar for currently downloading song
        if b_status == "DOWNLOADING":
            curr_idx = min(total, processed + 1)
            bar = format_progress_bar(current_progress, width=34)
            short_title = (current_title[:28] + "..") if len(current_title) > 30 else current_title

            sys.stdout.write(
                f"\r\033[K[+] [{curr_idx}/{total}] {short_title:<30} {int(current_progress):>3}% | {current_speed:>8} | ETA: {eta_m:02d}:{eta_s:02d}\n[{bar}] {int(current_progress):>3}%\033[F"
            )
            sys.stdout.flush()

        # Completed
        if b_status == "COMPLETED":
            # Print any final tracks that finished in last tick
            for i, t in enumerate(track_list):
                t_status = t.get("status")
                if i not in seen_completed_indices and t_status in ("COMPLETED", "ERROR", "TIMEOUT"):
                    seen_completed_indices.add(i)
                    sys.stdout.write("\r\033[K")
                    t_title = t.get("title", f"Track {i+1}")
                    t_artist = t.get("artist", "")
                    full_t = f"{t_artist} - {t_title}" if t_artist else t_title
                    full_t_clean = (full_t[:46] + "..") if len(full_t) > 48 else full_t
                    if t_status == "COMPLETED":
                        print(f"[+] [{i+1}/{total}] {full_t_clean:<48} [COMPLETED ✓]")
                        print(f"    ↳ 320 kbps CBR MP3 · Album Art Embedded · Saved")
                    else:
                        print(f"[-] [{i+1}/{total}] {full_t_clean:<48} [SKIPPED]")

            sys.stdout.write("\r\033[K\n")
            print()
            print(f"[✓] {completed} of {total} tracks converted successfully at 320 kbps!")
            print(f"Total Time: {elapsed_m:02d}:{elapsed_s:02d} · Destination: {playlist_folder}")
            print()
            break

        time.sleep(0.2)


# ============================================================
# MAIN ENTRYPOINT
# ============================================================

def main():
    if len(sys.argv) > 1:
        arg = sys.argv[1].strip()
        if arg in ("-h", "--help", "help", "/?"):
            print_help()
            return
        if not arg.startswith("-"):
            run_cli_mode(arg)
            return

    # Interactive prompt if executed without arguments
    print_banner()
    print(f"[+] Downloads will be saved to: {USER_DOWNLOADS}")
    print()

    try:
        code = input("Enter session code from website (e.g. TF-XXXX): ").strip()
        if code:
            run_cli_mode(code)
        else:
            print("[!] No session code entered. Exiting.")
    except (KeyboardInterrupt, EOFError):
        print("\nExiting.")


if __name__ == "__main__":
    main()