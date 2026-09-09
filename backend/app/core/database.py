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
    """Initializes all database tables in Neon PostgreSQL."""
    try:
        import app.models.db_models  # noqa
        Base.metadata.create_all(bind=engine)
        
        # Safely ensure newly added columns exist if table was already created
        from sqlalchemy import text
        with engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE playlist_download_jobs ADD COLUMN IF NOT EXISTS zip_path VARCHAR(512);"))
                conn.execute(text("ALTER TABLE playlist_download_jobs ADD COLUMN IF NOT EXISTS zip_filename VARCHAR(256);"))
                conn.commit()
            except Exception as mig_err:
                logger.debug(f"Column migration check note: {mig_err}")

        logger.info("Database schema synchronized with Neon PostgreSQL successfully.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}", exc_info=True)
