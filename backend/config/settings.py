from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Supabase Configuration
    supabase_url: str
    supabase_key: str
    supabase_host: str
    supabase_port: int = 5432
    supabase_database: str
    supabase_user: str
    supabase_password: str
    
    # Google Maps API
    google_maps_api_key: str
    
    # OpenCellID API
    opencellid_api_key: str
    
    # App Settings
    app_env: str = "development"
    debug: bool = True
    log_level: str = "INFO"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    class Config:
        env_file = str(Path(__file__).resolve().parents[1] / ".env")
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
