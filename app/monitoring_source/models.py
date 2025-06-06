from sqlalchemy import Column, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.config.database import DBBase
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

class Source(DBBase):
    __tablename__ = "mon_sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mon_loc_id = Column(UUID(as_uuid=True), ForeignKey("mon_loc.id", ondelete="CASCADE"))
    source_name = Column(Text, nullable=True)
    folder_path = Column(Text, nullable=False)
    file_keyword = Column(Text, nullable=False)
    file_type = Column(Text, nullable=False)
    source_type = Column(Text, nullable=True)
    config = Column(Text, nullable=True)
    last_data_upload = Column(Text, nullable=True)
    active = Column(Integer, default=1)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    mon_loc = relationship(
        "Location",
        back_populates="sources",
    )