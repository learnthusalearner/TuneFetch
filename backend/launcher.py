"""
TuneFetch Standalone Desktop Launcher

Runs the embedded FastAPI backend and React frontend locally.

Supports:
    TuneFetch.exe
    TuneFetch.exe TF-4982

The desktop engine:
- Runs the TuneFetch backend locally
- Opens the web interface automatically
- Supports terminal session-code downloads
- Saves downloaded files to the user's Downloads folder
"""

import os
import sys
import time
import socket
import logging
import threading
import webbrowser
from pathlib import Path


# ============================================================
# PATH / APPLICATION CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))


APP_NAME = "TuneFetch"
APP_VERSION = "1.3.0"

HOST = "127.0.0.1"
DEFAULT_PORT = 8000

# Cloud backend used when a session is not available locally.
CLOUD_API_URL = os.environ.get(
    "TUNEFETCH_CLOUD_API_URL",
    "https://tunefetch-t5mp.onrender.com"
).rstrip("/")


# ============================================================
# DOWNLOAD DIRECTORY
# ============================================================

USER_DOWNLOADS = (
    Path.home()
    / "Downloads"
    / "Thanks for downloading"
)

USER_DOWNLOADS.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# ENVIRONMENT
# ============================================================

os.environ["DOWNLOADS_DIR"] = str(USER_DOWNLOADS)




# ============================================================
# CLI MODE
# ============================================================

def run_cli_mode(code: str):
    """
    Process a TuneFetch cloud session directly from the terminal.

    Example:
        TuneFetch.exe TF-4982
    """

    import json
    import urllib.request
    import warnings

    # Keep terminal output clean.
    warnings.filterwarnings("ignore")

    logging.getLogger().setLevel(
        logging.ERROR
    )

    logging.getLogger(
        "downloader"
    ).setLevel(logging.ERROR)

    logging.getLogger(
        "local_batch_downloader"
    ).setLevel(logging.ERROR)

    # --------------------------------------------------------
    # Normalize session code
    # --------------------------------------------------------

    clean_code = code.strip().upper()

    if not clean_code.startswith("TF-"):
        clean_code = f"TF-{clean_code}"

    print()
    print("=" * 70)
    print(
        f"                 {APP_NAME} Desktop Engine v{APP_VERSION}"
    )
    print("=" * 70)
    print()

    print(
        f"[*] Resolving playlist session '{clean_code}'..."
    )

    session = None

    # --------------------------------------------------------
    # 1. Try local session store
    # --------------------------------------------------------

    try:

        from app.services.cloud_session_store import (
            CloudSessionStore
        )

        session = CloudSessionStore.get_session(
            clean_code
        )

    except Exception:
        session = None

    # --------------------------------------------------------
    # 2. Try local / cloud HTTP endpoints
    # --------------------------------------------------------

    if not session:

        endpoints = [
            (
                f"http://127.0.0.1:8000"
                f"/api/cloud-session/{clean_code}"
            ),
            (
                f"{CLOUD_API_URL}"
                f"/api/cloud-session/{clean_code}"
            )
        ]

        for endpoint in endpoints:

            try:

                request = urllib.request.Request(
                    endpoint,
                    headers={
                        "User-Agent": "TuneFetch-CLI"
                    }
                )

                with urllib.request.urlopen(
                    request,
                    timeout=10
                ) as response:

                    data = json.loads(
                        response.read().decode("utf-8")
                    )

                    candidate_session = data.get(
                        "session"
                    )

                    if (
                        candidate_session
                        and candidate_session.get("tracks")
                    ):

                        session = candidate_session
                        break

            except Exception:
                continue

    # --------------------------------------------------------
    # Session validation
    # --------------------------------------------------------

    if (
        not session
        or not session.get("tracks")
    ):

        print(
            f"[!] Session code '{clean_code}' "
            f"was not found or has expired."
        )

        print(
            "[!] Please generate a new download "
            "session on the TuneFetch website."
        )

        print()

        sys.exit(1)

    playlist_name = session.get(
        "playlist_name",
        "Spotify Playlist"
    )

    tracks = session.get(
        "tracks",
        []
    )

    if not tracks:

        print(
            f"[!] No tracks were found for "
            f"session '{clean_code}'."
        )

        sys.exit(1)

    # --------------------------------------------------------
    # Display session information
    # --------------------------------------------------------

    playlist_folder = (
        USER_DOWNLOADS
        / playlist_name
    )

    print(
        f"[+] Playlist:      "
        f"{playlist_name} ({len(tracks)} tracks)"
    )

    print(
        "[+] Output:        MP3"
    )

    print(
        f"[+] Target Folder: {playlist_folder}"
    )

    print()

    # --------------------------------------------------------
    # UTF-8 terminal support
    # --------------------------------------------------------

    if hasattr(
        sys.stdout,
        "reconfigure"
    ):

        try:

            sys.stdout.reconfigure(
                encoding="utf-8",
                errors="replace"
            )

        except Exception:
            pass

    # --------------------------------------------------------
    # Start local batch downloader
    # --------------------------------------------------------

    from app.services.local_batch_downloader import (
        LocalBatchDownloader
    )

    batch_id = (
        LocalBatchDownloader.start_batch(
            playlist_name=playlist_name,
            tracks=tracks
        )
    )

    last_processed_count = 0

    # ========================================================
    # DOWNLOAD MONITOR
    # ========================================================

    while True:

        status = (
            LocalBatchDownloader.get_batch_status(
                batch_id
            )
        )

        if not status:

            time.sleep(0.3)
            continue

        batch_status = status.get(
            "status"
        )

        total = status.get(
            "total_tracks",
            len(tracks)
        )

        completed = status.get(
            "completed_tracks",
            0
        )

        failed = status.get(
            "failed_tracks",
            0
        )

        processed = (
            completed + failed
        )

        current_title = status.get(
            "current_track_title",
            "Preparing stream..."
        )

        current_progress = float(
            status.get(
                "current_track_progress",
                0.0
            ) or 0.0
        )

        current_speed = str(
            status.get(
                "current_track_speed",
                "0 KB/s"
            )
        )

        eta_seconds = int(
            status.get(
                "estimated_remaining_seconds",
                0
            ) or 0
        )

        elapsed_seconds = int(
            status.get(
                "elapsed_seconds",
                0
            ) or 0
        )

        tracks_progress = status.get(
            "tracks_progress",
            []
        )

        # ----------------------------------------------------
        # Finished track messages
        # ----------------------------------------------------

        if processed > last_processed_count:

            for index in range(
                last_processed_count,
                processed
            ):

                if index >= len(
                    tracks_progress
                ):
                    continue

                track_info = (
                    tracks_progress[index]
                )

                artist = track_info.get(
                    "artist"
                )

                title = track_info.get(
                    "title",
                    "Unknown track"
                )

                track_name = (
                    f"{artist} - {title}"
                    if artist
                    else title
                )

                track_status = (
                    track_info.get(
                        "status"
                    )
                )

                if track_status == "COMPLETED":

                    sys.stdout.write(
                        f"\r\033[K"
                        f"[✓] [{index + 1}/{total}] "
                        f"Saved: {track_name}\n"
                    )

                else:

                    sys.stdout.write(
                        f"\r\033[K"
                        f"[!] [{index + 1}/{total}] "
                        f"Skipped: {track_name}\n"
                    )

                sys.stdout.flush()

            last_processed_count = processed

        # ----------------------------------------------------
        # Progress bar
        # ----------------------------------------------------

        bar_length = 25

        safe_progress = max(
            0.0,
            min(
                current_progress,
                100.0
            )
        )

        filled = int(
            (safe_progress / 100.0)
            * bar_length
        )

        bar = (
            "=" * filled
            + ">"
            + " " * max(
                0,
                bar_length - filled - 1
            )
        )

        elapsed_minutes = int(
            elapsed_seconds // 60
        )

        elapsed_remaining_seconds = int(
            elapsed_seconds % 60
        )

        eta_minutes = int(
            eta_seconds // 60
        )

        eta_remaining_seconds = int(
            eta_seconds % 60
        )

        # ----------------------------------------------------
        # Track title formatting
        # ----------------------------------------------------

        title_text = str(
            current_title
        )

        if len(title_text) > 34:

            title_text = (
                title_text[:32]
                + ".."
            )

        # ----------------------------------------------------
        # Active download
        # ----------------------------------------------------

        if batch_status == "DOWNLOADING":

            current_index = min(
                total,
                processed + 1
            )

            sys.stdout.write(
                "\r\033[K"
                f"[+] [{current_index}/{total}] "
                f"{title_text:<34} "
                f"[{bar}] "
                f"{int(safe_progress):>3}% | "
                f"{current_speed:>9} | "
                f"ETA: "
                f"{eta_minutes:02d}:"
                f"{eta_remaining_seconds:02d}"
            )

            sys.stdout.flush()

        # ----------------------------------------------------
        # Completed
        # ----------------------------------------------------

        if batch_status == "COMPLETED":

            sys.stdout.write(
                "\r\033[K"
            )

            print()
            print("=" * 70)

            print(
                f"[✓] Processed {total} tracks"
            )

            print(
                f"    Saved: {completed}"
            )

            print(
                f"    Skipped: {failed}"
            )

            print()

            print(
                f"[+] Files saved to:"
            )

            print(
                f"    {playlist_folder}"
            )

            print()

            print(
                f"[TIME] Total Time: "
                f"{elapsed_minutes:02d}:"
                f"{elapsed_remaining_seconds:02d}"
            )

            print("=" * 70)
            print()

            break

        time.sleep(0.35)


# ============================================================
# CLI HELP & INTERACTIVE MODE
# ============================================================

def print_help():
    print()
    print("=" * 70)
    print(
        f"                 {APP_NAME} Terminal Downloader v{APP_VERSION}"
    )
    print(
        "         Spotify Playlist & High-Fidelity 320 kbps Audio"
    )
    print("=" * 70)
    print()
    print("Usage:")
    print("  tunefetch <session-code>     Download tracks for a session code")
    print("  tunefetch                    Interactive terminal session prompt")
    print("  tunefetch --help             Show this help screen")
    print()
    print("Examples:")
    print("  tunefetch TF-8429")
    print("  tunefetch 8429")
    print()
    print(f"Downloads are saved to: {USER_DOWNLOADS}")
    print("=" * 70)
    print()


# ============================================================
# MAIN
# ============================================================

def main():
    # --------------------------------------------------------
    # Arguments check
    # --------------------------------------------------------
    if len(sys.argv) > 1:
        argument = sys.argv[1].strip()

        if argument in ("-h", "--help", "help", "/?"):
            print_help()
            return

        if not argument.startswith("-"):
            run_cli_mode(argument)
            return

    # --------------------------------------------------------
    # Interactive mode if run without arguments
    # --------------------------------------------------------
    print()
    print("=" * 70)
    print(
        f"                 {APP_NAME} Terminal Downloader v{APP_VERSION}"
    )
    print(
        "         Spotify Playlist & High-Fidelity 320 kbps Audio"
    )
    print("=" * 70)
    print()
    print(
        f"[+] Destination: {USER_DOWNLOADS}"
    )
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