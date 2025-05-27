"""This module contains the settings for the application."""

from functools import lru_cache
import os

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """The settings for the application."""

    # Security
    SECRET_KEY: str
    HASHING_ALGORITHM: str

    # DB Settings
    POSTGRES_DATABASE_URL: str

    class Config:
        """The configuration for the settings."""

        env_file = ".env"

@lru_cache
def get_settings():
    """This function returns the settings obj for the application."""
    s = Settings()
    # If you really want to log it, do it here:
    print("🔑 Loaded POSTGRES_DATABASE_URL:", s.POSTGRES_DATABASE_URL)
    return Settings()
