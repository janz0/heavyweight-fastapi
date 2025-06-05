"""This module contains the database configuration for the application."""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from fastapi import Depends

from app.config.settings import get_settings

settings = get_settings()

engine = create_engine(
    url=settings.POSTGRES_DATABASE_URL,
    pool_pre_ping=True,
    pool_size=100,  # The size of the connection pool
    max_overflow=50,  # The maximum number of connections that can be opened beyond the pool size. Set to -1 for no limit.
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=Session,)

DBBase = declarative_base()
