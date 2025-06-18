"""This module contains the settings for the application."""

from dotenv import load_dotenv
load_dotenv(".env")  # force load before Settings()

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    """The settings for the application."""

    # Security
    SECRET_KEY: str
    HASHING_ALGORITHM: str

    # DB Settings
    POSTGRES_DATABASE_URL: str

    # Kafka Settings
    KAFKA_BROKER: str = "kafka.railway.internal:29092"
    KAFKA_TOPIC: str = "sensor.readings"
    KAFKA_CLIENT_ID: str = "fastapi-kafka"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="forbid"
    )


@lru_cache
def get_settings():
    """Returns a cached Settings instance."""
    s = Settings()
    print("🔑 Loaded POSTGRES_DATABASE_URL:", s.POSTGRES_DATABASE_URL)
    print("📡 Kafka Broker:", s.KAFKA_BROKER)

    return s
