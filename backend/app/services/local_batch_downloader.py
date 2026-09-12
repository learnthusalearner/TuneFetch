import os
import time
import shutil
import logging
import threading
from pathlib import Path
from typing import Dict, Any, List, Optional

from app.core.config import DOWNLOADS_DIR
from app.services.downloader import DownloadManager, tasks, tasks_lock, sanitize_filename

logger = logging.getLogger("local_batch_downloader")

_local_batches: Dict[str, Dict[str, Any]] = {}
_local_batches_lock = threading.Lock()

def _sanitize_folder_name(name: str) -> str:
    cleaned = "".join(c for c in name if c.isalnum() or c in " ._-()").strip()
    return cleaned[:80] or "TuneFetch_Playlist"

class LocalBatchDownloader:
    @classmethod
    def start_batch(
        cls,
        playlist_name: str,
        tracks: List[Dict[str, Any]],
        format_type: str = "mp3-320",
    ) -> str:
        import uuid
        batch_id = str(uuid.uuid4())
        
        # User local downloads destination
        base_downloads = os.environ.get("DOWNLOADS_DIR")
        if base_downloads:
            user_downloads_root = Path(base_downloads)
        else:
            user_downloads_root = Path.home() / "Downloads" / "TuneFetch"
            
        safe_folder = _sanitize_folder_name(playlist_name)
        target_folder = user_downloads_root / safe_folder
        os.makedirs(target_folder, exist_ok=True)

        with _local_batches_lock:
            _local_batches[batch_id] = {
                "batch_id": batch_id,
                "playlist_name": playlist_name,
                "target_folder": str(target_folder),
                "format_type": format_type,
                "status": "STARTING",
                "total_tracks": len(tracks),
                "completed_tracks": 0,
                "failed_tracks": 0,
                "current_track_title": "",
                "current_index": 0,
                "created_at": time.time(),
                "tracks_progress": [],
                "error": None,
            }

        thread = threading.Thread(
            target=cls._run_batch,
            args=(batch_id, playlist_name, tracks, format_type, target_folder),
            daemon=True,
            name=f"LocalBatch-{batch_id[:8]}"
        )
        thread.start()
        return batch_id

    @classmethod
    def _run_batch(
        cls,
        batch_id: str,
        playlist_name: str,
        tracks: List[Dict[str, Any]],
        format_type: str,
        target_folder: Path,
    ):
        logger.info(f"Starting local batch download '{batch_id}' ({len(tracks)} tracks) into '{target_folder}'.")
        with _local_batches_lock:
            if batch_id in _local_batches:
                _local_batches[batch_id]["status"] = "DOWNLOADING"

        for idx, trk in enumerate(tracks):
            song_name = trk.get("song_name") or trk.get("title") or trk.get("name") or f"Track {idx+1}"
            artist_name = trk.get("artist_name") or trk.get("artist") or ""
            if isinstance(artist_name, list):
                artist_name = ", ".join(artist_name)
            thumbnail = trk.get("thumbnail") or ""
            query_or_url = trk.get("candidate_url") or trk.get("url") or trk.get("search_query") or f"{song_name} {artist_name} audio".strip()

            with _local_batches_lock:
                if batch_id in _local_batches:
                    _local_batches[batch_id]["current_track_title"] = f"{artist_name} - {song_name}" if artist_name else song_name
                    _local_batches[batch_id]["current_index"] = idx + 1

            track_entry = {
                "index": idx + 1,
                "title": song_name,
                "artist": artist_name,
                "status": "DOWNLOADING",
                "filename": None,
                "error": None,
            }

            try:
                # Create and wait for single task download
                task_id = DownloadManager.create_download_task(
                    url=query_or_url,
                    format_type=format_type,
                    custom_title=song_name,
                    custom_artist=artist_name,
                    custom_thumbnail=thumbnail,
                    is_single_download=False,
                )

                # Poll until this task finishes
                max_wait_seconds = 180
                start_wait = time.time()
                finished = False
                while (time.time() - start_wait) < max_wait_seconds:
                    with tasks_lock:
                        t_data = tasks.get(task_id, {})
                        t_status = t_data.get("status")
                        t_filepath = t_data.get("filepath")
                        t_error = t_data.get("error")

                    if t_status == "completed" and t_filepath and os.path.exists(t_filepath):
                        # Copy or move the completed file into user's playlist target folder
                        safe_song = sanitize_filename(song_name, ".mp3")
                        safe_art = sanitize_filename(artist_name, "")
                        final_filename = f"{safe_art} - {safe_song}" if safe_art else safe_song
                        if not final_filename.lower().endswith(".mp3"):
                            final_filename = f"{final_filename}.mp3"
                            
                        dest_file = target_folder / final_filename
                        shutil.copy2(t_filepath, str(dest_file))

                        track_entry["status"] = "COMPLETED"
                        track_entry["filename"] = final_filename
                        with _local_batches_lock:
                            if batch_id in _local_batches:
                                _local_batches[batch_id]["completed_tracks"] += 1
                        finished = True
                        break
                    elif t_status == "error":
                        track_entry["status"] = "ERROR"
                        track_entry["error"] = t_error or "Download failed"
                        with _local_batches_lock:
                            if batch_id in _local_batches:
                                _local_batches[batch_id]["failed_tracks"] += 1
                        finished = True
                        break

                    time.sleep(0.5)

                if not finished:
                    track_entry["status"] = "TIMEOUT"
                    track_entry["error"] = "Track download timed out after 3 minutes"
                    with _local_batches_lock:
                        if batch_id in _local_batches:
                            _local_batches[batch_id]["failed_tracks"] += 1

            except Exception as trk_err:
                logger.error(f"Error downloading track '{song_name}': {trk_err}")
                track_entry["status"] = "ERROR"
                track_entry["error"] = str(trk_err)
                with _local_batches_lock:
                    if batch_id in _local_batches:
                        _local_batches[batch_id]["failed_tracks"] += 1

            with _local_batches_lock:
                if batch_id in _local_batches:
                    _local_batches[batch_id]["tracks_progress"].append(track_entry)

        with _local_batches_lock:
            if batch_id in _local_batches:
                _local_batches[batch_id]["status"] = "COMPLETED"
                _local_batches[batch_id]["current_track_title"] = "All downloads finished!"
        logger.info(f"Local batch '{batch_id}' finished into '{target_folder}'.")

    @classmethod
    def get_batch_status(cls, batch_id: str) -> Optional[Dict[str, Any]]:
        with _local_batches_lock:
            return _local_batches.get(batch_id)
