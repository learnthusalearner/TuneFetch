import os
import re
import json
import time
import zipfile
import asyncio
import logging
import threading
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.config import DOWNLOADS_DIR
from app.core.database import SessionLocal
from app.models.db_models import PlaylistDownloadJob
from app.services.spotify_service import SpotifyService
from app.services.serper_service import SerperService
from app.services.downloader import DownloadManager

logger = logging.getLogger("playlist_pipeline")

class PlaylistPipeline:
    @staticmethod
    async def create_and_start_job(
        user_id: str,
        playlist_id: str,
        format_type: str = "mp3-320",
        track_ids: Optional[List[str]] = None
    ) -> str:
        """
        Creates a PlaylistDownloadJob record in Neon PostgreSQL and launches the asynchronous pipeline.
        Optionally filters to specific track_ids.
        """
        db = SessionLocal()
        try:
            # 1. Fetch all tracks from Spotify
            playlist_data = await SpotifyService.get_playlist_tracks(user_id, playlist_id, db)
            all_tracks = playlist_data.get("tracks", [])
            playlist_name = playlist_data.get("name", "Spotify Playlist")

            # Filter tracks if specific track_ids were requested
            if track_ids and len(track_ids) > 0:
                id_set = set(track_ids)
                tracks = [t for t in all_tracks if (t.get("id") in id_set or t.get("spotifyTrackId") in id_set)]
                if not tracks:
                    tracks = all_tracks
            else:
                tracks = all_tracks

            # 2. Initialize job record
            job = PlaylistDownloadJob(
                user_id=user_id,
                playlist_id=playlist_id,
                playlist_name=playlist_name,
                total_tracks=len(tracks),
                processed_tracks=0,
                successful_tracks=0,
                failed_tracks=0,
                status="PROCESSING",
                tracks_data=json.dumps(tracks)
            )
            db.add(job)
            db.commit()
            db.refresh(job)
            job_id = job.id

            # 3. Launch pipeline in a dedicated background worker
            thread = threading.Thread(
                target=PlaylistPipeline._run_pipeline_worker,
                args=(job_id, user_id, tracks, format_type),
                daemon=True,
                name=f"PlaylistWorker-{job_id[:8]}"
            )
            thread.start()

            return job_id
        finally:
            db.close()

    @staticmethod
    def _run_pipeline_worker(
        job_id: str,
        user_id: str,
        tracks: List[Dict[str, Any]],
        format_type: str
    ):
        """
        Worker thread that sequentially processes each track:
        Track Metadata -> Serper API -> Candidate URL saved in DB -> EXISTING yt-dlp Downloader -> Pack into ZIP.
        """
        asyncio.run(PlaylistPipeline._execute_pipeline(job_id, tracks, format_type))

    @staticmethod
    async def _execute_pipeline(
        job_id: str,
        tracks: List[Dict[str, Any]],
        format_type: str
    ):
        db = SessionLocal()
        try:
            job = db.query(PlaylistDownloadJob).filter(PlaylistDownloadJob.id == job_id).first()
            if not job:
                return

            user_id = job.user_id if job else None
            processed = 0
            successful = 0
            failed = 0
            downloaded_files = [] # Tuples of (filepath, display_filename)

            for idx, track in enumerate(tracks):
                song_name = track.get("song_name") or track.get("name") or track.get("title", "Unknown Track")
                artists = track.get("artists", [])
                artist_name = track.get("artist_name") or track.get("artist") or (", ".join(artists) if isinstance(artists, list) else str(artists))
                thumb = track.get("thumbnail", "")

                try:
                    # Step 1: Programmatic Serper Search: site:youtube.com/watch "song name" "artist name"
                    track["status"] = "SEARCHING"
                    tracks[idx] = track
                    job.tracks_data = json.dumps(tracks)
                    db.commit()

                    candidate_url = await SerperService.find_best_audio_url(
                        song_name=song_name,
                        artists=artists if artists else artist_name,
                        db=db
                    )
                    track["candidate_url"] = candidate_url

                    # Step 2: Download via EXISTING yt-dlp DownloadManager
                    track["status"] = "DOWNLOADING"
                    tracks[idx] = track
                    job.tracks_data = json.dumps(tracks)
                    db.commit()

                    task_id = DownloadManager.create_download_task(
                        url=candidate_url,
                        format_type=format_type,
                        custom_title=song_name,
                        custom_artist=artist_name,
                        custom_thumbnail=thumb,
                        user_id=user_id,
                        is_single_download=False
                    )

                    # Poll existing downloader until task finishes
                    task_completed = False
                    while not task_completed:
                        await asyncio.sleep(1.0)
                        task_status = DownloadManager.get_task_status(task_id)
                        if not task_status:
                            continue

                        if task_status.get("status") == "completed":
                            task_completed = True
                            track["status"] = "COMPLETED"
                            track["file_id"] = task_status.get("file_id")
                            track["filename"] = task_status.get("filename")
                            track["filesize"] = task_status.get("filesize")
                            
                            # Retrieve downloaded file on disk with exact song & artist name
                            fpath = DownloadManager.get_task_filepath(task_id)
                            if fpath and os.path.exists(fpath):
                                ext = os.path.splitext(fpath)[1] or (".mp3" if format_type.startswith("mp3") else ".m4a")
                                safe_song = re.sub(r'[\\/*?:"<>|]', "", song_name).strip()
                                safe_artist = re.sub(r'[\\/*?:"<>|]', "", artist_name).strip()

                                if safe_artist and safe_song:
                                    clean_display_name = f"{safe_artist} - {safe_song}{ext}"
                                elif safe_song:
                                    clean_display_name = f"{safe_song}{ext}"
                                else:
                                    clean_display_name = task_status.get("filename") or os.path.basename(fpath)

                                downloaded_files.append((fpath, clean_display_name))

                            successful += 1
                        elif task_status.get("status") == "error":
                            task_completed = True
                            track["status"] = "FAILED"
                            track["reason"] = task_status.get("error", "Download execution error")
                            failed += 1

                except Exception as e:
                    logger.warning(f"Error processing track '{song_name}': {e}")
                    track["status"] = "FAILED"
                    track["reason"] = str(e)
                    failed += 1

                processed += 1
                job.processed_tracks = processed
                job.successful_tracks = successful
                job.failed_tracks = failed
                tracks[idx] = track
                job.tracks_data = json.dumps(tracks)
                db.commit()

            # Step 3: Package all downloaded tracks into a single ZIP file with internal folder Thanks_for_downloading
            if downloaded_files:
                zip_folder_name = "Thanks_for_downloading"
                zip_filename = "Thanks_for_downloading.zip"
                zip_filepath = os.path.join(DOWNLOADS_DIR, f"{job_id}_{zip_filename}")

                try:
                    with zipfile.ZipFile(zip_filepath, "w", compression=zipfile.ZIP_DEFLATED) as zf:
                        used_names = set()
                        for fpath, arcname in downloaded_files:
                            if os.path.exists(fpath):
                                clean_arc = arcname
                                counter = 1
                                while clean_arc in used_names:
                                    base, ext = os.path.splitext(arcname)
                                    clean_arc = f"{base}_{counter}{ext}"
                                    counter += 1
                                used_names.add(clean_arc)
                                
                                # Store each track inside Thanks_for_downloading/ directory in the zip
                                archive_internal_path = f"{zip_folder_name}/{clean_arc}"
                                zf.write(fpath, arcname=archive_internal_path)

                    job.zip_path = zip_filepath
                    job.zip_filename = zip_filename
                    logger.info(f"Successfully created ZIP folder for job {job_id} with folder '{zip_folder_name}': {zip_filepath}")
                except Exception as z_err:
                    logger.error(f"Error creating ZIP archive for job {job_id}: {z_err}", exc_info=True)

            if successful == 0 and failed > 0:
                job.status = "FAILED"
            else:
                job.status = "COMPLETED"
            db.commit()
            logger.info(f"Playlist job {job_id} finished: {successful} successful, {failed} failed out of {processed}.")

            # Automatic ephemeral cookie purge: All songs in the playlist have finished downloading!
            if user_id:
                try:
                    from app.services.user_cookie_store import UserCookieStore
                    UserCookieStore.delete_cookies(user_id)
                    logger.info(f"Purged temporary cookies for user {user_id} after playlist batch download completion.")
                except Exception as c_err:
                    logger.warning(f"Error purging cookies for user {user_id}: {c_err}")
        except Exception as e:
            logger.error(f"Fatal error in playlist pipeline {job_id}: {e}", exc_info=True)
            if job:
                job.status = "FAILED"
                db.commit()
            if user_id:
                try:
                    from app.services.user_cookie_store import UserCookieStore
                    UserCookieStore.delete_cookies(user_id)
                except Exception:
                    pass
        finally:
            db.close()

    @staticmethod
    def get_job_status(job_id: str, user_id: str, db: Session) -> Optional[Dict[str, Any]]:
        """Retrieves real-time status of a playlist download job with user ownership validation."""
        job = db.query(PlaylistDownloadJob).filter(
            PlaylistDownloadJob.id == job_id,
            PlaylistDownloadJob.user_id == user_id
        ).first()

        if not job:
            return None

        tracks_list = []
        if job.tracks_data:
            try:
                tracks_list = json.loads(job.tracks_data)
            except Exception:
                pass

        # Identify currently active track
        current_track = None
        for t in tracks_list:
            if t.get("status") in ["SEARCHING", "DOWNLOADING"]:
                name = t.get("song_name") or t.get("name")
                artist = t.get("artist_name") or t.get("artist")
                current_track = f"{name} - {artist}"
                break

        has_zip = bool(job.zip_path and os.path.exists(job.zip_path))

        # Dynamic ETA calculation (in seconds)
        eta_seconds = None
        if job.status == "PROCESSING":
            remaining = max(0, job.total_tracks - (job.processed_tracks or 0))
            if job.processed_tracks and job.processed_tracks > 0 and job.created_at:
                now_utc = datetime.now(timezone.utc)
                elapsed = max(1.0, (now_utc - job.created_at).total_seconds())
                avg_per_track = elapsed / job.processed_tracks
                eta_seconds = int(avg_per_track * remaining)
            else:
                eta_seconds = int(7.0 * remaining)
        elif job.status == "COMPLETED":
            eta_seconds = 0

        job_error = None
        if job.status == "FAILED":
            for t in tracks_list:
                if t.get("status") == "FAILED" and t.get("reason"):
                    job_error = t.get("reason")
                    break

        return {
            "id": job.id,
            "playlist_id": job.playlist_id,
            "playlist_name": job.playlist_name,
            "total_tracks": job.total_tracks,
            "processed_tracks": job.processed_tracks,
            "successful_tracks": job.successful_tracks,
            "failed_tracks": job.failed_tracks,
            "status": job.status,
            "error": job_error,
            "current_track": current_track,
            "eta_seconds": eta_seconds,
            "zip_available": has_zip,
            "zip_filename": job.zip_filename or "Thanks_for_downloading.zip",
            "zip_download_url": f"/spotify/jobs/{job.id}/zip" if has_zip else None,
            "tracks": tracks_list,
            "created_at": job.created_at.isoformat() if job.created_at else None
        }
