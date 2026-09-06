import os
import json
import asyncio
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch, MagicMock
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.db_models import User, SpotifyAccount, PlaylistDownloadJob
from app.utils.auth_helper import encrypt_token, decrypt_token, sign_session_id, SESSION_COOKIE_NAME
from app.services.spotify_service import SpotifyService, _pkce_store
from app.services.serper_service import SerperService
from app.services.playlist_pipeline import PlaylistPipeline

# In-memory SQLite database for fast unit & pipeline testing
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
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
            elif "offset=0" in url or ("limit=100" in url and "offset" not in url):
                mock_resp.json.return_value = {"items": page1_items, "next": "https://api.spotify.com/v1/playlists/test_pl/items?limit=100&offset=100"}
            else:
                mock_resp.json.return_value = {"items": page2_items, "next": None}
            return mock_resp

        with patch("httpx.AsyncClient.get", side_effect=mock_get):
            result = await SpotifyService.get_playlist_tracks("user-2", "test_pl", db_session)
            assert result["name"] == "My Mega 1400 Songs Playlist"
            assert result["total_tracks"] == 2 # Filtered out null and episode
            assert result["tracks"][0]["name"] == "Song 1"
            assert result["tracks"][0]["song_name"] == "Song 1"
            assert result["tracks"][0]["artist"] == "Artist A"
            assert result["tracks"][0]["artist_name"] == "Artist A"
            assert result["tracks"][1]["name"] == "Song 2"
            assert result["tracks"][1]["song_name"] == "Song 2"
            assert result["tracks"][1]["artists"] == ["Artist B", "Artist C"]
            assert result["tracks"][1]["search_query"] == "Song 2 Artist B Artist C audio"

    asyncio.run(_test())

# 5. Test Serper Search Query Construction & Candidate URL Filter
def test_serper_service_search_and_fallback():
    async def _test():
        query = SerperService.construct_search_query("Blinding Lights", ["The Weeknd"])
        assert query == 'site:youtube.com/watch "Blinding Lights" "The Weeknd"'

        # Test Serper API candidate matching
        mock_serper_response = {
            "organic": [
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

        # Test error when Serper is not configured (no ytsearch fallback)
        with patch("app.services.serper_service.SERPER_API_KEY", ""):
            with pytest.raises(ValueError) as exc_info:
                await SerperService.find_best_audio_url("Blinding Lights", ["The Weeknd"])
            assert "Serper API key is missing and will not be able to proceed further. Sorry, please provide me one." in str(exc_info.value)

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

# 7. Test Database Caching for Serper (Song Name & Artist Match)
def test_serper_database_caching(db_session):
    async def _test():
        mock_response = {
            "organic": [
                {"title": "Yellow - Coldplay", "link": "https://www.youtube.com/watch?v=yKNxeF4KMsY"}
            ]
        }
        with patch("app.services.serper_service.SERPER_API_KEY", "test_key"):
            with patch("httpx.AsyncClient.post") as mock_post:
                mock_resp = MagicMock()
                mock_resp.status_code = 200
                mock_resp.json.return_value = mock_response
                mock_post.return_value = mock_resp

                # 1st call: Cache miss -> calls Serper API and saves to DB
                url1 = await SerperService.find_best_audio_url("Yellow", ["Coldplay"], db=db_session)
                assert url1 == "https://www.youtube.com/watch?v=yKNxeF4KMsY"
                assert mock_post.call_count == 1

                # 2nd call: Exact match on both song & artist -> Cache hit, ZERO Serper API calls!
                mock_post.reset_mock()
                url2 = await SerperService.find_best_audio_url("Yellow", "Coldplay", db=db_session)
                assert url2 == "https://www.youtube.com/watch?v=yKNxeF4KMsY"
                assert mock_post.call_count == 0  # Bypassed Serper completely!

                # 3rd call: Changed artist -> Cache miss, queries Serper API
                mock_post.reset_mock()
                await SerperService.find_best_audio_url("Yellow", "Different Artist", db=db_session)
                assert mock_post.call_count == 1

    asyncio.run(_test())

# 8. Test Playlist ZIP Streaming Endpoint
def test_download_playlist_zip_endpoint(db_session, tmp_path):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.core.database import get_db

    # Create dummy zip file
    dummy_zip = tmp_path / "test.zip"
    dummy_zip.write_bytes(b"PK\x05\x06" + b"\x00" * 18)

    job = PlaylistDownloadJob(
        id="test-zip-job-123",
        user_id="user-123",
        playlist_id="pl-123",
        playlist_name="Test Playlist",
        status="COMPLETED",
        zip_path=str(dummy_zip),
        zip_filename="Thanks_for_downloading.zip"
    )
    db_session.add(job)
    db_session.commit()

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    try:
        client = TestClient(app)
        resp = client.get("/spotify/jobs/test-zip-job-123/zip")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/zip"
        assert 'filename="Thanks_for_downloading.zip"' in resp.headers["content-disposition"]
        assert len(resp.content) == len(dummy_zip.read_bytes())
    finally:
        app.dependency_overrides.pop(get_db, None)

# 9. Test Spotify Account Relogin & Duplicate spotify_user_id Handling
def test_spotify_account_relogin_duplicate_handling(db_session):
    async def _test():
        # User 1 previously connected with Spotify account "spotify_uid_123"
        user1 = User(id="user-1")
        db_session.add(user1)
        db_session.commit()

        acc1 = SpotifyAccount(
            user_id="user-1",
            spotify_user_id="spotify_uid_123",
            display_name="KS",
            access_token=encrypt_token("tok1"),
            refresh_token=encrypt_token("ref1"),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
            scope="playlist-read-private"
        )
        db_session.add(acc1)
        db_session.commit()

        # Now User 2 (new browser session) connects with the SAME Spotify account "spotify_uid_123"
        # Mock token and profile responses
        mock_token_resp = MagicMock(status_code=200)
        mock_token_resp.json.return_value = {
            "access_token": "new_access_token_456",
            "refresh_token": "new_refresh_token_456",
            "expires_in": 3600,
            "scope": "playlist-read-private"
        }

        mock_profile_resp = MagicMock(status_code=200)
        mock_profile_resp.json.return_value = {
            "id": "spotify_uid_123",
            "display_name": "KS Updated",
            "email": "ks@example.com"
        }

        with patch("app.services.spotify_service.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_token_resp
            mock_client.get.return_value = mock_profile_resp
            mock_client_cls.return_value.__aenter__.return_value = mock_client

            with patch("app.services.spotify_service._decode_oauth_state", return_value=("user-2", "valid_verifier")):
                account, resolved_user_id = await SpotifyService.exchange_code_for_tokens(
                    user_id="user-2",
                    code="valid_code",
                    state="encrypted_state",
                    db=db_session
                )

                assert account.spotify_user_id == "spotify_uid_123"
                assert account.user_id == "user-2"
                assert account.display_name == "KS Updated"
                assert decrypt_token(account.access_token) == "new_access_token_456"

    asyncio.run(_test())

# 10. Test Missing SERPER_API_KEY blocks download with exact user message
def test_missing_serper_key_blocks_download(db_session):
    from fastapi.testclient import TestClient
    from app.main import app
    from app.core.database import get_db

    user = User(id="user-no-serper")
    db_session.add(user)
    db_session.commit()

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    try:
        client = TestClient(app)
        token = sign_session_id(user.id)
        client.cookies.set(SESSION_COOKIE_NAME, token)

        with patch("app.routes.spotify.SERPER_API_KEY", ""):
            resp = client.post("/spotify/playlists/pl_123/download", json={"format": "mp3-320"})
            assert resp.status_code == 400
            data = resp.json()
            assert "Serper API key is missing and will not be able to proceed further. Sorry, please provide me one." in data["detail"]
    finally:
        app.dependency_overrides.pop(get_db, None)
