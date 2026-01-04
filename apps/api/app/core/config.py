from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "CodingCrazy API"
    DEBUG: bool = True

    # Database (defaults to SQLite for easy local dev, use PostgreSQL in production)
    DATABASE_URL: str = "sqlite:///./codingcrazy.db"

    # Auth
    SECRET_KEY: str = "dev-secret-key-change-in-production-must-be-at-least-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Cookie settings
    COOKIE_NAME: str = "codingcrazy_session"
    COOKIE_SECURE: bool = False  # Set True in production
    COOKIE_HTTPONLY: bool = True
    COOKIE_SAMESITE: str = "lax"
    COOKIE_MAX_AGE: int = 60 * 60 * 24 * 7  # 7 days in seconds

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]

    class Config:
        env_file = ".env"
        case_sensitive = True


def get_settings() -> Settings:
    return Settings()


settings = Settings()
