from typing import List, Union, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    """
    Application Configuration.
    Reads variables from system environment or a .env file.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow"
    )

    # --- App Info ---
    APP_NAME: str = "Volunteerism App Backend"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # --- Server ---
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # --- CORS (Allow Frontend Access) ---
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173"]

    # --- Infrastructure ---
    DATABASE_URL: Optional[str] = None
    CLERK_ISSUER: Optional[str] = None

    @field_validator("CORS_ORIGINS",qh mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @field_validator("CLERK_ISSUER", mode="before")
    @classmethod
    def clean_issuer_url(cls, v: Optional[str]) -> Optional[str]:
        """Automatically remove trailing slashes to prevent JWKS errors"""
        if v and isinstance(v, str):
            return v.rstrip("/")
        return v

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_postgres_protocol(cls, v: Optional[str]) -> Optional[str]:
        """Fixes Supabase 'postgres://' schema for SQLAlchemy"""
        if v and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v
    
settings = Settings()
