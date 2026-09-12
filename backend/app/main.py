import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.health import router as health_router
from app.routes.media import router as media_router
from app.routes.spotify import router as spotify_router
from app.core.config import APP_TITLE, APP_DESCRIPTION, APP_VERSION, CORS_ORIGINS
from app.core.database import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Neon PostgreSQL tables
    init_db()
    yield

def create_app() -> FastAPI:
    """
    Application factory for TuneFetch FastAPI backend with Spotify OAuth & PostgreSQL.
    """
    app = FastAPI(
        title=APP_TITLE,
        description=APP_DESCRIPTION,
        version=APP_VERSION,
        lifespan=lifespan
    )

    # CORS configuration with credentials enabled for session cookies
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_origin_regex=r"^https:\/\/.*\.vercel\.app$|^https:\/\/.*\.onrender\.com$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition", "X-User-Id", "x-user-id"]
    )

    # Register modular route controllers
    app.include_router(health_router)
    app.include_router(media_router)
    app.include_router(spotify_router)

    @app.api_route("/", methods=["GET", "HEAD"], tags=["Root"])
    def root():
        return {
            "app": APP_TITLE,
            "version": APP_VERSION,
            "status": "online",
            "docs_url": "/docs"
        }

    @app.api_route("/health", methods=["GET", "HEAD"], tags=["Root"])
    def health():
        return {
            "status": "healthy",
            "version": APP_VERSION
        }

    return app

app = create_app()
