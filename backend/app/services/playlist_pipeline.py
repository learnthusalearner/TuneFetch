import json
import time
import asyncio
import logging
import threading
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

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
        format_type: str = "mp3-320"
    ) -> str:
        """
        Creates a PlaylistDownloadJob record in Neon PostgreSQL and launches the asynchronous pipeline.
        """
        db = SessionLocal()
        try:
            # 1. Fetch all tracks from Spotify
            playlist_data = await SpotifyService.get_playlist_tracks(user_id, playlist_id, db)
            tracks = playlist_data.get("tracks", [])
            playlist_name = playlist_data.get("name", "Spotify Playlist")

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
        Track Metadata -> Serper API -> Candidate URL -> EXISTING yt-dlp Downloader.
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

            processed = 0
            successful = 0
            failed = 0

            for idx, track in enumerate(tracks):
                track_name = track.get("name", "Unknown Track")
                artists = track.get("artists", [])
                artist_str = track.get("artist", ", ".join(artists))
                thumb = track.get("thumbnail", "")

                try:
                    # Step 1: Serper Search
                    track["status"] = "SEARCHING"
                    tracks[idx] = track
                    job.tracks_data = json.dumps(tracks)
                    db.commit()

                    candidate_url = await SerperService.find_best_audio_url(track_name, artists)

                    # Step 2: Download via EXISTING yt-dlp DownloadManager
                    track["status"] = "DOWNLOADING"
                    tracks[idx] = track
                    job.tracks_data = json.dumps(tracks)
                    db.commit()

                    task_id = DownloadManager.create_download_task(
                        url=candidate_url,
                        format_type=format_type,
                        custom_title=track_name,
                        custom_artist=artist_str,
                        custom_thumbnail=thumb
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
                            successful += 1
                        elif task_status.get("status") == "error":
                            task_completed = True
                            track["status"] = "FAILED"
                            track["reason"] = task_status.get("error", "Download execution error")
                            failed += 1

                except Exception as e:
                    logger.warning(f"Error processing track '{track_name}': {e}")
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

            job.status = "COMPLETED"
            db.commit()
            logger.info(f"Playlist job {job_id} completed: {successful} successful, {failed} failed out of {processed}.")
        except Exception as e:
            logger.error(f"Fatal error in playlist pipeline {job_id}: {e}", exc_info=True)
            if job:
                job.status = "FAILED"
                db.commit()
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
                current_track = f"{t.get('name')} - {t.get('artist')}"
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
            "current_track": current_track,
            "tracks": tracks_list,
            "created_at": job.created_at.isoformat() if job.created_at else None
        }
