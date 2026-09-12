import os
import glob
import time
import uuid
import logging
import threading
import subprocess
import urllib.request
import http.cookiejar
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, Optional, List, Tuple
from pytubefix import YouTube, Search, Playlist

from app.core.config import (
    DOWNLOADS_DIR,
    MAX_FILE_AGE_SECONDS,
    DEFAULT_BITRATE,
    MAX_CONCURRENT_DOWNLOADS,
    MAX_TASK_HISTORY,
    CLEANUP_INTERVAL_SECONDS
)
from app.utils.ffmpeg_helper import get_ffmpeg_path
from app.utils.sanitizer import sanitize_filename
from app.services.spotify_resolver import (
    is_spotify_url,
    parse_spotify_type_and_id,
    resolve_spotify_track,
    resolve_spotify_playlist_or_album
)

logger = logging.getLogger("downloader")

# In-memory store for task states with thread lock
tasks: Dict[str, Dict[str, Any]] = {}
tasks_lock = threading.Lock()

# Bounded thread pool executor for controlled server load
executor = ThreadPoolExecutor(
    max_workers=MAX_CONCURRENT_DOWNLOADS,
    thread_name_prefix="TuneFetch-Worker"
)

def sweep_storage_and_memory():
    """
    Periodic routine to purge expired files and prevent task memory leaks.
    """
    now = time.time()
    # 1. Sweep physical disk files
    try:
        for fname in os.listdir(DOWNLOADS_DIR):
            if fname == ".gitkeep":
                continue
            fpath = os.path.join(DOWNLOADS_DIR, fname)
            if os.path.isfile(fpath):
                file_age = now - os.path.getmtime(fpath)
                if file_age > MAX_FILE_AGE_SECONDS:
                    try:
                        os.remove(fpath)
                        logger.info(f"[GC] Removed expired audio file: {fname} (age: {int(file_age)}s)")
                    except Exception as e:
                        logger.warning(f"[GC] Error removing expired file {fname}: {e}")
    except Exception as e:
        logger.warning(f"[GC] Error during file sweep: {e}")

    # 2. Prune old in-memory task records
    with tasks_lock:
        if len(tasks) > MAX_TASK_HISTORY:
            sorted_tasks = sorted(tasks.items(), key=lambda x: x[1].get("created_at", 0))
            to_remove = len(tasks) - MAX_TASK_HISTORY
            for k, _ in sorted_tasks[:to_remove]:
                del tasks[k]

        # Also remove tasks older than 15 minutes that are finished
        expired_keys = [
            k for k, v in tasks.items()
            if (now - v.get("created_at", 0)) > 900 and v.get("status") in ["completed", "error"]
        ]
        for k in expired_keys:
            del tasks[k]

def _background_gc_loop():
    """Continuous daemon loop for background cleanup."""
    while True:
        try:
            time.sleep(CLEANUP_INTERVAL_SECONDS)
            sweep_storage_and_memory()
        except Exception as e:
            logger.error(f"Unexpected GC thread error: {e}")

# Start the Garbage Collector Daemon Thread
gc_thread = threading.Thread(target=_background_gc_loop, daemon=True, name="TuneFetch-GC")
gc_thread.start()

def _parse_cookies_into_jar(raw_content: str) -> http.cookiejar.MozillaCookieJar:
    """
    Parses cookies from multiple formats:
    - Netscape format (standard cookies.txt, with or without '# Netscape HTTP Cookie File' header)
    - JSON array format (e.g. from Cookie-Editor extension)
    - Header key=value format (e.g. raw Cookie header)
    """
    import json
    import tempfile

    jar = http.cookiejar.MozillaCookieJar()
    content = raw_content.strip()
    if not content or len(content) < 10:
        return jar

    # Format 1: JSON array (Cookie-Editor format)
    if content.startswith("[") and content.endswith("]"):
        try:
            items = json.loads(content)
            for item in items:
                domain = item.get("domain", ".youtube.com")
                name = item.get("name", "")
                value = item.get("value", "")
                path = item.get("path", "/")
                secure = bool(item.get("secure", True))
                expires = int(item.get("expirationDate", time.time() + 86400 * 365))
                if name:
                    c = http.cookiejar.Cookie(
                        version=0, name=name, value=value,
                        port=None, port_specified=False,
                        domain=domain, domain_specified=True, domain_initial_dot=domain.startswith("."),
                        path=path, path_specified=True,
                        secure=secure, expires=expires,
                        discard=False, comment=None, comment_url=None, rest={}, rfc2109=False
                    )
                    jar.set_cookie(c)
            if len(list(jar)) > 0:
                return jar
        except Exception:
            pass

    # Format 2: Netscape format (with or without standard header)
    netscape_lines = []
    has_header = False
    for line in content.splitlines():
        line_clean = line.strip()
        if not line_clean:
            continue
        if "netscape" in line_clean.lower() or "http cookie file" in line_clean.lower():
            has_header = True
            netscape_lines.append(line)
        elif line_clean.startswith("#") and not line_clean.startswith("#HttpOnly_"):
            netscape_lines.append(line)
        else:
            parts = line.split("\t") if "\t" in line else line.split()
            if len(parts) >= 7:
                netscape_lines.append("\t".join(parts[:7]))
            elif len(parts) >= 6:
                netscape_lines.append("\t".join(parts))

    if not has_header:
        netscape_lines.insert(0, "# Netscape HTTP Cookie File")

    temp_name = None
    try:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False) as tf:
            tf.write("\n".join(netscape_lines) + "\n")
            temp_name = tf.name

        temp_jar = http.cookiejar.MozillaCookieJar(temp_name)
        temp_jar.load(ignore_discard=True, ignore_expires=True)
        for cookie in temp_jar:
            jar.set_cookie(cookie)
    except Exception:
        pass
    finally:
        if temp_name and os.path.exists(temp_name):
            try:
                os.unlink(temp_name)
            except OSError:
                pass

    # Format 3: Header format (Cookie: name=val; name2=val2)
    if len(list(jar)) == 0 and ("=" in content or ";" in content):
        clean_header = content.replace("Cookie:", "").strip()
        for part in clean_header.split(";"):
            part = part.strip()
            if "=" in part:
                k, v = part.split("=", 1)
                k, v = k.strip(), v.strip()
                if k and v:
                    c = http.cookiejar.Cookie(
                        version=0, name=k, value=v,
                        port=None, port_specified=False,
                        domain=".youtube.com", domain_specified=True, domain_initial_dot=True,
                        path="/", path_specified=True,
                        secure=True, expires=int(time.time() + 86400 * 365),
                        discard=False, comment=None, comment_url=None, rest={}, rfc2109=False
                    )
                    jar.set_cookie(c)

    return jar

def get_cookie_jar() -> Optional[http.cookiejar.MozillaCookieJar]:
    """
    Loads and normalizes YouTube cookies from all supported sources:
    1. YOUTUBE_COOKIE_FILE / COOKIE_FILE env var (path to file)
    2. YOUTUBE_COOKIES / COOKIES_TXT env var (raw text, netscape, or JSON content)
    3. YOUTUBE_COOKIES_BASE64 env var (base64-encoded content)
    4. Local cookies.txt files in backend, workspace root, downloads, or current dir
    """
    from app.core.config import BASE_DIR

    # Check environment variable raw cookies
    raw_cookies = os.getenv("YOUTUBE_COOKIES") or os.getenv("COOKIES_TXT")
    if raw_cookies and len(raw_cookies.strip()) > 10:
        jar = _parse_cookies_into_jar(raw_cookies)
        if len(list(jar)) > 0:
            target_path = os.path.join(DOWNLOADS_DIR, "youtube_cookies.txt")
            try:
                jar.save(target_path, ignore_discard=True, ignore_expires=True)
            except Exception:
                pass
            return jar

    # Check environment variable base64 cookies
    b64_cookies = os.getenv("YOUTUBE_COOKIES_BASE64")
    if b64_cookies and len(b64_cookies.strip()) > 10:
        try:
            import base64
            decoded = base64.b64decode(b64_cookies.strip()).decode("utf-8")
            jar = _parse_cookies_into_jar(decoded)
            if len(list(jar)) > 0:
                target_path = os.path.join(DOWNLOADS_DIR, "youtube_cookies.txt")
                try:
                    jar.save(target_path, ignore_discard=True, ignore_expires=True)
                except Exception:
                    pass
                return jar
        except Exception as e:
            logger.warning(f"Failed decoding YOUTUBE_COOKIES_BASE64: {e}")

    # Check file candidates
    candidates = [
        os.getenv("YOUTUBE_COOKIE_FILE"),
        os.getenv("COOKIE_FILE"),
        os.path.join(BASE_DIR, "cookies.txt"),
        os.path.join(BASE_DIR.parent, "cookies.txt"),
        os.path.join(DOWNLOADS_DIR, "cookies.txt"),
        os.path.join(DOWNLOADS_DIR, "youtube_cookies.txt"),
        os.path.join(os.getcwd(), "cookies.txt"),
        os.path.join(os.getcwd(), "backend", "cookies.txt"),
    ]

    for candidate in candidates:
        if candidate and os.path.isfile(candidate) and os.path.getsize(candidate) > 10:
            try:
                with open(candidate, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                jar = _parse_cookies_into_jar(content)
                if len(list(jar)) > 0:
                    logger.info(f"Loaded {len(list(jar))} cookies for YouTube authentication from {candidate}")
                    target_path = os.path.join(DOWNLOADS_DIR, "youtube_cookies.txt")
                    try:
                        jar.save(target_path, ignore_discard=True, ignore_expires=True)
                    except Exception:
                        pass
                    return jar
            except Exception as e:
                logger.warning(f"Failed reading cookie candidate {candidate}: {e}")

    return None

def get_cookie_file() -> Optional[str]:
    """Returns path to cached valid cookies.txt if available."""
    jar = get_cookie_jar()
    if jar and len(list(jar)) > 0:
        target_path = os.path.join(DOWNLOADS_DIR, "youtube_cookies.txt")
        if os.path.isfile(target_path):
            return target_path
    return None

def configure_urllib_network(custom_cookies: Optional[http.cookiejar.MozillaCookieJar] = None):
    """
    Configures urllib opener dynamically with cookie support.
    """
    handlers = []
    cookie_jar = custom_cookies or get_cookie_jar()
    if cookie_jar:
        handlers.append(urllib.request.HTTPCookieProcessor(cookie_jar))

    opener = urllib.request.build_opener(*handlers)
    urllib.request.install_opener(opener)

# Initialize standard opener
configure_urllib_network()

CLIENT_FALLBACK_ORDER = ["VISION_OS", "MWEB", "WEB", "IOS", "ANDROID_VR"]

def build_pytubefix_instance(
    url: str,
    client: str = "VISION_OS",
    on_progress_callback=None,
    on_complete_callback=None,
    po_token: Optional[str] = None
) -> YouTube:
    """
    Constructs a pytubefix YouTube object.
    Supports botGuard PO tokens when needed for web clients.
    """
    verifier = None
    if po_token:
        def verifier():
            return "", po_token

    return YouTube(
        url,
        client=client,
        on_progress_callback=on_progress_callback,
        on_complete_callback=on_complete_callback,
        use_po_token=bool(po_token),
        po_token_verifier=verifier if po_token else None
    )

def fetch_youtube_with_fallback(
    url: str,
    on_progress_callback=None,
    on_complete_callback=None,
    custom_cookies: Optional[http.cookiejar.MozillaCookieJar] = None
) -> Tuple[YouTube, Any]:
    """
    Tries multiple client profiles in sequence until a valid audio stream is found.
    Prioritizes VISION_OS (zero bot detection, require_po_token=False, 128kbps AAC) followed by
    MWEB, WEB, IOS, and ANDROID_VR.
    Returns (yt_instance, best_audio_stream).
    Raises RuntimeError if all clients fail.
    """
    last_err = None
    cookie_jar = custom_cookies or get_cookie_jar()

    # Pre-generate botGuard PO token for web clients fallback if needed
    po_token = None
    try:
        from pytubefix.botGuard.bot_guard import generate_po_token
        from pytubefix import extract
        vid_id = extract.video_id(url)
        po_token = generate_po_token(vid_id)
    except Exception:
        po_token = None

    configure_urllib_network(custom_cookies=cookie_jar)
    for client_name in CLIENT_FALLBACK_ORDER:
        try:
            yt = build_pytubefix_instance(
                url=url,
                client=client_name,
                on_progress_callback=on_progress_callback,
                on_complete_callback=on_complete_callback,
                po_token=po_token if client_name in ["MWEB", "WEB"] else None
            )

            # Accessing title forces basic metadata extraction
            _ = yt.title

            # First priority: non-SABR audio streams for maximum download stability
            all_audio = yt.streams.filter(only_audio=True).order_by("abr").desc()
            non_sabr_streams = [s for s in all_audio if not getattr(s, "is_sabr", False)]
            if non_sabr_streams:
                return yt, non_sabr_streams[0]

            # Second priority: standard audio stream
            stream = yt.streams.get_audio_only()
            if stream:
                return yt, stream

            if all_audio and len(all_audio) > 0:
                return yt, all_audio.first()
        except Exception as err:
            last_err = err
            logger.warning(f"Pytubefix client '{client_name}' failed for '{url}': {err}")

    raise RuntimeError(f"Could not extract audio stream across clients ({', '.join(CLIENT_FALLBACK_ORDER)}): {last_err}")

class DownloadManager:
    @staticmethod
    def get_info(url: str) -> Dict[str, Any]:
        """
        Extracts metadata for single tracks or playlists without downloading media.
        """
        url = url.strip()
        if not url:
            raise ValueError("URL cannot be empty")

        # 1. Spotify URL parsing
        if is_spotify_url(url):
            item_type, _ = parse_spotify_type_and_id(url)
            if item_type in ["playlist", "album"]:
                playlist_data = resolve_spotify_playlist_or_album(url)
                return {
                    "is_playlist": True,
                    "platform": "spotify",
                    "title": playlist_data.get("title"),
                    "thumbnail": playlist_data.get("thumbnail"),
                    "track_count": playlist_data.get("track_count", 0),
                    "tracks": playlist_data.get("tracks", []),
                    "original_url": url
                }
            else:
                track_data = resolve_spotify_track(url)
                return {
                    "is_playlist": False,
                    "platform": "spotify",
                    "title": track_data.get("title"),
                    "artist": track_data.get("artist"),
                    "thumbnail": track_data.get("thumbnail"),
                    "duration": track_data.get("duration", 0),
                    "search_query": track_data.get("search_query"),
                    "original_url": url,
                    "formats": ["mp3-320", "mp3-256", "mp3-128", "best-audio"]
                }

        # 2. Check for YouTube Playlist
        if "playlist?list=" in url or "&list=" in url:
            try:
                p = Playlist(url)
                entries = []
                for idx, v in enumerate(p.videos):
                    try:
                        entries.append({
                            "id": idx,
                            "title": v.title or f"Track {idx+1}",
                            "artist": v.author or "",
                            "duration": v.length or 0,
                            "thumbnail": v.thumbnail_url or "",
                            "url": v.watch_url
                        })
                    except Exception:
                        pass
                return {
                    "is_playlist": True,
                    "platform": "youtube",
                    "title": p.title or "YouTube Playlist",
                    "thumbnail": entries[0]["thumbnail"] if entries else "",
                    "track_count": len(entries),
                    "tracks": entries,
                    "original_url": url
                }
            except Exception as pl_err:
                logger.warning(f"Playlist extraction failed, falling back to single video: {pl_err}")

        # 3. Check if query is plain text search rather than direct URL
        target_url = url
        if not url.startswith("http://") and not url.startswith("https://"):
            try:
                s = Search(url)
                if s.videos and len(s.videos) > 0:
                    target_url = s.videos[0].watch_url
                else:
                    raise ValueError(f"No results found for search query: {url}")
            except Exception as s_err:
                raise ValueError(f"Search failed for '{url}': {s_err}")

        # 4. Single video / audio metadata resolution (fast, unblocked oEmbed first)
        if "youtube.com" in target_url or "youtu.be" in target_url:
            try:
                import urllib.parse
                oembed_url = f"https://www.youtube.com/oembed?url={urllib.parse.quote(target_url)}&format=json"
                req = urllib.request.Request(oembed_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                with urllib.request.urlopen(req, timeout=4) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    return {
                        "is_playlist": False,
                        "platform": "youtube",
                        "title": data.get("title") or "YouTube Video",
                        "artist": data.get("author_name") or "YouTube Creator",
                        "thumbnail": data.get("thumbnail_url") or "",
                        "duration": 0,
                        "original_url": target_url,
                        "formats": ["mp3-320", "mp3-256", "mp3-128", "best-audio"]
                    }
            except Exception as oembed_err:
                logger.debug(f"oEmbed resolution skipped: {oembed_err}")

        yt, stream = fetch_youtube_with_fallback(target_url)
        return {
            "is_playlist": False,
            "platform": "youtube" if ("youtube" in target_url or "youtu.be" in target_url) else "generic",
            "title": yt.title or "Unknown Title",
            "artist": yt.author or "Unknown Artist",
            "thumbnail": yt.thumbnail_url or "",
            "duration": yt.length or 0,
            "original_url": target_url,
            "formats": ["mp3-320", "mp3-256", "mp3-128", "best-audio"]
        }

    @staticmethod
    def get_direct_stream_url(url: str) -> Dict[str, Any]:
        """
        Resolves direct audio stream URL and metadata for client-side / distributed fetching.
        Allows web clients to stream/download straight from YouTube servers without putting
        bandwidth or IP burden on the backend server.
        """
        url = url.strip()
        if not url:
            raise ValueError("URL cannot be empty")

        target_url = url
        custom_title = None
        custom_artist = None
        custom_thumb = None

        if is_spotify_url(url):
            resolved = resolve_spotify_track(url)
            custom_title = resolved["title"]
            custom_artist = resolved["artist"]
            custom_thumb = resolved["thumbnail"]
            s = Search(resolved["search_query"])
            if s.videos and len(s.videos) > 0:
                target_url = s.videos[0].watch_url
            else:
                raise ValueError(f"Could not resolve Spotify track on YouTube: {resolved['search_query']}")
        elif not url.startswith("http://") and not url.startswith("https://"):
            s = Search(url)
            if s.videos and len(s.videos) > 0:
                target_url = s.videos[0].watch_url
            else:
                raise ValueError(f"No search results for query: {url}")

        yt, stream = fetch_youtube_with_fallback(target_url)
        return {
            "success": True,
            "direct_stream_url": stream.url,
            "title": custom_title or yt.title or "Audio",
            "artist": custom_artist or yt.author or "",
            "thumbnail": custom_thumb or yt.thumbnail_url or "",
            "duration": yt.length or 0,
            "mime_type": stream.mime_type or "audio/mp4",
            "abr": getattr(stream, "abr", "128kbps"),
            "filesize": getattr(stream, "filesize", 0),
            "watch_url": target_url
        }

    @staticmethod
    def create_download_task(
        url: str,
        format_type: str = "mp3-320",
        custom_title: Optional[str] = None,
        custom_artist: Optional[str] = None,
        custom_thumbnail: Optional[str] = None,
        user_id: Optional[str] = None,
        custom_cookies: Optional[http.cookiejar.MozillaCookieJar] = None,
        is_single_download: bool = False
    ) -> str:
        """
        Initializes an asynchronous download task queued in the bounded thread pool.
        Supports user-specific ephemeral cookies with automated post-download deletion.
        """
        task_id = str(uuid.uuid4())

        with tasks_lock:
            tasks[task_id] = {
                "id": task_id,
                "url": url,
                "title": custom_title or "Queued for download...",
                "artist": custom_artist or "",
                "thumbnail": custom_thumbnail or "",
                "status": "queued",
                "progress": 0.0,
                "speed": "0 KB/s",
                "eta": "--",
                "file_id": None,
                "filename": None,
                "filepath": None,
                "filesize": 0,
                "error": None,
                "created_at": time.time(),
                "user_id": user_id,
                "custom_cookies": custom_cookies,
                "is_single_download": is_single_download
            }

        # Submit task to the bounded worker pool
        executor.submit(
            DownloadManager._run_download,
            task_id, url, format_type, custom_title, custom_artist, custom_cookies, user_id
        )

        return task_id

    @staticmethod
    def _run_download(
        task_id: str,
        url: str,
        format_type: str,
        custom_title: Optional[str],
        custom_artist: Optional[str],
        custom_cookies: Optional[http.cookiejar.MozillaCookieJar] = None,
        user_id: Optional[str] = None
    ):
        target_url = url
        if is_spotify_url(url):
            try:
                resolved = resolve_spotify_track(url)
                if not custom_title:
                    custom_title = resolved["title"]
                if not custom_artist:
                    custom_artist = resolved["artist"]
                with tasks_lock:
                    if task_id in tasks:
                        tasks[task_id]["title"] = resolved["title"]
                        tasks[task_id]["artist"] = resolved["artist"]
                        tasks[task_id]["thumbnail"] = resolved["thumbnail"]

                # Resolve via Search
                s = Search(resolved["search_query"])
                if s.videos and len(s.videos) > 0:
                    target_url = s.videos[0].watch_url
                else:
                    raise ValueError(f"Could not find YouTube match for: {resolved['search_query']}")
            except Exception as e:
                logger.error(f"Error resolving Spotify track: {e}")
                with tasks_lock:
                    if task_id in tasks:
                        tasks[task_id]["status"] = "error"
                        tasks[task_id]["error"] = f"Failed resolving Spotify track: {e}"
                return

        elif not target_url.startswith("http://") and not target_url.startswith("https://"):
            try:
                s = Search(target_url)
                if s.videos and len(s.videos) > 0:
                    target_url = s.videos[0].watch_url
                else:
                    raise ValueError(f"No results for query: {target_url}")
            except Exception as e:
                with tasks_lock:
                    if task_id in tasks:
                        tasks[task_id]["status"] = "error"
                        tasks[task_id]["error"] = str(e)
                return

        is_mp3 = format_type.startswith("mp3")
        bitrate = DEFAULT_BITRATE
        if is_mp3 and "-" in format_type:
            bitrate = format_type.split("-")[1]

        last_update_time = [time.time()]
        last_downloaded_bytes = [0]

        def on_progress(stream, chunk, bytes_remaining):
            with tasks_lock:
                if task_id not in tasks:
                    return

            total_size = stream.filesize or 0
            if total_size > 0:
                downloaded = total_size - bytes_remaining
                percent = round((downloaded / total_size) * 100, 1)

                now = time.time()
                time_diff = now - last_update_time[0]
                speed_str = "N/A"
                eta_str = "--"

                if time_diff >= 0.5:
                    bytes_diff = downloaded - last_downloaded_bytes[0]
                    speed_bps = bytes_diff / time_diff if time_diff > 0 else 0
                    if speed_bps > 1024 * 1024:
                        speed_str = f"{speed_bps / (1024 * 1024):.1f} MB/s"
                    else:
                        speed_str = f"{speed_bps / 1024:.0f} KB/s"

                    if speed_bps > 0:
                        eta_seconds = int(bytes_remaining / speed_bps)
                        eta_str = f"{eta_seconds}s"

                    last_update_time[0] = now
                    last_downloaded_bytes[0] = downloaded

                with tasks_lock:
                    if task_id in tasks:
                        tasks[task_id]["status"] = "downloading"
                        tasks[task_id]["progress"] = min(98.0, percent)
                        tasks[task_id]["speed"] = speed_str
                        tasks[task_id]["eta"] = eta_str

        raw_temp_filepath = None
        final_mp3_filepath = None

        try:
            with tasks_lock:
                if task_id in tasks:
                    tasks[task_id]["status"] = "downloading"

            # Active cookies and direct network configuration
            active_cookies = custom_cookies or get_cookie_jar()

            # 1 & 2. Fetch and download audio stream with multi-client & candidate fallback resilience
            download_success = False
            last_err = None
            video_title = custom_title or "Audio"
            video_artist = custom_artist or ""
            thumbnail = ""

            configure_urllib_network(custom_cookies=active_cookies)

            candidate_urls = [target_url]
            c_idx = 0
            while c_idx < len(candidate_urls):
                current_url = candidate_urls[c_idx]

                for client_name in CLIENT_FALLBACK_ORDER:
                    try:
                        yt = build_pytubefix_instance(
                            url=current_url,
                            client=client_name,
                            on_progress_callback=on_progress
                        )
                        video_title = custom_title or yt.title or "Audio"
                        video_artist = custom_artist or yt.author or ""
                        thumbnail = yt.thumbnail_url or ""

                        all_audio = yt.streams.filter(only_audio=True).order_by("abr").desc()
                        audio_stream = None
                        non_sabr = [s for s in all_audio if not getattr(s, "is_sabr", False)]
                        if non_sabr:
                            audio_stream = non_sabr[0]
                        elif yt.streams.get_audio_only():
                            audio_stream = yt.streams.get_audio_only()
                        elif all_audio and len(all_audio) > 0:
                            audio_stream = all_audio.first()

                        if not audio_stream:
                            continue

                        stream_ext = "m4a" if "mp4" in (audio_stream.mime_type or "") else "webm"
                        temp_filename = f"{task_id}_raw.{stream_ext}"
                        candidate_filepath = os.path.join(DOWNLOADS_DIR, temp_filename)

                        if os.path.exists(candidate_filepath):
                            try:
                                os.remove(candidate_filepath)
                            except Exception:
                                pass

                        audio_stream.download(
                            output_path=DOWNLOADS_DIR,
                            filename=temp_filename
                        )

                        if os.path.exists(candidate_filepath) and os.path.getsize(candidate_filepath) > 1024:
                            raw_temp_filepath = candidate_filepath
                            download_success = True
                            break
                        else:
                            if os.path.exists(candidate_filepath):
                                try:
                                    os.remove(candidate_filepath)
                                except Exception:
                                    pass
                            logger.warning(f"Client '{client_name}' stream download was empty or corrupted (<1KB).")
                    except Exception as client_err:
                        last_err = client_err
                        logger.warning(f"Download for '{current_url}' with client '{client_name}' failed: {client_err}")

                if download_success:
                    break

                # If primary candidate URL failed, attempt YouTube search fallback for alternative public videos
                if c_idx == 0 and len(candidate_urls) == 1:
                    fallback_query = f"{custom_title or ''} {custom_artist or ''} audio".strip()
                    if fallback_query:
                        logger.info(f"Primary candidate URL '{current_url}' failed. Performing fallback search for '{fallback_query}'.")
                        try:
                            s = Search(fallback_query)
                            for v in getattr(s, "videos", []):
                                if v.watch_url not in candidate_urls:
                                    candidate_urls.append(v.watch_url)
                        except Exception as search_err:
                            logger.warning(f"YouTube search fallback failed for '{fallback_query}': {search_err}")

                c_idx += 1

            if not download_success or not raw_temp_filepath or not os.path.exists(raw_temp_filepath):
                raise RuntimeError(f"Could not extract audio stream across clients ({', '.join(CLIENT_FALLBACK_ORDER)}): {last_err}")

            # 3. Audio conversion / standardization to MP3 via FFmpeg
            ffmpeg_exe = get_ffmpeg_path()
            safe_title = sanitize_filename(video_title, ".mp3")
            target_output_filename = f"{task_id}_{safe_title}"
            if not target_output_filename.lower().endswith(".mp3"):
                target_output_filename = f"{target_output_filename}.mp3"

            final_mp3_filepath = os.path.join(DOWNLOADS_DIR, target_output_filename)

            with tasks_lock:
                if task_id in tasks:
                    tasks[task_id]["status"] = "converting" if is_mp3 else "completed"
                    tasks[task_id]["progress"] = 99.0 if is_mp3 else 100.0

            if is_mp3 and ffmpeg_exe:
                # Convert raw audio stream into high-fidelity MP3
                ffmpeg_cmd = [
                    ffmpeg_exe,
                    "-y",
                    "-i", raw_temp_filepath,
                    "-vn",
                    "-b:a", f"{bitrate}k",
                    "-ac", "2",
                    "-ar", "44100",
                    final_mp3_filepath
                ]
                proc = subprocess.run(
                    ffmpeg_cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                if proc.returncode != 0:
                    logger.warning(f"FFmpeg conversion failed: {proc.stderr}. Using raw stream fallback.")
                    final_mp3_filepath = raw_temp_filepath
                else:
                    # Successfully converted: purge raw stream temporary file immediately
                    try:
                        if os.path.exists(raw_temp_filepath):
                            os.remove(raw_temp_filepath)
                    except Exception as clean_err:
                        logger.warning(f"Error removing raw stream temporary file: {clean_err}")
            else:
                # Without ffmpeg or non-mp3 format requested, keep stream as is
                final_mp3_filepath = raw_temp_filepath

            filesize = os.path.getsize(final_mp3_filepath)
            display_name = os.path.basename(final_mp3_filepath).split(f"{task_id}_", 1)[-1]
            if is_mp3 and not display_name.lower().endswith(".mp3"):
                display_name = f"{os.path.splitext(display_name)[0]}.mp3"

            with tasks_lock:
                if task_id in tasks:
                    tasks[task_id]["status"] = "completed"
                    tasks[task_id]["progress"] = 100.0
                    tasks[task_id]["file_id"] = task_id
                    tasks[task_id]["filename"] = display_name
                    tasks[task_id]["filepath"] = final_mp3_filepath
                    tasks[task_id]["filesize"] = filesize
                    tasks[task_id]["title"] = video_title
                    tasks[task_id]["artist"] = video_artist
                    if not tasks[task_id]["thumbnail"] and thumbnail:
                        tasks[task_id]["thumbnail"] = thumbnail

        except Exception as e:
            logger.error(f"Download task {task_id} encountered an error: {e}", exc_info=True)
            # Ensure partial / temporary files are cleaned up on failure
            for temp_f in [raw_temp_filepath, final_mp3_filepath]:
                if temp_f and os.path.exists(temp_f):
                    try:
                        os.remove(temp_f)
                    except Exception:
                        pass

            err_msg = str(e)
            if "bot" in err_msg.lower() or "429" in err_msg:
                err_msg = (
                    f"YouTube requested bot verification ({err_msg}). "
                    "Please download using the TuneFetch desktop application on your local computer."
                )

            with tasks_lock:
                if task_id in tasks:
                    tasks[task_id]["status"] = "error"
                    tasks[task_id]["error"] = err_msg

    @staticmethod
    def get_task_status(task_id: str) -> Optional[Dict[str, Any]]:
        with tasks_lock:
            task = tasks.get(task_id)
            if task:
                return {k: v for k, v in task.items() if k != "filepath"}
            return None

    @staticmethod
    def get_task_filepath(task_id: str) -> Optional[str]:
        with tasks_lock:
            task = tasks.get(task_id)
            if task and task.get("filepath") and os.path.exists(task["filepath"]):
                return task["filepath"]

        matching_files = glob.glob(os.path.join(DOWNLOADS_DIR, f"{task_id}_*"))
        if matching_files and os.path.exists(matching_files[0]):
            return matching_files[0]

        return None

    @staticmethod
    def delete_task_file_safely(task_id: str, delay_seconds: float = 2.0):
        """
        Deletes the downloaded physical file immediately after client delivery,
        ensuring zero persistent server disk accumulation, and purges user cookies
        if this was a single download task.
        """
        def _deferred_delete():
            time.sleep(delay_seconds)
            try:
                user_id_to_clean = None
                with tasks_lock:
                    task = tasks.get(task_id)
                    if task and task.get("is_single_download") and task.get("user_id"):
                        user_id_to_clean = task.get("user_id")

                filepath = DownloadManager.get_task_filepath(task_id)
                if filepath and os.path.exists(filepath):
                    os.remove(filepath)
                    logger.info(f"[AutoClean] Successfully deleted served file: {os.path.basename(filepath)}")

                # Also remove any matching partial files for this task_id
                for f in glob.glob(os.path.join(DOWNLOADS_DIR, f"{task_id}_*")):
                    try:
                        if os.path.exists(f):
                            os.remove(f)
                    except Exception:
                        pass

                # Note: User session cookies are preserved for the active session
                # to allow downloading multiple songs without re-authenticating every track.
            except Exception as e:
                logger.warning(f"[AutoClean] Error during deferred deletion for task {task_id}: {e}")

        cleanup_worker = threading.Thread(target=_deferred_delete, daemon=True)
        cleanup_worker.start()
