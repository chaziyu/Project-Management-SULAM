from sqlmodel import SQLModel
from database import engine
# Import all models to ensure SQLModel detects them
from models import Event, Registration, Feedback, Bookmark

def wipe_database():
    """
    DANGER: Drops all tables and recreates them.
    Used for resetting the dev environment.
    """
    print("🗑️  Wiping database...")
    try:
        # 1. Drop all tables
        SQLModel.metadata.drop_all(engine)
        print("✅ Tables dropped successfully.")
        
        # 2. Recreate them fresh
        SQLModel.metadata.create_all(engine)
        print("✅ Tables recreated successfully.")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    wipe_database()