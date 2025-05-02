from sqlalchemy import Column, Text, Integer, DateTime, text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.config.database import DBBase

class LocationTask(DBBase):
    __tablename__ = "mon_loc_tasks"

    id = Column(PGUUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    loc_id = Column(PGUUID(as_uuid=True), ForeignKey("mon_loc.id", ondelete="CASCADE"), nullable=False)
    task_name = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(Text, nullable=False, default="pending")
    active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)