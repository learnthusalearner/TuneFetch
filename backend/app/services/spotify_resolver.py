import re
import json
import logging
import requests
from bs4 import BeautifulSoup
from typing import Dict, Any, List, Optional

logger = logging.getLogger("spotify_resolver")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def is_spotify_url(url: str) -> bool:
    return "spotify.com" in url or "spotify:" in url

def parse_spotify_type_and_id(url: str) -> tuple[Optional[str], Optional[str]]:
    # Handle open.spotify.com/track/id or spotify:track:id
    match = re.search(r"(track|playlist|album)[/:]([a-zA-Z0-9]+)", url)
    if match:
        return match.group(1), match.group(2)
    return None, None

def resolve_spotify_track(url: str) -> Dict[str, Any]:
    """
    Extracts metadata from a Spotify track URL and builds a search query.
    """
    item_type, item_id = parse_spotify_type_and_id(url)
    title = "Unknown Track"
    artist = "Unknown Artist"
    thumbnail = ""
    duration_seconds = 0

    # 1. Try Spotify oEmbed endpoint first
    try:
        oembed_url = f"https://open.spotify.com/oembed?url={url}"
        resp = requests.get(oembed_url, headers=HEADERS, timeout=8)
        if resp.status_code == 200:
            data = resp.json()
            title = data.get("title", title)
            thumbnail = data.get("thumbnail_url", thumbnail)
    except Exception as e:
        logger.warning(f"Spotify oEmbed fetch failed: {e}")

    # 2. Scrape embed or open page for detailed artist & metadata
    if item_type and item_id:
        try:
            embed_url = f"https://open.spotify.com/embed/{item_type}/{item_id}"
            resp = requests.get(embed_url, headers=HEADERS, timeout=8)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                next_data = soup.find("script", id="__NEXT_DATA__")
                if next_data and next_data.string:
                    json_data = json.loads(next_data.string)
                    entity = json_data.get("props", {}).get("pageProps", {}).get("state", {}).get("data", {}).get("entity", {})
                    if entity:
                        title = entity.get("name", title)
                        artists = [a.get("name") for a in entity.get("artists", []) if a.get("name")]
                        if artists:
                            artist = ", ".join(artists)
                        duration_ms = entity.get("duration", 0)
                        if duration_ms:
                            duration_seconds = int(duration_ms / 1000)
                        cover_arts = entity.get("coverArt", {}).get("sources", [])
                        if cover_arts:
                            thumbnail = cover_arts[-1].get("url", thumbnail)
                else:
                    # Fallback to OG tags
                    og_title = soup.find("meta", property="og:title")
                    og_desc = soup.find("meta", property="og:description")
                    og_image = soup.find("meta", property="og:image")
                    if og_title and og_title.get("content"):
                        title = og_title["content"]
                    if og_desc and og_desc.get("content"):
                        artist = og_desc["content"]
                    if og_image and og_image.get("content"):
                        thumbnail = og_image["content"]
        except Exception as e:
            logger.warning(f"Spotify embed scrape error: {e}")

    # Clean title/artist if title has "Artist - Song" format
    search_query = f"{artist} - {title} audio" if artist != "Unknown Artist" and artist not in title else f"{title} audio"

    return {
        "title": title,
        "artist": artist,
        "thumbnail": thumbnail,
        "duration": duration_seconds,
        "search_query": search_query,
        "spotify_url": url,
        "type": "track"
    }

def resolve_spotify_playlist_or_album(url: str) -> Dict[str, Any]:
    """
    Extracts tracklist from a Spotify Playlist or Album.
    """
    item_type, item_id = parse_spotify_type_and_id(url)
    tracks: List[Dict[str, Any]] = []
    playlist_title = "Spotify Playlist"
    thumbnail = ""

    # Scrape embed page
    if item_type and item_id:
        try:
            embed_url = f"https://open.spotify.com/embed/{item_type}/{item_id}"
            resp = requests.get(embed_url, headers=HEADERS, timeout=10)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                next_data = soup.find("script", id="__NEXT_DATA__")
                if next_data and next_data.string:
                    json_data = json.loads(next_data.string)
                    entity = json_data.get("props", {}).get("pageProps", {}).get("state", {}).get("data", {}).get("entity", {})
                    if entity:
                        playlist_title = entity.get("name", playlist_title)
                        cover_arts = entity.get("coverArt", {}).get("sources", [])
                        if cover_arts:
                            thumbnail = cover_arts[-1].get("url", thumbnail)
                        
                        raw_tracklist = entity.get("trackList", [])
                        for idx, item in enumerate(raw_tracklist):
                            t_title = item.get("title", f"Track {idx+1}")
                            t_subtitle = item.get("subtitle", "")
                            t_duration_ms = item.get("duration", 0)
                            t_query = f"{t_subtitle} - {t_title} audio" if t_subtitle else f"{t_title} audio"
                            tracks.append({
                                "id": idx,
                                "title": t_title,
                                "artist": t_subtitle,
                                "duration": int(t_duration_ms / 1000) if t_duration_ms else 0,
                                "search_query": t_query,
                                "thumbnail": thumbnail
                            })
        except Exception as e:
            logger.warning(f"Spotify playlist embed parse error: {e}")

    # Fallback to oembed if title/thumbnail missing
    if not thumbnail or playlist_title == "Spotify Playlist":
        try:
            oembed_url = f"https://open.spotify.com/oembed?url={url}"
            resp = requests.get(oembed_url, headers=HEADERS, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                playlist_title = data.get("title", playlist_title)
                thumbnail = data.get("thumbnail_url", thumbnail)
        except Exception:
            pass

    return {
        "title": playlist_title,
        "type": item_type or "playlist",
        "thumbnail": thumbnail,
        "track_count": len(tracks),
        "tracks": tracks,
        "spotify_url": url
    }
