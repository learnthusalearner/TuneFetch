"""
TuneFetch Terminal Downloader Engine
Lightweight, high-speed CLI application for downloading Spotify playlists in 320 kbps MP3.

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

# Automatically load environment variables from root or backend .env
try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR.parent / ".env")
    load_dotenv(BASE_DIR / ".env")
except ImportError:
    pass

APP_NAME = "TuneFetch"
APP_VERSION = "1.3.0"

# Backend API server URL - dynamically configured via .env
BACKEND_URL = os.environ.get(
    "BACKEND_URL",
    os.environ.get(
        "TUNEFETCH_BACKEND_URL",
        os.environ.get("TUNEFETCH_CLOUD_API_URL", "http://127.0.0.1:8000")
    )
).rstrip("/")

# Frontend web app URL - dynamically configured via .env
FRONTEND_URL = os.environ.get(
    "FRONTEND_URL",
    os.environ.get("TUNEFETCH_FRONTEND_URL", "http://localhost:5173")
).rstrip("/")

# Downloads destination directory
USER_DOWNLOADS = Path.home() / "Downloads" / "Thanks for downloading"
USER_DOWNLOADS.mkdir(parents=True, exist_ok=True)
os.environ["DOWNLOADS_DIR"] = str(USER_DOWNLOADS)

# ============================================================
# TERMINAL UTF-8 & ANSI COLOR INITIALIZATION
# ============================================================

def init_terminal():
    """Configures UTF-8 encoding and ANSI virtual terminal processing on Windows & Unix."""
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    if hasattr(sys.stderr, "reconfigure"):
        try:
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    if sys.platform == "win32":
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            hStdOut = kernel32.GetStdHandle(-11)
            mode = ctypes.c_ulong()
            if kernel32.GetConsoleMode(hStdOut, ctypes.byref(mode)):
                kernel32.SetConsoleMode(hStdOut, mode.value | 0x0004)
        except Exception:
            pass
        try:
            os.system('')
        except Exception:
            pass

init_terminal()

# ============================================================
# ANSI COLOR PALETTE (TrueColor with universal ANSI styling)
# ============================================================

class C:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    UNDERLINE = "\033[4m"

    # Spotify Vibrant Green Palette
    GREEN = "\033[38;2;29;185;84m"
    GREEN_BOLD = "\033[1;38;2;29;185;84m"
    GREEN_BRIGHT = "\033[1;38;2;30;215;96m"

    # Accent & Interface Colors
    CYAN = "\033[38;2;56;189;248m"
    CYAN_BOLD = "\033[1;38;2;56;189;248m"
    YELLOW = "\033[38;2;250;204;21m"
    YELLOW_BOLD = "\033[1;38;2;250;204;21m"
    PURPLE = "\033[38;2;192;132;252m"
    PURPLE_BOLD = "\033[1;38;2;192;132;252m"
    RED = "\033[38;2;248;113;113m"
    RED_BOLD = "\033[1;38;2;248;113;113m"
    WHITE = "\033[1;97m"
    GRAY = "\033[38;2;148;163;184m"
    DARK_GRAY = "\033[38;2;71;85;105m"
    MUTED = "\033[38;2;100;116;139m"


# ============================================================
# TERMINAL DISPLAY UTILITIES
# ============================================================

def print_banner():
    print()
    print(f" {C.GREEN}╭────────────────────────────────────────────────────────────╮{C.RESET}")
    print(f" {C.GREEN}│{C.RESET}  {C.GREEN_BRIGHT}♫{C.RESET} {C.WHITE}{APP_NAME} CLI Engine v{APP_VERSION}{C.RESET}                             {C.GREEN}│{C.RESET}")
    print(f" {C.GREEN}│{C.RESET}  {C.GRAY}High-Fidelity Spotify Playlist & 320 kbps MP3 Downloader{C.RESET}   {C.GREEN}│{C.RESET}")
    print(f" {C.GREEN}╰────────────────────────────────────────────────────────────╯{C.RESET}")
    print()


def print_help():
    print_banner()
    print(f" {C.WHITE}Usage:{C.RESET}")
    print(f"   {C.GREEN_BOLD}tunefetch{C.RESET} {C.CYAN}<session-code>{C.RESET}     Download tracks for a specific session code")
    print(f"   {C.GREEN_BOLD}tunefetch{C.RESET}                  Interactive terminal session prompt")
    print(f"   {C.GREEN_BOLD}tunefetch{C.RESET} {C.GRAY}--help{C.RESET}             Show this help information")
    print()
    print(f" {C.WHITE}Configuration:{C.RESET}")
    print(f"   {C.CYAN}[•]{C.RESET} {C.WHITE}Backend API:{C.RESET}      {C.GREEN}{BACKEND_URL}{C.RESET}")
    print(f"   {C.CYAN}[•]{C.RESET} {C.WHITE}Web App URL:{C.RESET}      {C.CYAN}{FRONTEND_URL}{C.RESET}")
    print(f"   {C.CYAN}[→]{C.RESET} {C.WHITE}Download Folder:{C.RESET}  {C.GRAY}{USER_DOWNLOADS}{C.RESET}")
    print()
    print(f" {C.WHITE}Examples:{C.RESET}")
    print(f"   {C.GRAY}${C.RESET} {C.GREEN}tunefetch{C.RESET} {C.CYAN}TF-8429{C.RESET}")
    print(f"   {C.GRAY}${C.RESET} {C.GREEN}tunefetch{C.RESET} {C.CYAN}8429{C.RESET}")
    print()


def format_progress_bar(progress_pct: float, width: int = 28) -> str:
    """Renders a smooth two-tone ANSI progress bar."""
    filled = int(width * (max(0.0, min(100.0, progress_pct)) / 100.0))
    empty = width - filled
    return f"{C.GREEN}{'█' * filled}{C.DARK_GRAY}{'░' * empty}{C.RESET}"


# ============================================================
# SESSION RESOLUTION
# ============================================================

def fetch_session_from_endpoint(base_url: str, clean_code: str, timeout: float = 8.0) -> dict:
    """Fetch session JSON from a given backend base URL."""
    endpoint = f"{base_url.rstrip('/')}/api/cloud-session/{clean_code}"
    try:
        req = urllib.request.Request(
            endpoint,
            headers={"User-Agent": f"TuneFetch-CLI/{APP_VERSION}"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("session") or {}
    except Exception:
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
    print(f" {C.CYAN}[•]{C.RESET} {C.WHITE}Backend API:{C.RESET} {C.GREEN}{BACKEND_URL}{C.RESET}")
    print(f" {C.CYAN}[•]{C.RESET} Resolving download session: {C.WHITE}{clean_code}{C.RESET}...")

    session = None

    # 1. Check local session store (if running in backend context)
    try:
        from app.services.cloud_session_store import CloudSessionStore
        session = CloudSessionStore.get_session(clean_code)
    except Exception:
        session = None

    # 2. Fetch from configured BACKEND_URL
    if not session or not session.get("tracks"):
        session = fetch_session_from_endpoint(BACKEND_URL, clean_code, timeout=10.0)

    # 3. Fallback to local default 127.0.0.1:8000 if BACKEND_URL was pointing elsewhere and failed
    if (not session or not session.get("tracks")) and not any(loc in BACKEND_URL for loc in ("127.0.0.1:8000", "localhost:8000")):
        session = fetch_session_from_endpoint("http://127.0.0.1:8000", clean_code, timeout=1.5)

    if not session or not session.get("tracks"):
        print(f" {C.RED_BOLD}[!] Error:{C.RESET} Session code {C.WHITE}'{clean_code}'{C.RESET} was not found or has expired.")
        print(f" {C.GRAY}[i] Checked backend server: {C.CYAN}{BACKEND_URL}{C.RESET}")
        print(f" {C.GRAY}[i] Generate a fresh session code on your TuneFetch web app:{C.RESET}")
        print(f"     {C.CYAN}{FRONTEND_URL}{C.RESET}")
        print()
        sys.exit(1)

    playlist_name = session.get("playlist_name", "Spotify Playlist")
    tracks = session.get("tracks", [])

    playlist_folder = USER_DOWNLOADS / playlist_name
    print(f" {C.GREEN_BOLD}[✓]{C.RESET} {C.WHITE}Session Verified:{C.RESET} {C.PURPLE_BOLD}\"{playlist_name}\"{C.RESET} {C.CYAN}({len(tracks)} Tracks Verified){C.RESET}")
    print(f" {C.CYAN}[→]{C.RESET} {C.GRAY}Destination:{C.RESET} {C.WHITE}{playlist_folder}{C.RESET}")
    print()

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
                full_t_clean = (full_t[:42] + "..") if len(full_t) > 44 else full_t
                if t_status == "COMPLETED":
                    print(f" {C.GREEN_BOLD}[+]{C.RESET} {C.MUTED}[{i+1}/{total}]{C.RESET} {C.WHITE}{full_t_clean:<44}{C.RESET} {C.GREEN_BOLD}[✓ COMPLETED]{C.RESET}")
                    print(f"     {C.GREEN}↳{C.RESET} {C.GREEN_BRIGHT}320 kbps CBR MP3{C.RESET} {C.MUTED}· Album Art Embedded · Saved{C.RESET}")
                else:
                    print(f" {C.RED_BOLD}[-]{C.RESET} {C.MUTED}[{i+1}/{total}]{C.RESET} {C.GRAY}{full_t_clean:<44}{C.RESET} {C.RED}[SKIPPED]{C.RESET}")
                sys.stdout.flush()

        # Active progress bar for currently downloading song
        if b_status == "DOWNLOADING":
            curr_idx = min(total, processed + 1)
            bar = format_progress_bar(current_progress, width=28)
            short_title = (current_title[:26] + "..") if len(current_title) > 28 else current_title

            sys.stdout.write(
                f"\r\033[K {C.CYAN}[↓]{C.RESET} {C.MUTED}[{curr_idx}/{total}]{C.RESET} {C.WHITE}{short_title:<28}{C.RESET} {C.GREEN_BOLD}{int(current_progress):>3}%{C.RESET} | {C.YELLOW_BOLD}{current_speed:>8}{C.RESET} | {C.CYAN}ETA: {eta_m:02d}:{eta_s:02d}{C.RESET}\n     [{bar}] {C.GREEN_BOLD}{int(current_progress):>3}%{C.RESET}\033[F"
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
                    full_t_clean = (full_t[:42] + "..") if len(full_t) > 44 else full_t
                    if t_status == "COMPLETED":
                        print(f" {C.GREEN_BOLD}[+]{C.RESET} {C.MUTED}[{i+1}/{total}]{C.RESET} {C.WHITE}{full_t_clean:<44}{C.RESET} {C.GREEN_BOLD}[✓ COMPLETED]{C.RESET}")
                        print(f"     {C.GREEN}↳{C.RESET} {C.GREEN_BRIGHT}320 kbps CBR MP3{C.RESET} {C.MUTED}· Album Art Embedded · Saved{C.RESET}")
                    else:
                        print(f" {C.RED_BOLD}[-]{C.RESET} {C.MUTED}[{i+1}/{total}]{C.RESET} {C.GRAY}{full_t_clean:<44}{C.RESET} {C.RED}[SKIPPED]{C.RESET}")

            sys.stdout.write("\r\033[K\n")
            print()
            success_msg = f"✓ All {completed} of {total} tracks converted successfully at 320 kbps!"
            time_msg = f"⏱  Total Time: {elapsed_m:02d}:{elapsed_s:02d} · Bitrate: 320 kbps CBR"
            dest_msg = f"📂 Saved To: Downloads/Thanks for downloading/{playlist_folder.name}"
            box_w = max(len(success_msg), len(time_msg), len(dest_msg)) + 4

            print(f" {C.GREEN}╭{'─' * box_w}╮{C.RESET}")
            print(f" {C.GREEN}│{C.RESET}  {C.GREEN_BOLD}{success_msg}{C.RESET}{' ' * (box_w - len(success_msg) - 2)}{C.GREEN}│{C.RESET}")
            print(f" {C.GREEN}│{C.RESET}  {C.CYAN}{time_msg}{C.RESET}{' ' * (box_w - len(time_msg) - 2)}{C.GREEN}│{C.RESET}")
            print(f" {C.GREEN}│{C.RESET}  {C.GRAY}{dest_msg}{C.RESET}{' ' * (box_w - len(dest_msg) - 2)}{C.GREEN}│{C.RESET}")
            print(f" {C.GREEN}╰{'─' * box_w}╯{C.RESET}")
            print()
            break

        time.sleep(0.2)


# ============================================================
# MAIN ENTRYPOINT
# ============================================================

def main():
    try:
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
        print(f" {C.CYAN}[•]{C.RESET} {C.WHITE}Active Backend:{C.RESET} {C.GREEN}{BACKEND_URL}{C.RESET}")
        print(f" {C.CYAN}[→]{C.RESET} {C.WHITE}Downloads Destination:{C.RESET} {C.GRAY}{USER_DOWNLOADS}{C.RESET}")
        print()

        code = input(f" {C.GREEN}▶{C.RESET} {C.WHITE}Enter session code from website (e.g. TF-XXXX):{C.RESET} ").strip()
        if code:
            run_cli_mode(code)
        else:
            print(f" {C.YELLOW}[!] No session code entered. Exiting.{C.RESET}")
    except (KeyboardInterrupt, EOFError):
        print(f"\n {C.GRAY}[i] Operation cancelled by user. Exiting.{C.RESET}\n")


if __name__ == "__main__":
    main()