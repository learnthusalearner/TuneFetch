import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    last_seen_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    spotify_account = relationship("SpotifyAccount", back_populates="user", uselist=False, cascade="all, delete-orphan")
    download_jobs = relationship("PlaylistDownloadJob", back_populates="user", cascade="all, delete-orphan")

class SpotifyAccount(Base):
    __tablename__ = "spotify_accounts"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    spotify_user_id = Column(String(128), unique=True, nullable=False, index=True)
    display_name = Column(String(256), nullable=True)
    email = Column(String(256), nullable=True)
    access_token = Column(Text, nullable=False)   # Encrypted at rest
    refresh_token = Column(Text, nullable=False)  # Encrypted at rest
    expires_at = Column(DateTime(timezone=True), nullable=False)
    scope = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="spotify_account")

class PlaylistDownloadJob(Base):
    __tablename__ = "playlist_download_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    playlist_id = Column(String(128), nullable=False, index=True)
    playlist_name = Column(String(256), nullable=False)
    total_tracks = Column(Integer, default=0)
    processed_tracks = Column(Integer, default=0)
    successful_tracks = Column(Integer, default=0)
    failed_tracks = Column(Integer, default=0)
    status = Column(String(32), default="QUEUED", index=True) # QUEUED, PROCESSING, COMPLETED, FAILED
    tracks_data = Column(Text, nullable=True) # JSON serialized list of tracks with per-track status
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="download_jobs")
