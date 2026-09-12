import sys
import os

# Add backend to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.services.cloud_session_store import CloudSessionStore

# Create a test session for a real track
code = CloudSessionStore.create_session(
    playlist_name="Real Test Playlist",
    tracks=[
        {
            "song_name": "Blinding Lights",
            "artist_name": "The Weeknd",
            "title": "Blinding Lights",
            "artist": "The Weeknd"
        }
    ]
)

print(f"[+] Created test session code: {code}")

# Run CLI mode with this code
from launcher import run_cli_mode
run_cli_mode(code)
