from sqlalchemy.pool import NullPool
from sqlmodel import Session, create_engine

from config import settings

if not settings.DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in environment")

# Engine Creation
# Optimized for Render/Supabase Transaction Pooler (PgBouncer)
# Uses NullPool to disable client-side pooling
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=NullPool,   # Disable client-side pooling
    pool_pre_ping=True,   # Still useful to check connection health before use
    echo=settings.DEBUG,
    connect_args={
        "keepalives": 1,
        "connect_timeout": 10,
    }
)

def get_session():
    """Dependency to provide a database session for a request."""
    with Session(engine) as session:
        yield session
