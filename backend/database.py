from sqlmodel import create_engine, Session
from config import settings

# Validate presence of DB URL
if not settings.DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env file")

# 1. Fix Protocol: SQLAlchemy needs 'postgresql://', but some providers (Supabase) give 'postgres://'
connection_string = settings.DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 2. Engine Creation: Includes settings to keep connections alive (essential for cloud deployments)
engine = create_engine(
    connection_string,
    pool_pre_ping=True,  # Checks connection health before use
    echo=settings.DEBUG, # Logs SQL queries if DEBUG is True
    connect_args={
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
)

def get_session():
    """Dependency to provide a database session for a request."""
    with Session(engine) as session:
        yield session