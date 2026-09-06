import os
import glob
import time
import uuid
import logging
import threading
from typing import Dict, Any, Optional
import yt_dlp

from app.core.config import DOWNLOADS_DIR, MAX_FILE_AGE_SECONDS, DEFAULT_BITRATE
from app.utils.ffmpeg_helper import get_ffmpeg_path
from app.utils.sanitizer import sanitize_filename
from app.services.spotify_resolver import (
    is_spotify_url,
    parse_spotify_type_and_id,
    resolve_spotify_track,
    resolve_spotify_playlist_or_album
)

logger = logging.getLogger("downloader")

tasks: Dict[str, Dict[str, Any]] = {}
tasks_lock = threading.Lock()

def cleanup_old_files(max_age_seconds: int = MAX_FILE_AGE_SECONDS):
    """Clean up files and tasks older than the configured threshold"""
    now = time.time()
    try:
        for fname in os.listdir(DOWNLOADS_DIR):
            fpath = os.path.join(DOWNLOADS_DIR, fname)
            if os.path.isfile(fpath) and fname != ".gitkeep":
                if (now - os.path.getmtime(fpath)) > max_age_seconds:
                    try:
                        os.remove(fpath)
                        logger.info(f"Cleaned up expired file: {fname}")
                    except Exception as e:
                        logger.warning(f"Error removing file {fname}: {e}")
    except Exception as e:
        logger.warning(f"Cleanup routine error: {e}")

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

        # 2. General URL parsing via yt-dlp
        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": "in_playlist",
            "skip_download": True,
        }
        ffmpeg_exe = get_ffmpeg_path()
        if ffmpeg_exe:
            ydl_opts["ffmpeg_location"] = ffmpeg_exe

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(url, download=False)
            except Exception as e:
                if not url.startswith("http://") and not url.startswith("https://"):
                    info = ydl.extract_info(f"ytsearch1:{url}", download=False)
                    if "entries" in info and len(info["entries"]) > 0:
                        info = info["entries"][0]
                    else:
                        raise ValueError(f"No results found for search query: {url}")
                else:
                    raise ValueError(f"Failed to fetch info: {str(e)}")

        if not info:
            raise ValueError("No metadata could be extracted from the provided URL")

        # Handle Playlists
        if "entries" in info and info.get("_type") == "playlist":
            entries = []
            for idx, entry in enumerate(info.get("entries", [])):
                if entry:
                    entries.append({
                        "id": idx,
                        "title": entry.get("title", f"Track {idx+1}"),
                        "artist": entry.get("uploader", entry.get("channel", "")),
                        "duration": entry.get("duration", 0),
                        "thumbnail": entry.get("thumbnail") or (entry.get("thumbnails")[-1]["url"] if entry.get("thumbnails") else ""),
                        "url": entry.get("url") or entry.get("webpage_url", f"https://www.youtube.com/watch?v={entry.get('id')}")
                    })
            return {
                "is_playlist": True,
                "platform": "youtube",
                "title": info.get("title", "YouTube Playlist"),
                "thumbnail": info.get("thumbnail") or (entries[0]["thumbnail"] if entries else ""),
                "track_count": len(entries),
                "tracks": entries,
                "original_url": url
            }

        # Single video / audio track
        thumbnail = info.get("thumbnail")
        if not thumbnail and info.get("thumbnails"):
            thumbnail = info.get("thumbnails")[-1].get("url")

        return {
            "is_playlist": False,
            "platform": "youtube" if ("youtube" in url or "youtu.be" in url) else "generic",
            "title": info.get("title", "Unknown Title"),
            "artist": info.get("artist") or info.get("uploader") or info.get("channel", "Unknown Artist"),
            "thumbnail": thumbnail or "",
            "duration": info.get("duration", 0),
            "original_url": url,
            "formats": ["mp3-320", "mp3-256", "mp3-128", "best-audio"]
        }

    @staticmethod
    def create_download_task(
        url: str,
        format_type: str = "mp3-320",
        custom_title: Optional[str] = None,
        custom_artist: Optional[str] = None,
        custom_thumbnail: Optional[str] = None,
    ) -> str:
        """
        Initializes an asynchronous download task and returns the tracking task ID.
        """
        task_id = str(uuid.uuid4())
        
        with tasks_lock:
            tasks[task_id] = {
                "id": task_id,
                "url": url,
                "title": custom_title or "Preparing download...",
                "artist": custom_artist or "",
                "thumbnail": custom_thumbnail or "",
                "status": "pending",
                "progress": 0.0,
                "speed": "0 KB/s",
                "eta": "--",
                "file_id": None,
                "filename": None,
                "filepath": None,
                "filesize": 0,
                "error": None,
                "created_at": time.time()
            }

        thread = threading.Thread(
            target=DownloadManager._run_download,
            args=(task_id, url, format_type, custom_title, custom_artist),
            daemon=True
        )
        thread.start()

        return task_id

    @staticmethod
    def _run_download(
        task_id: str,
        url: str,
        format_type: str,
        custom_title: Optional[str],
        custom_artist: Optional[str]
    ):
        cleanup_old_files()
        
        target_url = url
        if is_spotify_url(url):
            try:
                resolved = resolve_spotify_track(url)
                target_url = f"ytsearch1:{resolved['search_query']}"
                if not custom_title:
                    custom_title = resolved["title"]
                if not custom_artist:
                    custom_artist = resolved["artist"]
                with tasks_lock:
                    if task_id in tasks:
                        tasks[task_id]["title"] = resolved["title"]
                        tasks[task_id]["artist"] = resolved["artist"]
                        tasks[task_id]["thumbnail"] = resolved["thumbnail"]
            except Exception as e:
                logger.error(f"Error resolving Spotify track: {e}")

        ffmpeg_exe = get_ffmpeg_path()

        is_mp3 = format_type.startswith("mp3")
        bitrate = DEFAULT_BITRATE
        if is_mp3 and "-" in format_type:
            bitrate = format_type.split("-")[1]

        def progress_hook(d):
            if d.get("status") == "downloading":
                with tasks_lock:
                    if task_id not in tasks:
                        return
                    total_bytes = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                    downloaded = d.get("downloaded_bytes") or 0
                    percent = 0.0
                    if total_bytes > 0:
                        percent = round((downloaded / total_bytes) * 100, 1)
                    else:
                        percent_str = d.get("_percent_str", "0%").replace("%", "").strip()
                        try:
                            percent = float(percent_str)
                        except Exception:
                            percent = 0.0

                    tasks[task_id]["status"] = "downloading"
                    tasks[task_id]["progress"] = percent
                    tasks[task_id]["speed"] = d.get("_speed_str", "N/A")
                    tasks[task_id]["eta"] = d.get("_eta_str", "--")

            elif d.get("status") == "finished":
                with tasks_lock:
                    if task_id in tasks:
                        tasks[task_id]["status"] = "converting" if is_mp3 else "completed"
                        tasks[task_id]["progress"] = 99.0 if is_mp3 else 100.0

        out_template = os.path.join(DOWNLOADS_DIR, f"{task_id}_%(title).150B.%(ext)s")

        ydl_opts: Dict[str, Any] = {
            "format": "bestaudio/best",
            "outtmpl": out_template,
            "progress_hooks": [progress_hook],
            "quiet": False,
            "no_warnings": True,
            "noplaylist": True,
        }

        if ffmpeg_exe:
            ydl_opts["ffmpeg_location"] = ffmpeg_exe

        if is_mp3:
            if ffmpeg_exe:
                ydl_opts["postprocessors"] = [{
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": bitrate,
                }]
            else:
                logger.warning("FFmpeg binary not detected; saving best available stream.")

        try:
            with tasks_lock:
                if task_id in tasks:
                    tasks[task_id]["status"] = "downloading"

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(target_url, download=True)
                if "entries" in info and len(info["entries"]) > 0:
                    info = info["entries"][0]

                video_title = custom_title or info.get("title", "Audio")
                video_artist = custom_artist or info.get("artist") or info.get("uploader") or ""
                thumbnail = info.get("thumbnail") or ""

            matching_files = glob.glob(os.path.join(DOWNLOADS_DIR, f"{task_id}_*"))
            if not matching_files:
                raise FileNotFoundError("Target download file was not created by yt-dlp")

            final_filepath = matching_files[0]
            raw_filename = os.path.basename(final_filepath)
            
            # Clean filename
            clean_display_name = raw_filename.split(f"{task_id}_", 1)[-1]
            if is_mp3 and not clean_display_name.lower().endswith(".mp3"):
                clean_display_name = f"{os.path.splitext(clean_display_name)[0]}.mp3"

            filesize = os.path.getsize(final_filepath)

            with tasks_lock:
                if task_id in tasks:
                    tasks[task_id]["status"] = "completed"
                    tasks[task_id]["progress"] = 100.0
                    tasks[task_id]["file_id"] = task_id
                    tasks[task_id]["filename"] = clean_display_name
                    tasks[task_id]["filepath"] = final_filepath
                    tasks[task_id]["filesize"] = filesize
                    tasks[task_id]["title"] = video_title
                    tasks[task_id]["artist"] = video_artist
                    if not tasks[task_id]["thumbnail"] and thumbnail:
                        tasks[task_id]["thumbnail"] = thumbnail

        except Exception as e:
            logger.error(f"Download task {task_id} encountered an error: {e}", exc_info=True)
            with tasks_lock:
                if task_id in tasks:
                    tasks[task_id]["status"] = "error"
                    tasks[task_id]["error"] = str(e)

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
