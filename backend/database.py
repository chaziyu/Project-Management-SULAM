from sqlmodel import create_engine, Session
from config import settings

connection_string = settings.DATABASE_URL

if not connection_string:
    raise ValueError("DATABASE_URL is not set in .env file")

# SQLAlchemy requires 'postgresql://', but Supabase sometimes gives 'postgres://'
if connection_string.startswith("postgres://"):
    connection_string = connection_string.replace("postgres://", "postgresql://", 1)

# Enable connection keepalives to prevent timeouts on the cloud
engine = create_engine(
    connection_string,
    pool_pre_ping=True, 
    echo=settings.DEBUG,
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