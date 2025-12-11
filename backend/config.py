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
        extra="allow"  # Allows extra fields in .env without error
    )

    # --- App Info ---
    APP_NAME: str = "Volunteerism App Backend"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # --- Server ---
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    # Comma-separated list of allowed origins for CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173"]

    # --- Infrastructure ---
    DATABASE_URL: Optional[str] = None
    CLERK_ISSUER: Optional[str] = None

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """
        Parses a comma-separated string into a list of origins.
        Example: "http://a.com,http://b.com" -> ["http://a.com", "http://b.com"]
        """
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
settings = Settings()