from sqlmodel import Session, create_engine

from config import settings

if not settings.DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in environment")

# Engine Creation
# Optimized for Render/Supabase Free Tier (Low connection limits)
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True, 
    echo=settings.DEBUG,
    pool_size=5,          # Low baseline to respect free tier limits (usually 60 max total)
    max_overflow=10,      # Allow burst but don't hold them
    pool_timeout=10,      # Fail fast (10s) instead of hanging. Helps frontend recover.
    pool_recycle=300,     # Recycle every 5 mins. Supabase/PgBouncer kills idle connections fast.
    connect_args={
        "keepalives": 1,
    }
)

def get_session():
    """Dependency to provide a database session for a request."""
    with Session(engine) as session:
        yield session
