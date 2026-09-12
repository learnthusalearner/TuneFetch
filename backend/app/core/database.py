import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import DATABASE_URL

logger = logging.getLogger("database")

# Create SQLAlchemy engine with connection pool recycling for serverless PostgreSQL
# or lightweight configuration for local SQLite dev / test fallback
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20
    )


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI dependency that yields a scoped database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initializes all database tables in Neon PostgreSQL or local SQLite."""
    try:
        import app.models.db_models  # noqa
        Base.metadata.create_all(bind=engine)
        
        # Safely ensure newly added columns exist if table was already created
        from sqlalchemy import text
        for col_stmt in [
            "ALTER TABLE playlist_download_jobs ADD COLUMN zip_path VARCHAR(512);",
            "ALTER TABLE playlist_download_jobs ADD COLUMN zip_filename VARCHAR(256);",
            "ALTER TABLE users ADD COLUMN cookies_encrypted TEXT;",
            "ALTER TABLE resolved_songs ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE resolved_songs ADD COLUMN flag_reason TEXT;",
            "ALTER TABLE resolved_songs ADD COLUMN developer_fixed BOOLEAN DEFAULT FALSE;"
        ]:
            try:
                with engine.connect() as conn:
                    conn.execute(text(col_stmt))
                    conn.commit()
            except Exception:
                pass

        logger.info("Database schema synchronized successfully.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}", exc_info=True)
