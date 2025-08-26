from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    # Database
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "SafeFace_db"
    
    # JWT
    secret_key: str = "i&s@8he7jgmm3f1lb)^2-35vf11r4=sd*4j-3%jhxnkdosuhkl"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours
    
    # SMTP Email Settings
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = True
    
    # CORS Origins
    cors_origins: str = "http://localhost:3000,http://localhost:3001"
    
    # Face Recognition
    face_similarity_threshold: float = 0.6
    face_detection_threshold: float = 0.5
    
    # File Upload
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_image_extensions: List[str] = [".jpg", ".jpeg", ".png", ".webp"]
    
    # Performance
    max_detection_threads: int = 4
    stream_frame_rate: int = 30
    detection_interval: int = 5  # Process every Nth frame
    
    # Notifications
    alert_cooldown_minutes: int = 5
    max_alerts_per_hour: int = 20
    
    # Development settings
    development_mode: bool = False
    bypass_email_cooldown: bool = False
    
    # Data Retention
    detection_logs_retention_days: int = 30
    auto_cleanup_enabled: bool = True
    
    # Security
    max_login_attempts: int = 5
    login_lockout_minutes: int = 15
    
    class Config:
        env_file = ".env"
    
    def get_cors_origins_list(self) -> List[str]:
        """Convert CORS origins string to list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

def get_settings() -> Settings:
    return Settings()