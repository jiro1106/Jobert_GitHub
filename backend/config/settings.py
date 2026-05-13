from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Firebase
    firebase_project_id: str = "your_project_id"
    firebase_api_key: str = "your_api_key"
    firebase_auth_domain: str = "your_auth_domain"
    firebase_storage_bucket: str = "your_storage_bucket"
    firebase_service_account_json: str = "./firebase-key.json"
    
    # Google Maps
    google_maps_api_key: str = "your_google_maps_key"
    
    # OpenWeather
    openweather_api_key: str = "your_openweather_key"
    
    # OpenCellID
    opencellid_api_key: str = "your_opencellid_key"
    
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
