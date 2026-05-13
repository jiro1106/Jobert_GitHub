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
    
    # Authentication
    jwt_secret_key: str = ""  # Uses supabase_key if not provided
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    jwt_refresh_expiration_days: int = 7
    
    # Session Management
    session_timeout_minutes: int = 30
    inactivity_timeout_minutes: int = 60
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    cors_allow_headers: list[str] = ["*"]
    
    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_reports_per_hour: int = 10
    rate_limit_questions_per_hour: int = 30
    rate_limit_public_per_hour: int = 100
    
    # App Settings
    app_env: str = "development"
    debug: bool = True
    log_level: str = "INFO"
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
