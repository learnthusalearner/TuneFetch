import re
import logging
from typing import List, Union, Optional
import httpx
from sqlalchemy.orm import Session

from app.core.config import SERPER_API_KEY
from app.models.db_models import ResolvedSong

logger = logging.getLogger("serper_service")

# Preferred patterns for yt-dlp supported video URLs
YOUTUBE_WATCH_REGEX = re.compile(r"https?://(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)([\w-]+)", re.IGNORECASE)

class SerperService:
    @staticmethod
    def construct_search_query(song_name: str, artists: Union[List[str], str]) -> str:
        """
        Builds the programmatic Serper query:
        site:youtube.com/watch "song name" "artist name"
        """
        if isinstance(artists, list):
            artist_str = " ".join(artists) if artists else ""
        else:
            artist_str = (artists or "").strip()

        clean_song = song_name.replace('"', '').strip()
        clean_artist = artist_str.replace('"', '').strip()

        if clean_artist:
            return f'site:youtube.com/watch "{clean_song}" "{clean_artist}"'
        return f'site:youtube.com/watch "{clean_song}"'

    @staticmethod
    async def find_best_audio_url(
        song_name: str,
        artists: Union[List[str], str],
        db: Optional[Session] = None
    ) -> str:
        """
        Retrieves candidate YouTube URL for a song.
        1. Checks database cache (matching BOTH song_name and artist_name).
           If matched, uses directly from database without calling Serper API.
        2. If not found, calls Serper API: site:youtube.com/watch "song name" "artist name"
        3. Caches the newly resolved URL into PostgreSQL for future instant reuse.
        """
        clean_song = song_name.strip()
        if isinstance(artists, list):
            clean_artist = ", ".join([a.strip() for a in artists if a.strip()])
        else:
            clean_artist = (artists or "").strip()

        song_key = clean_song.lower()
        artist_key = clean_artist.lower()

        # Step 1: Check database cache for exact match on both song name and artist
        if db:
            try:
                cached = db.query(ResolvedSong).filter(
                    ResolvedSong.song_name_clean == song_key,
                    ResolvedSong.artist_name_clean == artist_key
                ).first()
                if cached and cached.candidate_url:
                    # Developer fixed URL takes absolute highest priority
                    if getattr(cached, "developer_fixed", False):
                        logger.info(f"[DB Developer Override Hit] Using developer-fixed URL for '{clean_song}' by '{clean_artist}': {cached.candidate_url}")
                        return cached.candidate_url
                    # Non-flagged valid cache hit
                    elif not getattr(cached, "is_flagged", False):
                        logger.info(f"[DB Cache Hit] Reusing stored candidate URL for '{clean_song}' by '{clean_artist}': {cached.candidate_url}")
                        return cached.candidate_url
                    else:
                        logger.warning(f"[DB Cache Flagged] Song '{clean_song}' by '{clean_artist}' was flagged broken. Re-querying Serper API for a fresh candidate URL.")
            except Exception as db_err:
                logger.warning(f"Error reading from resolved_songs DB cache: {db_err}")

        # If not cached, SERPER_API_KEY is strictly required to resolve candidate streams
        if not SERPER_API_KEY or not SERPER_API_KEY.strip():
            err_msg = "Serper API key is missing and will not be able to proceed further. Sorry, please provide me one."
            logger.error(err_msg)
            raise ValueError(err_msg)

        # Step 2: Query Serper API
        query = SerperService.construct_search_query(clean_song, clean_artist)
        candidate_url = None

        try:
            headers = {
                "X-API-KEY": SERPER_API_KEY.strip(),
                "Content-Type": "application/json"
            }
            payload = {
                "q": query,
                "num": 5
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    "https://google.serper.dev/search",
                    headers=headers,
                    json=payload
                )

                if resp.status_code == 200:
                    data = resp.json()
                    for item in data.get("organic", []):
                        link = item.get("link", "")
                        if YOUTUBE_WATCH_REGEX.search(link):
                            logger.info(f"Serper resolved candidate URL for '{query}': {link}")
                            candidate_url = link
                            break

                # Secondary fallback: video search endpoint
                if not candidate_url:
                    video_resp = await client.post(
                        "https://google.serper.dev/videos",
                        headers=headers,
                        json={"q": f"{clean_song} {clean_artist} audio", "num": 5}
                    )
                    if video_resp.status_code == 200:
                        v_data = video_resp.json()
                        for v in v_data.get("videos", []):
                            link = v.get("link", "")
                            if YOUTUBE_WATCH_REGEX.search(link):
                                logger.info(f"Serper video endpoint resolved candidate URL for '{query}': {link}")
                                candidate_url = link
                                break

        except Exception as e:
            logger.error(f"Serper API query failed for '{query}': {e}")
            raise RuntimeError(f"Serper API query failed for '{query}': {e}")

        if not candidate_url:
            raise RuntimeError(f"Could not resolve candidate audio URL for '{clean_song}' by '{clean_artist}'.")

        # Step 3: Cache the resolved URL into PostgreSQL database
        if db and candidate_url:
            try:
                cached_entry = db.query(ResolvedSong).filter(
                    ResolvedSong.song_name_clean == song_key,
                    ResolvedSong.artist_name_clean == artist_key
                ).first()
                if not cached_entry:
                    cached_entry = ResolvedSong(
                        song_name=clean_song,
                        artist_name=clean_artist,
                        song_name_clean=song_key,
                        artist_name_clean=artist_key,
                        candidate_url=candidate_url,
                        is_flagged=False
                    )
                    db.add(cached_entry)
                else:
                    cached_entry.candidate_url = candidate_url
                    cached_entry.is_flagged = False
                db.commit()
                logger.info(f"[DB Cache Stored] Saved '{clean_song}' by '{clean_artist}' -> {candidate_url}")
            except Exception as save_err:
                logger.warning(f"Error persisting resolved song to DB cache: {save_err}")
                db.rollback()

        return candidate_url

    @staticmethod
    def report_broken_track(song_name: str, artist_name: str, error_message: str, db: Session) -> dict:
        """
        Flags a track in the database as broken when a download failure occurs,
        notifying developers for inspection and URL replacement.
        """
        clean_song = song_name.strip()
        clean_artist = (artist_name or "").strip()
        song_key = clean_song.lower()
        artist_key = clean_artist.lower()

        try:
            record = db.query(ResolvedSong).filter(
                ResolvedSong.song_name_clean == song_key,
                ResolvedSong.artist_name_clean == artist_key
            ).first()

            if not record:
                record = ResolvedSong(
                    song_name=clean_song,
                    artist_name=clean_artist,
                    song_name_clean=song_key,
                    artist_name_clean=artist_key,
                    candidate_url="",
                    is_flagged=True,
                    flag_reason=error_message[:500],
                    developer_fixed=False
                )
                db.add(record)
            else:
                record.is_flagged = True
                record.flag_reason = error_message[:500]
                record.developer_fixed = False

            db.commit()
            logger.warning(f"[BROKEN TRACK REPORTED] Song: '{clean_song}' by '{clean_artist}' flagged for developer review. Error: {error_message}")
            return {"status": "reported", "song": clean_song, "artist": clean_artist}
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to flag broken track '{clean_song}': {e}")
            return {"status": "error", "message": str(e)}

    @staticmethod
    def apply_developer_fix(song_name: str, artist_name: str, new_candidate_url: str, db: Session) -> dict:
        """
        Updates the candidate URL for a song, unflagging it and marking it as developer-fixed.
        Subsequent downloads by any user will instantly use this developer-provided URL!
        """
        clean_song = song_name.strip()
        clean_artist = (artist_name or "").strip()
        song_key = clean_song.lower()
        artist_key = clean_artist.lower()

        try:
            record = db.query(ResolvedSong).filter(
                ResolvedSong.song_name_clean == song_key,
                ResolvedSong.artist_name_clean == artist_key
            ).first()

            if not record:
                record = ResolvedSong(
                    song_name=clean_song,
                    artist_name=clean_artist,
                    song_name_clean=song_key,
                    artist_name_clean=artist_key,
                    candidate_url=new_candidate_url.strip(),
                    is_flagged=False,
                    flag_reason=None,
                    developer_fixed=True
                )
                db.add(record)
            else:
                record.candidate_url = new_candidate_url.strip()
                record.is_flagged = False
                record.flag_reason = None
                record.developer_fixed = True

            db.commit()
            logger.info(f"[DEVELOPER FIX APPLIED] Song: '{clean_song}' by '{clean_artist}' updated to URL: {new_candidate_url}")
            return {"status": "success", "message": f"Updated '{clean_song}' candidate URL to {new_candidate_url}"}
        except Exception as e:
            db.rollback()
            logger.error(f"Failed applying developer fix for '{clean_song}': {e}")
            return {"status": "error", "message": str(e)}
