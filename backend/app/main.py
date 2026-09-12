import os
import sys
import logging
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.routes.health import router as health_router
from app.routes.media import router as media_router
from app.routes.spotify import router as spotify_router
from app.routes.cloud_session import router as cloud_session_router
from app.core.config import APP_TITLE, APP_DESCRIPTION, APP_VERSION, CORS_ORIGINS, BASE_DIR
from app.core.database import init_db
from app.core.rate_limiter import RateLimitMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

def _find_frontend_dist() -> Optional[str]:
    """
    Locates the compiled React frontend static files across:
    1. PyInstaller bundled temporary directory (sys._MEIPASS)
    2. Local backend/frontend_dist
    3. Sibling frontend/dist
    """
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        for sub in ["frontend_dist", "dist"]:
            p = os.path.join(sys._MEIPASS, sub)
            if os.path.isdir(p) and os.path.isfile(os.path.join(p, "index.html")):
                return p

    candidates = [
        os.path.join(BASE_DIR, "frontend_dist"),
        os.path.join(BASE_DIR.parent, "frontend", "dist"),
        os.path.join(os.getcwd(), "frontend_dist"),
        os.path.join(os.getcwd(), "frontend", "dist"),
    ]
    for c in candidates:
        if os.path.isdir(c) and os.path.isfile(os.path.join(c, "index.html")):
            return c
    return None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Neon PostgreSQL or local SQLite tables
    try:
        init_db()
    except Exception as e:
        logging.getLogger("main").warning(f"Database init warning: {e}")
    yield

def create_app() -> FastAPI:
    """
    Application factory for TuneFetch FastAPI backend with Spotify OAuth,
    audio stream extraction, and embedded React frontend serving.
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
        expose_headers=["Content-Disposition", "X-User-Id", "x-user-id", "X-RateLimit-Limit", "X-RateLimit-Remaining", "Retry-After"]
    )

    # In-memory sliding window rate limiter
    app.add_middleware(RateLimitMiddleware)

    @app.middleware("http")
    async def add_private_network_headers(request: Request, call_next):
        response = await call_next(request)
        if request.headers.get("access-control-request-private-network"):
            response.headers["Access-Control-Allow-Private-Network"] = "true"
        return response

    # Register modular route controllers
    app.include_router(health_router)
    app.include_router(media_router)
    app.include_router(spotify_router)
    app.include_router(cloud_session_router)

    # Detect compiled frontend
    dist_dir = _find_frontend_dist()
    if dist_dir:
        assets_dir = os.path.join(dist_dir, "assets")
        if os.path.isdir(assets_dir):
            app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.api_route("/", methods=["GET", "HEAD"], tags=["Root"])
    def root(request: Request):
        accept = request.headers.get("accept", "")
        # Real user web browser requesting HTML gets the SPA UI directly
        if "text/html" in accept and dist_dir:
            index_path = os.path.join(dist_dir, "index.html")
            if os.path.isfile(index_path):
                return FileResponse(index_path)

        # Automated probes / API health checks receive JSON response
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

    # Catch-all route for Single Page Application (SPA) client-side routing (/dashboard, etc.)
    if dist_dir:
        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa(full_path: str):
            # Never intercept API or Spotify routes
            for prefix in ["api", "spotify", "health", "docs", "openapi.json"]:
                if full_path == prefix or full_path.startswith(f"{prefix}/"):
                    raise HTTPException(status_code=404, detail="Not Found")

            target_file = os.path.join(dist_dir, full_path)
            if full_path and os.path.isfile(target_file):
                return FileResponse(target_file)

            index_path = os.path.join(dist_dir, "index.html")
            if os.path.isfile(index_path):
                return FileResponse(index_path)

            raise HTTPException(status_code=404, detail="Not Found")

    return app

app = create_app()
