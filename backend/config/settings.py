from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).parent.parent / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Supabase Configuration (optional - falls back to SQLite)
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_host: str = "localhost"
    supabase_port: int = 5432
    supabase_database: str = "postgres"
    supabase_user: str = "postgres"
    supabase_password: str = ""
    
    # Google Maps API (optional for some features)
    google_maps_api_key: str = ""
    
    # OpenCellID API (optional for some features)
    opencellid_api_key: str = ""
    
    # App Settings
    app_env: str = "development"
    debug: bool = True
    log_level: str = "INFO"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
