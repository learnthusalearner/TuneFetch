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

def _report_broken_track_to_backend(song_name: str, artist_name: str, error_msg: str):
    """
    Sends a POST notification to the production database flagging broken tracks
    so the developer can replace the URL.
    """
    try:
        from app.core.database import SessionLocal
        from app.services.serper_service import SerperService
        db = SessionLocal()
        try:
            SerperService.report_broken_track(song_name, artist_name, error_msg, db)
        finally:
            db.close()
    except Exception:
        pass

    try:
        import httpx
        prod_url = "https://tune-fetch-production.up.railway.app/spotify/tracks/report-broken"
        httpx.post(
            prod_url,
            json={"song_name": song_name, "artist_name": artist_name, "error_message": error_msg},
            timeout=5.0
        )
    except Exception:
        pass

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
            user_downloads_root = Path.home() / "Downloads" / "Thanks for downloading"
            
        safe_folder = _sanitize_folder_name(playlist_name)
        target_folder = user_downloads_root / safe_folder
        os.makedirs(target_folder, exist_ok=True)

        initial_tracks = []
        for i, trk in enumerate(tracks):
            s_name = trk.get("song_name") or trk.get("title") or trk.get("name") or f"Track {i+1}"
            a_name = trk.get("artist_name") or trk.get("artist") or ""
            if isinstance(a_name, list):
                a_name = ", ".join(a_name)
            initial_tracks.append({
                "index": i + 1,
                "title": s_name,
                "artist": a_name,
                "status": "QUEUED",
                "progress": 0.0,
                "speed": "--",
                "eta": "--",
                "filename": None,
                "error": None,
            })

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
                "current_track_progress": 0.0,
                "current_track_speed": "0 KB/s",
                "current_track_eta": "--",
                "overall_progress": 0.0,
                "current_index": 0,
                "created_at": time.time(),
                "start_time": time.time(),
                "elapsed_seconds": 0,
                "estimated_remaining_seconds": max(10, len(tracks) * 10),
                "seconds_per_track": 10.0,
                "tracks_progress": initial_tracks,
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

        total_cnt = max(1, len(tracks))

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
                    _local_batches[batch_id]["current_track_progress"] = 0.0
                    _local_batches[batch_id]["current_track_speed"] = "0 KB/s"
                    _local_batches[batch_id]["current_track_eta"] = "--"
                    if idx < len(_local_batches[batch_id]["tracks_progress"]):
                        _local_batches[batch_id]["tracks_progress"][idx]["status"] = "DOWNLOADING"

            try:
                # Create single task download
                task_id = DownloadManager.create_download_task(
                    url=query_or_url,
                    format_type=format_type,
                    custom_title=song_name,
                    custom_artist=artist_name,
                    custom_thumbnail=thumbnail,
                    is_single_download=False,
                )

                # Poll until this task finishes, streaming live progress & speed
                max_wait_seconds = 180
                start_wait = time.time()
                finished = False
                while (time.time() - start_wait) < max_wait_seconds:
                    with tasks_lock:
                        t_data = tasks.get(task_id, {})
                        t_status = t_data.get("status")
                        t_filepath = t_data.get("filepath")
                        t_error = t_data.get("error")
                        t_progress = float(t_data.get("progress", 0.0) or 0.0)
                        t_speed = str(t_data.get("speed", "0 KB/s"))
                        t_eta = str(t_data.get("eta", "--"))

                    # Update live batch metrics
                    with _local_batches_lock:
                        if batch_id in _local_batches:
                            b = _local_batches[batch_id]
                            b["current_track_progress"] = t_progress
                            b["current_track_speed"] = t_speed
                            b["current_track_eta"] = t_eta
                            comp = b["completed_tracks"]
                            b["overall_progress"] = min(100.0, round(((comp + (t_progress / 100.0)) / total_cnt) * 100, 1))
                            if idx < len(b["tracks_progress"]):
                                b["tracks_progress"][idx]["progress"] = t_progress
                                b["tracks_progress"][idx]["speed"] = t_speed
                                b["tracks_progress"][idx]["eta"] = t_eta

                    if t_status == "completed" and t_filepath and os.path.exists(t_filepath):
                        # Copy completed file into user's playlist target folder
                        safe_song = sanitize_filename(song_name, ".mp3")
                        safe_art = sanitize_filename(artist_name, "")
                        final_filename = f"{safe_art} - {safe_song}" if safe_art else safe_song
                        if not final_filename.lower().endswith(".mp3"):
                            final_filename = f"{final_filename}.mp3"

                        dest_file = target_folder / final_filename
                        shutil.copy2(t_filepath, str(dest_file))

                        with _local_batches_lock:
                            if batch_id in _local_batches:
                                b = _local_batches[batch_id]
                                b["completed_tracks"] += 1
                                b["current_track_progress"] = 100.0
                                comp = b["completed_tracks"]
                                b["overall_progress"] = min(100.0, round((comp / total_cnt) * 100, 1))
                                if idx < len(b["tracks_progress"]):
                                    b["tracks_progress"][idx]["status"] = "COMPLETED"
                                    b["tracks_progress"][idx]["progress"] = 100.0
                                    b["tracks_progress"][idx]["filename"] = final_filename
                        finished = True
                        break

                    elif t_status == "error":
                        _report_broken_track_to_backend(song_name, artist_name, t_error or "Download failed")
                        with _local_batches_lock:
                            if batch_id in _local_batches:
                                b = _local_batches[batch_id]
                                b["failed_tracks"] += 1
                                if idx < len(b["tracks_progress"]):
                                    b["tracks_progress"][idx]["status"] = "ERROR"
                                    b["tracks_progress"][idx]["error"] = "Facing download issue. A notification has been sent to the developer for a URL fix."
                        finished = True
                        break

                    time.sleep(0.4)

                if not finished:
                    _report_broken_track_to_backend(song_name, artist_name, "Download timeout after 3 minutes")
                    with _local_batches_lock:
                        if batch_id in _local_batches:
                            b = _local_batches[batch_id]
                            b["failed_tracks"] += 1
                            if idx < len(b["tracks_progress"]):
                                b["tracks_progress"][idx]["status"] = "TIMEOUT"
                                b["tracks_progress"][idx]["error"] = "Facing download issue. A notification has been sent to the developer for a URL fix."

            except Exception as trk_err:
                logger.error(f"Error downloading track '{song_name}': {trk_err}")
                _report_broken_track_to_backend(song_name, artist_name, str(trk_err))
                with _local_batches_lock:
                    if batch_id in _local_batches:
                        b = _local_batches[batch_id]
                        b["failed_tracks"] += 1
                        if idx < len(b["tracks_progress"]):
                            b["tracks_progress"][idx]["status"] = "ERROR"
                            b["tracks_progress"][idx]["error"] = "Facing download issue. A notification has been sent to the developer for a URL fix."

        with _local_batches_lock:
            if batch_id in _local_batches:
                _local_batches[batch_id]["status"] = "COMPLETED"
                _local_batches[batch_id]["current_track_title"] = "All downloads finished!"
                _local_batches[batch_id]["overall_progress"] = 100.0
                _local_batches[batch_id]["current_track_progress"] = 100.0
                _local_batches[batch_id]["estimated_remaining_seconds"] = 0
        logger.info(f"Local batch '{batch_id}' finished into '{target_folder}'.")

    @classmethod
    def get_batch_status(cls, batch_id: str) -> Optional[Dict[str, Any]]:
        with _local_batches_lock:
            batch = _local_batches.get(batch_id)
            if not batch:
                return None
            data = dict(batch)
            data["tracks_progress"] = [dict(t) for t in batch.get("tracks_progress", [])]
            
            if data.get("start_time"):
                if data.get("status") == "DOWNLOADING":
                    elapsed = max(0.0, time.time() - data["start_time"])
                    data["elapsed_seconds"] = round(elapsed, 1)
                    completed = data.get("completed_tracks", 0)
                    total = max(1, data.get("total_tracks", 0))
                    cur_prog = data.get("current_track_progress", 0.0)
                    eff_completed = completed + (cur_prog / 100.0)
                    eff_remaining = max(0.0, total - eff_completed)

                    if eff_completed > 0.05:
                        avg_per_track = elapsed / eff_completed
                        data["estimated_remaining_seconds"] = max(0, round(avg_per_track * eff_remaining))
                        data["seconds_per_track"] = round(avg_per_track, 1)
                    else:
                        data["estimated_remaining_seconds"] = max(0, round((total - completed) * 10))
                        data["seconds_per_track"] = 10.0

                    data["overall_progress"] = min(100.0, round((eff_completed / total) * 100, 1))

                elif data.get("status") == "COMPLETED":
                    data["estimated_remaining_seconds"] = 0
                    data["overall_progress"] = 100.0
                    if not data.get("elapsed_seconds"):
                        data["elapsed_seconds"] = round(time.time() - data["start_time"], 1)
            return data
