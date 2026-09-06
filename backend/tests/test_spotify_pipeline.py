import os
import json
import asyncio
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.db_models import User, SpotifyAccount, PlaylistDownloadJob
from app.utils.auth_helper import encrypt_token, decrypt_token
from app.services.spotify_service import SpotifyService, _pkce_store
from app.services.serper_service import SerperService
from app.services.playlist_pipeline import PlaylistPipeline

# In-memory SQLite database for fast unit & pipeline testing
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=test_engine)

# 1. Test PKCE & Auth URL Generation
def test_spotify_auth_url_generation():
    with patch("app.services.spotify_service.SPOTIFY_CLIENT_ID", "test_client_id_123"):
        auth_url = SpotifyService.create_auth_url("user-abc-123")
        assert "accounts.spotify.com/authorize" in auth_url
        assert "client_id=test_client_id_123" in auth_url
        assert "code_challenge_method=S256" in auth_url
        assert "code_challenge=" in auth_url
        assert "state=" in auth_url
        assert "playlist-read-private" in auth_url

# 2. Test Token Encryption & Decryption at Rest
def test_token_encryption_at_rest():
    secret_token = "BQA123456789_very_sensitive_spotify_refresh_token"
    encrypted = encrypt_token(secret_token)
    assert encrypted != secret_token
    assert len(encrypted) > 20
    decrypted = decrypt_token(encrypted)
    assert decrypted == secret_token

# 3. Test Token Refresh Logic
def test_spotify_token_auto_refresh(db_session):
    async def _test():
        user = User(id="user-1")
        db_session.add(user)
        db_session.commit()

        # Expired token in DB
        expired_time = datetime.now(timezone.utc) - timedelta(minutes=10)
        account = SpotifyAccount(
            user_id="user-1",
            spotify_user_id="spotify-user-1",
            display_name="Test User",
            access_token=encrypt_token("old_expired_access_token"),
            refresh_token=encrypt_token("valid_refresh_token"),
            expires_at=expired_time
        )
        db_session.add(account)
        db_session.commit()

        mock_refresh_response = {
            "access_token": "new_refreshed_access_token_xyz",
            "expires_in": 3600
        }

        with patch("httpx.AsyncClient.post") as mock_post:
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            mock_resp.json.return_value = mock_refresh_response
            mock_post.return_value = mock_resp

            fresh_token = await SpotifyService.get_valid_access_token("user-1", db_session)
            assert fresh_token == "new_refreshed_access_token_xyz"

            # Verify DB was updated with new token and future expiration
            db_account = db_session.query(SpotifyAccount).filter(SpotifyAccount.user_id == "user-1").first()
            assert decrypt_token(db_account.access_token) == "new_refreshed_access_token_xyz"
            acc_exp = db_account.expires_at.replace(tzinfo=timezone.utc) if db_account.expires_at.tzinfo is None else db_account.expires_at
            assert acc_exp > datetime.now(timezone.utc)

    asyncio.run(_test())

# 4. Test Spotify 1400+ Track Pagination & Invalid Track Filtering
def test_spotify_pagination_and_track_extraction(db_session):
    async def _test():
        user = User(id="user-2")
        account = SpotifyAccount(
            user_id="user-2",
            spotify_user_id="spotify-user-2",
            access_token=encrypt_token("valid_token"),
            refresh_token=encrypt_token("refresh_token"),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
        )
        db_session.add_all([user, account])
        db_session.commit()

        page1_items = [
            {"track": {"id": "t1", "name": "Song 1", "type": "track", "artists": [{"name": "Artist A"}], "duration_ms": 180000}},
            {"track": None}, # Null item
            {"track": {"id": "t2", "name": "Podcast Ep", "type": "episode", "artists": []}}, # Invalid episode
        ]
        page2_items = [
            {"track": {"id": "t3", "name": "Song 2", "type": "track", "artists": [{"name": "Artist B"}, {"name": "Artist C"}], "duration_ms": 210000}},
        ]

        async def mock_get(url, headers):
            mock_resp = MagicMock()
            mock_resp.status_code = 200
            if "playlists/test_pl?fields" in url:
                mock_resp.json.return_value = {"name": "My Mega 1400 Songs Playlist", "images": [{"url": "https://img.jpg"}]}
            elif "offset=0" in url or ("tracks?limit=100" in url and "offset" not in url):
                mock_resp.json.return_value = {"items": page1_items, "next": "https://api.spotify.com/v1/playlists/test_pl/tracks?limit=100&offset=100"}
            else:
                mock_resp.json.return_value = {"items": page2_items, "next": None}
            return mock_resp

        with patch("httpx.AsyncClient.get", side_effect=mock_get):
            result = await SpotifyService.get_playlist_tracks("user-2", "test_pl", db_session)
            assert result["name"] == "My Mega 1400 Songs Playlist"
            assert result["total_tracks"] == 2 # Filtered out null and episode
            assert result["tracks"][0]["name"] == "Song 1"
            assert result["tracks"][0]["artist"] == "Artist A"
            assert result["tracks"][1]["name"] == "Song 2"
            assert result["tracks"][1]["artists"] == ["Artist B", "Artist C"]
            assert result["tracks"][1]["search_query"] == "Song 2 Artist B Artist C audio"

    asyncio.run(_test())

# 5. Test Serper Search Query Construction & Candidate URL Filter
def test_serper_service_search_and_fallback():
    async def _test():
        query = SerperService.construct_search_query("Blinding Lights", ["The Weeknd"])
        assert query == "Blinding Lights The Weeknd audio"

        # Test Serper API candidate matching
        mock_serper_response = {
            "videos": [
                {"title": "The Weeknd - Blinding Lights (Official Video)", "link": "https://www.youtube.com/watch?v=4NRXx6U8ABQ"}
            ]
        }

        with patch("app.services.serper_service.SERPER_API_KEY", "test_serper_key"):
            with patch("httpx.AsyncClient.post") as mock_post:
                mock_resp = MagicMock()
                mock_resp.status_code = 200
                mock_resp.json.return_value = mock_serper_response
                mock_post.return_value = mock_resp

                url = await SerperService.find_best_audio_url("Blinding Lights", ["The Weeknd"])
                assert url == "https://www.youtube.com/watch?v=4NRXx6U8ABQ"

        # Test fallback when Serper is not configured
        with patch("app.services.serper_service.SERPER_API_KEY", ""):
            fallback_url = await SerperService.find_best_audio_url("Blinding Lights", ["The Weeknd"])
            assert fallback_url == "ytsearch1:Blinding Lights The Weeknd audio"

    asyncio.run(_test())

# 6. Test Multi-User Isolation (User A cannot access User B's Spotify or jobs)
def test_multi_user_isolation(db_session):
    user_a = User(id="user-a")
    user_b = User(id="user-b")
    db_session.add_all([user_a, user_b])
    db_session.commit()

    # User A connects Spotify
    acc_a = SpotifyAccount(
        user_id="user-a",
        spotify_user_id="spotify-a",
        access_token=encrypt_token("tok-a"),
        refresh_token=encrypt_token("ref-a"),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
    )
    # User A creates a download job
    job_a = PlaylistDownloadJob(
        id="job-a-1",
        user_id="user-a",
        playlist_id="pl-a",
        playlist_name="Playlist A",
        status="PROCESSING"
    )
    db_session.add_all([acc_a, job_a])
    db_session.commit()

    # User B tries to query User A's job
    job_status_for_b = PlaylistPipeline.get_job_status("job-a-1", user_id="user-b", db=db_session)
    assert job_status_for_b is None # User B cannot access User A's job

    # User A queries their own job
    job_status_for_a = PlaylistPipeline.get_job_status("job-a-1", user_id="user-a", db=db_session)
    assert job_status_for_a is not None
    assert job_status_for_a["playlist_name"] == "Playlist A"
