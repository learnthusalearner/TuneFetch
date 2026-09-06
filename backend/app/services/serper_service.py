import re
import logging
from typing import List, Optional
import httpx

from app.core.config import SERPER_API_KEY

logger = logging.getLogger("serper_service")

# Regex pattern for preferred yt-dlp media sources
PREFERRED_DOMAINS = [
    r"https?://(?:www\.)?youtube\.com/watch\?v=[\w-]+",
    r"https?://(?:www\.)?music\.youtube\.com/watch\?v=[\w-]+",
    r"https?://youtu\.be/[\w-]+",
    r"https?://(?:www\.)?soundcloud\.com/[\w-]+/[\w-]+",
]

class SerperService:
    @staticmethod
    def construct_search_query(song_name: str, artists: List[str]) -> str:
        """Builds a refined search query string from song metadata."""
        artists_str = " ".join(artists) if artists else ""
        return f"{song_name} {artists_str} audio".strip()

    @staticmethod
    async def find_best_audio_url(song_name: str, artists: List[str]) -> str:
        """
        Queries Serper API to find a high-relevance video/audio URL for yt-dlp.
        Falls back to direct ytsearch syntax if Serper API key is missing or encounters rate limits.
        """
        query = SerperService.construct_search_query(song_name, artists)

        # Fallback if no Serper API key configured
        if not SERPER_API_KEY:
            logger.info(f"SERPER_API_KEY not configured. Defaulting to ytsearch query: '{query}'")
            return f"ytsearch1:{query}"

        try:
            headers = {
                "X-API-KEY": SERPER_API_KEY,
                "Content-Type": "application/json"
            }
            payload = {
                "q": f"{query} site:youtube.com OR site:soundcloud.com",
                "num": 5
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                # 1. Search Videos first for high relevance
                resp = await client.post(
                    "https://google.serper.dev/videos",
                    headers=headers,
                    json={"q": query, "num": 5}
                )

                candidate_urls: List[str] = []
                if resp.status_code == 200:
                    data = resp.json()
                    videos = data.get("videos", [])
                    for v in videos:
                        link = v.get("link")
                        if link:
                            candidate_urls.append(link)

                # 2. Search Organic if video search returned nothing
                if not candidate_urls:
                    resp_org = await client.post(
                        "https://google.serper.dev/search",
                        headers=headers,
                        json=payload
                    )
                    if resp_org.status_code == 200:
                        org_data = resp_org.json()
                        for item in org_data.get("organic", []):
                            link = item.get("link")
                            if link:
                                candidate_urls.append(link)

                # 3. Filter candidates for valid yt-dlp supported audio URLs
                for cand in candidate_urls:
                    for pattern in PREFERRED_DOMAINS:
                        if re.match(pattern, cand, re.IGNORECASE):
                            logger.info(f"Serper matched candidate URL for '{query}': {cand}")
                            return cand

        except Exception as e:
            logger.warning(f"Serper API query failed for '{query}': {e}. Falling back to ytsearch.")

        # Reliable fallback if Serper found no direct matching links
        return f"ytsearch1:{query}"
