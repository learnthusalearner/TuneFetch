import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.health import router as health_router
from app.routes.media import router as media_router
from app.core.config import APP_TITLE, APP_DESCRIPTION, APP_VERSION, CORS_ORIGINS

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

def create_app() -> FastAPI:
    """
    Application factory for TuneFetch FastAPI backend.
    """
    app = FastAPI(
        title=APP_TITLE,
        description=APP_DESCRIPTION,
        version=APP_VERSION
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Content-Disposition"]
    )

    # Register modular route controllers
    app.include_router(health_router)
    app.include_router(media_router)

    @app.get("/", tags=["Root"])
    def root():
        return {
            "app": APP_TITLE,
            "version": APP_VERSION,
            "status": "online",
            "docs_url": "/docs"
        }

    return app

app = create_app()
