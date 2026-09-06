from app.routes.health import router as health_router
from app.routes.media import router as media_router
from app.routes.spotify import router as spotify_router

__all__ = ["health_router", "media_router", "spotify_router"]
