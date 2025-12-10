from sqlmodel import create_engine, Session
from config import settings

# 1. Get the Database URL
connection_string = settings.DATABASE_URL
if connection_string and connection_string.startswith("postgres://"):
    connection_string = connection_string.replace("postgres://", "postgresql://", 1)

# 2. Create Engine with fixes for Cloud Hosting (Pooler support + Keepalive)
engine = create_engine(
    connection_string,
    pool_pre_ping=True,  # Checks connection health before using it
    connect_args={
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }
)

def get_session():
    with Session(engine) as session:
        yield session
