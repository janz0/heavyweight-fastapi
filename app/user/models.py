import uuid
from sqlalchemy import Column, Text, Integer, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.config.database import DBBase

class User(DBBase):
    __tablename__ = "users"

    id = Column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email = Column(Text, unique=True, nullable=False)
    first_name = Column(Text, nullable=True)
    last_name = Column(Text, nullable=True)
    phone = Column(Text, nullable=True)
    password_hash = Column(Text, nullable=False)
    active = Column(Integer, nullable=False, default=1)
    created_at = Column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    last_updated = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
