from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # MongoDB
    mongodb_uri: str
    mongodb_db_name: str = "yt_comment_analyser"
    
    # YouTube
    youtube_api_key: str
    
    # Gemini
    gemini_api_key: str
    
    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    
    # JWT
    jwt_secret: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    
    # Dodo Payments
    dodo_api_key: str = ""
    dodo_webhook_secret: str = ""
    dodo_product_id: str = "pdt_0NUo5b"  # CreatorPulse Pro
    
    # Server
    port: int = 8000
    frontend_url: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()

